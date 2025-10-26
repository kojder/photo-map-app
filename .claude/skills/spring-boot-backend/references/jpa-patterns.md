# JPA Patterns - Repository & Entity Best Practices

## Repository Pattern

### Spring Data JPA Repositories

**Pattern:** Extend `JpaRepository<Entity, ID>` for automatic CRUD operations.

```java
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    // Automatic CRUD methods inherited:
    // - save(entity)
    // - findById(id)
    // - findAll()
    // - deleteById(id)
    // - count()
}
```

### Derived Query Methods

**Spring Data auto-generates queries from method names:**

```java
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {

    // Find by single field
    List<Photo> findByUserId(Long userId);

    // Find with sorting
    List<Photo> findByUserIdOrderByTakenAtDesc(Long userId);

    // Find with multiple conditions
    List<Photo> findByUserIdAndRating(Long userId, Integer rating);

    // Find with date range
    List<Photo> findByUserIdAndTakenAtBetween(
        Long userId,
        LocalDateTime startDate,
        LocalDateTime endDate
    );

    // Find with null check
    List<Photo> findByUserIdAndLatitudeIsNotNull(Long userId);

    // Count queries
    long countByUserId(Long userId);

    // Exists checks
    boolean existsByIdAndUserId(Long id, Long userId);
}
```

**Naming convention:**
- `findBy` - retrieve entities
- `countBy` - count entities
- `existsBy` - check existence
- `deleteBy` - delete entities
- `And` / `Or` - combine conditions
- `OrderBy` - add sorting
- `IsNull` / `IsNotNull` - null checks
- `Between` - range queries

### Custom JPQL Queries

**Use `@Query` for complex queries:**

```java
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {

    // Basic JPQL query
    @Query("SELECT p FROM Photo p WHERE p.user.id = :userId " +
           "AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL")
    List<Photo> findPhotosWithGps(@Param("userId") Long userId);

    // JPQL with multiple parameters
    @Query("SELECT p FROM Photo p WHERE p.user.id = :userId " +
           "AND p.rating >= :minRating ORDER BY p.takenAt DESC")
    List<Photo> findPhotosByMinRating(
        @Param("userId") Long userId,
        @Param("minRating") Integer minRating
    );

    // JPQL with text block (Java 15+)
    @Query("""
        SELECT p FROM Photo p
        WHERE p.user.id = :userId
          AND p.rating >= :minRating
          AND p.takenAt >= :fromDate
        ORDER BY p.takenAt DESC
        """)
    List<Photo> findPhotosWithFilters(
        @Param("userId") Long userId,
        @Param("minRating") Integer minRating,
        @Param("fromDate") LocalDateTime fromDate
    );
}
```

### Native SQL Queries

**Use native SQL only when JPQL is insufficient:**

```java
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {

    // Native SQL query
    @Query(value = """
        SELECT * FROM photos
        WHERE user_id = :userId
          AND rating >= :minRating
        ORDER BY taken_at DESC
        """,
        nativeQuery = true)
    List<Photo> findPhotosByUserAndMinRatingNative(
        @Param("userId") Long userId,
        @Param("minRating") Integer minRating
    );

    // Native SQL with complex joins
    @Query(value = """
        SELECT p.* FROM photos p
        JOIN users u ON p.user_id = u.id
        WHERE u.email = :email
          AND p.latitude IS NOT NULL
        """,
        nativeQuery = true)
    List<Photo> findPhotosWithGpsByUserEmail(@Param("email") String email);
}
```

**When to use native SQL:**
- Database-specific functions (PostgreSQL-specific features)
- Complex joins not easily expressed in JPQL
- Performance optimization with database hints
- Window functions, CTEs, or advanced SQL features

---

## User Scoping Enforcement

### CRITICAL Security Pattern

**ALL photo queries MUST include userId to enforce data isolation.**

#### ❌ BAD: No User Scoping

```java
// Security vulnerability - any user can access any photo!
public Photo getPhoto(final Long photoId) {
    return photoRepository.findById(photoId)
        .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
}
```

#### ✅ GOOD: User Scoping Enforced

```java
// User can only access their own photos
public Photo getPhoto(final Long photoId, final Long userId) {
    return photoRepository.findByIdAndUserId(photoId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
}
```

### User Scoping in Repository

```java
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {

    // CRITICAL: Always include userId for photo access
    Optional<Photo> findByIdAndUserId(Long id, Long userId);

    // User scoped list
    List<Photo> findByUserId(Long userId);

    // User scoped with filters
    List<Photo> findByUserIdAndRating(Long userId, Integer rating);

    // User scoped count
    long countByUserId(Long userId);

    // User scoped exists check
    boolean existsByIdAndUserId(Long id, Long userId);

    // User scoped delete
    void deleteByIdAndUserId(Long id, Long userId);
}
```

### User Scoping in Service Layer

```java
@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;

    // ALL methods MUST accept userId parameter
    @Transactional(readOnly = true)
    public PhotoDto findPhotoById(final Long photoId, final Long userId) {
        final Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        return PhotoDto.fromEntity(photo);
    }

    @Transactional(readOnly = true)
    public List<PhotoDto> findPhotosByUserId(final Long userId) {
        return photoRepository.findByUserId(userId)
            .stream()
            .map(PhotoDto::fromEntity)
            .toList();
    }

    public void deletePhoto(final Long photoId, final Long userId) {
        // Verify ownership before delete
        final Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));

        photoRepository.delete(photo);
    }
}
```

---

## JPA Entities

### Entity Structure

```java
@Entity
@Table(name = "photos", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_taken_at", columnList = "taken_at"),
    @Index(name = "idx_rating", columnList = "rating")
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
    private Integer rating; // 1-10, nullable

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

### Entity Annotations

#### Class-Level Annotations

- `@Entity` - Mark class as JPA entity
- `@Table(name = "table_name")` - Specify table name
- `@Table(indexes = {...})` - Define indexes
- Lombok: `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`

#### Field Annotations

- `@Id` - Primary key
- `@GeneratedValue(strategy = GenerationType.IDENTITY)` - Auto-generated ID
- `@Column(nullable = false)` - Not null constraint
- `@Column(updatable = false)` - Immutable field
- `@Column(precision = 10, scale = 7)` - Decimal precision for coordinates

#### Relationship Annotations

- `@ManyToOne(fetch = FetchType.LAZY)` - Many photos to one user (lazy loading)
- `@OneToMany(mappedBy = "user", cascade = CascadeType.ALL)` - One user to many photos
- `@JoinColumn(name = "user_id")` - Foreign key column

### Indexes

**Add indexes on frequently queried columns:**

```java
@Table(name = "photos", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),        // User scoping queries
    @Index(name = "idx_taken_at", columnList = "taken_at"),      // Date sorting
    @Index(name = "idx_rating", columnList = "rating"),          // Rating filters
    @Index(name = "idx_user_rating", columnList = "user_id, rating") // Composite index
})
```

**When to add indexes:**
- ✅ Foreign keys (user_id)
- ✅ Frequently queried fields (takenAt, rating)
- ✅ Fields used in WHERE clauses
- ✅ Fields used in ORDER BY clauses
- ❌ Don't over-index (slows down writes)

### Entity Lifecycle Hooks

```java
@Entity
public class Photo {

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Called before insert
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    // Called before update
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

**Lifecycle hooks:**
- `@PrePersist` - Before entity is persisted (inserted)
- `@PreUpdate` - Before entity is updated
- `@PreRemove` - Before entity is removed
- `@PostPersist` - After entity is persisted
- `@PostUpdate` - After entity is updated
- `@PostRemove` - After entity is removed

### Fetch Types

```java
// Lazy loading (default for @ManyToOne, recommended)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id")
private User user;

// Eager loading (not recommended, causes N+1 problem)
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "user_id")
private User user;
```

**Best practice:**
- ✅ Use `FetchType.LAZY` for relationships (performance)
- ✅ Fetch related entities explicitly when needed (JOIN FETCH)
- ❌ Avoid `FetchType.EAGER` (causes N+1 queries)

### Cascade Types

```java
@Entity
public class User {

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photos;
}
```

**Cascade types:**
- `CascadeType.ALL` - Cascade all operations
- `CascadeType.PERSIST` - Cascade persist only
- `CascadeType.REMOVE` - Cascade delete
- `orphanRemoval = true` - Remove orphaned entities

**Use with caution:**
- ✅ `cascade = CascadeType.ALL` for strong ownership (User → Photos)
- ❌ Be careful with `CascadeType.REMOVE` (can delete unintended data)

---

## Entity Rules

### DO:
- ✅ Use Lombok annotations (`@Getter`, `@Setter`, `@Builder`)
- ✅ Use `FetchType.LAZY` for relationships
- ✅ Add indexes on frequently queried columns
- ✅ Use `@PrePersist` for createdAt, `@PreUpdate` for updatedAt
- ✅ Use `@Builder` pattern for entity creation
- ✅ Keep entities simple (data holders only)

### DON'T:
- ❌ NO business logic in entities
- ❌ NO service dependencies in entities
- ❌ NO complex validation in entities (use DTOs)
- ❌ NO `FetchType.EAGER` (performance issue)
- ❌ NO bi-directional relationships without clear ownership

---

## Key Reminders

**Repository:**
- ✅ Extend `JpaRepository<Entity, ID>`
- ✅ Use derived query methods when possible
- ✅ Use `@Query` for complex queries
- ✅ Use native SQL only when JPQL insufficient
- ✅ **ALWAYS include userId for photo queries**

**User Scoping:**
- ✅ **CRITICAL** - all photo queries MUST include userId
- ✅ Use `findByIdAndUserId()` instead of `findById()`
- ✅ Service methods MUST accept userId parameter
- ✅ Never allow users to access other users' photos

**Entities:**
- ✅ Use Lombok annotations
- ✅ `FetchType.LAZY` for relationships
- ✅ Add indexes on frequently queried columns
- ✅ Use lifecycle hooks (@PrePersist, @PreUpdate)
- ✅ NO business logic in entities
