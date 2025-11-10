# Architecture & Design

> Complete overview of Photo Map MVP architecture - tech stack, frontend/backend design, database schema, photo processing pipeline, and design decisions.

---

## 📖 Table of Contents

- Tech Stack Overview
- Frontend Architecture
- Backend Architecture
- Database Schema
- Photo Processing Pipeline
- Security Architecture
- Design Decisions

---

## 🛠️ Tech Stack Overview

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Angular** | 18.2.0 | Frontend framework (standalone components) |
| **TypeScript** | 5.5.2+ | Strongly-typed JavaScript (strict mode) |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework ⚠️ |
| **Leaflet.js** | 1.9.4 | Interactive maps with GPS markers |
| **Leaflet MarkerCluster** | 1.5.3 | Marker clustering for map performance |
| **RxJS** | 7.8.0 | Reactive programming (BehaviorSubject pattern) |

⚠️ **Important:** Tailwind 3.x only - Tailwind 4 is incompatible with Angular 18

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Spring Boot** | 3.2.11 | Backend framework (Java 17 LTS) |
| **PostgreSQL** | 15 | Relational database |
| **Spring Security** | 6 | JWT authentication, BCrypt password hashing |
| **Spring Data JPA** | - | Database abstraction layer |
| **Flyway** | - | Database migrations |
| **metadata-extractor** | 2.19.0 | EXIF GPS + timestamp extraction |
| **Thumbnailator** | 0.4.20 | Thumbnail generation (300px) |
| **Spring Integration File** | - | Async photo processing pipeline |

### Testing

| Technology | Purpose |
|-----------|---------|
| **Karma + Jasmine** | Frontend unit tests (199 tests) |
| **JUnit 5 + Mockito** | Backend unit tests (78 tests) |
| **Spring Boot Test** | Backend integration tests |
| **Playwright** | E2E tests (6 specs, 15+ test cases) |
| **JaCoCo** | Backend code coverage |
| **LCOV** | Frontend code coverage |

### Deployment

| Technology | Purpose |
|-----------|---------|
| **Docker Compose** | Container orchestration |
| **Nginx** | Reverse proxy (in frontend container) |
| **PostgreSQL** | Shared Mikrus service (psql01.mikr.us) |
| **Mikrus VPS** | Production hosting (4GB RAM, srv07) |

---

## 🎨 Frontend Architecture

### Angular 18 Standalone Components

**Key Characteristics:**
- ✅ **No NgModules** - All components are standalone
- ✅ **Flat routing** - `app.routes.ts` with Routes array
- ✅ **Signal API** - Component-local state
- ✅ **BehaviorSubject** - Shared state in services
- ✅ **Reactive approach** - `async` pipe in templates
- ✅ **Test IDs** - All interactive elements have `data-testid` attributes

### Component Structure

```
src/app/
├── components/                    # UI Components
│   ├── gallery/
│   │   ├── gallery.component.ts   # Photo grid view
│   │   └── photo-card/            # Individual photo card
│   ├── map/
│   │   └── map.component.ts       # Leaflet.js map view
│   ├── navbar/
│   │   └── navbar.component.ts    # Top navigation bar
│   ├── filters/
│   │   └── filters.component.ts   # Filter sidebar panel
│   ├── photo-viewer/
│   │   └── photo-viewer.component.ts  # Fullscreen photo viewer
│   ├── auth/
│   │   ├── login/                 # Login page
│   │   └── register/              # Registration page
│   └── admin/
│       └── admin.component.ts     # Admin panel (user + photo management)
│
├── services/                      # Business Logic Services
│   ├── auth.service.ts            # Authentication (JWT)
│   ├── photo.service.ts           # Photo CRUD operations
│   ├── filter.service.ts          # Filter state management
│   ├── rating.service.ts          # Rating operations
│   └── admin.service.ts           # Admin operations
│
├── guards/                        # Route Guards
│   ├── auth.guard.ts              # Authentication guard (logged in)
│   └── admin.guard.ts             # Admin role guard
│
├── models/                        # TypeScript Interfaces
│   ├── photo.model.ts             # Photo interface
│   ├── user.model.ts              # User interface
│   ├── filter.model.ts            # Filter criteria interface
│   └── rating.model.ts            # Rating interface
│
├── app.config.ts                  # Application configuration
└── app.routes.ts                  # Routing configuration
```

### State Management Strategy

**Signals (Component-Local State):**
- Counters, UI flags, computed values
- Example: `selectedPhotoIndex = signal<number>(0)`
- Reactive updates with `computed()` and `effect()`

**BehaviorSubject (Shared State in Services):**
- Cross-component communication
- Pattern: `private subject = new BehaviorSubject<T>(initial)`
- Public observable: `public observable$ = subject.asObservable()`
- Components subscribe with `async` pipe

**Example:**
```typescript
// photo.service.ts
export class PhotoService {
  private photosSubject = new BehaviorSubject<Photo[]>([]);
  public photos$ = this.photosSubject.asObservable();

  loadPhotos() {
    this.http.get<Photo[]>('/api/photos').subscribe(photos => {
      this.photosSubject.next(photos);
    });
  }
}

// gallery.component.ts
@Component({
  template: `
    <div *ngFor="let photo of photos$ | async">
      <!-- Photo card -->
    </div>
  `
})
export class GalleryComponent {
  photos$ = this.photoService.photos$;

  constructor(private photoService: PhotoService) {
    this.photoService.loadPhotos();
  }
}
```

**Why not NgRx?**
- Too complex for MVP
- BehaviorSubject + Signals sufficient for simple state management
- Easier to understand and maintain

### Routing Configuration

**Routes (app.routes.ts):**
```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'gallery', component: GalleryComponent, canActivate: [AuthGuard] },
  { path: 'map', component: MapComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
];
```

**Guards:**
- `AuthGuard` - Checks JWT token, redirects to login if not authenticated
- `AdminGuard` - Checks ADMIN role, redirects to gallery if not admin

---

## 🚀 Backend Architecture

### Spring Boot 3 Layered Architecture

```
src/main/java/com/photomap/
├── controller/                    # REST Controllers (API endpoints)
│   ├── AuthController.java        # /api/auth/* (login, register)
│   ├── PhotoController.java       # /api/photos/* (CRUD, rating)
│   └── AdminController.java       # /api/admin/* (user + photo management)
│
├── service/                       # Business Logic Services
│   ├── AuthService.java           # Authentication logic
│   ├── PhotoService.java          # Photo operations
│   ├── PhotoProcessingService.java # EXIF extraction, thumbnail generation
│   ├── RatingService.java         # Rating calculations
│   └── AdminService.java          # Admin operations
│
├── repository/                    # JPA Repositories (Data Access)
│   ├── UserRepository.java        # User entity repository
│   ├── PhotoRepository.java       # Photo entity repository
│   └── RatingRepository.java      # Rating entity repository
│
├── model/                         # JPA Entities (Database Tables)
│   ├── User.java                  # users table
│   ├── Photo.java                 # photos table
│   ├── Rating.java                # ratings table
│   └── Permission.java            # permissions table (enum)
│
├── dto/                           # Data Transfer Objects (API contracts)
│   ├── request/
│   │   ├── LoginRequest.java      # Login DTO
│   │   ├── RegisterRequest.java   # Registration DTO
│   │   └── PhotoUploadRequest.java # Upload DTO
│   └── response/
│       ├── AuthResponse.java      # JWT token response
│       ├── PhotoResponse.java     # Photo DTO
│       └── ErrorResponse.java     # Error DTO
│
├── security/                      # JWT + Spring Security
│   ├── JwtTokenProvider.java      # JWT generation + validation
│   ├── JwtAuthenticationFilter.java # JWT filter (extract token from header)
│   └── SecurityConfig.java        # Spring Security configuration
│
└── config/                        # Application Configuration
    ├── WebConfig.java             # CORS configuration
    └── PhotoProcessingConfig.java # Spring Integration File config
```

### REST API Design

**Authentication Endpoints:**
- `POST /api/auth/login` - Login (returns JWT token)
- `POST /api/auth/register` - Register (manual activation by admin)

**Photo Endpoints:**
- `GET /api/photos` - List all photos (with filters)
- `GET /api/photos/{id}` - Get photo by ID
- `POST /api/photos/upload` - Upload photo(s)
- `DELETE /api/photos/{id}` - Delete photo (future feature)
- `POST /api/photos/{id}/rate` - Rate photo (1-5 stars)
- `GET /api/photos/{id}/ratings` - Get photo ratings

**Admin Endpoints:**
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/{id}/activate` - Activate user
- `PUT /api/admin/users/{id}/deactivate` - Deactivate user
- `PUT /api/admin/users/{id}/permissions` - Update user permissions

**Security:**
- All endpoints (except `/api/auth/*`) require JWT authentication
- JWT token in `Authorization: Bearer <token>` header
- Role-based access control (ADMIN role for `/api/admin/*`)

### Spring Security Configuration

**JWT Authentication Flow:**

1. User logs in: `POST /api/auth/login` with email + password
2. Backend validates credentials (BCrypt password check)
3. Backend generates JWT token (signed with `JWT_SECRET`)
4. Client stores JWT token in localStorage
5. Client includes token in all subsequent requests: `Authorization: Bearer <token>`
6. `JwtAuthenticationFilter` extracts and validates token
7. Spring Security context is populated with user details
8. Request proceeds if authenticated

**JWT Token Structure:**
```json
{
  "sub": "user@example.com",
  "roles": ["USER", "ADMIN"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Password Hashing:**
- BCrypt with strength 10
- Salted and hashed passwords stored in database
- Never store plain-text passwords

---

## 🗄️ Database Schema

### ER Diagram Overview

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │
│ email (unique)      │
│ password_hash       │
│ is_active           │
│ role                │
│ created_at          │
└─────────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────┐
│       photos        │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ filename            │
│ latitude            │
│ longitude           │
│ taken_at            │
│ uploaded_at         │
│ original_path       │
│ medium_path         │
└─────────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────┐
│      ratings        │
├─────────────────────┤
│ id (PK)             │
│ photo_id (FK)       │
│ user_id (FK)        │
│ rating (1-5)        │
│ created_at          │
└─────────────────────┘
```

### Tables

**users:**
- `id` - Primary key (UUID)
- `email` - Unique email address
- `password_hash` - BCrypt hashed password
- `is_active` - Account active status (true by default)
- `role` - User role (USER, ADMIN)
- `permissions` - JSON array of permissions (VIEW_PHOTOS, RATE_PHOTOS)
- `created_at` - Registration timestamp

**photos:**
- `id` - Primary key (UUID)
- `user_id` - Foreign key to users table
- `filename` - Original filename
- `latitude`, `longitude` - GPS coordinates (extracted from EXIF)
- `taken_at` - Photo taken timestamp (from EXIF)
- `uploaded_at` - Upload timestamp
- `original_path` - Path to full-resolution photo
- `medium_path` - Path to 300px thumbnail

**ratings:**
- `id` - Primary key (UUID)
- `photo_id` - Foreign key to photos table
- `user_id` - Foreign key to users table
- `rating` - Rating value (1-5 stars)
- `created_at` - Rating timestamp
- **Unique constraint:** (photo_id, user_id) - one rating per user per photo

### Database Migrations

**Flyway Migrations (src/main/resources/db/migration/):**

- `V1__create_users_table.sql` - Users table
- `V2__create_photos_table.sql` - Photos table
- `V3__create_ratings_table.sql` - Ratings table
- `V4__add_permissions_to_users.sql` - Permissions column
- `V5__create_indexes.sql` - Performance indexes

**Automatic Migration:**
- Flyway runs migrations automatically on backend startup
- Migrations are versioned and idempotent
- Never modify existing migrations (create new ones instead)

For detailed database schema, see `.ai/db-plan.md` in the repository.

---

## 📸 Photo Processing Pipeline

### Upload Flow

```
1. User uploads photo(s)
   ↓
2. Frontend: POST /api/photos/upload (multipart/form-data)
   ↓
3. Backend: Save to uploads/input/ (drop zone)
   ↓
4. Spring Integration File: Watch input/ directory
   ↓
5. Photo Processing Service:
   - Extract EXIF metadata (GPS, timestamp)
   - Generate thumbnail (300px) with Thumbnailator
   - Move original to uploads/original/
   - Save thumbnail to uploads/medium/
   - Create database record (Photo entity)
   ↓
6. Frontend: Refresh photo list (polling or WebSocket)
   ↓
7. Photo appears in Gallery and Map (if GPS data exists)
```

### EXIF Extraction

**metadata-extractor library:**
- Extracts GPS coordinates (latitude, longitude)
- Extracts timestamp (date + time photo was taken)
- Extracts camera info (model, lens, settings) - not displayed in MVP

**Supported formats:**
- JPEG/JPG (recommended - contains EXIF data)
- PNG (supported but usually lacks GPS data)

**GPS Data:**
- Required for Map view
- Photos without GPS appear only in Gallery

### Thumbnail Generation

**Thumbnailator library:**
- Generates 300px thumbnails
- Maintains aspect ratio
- High quality (compression 0.9)
- Used in Gallery and Map views

**Storage Structure:**
```
uploads/
├── input/      # Drop zone (watched by Spring Integration)
├── original/   # Full-resolution originals
├── medium/     # 300px thumbnails
└── failed/     # Processing errors
```

### Error Handling

**Processing Errors:**
- Photos with invalid format → moved to `uploads/failed/`
- Photos without GPS → saved with `null` lat/lng
- EXIF extraction errors → logged, photo still saved

---

## 🔒 Security Architecture

### Authentication & Authorization

**JWT Tokens:**
- Signed with `JWT_SECRET` from `.env` file
- Stored in browser localStorage
- Included in `Authorization: Bearer <token>` header
- Expires after configurable period

**Password Security:**
- BCrypt hashing with strength 10
- Salted passwords (unique salt per user)
- Never store plain-text passwords

**Role-Based Access Control (RBAC):**
- **USER** role - Default for all registered users
- **ADMIN** role - Admin panel access, user management

**Permission-Based Access Control:**
- `VIEW_PHOTOS` - View photos in Gallery and Map
- `RATE_PHOTOS` - Rate photos (1-5 stars)

### CORS Configuration

**Allowed Origins:**
- Development: `http://localhost:4200`
- Production: `https://your-domain.com`

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- `Authorization`, `Content-Type`

### SQL Injection Prevention

**Spring Data JPA:**
- Parameterized queries (prepared statements)
- No string concatenation in queries
- Input validation with Bean Validation

### XSS Prevention

**Frontend:**
- Angular sanitizes HTML by default
- No `innerHTML` usage (unless explicitly sanitized)

**Backend:**
- Input validation with `@Valid` annotation
- DTO validation with Bean Validation constraints

---

## 🎯 Design Decisions

### Why Angular 18 Standalone Components?

**Reasons:**
- ✅ Modern Angular pattern (no NgModules)
- ✅ Simpler project structure
- ✅ Faster compilation
- ✅ Better tree-shaking

**Source:** `.ai/tech-stack.md`, `.decisions/tech-decisions.md`

### Why BehaviorSubject (not NgRx)?

**Reasons:**
- ✅ NgRx too complex for MVP
- ✅ BehaviorSubject sufficient for simple state
- ✅ Easier to understand and maintain
- ✅ Less boilerplate code

**Source:** `.ai/tech-stack.md`

### Why Tailwind 3.x (not 4.x)?

**Reason:**
- ⚠️ Tailwind 4 incompatible with Angular 18
- Tailwind 3.4.17 stable and sufficient

**Source:** `.ai/tech-stack.md`, `.decisions/tech-decisions.md`

### Why PostgreSQL (not MongoDB)?

**Primary Reason:**
- ✅ **Free shared PostgreSQL service on Mikrus VPS** - No additional server resources needed
- ✅ **Already available at psql01.mikr.us** - No setup or maintenance required
- ✅ **Cost-effective for MVP** - Included in VPS hosting without extra charges

**Additional Benefits:**
- ✅ Relational data model fits perfectly (users, photos, ratings)
- ✅ ACID compliance for data integrity
- ✅ Strong type safety
- ✅ Better for structured data with relationships
- ✅ SQL standard for queries and migrations

**Source:** `.decisions/tech-decisions.md`

### Why Permission-Based Access (not Email Verification)?

**Reasons:**
- ✅ **Family & friends focus:** Designed for small trusted groups
- ✅ **Security:** Prevents spam registrations and unauthorized access
- ✅ **Privacy:** Only users with VIEW_PHOTOS permission can see photos
- ✅ **Control:** Admin grants permissions to verified users
- ✅ **MVP Scope:** Email verification planned for post-MVP

**Source:** `.ai/prd.md`, `.decisions/prd-context.md`

### Why Flyway (not Liquibase)?

**Reasons:**
- ✅ Simpler SQL-based migrations
- ✅ Easier to understand (plain SQL)
- ✅ Better Spring Boot integration
- ✅ Sufficient for MVP needs

**Source:** `.decisions/tech-decisions.md`

### Architecture Decision Records

For detailed decision rationale, see:
- **`.ai/`** directory - Core implementation specs (PRD, tech stack, database schema, API specification, UI architecture)
- **`.decisions/`** directory - Decision context (business rationale, technology comparisons "why X not Y")

---

## 📚 Additional Resources

**Core Documentation:**
- `.ai/prd.md` - MVP requirements, user stories
- `.ai/tech-stack.md` - Technology specifications, patterns
- `.ai/db-plan.md` - Database schema, migrations, JPA entities
- `.ai/api-plan.md` - REST API endpoints, DTOs, security
- `.ai/ui-plan.md` - Frontend architecture, components, services

**Decision Context:**
- `.decisions/prd-context.md` - Business context, problem statement
- `.decisions/tech-decisions.md` - Technology comparisons, excluded options

**External Links:**
- [Angular 18 Documentation](https://angular.dev/)
- [Spring Boot 3 Documentation](https://spring.io/projects/spring-boot)
- [Tailwind CSS 3 Documentation](https://tailwindcss.com/docs)
- [Leaflet.js Documentation](https://leafletjs.com/)
- [PostgreSQL 15 Documentation](https://www.postgresql.org/docs/15/)

---

**Last Updated:** 2025-11-10

**Sources:**
- `README.md` (Tech Stack, Features)
- `CLAUDE.md` (Tech Stack Guidelines)
- `.ai/tech-stack.md` (Referenced - not fully read)
- `.ai/db-plan.md` (Referenced - not fully read)
- `.decisions/tech-decisions.md` (Referenced - not fully read)
