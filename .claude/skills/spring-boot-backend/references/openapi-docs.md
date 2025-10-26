# API Documentation - Springdoc OpenAPI

## Configuration

### Dependency (pom.xml)

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

### Application Properties

```properties
# Springdoc OpenAPI
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.enabled=true
```

---

## Document Endpoints

### Controller Annotations

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

---

## Swagger Annotations

| Annotation | Purpose |
|------------|---------|
| `@Tag` | Group endpoints by controller |
| `@Operation` | Document endpoint (summary, description) |
| `@ApiResponses` | Document response codes |
| `@ApiResponse` | Document single response code |
| `@Parameter` | Document request parameter |
| `@Parameter(hidden = true)` | Hide parameter from docs |

---

## Access Swagger UI

- **Development:** http://localhost:8080/swagger-ui.html
- **Production:** https://yourdomain.com/swagger-ui.html

---

## Benefits

- ✅ Automatic API documentation from code
- ✅ Interactive testing (try endpoints in browser)
- ✅ Request/response examples
- ✅ Authentication support (add JWT token in Swagger UI)

---

## Key Reminders

- ✅ Use `@Tag` for controller grouping
- ✅ Use `@Operation` for endpoint documentation
- ✅ Use `@ApiResponses` for status codes
- ✅ Use `@Parameter(hidden = true)` for auth principals
- ✅ Test endpoints directly in Swagger UI
