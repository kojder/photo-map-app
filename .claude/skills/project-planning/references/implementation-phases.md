# Implementation Phases - Photo Map MVP

## Overview

Projekt Photo Map MVP podzielony jest na 6 głównych faz implementacji. Każda faza ma jasno zdefiniowane zadania i acceptance criteria.

**Tracking:** `PROGRESS_TRACKER.md` w root projektu

## Phase 1: Backend - Setup & Auth

**Timeline:** ~2 dni
**Prerequisites:** Brak

### Zadania

#### 1.1 Spring Boot Setup
- [ ] Inicjalizacja projektu Spring Boot 3
- [ ] Konfiguracja PostgreSQL connection
- [ ] Konfiguracja Flyway migrations
- [ ] Setup project structure (controller/service/repository/entity/dto)

#### 1.2 Database Schema
- [ ] Migracja: Create `users` table
  - id, username, email, password_hash, role, enabled, created_at
- [ ] Migracja: Create `photos` table
  - id, user_id, file_name, file_path, file_size, latitude, longitude, date_taken, rating, uploaded_at
- [ ] Indexes: users(email), photos(user_id), photos(date_taken)

#### 1.3 User Authentication
- [ ] Create `User` entity + `UserRepository`
- [ ] Implement `UserService` (registration, login)
- [ ] Password hashing (BCrypt)
- [ ] JWT token generation + validation
- [ ] Spring Security configuration

#### 1.4 Auth Endpoints
- [ ] POST `/api/auth/register` (email, password)
- [ ] POST `/api/auth/login` (email, password) → returns JWT
- [ ] GET `/api/auth/me` (requires JWT) → returns current user

#### 1.5 Error Handling
- [ ] Global exception handler (@ControllerAdvice)
- [ ] Consistent error response format (ErrorResponse DTO)
- [ ] Validation errors (400), Auth errors (401, 403)

### Acceptance Criteria
- ✅ User can register with email + password
- ✅ User can login and receive JWT token
- ✅ JWT token is validated on protected endpoints
- ✅ Passwords are hashed with BCrypt
- ✅ User data is isolated (user scoping enforced)
- ✅ Unit tests passing (UserService, JWT validation)
- ✅ Integration tests passing (auth endpoints with MockMvc)

---

## Phase 2: Backend - Photo Management

**Timeline:** ~3 dni
**Prerequisites:** Phase 1 complete

### Zadania

#### 2.1 Photo Entity & Repository
- [ ] Create `Photo` entity with JPA annotations
- [ ] Create `PhotoRepository` with custom queries
  - findByUserId()
  - findByUserIdAndRatingBetween()
  - findByUserIdAndDateTakenBetween()

#### 2.2 EXIF Extraction
- [ ] Add `metadata-extractor` dependency
- [ ] Create `ExifService` for GPS extraction
- [ ] Extract: latitude, longitude, date_taken, camera model

#### 2.3 Thumbnail Generation
- [ ] Add `Thumbnailator` dependency
- [ ] Create `ThumbnailService`
- [ ] Generate 3 sizes: 150px, 400px, 800px

#### 2.4 Spring Integration - Async Processing
- [ ] Add Spring Integration dependencies
- [ ] Configure FileInboundChannelAdapter (monitors `input/` folder)
- [ ] Scheduled poller (10s interval)
- [ ] Service Activator → PhotoProcessingService
- [ ] Error channel → move failed files to `failed/`

#### 2.5 Photo Endpoints
- [ ] POST `/api/photos/upload` (multipart/form-data) → 202 Accepted
- [ ] GET `/api/photos` (paginated, filtered)
- [ ] GET `/api/photos/{id}` (single photo)
- [ ] GET `/api/photos/{id}/thumbnail` (serve image)
- [ ] PUT `/api/photos/{id}/rating` (update rating)
- [ ] DELETE `/api/photos/{id}` (soft delete or hard delete with cascade)

#### 2.6 File Storage
- [ ] Configure storage path: `/opt/photo-map/storage/{userId}/`
- [ ] Folder structure: `input/`, `original/`, `small/`, `medium/`, `large/`, `failed/`
- [ ] Security: user can only access own files

### Acceptance Criteria
- ✅ User can upload photo via web (POST /api/photos/upload)
- ✅ User can drop multiple photos to `input/` folder (batch upload)
- ✅ System extracts EXIF (GPS, date) automatically
- ✅ System generates 3 thumbnail sizes
- ✅ Failed photos moved to `failed/` with error log
- ✅ User can list, view, rate, delete own photos
- ✅ User scoping enforced (can't access other users' photos)
- ✅ Unit tests passing (ExifService, ThumbnailService, PhotoService)
- ✅ Integration tests passing (photo endpoints)

---

## Phase 3: Frontend - Setup & Auth

**Timeline:** ~2 dni
**Prerequisites:** Phase 1 complete (backend auth working)

### Zadania

#### 3.1 Angular Setup
- [ ] Initialize Angular 18 project
- [ ] Configure Tailwind CSS 3.4.17 (NOT 4.x!)
- [ ] Setup routing (app.routes.ts)
- [ ] Configure environment files (API base URL)

#### 3.2 Auth Components
- [ ] Create `LoginComponent` (standalone)
- [ ] Create `RegisterComponent` (standalone)
- [ ] Reactive forms with validation
- [ ] Error display (authentication errors)

#### 3.3 Auth Service
- [ ] Create `AuthService` with BehaviorSubject pattern
- [ ] Methods: login(), register(), logout(), getCurrentUser()
- [ ] JWT storage (localStorage)
- [ ] HTTP interceptor (add JWT to headers)

#### 3.4 Route Guards
- [ ] Create `AuthGuard` (protect authenticated routes)
- [ ] Create `AdminGuard` (protect admin routes)
- [ ] Redirect to /login if not authenticated

#### 3.5 Routing
- [ ] Routes: `/login`, `/register`, `/gallery`, `/map`, `/admin`
- [ ] Protected routes: gallery, map, admin (use guards)
- [ ] Default redirect: `/` → `/gallery`

### Acceptance Criteria
- ✅ User can register via frontend form
- ✅ User can login via frontend form
- ✅ JWT token stored in localStorage
- ✅ JWT token added to all API requests (interceptor)
- ✅ AuthGuard redirects to /login if not authenticated
- ✅ Responsive design (mobile-first)
- ✅ Unit tests passing (AuthService, guards)

---

## Phase 4: Frontend - Gallery & Map

**Timeline:** ~4 dni
**Prerequisites:** Phase 2 complete (backend photos working), Phase 3 complete (frontend auth working)

### Zadania

#### 4.1 Photo Service
- [ ] Create `PhotoService` with BehaviorSubject pattern
- [ ] Methods: getPhotos(), uploadPhoto(), updateRating(), deletePhoto()
- [ ] State management: photos$ observable
- [ ] Filtering state: FilterService (rating, date range)

#### 4.2 Gallery Component
- [ ] Create `GalleryComponent` (grid layout)
- [ ] Responsive grid: 1-5 columns (mobile-first)
- [ ] Photo cards with: thumbnail, name, rating, date
- [ ] Lazy loading (intersection observer)
- [ ] Pagination (20 photos per page)

#### 4.3 Photo Card Component
- [ ] Create `PhotoCardComponent`
- [ ] Display: thumbnail, name, file size, rating, date
- [ ] Actions: rate, view full size, delete
- [ ] Rating widget (clickable stars 1-5)

#### 4.4 Upload Component
- [ ] Create `UploadComponent`
- [ ] File input (accept="image/jpeg,image/png")
- [ ] Upload button
- [ ] Progress feedback (optional)
- [ ] Refresh gallery after upload

#### 4.5 Filter Component
- [ ] Create `FilterComponent`
- [ ] Rating filter (min-max range)
- [ ] Date filter (date range picker)
- [ ] Clear filters button
- [ ] Filtered count display

#### 4.6 Map Component
- [ ] Create `MapComponent` with Leaflet.js
- [ ] Initialize map with OpenStreetMap tiles
- [ ] Add markers for photos with GPS
- [ ] Marker clustering (Leaflet.markercluster)
- [ ] Popups: thumbnail, name, date, rating
- [ ] fitBounds (auto-zoom to show all markers)
- [ ] Statistics: "X of Y photos have GPS"

#### 4.7 Sorting
- [ ] Sortowanie po: date, name, rating, file size
- [ ] Ascending/Descending toggle

### Acceptance Criteria
- ✅ Gallery displays photos in responsive grid (1-5 columns)
- ✅ User can upload photos via web form
- ✅ User can rate photos (1-5 stars) inline in gallery
- ✅ User can filter by rating (min-max)
- ✅ User can filter by date (date range)
- ✅ User can combine filters (rating AND date)
- ✅ User can sort by date/name/rating/size
- ✅ Map displays photos with GPS data
- ✅ Map clustering works for multiple photos
- ✅ Map popups show photo details (thumbnail, name, rating, date)
- ✅ Layout is responsive (mobile, tablet, desktop)
- ✅ Unit tests passing (PhotoService, FilterService)
- ✅ Component tests passing

---

## Phase 5: Admin Panel

**Timeline:** ~1 dzień
**Prerequisites:** Phase 1-4 complete

### Zadania

#### 5.1 Admin Endpoints (Backend)
- [ ] GET `/api/admin/users` (list all users) - ADMIN only
- [ ] PUT `/api/admin/users/{id}/role` (change user role) - ADMIN only
- [ ] @PreAuthorize("hasRole('ADMIN')") na endpoints

#### 5.2 Admin Component (Frontend)
- [ ] Create `AdminComponent`
- [ ] Display: user list (id, email, role, created_at, photo count)
- [ ] Actions: change role (USER ↔ ADMIN)
- [ ] Accessible only for ADMIN role (AdminGuard)

### Acceptance Criteria
- ✅ Admin can view list of all users
- ✅ Admin can change user role (USER ↔ ADMIN)
- ✅ Admin endpoints return 403 Forbidden for non-admin users
- ✅ Admin panel visible only for ADMIN role
- ✅ Unit tests passing (AdminService)
- ✅ Integration tests passing (admin endpoints)

---

## Phase 6: Deployment

**Timeline:** ~1-2 dni
**Prerequisites:** Phase 1-5 complete, tested locally

### Zadania

#### 6.1 Mikrus VPS Setup
- [ ] Zainstalować Java 17
- [ ] Zainstalować PostgreSQL 15
- [ ] Zainstalować Nginx
- [ ] Utworzyć użytkownika `photo-map` (non-root)
- [ ] Utworzyć folder `/opt/photo-map/`

#### 6.2 Backend Deployment
- [ ] Build JAR: `./mvnw clean package`
- [ ] Skopiować JAR na VPS (scp)
- [ ] Utworzyć systemd service: `/etc/systemd/system/photo-map-backend.service`
- [ ] Konfiguracja: application-prod.properties (DB credentials, storage path)
- [ ] Start service: `systemctl start photo-map-backend`
- [ ] Enable auto-start: `systemctl enable photo-map-backend`

#### 6.3 Frontend Deployment
- [ ] Build production: `ng build --configuration production`
- [ ] Skopiować dist/ na VPS: `/var/www/photo-map/`
- [ ] Konfiguracja Nginx:
  - Serve static files z `/var/www/photo-map/`
  - Proxy `/api/*` do `localhost:8080`
  - Gzip compression
  - HTTPS redirect

#### 6.4 Database Migration
- [ ] Utworzyć production database
- [ ] Flyway migrations (auto-run on startup)
- [ ] Zweryfikować schema

#### 6.5 SSL Certificate
- [ ] Zainstalować Certbot
- [ ] Wygenerować Let's Encrypt certificate
- [ ] Konfigurować Nginx dla HTTPS
- [ ] Auto-renewal (cron job)

#### 6.6 Monitoring
- [ ] Spring Boot Actuator endpoints:
  - `/actuator/health` (public)
  - `/actuator/metrics` (admin only)
- [ ] Logs: `/opt/photo-map/logs/`
- [ ] Database backups (cron job)

### Acceptance Criteria
- ✅ Aplikacja dostępna pod domeną (HTTPS)
- ✅ Backend API działa poprawnie
- ✅ Frontend ładuje się < 3s
- ✅ SSL certificate valid
- ✅ Database migrations applied
- ✅ Systemd service auto-starts on reboot
- ✅ Logs są dostępne
- ✅ Health check endpoint działa

---

## Progress Tracking

**Dokument:** `PROGRESS_TRACKER.md` (root projektu)

**Struktura:**
```markdown
## Current Status

**Last Completed:** Phase X, Task Y.Z
**Currently Working On:** Phase X, Task Y.Z
**Next Action:** Brief description of next steps

## Phase 1: Backend - Setup & Auth
- [x] 1.1 Spring Boot Setup
- [ ] 1.2 Database Schema
...
```

**Update frequency:** Po każdym zakończonym zadaniu (task)

## Related Documentation

- `PROGRESS_TRACKER.md` - live progress tracking
- `workflow-3x3.md` - jak rozbić każde zadanie na chunks
- `verification-checklist.md` - checklist przed/podczas/po implementacji
- `.ai/prd.md` - MVP requirements
- `.ai/tech-stack.md` - tech specs
- `.ai/db-plan.md` - database schema
- `.ai/api-plan.md` - REST API specification
- `.ai/ui-plan.md` - frontend architecture
