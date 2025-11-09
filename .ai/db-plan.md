# Database Schema - Photo Map MVP

**Version:** 2.0
**Date:** 2025-11-04
**Database:** PostgreSQL 15
**ORM:** Spring Data JPA + Hibernate

---

## Overview

Database schema for Photo Map MVP consists of 4 main tables:
- **users** - System users (auth, roles, permissions)
- **photos** - Photos with EXIF metadata and GPS
- **ratings** - Photo ratings (1-5 stars)
- **app_settings** - Global application settings

**Design Principles:**
- Normalization - 3NF
- Foreign keys with ON DELETE CASCADE for data integrity
- Indexes on frequently used columns (user_id, GPS coordinates, dates)
- Timestamps (created_at, updated_at) for audit trail
- Soft deletes NOT used (hard deletes for MVP simplicity)
- Password hashing: BCrypt (~60 characters)
- UUID-based filenames for photos

---

## Tables

### 1. users

**Description:** System users with authentication, roles, and permissions.

**Columns:**
- `id` - BIGSERIAL PRIMARY KEY (auto-increment)
- `email` - VARCHAR(255) UNIQUE NOT NULL (used for login)
- `password_hash` - VARCHAR(255) NOT NULL (BCrypt hash, ~60 characters)
- `role` - VARCHAR(50) NOT NULL DEFAULT 'USER' (values: USER | ADMIN)
- `must_change_password` - BOOLEAN NOT NULL DEFAULT FALSE (force password change on next login)
- `can_upload` - BOOLEAN NOT NULL DEFAULT TRUE (permission to upload photos)
- `can_rate` - BOOLEAN NOT NULL DEFAULT TRUE (permission to rate photos)
- `can_view_photos` - BOOLEAN NOT NULL DEFAULT TRUE (permission to view photos)
- `is_active` - BOOLEAN NOT NULL DEFAULT TRUE (account active status)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP (auto-update via trigger)

**Constraints:**
- `email` - UNIQUE, NOT NULL
- `role` - CHECK (role IN ('USER', 'ADMIN'))

**Indexes:**
- `users_email_idx` - UNIQUE INDEX on `email` (login queries)
- `users_role_idx` - INDEX on `role` (admin queries)

**Permissions System:**
- `can_view_photos` - Controls access to photo list and viewing endpoints
- `can_rate` - Controls ability to rate photos
- `can_upload` - Controls ability to upload new photos
- `is_active` - Account enabled/disabled status

---

### 2. photos

**Description:** Photos with EXIF metadata, GPS, and thumbnails.

**Columns:**
- `id` - BIGSERIAL PRIMARY KEY (auto-increment)
- `user_id` - BIGINT NULLABLE REFERENCES users(id) ON DELETE SET NULL (photo owner, null for batch uploads or orphaned photos)
- `filename` - VARCHAR(500) NOT NULL (UUID-based, e.g., `a1b2c3d4-e5f6.jpg` or `{userId}_{uuid}.jpg`)
- `original_filename` - VARCHAR(500) NOT NULL (original name, e.g., `IMG_1234.JPG`)
- `file_size` - BIGINT NOT NULL (size in bytes)
- `mime_type` - VARCHAR(100) NOT NULL (e.g., `image/jpeg`, `image/png`)
- `thumbnail_filename` - VARCHAR(500) NULLABLE (generated thumbnail filename)
- `gps_latitude` - DECIMAL(10, 8) NULLABLE (latitude: -90 to 90)
- `gps_longitude` - DECIMAL(11, 8) NULLABLE (longitude: -180 to 180)
- `taken_at` - TIMESTAMP NULLABLE (photo taken date from EXIF)
- `uploaded_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP (auto-update via trigger)

**Constraints:**
- `filename` - NOT NULL
- `gps_latitude` - CHECK (gps_latitude BETWEEN -90 AND 90)
- `gps_longitude` - CHECK (gps_longitude BETWEEN -180 AND 180)

**Indexes:**
- `photos_user_id_idx` - INDEX on `user_id` (query: "my photos")
- `photos_gps_idx` - INDEX on `(gps_latitude, gps_longitude)` (query: "photos in area")
- `photos_taken_at_idx` - INDEX on `taken_at` (date filtering)
- `photos_uploaded_at_idx` - INDEX on `uploaded_at` (sorting)

**ON DELETE SET NULL:**
- User deletion → photos remain as orphaned (user_id = NULL)
- Orphaned photos can be managed separately by admin (see V6 migration)
- Admin can bulk delete orphaned photos or reassign them to another user

**Note:** `user_id` is NULLABLE to support batch uploads via scp/ftp where photos are uploaded directly to `input/` folder without web interface authentication.

---

### 3. ratings

**Description:** Photo ratings by users (1-5 stars).

**Columns:**
- `id` - BIGSERIAL PRIMARY KEY (auto-increment)
- `photo_id` - BIGINT NOT NULL REFERENCES photos(id) ON DELETE CASCADE (rated photo)
- `user_id` - BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE (rating user)
- `rating` - INTEGER NOT NULL (rating 1-5 stars)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Constraints:**
- `photo_id` - NOT NULL, FOREIGN KEY
- `user_id` - NOT NULL, FOREIGN KEY
- `rating` - CHECK (rating BETWEEN 1 AND 5)
- `UNIQUE(photo_id, user_id)` - One user can rate a photo only once

**Note:** Photos without ratings - if a photo has no records in the ratings table, it means it hasn't been rated yet. Users can delete their rating (DELETE rating record).

**Indexes:**
- `ratings_photo_id_idx` - INDEX on `photo_id` (query: "ratings for photo")
- `ratings_user_id_idx` - INDEX on `user_id` (query: "user ratings")
- `ratings_photo_user_unique_idx` - UNIQUE INDEX on `(photo_id, user_id)` (via constraint)

**ON DELETE CASCADE:**
- Photo deletion → delete all its ratings
- User deletion → delete all their ratings

---

### 4. app_settings

**Description:** Global application settings (key-value store).

**Columns:**
- `id` - BIGSERIAL PRIMARY KEY (auto-increment)
- `setting_key` - VARCHAR(255) NOT NULL UNIQUE (setting identifier)
- `setting_value` - TEXT NULLABLE (setting value)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP (auto-update via trigger)

**Constraints:**
- `setting_key` - UNIQUE, NOT NULL

**Indexes:**
- `idx_app_settings_key` - INDEX on `setting_key` (fast lookup)

**Default Settings:**
- `admin_contact_email` - Contact email displayed to users (default: `admin@photomap.local`)

---

## Relationships

### Entity Relationship Diagram (ERD)

```
users (1) ----< (N) photos
  |                   |
  |                   |
  +----< (N) ratings >----+

app_settings (standalone table)
```

**Relations:**
1. **users → photos** (1:N)
   - One user can have many photos
   - One photo belongs to one user (or null for batch uploads)
   - Foreign key: `photos.user_id → users.id`
   - ON DELETE CASCADE

2. **photos → ratings** (1:N)
   - One photo can have many ratings
   - One rating refers to one photo
   - Foreign key: `ratings.photo_id → photos.id`
   - ON DELETE CASCADE

3. **users → ratings** (1:N)
   - One user can give many ratings
   - One rating is given by one user
   - Foreign key: `ratings.user_id → users.id`
   - ON DELETE CASCADE

---

## Indexes Summary

**Purpose:** Query optimization for MVP.

| Index Name | Table | Columns | Type | Rationale |
|------------|-------|---------|------|-----------|
| `users_email_idx` | users | email | UNIQUE | Login queries |
| `users_role_idx` | users | role | INDEX | Admin user queries |
| `photos_user_id_idx` | photos | user_id | INDEX | "My photos" queries |
| `photos_gps_idx` | photos | (gps_latitude, gps_longitude) | INDEX | Map viewport queries |
| `photos_taken_at_idx` | photos | taken_at | INDEX | Date filtering |
| `photos_uploaded_at_idx` | photos | uploaded_at | INDEX | Recent photos sorting |
| `ratings_photo_id_idx` | ratings | photo_id | INDEX | Photo ratings queries |
| `ratings_user_id_idx` | ratings | user_id | INDEX | User ratings queries |
| `ratings_photo_user_unique_idx` | ratings | (photo_id, user_id) | UNIQUE | One rating per user per photo |
| `idx_app_settings_key` | app_settings | setting_key | INDEX | Settings lookup |

---

## Constraints Summary

| Constraint | Table | Type | Rule |
|------------|-------|------|------|
| email UNIQUE | users | UNIQUE | No duplicate emails |
| role CHECK | users | CHECK | role IN ('USER', 'ADMIN') |
| gps_latitude CHECK | photos | CHECK | BETWEEN -90 AND 90 |
| gps_longitude CHECK | photos | CHECK | BETWEEN -180 AND 180 |
| rating CHECK | ratings | CHECK | BETWEEN 1 AND 5 |
| (photo_id, user_id) UNIQUE | ratings | UNIQUE | One rating per user per photo |
| setting_key UNIQUE | app_settings | UNIQUE | One value per setting key |

---

## JPA Entity Requirements

### User Entity
- **Package:** `com.photomap.model`
- **Annotations:** `@Entity`, `@Table(name = "users")`, `@Data` (Lombok)
- **Fields:**
  - id, email, passwordHash, role (enum: USER/ADMIN)
  - mustChangePassword, canUpload, canRate, canViewPhotos, isActive
  - createdAt, updatedAt
- **Timestamps:** `@CreationTimestamp`, `@UpdateTimestamp` (Hibernate)
- **Relationships:**
  - `@OneToMany` → photos (cascade ALL, orphanRemoval)
  - `@OneToMany` → ratings (cascade ALL, orphanRemoval)

### Photo Entity
- **Package:** `com.photomap.model`
- **Annotations:** `@Entity`, `@Table` with indexes, `@Data`
- **Fields:**
  - id, user, filename, originalFilename, fileSize, mimeType
  - thumbnailFilename, gpsLatitude, gpsLongitude
  - takenAt, uploadedAt, updatedAt
- **Types:** `BigDecimal` for GPS coordinates, `Instant` for timestamps
- **Relationships:**
  - `@ManyToOne(LAZY)` → user (NULLABLE - supports batch uploads)
  - `@OneToMany` → ratings (cascade ALL, orphanRemoval)
- **Indexes:** JPA `@Index` annotations for user_id, GPS, taken_at, uploaded_at

### Rating Entity
- **Package:** `com.photomap.model`
- **Annotations:** `@Entity`, `@Table` with uniqueConstraint and indexes, `@Data`
- **Fields:** id, photo, user, rating, createdAt
- **Relationships:**
  - `@ManyToOne(LAZY)` → photo (NOT NULL)
  - `@ManyToOne(LAZY)` → user (NOT NULL)
- **Constraints:** `@UniqueConstraint` on (photo_id, user_id)

### AppSettings Entity
- **Package:** `com.photomap.model`
- **Annotations:** `@Entity`, `@Table(name = "app_settings")`, `@Data`
- **Fields:** id, settingKey, settingValue, createdAt, updatedAt
- **Timestamps:** `@CreationTimestamp`, `@UpdateTimestamp` (Hibernate)

---

## Migration Strategy

**Tool:** Flyway

**Convention:**
- `V1__initial_schema.sql` - Initial schema (users, photos, ratings)
- `V2__add_admin_security.sql` - Add must_change_password + users_role_idx
- `V3__add_user_permissions.sql` - Add can_upload, can_rate, is_active
- `V4__make_user_id_nullable.sql` - Make photos.user_id NULLABLE
- `V5__add_can_view_photos_and_settings.sql` - Add can_view_photos + app_settings table

**Migration Flow:**
1. V1: Create tables (users → photos → ratings) with foreign keys
2. V1: Create indexes (email, user_id, GPS, dates)
3. V1: Create trigger function `update_updated_at_column()`
4. V1: Attach triggers to users and photos for auto-update `updated_at`
5. V2: Add must_change_password column + users_role_idx
6. V3: Add can_upload, can_rate, is_active columns
7. V4: Make photos.user_id NULLABLE (batch upload support)
8. V5: Add can_view_photos + app_settings table + idx_app_settings_key

---

**Document prepared for:** Claude Code - Photo Map MVP Implementation
**Current status:** ✅ Core MVP Complete - All tables implemented and tested
**Last updated:** 2025-11-04
