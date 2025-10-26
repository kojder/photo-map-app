# Bean Validation

## Request DTO Validation

### Example with Validation

```java
public record UserRegistrationRequest(
    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    String email,

    @NotBlank(message = "{validation.password.required}")
    @Size(min = 8, max = 100, message = "{validation.password.size}")
    String password
) {}

public record RatingUpdateRequest(
    @NotNull(message = "{validation.rating.required}")
    @Min(value = 1, message = "{validation.rating.range}")
    @Max(value = 10, message = "{validation.rating.range}")
    Integer rating
) {}
```

---

## Validation Messages (i18n)

### ValidationMessages.properties

```properties
# English (default)
validation.email.required=Email is required
validation.email.invalid=Email must be valid
validation.password.required=Password is required
validation.password.size=Password must be between 8 and 100 characters
validation.rating.required=Rating is required
validation.rating.range=Rating must be between 1 and 10
```

### ValidationMessages_pl.properties (Optional)

```properties
# Polish
validation.email.required=Email jest wymagany
validation.email.invalid=Email musi być prawidłowy
validation.password.required=Hasło jest wymagane
validation.password.size=Hasło musi mieć od 8 do 100 znaków
validation.rating.required=Ocena jest wymagana
validation.rating.range=Ocena musi być od 1 do 10
```

---

## Controller Usage

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

---

## Global Exception Handler

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

---

## Common Validation Annotations

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

## Key Reminders

- ✅ Use message codes: `{validation.field.rule}`
- ✅ Store messages in `ValidationMessages.properties`
- ✅ Use `@Valid` in controller to trigger validation
- ✅ Handle `MethodArgumentNotValidException` globally
- ✅ Return clear error messages with field names
