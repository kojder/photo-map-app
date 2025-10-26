# Backend Review Checklist - Spring Boot 3 + Java 17

Detailed checklist for reviewing Spring Boot backend code in Photo Map MVP.

---

## Security (CRITICAL!)

### User Scoping Pattern

**ALL photo queries MUST include userId filtering:**

```java
// ❌ BAD: No user scoping - security vulnerability!
public Photo getPhoto(final Long photoId) {
    return photoRepository.findById(photoId).orElseThrow();
}

// ✅ GOOD: User scoping enforced
public Photo getPhoto(final Long photoId, final Long userId) {
    return photoRepository.findByIdAndUserId(photoId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
}
```

**Repository Methods:**
```java
// ✅ ALWAYS include userId in repository methods
Optional<Photo> findByIdAndUserId(Long id, Long userId);
List<Photo> findAllByUserId(Long userId);
void deleteByIdAndUserId(Long id, Long userId);
```

### JWT & Authentication

**Check:**
- ✅ JWT token validation on protected endpoints
- ✅ `SecurityConfig` with JWT filter chain
- ✅ Token expiration checked
- ✅ Role-based access (`@PreAuthorize`, `/api/admin/**`)

### Input Validation

**Check:**
- ✅ `@Valid` on request DTOs
- ✅ Bean Validation annotations (`@NotBlank`, `@Email`, `@Size`)
- ✅ File upload validation (size, type, empty check)
- ✅ File names sanitized (prevent directory traversal)

### Password Security

**Check:**
- ✅ BCrypt password hashing
- ✅ Password never logged or exposed
- ✅ Strong password requirements enforced

---

## Architecture

### Layered Separation

**Controller Layer:**
- ✅ ONLY handle HTTP (request/response)
- ✅ NO business logic in controllers
- ✅ Use DTOs for all requests/responses
- ✅ Proper HTTP status codes (200, 201, 204, 400, 404, 500)

```java
// ✅ GOOD: Controller only handles HTTP
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {
    private final PhotoService photoService;

    @GetMapping("/{id}")
    public ResponseEntity<PhotoDto> getPhoto(@PathVariable final Long id, @AuthenticationPrincipal final User user) {
        final PhotoDto photo = photoService.getPhoto(id, user.getId());
        return ResponseEntity.ok(photo);
    }
}
```

**Service Layer:**
- ✅ Contains business logic
- ✅ Orchestrates repositories
- ✅ `@Transactional` on write methods
- ✅ `@Transactional(readOnly = true)` on read methods
- ✅ Converts entities to DTOs
- ✅ ALL methods accept userId parameter

```java
// ✅ GOOD: Service with business logic + user scoping
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final PhotoRepository photoRepository;

    @Transactional(readOnly = true)
    public PhotoDto getPhoto(final Long photoId, final Long userId) {
        final Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        return PhotoMapper.toDto(photo);
    }
}
```

**Repository Layer:**
- ✅ ONLY data access
- ✅ Custom queries with `@Query` (JPQL or native SQL)
- ✅ User scoping in all methods

### DTOs vs Entities

**Check:**
- ✅ Entities NEVER exposed to API
- ✅ DTOs used for all API responses
- ✅ Records for response DTOs (immutable)
- ✅ `@Data` classes for request DTOs (with validation)

```java
// ✅ GOOD: Response DTO as Record
public record PhotoDto(
    Long id,
    String fileName,
    String url,
    Double latitude,
    Double longitude,
    Integer rating,
    LocalDateTime createdAt
) {}

// ✅ GOOD: Request DTO with validation
@Data
public class PhotoCreateRequest {
    @NotBlank(message = "{validation.fileName.required}")
    private String fileName;

    @NotNull(message = "{validation.rating.required}")
    @Min(value = 1, message = "{validation.rating.min}")
    @Max(value = 5, message = "{validation.rating.max}")
    private Integer rating;
}
```

### Transaction Management

**Check:**
- ✅ `@Transactional` on service write methods
- ✅ `@Transactional(readOnly = true)` on read methods
- ✅ NO `@Transactional` in controllers or repositories

---

## Testing

### Service Tests

**Coverage:**
- ✅ All business logic methods tested
- ✅ User scoping verified (correct userId filtering)
- ✅ Error cases tested (ResourceNotFoundException)
- ✅ Mockito for repository mocks
- ✅ Coverage >70%

```java
@ExtendWith(MockitoExtension.class)
class PhotoServiceTest {
    @Mock private PhotoRepository photoRepository;
    @InjectMocks private PhotoService photoService;

    @Test
    void getPhoto_withValidIdAndUserId_returnsPhoto() {
        // Arrange
        final Photo photo = new Photo(/* ... */);
        when(photoRepository.findByIdAndUserId(1L, 100L))
            .thenReturn(Optional.of(photo));

        // Act
        final PhotoDto result = photoService.getPhoto(1L, 100L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.id());
        verify(photoRepository).findByIdAndUserId(1L, 100L);
    }
}
```

### Repository Tests

**Coverage:**
- ✅ Custom `@Query` methods tested
- ✅ User scoping verified
- ✅ `@DataJpaTest` with test database

### Integration Tests

**Coverage:**
- ✅ Full flow tests with `@SpringBootTest`
- ✅ Security configuration tested
- ✅ Real database (TestContainers or H2)

---

## Naming Conventions

**Check:**
- ✅ All identifiers in English
- ✅ Controllers: `{Resource}Controller` (e.g., PhotoController)
- ✅ Services: `{Resource}Service` (e.g., PhotoService)
- ✅ Repositories: `{Resource}Repository` (e.g., PhotoRepository)
- ✅ DTOs: `{Resource}Dto`, `{Resource}CreateRequest`
- ✅ Method names: `getX()`, `findX()`, `createX()`, `updateX()`, `deleteX()`
- ✅ Boolean methods: `isX()`, `hasX()`, `canX()`

---

## Common Backend Anti-Patterns

### ❌ Business Logic in Controller

```java
// BAD: EXIF extraction in controller
@PostMapping
public ResponseEntity<Photo> upload(final MultipartFile file) {
    final ExifData exif = extractExif(file); // WRONG!
    // ...
}
```

### ❌ Exposing Entities

```java
// BAD: Entity exposed to API
@GetMapping
public List<Photo> getPhotos() {
    return photoRepository.findAll(); // Entity exposed!
}
```

### ❌ No User Scoping

```java
// BAD: Security vulnerability!
public void deletePhoto(final Long photoId) {
    photoRepository.deleteById(photoId);
}
```

### ❌ No Transaction Management

```java
// BAD: No @Transactional
public Photo updatePhoto(final Long id, final PhotoUpdateRequest request) {
    // ...
}
```

---

## Review Checklist

Before approval:

**Security:**
- [ ] User scoping on ALL photo queries
- [ ] JWT validation working
- [ ] Input validation with `@Valid`
- [ ] No entities exposed

**Architecture:**
- [ ] Controllers → Services → Repositories
- [ ] No business logic in controllers
- [ ] DTOs used for all API responses
- [ ] `@Transactional` on service methods

**Testing:**
- [ ] Service methods tested (>70%)
- [ ] Custom queries tested
- [ ] Security configuration tested

**Code Quality:**
- [ ] English naming conventions
- [ ] Self-documenting code
- [ ] Minimal comments
- [ ] `final` keyword on parameters and variables
