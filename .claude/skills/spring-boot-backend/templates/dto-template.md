# DTO Template

## Response DTO (Record)

```java
public record {ResourceName}Dto(
    Long id,
    String field
    // TODO: Add fields
) {
    public static {ResourceName}Dto fromEntity(final {EntityName} entity) {
        return new {ResourceName}Dto(
            entity.getId(),
            entity.getField()
            // TODO: Map entity fields
        );
    }

    public static List<{ResourceName}Dto> fromEntities(final List<{EntityName}> entities) {
        return entities.stream()
            .map({ResourceName}Dto::fromEntity)
            .toList();
    }
}
```

## Request DTO (Class with Validation)

```java
@Data
public class {ResourceName}CreateRequest {

    @NotBlank(message = "{validation.field.required}")
    private String field;

    @Email(message = "{validation.email.invalid}")
    private String email;

    @Size(min = 1, max = 100, message = "{validation.field.size}")
    private String description;

    // TODO: Add validated fields
}
```

## Checklist

- [ ] Response DTO uses Record (immutable)
- [ ] fromEntity() static factory method
- [ ] fromEntities() for bulk conversion
- [ ] Request DTO uses validation annotations
- [ ] Validation messages use i18n codes {validation.field.rule}

## Key Rules

- ✅ Use Record for response DTOs (immutable)
- ✅ Use @Data class for request DTOs (validation)
- ✅ Static factory methods for conversion
- ✅ Validation messages in ValidationMessages.properties
- ✅ Never expose entities to API
