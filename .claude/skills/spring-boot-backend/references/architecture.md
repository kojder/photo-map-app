# Architecture Patterns - Spring Boot Backend

## Layered Architecture

### Architecture Overview

**Pattern:** Controller Layer → Service Layer → Repository Layer → Database

### Layer Responsibilities

#### 1. Controllers (`@RestController`)
- Handle HTTP requests/responses
- Input validation (`@Valid`)
- Delegate to service layer
- Return appropriate status codes
- **NO business logic**

#### 2. Services (`@Service`)
- Business logic
- Transaction management (`@Transactional`)
- Coordinate between repositories
- Enforce business rules
- Call external services (EXIF, thumbnails)

#### 3. Repositories (`JpaRepository`)
- Data access only
- Query execution
- **NO business logic**

#### 4. Entities (`@Entity`)
- JPA entities (data holders)
- Relationships (`@ManyToOne`, `@OneToMany`)
- **NO business logic**

#### 5. DTOs (Data Transfer Objects)
- API request/response structures
- Decouple API from internal entities
- Validation annotations

---

## Service Layer Patterns

### Service Orchestration Pattern

Service classes orchestrate multiple dependencies to implement complex business logic.

**Example: PhotoService orchestrates:**
```java
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final ExifService exifService;
    private final ThumbnailService thumbnailService;
    private final FileStorageService fileStorageService;

    public PhotoUploadResponse uploadPhoto(final MultipartFile file, final Long userId) {
        // Orchestrate multiple services:
        // 1. Validate file
        // 2. Save original file (FileStorageService)
        // 3. Extract EXIF (ExifService)
        // 4. Generate thumbnails (ThumbnailService)
        // 5. Save to database (PhotoRepository)
    }
}
```

**Key principles:**
- Service coordinates other services (orchestration)
- Each dependency has single responsibility
- Transaction boundary at service method level
- Service methods are atomic operations

### Transaction Management

Use `@Transactional` annotation on service methods:

```java
// Write operations - default transaction
@Transactional
public PhotoDto updatePhoto(final Long photoId, final PhotoUpdateRequest request) {
    // All database operations in single transaction
}

// Read operations - optimized read-only transaction
@Transactional(readOnly = true)
public List<PhotoDto> findPhotosByUserId(final Long userId) {
    // Read-only optimization
}
```

---

## Repository Layer Patterns

### Repository Responsibilities

Repositories handle ONLY data access:

```java
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    // Derived query methods (Spring Data auto-generates)
    List<Photo> findByUserIdOrderByTakenAtDesc(Long userId);

    // Custom JPQL queries
    @Query("SELECT p FROM Photo p WHERE p.user.id = :userId")
    List<Photo> findByUserCustom(@Param("userId") Long userId);
}
```

**Rules:**
- NO business logic in repositories
- NO validation in repositories
- ONLY data access operations

---

## SOLID Principles

### 1. Single Responsibility Principle (SRP)

**Each class should have ONE reason to change.**

```java
// ❌ BAD: PhotoService does too many things
@Service
public class PhotoService {
    public void uploadPhoto(final MultipartFile file, final Long userId) {
        validateFile(file);
        String path = saveToFileSystem(file);
        ExifData exif = extractExif(file);
        String thumbnail = generateThumbnail(path);
        saveToDatabase(path, thumbnail, exif);
    }
}

// ✅ GOOD: Separate services, PhotoService orchestrates
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final FileStorageService fileStorageService;
    private final ExifService exifService;
    private final ThumbnailService thumbnailService;
    private final PhotoRepository photoRepository;

    public PhotoUploadResponse uploadPhoto(final MultipartFile file, final Long userId) {
        final String originalPath = fileStorageService.saveFile(file, userId);
        final ExifData exifData = exifService.extractExif(file);
        final String thumbnailPath = thumbnailService.generateThumbnail(originalPath);

        final Photo photo = buildPhoto(file, userId, originalPath, thumbnailPath, exifData);
        return PhotoUploadResponse.fromEntity(photoRepository.save(photo));
    }
}
```

**Benefits:**
- Each service has single, clear purpose
- Easy to test (mock dependencies)
- Easy to maintain (change one thing at a time)
- Easy to reuse (FileStorageService can be used elsewhere)

### 2. Open/Closed Principle (OCP)

**Software entities should be open for extension, closed for modification.**

```java
// ❌ BAD: Modifying class for each new storage type
public class FileStorageService {
    public String saveFile(final MultipartFile file, final String type) {
        if (type.equals("local")) {
            // save to local filesystem
        } else if (type.equals("s3")) {
            // save to S3
        } else if (type.equals("ftp")) {
            // save to FTP
        }
        // Adding new storage requires modifying this class!
    }
}

// ✅ GOOD: Open for extension via interface
public interface FileStorage {
    String saveFile(MultipartFile file, String directory);
    void deleteFile(String path);
}

@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorage implements FileStorage {
    @Override
    public String saveFile(final MultipartFile file, final String directory) {
        // local implementation
    }
}

@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3FileStorage implements FileStorage {
    @Override
    public String saveFile(final MultipartFile file, final String directory) {
        // S3 implementation
    }
}

// Service depends on abstraction
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final FileStorage fileStorage; // Abstraction - can be any implementation
}
```

**Benefits:**
- Add new storage types without modifying existing code
- Easy to swap implementations (local ↔ S3)
- Easy to test (mock FileStorage interface)

### 3. Liskov Substitution Principle (LSP)

**Objects of superclass should be replaceable with objects of subclass without breaking the application.**

```java
// ✅ GOOD: All FileStorage implementations can be substituted
FileStorage storage1 = new LocalFileStorage();
FileStorage storage2 = new S3FileStorage();

// Both work the same way from caller's perspective
String path1 = storage1.saveFile(file, "photos/");
String path2 = storage2.saveFile(file, "photos/");

// PhotoService doesn't care which implementation is injected
@Service
public class PhotoService {
    private final FileStorage fileStorage; // Can be Local, S3, or any future implementation
}
```

**Rules for LSP compliance:**
- Subclass must accept same inputs as superclass
- Subclass must return same output types as superclass
- Subclass must not throw new exceptions not in superclass contract
- Subclass must maintain same behavior guarantees as superclass

### 4. Interface Segregation Principle (ISP)

**Clients should not be forced to depend on interfaces they do not use.**

```java
// ❌ BAD: Fat interface forces unnecessary dependencies
public interface FileOperations {
    String saveFile(MultipartFile file, String directory);
    void deleteFile(String path);
    void moveFile(String source, String destination);
    void copyFile(String source, String destination);
    List<String> listFiles(String directory);
    long getFileSize(String path);
    byte[] readFile(String path);
}

// If PhotoService only needs save and delete, it's forced to depend on all methods!

// ✅ GOOD: Segregated interfaces
public interface FileStorage {
    String saveFile(MultipartFile file, String directory);
    void deleteFile(String path);
}

public interface FileReader {
    byte[] readFile(String path);
    long getFileSize(String path);
}

public interface FileManager {
    void moveFile(String source, String destination);
    void copyFile(String source, String destination);
    List<String> listFiles(String directory);
}

// PhotoService depends only on what it needs
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final FileStorage fileStorage; // Only save/delete methods
}

// AdminService can use FileManager for bulk operations
@Service
@RequiredArgsConstructor
public class AdminService {
    private final FileManager fileManager; // Only move/copy/list methods
}
```

**Benefits:**
- Smaller, focused interfaces
- Easier to implement (less methods to implement)
- Easier to test (mock only what's needed)
- Clear separation of concerns

### 5. Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions.**

```java
// ❌ BAD: Direct dependency on concrete implementation
@Service
public class PhotoService {
    private final LocalFileStorage storage = new LocalFileStorage("/uploads");
    // Hard-coded dependency - cannot swap implementations
}

// ✅ GOOD: Depend on abstraction
public interface FileStorage {
    String saveFile(MultipartFile file, String directory);
}

@Service
@RequiredArgsConstructor
public class PhotoService {
    private final FileStorage fileStorage; // Abstraction - easy to swap implementations
}

@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorage implements FileStorage {
    // Implementation details
}

@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3FileStorage implements FileStorage {
    // Different implementation
}
```

**Benefits:**
- Easy to swap implementations (configuration-driven)
- Easy to test (mock FileStorage)
- Loose coupling between components
- High-level modules (PhotoService) don't depend on low-level modules (LocalFileStorage)

---

## Design Patterns

### Constructor Injection (Best Practice)

**ALWAYS use constructor injection with final fields:**

```java
// ✅ ALWAYS use this pattern
@Service
@RequiredArgsConstructor // Lombok generates constructor
public class PhotoService {
    private final PhotoRepository photoRepository;
    private final ExifService exifService;
    // Immutable, required, testable, explicit dependencies
}

// ❌ AVOID field injection
@Service
public class PhotoService {
    @Autowired
    private PhotoRepository photoRepository; // Can be reassigned, hidden dependencies
}
```

**Benefits of Constructor Injection:**
- **Immutability** - dependencies are final
- **Testability** - easy to mock in tests
- **Explicit** - all dependencies visible in constructor
- **Compile-time safety** - circular dependencies fail at startup

### Static Factory Methods

**Use static factory methods for DTO conversions:**

```java
// ✅ DTOs with fromEntity() conversion
public record PhotoDto(Long id, String fileName, Double latitude, Double longitude) {

    // Single object conversion
    public static PhotoDto fromEntity(final Photo photo) {
        return new PhotoDto(
            photo.getId(),
            photo.getFileName(),
            photo.getLatitude(),
            photo.getLongitude()
        );
    }

    // Bulk conversion
    public static List<PhotoDto> fromEntities(final List<Photo> photos) {
        return photos.stream()
            .map(PhotoDto::fromEntity)
            .toList();
    }
}

// Usage in service
@Transactional(readOnly = true)
public List<PhotoDto> findPhotosByUserId(final Long userId) {
    return PhotoDto.fromEntities(photoRepository.findByUserId(userId));
}
```

**Benefits:**
- Clear conversion logic in one place
- Easy to maintain
- Type-safe
- Reusable across services

---

## Key Reminders

**Architecture:**
- ✅ Follow layered architecture strictly
- ✅ Controllers: HTTP only, NO business logic
- ✅ Services: Business logic + orchestration
- ✅ Repositories: Data access ONLY
- ✅ Use `@Transactional` on service methods

**SOLID:**
- ✅ SRP: One responsibility per class
- ✅ OCP: Open for extension, closed for modification
- ✅ LSP: Subclasses can replace superclass
- ✅ ISP: Small, focused interfaces
- ✅ DIP: Depend on abstractions

**Design Patterns:**
- ✅ Constructor injection (always)
- ✅ Static factory methods for DTOs
- ✅ Service orchestration for complex operations
