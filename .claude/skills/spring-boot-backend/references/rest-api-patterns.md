# REST API Patterns - Controllers, DTOs, and Error Handling

## Controller Structure

### Basic Controller Pattern

```java
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @GetMapping
    public ResponseEntity<List<PhotoDto>> getUserPhotos(
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        final List<PhotoDto> photos = photoService.findPhotosByUserId(userId);
        return ResponseEntity.ok(photos);
    }
}
```

### Controller Annotations

#### Class-Level Annotations

- `@RestController` - Combines `@Controller` + `@ResponseBody`
- `@RequestMapping("/api/photos")` - Base path for all endpoints
- `@RequiredArgsConstructor` - Lombok constructor injection

#### Method-Level Annotations

- `@GetMapping` - HTTP GET request
- `@PostMapping` - HTTP POST request
- `@PutMapping` - HTTP PUT request
- `@DeleteMapping` - HTTP DELETE request
- `@PatchMapping` - HTTP PATCH request

### Parameter Annotations

#### Path Variables

```java
@GetMapping("/{photoId}")
public ResponseEntity<PhotoDto> getPhotoById(
    @PathVariable final Long photoId,
    @AuthenticationPrincipal final UserDetails userDetails
) {
    // photoId extracted from /api/photos/123
}
```

#### Query Parameters

```java
@GetMapping
public ResponseEntity<List<PhotoDto>> getPhotos(
    @RequestParam(required = false) final Integer minRating,
    @RequestParam(required = false) final LocalDate fromDate,
    @AuthenticationPrincipal final UserDetails userDetails
) {
    // /api/photos?minRating=5&fromDate=2025-01-01
}
```

#### Request Body

```java
@PostMapping
public ResponseEntity<PhotoDto> createPhoto(
    @RequestBody @Valid final PhotoCreateRequest request,
    @AuthenticationPrincipal final UserDetails userDetails
) {
    // @Valid triggers validation annotations
    // Request body parsed from JSON
}
```

#### Authentication Principal

```java
@GetMapping
public ResponseEntity<List<PhotoDto>> getUserPhotos(
    @AuthenticationPrincipal final UserDetails userDetails
) {
    // Authenticated user from JWT token
    final Long userId = extractUserId(userDetails);
}
```

### Complete Controller Example

```java
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    // GET /api/photos - List all photos for user
    @GetMapping
    public ResponseEntity<List<PhotoDto>> getUserPhotos(
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        final List<PhotoDto> photos = photoService.findPhotosByUserId(userId);
        return ResponseEntity.ok(photos);
    }

    // GET /api/photos/{photoId} - Get single photo
    @GetMapping("/{photoId}")
    public ResponseEntity<PhotoDto> getPhotoById(
        @PathVariable final Long photoId,
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        final PhotoDto photo = photoService.findPhotoById(photoId, userId);
        return ResponseEntity.ok(photo);
    }

    // POST /api/photos/upload - Upload photo
    @PostMapping("/upload")
    public ResponseEntity<PhotoUploadResponse> uploadPhoto(
        @RequestParam("file") final MultipartFile file,
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        final PhotoUploadResponse response = photoService.uploadPhoto(file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // PUT /api/photos/{photoId}/rating - Update rating
    @PutMapping("/{photoId}/rating")
    public ResponseEntity<Void> updateRating(
        @PathVariable final Long photoId,
        @RequestBody @Valid final RatingUpdateRequest request,
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        photoService.updateRating(photoId, request.getRating(), userId);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/photos/{photoId} - Delete photo
    @DeleteMapping("/{photoId}")
    public ResponseEntity<Void> deletePhoto(
        @PathVariable final Long photoId,
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        photoService.deletePhoto(photoId, userId);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserId(final UserDetails userDetails) {
        return ((CustomUserDetails) userDetails).getUserId();
    }
}
```

---

## HTTP Status Codes

### Success Codes

| Code | Status | Usage |
|------|--------|-------|
| **200** | OK | GET/PUT success with response body |
| **201** | Created | POST success (resource created) |
| **204** | No Content | DELETE/PUT success, no response body |

```java
// 200 OK - GET success
return ResponseEntity.ok(photos);

// 201 Created - POST success
return ResponseEntity.status(HttpStatus.CREATED).body(response);

// 204 No Content - DELETE success
return ResponseEntity.noContent().build();
```

### Client Error Codes

| Code | Status | Usage |
|------|--------|-------|
| **400** | Bad Request | Validation error, invalid input |
| **401** | Unauthorized | Not authenticated (missing/invalid JWT) |
| **403** | Forbidden | Not authorized (authenticated but insufficient permissions) |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource conflict (duplicate email, etc.) |

### Server Error Codes

| Code | Status | Usage |
|------|--------|-------|
| **500** | Internal Server Error | Unexpected server error |

### Status Code Examples

```java
// 200 OK
@GetMapping("/{id}")
public ResponseEntity<PhotoDto> getPhoto(@PathVariable final Long id) {
    return ResponseEntity.ok(photoService.findById(id));
}

// 201 Created
@PostMapping
public ResponseEntity<PhotoDto> createPhoto(@RequestBody @Valid final PhotoCreateRequest request) {
    final PhotoDto created = photoService.createPhoto(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}

// 204 No Content
@DeleteMapping("/{id}")
public ResponseEntity<Void> deletePhoto(@PathVariable final Long id) {
    photoService.deletePhoto(id);
    return ResponseEntity.noContent().build();
}

// 400 Bad Request - handled by GlobalExceptionHandler
// 401 Unauthorized - handled by Spring Security
// 403 Forbidden - handled by Spring Security
// 404 Not Found - throw ResourceNotFoundException
// 500 Internal Server Error - handled by GlobalExceptionHandler
```

---

## DTOs (Data Transfer Objects)

### Purpose

- Decouple API from internal entities
- Control what data is exposed
- Validation on inputs
- Transform data for responses

### Response DTO Pattern

```java
// Using Record (Java 16+) - immutable, concise
public record PhotoDto(
    Long id,
    String fileName,
    Long fileSize,
    String thumbnailUrl,
    Double latitude,
    Double longitude,
    Integer rating,
    String takenAt
) {
    // Static factory method for entity conversion
    public static PhotoDto fromEntity(final Photo photo) {
        return new PhotoDto(
            photo.getId(),
            photo.getFileName(),
            photo.getFileSize(),
            "/api/photos/" + photo.getId() + "/thumbnail",
            photo.getLatitude(),
            photo.getLongitude(),
            photo.getRating(),
            photo.getTakenAt() != null ? photo.getTakenAt().toString() : null
        );
    }

    // Bulk conversion
    public static List<PhotoDto> fromEntities(final List<Photo> photos) {
        return photos.stream()
            .map(PhotoDto::fromEntity)
            .toList();
    }
}
```

### Request DTO with Validation

```java
// Using Record with validation
public record UserRegistrationRequest(
    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    String email,

    @NotBlank(message = "{validation.password.required}")
    @Size(min = 8, max = 100, message = "{validation.password.size}")
    String password
) {}

// Or using class with @Data
@Data
public class RatingUpdateRequest {

    @NotNull(message = "{validation.rating.required}")
    @Min(value = 1, message = "{validation.rating.range}")
    @Max(value = 10, message = "{validation.rating.range}")
    private Integer rating;
}
```

### Validation Annotations

| Annotation | Purpose | Example |
|------------|---------|---------|
| `@NotNull` | Field cannot be null | `@NotNull Long userId` |
| `@NotBlank` | String not null/empty/whitespace | `@NotBlank String email` |
| `@Email` | Valid email format | `@Email String email` |
| `@Size` | String/collection size | `@Size(min=8, max=100)` |
| `@Min` / `@Max` | Numeric range | `@Min(1) @Max(10) Integer rating` |
| `@Pattern` | Regex pattern | `@Pattern(regexp="[A-Z]+")` |
| `@Valid` | Nested object validation | `@Valid AddressDto address` |

### DTO Rules

- ✅ Use DTOs for ALL API requests/responses (never expose entities)
- ✅ Add validation annotations on request DTOs
- ✅ Use static factory methods (`fromEntity()`) for conversions
- ✅ Keep DTOs simple (no business logic)
- ✅ Use Records for immutable DTOs
- ✅ Use classes for DTOs requiring setters or builders

---

## Exception Handling

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
        final ResourceNotFoundException ex
    ) {
        final ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.NOT_FOUND.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<ErrorResponse> handleFileUpload(
        final FileUploadException ex
    ) {
        final ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
        final MethodArgumentNotValidException ex
    ) {
        final List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .toList();

        final ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message("Validation failed")
            .errors(errors)
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(final Exception ex) {
        // Log full stack trace
        log.error("Unexpected error", ex);

        // Return generic error (don't expose internals)
        final ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .message("An unexpected error occurred")
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

### ErrorResponse DTO

```java
@Data
@Builder
public class ErrorResponse {
    private int status;
    private String message;
    private List<String> errors; // Optional: for validation errors
    private LocalDateTime timestamp;
}
```

### Custom Exceptions

```java
// Resource not found (404)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(final String message) {
        super(message);
    }
}

// File upload error (400)
public class FileUploadException extends RuntimeException {
    public FileUploadException(final String message) {
        super(message);
    }
}

// Business logic error (409)
public class BusinessException extends RuntimeException {
    public BusinessException(final String message) {
        super(message);
    }
}
```

### Exception Handling Flow

```
1. Exception thrown in Service
   ↓
2. Controller propagates exception
   ↓
3. @RestControllerAdvice intercepts exception
   ↓
4. @ExceptionHandler method matches exception type
   ↓
5. ErrorResponse DTO created
   ↓
6. ResponseEntity with appropriate HTTP status returned
```

---

## Key Reminders

**Controllers:**
- ✅ Use `@RestController` + `@RequestMapping`
- ✅ Constructor injection with `@RequiredArgsConstructor`
- ✅ Delegate to service layer (no business logic)
- ✅ Extract userId from `@AuthenticationPrincipal`
- ✅ Return appropriate `ResponseEntity` with status codes

**HTTP Status:**
- ✅ 200 OK - GET/PUT success
- ✅ 201 Created - POST success
- ✅ 204 No Content - DELETE success
- ✅ 400 Bad Request - validation errors
- ✅ 404 Not Found - resource not found

**DTOs:**
- ✅ Use DTOs for ALL requests/responses
- ✅ Validation annotations on request DTOs
- ✅ Static factory methods (`fromEntity()`)
- ✅ Records for immutable DTOs
- ✅ Never expose entities to API

**Error Handling:**
- ✅ Use `@RestControllerAdvice` for global handling
- ✅ Custom exceptions for business errors
- ✅ Consistent ErrorResponse DTO
- ✅ Log full stack trace, return generic message
- ✅ Never expose internal implementation details
