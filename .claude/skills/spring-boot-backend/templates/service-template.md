# Service Class Template

## Structure

```java
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class {ResourceName}Service {

    // Dependencies (final fields with constructor injection)
    private final {ResourceName}Repository repository;
    // TODO: Add other dependencies

    // Read operation - use readOnly=true
    @Transactional(readOnly = true)
    public {ResourceName}Dto findById(final Long id, final Long userId) {
        log.debug("Finding {} by id {} for user {}", "{resource}", id, userId);
        
        final {ResourceName} entity = repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("{ResourceName} not found"));
        
        return {ResourceName}Dto.fromEntity(entity);
    }

    // Write operation - default transaction
    public {ResourceName}Dto create(final {ResourceName}CreateRequest request, final Long userId) {
        // TODO: Business logic
        final {ResourceName} entity = buildEntity(request, userId);
        final {ResourceName} saved = repository.save(entity);
        return {ResourceName}Dto.fromEntity(saved);
    }

    // Private helper methods
    private {ResourceName} buildEntity(final {ResourceName}CreateRequest request, final Long userId) {
        // TODO: Build logic
        return {ResourceName}.builder()
            .user(userRepository.findById(userId).orElseThrow())
            .build();
    }
}
```

## Checklist

- [ ] @Service annotation
- [ ] Constructor injection (@RequiredArgsConstructor)
- [ ] @Transactional on class
- [ ] @Transactional(readOnly = true) for read operations
- [ ] All methods accept userId parameter
- [ ] Proper exception handling
- [ ] Logging with @Slf4j
- [ ] Extract complex logic to private methods

## Key Rules

- ✅ ALWAYS use `final` for method parameters
- ✅ ALWAYS include userId in all methods (user scoping)
- ✅ Use @Transactional(readOnly = true) for queries
- ✅ Throw ResourceNotFoundException when not found
- ✅ Log at appropriate levels (debug, info, error)
