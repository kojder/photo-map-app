# Product Requirements Document - Photo Map MVP

**Version:** 5.0 (Requirements Only)
**Date:** 2025-11-04
**Status:** 📋 Ready for Implementation
**Project Type:** MVP (Minimum Viable Product)

> **For business context:** See `.decisions/prd-context.md`

---

## 1. Executive Summary

Photo Map MVP is a full-stack application (Angular 18 + Spring Boot 3 + PostgreSQL) for managing photos with geolocation.

### Core Capabilities

1. **Upload and Processing** - Photo upload with automatic EXIF extraction and thumbnail generation
2. **Visualization** - Gallery grid and map (Leaflet.js) with GPS markers
3. **Interaction** - Photo rating (1-5 stars) and advanced filtering
4. **Security** - JWT authentication, password hashing (BCrypt)
5. **Administration** - Admin panel for user management

---

## 2. Core Features

### 2.1. User Authentication

**Requirements:**
- Registration (email + password)
- Login with JWT token
- Passwords hashed (BCrypt)
- Roles: USER (default), ADMIN

**User Stories:**
- **US-AUTH-001:** As a user, I can register to create an account
- **US-AUTH-002:** As a user, I can log in to access the application

### 2.2. Photo Upload

**Requirements:**
- Single file upload (JPEG, PNG) through web interface
- **Batch upload** - ability to drop multiple photos directly into `input/` folder (scp/ftp)
- Asynchronous processing - upload and processing are separate
- Automatic EXIF extraction (GPS, date, size)
- Automatic thumbnail generation (medium 300px for gallery and map)
- Format and size validation (max 10MB)
- Folder structure: `input/`, `original/` (full res), `medium/` (300px), `failed/`
- Error handling - failed photos moved to `failed/` with error log

> **Note:** HEIC/HEIF support excluded from MVP scope (see tech-stack.md for rationale)

**User Stories:**
- **US-UPLOAD-001:** As a user, I can upload photos through the web interface (202 Accepted - queued)
- **US-UPLOAD-002:** As a user, I can drop multiple photos directly into `input/` folder (batch)
- **US-UPLOAD-003:** System automatically extracts GPS and date in the background
- **US-UPLOAD-004:** System generates 3 thumbnail sizes (150px, 400px, 800px)
- **US-UPLOAD-005:** System moves failed photos to `failed/` with error description

### 2.3. Photo Gallery

**Requirements:**
- Responsive photo grid (1-5 columns, mobile-first)
- Lazy loading for performance
- Display: thumbnail, name, size, rating, date
- Sorting: date, name, rating
- Pagination (20 photos per page)

**User Stories:**
- **US-GAL-001:** As a user, I can browse the gallery in a grid layout
- **US-GAL-002:** As a user, I see thumbnails for fast loading
- **US-GAL-003:** As a user, I can sort photos

### 2.4. Photo Map

**Requirements:**
- Interactive map (Leaflet.js + OpenStreetMap)
- GPS markers for photos with location data
- Marker clustering for photo clusters
- Popups with thumbnail, name, date, rating
- Automatic view fitting (fitBounds)
- Statistics: "X of Y photos have GPS"

**User Stories:**
- **US-MAP-001:** As a user, I can view photos on a map
- **US-MAP-002:** As a user, I see clustering for multiple photos in one location
- **US-MAP-003:** As a user, I can click a marker to see details

### 2.5. Rating System

**Requirements:**
- Rating 1-5 (stars, integers)
- Photos can have no rating (rating nullable)
- Inline rating in gallery
- Rating in map popups
- Edit and delete ratings (ability to clear rating)
- Sort by rating

**User Stories:**
- **US-RAT-001:** As a user, I can rate a photo 1-5 stars
- **US-RAT-002:** As a user, I can change a rating
- **US-RAT-003:** As a user, I can clear a rating from a photo (remove rating)
- **US-RAT-004:** As a user, I can see ratings in the gallery and on the map

**Business Rules:**
- One user can submit only one rating per photo (can edit it)

**Rating Display:**
- API returns `averageRating`, `totalRatings`, `userRating`
- **What user sees:**
  - `averageRating` → **overall average rating** from all users (consistent with rating filter behavior)
  - `userRating` → user's personal rating (displayed separately, e.g., "Your rating: 5 stars")
  - If nobody rated → photo **has no rating** (`averageRating` = null)
- Frontend displays `averageRating` with rating count: "(X ratings)" where X = `totalRatings`
- User's personal rating (`userRating`) can be shown separately if desired

### 2.6. Filtering

**Requirements:**
- **Rating Filter:** min-max rating (e.g., 4-5 stars for favorites)
- **Date Filter:** date range with day precision
- **Combined Filters:** rating AND date together
- Real-time update of photo list
- Clear filter option
- Filtered photo counter

**User Stories:**
- **US-FIL-001:** As a user, I can filter by rating
- **US-FIL-002:** As a user, I can filter by date
- **US-FIL-003:** As a user, I can use multiple filters simultaneously

### 2.7. Admin Panel

**Requirements:**
- List of all users (visible only to ADMIN)
- Information: ID, email, role, registration date, photo count
- Ability to change user role (USER ↔ ADMIN)
- Endpoint: `GET /api/admin/users`, `PUT /api/admin/users/{id}/role`

**User Stories:**
- **US-ADMIN-001:** As an admin, I can view the list of users
- **US-ADMIN-002:** As an admin, I can change user roles

---

## 3. Non-Functional Requirements

### 3.1. Responsiveness (RWD)

**Breakpoints:**
- Mobile (< 640px): 1 column gallery
- Tablet (640-1024px): 2-3 columns
- Desktop (> 1024px): 4-5 columns

**Mobile-First:** Touch-friendly controls, full-screen map

### 3.2. Performance

- Initial load < 3 seconds
- Lazy loading of images
- Thumbnails instead of full-size in gallery
- Pagination for large collections
- Debounce for filters

### 3.3. Security

- JWT authentication
- Passwords hashed (BCrypt)
- Input validation (frontend + backend)
- CORS configuration

### 3.4. Testing

- Unit tests for services (coverage > 50%)
- Integration tests for API endpoints
- E2E tests for critical flows (optional)
- **Test IDs:** All interactive elements have `data-testid` attributes
- **Naming convention:** kebab-case, format `component-element` or `component-element-action`
  - Examples: `gallery-photo-card`, `upload-photo-btn`, `map-marker-popup`, `login-email-input`, `photo-card-rate-btn`, `filter-clear-btn`

### 3.5. Browser Support

- Chrome/Edge (latest 2)
- Firefox (latest 2)
- Safari (latest 2)
- Mobile browsers (iOS Safari, Chrome Android)

---

## 4. Success Criteria

MVP is successful if:

✅ **Functional:**
1. Users can register and log in
2. Users can upload photos (JPEG, PNG, HEIC)
3. System automatically extracts EXIF and generates thumbnails
4. Gallery displays photos in a responsive grid
5. Map displays photos with GPS and clustering works
6. Users can rate photos and filter by rating/date
7. Admin can manage users
8. Layout is optimized for mobile and desktop

✅ **Technical:**
1. Angular 18 standalone + Spring Boot 3 + PostgreSQL work together
2. JWT authentication works correctly
3. Leaflet.js integration is smooth
4. RxJS state management is clear and maintainable
5. Backend tests > 50% coverage
6. No errors in console
7. Performance targets met

✅ **UX:**
1. Users perform core tasks intuitively
2. Interface is clean and clear
3. Mobile experience is touch-friendly
4. No major usability issues

---

## 5. Out of Scope (Not in MVP)

❌ **Advanced Features:**
- Photo editing (crop, filters, rotation)
- Batch operations (bulk delete, move)
- Photo sharing (public links, social media)
- Comments or annotations
- Face recognition or tagging
- Albums/collections
- Export data (ZIP download)

❌ **Performance Features:**
- Service Workers or PWA
- Offline mode
- CDN integration
- Image optimization pipeline (progressive JPEG, WebP)

❌ **Social Features:**
- Follow other users
- Like/comment on photos
- Activity feed

---

## 6. Future Enhancements (Post-MVP)

**Status:** 🔜 Optional features for implementation after MVP completion

### 6.1 Email System

**Purpose:** Email verification and password recovery

**Key Features:**
- Email verification (confirm registration)
- Password reset through email
- Email notifications (optional)

**Estimated Time:** 12-16 hours
**Details:** See `.ai/features/feature-email-system.md`

### 6.2 Admin Security Enhancements

**Purpose:** Secure admin initialization and profile management

**Key Features:**
- Auto-create default admin on first startup (from `.env` credentials)
- Force password change on first admin login (`must_change_password` flag)
- Admin can change email and password through `/api/admin/profile`

**Estimated Time:** 3-4 hours
**Details:** See `.ai/implementation-admin-initializer.md`

---

## 7. Technical Architecture (High-Level)

### Frontend (Angular 18)
```
src/app/
├── auth/           # Login, Register components
├── gallery/        # Gallery view, Photo card component
├── map/            # Map view, Leaflet integration
├── admin/          # Admin panel (users list)
├── services/       # PhotoService, AuthService, FilterService
└── models/         # Photo, User interfaces
```

### Backend (Spring Boot 3)
```
src/main/java/.../
├── controller/     # REST endpoints (@RestController)
├── service/        # Business logic
├── repository/     # JPA repositories
├── entity/         # JPA entities (User, Photo)
├── dto/            # Data Transfer Objects
├── security/       # JWT config, UserDetailsService
└── config/         # CORS, File upload config
```

### Database (PostgreSQL)
```
Tables:
- users (id, email, password, role, created_at)
- photos (id, user_id, file_name, file_path, file_size, latitude, longitude, date_taken, rating, uploaded_at)
```

---

**Document Purpose:** Technical requirements for Claude Code implementation
**Related:** `.decisions/prd-context.md` (business context, future vision)
**Document Status:** ✅ Ready for Implementation
**Last Updated:** 2025-11-04
