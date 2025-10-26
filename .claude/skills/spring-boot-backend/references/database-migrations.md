# Database Migrations - Flyway

## Flyway Pattern

**Flyway manages database schema changes with versioned SQL files.**

### Directory Structure

```
src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_photos_table.sql
├── V3__add_rating_column.sql
└── V4__add_indexes.sql
```

### Naming Convention

**Format:** `V{version}__{description}.sql`

- `V` - Version prefix (required)
- `{version}` - Sequential number (1, 2, 3...)
- `__` - Double underscore separator
- `{description}` - Snake_case description

---

## Migration Examples

### V1__create_users_table.sql

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### V2__create_photos_table.sql

```sql
CREATE TABLE photos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    original_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    taken_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_taken_at ON photos(taken_at);
CREATE INDEX idx_photos_rating ON photos(rating);
```

### V3__add_rating_column.sql

```sql
ALTER TABLE photos ADD COLUMN description TEXT;
```

---

## Configuration

### application.properties

```properties
# Flyway configuration
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
```

---

## Best Practices

### DO:
- ✅ Use sequential versioning (V1, V2, V3...)
- ✅ Test migrations on local database before committing
- ✅ Keep migrations simple - one logical change per file
- ✅ Add indexes in separate migrations (easier to rollback)
- ✅ Use descriptive names (create_users_table, add_rating_column)

### DON'T:
- ❌ NEVER modify existing migrations after deployment
- ❌ NEVER use DROP TABLE in production migrations
- ❌ NEVER skip version numbers
- ❌ NEVER commit untested migrations

---

## Rollback Pattern

```sql
-- V5__add_description_column.sql
ALTER TABLE photos ADD COLUMN description TEXT;

-- If rollback needed, create new migration:
-- V6__remove_description_column.sql
ALTER TABLE photos DROP COLUMN description;
```

**Note:** Flyway doesn't support automatic rollback. Create new migration to reverse changes.

---

## Key Reminders

- ✅ Sequential versioning (V1, V2, V3...)
- ✅ Never modify existing migrations
- ✅ Test locally before commit
- ✅ One logical change per migration
- ✅ Use new migration for rollback
