# Photo Map MVP

[![Build Status](https://github.com/kojder/photo-map-app/workflows/CI%3A%20Build%2C%20Test%20%26%20SonarCloud%20Analysis/badge.svg)](https://github.com/kojder/photo-map-app/actions)

**Backend:**
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-backend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)

**Frontend:**
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)

## 📖 Overview

**Photo Map MVP** is a full-stack application for managing photos with geolocation. Built with Angular 18, Spring Boot 3, and PostgreSQL, it provides photo uploading, EXIF GPS extraction, interactive map visualization, and rating system.

## 🎯 Features

- **Upload & Processing** - Automatic EXIF extraction (GPS, date) and thumbnail generation
- **Gallery & Map** - Responsive grid view and interactive Leaflet.js map
- **Rating System** - Rate photos 1-5 stars with average rating from all users
- **Security** - JWT authentication, BCrypt hashing, permission-based access
- **Admin Panel** - User management and permissions (VIEW_PHOTOS, RATE_PHOTOS)

## 🛠️ Tech Stack

**Frontend:**
- Angular 18.2.0 (standalone components, Signals)
- TypeScript 5.5.2+ (strict mode)
- Tailwind CSS 3.4.17
- Leaflet.js 1.9.4 (maps + markercluster)
- RxJS 7.8.0 (BehaviorSubject pattern)

**Backend:**
- Spring Boot 3.2.11 (Java 17 LTS)
- PostgreSQL 15
- Spring Security 6 (JWT, BCrypt)
- metadata-extractor 2.19.0 (EXIF)
- Flyway (migrations)

**Testing:**
- Frontend: Karma + Jasmine (199 tests)
- Backend: JUnit 5 + Mockito (78 tests)
- E2E: Playwright (6 specs, 15+ tests)
- Coverage: >50% (backend + frontend)

**Deployment:**
- Docker Compose (backend + frontend)
- Nginx (reverse proxy)
- Mikrus VPS (PostgreSQL shared service)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (frontend)
- Java 17 JDK + Maven (backend)
- PostgreSQL 15+ (or Docker)
- Git

### Installation

**Option A: Quick Setup (Recommended - One Command)**

```bash
# 1. Clone repository
git clone <repository-url>
cd photo-map-app

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your credentials (database, admin password, JWT secret)
nano .env

# 4. Initialize everything (database schema, directories, admin user)
./scripts/reset-data.sh

# 5. Start application
./scripts/start-dev.sh
```

**What happens:**
- ✅ PostgreSQL starts automatically (Docker Compose)
- ✅ Database schema created (Flyway migrations)
- ✅ Upload directories set up
- ✅ Admin user created from `.env` credentials
- ✅ Backend runs on http://localhost:8080
- ✅ Frontend runs on http://localhost:4200

---

**Option B: Manual Setup**

**1. Clone repository:**
```bash
git clone <repository-url>
cd photo-map-app
```

**2. Backend setup:**
```bash
cd backend
cp .env.example .env
# Edit .env with database credentials and JWT secret
./mvnw spring-boot:run
# Backend runs on http://localhost:8080
```

**3. Frontend setup:**
```bash
cd frontend
npm install
ng serve
# Frontend runs on http://localhost:4200
```

**4. Database setup:**
```bash
psql -U postgres
CREATE DATABASE photomap;
CREATE USER photomap_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE photomap TO photomap_user;
\q
# Migrations run automatically on backend startup
```

### Development Scripts

```bash
# Start backend + frontend + PostgreSQL
./scripts/start-dev.sh

# Stop backend + frontend
./scripts/stop-dev.sh

# Run all tests (unit + E2E)
./scripts/run-all-tests.sh

# Install pre-push hook (auto-runs tests)
./scripts/install-hooks.sh
```

For detailed scripts documentation, see [Scripts Reference](https://github.com/kojder/photo-map-app/wiki/Scripts-Reference) or [`scripts/README.md`](scripts/README.md).

## 📚 Documentation

**For detailed documentation, see the [GitHub Wiki](https://github.com/kojder/photo-map-app/wiki):**

### 🏠 Getting Started
- **[Home](https://github.com/kojder/photo-map-app/wiki/Home)** - Project overview and navigation
- **[Quick Start](https://github.com/kojder/photo-map-app/wiki/Quick-Start)** - 5-step setup guide
- **[User Guide](https://github.com/kojder/photo-map-app/wiki/User-Guide)** - How to use the application

### 💻 Development
- **[Development Setup](https://github.com/kojder/photo-map-app/wiki/Development-Setup)** - Prerequisites, project structure, workflow
- **[Architecture](https://github.com/kojder/photo-map-app/wiki/Architecture)** - Tech stack, frontend/backend architecture, database schema
- **[API Documentation](https://github.com/kojder/photo-map-app/wiki/API-Documentation)** - REST endpoints, authentication, Swagger UI
- **[Testing & Quality](https://github.com/kojder/photo-map-app/wiki/Testing-Quality)** - Unit tests, E2E tests, CI/CD pipeline
- **[Scripts Reference](https://github.com/kojder/photo-map-app/wiki/Scripts-Reference)** - Development scripts guide
- **[Contributing](https://github.com/kojder/photo-map-app/wiki/Contributing)** - Code conventions, git workflow, PR process

### 🚀 Deployment
- **[Deployment Guide](https://github.com/kojder/photo-map-app/wiki/Deployment)** - Docker Compose, Mikrus VPS, SSL configuration

### 🤖 AI Development
- **[AI Development Methodology](https://github.com/kojder/photo-map-app/wiki/AI-Development-Methodology)** - Claude Code, GitHub Copilot, Gemini CLI

### 📋 Local Files
- `CLAUDE.md` - Claude Code workflow instructions
- `PROGRESS_TRACKER.md` - Implementation roadmap and status
- `.ai/` - Implementation specs (PRD, tech stack, API/DB/UI plans)
- `.decisions/` - Decision rationale and context

## 🧪 Testing

### Unit Tests
```bash
# Frontend
cd frontend && npm run test:coverage

# Backend
cd backend && ./mvnw test jacoco:report
```

### E2E Tests
```bash
cd frontend && npm run test:e2e
```

### Run All Tests
```bash
./scripts/run-all-tests.sh
```

### Pre-push Hook
```bash
# Install (one-time)
./scripts/install-hooks.sh

# Tests run automatically on git push
# Bypass (emergency only): git push --no-verify
```

## 🔧 API Documentation (Swagger)

Interactive API docs available at: http://localhost:8080/swagger-ui/index.html

**Endpoints:**
- `/api/auth/**` - Authentication
- `/api/photos/**` - Photo management
- `/api/admin/**` - Admin operations

## 🔗 Links

- **SonarCloud:**
  - [Backend Dashboard](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)
  - [Frontend Dashboard](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)
- **GitHub Actions:** [Workflows](https://github.com/kojder/photo-map-app/actions)

## 🤝 Contributing

See [Contributing Guide](https://github.com/kojder/photo-map-app/wiki/Contributing) for:
- Code conventions (English code, self-documenting style)
- Git workflow (Conventional Commits)
- Testing policy (TDD-like, >70% coverage)
- Pull request process

## 📄 License

MIT License - see LICENSE file for details
