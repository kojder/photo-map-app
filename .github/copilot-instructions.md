# GitHub Copilot Instructions - Photo Map MVP

## Project Overview

Full-stack photo geolocation app: Angular 18 (standalone) + Spring Boot 3 + PostgreSQL 15 + Leaflet.js maps.

**Current Status:** Phase 4 complete (MVP functional end-to-end: auth → upload → gallery → rating → map)

## Architecture & Key Patterns

### Backend (Spring Boot 3 + Java 17)

**Photo Processing Pipeline:**
- **Async processing with Spring Integration** - Files dropped to `uploads/input/` are processed asynchronously
- `PhotoIntegrationConfig` configures file polling (10s interval) with `@ServiceActivator`
- `PhotoProcessingService` handles EXIF extraction (metadata-extractor) and thumbnail generation (Thumbnailator)
- Output: `original/`, `small/` (150px), `medium/` (400px), `large/` (800px), `failed/` (errors)
- See: `backend/src/main/java/com/photomap/config/PhotoIntegrationConfig.java`

**Security Architecture:**
- JWT tokens with Spring Security 6 (`JwtTokenProvider` + `JwtAuthenticationFilter`)
- Stateless sessions (no cookies, pure JWT in Authorization header)
- Security toggle via `security.enabled=false` in `application.properties` (useful for debugging)
- Password encryption: BCrypt via `PasswordEncoder` bean
- See: `backend/src/main/java/com/photomap/config/SecurityConfig.java`

**Data Layer:**
- Full schema created upfront in Flyway migration `V1__initial_schema.sql` (users, photos, ratings with indexes)
- JPA entities: `User`, `Photo`, `Rating` with proper `@ManyToOne`/`@OneToMany` relationships
- Repository pattern: Spring Data JPA repositories extend `JpaRepository`
- Transactional boundaries: `@Transactional` on service methods, not controllers

**REST API Conventions:**
- DTOs for request/response (never expose entities directly)
- Global exception handling via `@RestControllerAdvice` (`GlobalExceptionHandler`)
- Validation with Bean Validation (`@NotBlank`, `@Email`, etc.) using i18n message codes from `ValidationMessages.properties`
- Pagination: `Pageable` parameter → `Page<T>` response wrapped in `PageResponse<T>` DTO

### Frontend (Angular 18 + TypeScript 5)

**Component Architecture:**
- **Standalone components only** - no `@NgModule` (Angular 18 pattern)
- Routing in `app.routes.ts` with flat `Routes[]` array
- Guards: `authGuard` (functional guard, not class-based)
- See: `frontend/src/app/app.routes.ts`

**State Management Strategy:**
- **BehaviorSubject pattern for shared state** - Services expose `private BehaviorSubject` → `public Observable`
- Example: `PhotoService.photos$`, `FilterService.filters$`
- **Signals for component-local state** - counters, UI flags, computed values
- NO NgRx (too complex for MVP)
- Pattern example in `PhotoService`:
  ```typescript
  private photosSubject = new BehaviorSubject<Photo[]>([]);
  public photos$ = this.photosSubject.asObservable();
  ```

**HTTP & Auth:**
- `HttpInterceptor` (`authInterceptor`) adds JWT to all requests automatically
- Token stored in `localStorage` (key: `token`)
- Auth state managed in `AuthService` with `currentUser$` observable
- Backend proxied via `proxy.conf.json` to avoid CORS in dev

**UI Patterns:**
- Tailwind CSS 3.4 utility-first (NOT v4 - incompatible with Angular 18)
- Reactive templates with `async` pipe (`@if (photos$ | async; as photos)`)
- Test IDs for E2E: `data-testid="component-element"` on all interactive elements
- Leaflet.js for maps with `leaflet.markercluster` plugin

## Development Workflows

### Build & Run

**Via Development Scripts (Recommended):**
```bash
# Start everything (backend + frontend)
./scripts/start-dev.sh

# With PostgreSQL
./scripts/start-dev.sh --with-db

# Stop everything
./scripts/stop-dev.sh [--with-db]
```
- Auto-detects running processes (safe to re-run)
- PID tracking in `scripts/.pid/`
- Logs to `scripts/.pid/backend.log` and `frontend.log`
- Health checks verify startup (backend: actuator/health, frontend: HTTP 200)

**Manual Start (for debugging):**
```bash
# Backend (Spring Boot)
cd backend && ./mvnw spring-boot:run
# Runs on http://localhost:8080

# Frontend (Angular)
cd frontend && ng serve
# Runs on http://localhost:4200 (proxies to backend via proxy.conf.json)

# PostgreSQL
docker-compose up -d
```

### Testing Requirements

**Unit Tests - REQUIRED before EVERY commit:**
- Backend: `./mvnw test` (JUnit 5 + Mockito + Spring Boot Test)
- Frontend: `ng test` (Jasmine + Karma)
- **Coverage target: >70% for new code**
- Pattern: Implement → Manual verify (curl/browser) → Write tests → All pass → Commit

**Integration Tests - End of each phase:**
- Backend: `@SpringBootTest` with real DB (H2 in-memory for tests)
- Test full flows with `MockMvc` (example: `AdminIntegrationTest`, `AuthIntegrationTest`)
- Frontend E2E: Playwright (future)

**Test Resources:**
- Backend test config: `src/test/resources/application-test.properties`
- H2 database for tests (no PostgreSQL needed)

### Git Workflow - CRITICAL

**Commit Review Process (ALWAYS follow):**
1. Make changes
2. Stage: `git add <files>`
3. **Show summary: `git status` + `git diff --cached --stat`**
4. **WAIT for user approval before `git commit`**
5. If approved → commit with Conventional Commits message
6. **NEVER auto-push - ALWAYS ask user first**

### Documentation Updates - After Implementation

**After completing a feature/phase, update project documentation:**
- `PROGRESS_TRACKER.md` - mark completed tasks, update Current Status
- `.ai/` files - update if implementation specs changed (e.g., new endpoints, changed architecture)
- `.decisions/` files - document important tech/PRD decisions made during implementation
- `README.md` - update if setup instructions or project status changed

**Command:** Run `/update-docs` prompt to analyze recent changes and update documentation automatically.

**Commit Message Convention:**
```
<type>[optional scope]: <description>

Examples:
feat(auth): implement JWT token validation
fix(photos): resolve EXIF extraction error for PNG files
docs: update PROGRESS_TRACKER after Phase 3 completion
refactor(gallery): migrate from signals to BehaviorSubject pattern
```
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Recent commits show pattern:**
- `feat(frontend): implement Phase 4 - gallery, map, and photo management`
- `fix(photos): zachowanie proporcji zdjęć w thumbnailach i galerii` (Polish OK)
- `refactor(photos): remove ownership restrictions and fix rating scale to 1-5`

## Project-Specific Conventions

### Code Quality Standards

**All code in English:**
- Class names, method names, variables, comments
- Exception: Git commits can be Polish or English
- User communication: Polish

**TypeScript Strict Mode:**
- All types explicit (no `any` unless absolutely necessary)
- Null safety: use `?` operator and explicit null checks

**Backend Patterns:**
- `final` keyword on class fields and method parameters (immutability)
- Service layer always `@Transactional` for write operations
- DTOs use record classes when possible (Java 17 feature)

**i18n Strategy:**
- Validation messages: Use message codes from `ValidationMessages.properties`
  - Format: `{validation.field.rule}` e.g., `{validation.email.required}`
- API error messages: Hardcoded OK for MVP (future: refactor to i18n)

### File Organization

**Backend:**
```
com.photomap/
├── config/           # Spring configuration (Security, Integration, etc.)
├── controller/       # REST controllers (@RestController)
├── dto/              # Request/response objects
├── exception/        # Custom exceptions + GlobalExceptionHandler
├── model/            # JPA entities (@Entity)
├── repository/       # Spring Data JPA repositories
├── security/         # JWT provider, filters, UserDetailsService
└── service/          # Business logic (@Service, @Transactional)
```

**Frontend:**
```
app/
├── components/       # UI components (standalone)
├── guards/           # Route guards (authGuard, adminGuard)
├── interceptors/     # HTTP interceptors (authInterceptor)
├── models/           # TypeScript interfaces (Photo, User, etc.)
└── services/         # Business logic + state management
```

### Environment Configuration

**Backend (`application.properties`):**
- Environment variables: `${VAR_NAME:default-value}` pattern
- JWT secret: `${JWT_SECRET:your-secret-key-change-in-production}`
- Database: `${DB_USERNAME:photomap_user}`, `${DB_PASSWORD:changeme}`
- Photo dirs: `${UPLOAD_DIR_INPUT:./uploads/input}` (6 directories total)
- Security toggle: `security.enabled=${SECURITY_ENABLED:true}` (set to `false` for debugging)

**Frontend (`proxy.conf.json`):**
- All `/api/*` routes proxied to `http://localhost:8080`
- Avoids CORS issues in development

## Common Pitfalls & Solutions

### Angular 18 Specifics

❌ **DON'T use `@NgModule`** - Angular 18 uses standalone components
✅ **DO use standalone: true** in `@Component` decorator

❌ **DON'T use Tailwind 4** - incompatible with Angular 18
✅ **DO use Tailwind 3.4.17** (locked in `package.json`)

❌ **DON'T mix signals and BehaviorSubject** for same data
✅ **DO use BehaviorSubject for shared state**, signals for local state

### Spring Boot 3 Specifics

❌ **DON'T expose entities in REST responses** - creates circular refs, security issues
✅ **DO use DTOs** for all controller inputs/outputs

❌ **DON'T put `@Transactional` on controllers** - wrong layer
✅ **DO put `@Transactional` on service methods** that modify data

❌ **DON'T use `User.class` in `photoRepository.findById(...).getUser()`** - lazy loading issues
✅ **DO use DTOs** or fetch joins in queries

### Photo Processing

❌ **DON'T block on photo upload** - processing can take seconds
✅ **DO use async pattern** - return 202 Accepted, process via Spring Integration

❌ **DON'T delete from one folder only** - orphaned files in other sizes
✅ **DO delete from all folders** - original, small, medium, large when deleting photo

## Key Files for Reference

**Must-read for context:**
- `CLAUDE.md` - Full AI workflow instructions
- `PROGRESS_TRACKER.md` - Project roadmap and status
- `.ai/tech-stack.md` - Technology decisions and patterns
- `scripts/README.md` - Development scripts documentation

**Architecture examples:**
- Backend async processing: `backend/src/main/java/com/photomap/config/PhotoIntegrationConfig.java`
- Frontend state management: `frontend/src/app/services/photo.service.ts`
- JWT security: `backend/src/main/java/com/photomap/security/JwtTokenProvider.java`
- Integration testing: `backend/src/test/java/com/photomap/integration/AuthIntegrationTest.java`

## Quick Reference

**Backend Health Check:** `curl http://localhost:8080/actuator/health`
**Frontend Dev Server:** `http://localhost:4200`
**Database Connection:** `localhost:5432/photomap` (user: `photomap_user`)

**Default Admin User (seeded):**
- Email: `admin@photomap.com`
- Password: Check Flyway migration `V1__initial_schema.sql`
