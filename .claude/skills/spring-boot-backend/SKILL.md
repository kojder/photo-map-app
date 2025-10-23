---
name: Spring Boot Backend Development
description: Implement and develop REST APIs, services, repositories, and JPA entities using Spring Boot 3, Java 17, PostgreSQL 15, and Spring Security with JWT. Use when creating, building, or implementing backend endpoints, database entities, business logic services, repositories, DTOs, authentication, or API error handling for Photo Map MVP. File types: .java, .xml, .properties, .yml, .sql
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Spring Boot Backend Development - Photo Map MVP

## Project Context

**Photo Map MVP** - Full-stack aplikacja do zarządzania zdjęciami z geolokalizacją.

**Backend Stack:**
- **Spring Boot:** 3.2.11+
- **Java:** 17 LTS
- **Database:** PostgreSQL 15
- **Security:** Spring Security 6 z JWT (stateless)
- **Build:** Maven
- **Deployment:** Mikrus VPS (limited resources - synchronous processing)

**Core Backend Features:**
1. **Authentication:** JWT-based login/registration, BCrypt password hashing
2. **Photo Management:** Upload z EXIF extraction, thumbnail generation, CRUD operations
3. **User Scoping:** Strict data isolation - users see only their own photos
4. **Admin API:** User management for ADMIN role

**Key Constraints:**
- MVP scope - simple solutions over complex ones
- Mikrus VPS - limited CPU/RAM (synchronous processing, no background jobs)
- User isolation - ALL queries must include userId filtering

---

## Architecture Principles

### Layered Architecture

**Controller Layer** → **Service Layer** → **Repository Layer** → **Database**

**Responsibilities:**

1. **Controllers (`@RestController`)**
   - Handle HTTP requests/responses
   - Input validation (`@Valid`)
   - Delegate to service layer
   - Return appropriate status codes
   - **NO business logic**

2. **Services (`@Service`)**
   - Business logic
   - Transaction management (`@Transactional`)
   - Coordinate between repositories
   - Enforce business rules
   - Call external services (EXIF, thumbnails)

3. **Repositories (`JpaRepository`)**
   - Data access only
   - Query execution
   - **NO business logic**

4. **Entities (`@Entity`)**
   - JPA entities (data holders)
   - Relationships (`@ManyToOne`, `@OneToMany`)
   - **NO business logic**

5. **DTOs (Data Transfer Objects)**
   - API request/response structures
   - Decouple API from internal entities
   - Validation annotations

### Key Patterns

**User Scoping (Security Critical):**
```java
// ❌ BAD: Allows any user to access any photo
public Photo getPhoto(Long photoId) {
    return photoRepository.findById(photoId).orElseThrow();
}

// ✅ GOOD: User can only access their own photos
public Photo getPhoto(Long photoId, Long userId) {
    return photoRepository.findByIdAndUserId(photoId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
}
```

**Transaction Management:**
- Use `@Transactional` on service methods
- Read-only operations: `@Transactional(readOnly = true)`
- Write operations: `@Transactional` (default propagation)

---

## Java Code Quality Best Practices

### Use `final` Keyword Wherever Possible

**Benefits:**
- **Immutability** - prevents accidental reassignment
- **Thread safety** - immutable objects are inherently thread-safe
- **Readability** - clear intent that value won't change
- **JVM optimization** - potential performance improvements

**Where to use `final`:**

1. **Method parameters** - prevents accidental modification
```java
// ✅ GOOD: Method parameters are final
public PhotoDto getPhoto(final Long photoId, final Long userId) {
    return photoRepository.findByIdAndUserId(photoId, userId)
        .map(PhotoDto::fromEntity)
        .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
}

// ❌ BAD: Parameters can be reassigned (confusing)
public PhotoDto getPhoto(Long photoId, Long userId) {
    userId = userId != null ? userId : 0L; // Modifying parameter - confusing!
    // ...
}
```

2. **Local variables** - when value won't change
```java
// ✅ GOOD: Variables that won't change are final
public String savePhoto(final MultipartFile file) {
    final String fileName = file.getOriginalFilename();
    final String uniqueName = generateUniqueName(fileName);
    final Path targetPath = storageLocation.resolve(uniqueName);

    Files.copy(file.getInputStream(), targetPath);
    return uniqueName;
}
```

3. **Class fields (injected dependencies)** - always final with constructor injection
```java
// ✅ GOOD: Injected dependencies are final
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final ExifService exifService;
    // ...
}

// ❌ BAD: Non-final dependencies (allows reassignment)
@Service
public class PhotoService {
    @Autowired
    private PhotoRepository photoRepository; // Can be reassigned!
}
```

4. **Configuration values** - immutable after injection
```java
// ✅ GOOD: Configuration values are final
@Component
public class StorageConfig {
    private final String uploadPath;
    private final long maxFileSize;

    public StorageConfig(
        @Value("${photo.upload.path}") final String uploadPath,
        @Value("${photo.upload.max-size}") final long maxFileSize
    ) {
        this.uploadPath = uploadPath;
        this.maxFileSize = maxFileSize;
    }
}
```

**When NOT to use `final`:**

- Loop variables that change (`for (int i = 0; i < n; i++)`)
- Builder pattern fields
- Mutable state in entities (JPA requires non-final fields)
- Variables that genuinely need reassignment

**Example: Complete Service Method with `final`**
```java
@Transactional(readOnly = true)
public List<PhotoDto> findPhotosWithFilters(
    final Long userId,
    final Integer minRating,
    final LocalDateTime fromDate
) {
    final List<Photo> photos = photoRepository.findByUserIdOrderByTakenAtDesc(userId);

    return photos.stream()
        .filter(photo -> matchesRating(photo, minRating))
        .filter(photo -> matchesDate(photo, fromDate))
        .map(PhotoDto::fromEntity)
        .toList();
}

private boolean matchesRating(final Photo photo, final Integer minRating) {
    if (minRating == null) {
        return true;
    }
    final Integer photoRating = photo.getRating();
    return photoRating != null && photoRating >= minRating;
}
```

---

## SOLID Principles

### Single Responsibility Principle (SRP)

**Each class should have ONE reason to change.**

```java
// ❌ BAD: PhotoService does too many things
@Service
public class PhotoService {
    public void uploadPhoto(MultipartFile file, Long userId) {
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

### Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions.**

```java
// ❌ BAD: Direct dependency on concrete implementation
@Service
public class PhotoService {
    private final LocalFileStorage storage = new LocalFileStorage("/uploads");
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
public class LocalFileStorage implements FileStorage { /* ... */ }

@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3FileStorage implements FileStorage { /* ... */ }
```

---

## Java 17 Modern Features

### Records for DTOs

```java
// ✅ Use Records for immutable DTOs (Java 16+)
public record PhotoDto(
    Long id,
    String fileName,
    Double latitude,
    Double longitude
) {
    public static PhotoDto fromEntity(final Photo photo) {
        return new PhotoDto(photo.getId(), photo.getFileName(),
            photo.getLatitude(), photo.getLongitude());
    }
}
```

**When to use:** DTOs, value objects, query results
**When NOT:** JPA Entities (need no-arg constructor, mutable fields)

### Text Blocks for SQL

```java
// ✅ Text Blocks for readable multi-line queries (Java 15+)
@Query("""
    SELECT p FROM Photo p
    WHERE p.user.id = :userId
      AND p.latitude IS NOT NULL
    ORDER BY p.takenAt DESC
    """)
List<Photo> findPhotosWithGps(@Param("userId") Long userId);
```

### Stream.toList()

```java
// ✅ Use .toList() instead of .collect(Collectors.toList()) (Java 16+)
public List<PhotoDto> findPhotos(final Long userId) {
    return photoRepository.findByUserId(userId)
        .stream()
        .map(PhotoDto::fromEntity)
        .toList(); // Concise, returns immutable list
}
```

---

## Design Patterns

### Constructor Injection (Best Practice)

```java
// ✅ ALWAYS use constructor injection with final fields
@Service
@RequiredArgsConstructor // Lombok generates constructor
public class PhotoService {
    private final PhotoRepository photoRepository;
    private final ExifService exifService;
    // Immutable, required, testable, explicit dependencies
}
```

### Static Factory Methods

```java
// ✅ DTOs with fromEntity() conversion
public record PhotoDto(Long id, String fileName) {
    public static PhotoDto fromEntity(final Photo photo) {
        return new PhotoDto(photo.getId(), photo.getFileName());
    }

    public static List<PhotoDto> fromEntities(final List<Photo> photos) {
        return photos.stream().map(PhotoDto::fromEntity).toList();
    }
}
```

---

## REST API Patterns

### Controller Structure

**Annotations:**
- `@RestController` - Combines `@Controller` + `@ResponseBody`
- `@RequestMapping("/api/photos")` - Base path
- `@RequiredArgsConstructor` - Lombok constructor injection
- `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping` - HTTP methods

**Parameter Annotations:**
- `@PathVariable` - URL path variable (e.g., `/photos/{id}`)
- `@RequestParam` - Query parameter (e.g., `?rating=5`)
- `@RequestBody @Valid` - JSON request body with validation
- `@AuthenticationPrincipal UserDetails` - Authenticated user

**Example Pattern:**
```java
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @GetMapping
    public ResponseEntity<List<PhotoDto>> getUserPhotos(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        List<PhotoDto> photos = photoService.findPhotosByUserId(userId);
        return ResponseEntity.ok(photos);
    }

    @PostMapping("/upload")
    public ResponseEntity<PhotoUploadResponse> uploadPhoto(
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        PhotoUploadResponse response = photoService.uploadPhoto(file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

### HTTP Status Codes

**Success:**
- `200 OK` - GET/PUT success
- `201 Created` - POST success (resource created)
- `204 No Content` - DELETE success, no response body

**Client Errors:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated (missing/invalid JWT)
- `403 Forbidden` - Not authorized (authenticated but insufficient permissions)
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict (e.g., duplicate email)

**Server Errors:**
- `500 Internal Server Error` - Unexpected server error

---

## Service Layer

### Service Pattern

**Responsibilities:**
- Implement business logic
- Coordinate multiple repository calls
- Call external services (EXIF extraction, thumbnail generation)
- Enforce business rules
- Transaction boundaries

**Example: PhotoService**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final ExifService exifService;
    private final ThumbnailService thumbnailService;

    public PhotoUploadResponse uploadPhoto(MultipartFile file, Long userId) {
        // Validate
        validatePhotoFile(file);

        // Get user
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Process photo
        String originalPath = saveOriginalFile(file, userId);
        ExifData exifData = exifService.extractExif(file);
        String thumbnailPath = thumbnailService.generateThumbnail(originalPath);

        // Save entity
        Photo photo = Photo.builder()
            .user(user)
            .fileName(file.getOriginalFilename())
            .originalPath(originalPath)
            .thumbnailPath(thumbnailPath)
            .latitude(exifData.getLatitude())
            .longitude(exifData.getLongitude())
            .takenAt(exifData.getTakenAt())
            .build();

        Photo saved = photoRepository.save(photo);
        return PhotoUploadResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<PhotoDto> findPhotosByUserId(Long userId) {
        List<Photo> photos = photoRepository.findByUserIdOrderByTakenAtDesc(userId);
        return photos.stream()
            .map(PhotoDto::fromEntity)
            .toList();
    }

    private void validatePhotoFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileUploadException("File is empty");
        }
        if (file.getSize() > 50 * 1024 * 1024) { // 50MB
            throw new FileUploadException("File size exceeds 50MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new FileUploadException("File is not an image");
        }
    }
}
```

### Service Annotations

- `@Service` - Mark as Spring service component
- `@RequiredArgsConstructor` - Lombok constructor injection
- `@Transactional` - Enable transaction management (write operations)
- `@Transactional(readOnly = true)` - Optimize read operations
- `@Value("${property}")` - Inject configuration property

---

## Data Access Layer

### Repository Pattern

**Spring Data JPA Repositories:**
- Extend `JpaRepository<Entity, ID>`
- Derived query methods (Spring auto-generates)
- Custom queries with `@Query`
- **Always include user scoping for photo queries**

**Example: PhotoRepository**
```java
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {

    // Derived query methods (auto-generated by Spring Data)
    List<Photo> findByUserIdOrderByTakenAtDesc(Long userId);

    Optional<Photo> findByIdAndUserId(Long id, Long userId);

    List<Photo> findByUserIdAndRating(Long userId, Integer rating);

    // Custom JPQL query
    @Query("SELECT p FROM Photo p WHERE p.user.id = :userId " +
           "AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL")
    List<Photo> findPhotosWithGps(@Param("userId") Long userId);

    // Native SQL (when JPQL insufficient)
    @Query(value = "SELECT * FROM photos WHERE user_id = :userId " +
                   "AND rating >= :minRating ORDER BY taken_at DESC",
           nativeQuery = true)
    List<Photo> findPhotosByUserAndMinRating(
        @Param("userId") Long userId,
        @Param("minRating") Integer minRating
    );

    // Count query
    long countByUserId(Long userId);

    // Exists check
    boolean existsByIdAndUserId(Long id, Long userId);
}
```

### JPA Entities

**Entity Pattern:**
```java
@Entity
@Table(name = "photos", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_taken_at", columnList = "taken_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private String originalPath;

    @Column(nullable = false)
    private String thumbnailPath;

    @Column(precision = 10, scale = 7)
    private Double latitude;

    @Column(precision = 10, scale = 7)
    private Double longitude;

    @Column
    private Integer rating; // 1-10

    @Column
    private LocalDateTime takenAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

**Entity Rules:**
- Use Lombok annotations (`@Getter`, `@Setter`, `@Builder`)
- Use `FetchType.LAZY` for relationships (performance)
- Add indexes on frequently queried columns
- Use `@PrePersist` for createdAt, `@PreUpdate` for updatedAt
- NO business logic in entities

---

## DTOs (Data Transfer Objects)

### DTO Pattern

**Purpose:**
- Decouple API from internal entities
- Control what data is exposed
- Validation on inputs
- Transform data for responses

**Example: PhotoDto (Response)**
```java
@Data
@Builder
public class PhotoDto {
    private Long id;
    private String fileName;
    private Long fileSize;
    private String thumbnailUrl;
    private Double latitude;
    private Double longitude;
    private Integer rating;
    private String takenAt; // ISO 8601 string

    public static PhotoDto fromEntity(Photo photo) {
        return PhotoDto.builder()
            .id(photo.getId())
            .fileName(photo.getFileName())
            .fileSize(photo.getSize())
            .thumbnailUrl("/api/photos/" + photo.getId() + "/thumbnail")
            .latitude(photo.getLatitude())
            .longitude(photo.getLongitude())
            .rating(photo.getRating())
            .takenAt(photo.getTakenAt() != null ? photo.getTakenAt().toString() : null)
            .build();
    }
}
```

**Example: Request DTO with Validation**
```java
@Data
public class UserRegistrationRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
```

**DTO Rules:**
- Use DTOs for ALL API requests/responses (never expose entities)
- Add validation annotations on request DTOs
- Use static factory methods (`fromEntity()`) for conversions
- Keep DTOs simple (no business logic)

---

## Security (Spring Security + JWT)

### Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for JWT
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Public
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // Admin only
                .anyRequest().authenticated() // All other require auth
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // No sessions
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### JWT Token Provider

```java
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

### Method-Level Security

```java
@Service
public class PhotoService {

    @PreAuthorize("hasRole('USER')")
    public PhotoDto getPhoto(Long photoId, Long userId) {
        // Only authenticated users with USER role
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAllPhotos() {
        // Only admins
    }

    @PreAuthorize("#userId == authentication.principal.id")
    public void updatePhoto(Long photoId, Long userId) {
        // User can only update their own photos
    }
}
```

---

## Exception Handling

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
        ResourceNotFoundException ex
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.NOT_FOUND.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<ErrorResponse> handleFileUpload(
        FileUploadException ex
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
        MethodArgumentNotValidException ex
    ) {
        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .toList();

        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message("Validation failed")
            .errors(errors)
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        // Log full stack trace
        log.error("Unexpected error", ex);

        // Return generic error (don't expose internals)
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .message("An unexpected error occurred")
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

---

## Testing (JUnit 5 + Mockito)

### Service Testing

```java
@ExtendWith(MockitoExtension.class)
class PhotoServiceTest {

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private ExifService exifService;

    @InjectMocks
    private PhotoService photoService;

    @Test
    void should_findPhotosByUserId_when_userExists() {
        // Given
        Long userId = 1L;
        List<Photo> mockPhotos = List.of(
            Photo.builder().id(1L).fileName("test.jpg").build()
        );
        when(photoRepository.findByUserIdOrderByTakenAtDesc(userId))
            .thenReturn(mockPhotos);

        // When
        List<PhotoDto> result = photoService.findPhotosByUserId(userId);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFileName()).isEqualTo("test.jpg");
        verify(photoRepository).findByUserIdOrderByTakenAtDesc(userId);
    }

    @Test
    void should_throwException_when_photoNotFound() {
        // Given
        Long photoId = 1L;
        Long userId = 1L;
        when(photoRepository.findByIdAndUserId(photoId, userId))
            .thenReturn(Optional.empty());

        // When / Then
        assertThrows(
            ResourceNotFoundException.class,
            () -> photoService.findPhotoById(photoId, userId)
        );
    }
}
```

### Controller Testing (MockMvc)

```java
@WebMvcTest(PhotoController.class)
class PhotoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PhotoService photoService;

    @Test
    void should_returnPhotos_when_authenticated() throws Exception {
        // Given
        List<PhotoDto> mockPhotos = List.of(
            PhotoDto.builder().id(1L).fileName("test.jpg").build()
        );
        when(photoService.findPhotosByUserId(anyLong())).thenReturn(mockPhotos);

        // When / Then
        mockMvc.perform(get("/api/photos")
                .with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].fileName").value("test.jpg"));
    }
}
```

---

## Database Migrations (Flyway)

### Migration Pattern

**Flyway manages database schema changes with versioned SQL files.**

**Directory structure:**
```
src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_photos_table.sql
├── V3__add_rating_column.sql
└── V4__add_indexes.sql
```

**Naming convention:** `V{version}__{description}.sql`

**Example: V1__create_users_table.sql**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Example: V2__create_photos_table.sql**
```sql
CREATE TABLE photos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    original_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    taken_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_taken_at ON photos(taken_at);
CREATE INDEX idx_photos_rating ON photos(rating);
```

**Configuration (application.properties):**
```properties
# Flyway configuration
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
```

**Best Practices:**
- ✅ **Never modify existing migrations** - create new migration instead
- ✅ **Use sequential versioning** (V1, V2, V3...)
- ✅ **Test migrations on local database** before committing
- ✅ **Keep migrations simple** - one logical change per file
- ✅ **Add indexes in separate migrations** (easier to rollback)
- ❌ **Never use DROP TABLE** in production migrations (data loss risk)

**Rollback Pattern:**
```sql
-- V5__add_description_column.sql
ALTER TABLE photos ADD COLUMN description TEXT;

-- If rollback needed, create new migration:
-- V6__remove_description_column.sql
ALTER TABLE photos DROP COLUMN description;
```

---

## API Documentation (Springdoc OpenAPI)

### Swagger UI Configuration

**Add dependency (pom.xml):**
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

**Configuration (application.properties):**
```properties
# Springdoc OpenAPI
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.enabled=true
```

**Document endpoints with annotations:**
```java
@RestController
@RequestMapping("/api/photos")
@Tag(name = "Photos", description = "Photo management API")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @Operation(
        summary = "Get user photos",
        description = "Returns all photos for authenticated user, sorted by date taken"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Photos retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @GetMapping
    public ResponseEntity<List<PhotoDto>> getUserPhotos(
        @Parameter(hidden = true) @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        final List<PhotoDto> photos = photoService.findPhotosByUserId(userId);
        return ResponseEntity.ok(photos);
    }

    @Operation(summary = "Upload photo")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Photo uploaded successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid file or file too large"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoUploadResponse> uploadPhoto(
        @Parameter(description = "Photo file (JPEG or PNG, max 50MB)")
        @RequestParam("file") final MultipartFile file,
        @Parameter(hidden = true) @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        final PhotoUploadResponse response = photoService.uploadPhoto(file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

**Access Swagger UI:**
- Development: http://localhost:8080/swagger-ui.html
- Production: https://yourdomain.com/swagger-ui.html

**Benefits:**
- Automatic API documentation from code
- Interactive testing (try endpoints directly in browser)
- Request/response examples
- Authentication support (add JWT token in Swagger UI)

---

## Health Checks (Spring Boot Actuator)

### Configuration

**Add dependency (pom.xml):**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**Configuration (application.properties):**
```properties
# Actuator configuration
management.endpoints.web.base-path=/actuator
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized

# Info endpoint
info.app.name=Photo Map MVP
info.app.version=@project.version@
info.app.description=Photo management with geolocation
```

**Security configuration for actuator:**
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(final HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll() // Public health check
                .requestMatchers("/actuator/**").hasRole("ADMIN") // Admin-only endpoints
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

**Available endpoints:**

| Endpoint | Description | Access |
|----------|-------------|--------|
| `/actuator/health` | Application health status | Public |
| `/actuator/info` | Application info (name, version) | Admin |
| `/actuator/metrics` | Application metrics (memory, CPU) | Admin |

**Health check response:**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 536870912000,
        "free": 321234567890,
        "threshold": 10485760
      }
    }
  }
}
```

**Use cases:**
- ✅ Monitoring: Check if app is running (for Nginx, systemd)
- ✅ Debugging: Check database connectivity
- ✅ Deployment: Health check before marking service as ready

---

## Validation (Bean Validation)

### Request DTO Validation

**Use Bean Validation annotations on DTOs.**

**Example: UserRegistrationRequest**
```java
public record UserRegistrationRequest(
    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    String email,

    @NotBlank(message = "{validation.password.required}")
    @Size(min = 8, max = 100, message = "{validation.password.size}")
    String password
) {}
```

**Validation messages (src/main/resources/ValidationMessages.properties):**
```properties
# English (default)
validation.email.required=Email is required
validation.email.invalid=Email must be valid
validation.password.required=Password is required
validation.password.size=Password must be between 8 and 100 characters
validation.rating.range=Rating must be between 1 and 10
```

**Optional: Polish translations (ValidationMessages_pl.properties):**
```properties
validation.email.required=Email jest wymagany
validation.email.invalid=Email musi być prawidłowy
validation.password.required=Hasło jest wymagane
validation.password.size=Hasło musi mieć od 8 do 100 znaków
validation.rating.range=Ocena musi być od 1 do 10
```

**Controller usage:**
```java
@PostMapping("/register")
public ResponseEntity<AuthResponse> register(
    @Valid @RequestBody final UserRegistrationRequest request
) {
    // @Valid triggers validation, throws MethodArgumentNotValidException if invalid
    final AuthResponse response = authService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

**Global exception handler for validation errors:**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
        final MethodArgumentNotValidException ex
    ) {
        final List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .toList();

        final ErrorResponse response = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message("Validation failed")
            .errors(errors)
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.badRequest().body(response);
    }
}
```

**Common validation annotations:**

| Annotation | Purpose | Example |
|------------|---------|---------|
| `@NotNull` | Field cannot be null | `@NotNull Long userId` |
| `@NotBlank` | String not null/empty/whitespace | `@NotBlank String email` |
| `@Email` | Valid email format | `@Email String email` |
| `@Size` | String/collection size | `@Size(min=8, max=100)` |
| `@Min` / `@Max` | Numeric range | `@Min(1) @Max(10) Integer rating` |
| `@Pattern` | Regex pattern | `@Pattern(regexp="[A-Z]+")` |
| `@Valid` | Nested object validation | `@Valid AddressDto address` |

---

## Examples

Complete working examples are in the `examples/` directory:

1. **photo-controller.java** - PhotoController with upload, CRUD operations
2. **photo-service.java** - PhotoService with EXIF extraction, thumbnails
3. **photo-repository.java** - Custom queries with user scoping
4. **photo-dto.java** - Request/Response DTOs with validation
5. **photo-entity.java** - JPA entity with relationships
6. **jwt-config.java** - Security configuration with JWT
7. **exception-handler.java** - Global error handling

---

## Templates

Reusable templates in `templates/` directory:

1. **rest-endpoint-template.md** - Template for CRUD REST endpoint
2. **service-template.md** - Template for service class

---

## Related Documentation

For additional context, refer to:
- `.ai/prd.md` - Product requirements and user stories
- `.ai/tech-stack.md` - Technology specifications
- `.ai/db-plan.md` - Database schema design
- `.ai/api-plan.md` - REST API specification
- `MASTER_PLAN.md` - Implementation phases

---

## Key Reminders

**Security:**
- ✅ ALWAYS include userId in photo queries (user scoping)
- ✅ Use BCrypt for password hashing
- ✅ Validate JWT tokens on authenticated endpoints
- ✅ Never expose entities to API (use DTOs)

**Performance:**
- ✅ Use `@Transactional(readOnly = true)` for queries
- ✅ Use database indexes on frequently queried columns
- ✅ Lazy fetch relationships (`FetchType.LAZY`)
- ❌ NO premature optimization - keep it simple for MVP

**MVP Scope:**
- ✅ Implement only features documented in `.ai/prd.md`
- ✅ Synchronous processing (no background jobs on Mikrus VPS)
- ✅ Simple solutions over complex ones
- ❌ NO features beyond MVP requirements
