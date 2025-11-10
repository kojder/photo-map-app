# API Documentation

> Complete REST API reference for Photo Map MVP - endpoints, request/response schemas, authentication, and interactive Swagger UI.

---

## 📖 Table of Contents

- Swagger UI
- Authentication Flow
- Authentication Endpoints
- Photo Endpoints
- Admin Endpoints
- DTOs & Validation
- Error Responses
- Example Requests

---

## 🔍 Swagger UI

**Interactive API Documentation and Testing**

### Accessing Swagger UI

After starting the backend:

**URL:** http://localhost:8080/swagger-ui/index.html

**OpenAPI JSON:** http://localhost:8080/v3/api-docs

### Features

- ✅ Interactive API testing (send requests directly from browser)
- ✅ JWT authentication support (Bearer token)
- ✅ All REST endpoints documented automatically
- ✅ Request/response schemas with validation rules
- ✅ Try-it-out functionality for each endpoint

### How to Use Swagger UI

1. Start backend: `./scripts/start-dev.sh`
2. Open Swagger UI: http://localhost:8080/swagger-ui/index.html
3. **Login to get JWT token:**
   - Scroll to `/api/auth/login` endpoint
   - Click **"Try it out"**
   - Enter credentials in request body:
     ```json
     {
       "email": "admin@example.com",
       "password": "<check ADMIN_PASSWORD in .env file>"
     }
     ```
   - Click **"Execute"**
   - **Copy JWT token from response body** (the long string after `"token":`)

4. **Authorize with token:**
   - Click **"Authorize"** button (🔒 icon at top right)
   - Enter: `Bearer <your-token>` (include "Bearer " prefix)
   - Click **"Authorize"**
   - Click **"Close"**

5. Now you can test any authenticated endpoint (marked with 🔒 lock icon)

---

## 🔐 Authentication Flow

### JWT Authentication

**Flow:**

```
1. User logs in
   ↓
2. POST /api/auth/login (email + password)
   ↓
3. Backend validates credentials (BCrypt)
   ↓
4. Backend generates JWT token (signed with JWT_SECRET)
   ↓
5. Frontend stores token in localStorage
   ↓
6. Frontend includes token in all requests:
   Authorization: Bearer <token>
   ↓
7. Backend validates token on each request
   ↓
8. Request proceeds if valid
```

**Token Structure:**

```json
{
  "sub": "user@example.com",
  "roles": ["USER", "ADMIN"],
  "permissions": ["VIEW_PHOTOS", "RATE_PHOTOS"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Token Expiration:**
- Tokens expire after configurable period (default: 24 hours)
- User must log in again after expiration
- No refresh token in MVP (planned for post-MVP)

---

## 🔑 Authentication Endpoints

### POST /api/auth/login

**Description:** Login with email and password, receive JWT token.

**Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "role": "USER",
  "permissions": ["VIEW_PHOTOS", "RATE_PHOTOS"]
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "timestamp": "2025-11-10T12:34:56.789Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

**Validation:**
- `email` - Required, valid email format
- `password` - Required, min 6 characters

---

### POST /api/auth/register

**Description:** Register new user account (requires manual activation by admin).

**Request:**
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "name": "John Doe"
}
```

**Response (Success - 201 Created):**
```json
{
  "message": "Registration successful! You can now log in. Contact the administrator to request permissions.",
  "email": "newuser@example.com",
  "isActive": true
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "timestamp": "2025-11-10T12:34:56.789Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Email already exists"
}
```

**Validation:**
- `email` - Required, valid email format, unique
- `password` - Required, min 6 characters
- `confirmPassword` - Required, must match password
- `name` - Optional, max 100 characters

---

## 📸 Photo Endpoints

### GET /api/photos

**Description:** List all photos (with optional filters).

**Authentication:** Required (JWT token)

**Query Parameters:**
- `startDate` (optional) - Filter by start date (ISO 8601: `2025-01-01`)
- `endDate` (optional) - Filter by end date (ISO 8601: `2025-12-31`)
- `minRating` (optional) - Minimum rating (1-5)
- `hasGps` (optional) - Filter by GPS data presence (`true` or `false`)
- `page` (optional) - Page number (default: 0)
- `size` (optional) - Page size (default: 20)

**Request:**
```
GET /api/photos?startDate=2025-01-01&minRating=4&hasGps=true
Authorization: Bearer <token>
```

**Response (Success - 200 OK):**
```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "photo1.jpg",
      "latitude": 52.2297,
      "longitude": 21.0122,
      "takenAt": "2025-01-15T10:30:00Z",
      "uploadedAt": "2025-01-20T14:00:00Z",
      "mediumPath": "/uploads/medium/photo1.jpg",
      "overallRating": 4.5,
      "myRating": 5,
      "ratingCount": 10
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

**Permissions Required:** `VIEW_PHOTOS`

---

### GET /api/photos/{id}

**Description:** Get photo by ID.

**Authentication:** Required (JWT token)

**Request:**
```
GET /api/photos/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response (Success - 200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "photo1.jpg",
  "latitude": 52.2297,
  "longitude": 21.0122,
  "takenAt": "2025-01-15T10:30:00Z",
  "uploadedAt": "2025-01-20T14:00:00Z",
  "originalPath": "/uploads/original/photo1.jpg",
  "mediumPath": "/uploads/medium/photo1.jpg",
  "uploader": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "overallRating": 4.5,
  "myRating": 5,
  "ratingCount": 10
}
```

**Response (Error - 404 Not Found):**
```json
{
  "timestamp": "2025-11-10T12:34:56.789Z",
  "status": 404,
  "error": "Not Found",
  "message": "Photo not found"
}
```

**Permissions Required:** `VIEW_PHOTOS`

---

### POST /api/photos/upload

**Description:** Upload one or more photos.

**Authentication:** Required (JWT token)

**Request:**
```
POST /api/photos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

files: [photo1.jpg, photo2.jpg]
```

**Response (Success - 200 OK):**
```json
{
  "uploaded": 2,
  "failed": 0,
  "photos": [
    {
      "id": "photo1-uuid",
      "filename": "photo1.jpg",
      "status": "success"
    },
    {
      "id": "photo2-uuid",
      "filename": "photo2.jpg",
      "status": "success"
    }
  ]
}
```

**Response (Partial Success - 207 Multi-Status):**
```json
{
  "uploaded": 1,
  "failed": 1,
  "photos": [
    {
      "id": "photo1-uuid",
      "filename": "photo1.jpg",
      "status": "success"
    },
    {
      "filename": "photo2.jpg",
      "status": "failed",
      "error": "Invalid file format"
    }
  ]
}
```

**Validation:**
- `files` - Required, multipart/form-data
- File size limit: 10MB (default)
- Supported formats: JPEG, PNG

**Note:** Upload available to all logged-in users in MVP

---

### POST /api/photos/{id}/rate

**Description:** Rate a photo (1-5 stars).

**Authentication:** Required (JWT token)

**Request:**
```json
POST /api/photos/550e8400-e29b-41d4-a716-446655440000/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5
}
```

**Response (Success - 200 OK):**
```json
{
  "photoId": "550e8400-e29b-41d4-a716-446655440000",
  "myRating": 5,
  "overallRating": 4.5,
  "ratingCount": 11
}
```

**Validation:**
- `rating` - Required, integer 1-5
- One rating per user per photo (update if exists)

**Permissions Required:** `RATE_PHOTOS`

---

### GET /api/photos/{id}/ratings

**Description:** Get all ratings for a photo.

**Authentication:** Required (JWT token)

**Request:**
```
GET /api/photos/550e8400-e29b-41d4-a716-446655440000/ratings
Authorization: Bearer <token>
```

**Response (Success - 200 OK):**
```json
{
  "photoId": "550e8400-e29b-41d4-a716-446655440000",
  "overallRating": 4.5,
  "ratingCount": 10,
  "ratings": [
    {
      "userId": "user1-uuid",
      "userName": "John Doe",
      "rating": 5,
      "createdAt": "2025-01-20T15:00:00Z"
    },
    {
      "userId": "user2-uuid",
      "userName": "Jane Smith",
      "rating": 4,
      "createdAt": "2025-01-21T10:00:00Z"
    }
  ]
}
```

**Permissions Required:** `VIEW_PHOTOS`

---

## 🛡️ Admin Endpoints

### GET /api/admin/users

**Description:** List all users.

**Authentication:** Required (JWT token with ADMIN role)

**Request:**
```
GET /api/admin/users
Authorization: Bearer <token>
```

**Response (Success - 200 OK):**
```json
[
  {
    "id": "user1-uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "ADMIN",
    "isActive": true,
    "permissions": ["VIEW_PHOTOS", "RATE_PHOTOS"],
    "createdAt": "2025-01-01T00:00:00Z"
  },
  {
    "id": "user2-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isActive": true,
    "permissions": [],
    "createdAt": "2025-01-20T12:00:00Z"
  }
]
```

**Role Required:** `ADMIN`

---

### PUT /api/admin/users/{id}/permissions

**Description:** Update user permissions.

**Authentication:** Required (JWT token with ADMIN role)

**Request:**
```json
PUT /api/admin/users/user2-uuid/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": ["VIEW_PHOTOS", "RATE_PHOTOS"]
}
```

**Response (Success - 200 OK):**
```json
{
  "id": "user2-uuid",
  "email": "user@example.com",
  "permissions": ["VIEW_PHOTOS", "RATE_PHOTOS"],
  "message": "Permissions updated successfully"
}
```

**Available Permissions:**
- `VIEW_PHOTOS` - View photos in Gallery and Map
- `RATE_PHOTOS` - Rate photos (1-5 stars)

**Role Required:** `ADMIN`

---

## 📦 DTOs & Validation

### Request DTOs

**LoginRequest:**
```java
{
  "email": "user@example.com",    // @Email, @NotBlank
  "password": "password123"       // @NotBlank, @Size(min=6)
}
```

**RegisterRequest:**
```java
{
  "email": "user@example.com",    // @Email, @NotBlank
  "password": "password123",      // @NotBlank, @Size(min=6)
  "confirmPassword": "password123", // Must match password
  "name": "John Doe"              // @Size(max=100)
}
```

**RatingRequest:**
```java
{
  "rating": 5                     // @Min(1), @Max(5)
}
```

### Response DTOs

**AuthResponse:**
```java
{
  "token": "jwt-token",
  "email": "user@example.com",
  "role": "USER",
  "permissions": ["VIEW_PHOTOS"]
}
```

**PhotoResponse:**
```java
{
  "id": "uuid",
  "filename": "photo.jpg",
  "latitude": 52.2297,
  "longitude": 21.0122,
  "takenAt": "2025-01-15T10:30:00Z",
  "uploadedAt": "2025-01-20T14:00:00Z",
  "mediumPath": "/uploads/medium/photo.jpg",
  "overallRating": 4.5,
  "myRating": 5,
  "ratingCount": 10
}
```

**ErrorResponse:**
```java
{
  "timestamp": "2025-11-10T12:34:56.789Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    "email: must be a valid email address",
    "password: must be at least 6 characters"
  ]
}
```

---

## ❌ Error Responses

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| **200 OK** | Request successful |
| **201 Created** | Resource created successfully |
| **400 Bad Request** | Validation error or invalid input |
| **401 Unauthorized** | Missing or invalid JWT token |
| **403 Forbidden** | Insufficient permissions |
| **404 Not Found** | Resource not found |
| **500 Internal Server Error** | Server error |

### Error Response Format

```json
{
  "timestamp": "2025-11-10T12:34:56.789Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/auth/login",
  "details": [
    "email: must be a valid email address"
  ]
}
```

### Common Error Scenarios

**401 Unauthorized - Missing Token:**
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "JWT token is missing"
}
```

**401 Unauthorized - Invalid Credentials:**
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

**403 Forbidden - Insufficient Permissions:**
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have permission to upload photos"
}
```

**404 Not Found:**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Photo not found"
}
```

---

## 💻 Example Requests

### Using curl

**Login:**
```bash
# Read admin password from .env
ADMIN_PWD=$(grep ADMIN_PASSWORD .env | cut -d'=' -f2)

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"$ADMIN_PWD\"}"
```

**List Photos (with token):**
```bash
# Save token from login response
TOKEN="your-jwt-token"

# List photos
curl -X GET http://localhost:8080/api/photos \
  -H "Authorization: Bearer $TOKEN"
```

**Upload Photo:**
```bash
curl -X POST http://localhost:8080/api/photos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/path/to/photo.jpg"
```

**Rate Photo:**
```bash
PHOTO_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST "http://localhost:8080/api/photos/$PHOTO_ID/rate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
```

### Using Swagger UI

1. Open http://localhost:8080/swagger-ui/index.html
2. Click "Authorize" button
3. Login via `/api/auth/login` to get token
4. Enter `Bearer <token>` in authorization dialog
5. Click "Authorize"
6. Test any endpoint using "Try it out" button

---

## 📚 Additional Resources

**Related Pages:**
- [Architecture](Architecture) - REST API design, JWT authentication
- [Development Setup](Development-Setup) - Environment configuration
- [Quick Start](Quick-Start) - First login and verification

**External Documentation:**
- [Spring Boot REST API Best Practices](https://spring.io/guides/tutorials/rest/)
- [JWT Introduction](https://jwt.io/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**Last Updated:** 2025-11-10

**Sources:**
- `README.md` (API Documentation section)
- `05-Architecture.md` (REST API Design, JWT Authentication)
- Swagger UI (http://localhost:8080/swagger-ui/index.html)
