# Photo Map MVP

Full-stack aplikacja do zarządzania zdjęciami z geolokalizacją. Umożliwia upload zdjęć, automatyczną ekstrakcję danych EXIF (GPS, data), generowanie miniatur oraz wizualizację na interaktywnej mapie.

## 🛠️ Stack Technologiczny

**Frontend:**
- Angular 18 (standalone components)
- TypeScript 5 (strict mode)
- Tailwind CSS 3 (Angular 18 incompatible with v4)
- Leaflet.js (interactive maps)

**Backend:**
- Spring Boot 3
- Java 17 (LTS)
- PostgreSQL 15
- Spring Security (JWT authentication)

**Deployment:**
- Nginx (reverse proxy)
- Systemd (process management)
- Mikrus VPS

## 📁 Struktura Projektu

```
photo-map-app/
├── README.md                  # Ten plik
├── CLAUDE.md                  # Instrukcje dla AI (workflow)
├── PROGRESS_TRACKER.md        # Tracker statusu implementacji
│
├── .ai/                       # 🤖 Core context (for Claude Code)
│   ├── prd.md                 # MVP requirements
│   ├── tech-stack.md          # Technology specs
│   ├── db-plan.md             # Database schema
│   ├── api-plan.md            # REST API spec
│   └── ui-plan.md             # Frontend architecture
│
└── .decisions/                # 👥 Decision context (for humans + optional)
    ├── prd-context.md         # Business rationale
    └── tech-decisions.md      # Technology comparisons
```

**Separacja kontekstu:**
- **`.ai/`** - Implementation specs (always loaded)
- **`.decisions/`** - Decision rationale (read on-demand)

## 📚 Dokumentacja

### 🤖 Dla Claude Code (Core Context)

**Always read:**
- `CLAUDE.md` - Workflow instructions, Sonnet 4.5 strategy
- `PROGRESS_TRACKER.md` - Project roadmap (6 phases)
- `.ai/prd.md` - MVP requirements & user stories
- `.ai/tech-stack.md` - Technology specs & patterns
- `.ai/db-plan.md` - Database schema (before Backend Setup)
- `.ai/api-plan.md` - REST API spec (before Backend API)
- `.ai/ui-plan.md` - Frontend architecture (before Frontend)

### 👥 Dla Ludzi (Decision Context)

**Read on-demand:**
- `.decisions/prd-context.md` - Business rationale, problem statement
- `.decisions/tech-decisions.md` - Technology comparisons ("why X not Y")

## 📌 Status Projektu

**Co zostało zrobione:**
- ✅ Pełna dokumentacja MVP (PRD, tech stack, architecture plans)
- ✅ Database schema specification
- ✅ REST API specification
- ✅ UI architecture specification
- ✅ Decision context

**Co dalej:**
- 🔜 Implementacja backendu (Spring Boot 3 + PostgreSQL)
- 🔜 Implementacja frontendu (Angular 18 + Tailwind CSS 3)
- 🔜 Deployment na Mikrus VPS

**Szacowany czas:** 2-3 tygodnie (16-22h pracy efektywnej)

## 🚀 Jak Zacząć

### Prerequisites

**Frontend:**
- Node.js 18+ (LTS)
- npm 9+ lub yarn

**Backend:**
- Java 17 (JDK)
- Maven 3.8+
- PostgreSQL 15+

**Narzędzia:**
- Git
- IDE: VS Code (frontend), IntelliJ IDEA (backend)

### Instalacja

#### 1. Clone Repository

```bash
git clone <repository-url>
cd photo-map-app
```

#### 2. Backend Setup

```bash
# Navigate to backend directory (when created)
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
# Navigate to frontend directory (when created)
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

### API Documentation

Once backend is running, access Swagger UI:
```
http://localhost:8080/swagger-ui.html
```

### Environment Variables

See `.env.example` for all required environment variables:
- `DB_USERNAME`, `DB_PASSWORD` - PostgreSQL credentials
- `JWT_SECRET` - JWT signing key (generate with `openssl rand -base64 32`)
- `STORAGE_PATH` - Photo storage directory

---

**Dokumentacja:** Gotowa i sprawdzona
