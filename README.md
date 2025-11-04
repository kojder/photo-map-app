# Photo Map MVP

[![Build Status](https://github.com/kojder/photo-map-app/workflows/CI%3A%20Build%2C%20Test%20%26%20SonarCloud%20Analysis/badge.svg)](https://github.com/kojder/photo-map-app/actions)

**Backend:**
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-backend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)

**Frontend:**
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)

## 📖 Overview

**Photo Map MVP** is a full-stack application for managing photos with geolocation. Built with Angular 18, Spring Boot 3, and PostgreSQL, it provides a complete solution for uploading, processing, visualizing, and managing geotagged photos.

**Key Features:**
- **Upload & Processing** - Upload photos with automatic EXIF extraction (GPS, date) and thumbnail generation
- **Visualization** - Responsive gallery grid and interactive map (Leaflet.js) with GPS markers
- **Rating System** - Rate photos with 1-5 stars, view overall average ratings and personal ratings
- **Security** - JWT authentication, BCrypt password hashing, role-based access control
- **Administration** - Admin panel for user management, permissions, and photo oversight

**Implementation Approach:** This project was implemented following structured specifications in `.ai/` directory (PRD, tech stack, database schema, API specification, UI architecture) with additional features documented in `.ai/features/`.

## 🎯 Features

### ✅ Implemented

- **Photo Viewer** - Fullscreen photo browsing with keyboard navigation (arrows, ESC) and mobile touch support (swipe gestures)
- **GitHub Actions + SonarCloud** - Automated CI/CD pipeline with build, test, and code quality analysis on every push/PR
- **E2E Tests (Playwright)** - 6 test specs with 15+ test cases covering authentication, admin panel, gallery, map, filters, and navigation
- **UI Redesign** - Modern navigation bar with active state indicators and floating action button (FAB) for filters

### 🚧 In Progress

- **Admin Initializer** - Automatic admin user creation on first startup (backend complete, API + frontend pending)
- **Deployment** - Docker Compose deployment to Mikrus VPS with Nginx reverse proxy and shared PostgreSQL

### 📋 Planned / Future

- **Email System** - Email verification, password reset, user notifications
- **Map Photo Caching** - Client-side caching optimization for map markers
- **NAS Batch Processing** - Bulk photo import from NAS with local thumbnails only
- **Public Sharing** - Share photos via public UUID links without authentication
- **Temporal & Spatial Filters** - Advanced filters like "same month in other years" or "same location"

For detailed feature specifications, see [`.ai/features/`](.ai/features/) directory.

## 🛠️ Tech Stack

**Frontend:**
- Angular 18.2.0 (standalone components, Signals)
- TypeScript 5.5.2+ (strict mode)
- Tailwind CSS 3.4.17 ⚠️ (v4 incompatible with Angular 18)
- Leaflet.js 1.9.4 (interactive maps + markercluster plugin)
- RxJS 7.8.0 (BehaviorSubject pattern, no NgRx)

**Backend:**
- Spring Boot 3.2.11 (Java 17 LTS)
- PostgreSQL 15
- Spring Security 6 (JWT authentication, BCrypt)
- metadata-extractor 2.19.0 (EXIF GPS + timestamp extraction)
- Thumbnailator 0.4.20 (thumbnail generation)
- Spring Integration File (async photo processing pipeline)
- Flyway (database migrations)

**Testing:**
- Frontend Unit: Karma + Jasmine (199 tests)
- Backend Unit: JUnit 5 + Mockito + Spring Boot Test (78 tests)
- E2E: Playwright (6 specs, 15+ test cases)
- Coverage: Backend >50%, Frontend >50%

**Deployment:**
- Docker Compose (backend + frontend containers)
- Nginx (reverse proxy in frontend container)
- PostgreSQL (shared Mikrus service: psql01.mikr.us)
- Mikrus VPS (srv07 - marcin288, 4GB RAM)

## 📁 Project Structure

```
photo-map-app/
├── README.md                       # This file
├── CLAUDE.md                       # Claude Code workflow instructions
├── PROGRESS_TRACKER.md             # Implementation roadmap and status
│
├── .github/                        # GitHub configuration
│   ├── copilot-instructions.md     # GitHub Copilot instructions
│   └── workflows/
│       ├── build.yml               # CI/CD pipeline (build + test + SonarCloud + E2E)
│       └── README.md               # Workflow documentation
│
├── .ai/                            # Implementation specs (Core Context)
│   ├── prd.md                      # MVP requirements
│   ├── tech-stack.md               # Technology specifications
│   ├── db-plan.md                  # Database schema
│   ├── api-plan.md                 # REST API specification
│   ├── ui-plan.md                  # Frontend architecture
│   └── features/                   # Feature documentation (11 files)
│       ├── feature-photo-viewer.md
│       ├── feature-github-actions-sonarcloud.md
│       ├── feature-e2e-playwright-tests.md
│       ├── feature-ui-redesign-navbar-filters.md
│       └── ... (7 more)
│
├── .decisions/                     # Decision rationale (on-demand)
│   ├── prd-context.md              # Business context
│   └── tech-decisions.md           # Technology decisions ("why X not Y")
│
├── backend/                        # Spring Boot 3 backend
│   ├── src/
│   │   ├── main/java/              # Java source code
│   │   │   └── com/photomap/       # Main package
│   │   │       ├── controller/     # REST controllers
│   │   │       ├── service/        # Business logic
│   │   │       ├── repository/     # JPA repositories
│   │   │       ├── model/          # JPA entities
│   │   │       ├── dto/            # Data transfer objects
│   │   │       ├── security/       # JWT + Spring Security config
│   │   │       └── config/         # Application configuration
│   │   ├── main/resources/         # Config + Flyway migrations
│   │   │   ├── application.properties
│   │   │   └── db/migration/       # Flyway SQL migrations (V1-V5)
│   │   └── test/java/              # Unit + integration tests
│   ├── pom.xml                     # Maven dependencies + SonarCloud config
│   └── uploads/                    # Photo storage (4 folders)
│       ├── input/                  # Drop zone (watched by Spring Integration)
│       ├── original/               # Processed originals (full resolution)
│       ├── medium/                 # 300px thumbnails (gallery + map)
│       └── failed/                 # Processing errors
│
├── frontend/                       # Angular 18 frontend
│   ├── src/
│   │   ├── app/                    # Angular application
│   │   │   ├── components/         # UI components (gallery, map, navbar, etc.)
│   │   │   ├── services/           # Services (photo, auth, filter, etc.)
│   │   │   ├── guards/             # Route guards (auth, admin)
│   │   │   ├── models/             # TypeScript interfaces
│   │   │   ├── app.config.ts       # Application configuration
│   │   │   └── app.routes.ts       # Routing configuration
│   │   └── styles.css              # Global Tailwind CSS
│   ├── tests/
│   │   └── e2e/                    # Playwright E2E tests
│   │       ├── specs/              # Test specs (6 files)
│   │       ├── pages/              # Page Object Models (7 POMs)
│   │       └── fixtures/           # Test data + cleanup utilities
│   ├── package.json                # npm dependencies + SonarCloud config
│   ├── playwright.config.ts        # E2E test configuration
│   ├── sonar-project.properties    # SonarCloud frontend config
│   └── .env.test                   # E2E test environment variables
│
├── scripts/                        # Development & test scripts
│   ├── start-dev.sh                # Start backend + frontend [--with-db]
│   ├── stop-dev.sh                 # Stop development environment [--with-db]
│   ├── run-all-tests.sh            # Run all tests (unit + backend + E2E)
│   ├── install-hooks.sh            # Install pre-push hook (one-time setup)
│   ├── git-hooks/
│   │   └── pre-push                # Pre-push hook (auto-runs tests)
│   ├── .pid/                       # PID files + log files
│   └── README.md                   # Scripts documentation
│
├── deployment/                     # Deployment configuration
│   ├── docker-compose.yml          # Production Docker Compose
│   ├── nginx.conf                  # Nginx reverse proxy config
│   └── scripts/                    # Deployment scripts (build-images.sh, deploy.sh)
│
├── docker-compose.yml              # Local development PostgreSQL
└── docker-compose.test.yml         # E2E test database (port 5433)
```

## 🤖 Automation & Quality

### GitHub Actions CI/CD

**Two-job pipeline** (`.github/workflows/build.yml`):

**Job 1: Build, Test & SonarCloud Analysis**
- Checkout + Setup (JDK 17, Node 20)
- Caching (Maven, npm, SonarCloud)
- Backend: `mvn clean install` + `mvn test jacoco:report`
- Frontend: `npm ci` + `npm run test:coverage`
- SonarCloud: Backend (Maven plugin) + Frontend (SonarQube Scan Action)
- Artifacts: test reports + coverage reports (7-day retention)

**Job 2: E2E Tests with Playwright**
- PostgreSQL service container (port 5433)
- Backend build + Flyway migrations
- Frontend deps + Playwright browsers
- Execute: `npm run test:e2e` (6 specs, 15+ test cases)
- Artifacts: Playwright report + test results

**Triggers:** Push to master, pull requests (opened, synchronize, reopened)

**Caching strategy:** Maven dependencies, npm packages, SonarCloud cache (workflow time: 8min → 4-5min)

### Pre-push Hook

**Automatic test execution before push** - prevents pushing broken code to remote.

**Installation (one-time):**
```bash
./scripts/install-hooks.sh
```

**How it works:**
1. Every `git push` triggers the hook automatically
2. Hook executes `./scripts/run-all-tests.sh` (frontend unit + backend + E2E)
3. If any test fails → push is blocked
4. If all tests pass → push proceeds

**Why pre-push (not pre-commit)?**
- Commit is fast (local operation, multiple commits per session)
- Push is verified by tests (before sending to remote)
- Less frustration - tests only once before push, not on every commit

**Bypass (emergency only):**
```bash
git push --no-verify  # ⚠️ Use only for WIP branches, never for main/master!
```

### SonarCloud Integration

**Two separate projects:**
- **Backend:** `kojder_photo-map-app-backend` (Java)
- **Frontend:** `kojder_photo-map-app-frontend` (TypeScript)

**Features:**
- Code quality metrics (bugs, vulnerabilities, code smells)
- Test coverage tracking (JaCoCo backend, LCOV frontend)
- Quality gate enforcement (blocks PR merge if quality gate fails)
- Automatic analysis on every push/PR

**Current Coverage:**
- Backend: >50%
- Frontend: >50%

**Dashboards:**
- [Backend Dashboard](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)
- [Frontend Dashboard](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)

## 🚀 Getting Started

### Prerequisites

**Frontend:**
- Node.js 18+ (LTS)
- npm 9+ or yarn

**Backend:**
- Java 17 (JDK)
- Maven 3.8+
- PostgreSQL 15+

**Tools:**
- Git
- IDE: VS Code (frontend), IntelliJ IDEA (backend)

### Installation

#### 1. Clone Repository

```bash
git clone <repository-url>
cd photo-map-app
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment configuration
cp .env.example .env
# Edit .env and fill in your database credentials and JWT secret

# Install dependencies
./mvnw clean install

# Run backend
./mvnw spring-boot:run
# Backend will start on http://localhost:8080
```

#### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
ng serve
# Frontend will start on http://localhost:4200
```

#### 4. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE photomap;
CREATE USER photomap_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE photomap TO photomap_user;
\q

# Database migrations will run automatically on backend startup (Flyway)
```

### Development

**Using development scripts** (recommended):

```bash
# Start backend + frontend
./scripts/start-dev.sh

# Start backend + frontend + PostgreSQL
./scripts/start-dev.sh --with-db

# Stop backend + frontend
./scripts/stop-dev.sh

# Stop everything including PostgreSQL
./scripts/stop-dev.sh --with-db
```

**Manual commands:**

**Backend:**
```bash
./mvnw spring-boot:run          # Run backend
./mvnw test                     # Run tests
./mvnw clean package            # Build JAR
```

**Frontend:**
```bash
ng serve                        # Dev server (http://localhost:4200)
ng build                        # Production build
ng test                         # Run unit tests
```

### Environment Variables

See `.env.example` for all required environment variables:
- `DB_USERNAME`, `DB_PASSWORD` - PostgreSQL credentials
- `JWT_SECRET` - JWT signing key (generate with `openssl rand -base64 32`)
- `STORAGE_PATH` - Photo storage directory

### API Documentation (Swagger)

Interactive API documentation is available via Swagger UI after starting the backend:

**Swagger UI:** http://localhost:8080/swagger-ui/index.html

**OpenAPI JSON:** http://localhost:8080/v3/api-docs

**Features:**
- Interactive API testing (send requests directly from browser)
- JWT authentication support (Bearer token)
- All REST endpoints documented automatically
- Request/response schemas with validation rules

**How to use:**
1. Start backend: `./scripts/start-dev.sh`
2. Open Swagger UI: http://localhost:8080/swagger-ui/index.html
3. Click "Authorize" button
4. Login via `/api/auth/login` to get JWT token
5. Copy JWT token from login response
6. Click "Authorize" button again, enter: `Bearer <your-token>`
7. Test any endpoint interactively

**Available endpoints:**
- `/api/auth/**` - Authentication (login, register)
- `/api/photos/**` - Photo management (list, upload, rating)
- `/api/admin/**` - Admin operations (users, permissions, settings)
- `/api/public/**` - Public endpoints (no authentication required)

## 🧪 Testing

### Unit Tests

**Frontend (Karma + Jasmine):**
```bash
cd frontend
npm test                        # Run with watch mode
npm run test:coverage           # Run with coverage report
```

**Coverage threshold:** >50% (configurable in `karma.conf.js`)

**Backend (JUnit 5 + Mockito):**
```bash
cd backend
./mvnw test                     # Run all tests
./mvnw test jacoco:report       # Run with coverage report
```

**Coverage threshold:** >50% (configurable in `pom.xml`)

**Test count:**
- Frontend: 199 tests
- Backend: 78 tests

### E2E Tests (Playwright)

**Prerequisites:**
- Test database (PostgreSQL port 5433) - automatically started by `docker-compose.test.yml`
- Backend and frontend running or auto-started by Playwright

**Run E2E tests:**
```bash
cd frontend
npm run test:e2e                # Run all E2E tests (headless)
npm run test:e2e:ui             # Run with Playwright UI
npm run test:e2e:debug          # Run in debug mode
```

**Test specs:**
- `auth.spec.ts` - Login flow, form validation (2 tests)
- `admin.spec.ts` - Admin panel, search, user management (3 tests)
- `gallery.spec.ts` - Upload button, filter FAB, upload dialog (3 tests)
- `map.spec.ts` - Map container, filter FAB, Leaflet loading (3 tests)
- `filters.spec.ts` - Open/close panel, inputs, date filling (3 tests)
- `navigation.spec.ts` - Full flow, admin link visibility (2 tests)

**Total:** 6 specs, 15+ test cases

### Run All Tests

**One command to run all tests** (frontend unit + backend + E2E):

```bash
./scripts/run-all-tests.sh
```

**Output:**
```
============================================
  TEST RESULTS SUMMARY
============================================
Frontend Unit Tests (Karma):    ✅ PASSED
Backend Tests (Maven):           ✅ PASSED
E2E Tests (Playwright):          ✅ PASSED
============================================
✓ All tests PASSED - OK to push!

Coverage reports:
- frontend/coverage/frontend/index.html
- backend/target/site/jacoco/index.html
- frontend/playwright-report/index.html
```

### Pre-push Hook

**Install once, run automatically on every push:**

```bash
./scripts/install-hooks.sh
```

After installation, the hook will:
- Run `./scripts/run-all-tests.sh` before every `git push`
- Block push if any test fails
- Allow push if all tests pass

**Bypass (use only for WIP branches):**
```bash
git push --no-verify
```

## 🔧 Development Scripts

The `scripts/` directory contains utilities for local development:

### Start/Stop Development Environment

```bash
# Start backend + frontend (PostgreSQL must be running)
./scripts/start-dev.sh

# Start backend + frontend + PostgreSQL
./scripts/start-dev.sh --with-db

# Stop backend + frontend
./scripts/stop-dev.sh

# Stop everything including PostgreSQL
./scripts/stop-dev.sh --with-db
```

**Features:**
- Automatic process detection (checks if already running)
- PID tracking (`scripts/.pid/`)
- Graceful shutdown with timeout
- Log files (`scripts/.pid/backend.log`, `frontend.log`)
- Port verification before start

### Run All Tests

```bash
# Run all tests (frontend unit + backend + E2E)
./scripts/run-all-tests.sh
```

**Use cases:**
- Before starting work (verify current state)
- After major changes (before committing)
- Before push (manual verification)
- Debugging (check what's failing)

### Install Pre-push Hook

```bash
# Install pre-push hook (one-time setup)
./scripts/install-hooks.sh
```

After installation, tests will run automatically before every `git push`.

### Other Scripts

- `scripts/start-ngrok.sh` / `stop-ngrok.sh` - Ngrok tunneling (for mobile testing)
- `deployment/scripts/build-images.sh` - Build Docker images
- `deployment/scripts/deploy.sh` - Deploy to Mikrus VPS

For detailed documentation, see [`scripts/README.md`](scripts/README.md).

## 🚢 Deployment

### Docker Compose Setup

**Production deployment** uses Docker Compose with two containers:

**Backend container:**
- Spring Boot application (port 8080)
- Photo storage: bind mount to `/storage/upload` (246GB on Mikrus VPS)
- Environment: `.env` file with DB credentials, JWT secret

**Frontend container:**
- Nginx serving Angular app
- Reverse proxy: `/api/*` → backend:8080
- SSL: automatic via Mikrus proxy (`*.wykr.es`)

**PostgreSQL:**
- Shared Mikrus service: `psql01.mikr.us`
- Database: `photomap_prod`

### Deployment Process

```bash
# Build Docker images
cd deployment
./scripts/build-images.sh

# Deploy to production
./scripts/deploy.sh
```

**Production URL:** https://photos.tojest.dev/ (or similar)

For detailed deployment documentation, see [`.ai/features/feature-deployment-mikrus.md`](.ai/features/feature-deployment-mikrus.md).

## 📚 Documentation

### Core Context (`.ai/`) - Implementation Specs

**Always loaded by Claude Code:**
- `prd.md` - MVP requirements, user stories
- `tech-stack.md` - Technology specifications, patterns
- `db-plan.md` - Database schema, migrations, JPA entities
- `api-plan.md` - REST API endpoints, DTOs, security
- `ui-plan.md` - Frontend architecture, components, services

### Decision Context (`.decisions/`) - Rationale

**Read on-demand:**
- `prd-context.md` - Business context, problem statement
- `tech-decisions.md` - Technology comparisons ("why X not Y")

### Feature Documentation (`.ai/features/`)

**11 features with status:**
- ✅ 4 COMPLETED: photo-viewer, github-actions-sonarcloud, e2e-playwright-tests, ui-redesign-navbar-filters
- 🚧 2 IN-PROGRESS: admin-initializer, deployment-mikrus
- 📋 5 PLANNED: email-system, map-photo-caching, nas-batch-processing, public-sharing, temporal-spatial-filters

Each feature file contains:
- Status (COMPLETED / IN-PROGRESS / PLANNED)
- Requirements and acceptance criteria
- Implementation details (phases, tasks)
- Technical decisions

### Workflow Documentation

- `CLAUDE.md` - Claude Code workflow instructions
- `PROGRESS_TRACKER.md` - Implementation roadmap, current status
- `scripts/README.md` - Development scripts documentation
- `.github/workflows/README.md` - CI/CD pipeline documentation

## 🔗 Links

- **SonarCloud Dashboards:**
  - [Backend Dashboard](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)
  - [Frontend Dashboard](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)
- **GitHub Actions:** [Workflows](https://github.com/kojder/photo-map-app/actions)
- **Production:** https://photos.tojest.dev/ (if deployed)
