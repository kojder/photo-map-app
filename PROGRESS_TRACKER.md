# 🎯 Photo Map MVP - Progress Tracker

**Created:** 2025-10-19
**Status:** 🔜 Documentation ready - awaiting implementation

---

## 🔄 Current Status

**Last Updated:** 2025-10-26

### 🎯 Currently Working On

**Next:** Phase 5 - Admin Panel Frontend (1-2h)

<!-- Use template below when starting new task -->
<!--
**Active Tasks:**
- [ ] **Task Name** (e.g., "Manual Testing - Photo Viewer Mobile Touch")
  - [ ] Subtask 1
  - [ ] Subtask 2
-->

### ✅ Last Completed

**Phase 5 - Admin Panel Backend** (2025-10-26)
- ✅ PhotoAdminResponse DTO with userId and userEmail
- ✅ GET /api/admin/photos endpoint (list all photos with owner info)
- ✅ DELETE /api/admin/photos/{id} endpoint (admin can delete any photo)
- ✅ PhotoService: getPhotosForAdmin(), deletePhotoByAdmin()
- ✅ Unit tests: 8 new tests (AdminControllerTest: 5, PhotoServiceTest: 3)
- ✅ All tests passing: 74/74 ✅
- 📝 Backend commit: cc0aee2

**Photo Upload - User Assignment Fix** (2025-10-26)
- ✅ Migracja V4: `user_id` nullable w tabeli `photos`
- ✅ Photo entity: `@ManyToOne User user` z nullable=true
- ✅ PhotoController: przy web upload przypisuje usera (nazwa pliku: `{userId}_uuid.jpg`)
- ✅ PhotoProcessingService: parsuje userId z nazwy pliku i przypisuje User
- ✅ PhotoService: sprawdza `photo.getUser() != null` przed walidacją właściciela
- ✅ Wszystkie testy: 61/61 ✅
- 📝 **Web uploads** (przez stronę): user przypisany = zalogowany użytkownik
- 📝 **Batch uploads** (folder `input/`): user = null (bez właściciela)

**Environment Configuration - spring.config.import** (2025-10-26)
- ✅ Removed spring-dotenv dependency (simpler native Spring Boot approach)
- ✅ Implemented `spring.config.import=optional:file:../.env[.properties]` in application.properties
- ✅ Applied to both application.properties and application-test.properties
- ✅ Verified: Backend loads .env variables correctly (ADMIN_EMAIL, JWT_SECRET, etc.)
- ✅ Tests: Backend 61/61 ✅, All tests passing
- 📝 Benefits: Native Spring Boot feature, no external dependencies, works from backend/ directory
- 📝 Documentation: https://docs.spring.io/spring-boot/reference/features/external-config.html

**Documentation: Admin Security & Email System** (2025-10-26)
- ✅ Created `.ai/implementation-admin-initializer.md` - detailed plan for Admin Security (3-4h)
  - AdminInitializer checks `countByRole(ADMIN)` not email (prevents duplicates after email change)
  - `must_change_password` flag forces password change on first login
  - `/api/admin/profile` endpoint for changing email + password
- ✅ Created `.ai/features/feature-email-system.md` - full spec for Email System (12-16h)
  - Email verification (24h token), Password reset (1h token), Email notifications
- ✅ Updated `.ai/prd.md` - added Future Enhancements section
- ✅ Updated `PROGRESS_TRACKER.md` - added Admin Security + Email System specs

**Rating System Improvements** (2025-10-25)
- ✅ Fixed rating range display (1-5 stars with flex-wrap for mobile)
- ✅ Implemented personalized rating display:
  - Shows user's own rating when set
  - Shows average of others' ratings when user hasn't rated
- ✅ Auto-remove photos from gallery when rating drops below active filter
- ✅ Backend: `calculateDisplayRating()` method for personalized ratings
- ✅ Frontend: `photoMatchesFilters()` method validates against all filters
- ✅ Tests: Backend 61/61 ✅, Frontend 148/148 ✅ (added 3 new filter tests)
- 📝 Changes: PhotoController.java, PhotoService.ts, PhotoCardComponent.html, MapComponent.ts

**Photo Viewer - Phase 1-4 Complete** (2025-10-25)
- ✅ Phase 1: Core viewer with keyboard navigation (ESC, arrows)
- ✅ Phase 2: Gallery integration (click photo → fullscreen)
- ✅ Phase 3: Map integration (click marker thumbnail → fullscreen)
- ✅ Phase 4: Mobile touch support (swipe gestures, tap-to-close)
- ✅ All unit tests passing (27/27 frontend, 61/61 backend)
- ✅ Touch event handlers with 50px swipe threshold
- ✅ CSS optimized for mobile (48px touch targets)
- 📝 Status: Core feature complete, Phase 5 (UX enhancements) optional
- 📝 Next: Manual testing recommended or move to Admin Panel/Deployment

**Photo Viewer - Fullscreen Display Fixes** (2025-10-25)
- ✅ Implemented fullscreen API support for better mobile experience
- ✅ Fixed photo viewer CSS positioning (fullscreen overlay)
- ✅ Fixed blurry images (changed endpoint to `originalDirectory`)
- ✅ Phase 1-3 complete: Core viewer + Gallery integration + Map integration
- ✅ PhotoViewerComponent with keyboard navigation (arrows, ESC)
- ✅ PhotoViewerService manages state (photos, currentIndex, sourceRoute)
- ✅ Tests: Backend 61/61 ✅, Frontend tests fixed (AppComponent)
- 📝 Note: Mobile touch gestures (swipe) not yet implemented

**Photo Viewer - Fullscreen Display Fixes** (2025-10-25)
- ✅ Fixed photo viewer not taking full screen (CSS positioning issue)
- ✅ Fixed blurry images (changed endpoint from `largeDirectory` to `originalDirectory`)
- ✅ Verified functionality locally and via ngrok
- ✅ Tests: Backend 61/61 ✅, Frontend 126/129 ✅ (3 pre-existing AppComponent failures)
- 📝 Known issue: Mobile touch navigation needs improvement (Phase 4)

**Photo Viewer Feature - Phase 1-3 Complete** (2025-10-25)
- ✅ Phase 1: Core viewer component with keyboard navigation
- ✅ Phase 2: Gallery integration (click photo → fullscreen viewer)
- ✅ Phase 3: Map integration (click marker thumbnail → viewer opens)
- ✅ PhotoViewerService manages state for both routes (/gallery, /map)

**Next:** Phase 4 (Mobile touch support + UX enhancements) or other features

<!--
**Working Session Template** (usuń po zakończeniu zadania):
- [ ] **Task Name** (np. "Fix photo upload error", "Add map filtering")
  - [ ] Subtask 1 (np. "Update PhotoController - add validation")
  - [ ] Subtask 2 (np. "Fix PhotoService - handle null GPS")
  - [ ] Subtask 3 (np. "Update GalleryComponent - show error message")
  - [ ] Subtask 4 (np. "Write unit tests")
  - [ ] Subtask 5 (np. "Verify with Chrome DevTools MCP")
  
**Example:**
- [ ] **Fix rating not persisting after page refresh**
  - [x] Check PhotoService - rating$ BehaviorSubject emission
  - [x] Verify API call in network tab (Chrome DevTools MCP)
  - [ ] Update PhotoCardComponent - refresh rating on init
  - [ ] Test: rate photo → refresh page → verify rating persists
  - [ ] Commit with message: "fix(gallery): persist rating after page refresh"
-->

**Next Planned Actions:**
1. Manual testing: Photo Viewer on mobile viewport (Chrome DevTools MCP)
2. (Optional) Phase 5: Photo Viewer UX Enhancements (loading states, preloading)
3. (Optional) Phase 5: Admin Panel
4. (Optional) Phase 6: Deployment na Mikrus VPS

**Blocked By:** None

---

### ✅ Last Completed

**Most Recent:**
- ✅ **Gallery Rating Filter Fix + Code Quality** (2025-10-25)
  - ✅ Backend: Added filter params (dateFrom, dateTo, minRating, hasGps) to PhotoController
  - ✅ Backend: PhotoService with JPA Specifications for dynamic filtering
  - ✅ Backend: PhotoSpecification class (hasMinRating, takenAfter, takenBefore, hasGps)
  - ✅ Code quality: Added `final` keyword to all method parameters and local variables
  - ✅ Added `@Transactional(readOnly = true)` to read operations in PhotoService
  - ✅ Tests: PhotoServiceTest updated (11 tests passing)
  - ✅ Tests: PhotoSpecificationTest created (7 tests with H2 database)
  - ✅ All 61 tests passing successfully

- ✅ **Chrome DevTools MCP Configuration** (2025-10-25)
  - ✅ Instructions: `.github/chrome-devtools.instructions.md` (~361 lines)
  - ✅ Integration with copilot-instructions.md
  - ✅ Decision rationale in tech-decisions.md
  - ✅ 5 use cases: verify changes, diagnose bugs, performance, integration testing, responsive design

- ✅ **GitHub Copilot Configuration** (2025-10-25)
  - ✅ Main instructions: `.github/copilot-instructions.md` (~350 lines)
  - ✅ Backend-specific: `.github/backend.instructions.md` (~240 lines with applyTo patterns)
  - ✅ Frontend-specific: `.github/frontend.instructions.md` (~280 lines with applyTo patterns)
  - ✅ Prompts library: `/update-docs`, `/generate-tests`, `/commit-message`, `/review-code`
  - ✅ VS Code settings: commit message generation, PR descriptions

- ✅ **Phase 4: Frontend - Gallery & Map** (2025-10-24)
  - ✅ Photo model (Photo, PageResponse, RatingResponse, PhotoFilters)
  - ✅ PhotoService: CRUD + rating with BehaviorSubject pattern
  - ✅ FilterService: filters$ Observable for reactive filtering
  - ✅ PhotoCardComponent: thumbnail + rating stars + actions (Rate, Clear, Delete)
  - ✅ FilterBarComponent: date range + min rating filter
  - ✅ GalleryComponent: responsive grid (1-4 columns) + FilterBar integration
  - ✅ UploadDialogComponent: drag-and-drop + file validation + progress bar
  - ✅ MapComponent: Leaflet.js + MarkerCluster + popup (thumbnail + rating)
  - ✅ Routing: /gallery i /map z authGuard
  - ✅ Leaflet dependencies: leaflet 1.9.4 + leaflet.markercluster
  - ✅ Build passing (no errors)

- ✅ **Refactoring** (2025-10-25)
  - ✅ Removed user ownership restrictions (all photos public for now)
  - ✅ Fixed rating scale validation (1-5 everywhere)
  - ✅ Fixed photo aspect ratio in thumbnails and gallery

---

## 📊 Project Status

**Overall Progress:** 4/6 phases (67% core MVP) + Photo Viewer Feature + GitHub Copilot setup

| Phase | Status | Description |
|------|--------|------|
| 1. Backend - Setup & Auth | ✅ | Spring Boot, PostgreSQL (full schema), JWT, Admin API |
| 2. Frontend - Setup & Auth | ✅ | Angular, Login/Register, Guards (auth end-to-end!) |
| 3. Backend - Photo Handling | ✅ | Upload, EXIF, thumbnails (3 sizes), Photo API, Rating system |
| 4. Frontend - Gallery & Map | ✅ | Gallery grid, Leaflet Map, Rating (stars), Upload (drag-and-drop), Filters |
| 📸 Photo Viewer Feature | ✅ | Fullscreen viewer, keyboard nav, mobile touch (Phases 1-4 complete) |
| 🤖 GitHub Copilot Setup | ✅ | Instructions, prompts, VS Code integration |
| 5. Admin Panel | 🔜 | Admin API, Admin UI |
| 6. Deployment | 🔜 | Mikrus config, Nginx, SSL, Monitoring |

**Legend:** 🔜 Pending | ⏳ In Progress | ✅ Completed

---

## 🚀 Workflow Reminder

### Before starting implementation:

1. **Read core docs** (15-20 min):
   - `.ai/prd.md` - MVP requirements
   - `.ai/tech-stack.md` - Technology decisions
   - This file - PROGRESS_TRACKER.md

2. **Read phase-specific plan**:
   - Database schema → `.ai/db-plan.md`
   - REST API → `.ai/api-plan.md`
   - UI components → `.ai/ui-plan.md`

3. **Implement** - Follow workflow guidelines from CLAUDE.md

---

## 📋 Phase 1: Backend - Setup & Auth

**Time:** ~2-3 hours | **Status:** ✅ Completed

### Tasks:

- [x] **1.1 Project Setup**
  - Spring Boot 3 project (Spring Initializr: Web, Data JPA, Security, PostgreSQL)
  - Configure `application.properties` (database, JWT secret)
  - Verify build with `./mvnw clean install`

- [x] **1.2 Database Schema (FULL SCHEMA)**
  - **Plan:** `.ai/db-plan.md`
  - Create **ALL tables** in one migration: `users`, `photos`, `ratings`
  - Create `User` entity (id, email, password, roles)
  - Create `Photo` entity (id, filename, location, exifData, userId)
  - Create `Rating` entity (id, photoId, userId, rating 1-5)
  - Flyway migration: `V1__initial_schema.sql` (users, photos, ratings + indexes)
  - **Note:** Full schema now, implement endpoints incrementally

- [x] **1.3 JWT Authentication**
  - Spring Security config with JWT
  - UserDetailsService implementation
  - `/api/auth/register` endpoint (POST)
  - `/api/auth/login` endpoint (POST → JWT token)
  - Unit tests (coverage >70%)
  - Test with curl/Postman

- [x] **1.4 Admin User Management API**
  - `/api/admin/users` GET (list all users with pagination - admin only)
  - `/api/admin/users/{id}/role` PUT (change user role - admin only)
  - `/api/admin/users/{id}` DELETE (delete user - admin only)
  - Unit tests (coverage >70%)
  - Test with curl (ADMIN JWT token)

### Acceptance Criteria:
- ✅ Backend compiles and runs on `localhost:8080`
- ✅ PostgreSQL connection works
- ✅ User can register and login
- ✅ JWT token is returned on login
- ✅ Protected endpoints require valid JWT

---

## 📋 Phase 2: Frontend - Setup & Auth

**Time:** ~2-3 hours | **Status:** ✅ Completed

**🎯 MILESTONE:** Działający auth flow end-to-end! Po tej fazie użytkownik może rejestrować się i logować przez przeglądarkę.

### Tasks:

- [x] **2.1 Angular Project Setup**
  - Angular 18 project (standalone components)
  - Tailwind CSS 3 configuration
  - Configure `proxy.conf.json` for backend API

- [x] **2.2 Auth Service**
  - **Plan:** `.ai/ui-plan.md`
  - `AuthService` with login/register methods
  - JWT token storage (localStorage)
  - HTTP interceptor for adding JWT to requests

- [x] **2.3 Login/Register Pages**
  - Login form component (email, password)
  - Register form component (email, password, confirm)
  - Tailwind CSS styling (utility-first)

- [x] **2.4 Auth Guards**
  - `authGuard` - protect routes requiring login
  - `adminGuard` - protect admin-only routes
  - Redirect to login if not authenticated

### Acceptance Criteria:
- ✅ Angular app runs on `localhost:4200`
- ✅ User can register and login via UI
- ✅ JWT token stored and sent with API requests
- ✅ Protected routes redirect to login
- ✅ **Auth flow działa end-to-end (backend + frontend)!**

---

## 📋 Phase 3: Backend - Photo Handling

**Time:** ~3-4 hours | **Status:** ✅ Completed (2025-10-25)

**Implementation:** Asynchronous processing with Spring Integration

**Note:** Database schema (photos, ratings tables) już istnieje z Phase 1. Zaimplementowano entities, repositories, services i API z asynchronicznym przetwarzaniem.

### Tasks:

- [x] **3.1 Photo Upload Endpoint (Refactored)**
  - **Plan:** `.ai/api-plan.md`
  - `/api/photos` POST (multipart/form-data) - returns 202 Accepted
  - Saves file to `input/` directory (async processing)
  - Returns status: "queued for processing"

- [x] **3.2 Spring Integration Setup**
  - File Inbound Channel Adapter - monitors `input/` directory
  - Scheduled Poller (10s interval)
  - Service Activator - PhotoProcessingService
  - Error Channel - moves failed photos to `failed/`

- [x] **3.3 EXIF Extraction (Async)**
  - Use `metadata-extractor` library
  - Extract GPS coordinates (latitude, longitude)
  - Extract date taken, camera model
  - Store in `Photo` entity EXIF fields
  - Executed by PhotoProcessingService

- [x] **3.4 Thumbnail Generation (Async)**
  - Use `Thumbnailator` library
  - Generate 3 sizes: small (150px), medium (400px), large (800px)
  - Save to separate folders: `small/`, `medium/`, `large/`
  - Original saved to `original/`
  - Executed by PhotoProcessingService

- [x] **3.5 Photo API Endpoints**
  - `/api/photos` GET (list all photos with pagination)
  - `/api/photos/{id}` GET (single photo details)
  - `/api/photos/{id}` DELETE (delete photo from all folders)
  - `/api/photos/{id}/rating` PUT (rate photo 1-5 stars)
  - `/api/photos/{id}/rating` DELETE (clear rating)
  - `/api/photos/{id}/thumbnail` GET (serve from `medium/`)
  - `/api/photos/{id}/full` GET (serve from `original/`)

### Folder Structure:
```
uploads/
├── input/      # Drop zone (web or scp/ftp)
├── original/   # Processed originals
├── small/      # 150px thumbnails
├── medium/     # 400px thumbnails
├── large/      # 800px thumbnails
└── failed/     # Processing errors + logs
```

### Acceptance Criteria:
- ✅ User can upload photo (JPG, PNG) - 202 Accepted response
- ✅ Batch upload supported (scp/ftp to `input/`)
- ✅ EXIF GPS coordinates extracted correctly (async)
- ✅ Thumbnails generated in 3 sizes to separate folders
- ✅ Photo metadata saved to database (user_id = admin)
- ✅ Photos can be listed, viewed, deleted
- ✅ Rating system działa (PUT + DELETE)
- ✅ Error handling - failed photos to `failed/` + log
- ✅ All tests passing (54 tests, 0 failures)

---

## 📋 Phase 4: Frontend - Gallery & Map

**Time:** ~4-5 hours | **Status:** ✅ Completed (2025-10-24)

### Tasks:

- [x] **4.1 Photo Service**
  - `PhotoService` with API methods (list, get, upload, delete, rate, clearRating)
  - RxJS BehaviorSubject for photo state
  - Error handling

- [x] **4.2 Gallery View**
  - **Plan:** `.ai/ui-plan.md` (GalleryComponent section)
  - Photo grid component (Tailwind grid)
  - Display thumbnails (medium size)
  - PhotoCardComponent with thumbnail + rating stars + actions

- [x] **4.3 Map View (Leaflet.js)**
  - Map component with Leaflet
  - Display markers for photos with GPS
  - MarkerCluster for grouped markers
  - Click marker → show photo preview popup

- [x] **4.4 Photo Rating**
  - Star rating component (1-5 stars)
  - Click star → call API PUT `/api/photos/{id}/rating`
  - Clear rating button → call API DELETE `/api/photos/{id}/rating`
  - Display user's rating

- [x] **4.5 Photo Upload Form**
  - UploadDialogComponent (file input, drag-and-drop)
  - File validation (JPG/PNG only)
  - Progress bar during upload

- [x] **4.6 Filtering & Navigation**
  - FilterBarComponent (date range + min rating)
  - FilterService with filters$ Observable
  - Navbar with Gallery/Map navigation and Logout

### Acceptance Criteria:
- ✅ Gallery displays all photos in responsive grid (1-4 columns)
- ✅ Map shows photos with GPS coordinates using MarkerCluster
- ✅ User can rate photos (1-5 stars)
- ✅ User can clear rating ze zdjęcia
- ✅ User can upload new photos via drag-and-drop
- ✅ Photos filterable by date range and min rating
- ✅ **Pełny MVP działa end-to-end!**

---

## 📋 Phase 5: Admin Panel

**Time:** ~2-3 hours | **Status:** 🔜 Pending

### Tasks:

- [ ] **5.1 Admin API Endpoints**
  - `/api/admin/users` GET (list all users)
  - `/api/admin/users/{id}` DELETE (delete user)
  - `/api/admin/photos` GET (list all photos with owners)
  - `/api/admin/photos/{id}` DELETE (delete any photo)

- [ ] **5.2 Admin UI**
  - **Plan:** `.ai/ui-plan.md` (AdminComponent section)
  - Admin dashboard component (user count, photo count)
  - User management table (list, delete)
  - Photo management table (list, delete)
  - Admin-only route with `adminGuard`

### Acceptance Criteria:
- ✅ Admin can view all users
- ✅ Admin can delete users
- ✅ Admin can view all photos
- ✅ Admin can delete any photo
- ✅ Regular users cannot access admin panel

---

## 📋 Phase 6: Deployment

**Time:** ~3-4 hours | **Status:** 🔜 Pending

### Tasks:

- [ ] **6.1 Backend Deployment**
  - Build JAR: `./mvnw clean package`
  - Systemd service for Spring Boot
  - Configure PostgreSQL on Mikrus
  - Environment variables for secrets

- [ ] **6.2 Frontend Deployment**
  - Build Angular: `ng build --configuration production`
  - Nginx configuration (serve static files + reverse proxy)
  - CORS configuration

- [ ] **6.3 SSL & Domain**
  - Let's Encrypt SSL certificate
  - Configure domain (if available)
  - Force HTTPS redirect

- [ ] **6.4 Monitoring**
  - Spring Boot Actuator endpoints
  - Basic health checks
  - Log files monitoring

### Acceptance Criteria:
- ✅ Backend runs on Mikrus with systemd
- ✅ Frontend served via Nginx
- ✅ SSL certificate active
- ✅ API accessible from frontend
- ✅ Health checks working

---

## 📖 Helpful Links

### Core Documentation:
- `README.md` - Project overview
- `CLAUDE.md` - Workflow instructions
- `.ai/prd.md` - MVP requirements
- `.ai/tech-stack.md` - Technology decisions

### Implementation Plans:
- `.ai/db-plan.md` - Database schema
- `.ai/api-plan.md` - REST API specification
- `.ai/ui-plan.md` - UI components architecture

---

## 🚀 Phase 2 - Future Enhancements (Post-MVP)

After completing MVP (6 phases above), possible feature enhancements:

### Group & Permissions System

**Description:** Photo sharing between users in groups with access control (UPDATE/READ permissions).

**Implementation phases:**
- [ ] **Backend - Group Management**
  - [ ] Entity: Group, GroupMember (JPA relationships)
  - [ ] Repository and Service layer
  - [ ] CRUD endpoints: create group, invite members, manage permissions
  - [ ] Unit and integration tests

- [ ] **Backend - Photo Permissions**
  - [ ] Migration: add `group_id` to `photos` table
  - [ ] Permission logic: UPDATE (full access) vs READ (view only + min rating filter)
  - [ ] Update PhotoService: check permissions on upload/rating
  - [ ] Test permissions logic

- [ ] **Frontend - Group Management UI**
  - [ ] Components: create group, members list, permissions editor
  - [ ] GroupService with RxJS state management
  - [ ] Routing and navigation for group management
  - [ ] UI tests (unit + E2E)

- [ ] **Frontend - Group Context in Gallery/Map**
  - [ ] Group selector dropdown (context switching)
  - [ ] Filter gallery/map by group
  - [ ] Display user permissions
  - [ ] Upload form: select target group
  - [ ] Rating: disable for READ permissions

- [ ] **Testing & Deployment**
  - [ ] E2E flows: create group, invite, share with READ permissions
  - [ ] Performance testing (multiple groups, large photo sets)
  - [ ] Security testing (permission bypass attempts)
  - [ ] Deployment with database migration

**Documentation:**
- Detailed requirements: `.ai/prd.md` section 8.1

**Estimated time:** 2-3 weeks development + testing

---

### Public Photo Sharing & Temporal/Spatial Filters

**Description:** Dwie niezależne funkcjonalności rozszerzające MVP:

1. **Public Photo Sharing** - Udostępnianie zdjęć w grupach bez logowania
   - Tworzenie grup zdjęć z unikalnym linkiem UUID
   - Bulk selection (checkboxes) i bulk operations (rating, data, usuwanie)
   - Publiczny widok galerii+mapy (read-only, no auth)
   - Zarządzanie grupami (dodawanie/usuwanie zdjęć, edycja, kasowanie)

2. **Temporal & Spatial Filters** - Zaawansowane filtry czasowo-przestrzenne
   - "W tym samym miesiącu w innych latach" (np. lipiec 2020, 2022, 2024)
   - "W tej samej lokalizacji w innych latach" (GPS + radius + lata)
   - Multi-select lat (checkboxes), auto-fill GPS z mapy
   - Haversine formula dla spatial queries

**Implementation phases:**
- [ ] **Phase 1.1:** Backend - Shared Groups API (3-4h)
- [ ] **Phase 1.2:** Frontend - Bulk Selection & Sharing UI (4-5h)
- [ ] **Phase 2.1:** Backend - Temporal & Spatial Queries (2-3h)
- [ ] **Phase 2.2:** Frontend - Smart Filters UI (3-4h)

**Recommended order:** Start with Temporal Filters (simpler, faster ROI), then Public Sharing

**Documentation:**
- **Public Sharing:** `.ai/features/feature-public-sharing.md` (7-9h)
- **Temporal & Spatial Filters:** `.ai/features/feature-temporal-spatial-filters.md` (5-7h)

**Estimated time:** 12-16 hours total (2-3 weekends)

---

### Email System (Post-MVP Security Enhancement)

**Description:** System obsługi emaili dla weryfikacji użytkowników i odzyskiwania hasła.

**Key Features:**
1. **Email Verification** - potwierdzenie rejestracji przez link w emailu
2. **Password Reset** - odzyskiwanie hasła przez email (token jednorazowy, 1h ważności)
3. **Email Notifications** (opcjonalne) - powiadomienia o aktywności

**Implementation phases:**
- [ ] **Phase 1:** Email Infrastructure - SMTP config + EmailService (3-4h)
- [ ] **Phase 2:** Email Verification - token system + endpoints (3-4h)
- [ ] **Phase 3:** Password Reset - forgot password flow (4-5h)
- [ ] **Phase 4:** Polish & Deployment - templates + testing (2-3h)

**Recommended SMTP:** Gmail (free, 500 emails/day) lub SendGrid (100 emails/day free)

**Documentation:** `.ai/features/feature-email-system.md` (full spec)

**Estimated time:** 12-16 hours (2-3 weekends)

---

### Admin Security Enhancements (Before Admin Panel)

**Description:** Bezpieczne zarządzanie kontem administratora.

**Key Features:**
1. **AdminInitializer** - auto-create default admin on startup (z `.env`)
2. **Must Change Password** - wymuszenie zmiany hasła przy pierwszym logowaniu
3. **Admin Profile Management** - zmiana email + hasło przez `/api/admin/profile`

**Implementation phases:**
- [ ] **Phase 1:** Database - migration dla `must_change_password` (30 min)
- [ ] **Phase 2:** AdminInitializer - CommandLineRunner + tests (45 min)
- [ ] **Phase 3:** Change Password - endpoint + logic (60 min)
- [ ] **Phase 4:** Admin Profile - endpoint + frontend (45 min)
- [ ] **Phase 5:** Testing & Deployment (30 min)

**Security Benefits:**
- ✅ Brak publicznej rejestracji admina
- ✅ Wymuszenie silnego hasła produkcyjnego
- ✅ Admin kontroluje swój email

**Documentation:** `.ai/implementation-admin-initializer.md` (full plan)

**Estimated time:** 3-4 hours

**Priority:** HIGH - implement before Admin Panel (Phase 5)

---

**Last Updated:** 2025-10-26
**Next Step:** Implement Admin Security Enhancements → Admin Panel → Deployment → Optional: Email System / Public Sharing / Temporal Filters
