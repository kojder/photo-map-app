# GitHub Actions CI/CD with SonarCloud Integration

**Feature Type:** DevOps - Continuous Integration & Code Quality
**Status:** ✅ COMPLETED
**Estimated Time:** 3-4 hours
**Actual Time:** ~3.5 hours
**Priority:** High (before deployment)
**Created:** 2025-10-26
**Completed:** 2025-10-28

---

## Overview

Automated CI/CD pipeline using GitHub Actions with SonarCloud integration for code quality analysis. The pipeline runs on every push to `master` and on pull requests, executing backend tests (Maven + JUnit), frontend tests (Karma + Jasmine), and E2E tests (Playwright), with comprehensive coverage reporting to SonarCloud.

**Benefits Achieved:**
- ✅ Automated testing on every push/PR
- ✅ Code quality metrics tracked in SonarCloud
- ✅ Test coverage reports (JaCoCo for backend, LCOV for frontend)
- ✅ Early detection of issues before deployment
- ✅ Quality gate enforcement
- ✅ Artifact retention (test reports, coverage)

---

## What Was Implemented

### 1. GitHub Actions Workflow (`.github/workflows/build.yml`)

**Two jobs:**

#### Job 1: `build` - Build, Test & SonarCloud Analysis
- Checkout code with full git history (`fetch-depth: 0` for SonarCloud)
- Setup: JDK 17 (Zulu), Node.js 20
- Caching: Maven dependencies, npm packages, SonarCloud cache
- Backend: `mvn clean install`, `mvn test jacoco:report`
- Frontend: `npm ci`, `npm run test:coverage`
- SonarCloud analysis:
  - Backend: `mvn sonar:sonar` (Maven plugin)
  - Frontend: `SonarSource/sonarqube-scan-action@v6`
- Upload artifacts: test reports, coverage reports (7-day retention)

#### Job 2: `e2e-tests` - E2E Tests with Playwright
- Runs after `build` job completes (`needs: build`)
- PostgreSQL service container (port 5433)
- Backend build + Flyway migrations
- Frontend dependencies + Playwright browsers
- Execute E2E tests: `npm run test:e2e`
- Upload Playwright reports (7-day retention)

### 2. Backend Configuration

**File:** `backend/pom.xml`

**SonarCloud properties:**
```xml
<sonar.projectKey>kojder_photo-map-app-backend</sonar.projectKey>
<sonar.projectName>Photo Map App - Backend</sonar.projectName>
<sonar.organization>kojder</sonar.organization>
<sonar.host.url>https://sonarcloud.io</sonar.host.url>
<sonar.java.source>17</sonar.java.source>
<sonar.coverage.jacoco.xmlReportPaths>
  ${project.build.directory}/site/jacoco/jacoco.xml
</sonar.coverage.jacoco.xmlReportPaths>
```

**JaCoCo plugin:**
- Version: 0.8.12
- Executions: `prepare-agent` (before tests), `report` (after tests)
- Output: `backend/target/site/jacoco/jacoco.xml`

### 3. Frontend Configuration

**File:** `frontend/sonar-project.properties`

```properties
sonar.projectKey=kojder_photo-map-app-frontend
sonar.organization=kojder
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.spec.ts
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.spec.ts
sonar.typescript.lcov.reportPaths=coverage/frontend/lcov.info
```

### 4. Workflow Documentation

**File:** `.github/workflows/README.md`

- Workflow overview and triggers
- Step-by-step breakdown
- Required secrets (`SONAR_TOKEN`)
- Environment variables
- Troubleshooting guide
- Local testing instructions

---

## Key Technical Decisions

### Decision 1: Shared SonarCloud Project

**Initial Plan:** Separate SonarCloud projects (`kojder_photo-map-app-backend`, `kojder_photo-map-app-frontend`)
**Final Implementation:** Shared project `kojder_photo-map-app` for both backend and frontend

**Rationale:**
- Simplified MVP management - one dashboard for all metrics
- Combined coverage view in single project
- Backend sends Java metrics via Maven plugin
- Frontend sends TypeScript metrics via SonarQube Scan Action
- Both populate same project with different language analyzers

**Note:** This differs from the original plan but provides better overview for monorepo approach.

### Decision 2: E2E Tests in Separate Job

**Structure:**
- `build` job: Unit tests + integration tests + SonarCloud analysis
- `e2e-tests` job: Playwright E2E tests with PostgreSQL service

**Rationale:**
- Isolates E2E environment (separate database, full stack)
- Faster feedback for unit tests (build job completes first)
- E2E tests run only if build passes (`needs: build`)
- Separate artifact retention for Playwright reports

### Decision 3: Aggressive Caching Strategy

**Cached:**
- Maven dependencies (`~/.m2`)
- SonarCloud packages (`~/.sonar/cache`)
- npm dependencies (`frontend/node_modules`)

**Result:** Workflow execution time reduced from ~8 minutes to ~4-5 minutes after initial cache warm-up.

---

## CI/CD Pipeline Flow

```
Push to master or PR opened
  ↓
GitHub Actions triggered
  ↓
┌─────────────────────────────────────┐
│ JOB 1: build                        │
│ ┌─────────────────────────────────┐ │
│ │ Setup (JDK 17, Node 20, Cache)  │ │
│ └─────────────────────────────────┘ │
│           ↓                          │
│ ┌─────────────────────────────────┐ │
│ │ Backend: build + test + coverage│ │
│ └─────────────────────────────────┘ │
│           ↓                          │
│ ┌─────────────────────────────────┐ │
│ │ Frontend: build + test + cover. │ │
│ └─────────────────────────────────┘ │
│           ↓                          │
│ ┌─────────────────────────────────┐ │
│ │ SonarCloud: Backend Analysis    │ │
│ └─────────────────────────────────┘ │
│           ↓                          │
│ ┌─────────────────────────────────┐ │
│ │ SonarCloud: Frontend Analysis   │ │
│ └─────────────────────────────────┘ │
│           ↓                          │
│ ┌─────────────────────────────────┐ │
│ │ Upload Artifacts (reports)      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
           ↓ (needs: build)
┌─────────────────────────────────────┐
│ JOB 2: e2e-tests                    │
│ ┌─────────────────────────────────┐ │
│ │ PostgreSQL Service Container    │ │
│ └─────────────────────────────────┘ │
│           ↓                          │
│ ┌─────────────────────────────────┐ │
│ │ Backend build + migrations      │ │
│ └─────────────────────────────────┘ │
│           ↓                          │
│ ┌─────────────────────────────────┐ │
│ │ Frontend deps + Playwright      │ │
│ └─────────────────────────────────┘ │
│           ↓                          │
│ ┌─────────────────────────────────┐ │
│ │ Run E2E tests (16 tests)        │ │
│ └─────────────────────────────────┘ │
│           ↓                          │
│ ┌─────────────────────────────────┐ │
│ │ Upload Playwright reports       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `.github/workflows/build.yml` | Main CI/CD workflow definition |
| `.github/workflows/README.md` | Workflow documentation |
| `backend/pom.xml` | SonarCloud + JaCoCo configuration |
| `frontend/sonar-project.properties` | Frontend SonarCloud settings |
| `docker-compose.test.yml` | E2E test database (used locally) |

---

## Success Criteria

All criteria met:

- ✅ GitHub Actions workflow runs on push to master
- ✅ GitHub Actions workflow runs on pull requests
- ✅ Backend tests execute with coverage (>70% achieved)
- ✅ Frontend tests execute with coverage (>60% achieved)
- ✅ SonarCloud analysis completes for backend (Java)
- ✅ SonarCloud analysis completes for frontend (TypeScript)
- ✅ Quality gate configured and visible in SonarCloud dashboard
- ✅ Coverage reports visible in SonarCloud
- ✅ E2E tests run in separate job with PostgreSQL
- ✅ Test artifacts uploaded and retained (7 days)

---

## Local Testing

**Backend tests with coverage:**
```bash
cd backend
mvn clean test jacoco:report
# Report: backend/target/site/jacoco/index.html
```

**Frontend tests with coverage:**
```bash
cd frontend
npm run test:coverage
# Report: frontend/coverage/frontend/index.html
```

**E2E tests:**
```bash
cd frontend
npm run test:e2e
# Report: frontend/playwright-report/index.html
```

**SonarCloud (requires SONAR_TOKEN):**
```bash
# Backend
cd backend
mvn sonar:sonar -Dsonar.token=$SONAR_TOKEN

# Frontend
cd frontend
npx sonar-scanner -Dsonar.token=$SONAR_TOKEN
```

---

## Related Documentation

- **Workflow README:** `.github/workflows/README.md`
- **Backend config:** `backend/pom.xml` (lines 32-42, 166-195)
- **Frontend config:** `frontend/sonar-project.properties`
- **Progress tracker:** `PROGRESS_TRACKER.md`
- **SonarCloud Dashboard:** https://sonarcloud.io/project/overview?id=kojder_photo-map-app

---

## Post-MVP Enhancements (Future)

### Deployment Pipeline
- Add deployment step after successful build (master branch only)
- Deploy to Mikrus VPS staging environment
- Add smoke tests after deployment
- Implement rollback mechanism

### Performance Testing
- Add Lighthouse CI for frontend performance metrics
- Track performance trends over time
- Set performance budgets

### Security Scanning
- Add OWASP Dependency Check (Maven + npm)
- Add Snyk security scanning
- Implement container scanning (if Dockerized)

### Advanced SonarCloud Features
- Configure custom quality profiles
- Set up quality gate per branch
- Add custom rules for project-specific patterns
- Integrate notifications (Slack/email)

---

**Last Updated:** 2025-10-28
**Status:** ✅ Feature Complete - Production Ready
