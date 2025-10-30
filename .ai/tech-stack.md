# Technology Stack - Photo Map MVP

**Version:** 3.0 (Specs Only)
**Date:** 2025-10-19
**Target:** Full-stack MVP on Mikrus VPS

> **For decision rationale:** See `.decisions/tech-decisions.md`

---

## Overview

Stack for MVP:
- **Frontend:** Angular 18, TypeScript 5, Tailwind CSS 3, Leaflet.js
- **Backend:** Spring Boot 3, Java 17, PostgreSQL 15
- **Deployment:** Nginx, Systemd, Mikrus VPS
- **Auth:** JWT (stateless), BCrypt password hashing

---

## Frontend Stack

### Angular 18.2.0
- **Standalone components** - no NgModules
- **Signals** - reactive state management
- **Control flow:** @if, @for, @switch (no *ngIf, *ngFor)
- **CLI:** scaffolding, build, dev server
- **Routing:** built-in Angular Router

### TypeScript 5.5.2+ (Strict Mode)
- **Strict mode enabled**
- **No implicit any**
- **Strict null checks**
- **Required by Angular**

### RxJS 7.8.0
- **Pattern:** `BehaviorSubject` (private) → `Observable` (public) → Component
- **Services:** PhotoService, AuthService, FilterService
- **Async pipe** in templates (automatic subscription management)

### Tailwind CSS 3.4.17
> **Note:** Tailwind 3.x (Angular 18 incompatible with Tailwind 4)

- **Utility-first** styling
- **Responsive:** mobile-first breakpoints (sm, md, lg, xl)
- **PurgeCSS:** removes unused styles
- **Config:** `tailwind.config.js` with content paths `src/**/*.{html,ts}`

### Leaflet.js 1.9.4
- **Lightweight:** ~40KB gzipped
- **OpenStreetMap tiles** (free, no API keys)
- **Plugin:** Leaflet.markercluster 1.5.3 (marker clustering)
- **Integration:** vanilla JS in Angular component

### State Management
- **Angular Services + RxJS** (NO NgRx)
- **Pattern:** BehaviorSubject for state
- **Services:**
  - `PhotoService` - photo data, CRUD operations
  - `AuthService` - user authentication, JWT token
  - `FilterService` - filter state (rating, date range)

### HTTP & Routing
- **HttpClient:** built-in Angular HTTP
- **Interceptors:**
  - Auth interceptor (adds JWT to headers)
  - Error interceptor (handles 401, 403, 500)
- **Router:**
  - Route guards: `AuthGuard`, `AdminGuard`
  - Routes: `/login`, `/gallery`, `/map`, `/admin`

### Development & Build
- **Angular CLI 18.2.0**
- **Commands:**
  - `ng serve` - dev server (localhost:4200)
  - `ng build` - production build
  - `ng test` - unit tests (Karma + Jasmine)

---

## Backend Stack

### Spring Boot 3.2.11 (Java 17 LTS)
- **Embedded Tomcat** - JAR deployment
- **Auto-configuration** - minimal setup
- **Modules:** Spring Data JPA, Spring Security, Spring Boot Actuator, Spring Integration

### PostgreSQL 15
- **Schema:**
  - `users` table: id, username, password_hash, email, role, enabled
  - `photos` table: id, user_id, fileName, fileSize, latitude, longitude, dateTaken, rating, uploadedAt

### Spring Data JPA
- **Repository pattern:**
  - `UserRepository extends JpaRepository<User, Long>`
  - `PhotoRepository extends JpaRepository<Photo, Long>`
- **Query methods** - derive queries from method names
- **@Transactional** - declarative transaction management

### Spring Security 6 (JWT)
- **JWT authentication:** stateless
- **Token expiration:** 24 hours (configurable)
- **Password encoding:** BCrypt (built-in)
- **Authorization:**
  - Roles: USER, ADMIN
  - Method security: `@PreAuthorize("hasRole('ADMIN')")`
  - All photos are public (no ownership restrictions for MVP)

**JWT Flow:**
1. User logs in → server validates credentials
2. Server generates JWT (user ID, roles, expiration)
3. Client stores JWT (localStorage)
4. Client sends JWT in `Authorization: Bearer <token>` header
5. Server validates JWT signature and expiration

### Photo Processing

#### metadata-extractor 2.19.0
- **Pure Java** (no native dependencies)
- **Extract:** GPS (lat/lng/altitude), dateTaken, image dimensions
- **Formats:** JPEG, PNG, TIFF, HEIC/HEIF

#### Thumbnailator 0.4.20
- **Thumbnail size:** Medium 300x300px (gallery grid + map markers)
- **Full resolution:** Original files served for fullscreen viewer
- **Quality:** preserve image quality
- **Formats:** JPEG, PNG

### Spring Integration File

#### Asynchronous Photo Processing
- **File Inbound Channel Adapter** - monitors `input/` directory
- **Scheduled Poller** - checks for new files every 10 seconds (configurable)
- **Service Activator** - triggers PhotoProcessingService for each file
- **Error Channel** - handles processing failures, moves files to `failed/`

#### Folder Structure
```
uploads/
├── input/      # Drop zone for new photos (web upload or scp/ftp)
├── original/   # Processed originals (full resolution, fullscreen viewer)
├── medium/     # 300px thumbnails (gallery + map)
└── failed/     # Failed processing + error logs
```

#### Benefits
- **Decoupled upload & processing** - fast web response (202 Accepted)
- **Batch upload support** - easy scp/ftp for large photo collections
- **Error resilience** - one failed photo doesn't block others
- **Scalability** - processing can be tuned independently

#### HEIC/HEIF Support

> **MVP Scope:** HEIC/HEIF support is **NOT included** in MVP

**Rationale:**
- `metadata-extractor` ✅ CAN read EXIF from HEIC files
- `Thumbnailator` ❌ does NOT natively support HEIC format
- HEIC thumbnails require additional ImageIO plugin or pre-conversion

**MVP Decision:**
- Upload validation: Accept **JPEG and PNG only**
- Frontend validation: `accept="image/jpeg,image/png"`
- Backend validation: Check MIME type `image/jpeg` or `image/png`

**Future Enhancement (Post-MVP):**
- Option 1: Add HEIC→JPEG conversion before thumbnail generation
- Option 2: Add `imageio-heif` plugin to support HEIC natively
- Option 3: Client-side HEIC conversion (before upload)

**Related:**
- PRD originally mentioned HEIC/HEIF - moved to future scope
- See `.decisions/tech-decisions.md` for detailed comparison

### API Documentation
- **Springdoc OpenAPI 2.3.0**
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **Automatic:** generates docs from annotations

### Spring Boot Actuator
- **Endpoints:**
  - `/health` - public (health check)
  - `/metrics`, `/info` - admin only
- **Monitoring:** check if app is running

### Development Tools
- **Lombok** - reduce boilerplate (@Data, @Builder, @NoArgsConstructor)
- **Maven** - build tool, dependency management
- **Flyway** - database migrations (SQL files in Git)

### Testing
- **Backend:** JUnit 5 + Mockito + Spring Boot Test
- **Frontend:** Karma + Jasmine (Angular default)

---

## Deployment Stack (Mikrus VPS)

### Nginx
- **Reverse proxy:** forward `/api/*` to Spring Boot (localhost:8080)
- **Static files:** serve Angular build at `/var/www/photo-map/`
- **HTTPS:** Let's Encrypt SSL
- **Gzip compression:** enabled

### Systemd
- **Service file:** `/etc/systemd/system/photo-map-backend.service`
- **Auto-restart:** on crashes
- **Boot start:** start on server reboot
- **User:** photo-map (non-root)

### Let's Encrypt + Certbot
- **Free SSL certificates**
- **Automatic renewal**
- **Setup:** Certbot with Nginx plugin

---

## Mikrus VPS Optimizations

### Backend
- **JVM heap:** 512MB-1GB (depends on VPS plan)
- **PostgreSQL connections:** limit to 10-20
- **Caching:** in-memory (60s TTL) for photo lists
- **No background queues:** process immediately

### Frontend
- **Production build:** AOT compilation, minification, tree-shaking
- **Lazy loading:** load routes on-demand (if needed)
- **Images:** serve thumbnails, not originals
- **Gzip:** enabled in Nginx

### Database
- **Indexes:** on user_id, dateTaken (fast queries)
- **Max connections:** 20
- **Queries:** simple LIKE queries (no full-text search for MVP)

---

## Success Criteria

✅ MVP delivered in 10 days
✅ Pages load <2 seconds on Mikrus
✅ Security: BCrypt passwords, JWT validation, user-scoped data
✅ 99% uptime (excluding maintenance)
✅ Can handle 10 concurrent users

---

**Document Purpose:** Implementation specs for Claude Code
**Related:** `.decisions/tech-decisions.md` (decision rationale)
**Last Updated:** 2025-10-19
