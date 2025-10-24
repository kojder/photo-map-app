# 🎯 Photo Map MVP - Progress Tracker

**Created:** 2025-10-19
**Status:** 🔜 Documentation ready - awaiting implementation

---

## 🔄 Current Status

**Last Updated:** 2025-10-24

**Phase:** 4. Frontend - Gallery & Map (✅ Completed)

**Last Completed:**
- ✅ Phase 4: Frontend - Gallery & Map (2025-10-24)
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

**Currently Working On:**
- 🎉 Phase 4 completed! Pełny MVP działa end-to-end (auth + gallery + map + upload + rating)!

**Next Action:**
1. Testy manualne - sprawdzenie całego flow (login → upload → gallery → rating → map)
2. (Optional) Phase 5: Admin Panel

**Blocked By:** None

---

## 📊 Project Status

**Overall Progress:** 4/6 phases (67%)

| Phase | Status | Description |
|------|--------|------|
| 1. Backend - Setup & Auth | ✅ | Spring Boot, PostgreSQL (full schema), JWT, Admin API |
| 2. Frontend - Setup & Auth | ✅ | Angular, Login/Register, Guards (auth end-to-end!) |
| 3. Backend - Photo Handling | ✅ | Upload, EXIF, thumbnails (3 sizes), Photo API, Rating system |
| 4. Frontend - Gallery & Map | ✅ | Gallery grid, Leaflet Map, Rating (stars), Upload (drag-and-drop), Filters |
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

**Time:** ~3-4 hours | **Status:** 🔜 Pending

**Note:** Database schema (photos, ratings tables) już istnieje z Phase 1. Teraz implementujemy entities, repositories, services i API.

### Tasks:

- [ ] **3.1 Photo Upload Endpoint**
  - **Plan:** `.ai/api-plan.md`
  - `/api/photos/upload` POST (multipart/form-data)
  - Save file to disk (`/uploads` directory)
  - Return photo ID and filename

- [ ] **3.2 EXIF Extraction**
  - Use `metadata-extractor` library
  - Extract GPS coordinates (latitude, longitude)
  - Extract date taken, camera model
  - Store in `Photo` entity EXIF fields

- [ ] **3.3 Thumbnail Generation**
  - Use `Thumbnailator` library
  - Generate 3 sizes: small (150x150), medium (400x400), large (800x800) - square thumbnails
  - Save thumbnails alongside original photo
  - Return thumbnail URLs

- [ ] **3.4 Photo API Endpoints**
  - `/api/photos` GET (list all photos with pagination)
  - `/api/photos/{id}` GET (single photo details)
  - `/api/photos/{id}` DELETE (delete photo)
  - `/api/photos/{id}/rating` PUT (rate photo 1-5 stars)
  - `/api/photos/{id}/rating` DELETE (clear rating)

### Acceptance Criteria:
- ✅ User can upload photo (JPG, PNG)
- ✅ EXIF GPS coordinates extracted correctly
- ✅ Thumbnails generated in 3 sizes
- ✅ Photo metadata saved to database
- ✅ Photos can be listed, viewed, deleted
- ✅ Rating system działa (PUT + DELETE)

---

## 📋 Phase 4: Frontend - Gallery & Map

**Time:** ~4-5 hours | **Status:** 🔜 Pending

### Tasks:

- [ ] **4.1 Photo Service**
  - `PhotoService` with API methods (list, get, upload, delete, rate, clearRating)
  - RxJS BehaviorSubject for photo state
  - Error handling

- [ ] **4.2 Gallery View**
  - **Plan:** `.ai/ui-plan.md` (GalleryComponent section)
  - Photo grid component (Tailwind grid)
  - Display thumbnails (medium size)
  - Click photo → open modal with full image

- [ ] **4.3 Map View (Leaflet.js)**
  - Map component with Leaflet
  - Display markers for photos with GPS
  - Click marker → show photo preview
  - Filter photos by date range

- [ ] **4.4 Photo Rating**
  - Star rating component (1-5 stars)
  - Click star → call API PUT `/api/photos/{id}/rating`
  - Clear rating button → call API DELETE `/api/photos/{id}/rating`
  - Display average rating lub "No rating yet"

- [ ] **4.5 Photo Upload Form**
  - Upload form component (file input, drag-and-drop)
  - Preview before upload
  - Progress bar during upload

### Acceptance Criteria:
- ✅ Gallery displays all photos in grid
- ✅ Map shows photos with GPS coordinates
- ✅ User can rate photos (1-5 stars)
- ✅ User can clear rating ze zdjęcia
- ✅ User can upload new photos
- ✅ Photos filterable by date
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

**Last Updated:** 2025-10-19
**Next Step:** Start Phase 1 - Backend Setup & Auth
