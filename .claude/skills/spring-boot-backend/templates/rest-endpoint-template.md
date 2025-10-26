# REST Endpoint Implementation Template

## Overview

This template guides implementation of a complete REST endpoint following Photo Map MVP architecture.

---

## Step-by-Step Workflow

### Step 1: Define DTO (Data Transfer Object)

**Location:** `src/main/java/com/photomap/dto/`

```java
// Response DTO (Record for immutability)
public record {ResourceName}Dto(
    Long id,
    // TODO: Add fields from entity
) {
    public static {ResourceName}Dto fromEntity(final {ResourceName} entity) {
        return new {ResourceName}Dto(
            entity.getId()
            // TODO: Map entity fields to DTO fields
        );
    }
}

// Request DTO (if needed for POST/PUT)
@Data
public class {ResourceName}CreateRequest {
    @NotBlank(message = "{validation.field.required}")
    private String field;
    // TODO: Add validated fields
}
```

**Checklist:**
- [ ] Response DTO created (Record)
- [ ] `fromEntity()` static factory method implemented
- [ ] Request DTO created (if needed)
- [ ] Validation annotations added (@NotBlank, @Email, @Size)

---

### Step 2: Create/Update JPA Entity

**Location:** `src/main/java/com/photomap/model/`

```java
@Entity
@Table(name = "{table_name}", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id")
    // TODO: Add indexes on frequently queried columns
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class {ResourceName} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // CRITICAL: User scoping

    // TODO: Add fields

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

**Checklist:**
- [ ] Entity created with proper annotations
- [ ] User relationship added (FetchType.LAZY)
- [ ] Indexes defined on frequently queried columns
- [ ] @PrePersist for createdAt timestamp
- [ ] Lombok annotations (@Getter, @Setter, @Builder)

---

### Step 3: Create Repository

**Location:** `src/main/java/com/photomap/repository/`

```java
@Repository
public interface {ResourceName}Repository extends JpaRepository<{ResourceName}, Long> {

    // CRITICAL: User scoping - always include userId
    Optional<{ResourceName}> findByIdAndUserId(Long id, Long userId);

    List<{ResourceName}> findByUserId(Long userId);

    // TODO: Add derived query methods or custom @Query
}
```

**Checklist:**
- [ ] Repository interface created
- [ ] Extends `JpaRepository<Entity, Long>`
- [ ] User scoping methods added (findByIdAndUserId)
- [ ] Additional query methods defined

---

### Step 4: Implement Service

**Location:** `src/main/java/com/photomap/service/`

```java
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class {ResourceName}Service {

    private final {ResourceName}Repository repository;
    // TODO: Inject other dependencies (if needed)

    @Transactional(readOnly = true)
    public List<{ResourceName}Dto> findByUserId(final Long userId) {
        log.debug("Finding {} for user {}", "{resources}", userId);

        return repository.findByUserId(userId)
            .stream()
            .map({ResourceName}Dto::fromEntity)
            .toList();
    }

    @Transactional(readOnly = true)
    public {ResourceName}Dto findById(final Long id, final Long userId) {
        final {ResourceName} entity = repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("{ResourceName} not found"));

        return {ResourceName}Dto.fromEntity(entity);
    }

    public {ResourceName}Dto create(final {ResourceName}CreateRequest request, final Long userId) {
        // TODO: Build entity from request
        final {ResourceName} entity = {ResourceName}.builder()
            .user(userRepository.findById(userId).orElseThrow())
            // TODO: Set fields from request
            .build();

        final {ResourceName} saved = repository.save(entity);
        return {ResourceName}Dto.fromEntity(saved);
    }

    public void delete(final Long id, final Long userId) {
        final {ResourceName} entity = repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("{ResourceName} not found"));

        repository.delete(entity);
    }
}
```

**Checklist:**
- [ ] Service class created with @Service
- [ ] Constructor injection with @RequiredArgsConstructor
- [ ] @Transactional on class level
- [ ] @Transactional(readOnly = true) for read operations
- [ ] All methods accept userId parameter (USER SCOPING!)
- [ ] Proper exception handling (ResourceNotFoundException)

---

### Step 5: Create Controller

**Location:** `src/main/java/com/photomap/controller/`

```java
@RestController
@RequestMapping("/api/{resources}")
@RequiredArgsConstructor
public class {ResourceName}Controller {

    private final {ResourceName}Service service;

    @GetMapping
    public ResponseEntity<List<{ResourceName}Dto>> getAll(
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(service.findByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<{ResourceName}Dto> getById(
        @PathVariable final Long id,
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(service.findById(id, userId));
    }

    @PostMapping
    public ResponseEntity<{ResourceName}Dto> create(
        @RequestBody @Valid final {ResourceName}CreateRequest request,
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        final {ResourceName}Dto created = service.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @PathVariable final Long id,
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);
        service.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserId(final UserDetails userDetails) {
        return ((CustomUserDetails) userDetails).getUserId();
    }
}
```

**Checklist:**
- [ ] Controller created with @RestController
- [ ] Base path defined with @RequestMapping
- [ ] Constructor injection with @RequiredArgsConstructor
- [ ] GET /api/{resources} - list all (user scoped)
- [ ] GET /api/{resources}/{id} - get single (user scoped)
- [ ] POST /api/{resources} - create new (201 Created)
- [ ] DELETE /api/{resources}/{id} - delete (204 No Content)
- [ ] Extract userId from @AuthenticationPrincipal

---

## Final Checklist

- [ ] DTO created with validation
- [ ] Entity created with indexes and User relationship
- [ ] Repository with user scoping methods
- [ ] Service with @Transactional and user scoping
- [ ] Controller with proper HTTP status codes
- [ ] All layers follow MVP conventions
- [ ] User scoping enforced at every layer
- [ ] Unit tests written (>70% coverage)
- [ ] Integration test for full flow

---

## Links

- **Examples:** See `examples/` for complete implementations
- **References:**
  - `references/rest-api-patterns.md` - Controller & DTO patterns
  - `references/jpa-patterns.md` - Entity & Repository patterns
  - `references/architecture.md` - Service layer patterns
