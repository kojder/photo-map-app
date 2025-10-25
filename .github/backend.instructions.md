---
description: "Spring Boot backend development guidelines for Photo Map MVP"
applyTo: "backend/**/*.java,backend/**/pom.xml,backend/**/*.xml,backend/**/*.properties,backend/**/*.sql"
---

# Spring Boot Backend Development Guidelines

## Stack

- Spring Boot 3.5.7, Java 17, PostgreSQL 15, Spring Security 6 (JWT), Maven
- Spring Integration (async), JJWT 0.12.6, metadata-extractor, Thumbnailator

## Architecture: Controller → Service → Repository → Entity

### Controllers (`@RestController`)
- Handle HTTP, validate input (`@Valid`), delegate to Service
- **NO business logic**
- Return `ResponseEntity<T>`, use DTOs (never entities)

### Services (`@Service`)
- **ALL business logic here**
- `@Transactional` for writes, `@Transactional(readOnly = true)` for reads
- Constructor injection with `final` fields + `@RequiredArgsConstructor`

### Repositories (`JpaRepository`)
- Data access only, **NO business logic**
- Query methods or `@Query`

### Entities (`@Entity`)
- Database tables, JPA annotations, **NO business logic**

## CRITICAL: User Scoping

**Always filter by userId for user-owned resources:**

```java
// ❌ BAD - Security vulnerability
photoRepository.findById(photoId)

// ✅ GOOD - User can only access own photos
photoRepository.findByIdAndUserId(photoId, userId)
```

Applies to: Photos, Ratings, any user-specific data.
Exception: Admin endpoints with `@PreAuthorize("hasRole('ADMIN')")`

## Code Quality

### Dependency Injection
```java
// ✅ GOOD
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final PhotoRepository photoRepository;
}

// ❌ BAD - field injection
@Autowired private PhotoRepository photoRepository;
```

### Immutability
```java
// ✅ GOOD - use final
public PhotoDto getPhoto(final Long photoId, final Long userId) {
    final Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
    return PhotoDto.fromEntity(photo);
}
```

### Java 17 Features
```java
// ✅ GOOD - Records for DTOs
public record PhotoDto(Long id, String filename, Double latitude) {
    public static PhotoDto fromEntity(final Photo photo) { ... }
}

// ✅ GOOD - Stream.toList()
List<PhotoDto> photos = photoList.stream().map(PhotoDto::fromEntity).toList();
```

## REST API

### HTTP Status Codes
- `200 OK` - GET, PUT
- `201 Created` - POST
- `202 Accepted` - Async processing started
- `204 No Content` - DELETE
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid JWT
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found

### DTOs Always
```java
// ✅ GOOD
@GetMapping("/{id}")
public ResponseEntity<PhotoDto> getPhoto(@PathVariable final Long id) {
    return ResponseEntity.ok(photoService.getPhotoDtoById(id));
}

// ❌ BAD - exposes entity
public ResponseEntity<Photo> getPhoto(@PathVariable final Long id) { ... }
```

## Exception Handling

Use `@RestControllerAdvice` for global error handling:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            final ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(404, ex.getMessage(), LocalDateTime.now()));
    }
}
```

Custom exceptions: `ResourceNotFoundException`, `UnauthorizedAccessException`

## Database Migrations (Flyway)

- Location: `src/main/resources/db/migration/`
- Naming: `V{version}__{Description}.sql` (e.g., `V1__initial_schema.sql`)
- **NEVER modify applied migrations** - create new version
- `spring.jpa.hibernate.ddl-auto=validate` (Flyway manages schema)

## Testing

### Unit Tests (JUnit 5 + Mockito)
```java
@ExtendWith(MockitoExtension.class)
class PhotoServiceTest {
    @Mock private PhotoRepository photoRepository;
    @InjectMocks private PhotoService photoService;
    
    @Test
    void shouldGetPhotoByIdAndUserId() {
        when(photoRepository.findByIdAndUserId(1L, 1L))
            .thenReturn(Optional.of(photo));
        assertThat(photoService.getPhotoById(1L, 1L)).isPresent();
    }
}
```

### Integration Tests (@SpringBootTest + MockMvc)
```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PhotoControllerIntegrationTest {
    @Autowired private MockMvc mockMvc;
    
    @Test
    void shouldReturnPhotoWhenUserOwnsIt() throws Exception {
        mockMvc.perform(get("/api/photos/{id}", photoId)
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());
    }
}
```

**Test DB:** H2 in-memory (`application-test.properties`)
**Requirements:** >70% coverage, unit tests before EVERY commit
**Command:** `./mvnw test`

## Security

### JWT Flow
1. Login → JWT token returned
2. Client stores in localStorage
3. Send in `Authorization: Bearer <token>` header
4. `JwtAuthenticationFilter` validates → sets authentication
5. Controller uses `@AuthenticationPrincipal UserDetails`

### Development Toggle
```properties
# application.properties
security.enabled=false  # Disable JWT for dev testing (NEVER in production)
```

```java
@Value("${security.enabled:true}")
private boolean securityEnabled;

@Bean
public SecurityFilterChain securityFilterChain(final HttpSecurity http) {
    if (!securityEnabled) {
        http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
    } else {
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .anyRequest().authenticated());
    }
    return http.build();
}
```

### Password Encoding
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

## Validation

### i18n Message Codes (`ValidationMessages.properties`)
```properties
validation.email.required=Email is required
validation.email.invalid=Email must be valid
validation.password.length=Password must be between 8 and 100 characters
```

### Apply Validation
```java
public record RegisterRequest(
    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    String email,
    
    @NotBlank(message = "{validation.password.required}")
    @Size(min = 8, max = 100, message = "{validation.password.length}")
    String password
) {}

@PostMapping("/register")
public ResponseEntity<AuthResponse> register(@RequestBody @Valid final RegisterRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
}
```

## Environment Configuration

```properties
# Use ${VAR_NAME:default-value} pattern
spring.datasource.username=${DB_USERNAME:photomap_user}
spring.datasource.password=${DB_PASSWORD:changeme}
jwt.secret=${JWT_SECRET:your-secret-key-change-in-production}
security.enabled=${SECURITY_ENABLED:true}
photo.upload.directory.input=${UPLOAD_DIR_INPUT:./uploads/input}
```

## Async Processing (Spring Integration)

### Photo Upload Pattern
- Upload returns **202 Accepted** immediately
- Spring Integration polls `uploads/input/` every 10s
- EXIF extraction + thumbnail generation in background
- Failed files moved to `uploads/failed/`

```java
@Configuration
@EnableIntegration
public class PhotoIntegrationConfig {
    @Bean
    public IntegrationFlow filePollingFlow(final PhotoProcessingService service) {
        return IntegrationFlow
            .from(Files.inboundAdapter(new File(inputDirectory)),
                e -> e.poller(Pollers.fixedDelay(10000)))
            .handle(service, "processPhoto")
            .get();
    }
}
```

## Key Files

- `SecurityConfig.java` - JWT + security toggle
- `PhotoIntegrationConfig.java` - Async processing
- `GlobalExceptionHandler.java` - Centralized errors
- `integration/AuthIntegrationTest.java` - Integration test example

## Quick Commands

```bash
./mvnw spring-boot:run              # Run backend
./mvnw test                         # Run all tests
./mvnw clean package -DskipTests    # Build JAR (skip tests)
```
