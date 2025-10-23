# Database Schema - Photo Map MVP

**Version:** 1.0
**Date:** 2025-10-19
**Database:** PostgreSQL 15
**ORM:** Spring Data JPA + Hibernate

---

## Overview

Database schema dla Photo Map MVP składa się z 3 głównych tabel:
- **users** - Użytkownicy systemu (auth, roles)
- **photos** - Zdjęcia z metadanymi EXIF i GPS
- **ratings** - Oceny zdjęć (1-10 stars)

**Design Principles:**
- Normalizacja - 3NF
- Foreign keys z ON DELETE CASCADE dla data integrity
- Indexes na często używanych kolumnach (user_id, GPS coordinates)
- Timestamps (created_at, updated_at) dla audytu
- Soft deletes NIE są używane (hard deletes dla prostoty MVP)
- Password hashing: BCrypt (~60 znaków)
- UUID-based filenames dla zdjęć

---

## Tables

### 1. users

**Opis:** Użytkownicy systemu z autentykacją i rolami.

**Kolumny:**
- `id` - BIGSERIAL PRIMARY KEY (auto-increment)
- `email` - VARCHAR(255) UNIQUE NOT NULL (używany do logowania)
- `password_hash` - VARCHAR(255) NOT NULL (BCrypt hash, ~60 znaków)
- `role` - VARCHAR(50) NOT NULL DEFAULT 'USER' (wartości: USER | ADMIN)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP (trigger auto-update)

**Constraints:**
- `email` - UNIQUE, NOT NULL
- `role` - CHECK (role IN ('USER', 'ADMIN'))

**Indexes:**
- `users_email_idx` - UNIQUE INDEX na `email` (login queries)

---

### 2. photos

**Opis:** Zdjęcia z metadanymi EXIF, GPS i thumbnails.

**Kolumny:**
- `id` - BIGSERIAL PRIMARY KEY (auto-increment)
- `user_id` - BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE (owner zdjęcia)
- `filename` - VARCHAR(500) NOT NULL (UUID-based, np. `a1b2c3d4-e5f6.jpg`)
- `original_filename` - VARCHAR(500) NOT NULL (oryginalna nazwa, np. `IMG_1234.JPG`)
- `file_size` - BIGINT NOT NULL (rozmiar w bajtach)
- `mime_type` - VARCHAR(100) NOT NULL (np. `image/jpeg`, `image/png`, `image/heic`)
- `thumbnail_filename` - VARCHAR(500) NULLABLE (generated thumbnails)
- `gps_latitude` - DECIMAL(10, 8) NULLABLE (szerokość geograficzna: -90 do 90)
- `gps_longitude` - DECIMAL(11, 8) NULLABLE (długość geograficzna: -180 do 180)
- `taken_at` - TIMESTAMP NULLABLE (data wykonania zdjęcia z EXIF)
- `uploaded_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP (trigger auto-update)

**Constraints:**
- `user_id` - NOT NULL, FOREIGN KEY
- `filename` - NOT NULL
- `gps_latitude` - CHECK (gps_latitude BETWEEN -90 AND 90)
- `gps_longitude` - CHECK (gps_longitude BETWEEN -180 AND 180)

**Indexes:**
- `photos_user_id_idx` - INDEX na `user_id` (query: "moje zdjęcia")
- `photos_gps_idx` - INDEX na `(gps_latitude, gps_longitude)` (query: "zdjęcia w okolicy")
- `photos_taken_at_idx` - INDEX na `taken_at` (filtrowanie po dacie)
- `photos_uploaded_at_idx` - INDEX na `uploaded_at` (sortowanie)

**ON DELETE CASCADE:**
- Usunięcie użytkownika → usunięcie wszystkich jego zdjęć

---

### 3. ratings

**Opis:** Oceny zdjęć przez użytkowników (1-10 stars).

**Kolumny:**
- `id` - BIGSERIAL PRIMARY KEY (auto-increment)
- `photo_id` - BIGINT NOT NULL REFERENCES photos(id) ON DELETE CASCADE (oceniane zdjęcie)
- `user_id` - BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE (użytkownik oceniający)
- `rating` - INTEGER NOT NULL (ocena 1-10)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Constraints:**
- `photo_id` - NOT NULL, FOREIGN KEY
- `user_id` - NOT NULL, FOREIGN KEY
- `rating` - CHECK (rating BETWEEN 1 AND 10)
- `UNIQUE(photo_id, user_id)` - Jeden użytkownik może ocenić dane zdjęcie tylko raz

**Indexes:**
- `ratings_photo_id_idx` - INDEX na `photo_id` (query: "oceny dla zdjęcia")
- `ratings_user_id_idx` - INDEX na `user_id` (query: "oceny użytkownika")
- `ratings_photo_user_unique_idx` - UNIQUE INDEX na `(photo_id, user_id)` (przez constraint)

**ON DELETE CASCADE:**
- Usunięcie zdjęcia → usunięcie wszystkich jego ocen
- Usunięcie użytkownika → usunięcie wszystkich jego ocen

---

## Relationships

### Entity Relationship Diagram (ERD)

```
users (1) ----< (N) photos
  |                   |
  |                   |
  +----< (N) ratings >----+
```

**Relacje:**
1. **users → photos** (1:N)
   - Jeden użytkownik może mieć wiele zdjęć
   - Jedno zdjęcie należy do jednego użytkownika
   - Foreign key: `photos.user_id → users.id`
   - ON DELETE CASCADE

2. **photos → ratings** (1:N)
   - Jedno zdjęcie może mieć wiele ocen
   - Jedna ocena dotyczy jednego zdjęcia
   - Foreign key: `ratings.photo_id → photos.id`
   - ON DELETE CASCADE

3. **users → ratings** (1:N)
   - Jeden użytkownik może wystawić wiele ocen
   - Jedna ocena jest wystawiona przez jednego użytkownika
   - Foreign key: `ratings.user_id → users.id`
   - ON DELETE CASCADE

---

## Indexes Summary

**Purpose:** Optymalizacja zapytań dla MVP.

| Index Name | Table | Columns | Type | Rationale |
|------------|-------|---------|------|-----------|
| `users_email_idx` | users | email | UNIQUE | Login queries |
| `photos_user_id_idx` | photos | user_id | INDEX | "My photos" queries |
| `photos_gps_idx` | photos | (gps_latitude, gps_longitude) | INDEX | Map viewport queries |
| `photos_taken_at_idx` | photos | taken_at | INDEX | Date filtering |
| `photos_uploaded_at_idx` | photos | uploaded_at | INDEX | Recent photos sorting |
| `ratings_photo_id_idx` | ratings | photo_id | INDEX | Photo ratings queries |
| `ratings_user_id_idx` | ratings | user_id | INDEX | User ratings queries |
| `ratings_photo_user_unique_idx` | ratings | (photo_id, user_id) | UNIQUE | One rating per user per photo |

---

## Constraints Summary

| Constraint | Table | Type | Rule |
|------------|-------|------|------|
| email UNIQUE | users | UNIQUE | No duplicate emails |
| role CHECK | users | CHECK | role IN ('USER', 'ADMIN') |
| gps_latitude CHECK | photos | CHECK | BETWEEN -90 AND 90 |
| gps_longitude CHECK | photos | CHECK | BETWEEN -180 AND 180 |
| rating CHECK | ratings | CHECK | BETWEEN 1 AND 10 |
| (photo_id, user_id) UNIQUE | ratings | UNIQUE | One rating per user per photo |

---

## JPA Entity Requirements

### User Entity
- **Package:** `com.photomap.model`
- **Annotations:** `@Entity`, `@Table(name = "users")`, `@Data` (Lombok)
- **Fields:** id, email, passwordHash, role (enum: USER/ADMIN), createdAt, updatedAt
- **Timestamps:** `@CreationTimestamp`, `@UpdateTimestamp` (Hibernate)
- **Relationships:**
  - `@OneToMany` → photos (cascade ALL, orphanRemoval)
  - `@OneToMany` → ratings (cascade ALL, orphanRemoval)

### Photo Entity
- **Package:** `com.photomap.model`
- **Annotations:** `@Entity`, `@Table` z indexes, `@Data`
- **Fields:** id, user, filename, originalFilename, fileSize, mimeType, thumbnailFilename, gpsLatitude, gpsLongitude, takenAt, uploadedAt, updatedAt
- **Types:** `BigDecimal` dla GPS coordinates, `Instant` dla timestamps
- **Relationships:**
  - `@ManyToOne(LAZY)` → user (NOT NULL)
  - `@OneToMany` → ratings (cascade ALL, orphanRemoval)
- **Indexes:** JPA `@Index` annotations dla user_id, GPS, taken_at, uploaded_at

### Rating Entity
- **Package:** `com.photomap.model`
- **Annotations:** `@Entity`, `@Table` z uniqueConstraint i indexes, `@Data`
- **Fields:** id, photo, user, rating, createdAt
- **Relationships:**
  - `@ManyToOne(LAZY)` → photo (NOT NULL)
  - `@ManyToOne(LAZY)` → user (NOT NULL)
- **Constraints:** `@UniqueConstraint` na (photo_id, user_id)

---

## Migration Strategy

**Tool:** Flyway

**Convention:**
- `V1__initial_schema.sql` - Initial schema (users, photos, ratings)
- `V2__add_xyz.sql` - Kolejne migracje

**Migration Flow:**
1. Create tables (users → photos → ratings) z foreign keys
2. Create indexes (email, user_id, GPS, dates)
3. Create trigger function `update_updated_at_column()`
4. Attach triggers do users i photos dla auto-update `updated_at`

---

**Dokument przygotowany dla:** Claude Code - Photo Map MVP Implementation
**Następny krok:** Implementacja Spring Data JPA repositories zgodnie ze schematem
