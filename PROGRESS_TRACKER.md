# 🎯 Photo Map MVP - Progress Tracker

**Created:** 2025-10-19
**Status:** 🔜 Documentation ready - awaiting implementation

---

## 🔄 Current Status

**Last Updated:** 2025-10-29 (Feature: E2E Tests - CI workflow profile fix)

### 🎯 Currently Working On

**E2E Tests - Playwright (GitHub Actions CI verification in progress)**

**Current Status:**
- ✅ Phase 1: Login tests implemented (2 tests)
- ✅ Phase 2: Smoke tests implemented (14 tests: Admin, Gallery, Map, Filters, Navigation)
- ✅ Testy lokalne: 16/16 green (1.5min)
- ✅ Page Object Models: 5 plików (BasePage, LoginPage, AdminPage, GalleryPage, MapPage, FilterFabPage, NavbarPage)
- ✅ GitHub Actions workflow naprawiony (backend + frontend startup + health checks)
- ✅ **CI Profile Fix**: Poprawiony profil Spring Boot (test → e2e) + timeout 60s dla CI
- ⏳ **Weryfikacja na GitHub Actions CI w toku** (push + monitoring workflow)

**Commits pushed:**
- be0aaa4 feat(e2e): add Playwright E2E tests setup with first login test
- 6063f29 feat(e2e): add Phase 2 smoke tests with Page Object Models
- a28f278 fix(ci): add backend and frontend startup for E2E tests
- 895bb81 fix(e2e): set reuseExistingServer=true to prevent port conflicts in CI
- 0cd5508 fix(ci): use e2e profile for backend and increase timeout for CI

**Next Planned Actions:**
1. ⏳ Push commit i zweryfikować status GitHub Actions workflow (czy testy E2E przechodzą na CI)
2. 🔧 **SonarCloud Configuration Fix** (backend not analyzed)
   - Problem: Backend nie jest analizowany przez SonarCloud (tylko frontend widoczny)
   - Root cause: Brak `sonar-maven-plugin` w backend/pom.xml + konflikt projectKey
   - Plan naprawy:
     - [ ] Dodać `sonar-maven-plugin` do `backend/pom.xml` (w sekcji `<build><plugins>`)
     - [ ] Zmienić `sonar.projectKey` w `backend/pom.xml`: `kojder_photo-map-app` → `kojder_photo-map-app-backend`
     - [ ] Zmienić `sonar.projectKey` w `frontend/sonar-project.properties`: `kojder_photo-map-app` → `kojder_photo-map-app-frontend`
     - [ ] Utworzyć `backend/sonar-project.properties` (opcjonalnie, dla spójności z frontendem)
     - [ ] Zweryfikować w GitHub Actions: Backend analysis passes, oba projekty widoczne w SonarCloud
   - Estimated time: 30-45 min
   - Benefit: Osobne dashboardy SonarCloud dla backend + frontend, lepszy monitoring jakości kodu
3. (Optional) Post-MVP Enhancements:
   - Email System (verification, password reset)
   - Public Photo Sharing (UUID links)
   - Temporal & Spatial Filters
   - NAS Batch Processing
   - Group & Permissions System

**Blocked By:** None (oczekiwanie na wynik GitHub Actions)

**Phase 6: Deployment na Mikrus VPS (Docker Compose)** - ✅ **COMPLETED**

- [x] **6.1 Dokumentacja deployment** ✅
  - [x] deployment/README.md - instrukcja Docker Compose workflow
  - [x] deployment/.env.production.example - zmienne środowiskowe (Docker style)
  - [x] Troubleshooting guide - Docker logs, container debugging
  - [x] .ai/features/feature-deployment-mikrus.md - strategia Docker Compose
  - [x] deployment/MIKRUS_SETUP.md - konkretna konfiguracja marcin288
  - [x] deployment/VERIFICATION_PROMPT.md - prompt weryfikacyjny
  - [x] Weryfikacja spójności: porty 30288, hosty srv07/marcin288, domena photos.tojest.dev

- [x] **6.2 Docker Setup** ✅
  - [x] backend/Dockerfile - Spring Boot JAR w openjdk:17-jre-slim
  - [x] frontend/Dockerfile - nginx:alpine + Angular build
  - [x] frontend/nginx.conf - SPA routing + /api proxy do backend:8080
  - [x] deployment/docker-compose.yml - backend + frontend containers
  - [x] Volume: photo-map-uploads (persistence dla zdjęć)
  - [x] Network: internal (backend-frontend) + external (port 30288)
  - [x] Scripts: build-images.sh, deploy.sh, deploy-marcin288.sh

- [x] **6.3 Build Docker Images** ✅
  - [x] Skrypt deployment/scripts/build-images.sh
  - [x] Build backend JAR: `./mvnw clean package -DskipTests`
  - [x] Build Docker image: `docker build -t photo-map-backend:latest backend/`
  - [x] Build Angular: `cd frontend && ng build --configuration production`
  - [x] Build Docker image: `docker build -t photo-map-frontend:latest frontend/`
  - [x] Weryfikacja: `docker images | grep photo-map`

- [x] **6.4 Deployment na VPS** ✅
  - [x] Skrypt deployment/scripts/deploy.sh (poprawiony: scp -P zamiast -p)
  - [x] Save images: `docker save photo-map-backend:latest | gzip > backend.tar.gz`
  - [x] Transfer SCP: images + docker-compose.yml + .env na VPS
  - [x] Load images na VPS: `docker load < backend.tar.gz`
  - [x] Start containers: `docker-compose up -d`
  - [x] Weryfikacja: `docker ps` + health checks

- [x] **6.5 Environment Configuration** ✅
  - [x] deployment/.env z PostgreSQL credentials (DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD)
  - [x] Shared PostgreSQL: `psql01.mikr.us:5432` (db_marcin288)
  - [x] JWT secret: vRbX7goXqRCa1LQjgpKXzhqmH7tyIavlvAOvOT+/q5E=
  - [x] Admin credentials: admin@example.com / admin
  - [x] Transfer .env na VPS: `scp deployment/.env root@marcin288.mikrus.xyz:/opt/photo-map/`
  - [x] Flyway migrations executed: V1-V5 (all tables created)

- [x] **6.6 Testing & Verification** ✅
  - [x] Backend health: `curl http://localhost:8080/actuator/health` → {"status":"UP"}
  - [x] Frontend dostępność: `curl https://photos.tojest.dev/` → Angular app loaded
  - [x] Container status: backend (healthy), frontend (healthy)
  - [x] PostgreSQL connection: verified (HikariCP connected to psql01.mikr.us)
  - [x] Flyway migrations: all 5 migrations executed successfully
  - [x] Docker volumes: photo-map-uploads persistent
  - [x] Auto-restart policy: unless-stopped configured

### Acceptance Criteria Phase 6:
- ✅ Backend działa w Docker container (photo-map-backend:latest)
- ✅ Frontend działa w Docker container (photo-map-frontend:latest)
- ✅ Nginx reverse proxy /api → backend:8080 działa
- ✅ Shared PostgreSQL (psql01.mikr.us) połączenie aktywne
- ✅ SSL automatyczne przez Mikrus proxy (*.wykr.es)
- ✅ Health checks dostępne (/actuator/health)
- ✅ Auto-restart przez Docker restart policy
- ✅ Logi dostępne przez docker logs
- ✅ Upload photos działa (web + batch) z volume persistence
- ✅ Deployment scripts działają (build-images.sh, deploy.sh)
- ✅ **Docker health checks działają** - wszystkie kontenery "healthy" (nginx, frontend, backend)

### ✅ Last Completed

**E2E Tests - CI Workflow Profile Fix** (2025-10-29)
- ✅ **Problem diagnosed:** Backend używał nieistniejącego profilu `test` zamiast `e2e`
- ✅ **Root cause:** Profile 'test' nie istnieje → backend używał domyślnego application.properties
  - Domyślny port: 5432 (zamiast 5433 gdzie jest testowa baza PostgreSQL w CI)
  - Domyślna baza: photomap (zamiast photomap_test)
  - Backend nie mógł połączyć się z bazą → wszystkie testy timeoutowały
- ✅ **Fix 1:** Zmiana profilu w workflow: `-Dspring-boot.run.profiles=test` → `e2e`
- ✅ **Fix 2:** Zwiększenie navigationTimeout: 30s → 60s dla CI (30s lokalnie)
- ✅ **Result:** 15/16 failujących testów powinno teraz przejść zielono
- 📝 **Commit:** 0cd5508 fix(ci): use e2e profile for backend and increase timeout for CI

**E2E Tests - Playwright Implementation & CI Workflow Fix** (2025-10-29)
- ✅ **Phase 1: Playwright Setup & Login Tests** (commit be0aaa4)
  - Playwright + PostgreSQL client (pg) + dotenv installed
  - Dedicated test database: docker-compose.test.yml (port 5433)
  - Playwright config: auto-start backend + frontend z health checks
  - Cleanup fixtures: hybrid approach (before + after tests)
  - Page Object Models: BasePage, LoginPage
  - Tests: 2 login tests (admin login flow, form validation)
  - Backend profile: application-e2e.properties
  - GitHub Actions job: e2e-tests (needs: build)
  - Testy lokalne: 2/2 passed (16.2s)
- ✅ **Phase 2: Smoke Tests dla wszystkich widoków** (commit 6063f29)
  - Page Object Models: AdminPage, GalleryPage, MapPage, FilterFabPage, NavbarPage
  - Admin tests (3): panel admin, search input, wyszukiwanie użytkowników
  - Gallery tests (3): upload button, filter FAB, upload dialog
  - Map tests (3): kontener mapy, filter FAB, ładowanie Leaflet
  - Filters tests (3): open/close panel, display inputs, filling dates
  - Navigation tests (2): full flow (Gallery → Map → Admin → Logout), admin link visibility
  - Testy lokalne: 16/16 passed (1.5min całkowity czas)
- ✅ **CI Workflow Fix - Backend & Frontend Startup** (commit a28f278)
  - **Problem:** E2E testy failowały na GitHub Actions (backend nie działał)
  - **Root cause:** Workflow tylko buildował backend, ale nie uruchamiał przed testami
  - **Rozwiązanie:**
    - Dodano instalację wait-on (health check utility)
    - Uruchomienie backend w tle: mvn spring-boot:run -Dspring-boot.run.profiles=test
    - Health check backend: wait-on http://localhost:8080/actuator/health (timeout 60s)
    - Uruchomienie frontend w tle: npm start
    - Health check frontend: wait-on http://localhost:4200 (timeout 60s)
    - Cleanup: zatrzymanie backend + frontend po testach (if: always)
    - Upload logów: backend.log + frontend.log jako artifacts
- ✅ **CI Workflow Fix - Port Conflicts Prevention** (commit 895bb81)
  - **Problem:** Playwright próbował uruchomić własne serwery (konflikt portów)
  - **Error:** "http://localhost:8080 is already used"
  - **Root cause:** reuseExistingServer: !process.env.CI = false w CI
  - **Rozwiązanie:** Zmiana na reuseExistingServer: true (zawsze używaj istniejących)
- ✅ **Struktura testów:**
  - fixtures/: database.fixture.ts (cleanup), testData.ts (test user)
  - pages/: 7 Page Object Models (BasePage + 6 specific pages)
  - specs/: 5 plików testowych (auth, admin, gallery, map, filters, navigation)
  - Total: 16 testów E2E (coverage wszystkich głównych widoków aplikacji)
- 📝 **Files:**
  - frontend/playwright.config.ts (webServer config z reuseExistingServer)
  - frontend/tests/e2e/ (fixtures, pages, specs - 439 linii)
  - docker-compose.test.yml (testowa baza PostgreSQL)
  - .github/workflows/build.yml (e2e-tests job z backend/frontend startup)
  - .ai/features/feature-e2e-playwright-tests.md (1171 linii - full spec)
- 🎯 **Next:** Weryfikacja na GitHub Actions CI (czy workflow przechodzi zielono)

**UI Redesign - Modern Navbar + Floating Filters** (2025-10-28)
- ✅ **Feature:** Modern navbar with Heroicons icons and FAB filter button
- ✅ **Navbar:**
  - Heroicons SVG icons (Gallery, Map, Admin, Logout)
  - Active state: bg-blue-100 (full background highlight) zamiast border-bottom
  - Hamburger menu for mobile (collapsible)
- ✅ **Filters:**
  - FAB (Floating Action Button) in bottom-right corner
  - Badge counter showing number of active filters
  - Slide-in panel: desktop (320px side), mobile (80vh bottom sheet)
  - Backdrop overlay (click to close)
- ✅ **Layout improvements:**
  - Gallery: removed h1 header (+80px vertical space)
  - Map: full screen 100vh layout (+30% visible area)
  - Upload button with icon
  - Clean, minimalist design
- ✅ **Removed:** filter-bar component (deprecated)
- ✅ **Tests:** 163/163 frontend passing ✅
- ✅ **Deployment:**
  - Commit: 24592e4 (14 files: +1398, -156)
  - Docker images rebuilt with new UI
  - Deployed to production: https://photos.tojest.dev/
  - Verified: new UI live on production ✅
- 📝 **Files:** navbar, filter-fab (new), gallery, map components
- 📝 **Feature spec:** .ai/features/feature-ui-redesign-navbar-filters.md (848 lines)
- 🎯 **Result:** +100px vertical space, better UX, modern Material Design aesthetic

**Docker Health Checks Fix** (2025-10-28)
- ✅ **Problem:** Docker health checks failowały dla nginx i frontend (backend OK)
  - nginx healthcheck sprawdzał `/actuator/health` (backend endpoint) zamiast samego nginx
  - frontend healthcheck sprawdzał `/` (ładowanie całej Angular SPA) zamiast dedykowanego endpointu
  - `localhost` w wget był resolvowany do IPv6 `[::1]` powodując "Connection refused"
- ✅ **Rozwiązanie:**
  - nginx: zmiana healthcheck na `http://127.0.0.1:80/` (sprawdza nginx dostępność)
  - frontend: zmiana healthcheck na `http://127.0.0.1:80/health` (dedykowany endpoint z nginx.conf)
  - Wszędzie: `localhost` → `127.0.0.1` (fix IPv6 resolution)
- ✅ **Pliki:**
  - `deployment/docker-compose.yml` - nginx i frontend healthcheck
  - `frontend/Dockerfile` - HEALTHCHECK directive
- ✅ **Testy:**
  - Test lokalny: frontend kontener healthy po 35s ✓
  - Test produkcja (marcin288): wszystkie 3 kontenery healthy ✓
- ✅ **Weryfikacja produkcji:**
  ```
  photo-map-nginx      Up About a minute (healthy)
  photo-map-frontend   Up About a minute (healthy)
  photo-map-backend    Up About a minute (healthy)
  ```
- ✅ **Aplikacja działa:** https://photos.tojest.dev/ - backend health: `{"status":"UP"}`
- 📝 **Commit:** 48665bf
- 🎯 **Lesson learned:** wget w Alpine Linux preferuje IPv6, zawsze używaj `127.0.0.1` zamiast `localhost` w health checks

**GitHub Actions CI/CD Fix - SonarCloud Configuration** (2025-10-28)
- ✅ **Problem:** GitHub Actions failował na kroku "Frontend - SonarCloud analysis"
- ✅ **Error:** `Could not find a default branch for project 'kojder_photo-map-app-frontend'`
- ✅ **Root cause:** Projekt `kojder_photo-map-app-frontend` nie istniał w SonarCloud
- ✅ **Rozwiązanie:** Połączenie frontend + backend w jeden projekt SonarCloud (monorepo approach)
- ✅ **Zmiana:** `sonar.projectKey` w frontend/sonar-project.properties: `kojder_photo-map-app-frontend` → `kojder_photo-map-app`
- ✅ **Rezultat:**
  - GitHub Actions workflow przechodzi ✅ (4m12s)
  - Backend + Frontend metryki w jednym dashboardzie SonarCloud
  - Coverage reports z obu źródeł (JaCoCo + lcov) wysyłane do tego samego projektu
  - Brak błędów CI przy każdym pushu
- ✅ **GitHub CLI:** Przetestowano `gh run watch` - działa poprawnie
- 🎯 **Best practice dla MVP:** Jeden projekt SonarCloud = prostsze zarządzanie
- 📝 **Files:** frontend/sonar-project.properties (projectKey + projectName)
- 📝 **Dashboard:** https://sonarcloud.io/project/overview?id=kojder_photo-map-app
- 📝 **Commit:** 93d3226

**Map Markers Fix - Leaflet Import Issue** (2025-10-27)
- ✅ **Problem:** Markery nie działały na produkcji (działały lokalnie)
- ✅ **Root cause:** Konflikt między `import * as L` (namespace) a production build optimization
- ✅ **Rozwiązanie:** Zmiana na `import L from 'leaflet'` (default import)
- ✅ **Konfiguracja:** Dodano `allowedCommonJsDependencies: ["leaflet", "leaflet.markercluster"]` w angular.json
- ✅ **Fix:** Usunięto setTimeout z ngAfterViewInit (direct call: `this.initMap()`)
- ✅ **Deployment:** Rebuilt frontend, deployed to production, markery działają
- ✅ **Testy:** Backend 74/74 ✅
- 🐛 **Lesson learned:** Development (Vite) vs Production (esbuild) różnice w ładowaniu CommonJS modules
  - Vite nie optymalizuje - side-effect imports działają zawsze
  - esbuild z tree-shaking może usunąć side-effecty dla namespace imports
  - **Best practice:** Używaj default import (`import L from 'leaflet'`) zamiast namespace (`import * as L`)
- 📝 **Files:** frontend/angular.json (allowedCommonJsDependencies), frontend/src/app/components/map/map.component.ts (import change)
- 📝 **Documentation:** Issue udokumentowany w PROGRESS_TRACKER.md
- 📝 **Production URL:** https://photos.tojest.dev/map - markery widoczne ✅

**Deployment na Mikrus VPS - COMPLETE** (2025-10-27)
- ✅ Backend deployed: photo-map-backend:latest (251MB) - Status: HEALTHY
- ✅ Frontend deployed: photo-map-frontend:latest (53.4MB) - Status: HEALTHY
- ✅ Health check verified: `{"status":"UP"}` at http://localhost:8080/actuator/health
- ✅ Frontend accessible: https://photos.tojest.dev/ (Angular 18 SPA loaded)
- ✅ PostgreSQL connected: psql01.mikr.us:5432/db_marcin288 (shared Mikrus service)
- ✅ Flyway migrations: V1-V5 executed (users, photos, ratings, permissions tables created)
- ✅ Docker volumes: photo-map-uploads persistent storage configured
- ✅ SSL: Automatic via Mikrus proxy (*.wykr.es wildcard certificate)
- ✅ Auto-restart: Docker restart policy unless-stopped
- ✅ Login working: admin@example.com / Admin123! (JWT token generated successfully)
- 🐛 Issues resolved:
  - Fixed deploy.sh: scp port flag changed from `-p` to `-P`
  - Fixed docker-compose.yml: added DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD, ADMIN_PASSWORD
  - Fixed Flyway baseline: manually executed V1 migration due to shared database (n8n tables present)
  - Fixed admin password: changed from "admin" (5 chars) to "Admin123!" (8 chars) - frontend validation requires minLength(8)
  - Fixed env reload: `docker compose down && up -d` required for new environment variables (restart doesn't reload .env)
- ⚠️ Known issues:
  - Photo upload fails with "Upload failed. Please try again." error (backend logs needed)
- 📝 Files modified: deployment/scripts/deploy.sh, deployment/docker-compose.yml, deployment/.env
- 📝 Next steps: Debug photo upload error, verify EXIF processing, test batch upload from input folder

**Docker Images Built** (2025-10-27)
- ✅ Poprawione Dockerfiles (backend: eclipse-temurin:17-jre-alpine + wget, frontend: dist/frontend/browser)
- ✅ Poprawiony build-images.sh (cd backend przed mvnw)
- ✅ Backend JAR zbudowany pomyślnie (./mvnw clean package -DskipTests)
- ✅ Frontend Angular zbudowany pomyślnie (ng build --configuration production)
- ✅ Backend Docker image: photo-map-backend:latest (251MB)
- ✅ Frontend Docker image: photo-map-frontend:latest (53.4MB)
- ✅ Deployment/.env przygotowany z PostgreSQL credentials + JWT_SECRET
- 📝 Files: backend/Dockerfile, frontend/Dockerfile, deployment/scripts/build-images.sh
- 📝 Ready for deployment: Task 6.4 (Deployment na VPS)

**Deployment Documentation Verification** (2025-10-27)
- ✅ Weryfikacja spójności wszystkich plików deployment
- ✅ Poprawione porty: 20100 → 30288 (11 wystąpień w README.md)
- ✅ Poprawione hosty: srv41 → srv07/marcin288 (przykłady w skryptach)
- ✅ Poprawiona subdomena: photos.andrew.tojest.dev → photos.tojest.dev
- ✅ Wszystkie pliki spójne z konfiguracją VPS marcin288
- 📝 Commits: 979a756, 0b97f55, ec8def6 (3 commits pushed)
- 📝 Files: deployment/README.md, .env.production.example, scripts/deploy.sh

**User Permissions Management System** (2025-10-26)
- ✅ Backend: Migracja V5 - can_view_photos, can_rate kolumny + app_settings tabela
- ✅ Backend: Nowe uprawnienia - canViewPhotos (default false), canRate (default false)
- ✅ Backend: Backward compatibility - istniejący użytkownicy dostają true dla obu uprawnień
- ✅ Backend: PublicController z /api/public/settings (admin contact bez auth)
- ✅ Backend: SecurityConfig - /api/public/** dodane do permitAll
- ✅ Backend: PhotoController - weryfikacja canViewPhotos i canRate przed operacjami
- ✅ Backend: AdminController - wyszukiwanie użytkowników po email (contains, case-insensitive) + paginacja
- ✅ Backend: AdminController - PUT /api/admin/users/{id}/permissions endpoint
- ✅ Backend: AuthController - GET /api/auth/me zwraca uprawnienia użytkownika
- ✅ Backend: SettingsService - zarządzanie app_settings (admin contact email)
- ✅ Frontend: AdminComponent - system notyfikacji banerowych (auto-dismiss 5s)
- ✅ Frontend: AdminComponent - zarządzanie uprawnieniami w sidebar (batch save)
- ✅ Frontend: AdminComponent - wyszukiwanie użytkowników po email + paginacja
- ✅ Frontend: AdminComponent - Admin Settings sekcja (poniżej User Management)
- ✅ Frontend: GalleryComponent - obsługa błędów uprawnień z kontaktem do admina
- ✅ Frontend: PhotoCardComponent - ukrywanie UI rating gdy canRate=false
- ✅ Frontend: AuthService - metody canRate(), canViewPhotos()
- ✅ Frontend: PhotoService - getPublicSettings(), clearPhotos()
- ✅ Frontend: RegisterComponent - info o kontakcie do admina po rejestracji
- ✅ UX: Zastąpiono wszystkie alert() popups banerami z auto-dismiss
- ✅ UX: Permission error - komunikat z przyciskiem mailto: do admina
- 📝 Commit: 8f9901f
- 📝 Files: 31 changed (+971 additions, -90 deletions)

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

---

### ✅ Last Completed

**Gallery Rating Filter Fix + Code Quality** (2025-10-25)
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

**Overall Progress:** 6/6 phases (100% core MVP) + Photo Viewer + GitHub Copilot + Deployment + E2E Tests (CI verification)

| Phase | Status | Description |
|------|--------|------|
| 1. Backend - Setup & Auth | ✅ | Spring Boot, PostgreSQL (full schema), JWT, Admin API |
| 2. Frontend - Setup & Auth | ✅ | Angular, Login/Register, Guards (auth end-to-end!) |
| 3. Backend - Photo Handling | ✅ | Upload, EXIF, thumbnails (3 sizes), Photo API, Rating system |
| 4. Frontend - Gallery & Map | ✅ | Gallery grid, Leaflet Map, Rating (stars), Upload (drag-and-drop), Filters |
| 📸 Photo Viewer Feature | ✅ | Fullscreen viewer, keyboard nav, mobile touch (Phases 1-4 complete) |
| 🤖 GitHub Copilot Setup | ✅ | Instructions, prompts, VS Code integration |
| 5. Admin Panel | ✅ | User Management, Photo Management, Permissions System, Admin Settings |
| 6. Deployment (Mikrus VPS) | ✅ | Docker Compose, Shared PostgreSQL, Nginx reverse proxy, SSL (Mikrus proxy) |
| 🧪 E2E Tests (Playwright) | ⏳ | 16 tests (Auth, Admin, Gallery, Map, Filters, Navigation), GitHub Actions CI (verification) |

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

**Time:** ~2-3 hours | **Status:** ✅ Completed (2025-10-26)

### Tasks:

- [x] **5.1 Admin API Endpoints**
  - `/api/admin/users` GET (list all users with pagination and search)
  - `/api/admin/users/{id}` DELETE (delete user)
  - `/api/admin/users/{id}/permissions` PUT (update user permissions)
  - `/api/admin/photos` GET (list all photos with owners)
  - `/api/admin/photos/{id}` DELETE (delete any photo)
  - `/api/admin/settings` GET/PUT (manage admin contact email)

- [x] **5.2 Admin UI**
  - **Plan:** `.ai/ui-plan.md` (AdminComponent section)
  - Admin dashboard component (user count, photo count)
  - User management table (list, delete, search by email)
  - Photo management table (list, delete)
  - User permissions management (sidebar with canViewPhotos, canRate)
  - Admin Settings (admin contact email configuration)
  - Banner notification system (replaced alert() popups)
  - Admin-only route with `adminGuard`

- [x] **5.3 User Permissions System**
  - Database migration V5 (can_view_photos, can_rate, app_settings)
  - Backend permission enforcement (PhotoController)
  - Frontend permission checks (AuthService, UI conditional rendering)
  - Public endpoint for admin contact (/api/public/settings)
  - Permission error handling with user-friendly messages

### Acceptance Criteria:
- ✅ Admin can view all users
- ✅ Admin can delete users
- ✅ Admin can search users by email (case-insensitive, contains)
- ✅ Admin can manage user permissions (canViewPhotos, canRate)
- ✅ Admin can view all photos with owner information
- ✅ Admin can delete any photo
- ✅ Admin can configure contact email
- ✅ Regular users cannot access admin panel
- ✅ Permission errors show helpful messages with admin contact
- ✅ All UI uses banner notifications instead of popups
- ✅ New users get canViewPhotos=false, canRate=false by default
- ✅ Existing users keep both permissions true (backward compatibility)

---

## 📋 Phase 6: Deployment na Mikrus VPS

**Time:** ~2-3 hours | **Status:** ⏳ In Progress (Docker setup ready)

**Strategy:** Docker Compose (backend + frontend containers), Manual scripts, Shared PostgreSQL (psql01.mikr.us)

**Feature Spec:** `.ai/features/feature-deployment-mikrus.md`

### Tasks:

- [x] **6.1 Dokumentacja Deployment** ✅
  - [x] deployment/README.md - Docker Compose workflow
  - [x] deployment/.env.production.example - zmienne środowiskowe (Docker style)
  - [x] Troubleshooting guide - Docker logs, container debugging
  - [x] .ai/features/feature-deployment-mikrus.md - strategia Docker Compose

- [x] **6.2 Docker Setup** ✅
  - [x] backend/Dockerfile - Spring Boot JAR w openjdk:17-jre-slim
  - [x] frontend/Dockerfile - nginx:alpine + Angular build
  - [x] frontend/nginx.conf - SPA routing + /api proxy do backend:8080
  - [x] deployment/docker-compose.yml - backend + frontend containers
  - [x] Volume: photo-map-uploads (persistence dla zdjęć)
  - [x] Network: internal (backend-frontend) + external (port 30288)

- [x] **6.3 Build Docker Images** ✅
  - [x] Skrypt deployment/scripts/build-images.sh
  - [x] Build backend JAR: `./mvnw clean package -DskipTests`
  - [x] Build Docker image: `docker build -t photo-map-backend:latest backend/`
  - [x] Build Angular: `cd frontend && ng build --configuration production`
  - [x] Build Docker image: `docker build -t photo-map-frontend:latest frontend/`
  - [x] Weryfikacja: `docker images | grep photo-map`

- [ ] **6.4 Deployment na VPS**
  - [ ] Skrypt deployment/scripts/deploy.sh
  - [ ] Save images: `docker save photo-map-backend:latest -o backend.tar`
  - [ ] Transfer SCP: images + docker-compose.yml + .env na VPS
  - [ ] Load images na VPS: `docker load -i backend.tar`
  - [ ] Start containers: `docker-compose up -d`
  - [ ] Weryfikacja: `docker ps` + health checks

- [ ] **6.5 Environment Configuration**
  - [ ] Utworzenie .env.production z credentials PostgreSQL (z panelu Mikrus)
  - [ ] JWT secret: `openssl rand -base64 32`
  - [ ] Admin email configuration
  - [ ] Transfer .env na VPS

- [ ] **6.6 Testing & Verification**
  - [ ] Backend health: `docker logs photo-map-backend`
  - [ ] Frontend: `curl https://photos.tojest.dev/`
  - [ ] API: login → GET /api/photos → 200 OK
  - [ ] Upload: web + batch folder
  - [ ] PostgreSQL: verify w logach
  - [ ] Auto-restart: `docker restart` test
  - [ ] Volume persistence

### Acceptance Criteria:
- ✅ Backend działa w Docker container (photo-map-backend:latest)
- ✅ Frontend działa w Docker container (photo-map-frontend:latest)
- ✅ Nginx reverse proxy /api → backend:8080 działa
- ✅ Shared PostgreSQL (psql01.mikr.us) połączenie aktywne
- ✅ SSL automatyczne przez Mikrus proxy (*.wykr.es)
- ✅ Health checks dostępne (/actuator/health)
- ✅ Auto-restart przez Docker restart policy
- ✅ Logi dostępne przez docker logs
- ✅ Upload photos działa z volume persistence
- ✅ Deployment scripts działają (build-images.sh, deploy.sh)

### Docker Compose Architecture:
- **Backend:** photo-map-backend:latest - Spring Boot JAR (port 8080 internal)
- **Frontend:** photo-map-frontend:latest - nginx + Angular (port 30288 external)
- **Database:** Shared PostgreSQL psql01.mikr.us (external service)
- **Volume:** photo-map-uploads - persistence dla zdjęć (input, original, medium, failed)
- **SSL:** Automatyczny przez Mikrus proxy dla *.wykr.es (zero config)
- **Deployment:** build images → save/load → docker-compose up

---

## 🔮 Opcjonalne Fazy (Post-MVP)

### (Optional) GitHub Actions CI/CD - Complete & Configure
**Status:** ⚠️ Phase 4-8 pending - przenieść na post-MVP

**Completed Phases:**
- [x] Phase 1: Backend SonarCloud configuration (pom.xml + JaCoCo plugin) ✅
- [x] Phase 2: Frontend SonarCloud configuration (sonar-project.properties + Karma) ✅
- [x] Phase 3: GitHub Actions workflow creation (.github/workflows/build.yml) ✅

**Remaining Tasks:**
- [ ] Phase 4: Push .github/workflows/build.yml and verify workflow runs on GitHub
- [ ] Phase 5: Validate SonarCloud analysis results (backend + frontend)
  - Fix frontend test failures (30 FAILED tests - AdminComponent, RegisterComponent injection issues)
  - Analyze coverage reports (backend: 51% instruction, frontend: 65.24% statements)
- [ ] Phase 6: Configure quality gates and PR decoration in SonarCloud
- [ ] Phase 7: Update README.md (add CI badges, documentation links)
- [ ] Phase 8: Final testing (push to master + create test PR)

**Note:** Phases 1-3 completed successfully. CI/CD automation can be added post-deployment. Manual testing prioritized for MVP deployment.

**Estimated time:** 2-3 hours to complete remaining phases

---

### (Optional) SSL Configuration - Let's Encrypt
**Status:** 🔜 Post-deployment (requires domain name)

**Tasks:**
- [ ] Install certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Request certificate: `sudo certbot --nginx -d YOUR_DOMAIN`
- [ ] Verify auto-renewal: `sudo certbot renew --dry-run`
- [ ] Update nginx config (HTTPS redirect, SSL certificate paths)
- [ ] Test HTTPS access and certificate validity

**Note:** Requires configured domain name. MVP can use HTTP initially. SSL should be added after deployment verification.

**Estimated time:** 30 minutes - 1 hour

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

### NAS Batch Processing - Remote Photo Storage (Post-MVP Optimization)

**Description:** System przetwarzania zdjęć z NAS, gdzie oryginały pozostają na NAS (storage zewnętrzny), a tylko miniatury są generowane lokalnie na Mikrus VPS.

**Key Features:**
1. **NFS/SMB Mount** - NAS zmontowany read-only na Mikrus
2. **Batch Processing** - skanowanie NAS i przetwarzanie w partiach (np. 100 zdjęć)
3. **Deduplikacja** - wykrywanie duplikatów po hash MD5/SHA256
4. **Progress Tracking** - tabela `batch_jobs` z real-time statusem
5. **Storage Optimization** - 90% oszczędności miejsca (tylko miniatury ~2.5GB, bez oryginałów 25GB)

**Benefits:**
- ✅ **Oszczędność miejsca:** 5000 zdjęć = tylko 2.5GB miniatur (zamiast 27.5GB)
- ✅ **Centralne źródło:** NAS jako single source of truth
- ✅ **Skalowalność:** Łatwe dodawanie tysięcy zdjęć przez NAS
- ✅ **Backup:** Oryginały już backupowane na NAS

**Implementation phases:**
- [ ] **Phase 1:** Infrastructure - NFS/SMB mount + database migration (1-2 dni)
- [ ] **Phase 2:** Backend - PhotoBatchService + Admin API (2-3 dni)
- [ ] **Phase 3:** Photo Serving - serve originals from NAS (1 dzień)
- [ ] **Phase 4:** Admin UI - NasManagementComponent + progress tracking (2-3 dni)
- [ ] **Phase 5:** Deployment - Nginx cache + monitoring (1-2 dni)

**Use Case:** Użytkownik z NAS (kilka tysięcy zdjęć) chce wyświetlać je w aplikacji bez kopiowania na VPS (250GB limit).

**Documentation:** `.ai/features/feature-nas-batch-processing.md` (full spec)

**Estimated time:** 7-11 days (1.5-2 weeks)

**Priority:** Medium (optional, for users with large photo collections on NAS)

---

**Last Updated:** 2025-10-26
**Next Step:** Implement Admin Security Enhancements → Admin Panel → Deployment → Optional: Email System / Public Sharing / Temporal Filters / NAS Batch Processing
