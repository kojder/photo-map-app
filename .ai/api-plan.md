# REST API Specification - Photo Map MVP

**Version:** 1.0
**Date:** 2025-10-19
**Framework:** Spring Boot 3
**Base URL:** `/api`

---

## Overview

REST API dla Photo Map MVP zapewnia endpointy do:
- **Authentication** - Rejestracja i logowanie użytkowników (JWT tokens)
- **Photos** - Upload, przeglądanie, ocenianie i usuwanie zdjęć
- **Admin** - Zarządzanie użytkownikami (tylko dla ADMIN role)

**Security:**
- JWT Bearer tokens w header `Authorization: Bearer <token>`
- Stateless authentication (no sessions)
- Password hashing: BCrypt

**Content Types:**
- Request: `application/json` (lub `multipart/form-data` dla upload)
- Response: `application/json`

**Error Handling:**
- Consistent error response format (ErrorResponse DTO)
- Standard HTTP status codes

---

## Authentication

### POST /api/auth/register

**Opis:** Rejestracja nowego użytkownika.

**Security:** Public (no authentication required)

**Request:** `{ email, password }`

**Response (201 Created):** `{ id, email, role, createdAt }`

**Error Responses:**
- **400 Bad Request** - Email już istnieje, invalid email format, password < 8 znaków

**Validation:**
- `email` - NOT NULL, valid format, UNIQUE
- `password` - NOT NULL, min 8 characters

---

### POST /api/auth/login

**Opis:** Logowanie użytkownika i otrzymanie JWT token.

**Security:** Public (no authentication required)

**Request:** `{ email, password }`

**Response (200 OK):** `{ token, type: "Bearer", expiresIn: 86400, user: { id, email, role } }`

**Error Responses:**
- **401 Unauthorized** - Invalid email or password

**JWT Token:**
- Expiration: 24 hours (86400s)
- Payload: `{ sub: userId, email, role }`
- Algorithm: HMAC256

---

## Photos

### GET /api/photos

**Opis:** Pobiera listę wszystkich zdjęć z filtrowaniem.

**Security:** Requires authentication (JWT token)

**Query Parameters:**
- `dateFrom`, `dateTo` (optional) - ISO 8601 date (np. `2024-01-01`)
- `minRating` (optional) - Integer 1-5
- `hasGps` (optional) - Boolean
- `page` (optional) - Integer, default 0
- `size` (optional) - Integer, default 20
- `sort` (optional) - String, default `uploadedAt,desc` (options: `uploadedAt`, `takenAt`, `filename`)

**Response (200 OK):**
- `content[]` - Array of photos:
  - `id, filename, originalFilename, thumbnailUrl, fileSize, mimeType`
  - `gpsLatitude, gpsLongitude`
  - `takenAt, uploadedAt`
  - `averageRating, totalRatings, userRating`
- `page` - Pagination info: `{ size, number, totalElements, totalPages }`

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token

---

### GET /api/photos/{id}

**Opis:** Pobiera szczegóły pojedynczego zdjęcia.

**Security:** Requires authentication (JWT token)

**Path Parameters:** `id` - Photo ID

**Response (200 OK):** Same as GET /api/photos + `fullUrl`

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token
- **404 Not Found** - Photo not found

---

### POST /api/photos

**Opis:** Upload zdjęcia z asynchronicznym przetwarzaniem (Spring Integration).

**Security:** Requires authentication

**Content-Type:** `multipart/form-data`

**Request Body:** `file` - Photo file (JPEG, PNG)

**Response (202 Accepted):**
```json
{
  "message": "Photo queued for processing",
  "filename": "uuid.jpg",
  "status": "processing"
}
```

**Processing Steps:**
1. Validate file (type: JPEG/PNG, size: max 10MB)
2. Save to `input/` directory with UUID filename
3. Return 202 Accepted (processing starts asynchronously)
4. **Background processing (Spring Integration):**
   - Poller detects file in `input/` (10s interval)
   - Extract EXIF metadata (GPS, camera, date)
   - Generate 3 thumbnails (150px, 400px, 800px)
   - Move original to `original/`, thumbnails to `small/`, `medium/`, `large/`
   - Save metadata to database (user_id = admin)
   - On error: move to `failed/` + error log

**Error Responses:**
- **400 Bad Request** - Invalid file format, file too large (max 10MB)
- **401 Unauthorized** - Missing or invalid JWT token

**Validation:**
- `file` - NOT NULL, max 10MB
- Allowed MIME: `image/jpeg`, `image/png`

**Batch Upload Alternative:**
- Users can upload multiple photos directly to `input/` via scp/ftp
- Spring Integration will process them automatically

---

### GET /api/photos/{id}/thumbnail

**Opis:** Pobiera thumbnail zdjęcia (400x300px).

**Security:** Requires authentication (JWT token)

**Response (200 OK):** Binary image data (Content-Type: `image/jpeg`)

**Error Responses:** 401 (no token), 404 (not found)

---

### GET /api/photos/{id}/full

**Opis:** Pobiera pełne zdjęcie (original).

**Security:** Requires authentication (JWT token)

**Response (200 OK):** Binary image data (Content-Type: odpowiedni MIME type)

**Error Responses:** 401 (no token), 404 (not found)

---

### PUT /api/photos/{id}/rating

**Opis:** Ocenia zdjęcie (lub aktualizuje istniejącą ocenę).

**Security:** Requires authentication

**Request Body:** `{ rating }` (Integer 1-5)

**Response (200 OK):** `{ id, photoId, userId, rating, createdAt }`

**Error Responses:**
- **400 Bad Request** - Rating out of range (1-5)
- **401 Unauthorized** - Missing or invalid JWT token
- **404 Not Found** - Photo not found

**Business Rules:**
- Jeden użytkownik = jedna ocena na photo (update jeśli już ocenił)
- Rating: 1-5 gwiazdek

**Personalized Rating Display Logic:**
Backend zwraca 3 pola: `averageRating`, `totalRatings`, `userRating`

**`averageRating` (backend calculation - PhotoController.calculateDisplayRating):**
- Jeśli current user ocenił zdjęcie → zwraca **jego własną ocenę** (= `userRating`)
- Jeśli current user NIE ocenił → zwraca **średnią ocen innych użytkowników**
- Jeśli nikt nie ocenił → `null`

**`userRating`:**
- Ocena current user (1-5) lub `null` jeśli nie ocenił

**`totalRatings`:**
- Liczba wszystkich ocen dla zdjęcia

**Frontend display:**
- Wyświetla `averageRating` z kontekstem:
  - Jeśli `userRating` istnieje → "(your rating)"
  - Jeśli `userRating` null → "(X ratings)" gdzie X = `totalRatings`

---

### DELETE /api/photos/{id}/rating

**Opis:** Usuwa ocenę użytkownika ze zdjęcia (clear rating).

**Security:** Requires authentication

**Response (204 No Content):** Empty body

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token
- **404 Not Found** - Photo not found lub user nie ocenił tego zdjęcia

**Business Rules:**
- Użytkownik może usunąć tylko własną ocenę
- Jeśli użytkownik nie ocenił zdjęcia - 404 Not Found

---

### DELETE /api/photos/{id}

**Opis:** Usuwa zdjęcie (wraz z plikami i ocenami).

**Security:** Requires authentication (JWT token)

**Response (204 No Content):** Empty body

**Deletion Flow:**
1. Delete ratings (CASCADE from database)
2. Delete thumbnail file from filesystem
3. Delete original file from filesystem
4. Delete photo record from database

**Error Responses:** 401 (no token), 404 (not found)

---

## Admin Endpoints

### GET /api/admin/users

**Opis:** Pobiera listę wszystkich użytkowników (paginacja).

**Security:** Requires ADMIN role

**Query Parameters:**
- `page` (optional) - Integer, default 0
- `size` (optional) - Integer, default 20
- `sort` (optional) - String, default `createdAt,desc`

**Response (200 OK):**
- `content[]` - Array of users: `{ id, email, role, createdAt, totalPhotos }`
- `page` - Pagination info

**Error Responses:** 401 (no token), 403 (not ADMIN)

---

### PUT /api/admin/users/{id}/role

**Opis:** Zmienia rolę użytkownika (USER ↔ ADMIN).

**Security:** Requires ADMIN role

**Request Body:** `{ role }` (USER | ADMIN)

**Response (200 OK):** `{ id, email, role, createdAt }`

**Error Responses:** 400 (invalid role), 401 (no token), 403 (not ADMIN), 404 (user not found)

---

### DELETE /api/admin/users/{id}

**Opis:** Usuwa użytkownika (wraz z jego zdjęciami i ocenami).

**Security:** Requires ADMIN role

**Response (204 No Content):** Empty body

**Deletion Flow:**
1. Delete all user's ratings (CASCADE)
2. Delete all user's photos (files + database records, CASCADE)
3. Delete user record

**Error Responses:**
- **400 Bad Request** - Cannot delete yourself
- 401 (no token), 403 (not ADMIN), 404 (user not found)

---

## DTOs (Data Transfer Objects)

### Request DTOs

- **RegisterRequest:** `{ email, password }` - Validation: `@NotBlank`, `@Email`, `@Size(min=8)`
- **LoginRequest:** `{ email, password }` - Validation: `@NotBlank`
- **RatingRequest:** `{ rating }` - Validation: `@NotNull`, `@Min(1)`, `@Max(5)`
- **UpdateRoleRequest:** `{ role }` - Validation: `@NotNull`, enum Role

### Response DTOs

- **UserResponse:** `{ id, email, role, createdAt }`
- **LoginResponse:** `{ token, type, expiresIn, user: UserResponse }`
- **PhotoResponse:** `{ id, filename, originalFilename, thumbnailUrl, fileSize, mimeType, gpsLatitude, gpsLongitude, takenAt, uploadedAt, averageRating, totalRatings, userRating }`
- **RatingResponse:** `{ id, photoId, userId, rating, createdAt }`
- **PageResponse<T>:** `{ content: List<T>, page: PageInfo }`
- **PageInfo:** `{ size, number, totalElements, totalPages }`
- **ErrorResponse:** `{ timestamp, status, error, message, path }`

**Implementation:** Java records z validation annotations

---

## HTTP Status Codes Summary

| Code | Status | Usage |
|------|--------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User doesn't have permission (e.g., not ADMIN, not photo owner) |
| 404 | Not Found | Resource not found (photo, user) |
| 500 | Internal Server Error | Server-side errors (file processing, database) |

---

## Security & Authorization

### JWT Token Flow

1. **User logs in** → POST /api/auth/login
2. **Server generates JWT** with payload: `{ sub: userId, email, role }`
3. **Client stores token** (localStorage or sessionStorage)
4. **Client sends token** in every request: `Authorization: Bearer <token>`
5. **Server validates token** with JWT filter
6. **Token expires** after 24 hours → user must login again

### Authorization Rules

| Endpoint | Allowed Roles | Additional Rules |
|----------|---------------|------------------|
| POST /api/auth/register | Public | - |
| POST /api/auth/login | Public | - |
| GET /api/photos | USER, ADMIN | - |
| GET /api/photos/{id} | USER, ADMIN | - |
| POST /api/photos | USER, ADMIN | - |
| PUT /api/photos/{id}/rating | USER, ADMIN | - |
| DELETE /api/photos/{id}/rating | USER, ADMIN | Can only delete own rating |
| DELETE /api/photos/{id} | USER, ADMIN | - |
| GET /api/admin/users | ADMIN | - |
| PUT /api/admin/users/{id}/role | ADMIN | - |
| DELETE /api/admin/users/{id} | ADMIN | Cannot delete yourself |

---

## Error Handling Strategy

### Global Exception Handler

**Implementation:** `@RestControllerAdvice` class

**Obsługiwane wyjątki:**
- `EntityNotFoundException` → 404 NOT_FOUND
- `AccessDeniedException` → 403 FORBIDDEN
- `MethodArgumentNotValidException` → 400 BAD_REQUEST (validation errors)
- `IllegalArgumentException` → 400 BAD_REQUEST
- `Exception` (fallback) → 500 INTERNAL_SERVER_ERROR

**Error Response Format:** `{ timestamp, status, error, message, path }`

**Validation Errors:** Collect all field errors → join messages with ", "

---

**Dokument przygotowany dla:** Claude Code - Photo Map MVP Implementation
**Następny krok:** Implementacja Spring Boot controllers + services zgodnie ze specyfikacją
