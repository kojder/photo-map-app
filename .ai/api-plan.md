# REST API Specification - Photo Map MVP

**Version:** 2.0
**Date:** 2025-11-04
**Framework:** Spring Boot 3
**Base URL:** `/api`

---

## Overview

REST API for Photo Map MVP provides endpoints for:
- **Authentication** - User registration and login (JWT tokens)
- **Photos** - Upload, view, rate, and delete photos
- **Admin** - User management, photo management, permissions, settings

**Security:**
- JWT Bearer tokens in `Authorization: Bearer <token>` header
- Stateless authentication (no sessions)
- Password hashing: BCrypt

**Content Types:**
- Request: `application/json` (or `multipart/form-data` for upload)
- Response: `application/json`

**Error Handling:**
- Consistent error response format (ErrorResponse DTO)
- Standard HTTP status codes

---

## Authentication

### POST /api/auth/register

**Description:** Register a new user.

**Security:** Public (no authentication required)

**Request:** `{ email, password }`

**Response (201 Created):** `{ id, email, role, createdAt, canViewPhotos, canRate }`

**Error Responses:**
- **400 Bad Request** - Email already exists, invalid email format, password < 8 characters

**Validation:**
- `email` - NOT NULL, valid format, UNIQUE
- `password` - NOT NULL, min 8 characters

---

### POST /api/auth/login

**Description:** User login and JWT token generation.

**Security:** Public (no authentication required)

**Request:** `{ email, password }`

**Response (200 OK):** `{ token, type: "Bearer", expiresIn: 86400, user: { id, email, role, createdAt, canViewPhotos, canRate } }`

**Error Responses:**
- **401 Unauthorized** - Invalid email or password

**JWT Token:**
- Expiration: 24 hours (86400s)
- Payload: `{ sub: userId, email, role }`
- Algorithm: HMAC256

---

### GET /api/auth/me

**Description:** Get current authenticated user details.

**Security:** Requires authentication (JWT token)

**Response (200 OK):** `{ id, email, role, createdAt, canViewPhotos, canRate }`

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token

---

## Photos

### GET /api/photos

**Description:** Get list of all photos with filtering.

**Security:** Requires authentication (JWT token) + `canViewPhotos` permission

**Query Parameters:**
- `dateFrom`, `dateTo` (optional) - ISO 8601 date (e.g., `2024-01-01`)
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
- **403 Forbidden** - User doesn't have `canViewPhotos` permission

**Note:** `dateFrom` and `dateTo` are parsed with time components (00:00:00 and 23:59:59 respectively) in backend.

---

### GET /api/photos/{id}

**Description:** Get details of a single photo.

**Security:** Requires authentication (JWT token) + `canViewPhotos` permission

**Path Parameters:** `id` - Photo ID

**Response (200 OK):** Same as GET /api/photos

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User doesn't have `canViewPhotos` permission
- **404 Not Found** - Photo not found

---

### POST /api/photos

**Description:** Upload photo with asynchronous processing (Spring Integration).

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
2. Save to `input/` directory with UUID filename prefixed by userId
3. Return 202 Accepted (processing starts asynchronously)
4. **Background processing (Spring Integration):**
   - Poller detects file in `input/` (10s interval)
   - Extract EXIF metadata (GPS, camera, date)
   - Generate thumbnail (medium 300px for gallery + map)
   - Move original to `original/`, thumbnail to `medium/`
   - Save metadata to database
   - On error: move to `failed/` + error log

**Error Responses:**
- **400 Bad Request** - Invalid file format, file too large (max 10MB), file is empty
- **401 Unauthorized** - Missing or invalid JWT token

**Validation:**
- `file` - NOT NULL, max 10MB
- Allowed MIME: `image/jpeg`, `image/png`

**Batch Upload Alternative:**
- Users can upload multiple photos directly to `input/` via scp/ftp
- Spring Integration will process them automatically
- Filename format: `{userId}_{uuid}.{ext}`

---

### GET /api/photos/{id}/thumbnail

**Description:** Get photo thumbnail (300px medium size).

**Security:** Requires authentication (JWT token) + `canViewPhotos` permission (or disabled security mode)

**Response (200 OK):** Binary image data (Content-Type: `image/jpeg`)

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token (if security enabled)
- **403 Forbidden** - User doesn't have `canViewPhotos` permission
- **404 Not Found** - Photo or thumbnail file not found

---

### GET /api/photos/{id}/full

**Description:** Get full resolution photo (original).

**Security:** Requires authentication (JWT token) + `canViewPhotos` permission (or disabled security mode)

**Response (200 OK):** Binary image data (Content-Type: appropriate MIME type)

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token (if security enabled)
- **403 Forbidden** - User doesn't have `canViewPhotos` permission
- **404 Not Found** - Photo or file not found

---

### PUT /api/photos/{id}/rating

**Description:** Rate a photo (or update existing rating).

**Security:** Requires authentication + `canRate` permission

**Request Body:** `{ rating }` (Integer 1-5)

**Response (200 OK):** `{ id, photoId, userId, rating, createdAt }`

**Error Responses:**
- **400 Bad Request** - Rating out of range (1-5)
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User doesn't have `canRate` permission
- **404 Not Found** - Photo not found

**Business Rules:**
- One user = one rating per photo (update if already rated)
- Rating: 1-5 stars

**Rating Display Logic:**
Backend returns 3 fields: `averageRating`, `totalRatings`, `userRating`

**`averageRating` (backend calculation - PhotoController.calculateDisplayRating):**
- Returns **overall average rating** from all users
- Matches database filter logic (hasMinimumRating) for consistency between displayed rating and filter behavior
- If nobody rated → `null`

**`userRating`:**
- Current user's personal rating (1-5) or `null` if not rated
- Allows user to see their own rating separately from overall average

**`totalRatings`:**
- Total count of all ratings for the photo

**Frontend display:**
- Shows `averageRating` (overall average) with star rating
- Can show `userRating` separately if user has rated (e.g., "Your rating: 5 stars")
- Shows rating count: "(X ratings)" where X = `totalRatings`

---

### DELETE /api/photos/{id}/rating

**Description:** Remove user's rating from a photo (clear rating).

**Security:** Requires authentication + `canRate` permission

**Response (204 No Content):** Empty body

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User doesn't have `canRate` permission
- **404 Not Found** - Photo not found or user hasn't rated this photo

**Business Rules:**
- User can only remove their own rating
- If user hasn't rated the photo - 404 Not Found

---

### DELETE /api/photos/{id}

**Description:** Delete photo (along with files and ratings).

**Security:** Requires authentication (JWT token)

**Response (204 No Content):** Empty body

**Deletion Flow:**
1. Verify user is photo owner
2. Delete ratings (CASCADE from database)
3. Delete thumbnail file from filesystem
4. Delete original file from filesystem
5. Delete photo record from database

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User is not photo owner
- **404 Not Found** - Photo not found

---

## Admin Endpoints

### GET /api/admin/users

**Description:** Get list of all users (pagination).

**Security:** Requires ADMIN role

**Query Parameters:**
- `page` (optional) - Integer, default 0
- `size` (optional) - Integer, default 20
- `sort` (optional) - String, default `createdAt,desc`
- `searchEmail` (optional) - String, case-insensitive email search

**Response (200 OK):**
- `content[]` - Array of users: `{ id, email, role, createdAt, totalPhotos, canViewPhotos, canRate }`
- `page` - Pagination info

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User is not ADMIN

---

### PUT /api/admin/users/{id}/role

**Description:** Change user role (USER ↔ ADMIN).

**Security:** Requires ADMIN role

**Request Body:** `{ role }` (USER | ADMIN)

**Response (200 OK):** `{ id, email, role, createdAt, canViewPhotos, canRate }`

**Error Responses:**
- **400 Bad Request** - Invalid role
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User is not ADMIN
- **404 Not Found** - User not found

---

### PUT /api/admin/users/{id}/permissions

**Description:** Update user permissions (canViewPhotos, canRate).

**Security:** Requires ADMIN role

**Request Body:** `{ canViewPhotos, canRate }` (both Boolean)

**Response (200 OK):** `{ id, email, role, createdAt, canViewPhotos, canRate }`

**Error Responses:**
- **400 Bad Request** - Invalid permission values
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User is not ADMIN
- **404 Not Found** - User not found

---

### DELETE /api/admin/users/{id}

**Description:** Delete user (along with their photos and ratings).

**Security:** Requires ADMIN role

**Response (204 No Content):** Empty body

**Deletion Flow:**
1. Verify not deleting yourself
2. Delete all user's ratings (CASCADE)
3. Delete all user's photos (files + database records, CASCADE)
4. Delete user record

**Error Responses:**
- **400 Bad Request** - Cannot delete yourself
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User is not ADMIN
- **404 Not Found** - User not found

---

### GET /api/admin/settings

**Description:** Get application settings (admin contact email).

**Security:** Requires ADMIN role

**Response (200 OK):** `{ adminContactEmail }`

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User is not ADMIN

---

### PUT /api/admin/settings

**Description:** Update application settings.

**Security:** Requires ADMIN role

**Request Body:** `{ adminContactEmail }`

**Response (200 OK):** `{ adminContactEmail }`

**Error Responses:**
- **400 Bad Request** - Invalid email format
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User is not ADMIN

---

### GET /api/admin/photos

**Description:** Get list of all photos for admin (pagination).

**Security:** Requires ADMIN role

**Query Parameters:**
- `page` (optional) - Integer, default 0
- `size` (optional) - Integer, default 20
- `sort` (optional) - String, default `uploadedAt,desc`

**Response (200 OK):**
- `content[]` - Array of photos: `{ id, filename, originalFilename, thumbnailUrl, fileSize, mimeType, gpsLatitude, gpsLongitude, takenAt, uploadedAt, averageRating, totalRatings, userId, userEmail }`
- `page` - Pagination info

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User is not ADMIN

---

### DELETE /api/admin/photos/{id}

**Description:** Delete any photo by admin (regardless of owner).

**Security:** Requires ADMIN role

**Response (204 No Content):** Empty body

**Deletion Flow:**
1. Delete ratings (CASCADE from database)
2. Delete thumbnail file from filesystem
3. Delete original file from filesystem
4. Delete photo record from database

**Error Responses:**
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User is not ADMIN
- **404 Not Found** - Photo not found

---

## Public Endpoints

### GET /api/public/admin-contact

**Description:** Get admin contact email (public endpoint for unauthenticated users).

**Security:** Public (no authentication required)

**Response (200 OK):** `{ adminContactEmail }`

---

## DTOs (Data Transfer Objects)

### Request DTOs

- **RegisterRequest:** `{ email, password }` - Validation: `@NotBlank`, `@Email`, `@Size(min=8)`
- **LoginRequest:** `{ email, password }` - Validation: `@NotBlank`
- **RatingRequest:** `{ rating }` - Validation: `@NotNull`, `@Min(1)`, `@Max(5)`
- **UpdateRoleRequest:** `{ role }` - Validation: `@NotNull`, enum Role
- **UpdatePermissionsRequest:** `{ canViewPhotos, canRate }` - Validation: `@NotNull` (both Boolean)
- **UpdateSettingsRequest:** `{ adminContactEmail }` - Validation: `@NotBlank`, `@Email`

### Response DTOs

- **UserResponse:** `{ id, email, role, createdAt, canViewPhotos, canRate }`
- **LoginResponse:** `{ token, type, expiresIn, user: UserResponse }`
- **PhotoResponse:** `{ id, filename, originalFilename, thumbnailUrl, fileSize, mimeType, gpsLatitude, gpsLongitude, takenAt, uploadedAt, averageRating, totalRatings, userRating }`
- **RatingResponse:** `{ id, photoId, userId, rating, createdAt }`
- **UserAdminResponse:** `{ id, email, role, createdAt, totalPhotos, canViewPhotos, canRate }`
- **PhotoAdminResponse:** `{ id, filename, originalFilename, thumbnailUrl, fileSize, mimeType, gpsLatitude, gpsLongitude, takenAt, uploadedAt, averageRating, totalRatings, userId, userEmail }`
- **AppSettingsResponse:** `{ adminContactEmail }`
- **PageResponse<T>:** `{ content: List<T>, page: PageInfo }`
- **PageInfo:** `{ size, number, totalElements, totalPages }`
- **ErrorResponse:** `{ timestamp, status, error, message, path }`

**Implementation:** Java records with validation annotations

---

## HTTP Status Codes Summary

| Code | Status | Usage |
|------|--------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST (resource created) |
| 202 | Accepted | Async processing started (photo upload) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User doesn't have permission (not ADMIN, no canViewPhotos, no canRate) |
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
| GET /api/auth/me | USER, ADMIN | - |
| GET /api/photos | USER, ADMIN | Requires `canViewPhotos` permission |
| GET /api/photos/{id} | USER, ADMIN | Requires `canViewPhotos` permission |
| POST /api/photos | USER, ADMIN | - |
| GET /api/photos/{id}/thumbnail | USER, ADMIN | Requires `canViewPhotos` permission (or disabled security) |
| GET /api/photos/{id}/full | USER, ADMIN | Requires `canViewPhotos` permission (or disabled security) |
| PUT /api/photos/{id}/rating | USER, ADMIN | Requires `canRate` permission |
| DELETE /api/photos/{id}/rating | USER, ADMIN | Requires `canRate` permission, can only delete own rating |
| DELETE /api/photos/{id} | USER, ADMIN | Can only delete own photos |
| GET /api/admin/users | ADMIN | - |
| PUT /api/admin/users/{id}/role | ADMIN | - |
| PUT /api/admin/users/{id}/permissions | ADMIN | - |
| DELETE /api/admin/users/{id} | ADMIN | Cannot delete yourself |
| GET /api/admin/settings | ADMIN | - |
| PUT /api/admin/settings | ADMIN | - |
| GET /api/admin/photos | ADMIN | - |
| DELETE /api/admin/photos/{id} | ADMIN | Can delete any photo |
| GET /api/public/admin-contact | Public | - |

---

## Error Handling Strategy

### Global Exception Handler

**Implementation:** `@RestControllerAdvice` class

**Handled exceptions:**
- `EntityNotFoundException` → 404 NOT_FOUND
- `AccessDeniedException` → 403 FORBIDDEN
- `MethodArgumentNotValidException` → 400 BAD_REQUEST (validation errors)
- `IllegalArgumentException` → 400 BAD_REQUEST
- `Exception` (fallback) → 500 INTERNAL_SERVER_ERROR

**Error Response Format:** `{ timestamp, status, error, message, path }`

**Validation Errors:** Collect all field errors → join messages with ", "

---

## Configuration Properties

**Application Properties:**
```properties
# Photo upload directories
photo.upload.directory.input=uploads/input
photo.upload.directory.original=uploads/original
photo.upload.directory.medium=uploads/medium
photo.upload.directory.failed=uploads/failed

# Security toggle (for development/testing)
security.enabled=true
```

---

**Document prepared for:** Claude Code - Photo Map MVP Implementation
**Current status:** ✅ Core MVP Complete - All endpoints implemented and tested
**Last updated:** 2025-11-04
