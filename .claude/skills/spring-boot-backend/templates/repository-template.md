# Repository Interface Template

## Structure

```java
@Repository
public interface {ResourceName}Repository extends JpaRepository<{ResourceName}, Long> {

    // CRITICAL: User scoping - ALWAYS include userId
    Optional<{ResourceName}> findByIdAndUserId(Long id, Long userId);

    List<{ResourceName}> findByUserId(Long userId);

    // Derived query methods
    List<{ResourceName}> findByUserIdOrderBy{Field}Desc(Long userId);

    List<{ResourceName}> findByUserIdAnd{Field}(Long userId, {Type} field);

    // Custom JPQL query
    @Query("SELECT r FROM {ResourceName} r WHERE r.user.id = :userId")
    List<{ResourceName}> customQuery(@Param("userId") Long userId);

    // Count/Exists
    long countByUserId(Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
```

## Checklist

- [ ] Extends JpaRepository<Entity, Long>
- [ ] User scoping methods (findByIdAndUserId)
- [ ] Derived query methods follow naming convention
- [ ] Custom @Query includes userId parameter
- [ ] All methods include userId for user scoping

## Key Rules

- ✅ ALWAYS include userId in photo/resource queries
- ✅ Use findByIdAndUserId() instead of findById()
- ✅ Prefer derived queries over custom @Query
- ✅ Use @Query for complex queries
- ✅ Use native SQL only when JPQL insufficient
