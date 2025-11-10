# Development Setup

> Complete guide for setting up Photo Map MVP development environment - prerequisites, configuration, project structure, daily workflow, and code conventions.

---

## 📖 Table of Contents

- [Prerequisites](#prerequisites)
- [First-Time Setup](#first-time-setup)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Daily Workflow](#daily-workflow)
- [Code Conventions](#code-conventions)

---

## 📦 Prerequisites

### Required Software

**Frontend:**
- **Node.js 18+** (LTS recommended)
  - Download: https://nodejs.org/
  - Verify: `node --version`
- **npm 9+** or yarn
  - Comes with Node.js
  - Verify: `npm --version`

**Backend:**
- **Java 17 (JDK)**
  - Download: https://adoptium.net/
  - Verify: `java --version`
- **Maven 3.8+**
  - Usually comes with IDE or backend project (mvnw wrapper)
  - Verify: `mvn --version`
- **PostgreSQL 15+**
  - Download: https://www.postgresql.org/download/
  - Alternative: Use Docker Compose (recommended)

**Tools:**
- **Git**
  - Download: https://git-scm.com/
  - Verify: `git --version`
- **Docker & Docker Compose** (recommended for PostgreSQL)
  - Download: https://www.docker.com/
  - Verify: `docker --version` and `docker-compose --version`

### Recommended IDEs

**Frontend:**
- **VS Code** with extensions:
  - Angular Language Service
  - ESLint
  - Prettier
  - TypeScript Vue Plugin (optional)

**Backend:**
- **IntelliJ IDEA** (Community or Ultimate)
  - Built-in support for Spring Boot, Java, Maven
  - Database tools (Ultimate edition)

**Alternative:**
- Eclipse with Spring Tools
- VS Code with Java Extension Pack

---

## 🚀 First-Time Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd photo-map-app
```


### Step 2: Database Setup

**Recommended: Quick Setup Script**

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your database credentials
nano .env  # or use your preferred editor

# 3. Run reset-data.sh to initialize everything
./scripts/reset-data.sh
```

**What `reset-data.sh` does:**
- ✅ Creates database schema (runs Flyway migrations automatically)
- ✅ Sets up directory structure (`uploads/input/`, `uploads/original/`, `uploads/medium/`, `uploads/failed/`)
- ✅ Checks PostgreSQL connection (starts Docker Compose if needed)
- ✅ Admin user will be created on backend startup from `.env` credentials

**Required .env variables for initialization:**
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=photomap
DB_USERNAME=photomap_user
DB_PASSWORD=photomap_pass

# JWT Configuration
JWT_SECRET=<generate-with-openssl-rand-base64-32>

# Admin Account (created on backend startup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<your-secure-password>

# Storage Configuration
UPLOAD_DIR_INPUT=./uploads/input
UPLOAD_DIR_ORIGINAL=./uploads/original
UPLOAD_DIR_MEDIUM=./uploads/medium
UPLOAD_DIR_FAILED=./uploads/failed
```

**After running `reset-data.sh`, proceed to Step 3 (Backend Setup).**

---

**Alternative: Manual Setup**

**Option A: Docker Compose (Recommended)**

Create `docker-compose.yml` (already included in project):

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: photomap-postgres
    environment:
      POSTGRES_DB: photomap
      POSTGRES_USER: photomap_user
      POSTGRES_PASSWORD: photomap_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start PostgreSQL:

```bash
docker-compose up -d
```

**Option B: Local PostgreSQL Installation**

```bash
# Create database and user
psql -U postgres
CREATE DATABASE photomap;
CREATE USER photomap_user WITH PASSWORD 'photomap_pass';
GRANT ALL PRIVILEGES ON DATABASE photomap TO photomap_user;
\q
```

### Step 3: Backend Setup

**3.1. Environment Configuration**

```bash
cd backend
cp .env.example .env
```

Edit `.env` file:

```bash
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/photomap
DB_USERNAME=photomap_user
DB_PASSWORD=photomap_pass

# JWT Configuration
JWT_SECRET=<generate-with-openssl>

# Storage Configuration
STORAGE_PATH=./uploads

# Admin Configuration (for first-time initialization)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<your-admin-password>
```

**Generate JWT_SECRET:**

```bash
openssl rand -base64 32
```

**3.2. Install Dependencies**

```bash
./mvnw clean install
```

This will:
- Download Maven dependencies
- Compile Java source code
- Run unit tests
- Create target/ directory with compiled classes

**3.3. Run Backend**

```bash
./mvnw spring-boot:run
```

Backend will start on **http://localhost:8080**

**3.4. Verify Backend**

- Open http://localhost:8080/swagger-ui/index.html
- You should see Swagger API documentation
- Database migrations (Flyway) run automatically
- Admin user is created automatically (check logs)

### Step 4: Frontend Setup

**4.1. Install Dependencies**

```bash
cd frontend
npm install
```

This will:
- Download npm packages (node_modules/)
- Install Angular CLI locally
- Setup Playwright browsers (for E2E tests)

**4.2. Run Frontend**

```bash
ng serve
```

Frontend will start on **http://localhost:4200**

**4.3. Verify Frontend**

- Open http://localhost:4200
- You should see the login page
- Try logging in with admin credentials from `.env` file

### Step 5: Install Git Hooks (Optional but Recommended)

```bash
./scripts/install-hooks.sh
```

This installs a pre-push hook that runs all tests before pushing to remote.

---

## ⚙️ Environment Configuration

### Backend `.env` File

**Location:** `backend/.env`

**Required Variables:**

```bash
# ─────────────────────────────────────────────────────
# Database Configuration
# ─────────────────────────────────────────────────────
DB_URL=jdbc:postgresql://localhost:5432/photomap
# PostgreSQL JDBC URL
# Format: jdbc:postgresql://<host>:<port>/<database>

DB_USERNAME=photomap_user
# PostgreSQL username

DB_PASSWORD=photomap_pass
# PostgreSQL password
# IMPORTANT: Never commit real passwords to git!

# ─────────────────────────────────────────────────────
# JWT Configuration
# ─────────────────────────────────────────────────────
JWT_SECRET=<generate-with-openssl-rand-base64-32>
# JWT signing secret key (base64 encoded)
# Generate with: openssl rand -base64 32
# IMPORTANT: Keep this secret, never commit to git!

# ─────────────────────────────────────────────────────
# Storage Configuration
# ─────────────────────────────────────────────────────
STORAGE_PATH=./uploads
# Photo storage directory (relative to backend/)
# Structure:
#   - uploads/input/     - Drop zone (watched by Spring Integration)
#   - uploads/original/  - Processed originals (full resolution)
#   - uploads/medium/    - 300px thumbnails (gallery + map)
#   - uploads/failed/    - Processing errors

# ─────────────────────────────────────────────────────
# Admin Configuration (First-Time Initialization)
# ─────────────────────────────────────────────────────
ADMIN_EMAIL=admin@example.com
# Default admin email (created on first startup)

ADMIN_PASSWORD=10xdevsx10
# Default admin password
# IMPORTANT: Change this in production!
```

**Security Notes:**
- Never commit `.env` file to git (already in `.gitignore`)
- Use `.env.example` as a template with placeholder values
- Change `ADMIN_PASSWORD` in production
- Rotate `JWT_SECRET` regularly in production

### Frontend `.env.test` File

**Location:** `frontend/.env.test`

Used by E2E tests (Playwright):

```bash
# E2E Test Configuration
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=<should-match-backend-.env>
E2E_BASE_URL=http://localhost:4200
E2E_API_URL=http://localhost:8080
```

---

## 📁 Project Structure

```
photo-map-app/
├── README.md                       # Project overview
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

### Key Directories

**`.ai/`** - Core implementation specs (always read before implementing)
**`.decisions/`** - Decision rationale (read on-demand)
**`.github/`** - GitHub Actions workflows + Copilot instructions
**`backend/src/main/java/`** - Java source code
**`backend/src/main/resources/db/migration/`** - Flyway SQL migrations
**`frontend/src/app/`** - Angular application
**`frontend/tests/e2e/`** - Playwright E2E tests
**`scripts/`** - Development scripts

---

## 🔄 Daily Workflow

### Starting Development Environment

**Recommended: Use development scripts**

```bash
# Start backend + frontend (PostgreSQL auto-starts if not running)
./scripts/start-dev.sh

# Stop backend + frontend (PostgreSQL keeps running)
./scripts/stop-dev.sh
```

**Features:**
- ✅ Automatic PostgreSQL startup (docker-compose)
- ✅ Process detection (avoids duplicates)
- ✅ Health checks for backend and frontend
- ✅ PID tracking and log files
- ✅ Graceful shutdown

**Manual Commands (Alternative):**

```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend (in separate terminal)
cd frontend
ng serve
```

### Running Tests

**All tests (unit + backend + E2E):**

```bash
./scripts/run-all-tests.sh
```

**Frontend unit tests only:**

```bash
cd frontend
npm test                    # Watch mode
npm run test:coverage       # Coverage report
```

**Backend tests only:**

```bash
cd backend
./mvnw test                 # Run tests
./mvnw test jacoco:report   # Coverage report
```

**E2E tests only:**

```bash
cd frontend
npm run test:e2e            # Headless
npm run test:e2e:ui         # Playwright UI
npm run test:e2e:debug      # Debug mode
```

### Development Tips

**Hot Reload:**
- Backend: Automatic reload with Spring Boot DevTools
- Frontend: Automatic reload with `ng serve` (watches file changes)

**API Testing:**
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- curl commands (see [API Documentation](API-Documentation))

**Database Access:**

```bash
# Docker Compose PostgreSQL
psql -U photomap_user -d photomap -h localhost -p 5432

# Inside Docker container
docker exec -it photomap-postgres psql -U photomap_user -d photomap
```

**View Logs:**

```bash
# Backend logs
tail -f scripts/.pid/backend.log

# Frontend logs
tail -f scripts/.pid/frontend.log

# PostgreSQL logs
docker-compose logs -f postgres
```

---

## 📝 Code Conventions

### Language Policy

**Communication:**
- User responses: **Polish**

**Code:**
- All code: **English**
  - Class names, method names, variable names
  - Function parameters and return values
  - Constants and enums
  - All code identifiers

**Documentation:**
- All `.md` files: **English**
- README, comments, inline docs: **English**

**Scripts:**
- All bash scripts: **English**
  - Comments, help messages, log messages
  - Variable names

**Git Commits:**
- Conventional Commits format: **English**

**IMPORTANT:**
- ✅ All documentation files (.md) must be in English
- ✅ All bash scripts must use English for everything
- ✅ Only user-facing communication in responses should be in Polish
- ❌ Never mix Polish and English in documentation or scripts

### Code Quality

**Self-Documenting Code:**
- Clear, descriptive names > comments
- Minimize comments (only for complex business logic)
- Code should be understandable through naming alone

**TypeScript Strict Mode:**
- All types explicit (no `any` unless absolutely necessary)
- Strict null checks enabled
- Strict property initialization

**Java Code Quality:**
- Lombok annotations for boilerplate reduction
- Proper exception handling
- Input validation with Bean Validation
- Security-first approach (prevent SQL injection, XSS)

### Git Workflow

**Commit Strategy:**
- **Small, focused changes** - one logical change per commit
- **Test immediately** - verify changes work before committing
- **Commit frequently** - regular commits for easy tracking
- **Clear messages** - Conventional Commits format

**Conventional Commits Format:**

```
<type>[optional scope]: <description>

[optional body]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code formatting (no logic change)
- `refactor` - Code refactoring (no bug fix or feature)
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tools

**Examples:**
```
feat(auth): implement JWT token validation
fix(photo): resolve EXIF extraction error
docs: update PROGRESS_TRACKER.md after Phase 1
refactor(gallery): extract filter logic to service
test(admin): add unit tests for user management
```

**Commit Review Workflow:**
1. Make changes to files
2. Stage changes: `git add <files>`
3. Show summary: `git status` + `git diff --cached --stat`
4. Ask for confirmation (never auto-commit)
5. Create commit with Conventional Commits message
6. Push (after running tests)

**Pre-Push Hook:**
- Install once: `./scripts/install-hooks.sh`
- Automatically runs all tests before every `git push`
- Blocks push if any test fails
- Bypass (emergency only): `git push --no-verify`

### Testing Policy

**Unit Tests:**
- **When:** Before every commit (TDD-like approach)
- **Coverage:** >70% for new code
- **Pattern:**
  1. Implement feature
  2. Verify with curl/Postman (backend) or manual test (frontend)
  3. Write unit tests (>70% coverage)
  4. Run tests
  5. All tests passing → commit

**Integration Tests:**
- **When:** At the end of each phase
- **Framework:** @SpringBootTest (backend), Playwright (frontend E2E)

**Commit Checklist:**
- [ ] Code implementation ready
- [ ] Verification passing
- [ ] Unit tests written (coverage >70%)
- [ ] All tests passing
- [ ] Code review (git diff --cached)
- [ ] Commit message (Conventional Commits)

---

## 🔗 Next Steps

**After completing setup:**

1. **[Architecture](Architecture)** - Understand tech stack and design decisions
2. **[API Documentation](API-Documentation)** - Explore REST API with Swagger UI
3. **[Testing & Quality](Testing-Quality)** - Learn testing strategy
4. **[Scripts Reference](Scripts-Reference)** - Detailed scripts documentation
5. **[Contributing](Contributing)** - Contribution guidelines

**Explore implementation specs:**
- `.ai/prd.md` - MVP requirements
- `.ai/tech-stack.md` - Technology specifications
- `.ai/db-plan.md` - Database schema
- `.ai/api-plan.md` - REST API specification
- `.ai/ui-plan.md` - Frontend architecture

---

**Last Updated:** 2025-11-10

**Sources:**
- `README.md` (Prerequisites, Installation, Project Structure)
- `CLAUDE.md` (Language policy, Code conventions, Git workflow)
- `scripts/README.md` (Development scripts)
