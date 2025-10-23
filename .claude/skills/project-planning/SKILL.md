---
name: Project Planning for Photo Map MVP
description: Break down, design, and structure features into implementable tasks for Photo Map MVP following 10xDevs methodology and Workflow 3x3. Use when planning new features, creating user stories, defining API endpoints, structuring implementation phases, organizing project tasks, or designing feature breakdowns.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Project Planning - Photo Map MVP

## MVP Scope

**Product:** Photo Map MVP - Full-stack aplikacja (Angular 18 + Spring Boot 3 + PostgreSQL)

**Core Features:**
1. **Authentication** - JWT-based login/registration
2. **Photo Management** - Upload z EXIF, thumbnails, CRUD
3. **Gallery View** - Responsive grid, rating, filtering
4. **Map View** - Leaflet.js, GPS markers, clustering
5. **Admin Panel** - User management (ADMIN role)

**Out of Scope (NOT MVP):**
- ❌ Batch uploads
- ❌ Photo sharing between users
- ❌ Social features (comments, likes)
- ❌ Advanced analytics
- ❌ Mobile apps (web only)
- ❌ Background processing (Mikrus VPS constraint)

---

## Workflow 3x3

**Pattern: 3 Small Tasks → Checkpoint**

**Steps:**
1. **Small Chunk** - Implement ONE small feature (1 endpoint, 1 component, 1 service method)
2. **Test Immediately** - Verify it works (unit test, manual test, curl)
3. **Commit** - Save progress with Conventional Commits

**Repeat 3 times, then checkpoint with user.**

**Example - Photo Upload Feature:**
- **Chunk 1:** Backend POST `/api/photos/upload` endpoint - test with curl
- **Chunk 2:** Frontend PhotoService.uploadPhoto() - test with console.log
- **Chunk 3:** Upload form component - test in browser
- **CHECKPOINT** - Show user working upload feature

---

## Feature Breakdown Template

### Example: Photo Rating Feature

**User Story:**
As a user, I want to rate my photos (1-10 stars) so that I can organize my favorites.

**Backend Tasks:**
- [ ] Create `RatingUpdateRequest` DTO (validation: 1-10)
- [ ] Implement PUT `/api/photos/{id}/rating` endpoint
- [ ] Add `updateRating(photoId, rating, userId)` in PhotoService
- [ ] User scoping check (can only rate own photos)
- [ ] Unit tests (PhotoServiceTest)
- [ ] Integration test (MockMvc)

**Frontend Tasks:**
- [ ] Create rating component (star icons, clickable)
- [ ] Add `updateRating()` method to PhotoService
- [ ] Integrate rating component in PhotoCard
- [ ] Show current rating in gallery
- [ ] Show rating in map popups
- [ ] Component tests

**Acceptance Criteria:**
- [ ] API returns 204 No Content on success
- [ ] User can click stars to set rating 1-10
- [ ] Rating persists after page reload
- [ ] User scoping enforced (can't rate other users' photos)
- [ ] Rating visible in gallery and map

**Testing:**
- [ ] Backend unit tests pass
- [ ] Frontend component tests pass
- [ ] Manual test: Rate photo, reload page, verify rating saved
- [ ] Security test: Try to rate other user's photo → 404

**Git Commits:**
```
feat(api): add photo rating endpoint
feat(ui): add rating component to gallery
fix(rating): handle edge case when rating is null
```

---

## API Endpoint Planning

### Template

**Endpoint:** POST `/api/photos/upload`

**Purpose:** Upload photo with EXIF extraction and thumbnail generation

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `file` (MultipartFile)
- Headers: `Authorization: Bearer <JWT>`

**Response (201 Created):**
```json
{
  "id": 1,
  "fileName": "IMG_1234.jpg",
  "fileSize": 2048576,
  "thumbnailUrl": "/api/photos/1/thumbnail",
  "latitude": 52.2297,
  "longitude": 21.0122,
  "takenAt": "2025-10-19T14:30:00",
  "createdAt": "2025-10-19T15:00:00"
}
```

**Error Responses:**
- 400 Bad Request - File empty, too large (>50MB), invalid type
- 401 Unauthorized - Missing/invalid JWT
- 500 Internal Server Error - File processing failure

**Backend Implementation:**
1. PhotoController - handle multipart request
2. PhotoService - coordinate processing
3. ExifService - extract GPS/date/camera
4. ThumbnailService - generate 400x300px thumbnail
5. FileStorageService - save to `/opt/photo-map/storage/{userId}/`
6. PhotoRepository - save entity

**Frontend Implementation:**
1. Upload form component (file input)
2. PhotoService.uploadPhoto(file: File)
3. Show upload progress (optional for MVP)
4. Refresh gallery after upload

---

## Database Schema Planning

### Example: Add Comments Feature (Future)

**User Story:**
As a user, I want to add comments to my photos.

**Database Changes:**
1. Create `comments` table:
   - id BIGSERIAL PRIMARY KEY
   - photo_id BIGINT REFERENCES photos(id) ON DELETE CASCADE
   - user_id BIGINT REFERENCES users(id) ON DELETE CASCADE
   - text VARCHAR(500) NOT NULL
   - created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

2. Add indexes:
   - `comments(photo_id)` - for fetching comments by photo
   - `comments(user_id)` - for user scoping

3. JPA Entity:
   - `Comment` entity with `@ManyToOne` to Photo and User

4. Repository:
   - `CommentRepository extends JpaRepository<Comment, Long>`
   - `List<Comment> findByPhotoIdOrderByCreatedAtDesc(Long photoId)`

---

## Tech Constraints (Mikrus VPS)

**Resource Limits:**
- Limited CPU/RAM
- No GPU
- 250GB storage
- Standard network bandwidth

**Implications:**
- ❌ NO background job queues (Celery, Sidekiq)
- ❌ NO parallel processing (process photos synchronously)
- ✅ Simple in-memory cache (60s TTL for photo list)
- ✅ Thumbnail generation on upload (synchronous)
- ✅ Keep database queries optimized (indexes!)

---

## Implementation Phases

**Phase 1: Backend - Setup & Auth**
- Spring Boot setup, PostgreSQL connection
- User entity, registration, login, JWT
- Basic error handling

**Phase 2: Backend - Photo Management**
- Photo entity, upload endpoint
- EXIF extraction, thumbnail generation
- Photo CRUD (GET, DELETE)

**Phase 3: Frontend - Setup & Auth**
- Angular setup, Tailwind config
- Login/Register components
- AuthService, JWT storage, interceptor
- Route guards

**Phase 4: Frontend - Gallery & Map**
- PhotoService (BehaviorSubject)
- Gallery component (grid, rating)
- Map component (Leaflet, markers)
- Upload form

**Phase 5: Admin Panel**
- Admin API endpoints (user list, delete)
- Admin guard (role-based)
- Admin UI component

**Phase 6: Deployment**
- Mikrus VPS setup
- Nginx reverse proxy
- Systemd service
- SSL (Let's Encrypt)

---

## Task Breakdown Checklist

**Before Starting:**
- [ ] Read `.ai/prd.md` - understand MVP requirements
- [ ] Read `.ai/tech-stack.md` - know tech constraints
- [ ] Check MASTER_PLAN.md - see which phase you're in
- [ ] Identify dependencies - what must be done first?

**For Each Feature:**
- [ ] Define user story (As X, I want Y, so that Z)
- [ ] Break into backend + frontend tasks
- [ ] Identify acceptance criteria (testable!)
- [ ] Plan tests (unit + integration)
- [ ] Estimate chunks (each chunk should be ~30-60 min)

**During Implementation:**
- [ ] Follow Workflow 3x3 (small chunks, test, commit)
- [ ] User scoping enforced (backend)
- [ ] Standalone components (frontend)
- [ ] Tests written and passing
- [ ] Conventional Commits

**After Feature:**
- [ ] Update MASTER_PLAN.md - check off tasks
- [ ] Manual testing in browser/curl
- [ ] Code review (if team)
- [ ] Checkpoint with user

---

## Related Documentation

- `.ai/prd.md` - Product requirements and user stories
- `.ai/db-plan.md` - Database schema reference
- `.ai/api-plan.md` - REST API endpoints reference
- `.ai/ui-plan.md` - Frontend architecture reference
- `MASTER_PLAN.md` - Implementation progress tracker

---

## Templates

See `templates/` directory:
1. **feature-breakdown.md** - Template for feature planning
2. **user-story-template.md** - User story format
3. **api-endpoint-spec.md** - REST endpoint specification

---

## Key Reminders

**MVP Scope:**
- ✅ Only features in `.ai/prd.md`
- ✅ Simple solutions
- ❌ NO over-engineering

**Workflow 3x3:**
- ✅ Small chunks (~30-60 min)
- ✅ Test immediately
- ✅ Commit frequently

**Mikrus Constraints:**
- ✅ Synchronous processing
- ✅ No background jobs
- ✅ Optimize for limited resources
