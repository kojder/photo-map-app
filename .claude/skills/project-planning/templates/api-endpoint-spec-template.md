# API Endpoint Specification Template

## Basic Format

```
Method: [GET/POST/PUT/DELETE]
Path: /api/[resource]/[path]
Purpose: [What this endpoint does]
Auth: Required / Optional / Public
```

---

## Template

### [METHOD] `/api/[resource]/[path]`

**Purpose:** [One sentence describing what this endpoint does]

**Authentication:** Required (JWT) / Optional / Public

**Authorization:** [Role requirements: USER / ADMIN / Owner only]

---

#### Request

**Method:** [GET / POST / PUT / DELETE]

**Path Parameters:**
- `{id}` - [description, type, constraints]

**Query Parameters:**
- `param1` (required) - [description, type, constraints]
- `param2` (optional) - [description, type, default value]

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>` (if auth required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "field1": "value1",
  "field2": 123,
  "field3": ["item1", "item2"]
}
```

**Validation Rules:**
- `field1`: required, max length 255, pattern: [regex if applicable]
- `field2`: required, min: 1, max: 10
- `field3`: optional, array min size: 0, max size: 100

---

#### Response

**Success (200 OK / 201 Created / 204 No Content):**
```json
{
  "id": 1,
  "field1": "value1",
  "field2": 123,
  "createdAt": "2025-10-19T15:00:00",
  "updatedAt": "2025-10-19T15:30:00"
}
```

**Response Fields:**
- `id` - Long - unique identifier
- `field1` - String - [description]
- `field2` - Integer - [description]
- `createdAt` - DateTime (ISO 8601) - creation timestamp
- `updatedAt` - DateTime (ISO 8601) - last update timestamp

---

#### Error Responses

**400 Bad Request:**
```json
{
  "error": "Validation Failed",
  "message": "Invalid request body",
  "details": [
    {
      "field": "field1",
      "error": "must not be blank"
    }
  ],
  "timestamp": "2025-10-19T15:00:00"
}
```

**When:**
- Required field missing
- Field validation failed (length, pattern, range)
- Invalid JSON format

---

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "timestamp": "2025-10-19T15:00:00"
}
```

**When:**
- JWT token missing
- JWT token invalid/expired

---

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Access denied",
  "timestamp": "2025-10-19T15:00:00"
}
```

**When:**
- User lacks required role (e.g., ADMIN required but user is USER)
- User trying to access other user's resource (user scoping violation)

---

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Resource not found",
  "timestamp": "2025-10-19T15:00:00"
}
```

**When:**
- Resource with given ID doesn't exist
- Resource exists but belongs to other user (user scoping)

---

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2025-10-19T15:00:00"
}
```

**When:**
- Unexpected server error
- Database connection failure
- File processing failure

---

## Example: PUT /api/photos/{id}/rating

### PUT `/api/photos/{id}/rating`

**Purpose:** Update photo rating (1-5 stars)

**Authentication:** Required (JWT)

**Authorization:** Owner only (can only rate own photos)

---

#### Request

**Method:** PUT

**Path Parameters:**
- `{id}` - Long - photo ID

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "rating": 5
}
```

**Validation Rules:**
- `rating`: required, integer, min: 1, max: 5

---

#### Response

**Success (204 No Content):**
No response body (rating updated successfully)

---

#### Error Responses

**400 Bad Request:**
```json
{
  "error": "Validation Failed",
  "message": "Invalid rating value",
  "details": [
    {
      "field": "rating",
      "error": "must be between 1 and 5"
    }
  ],
  "timestamp": "2025-10-19T15:00:00"
}
```

**When:**
- `rating` < 1 or > 5
- `rating` not an integer

---

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "timestamp": "2025-10-19T15:00:00"
}
```

**When:**
- JWT token missing or invalid

---

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Photo not found",
  "timestamp": "2025-10-19T15:00:00"
}
```

**When:**
- Photo with ID doesn't exist
- Photo exists but belongs to other user (user scoping)

---

## Testing

**Manual Test (curl):**
```bash
# Success case
curl -X PUT http://localhost:8080/api/photos/1/rating \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'

# Expected: 204 No Content

# Validation error case
curl -X PUT http://localhost:8080/api/photos/1/rating \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"rating": 10}'

# Expected: 400 Bad Request

# Unauthorized case
curl -X PUT http://localhost:8080/api/photos/1/rating \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'

# Expected: 401 Unauthorized
```

**Integration Test (MockMvc):**
```java
@Test
@WithMockUser(username = "test@example.com")
void updateRating_validRequest_returns204() throws Exception {
    mockMvc.perform(put("/api/photos/1/rating")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"rating\": 5}"))
        .andExpect(status().isNoContent());
}

@Test
@WithMockUser(username = "test@example.com")
void updateRating_invalidRating_returns400() throws Exception {
    mockMvc.perform(put("/api/photos/1/rating")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"rating\": 10}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Validation Failed"));
}

@Test
void updateRating_noAuth_returns401() throws Exception {
    mockMvc.perform(put("/api/photos/1/rating")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"rating\": 5}"))
        .andExpect(status().isUnauthorized());
}
```

---

## Implementation Checklist

### Backend
- [ ] DTO created with validation annotations (@Min, @Max, @NotBlank, etc.)
- [ ] Controller method with @Valid
- [ ] Service method with business logic
- [ ] User scoping enforced (can only access own resources)
- [ ] Error handling (try-catch, custom exceptions)
- [ ] Unit tests (service layer)
- [ ] Integration tests (MockMvc)

### Frontend
- [ ] Service method created (Observable<T>)
- [ ] Error handling (catchError, retry if applicable)
- [ ] Component integration
- [ ] Loading state (optional)
- [ ] Error display in UI

---

## Related Documentation

- `.ai/api-plan.md` - all API endpoints dla Photo Map MVP
- `templates/feature-proposal-template.md` - planning new endpoint
- `templates/implementation-plan-template.md` - how to implement
- `references/verification-checklist.md` - checklist
