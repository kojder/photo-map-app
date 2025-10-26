# Entity Class Template

## Structure

```java
@Entity
@Table(name = "{table_name}", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_{field}", columnList = "{field}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class {EntityName} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // CRITICAL: User relationship (FetchType.LAZY)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String field;

    // TODO: Add fields

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

## Checklist

- [ ] @Entity and @Table with table name
- [ ] Indexes on frequently queried columns
- [ ] Lombok annotations (@Getter, @Setter, @Builder)
- [ ] User relationship (FetchType.LAZY)
- [ ] Fields with proper @Column annotations
- [ ] @PrePersist for createdAt
- [ ] NO business logic in entity

## Key Rules

- ✅ Use Lombok annotations
- ✅ FetchType.LAZY for relationships
- ✅ Add indexes on user_id and frequently queried columns
- ✅ Use @PrePersist for timestamps
- ✅ NO business logic in entities
