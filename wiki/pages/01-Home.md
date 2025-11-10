# Welcome to Photo Map MVP Wiki

> **Photo Map MVP** is a full-stack application for managing photos with geolocation. Built with Angular 18, Spring Boot 3, and PostgreSQL.

[![Build Status](https://github.com/kojder/photo-map-app/workflows/CI%3A%20Build%2C%20Test%20%26%20SonarCloud%20Analysis/badge.svg)](https://github.com/kojder/photo-map-app/actions)

**Backend:**
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-backend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)

**Frontend:**
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)

---

## 🧭 Quick Navigation

### 👤 For End Users

| Page | Description |
|------|-------------|
| [**User Guide**](User-Guide) | How to use the application - registration, gallery, map, filters, rating, admin panel |

### 💻 For Developers

| Page | Description |
|------|-------------|
| [**Quick Start**](Quick-Start) | Get started in 5 minutes - prerequisites, setup, first login |
| [**Development Setup**](Development-Setup) | Detailed setup guide - environment, project structure, daily workflow, conventions |
| [**Architecture**](Architecture) | Tech stack, frontend/backend architecture, database schema, design decisions |
| [**API Documentation**](API-Documentation) | REST API reference - Swagger UI, endpoints, DTOs, authentication flow |
| [**Testing & Quality**](Testing-Quality) | Local testing, CI/CD pipeline, writing tests, coverage requirements |
| [**Scripts Reference**](Scripts-Reference) | Development scripts - start/stop, testing, rebuild, hooks |
| [**Deployment**](Deployment) | Docker Compose, Mikrus VPS, build & deploy, SSL, troubleshooting |

### 🤖 For AI-Assisted Development

| Page | Description |
|------|-------------|
| [**AI Development Methodology**](AI-Development-Methodology) | Claude Code, GitHub Copilot, Gemini CLI, prompt engineering |
| [**Contributing**](Contributing) | Code conventions, git workflow, testing policy, PR process |

---

## 🚀 Getting Started Path

**New to the project? Follow this path:**

1. **[Quick Start](Quick-Start)** - Get the app running in 5 minutes
2. **[Development Setup](Development-Setup)** - Detailed environment setup and project structure
3. **[Architecture](Architecture)** - Understand the tech stack and design decisions
4. **[API Documentation](API-Documentation)** - Explore the REST API with Swagger UI
5. **[Testing & Quality](Testing-Quality)** - Learn about testing strategy and CI/CD

---

## 🔗 Quick Links

**Project:**
- **Repository:** [github.com/kojder/photo-map-app](https://github.com/kojder/photo-map-app)
- **Production:** [photos.tojest.dev](https://photos.tojest.dev/)

**Dashboards:**
- **GitHub Actions:** [CI/CD Workflows](https://github.com/kojder/photo-map-app/actions)
- **SonarCloud Backend:** [Code Quality Dashboard](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)
- **SonarCloud Frontend:** [Code Quality Dashboard](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)

**Documentation:**
- **Swagger UI:** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) (after starting backend)
- **API Docs:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs) (OpenAPI JSON)

---

## 📊 Project Status

**Status:** ✅ **Core MVP Complete** (100%)

**Implemented Features:**
- ✅ **Authentication** - JWT tokens, BCrypt password hashing, role-based access control
- ✅ **Photo Upload & Processing** - Automatic EXIF extraction (GPS, date), thumbnail generation
- ✅ **Gallery View** - Responsive grid with filters, rating, fullscreen photo viewer
- ✅ **Map View** - Interactive Leaflet.js map with GPS markers and markercluster plugin
- ✅ **Rating System** - Rate photos 1-5 stars, view overall average and personal ratings
- ✅ **Admin Panel** - User management, permissions, photo oversight
- ✅ **Photo Viewer** - Fullscreen browsing with keyboard navigation and mobile touch support
- ✅ **CI/CD Pipeline** - GitHub Actions with build, test, and SonarCloud analysis
- ✅ **E2E Tests** - Playwright tests (6 specs, 15+ test cases)
- ✅ **Deployment** - Docker Compose deployment to Mikrus VPS with Nginx reverse proxy

**Test Coverage:**
- Frontend Unit Tests: **199 tests** (Karma + Jasmine)
- Backend Unit Tests: **78 tests** (JUnit 5 + Mockito)
- E2E Tests: **6 specs, 15+ test cases** (Playwright)
- Coverage: Backend >50%, Frontend >50%

**Planned Features:**
- 📋 **Email System** - Email verification, password reset, notifications
- 📋 **User Deactivation & Orphaned Photos Cleanup** - Soft delete users, manage orphaned photos
- 📋 **Public Photo Sharing** - Share photos via UUID links without authentication
- 📋 **Temporal & Spatial Filters** - "Same month in other years", "Same location"
- 📋 **Gallery Photo Card Optimization** - Focus on photos, overlay controls
- 📋 **NAS Batch Processing** - Bulk photo import from NAS with local thumbnails only

For detailed feature specifications, see `.ai/features/` directory in the repository.

---

## 🛠️ Tech Stack Summary

**Frontend:**
- Angular 18.2.0 (standalone components, Signals)
- TypeScript 5.5.2+ (strict mode)
- Tailwind CSS 3.4.17
- Leaflet.js 1.9.4 (interactive maps)
- RxJS 7.8.0 (BehaviorSubject pattern)

**Backend:**
- Spring Boot 3.2.11 (Java 17 LTS)
- PostgreSQL 15
- Spring Security 6 (JWT authentication)
- metadata-extractor 2.19.0 (EXIF extraction)
- Thumbnailator 0.4.20 (thumbnail generation)

**Testing:**
- Frontend: Karma + Jasmine
- Backend: JUnit 5 + Mockito
- E2E: Playwright
- CI/CD: GitHub Actions + SonarCloud

**Deployment:**
- Docker Compose
- Nginx (reverse proxy)
- PostgreSQL (shared Mikrus service)
- Mikrus VPS (4GB RAM)

For complete tech stack details, see [**Architecture**](Architecture).

---

## 💡 Need Help?

- **Quick Start:** See [Quick Start](Quick-Start) guide
- **Development Issues:** Check [Development Setup](Development-Setup) and [Scripts Reference](Scripts-Reference)
- **API Questions:** Explore [API Documentation](API-Documentation) and Swagger UI
- **Contributing:** Read [Contributing](Contributing) guidelines
- **Deployment Problems:** See [Deployment](Deployment) troubleshooting section

---

**Last Updated:** 2025-11-10

**Sources:**
- `README.md` (Project overview, badges, features, tech stack)
- `PROGRESS_TRACKER.md` (Project status, roadmap)
