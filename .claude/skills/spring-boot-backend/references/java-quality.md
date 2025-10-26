# Java Code Quality Best Practices

## Use `final` Keyword Wherever Possible

### Benefits

- **Immutability** - prevents accidental reassignment
- **Thread safety** - immutable objects are inherently thread-safe
- **Readability** - clear intent that value won't change
- **JVM optimization** - potential performance improvements

### Where to Use `final`

#### 1. Method Parameters

Prevents accidental modification of parameters:

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

#### 2. Local Variables

When value won't change:

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

#### 3. Class Fields (Injected Dependencies)

Always final with constructor injection:

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

#### 4. Configuration Values

Immutable after injection:

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

### When NOT to Use `final`

- Loop variables that change (`for (int i = 0; i < n; i++)`)
- Builder pattern fields
- Mutable state in entities (JPA requires non-final fields)
- Variables that genuinely need reassignment

### Complete Example: Service Method with `final`

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

## Modern Java 17 Features

### Records for DTOs

**Use Records for immutable DTOs (Java 16+):**

```java
// ✅ Use Records for immutable DTOs
public record PhotoDto(
    Long id,
    String fileName,
    Double latitude,
    Double longitude
) {
    public static PhotoDto fromEntity(final Photo photo) {
        return new PhotoDto(
            photo.getId(),
            photo.getFileName(),
            photo.getLatitude(),
            photo.getLongitude()
        );
    }
}

// ❌ AVOID: Traditional class with getters/setters for simple DTOs
public class PhotoDto {
    private Long id;
    private String fileName;
    private Double latitude;
    private Double longitude;

    // Constructor, getters, setters, equals, hashCode, toString...
}
```

**When to use Records:**
- DTOs (request/response objects)
- Value objects (immutable data holders)
- Query results
- Configuration objects

**When NOT to use Records:**
- JPA Entities (need no-arg constructor, mutable fields)
- Classes requiring inheritance (records are final)
- Classes with complex validation logic
- Builder pattern implementations

### Text Blocks for SQL

**Use Text Blocks for readable multi-line queries (Java 15+):**

```java
// ✅ Text Blocks for readable multi-line queries
@Query("""
    SELECT p FROM Photo p
    WHERE p.user.id = :userId
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
    ORDER BY p.takenAt DESC
    """)
List<Photo> findPhotosWithGps(@Param("userId") Long userId);

// ❌ AVOID: String concatenation
@Query("SELECT p FROM Photo p " +
       "WHERE p.user.id = :userId " +
       "AND p.latitude IS NOT NULL " +
       "AND p.longitude IS NOT NULL " +
       "ORDER BY p.takenAt DESC")
List<Photo> findPhotosWithGps(@Param("userId") Long userId);
```

**Benefits:**
- Better readability
- No need for escape sequences
- Preserves indentation
- Easier to maintain

### Stream.toList()

**Use `.toList()` instead of `.collect(Collectors.toList())` (Java 16+):**

```java
// ✅ Use .toList() - concise, returns immutable list
public List<PhotoDto> findPhotos(final Long userId) {
    return photoRepository.findByUserId(userId)
        .stream()
        .map(PhotoDto::fromEntity)
        .toList(); // Concise and immutable
}

// ❌ AVOID: Verbose collector
public List<PhotoDto> findPhotos(final Long userId) {
    return photoRepository.findByUserId(userId)
        .stream()
        .map(PhotoDto::fromEntity)
        .collect(Collectors.toList()); // More verbose
}
```

**Benefits:**
- More concise syntax
- Returns immutable list (safer)
- Clearer intent

### Switch Expressions

**Use switch expressions for cleaner code (Java 14+):**

```java
// ✅ Switch expression (concise, returns value)
public String getFileExtension(final String contentType) {
    return switch (contentType) {
        case "image/jpeg" -> "jpg";
        case "image/png" -> "png";
        case "image/heic" -> "heic";
        default -> throw new IllegalArgumentException("Unsupported type: " + contentType);
    };
}

// ❌ Traditional switch statement (verbose)
public String getFileExtension(final String contentType) {
    String extension;
    switch (contentType) {
        case "image/jpeg":
            extension = "jpg";
            break;
        case "image/png":
            extension = "png";
            break;
        case "image/heic":
            extension = "heic";
            break;
        default:
            throw new IllegalArgumentException("Unsupported type: " + contentType);
    }
    return extension;
}
```

### Pattern Matching for instanceof

**Use pattern matching for type checks (Java 16+):**

```java
// ✅ Pattern matching (concise, no casting)
public String processException(final Exception ex) {
    if (ex instanceof FileNotFoundException fnf) {
        return "File not found: " + fnf.getMessage();
    } else if (ex instanceof IOException io) {
        return "IO error: " + io.getMessage();
    }
    return "Unknown error: " + ex.getMessage();
}

// ❌ Traditional instanceof with casting
public String processException(final Exception ex) {
    if (ex instanceof FileNotFoundException) {
        FileNotFoundException fnf = (FileNotFoundException) ex;
        return "File not found: " + fnf.getMessage();
    } else if (ex instanceof IOException) {
        IOException io = (IOException) ex;
        return "IO error: " + io.getMessage();
    }
    return "Unknown error: " + ex.getMessage();
}
```

---

## Code Quality Principles

### Self-Documenting Code

**Code should be understandable through clear naming conventions alone:**

```java
// ✅ GOOD: Clear, self-explanatory names
@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final ExifService exifService;

    public PhotoUploadResponse uploadPhoto(final MultipartFile file, final Long userId) {
        validatePhotoFile(file);
        final String originalPath = saveOriginalFile(file, userId);
        final ExifData exifData = exifService.extractExif(file);
        final Photo photo = createPhotoEntity(file, userId, originalPath, exifData);
        return PhotoUploadResponse.fromEntity(photoRepository.save(photo));
    }

    private void validatePhotoFile(final MultipartFile file) {
        // Validation logic
    }

    private String saveOriginalFile(final MultipartFile file, final Long userId) {
        // File saving logic
    }

    private Photo createPhotoEntity(
        final MultipartFile file,
        final Long userId,
        final String originalPath,
        final ExifData exifData
    ) {
        // Entity creation logic
    }
}

// ❌ BAD: Unclear names, requires comments
@Service
public class PhotoService {

    private PhotoRepository pr;
    private ExifService es;

    public PhotoUploadResponse upload(MultipartFile f, Long u) {
        // Validate file
        validate(f);
        // Save file
        String p = save(f, u);
        // Extract EXIF
        ExifData e = es.extract(f);
        // Create entity
        Photo ph = create(f, u, p, e);
        return PhotoUploadResponse.fromEntity(pr.save(ph));
    }
}
```

### Minimize Comments

**Keep code comments to absolute minimum:**

```java
// ✅ GOOD: Self-documenting code, minimal comments
public PhotoUploadResponse uploadPhoto(final MultipartFile file, final Long userId) {
    validatePhotoFile(file);
    final String originalPath = saveOriginalFile(file, userId);
    final ExifData exifData = extractExifMetadata(file);
    final String thumbnailPath = generateThumbnail(originalPath);
    final Photo photo = createPhotoEntity(file, userId, originalPath, thumbnailPath, exifData);
    return PhotoUploadResponse.fromEntity(photoRepository.save(photo));
}

// ❌ BAD: Excessive comments explaining obvious code
public PhotoUploadResponse uploadPhoto(final MultipartFile file, final Long userId) {
    // Validate the uploaded file
    validatePhotoFile(file);
    // Save the original file to filesystem
    final String originalPath = saveOriginalFile(file, userId);
    // Extract EXIF metadata from the file
    final ExifData exifData = extractExifMetadata(file);
    // Generate thumbnail for the photo
    final String thumbnailPath = generateThumbnail(originalPath);
    // Create photo entity with all data
    final Photo photo = createPhotoEntity(file, userId, originalPath, thumbnailPath, exifData);
    // Save photo to database and return response
    return PhotoUploadResponse.fromEntity(photoRepository.save(photo));
}
```

**When to add comments:**
- Complex business logic that cannot be expressed through naming
- Non-obvious algorithms or calculations
- Important context about why something is done a certain way
- Workarounds for bugs or limitations

### Method Extraction

**Extract complex logic into well-named private methods:**

```java
// ✅ GOOD: Extracted methods with clear names
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

private boolean matchesDate(final Photo photo, final LocalDateTime fromDate) {
    if (fromDate == null) {
        return true;
    }
    final LocalDateTime takenAt = photo.getTakenAt();
    return takenAt != null && takenAt.isAfter(fromDate);
}
```

---

## Key Reminders

**`final` keyword:**
- ✅ Use for method parameters
- ✅ Use for local variables (when not reassigned)
- ✅ Use for injected dependencies (always)
- ✅ Use for configuration values
- ❌ Don't use for loop variables or builder fields

**Modern Java 17:**
- ✅ Records for DTOs
- ✅ Text Blocks for SQL
- ✅ Stream.toList() instead of collect()
- ✅ Switch expressions
- ✅ Pattern matching for instanceof

**Code Quality:**
- ✅ Self-documenting code through naming
- ✅ Minimize comments
- ✅ Extract complex logic into methods
- ✅ Clear, explicit intent
