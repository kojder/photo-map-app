# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Available Workflows

### `build.yml` - CI: Build, Test & SonarCloud Analysis

**Triggers:**
- Push to `master` branch
- Pull requests (opened, synchronize, reopened)

**What it does:**

1. **Checkout & Setup**
   - Checks out code with full git history (for SonarCloud)
   - Sets up JDK 17 (Zulu distribution)
   - Sets up Node.js 20

2. **Caching**
   - Maven dependencies (`~/.m2`)
   - SonarCloud packages (`~/.sonar/cache`)
   - npm dependencies (`frontend/node_modules`)

3. **Backend Build & Test**
   - Runs `mvn clean install -DskipTests`
   - Runs tests with coverage: `mvn test jacoco:report`
   - Generates JaCoCo coverage report: `backend/target/site/jacoco/jacoco.xml`

4. **Frontend Build & Test**
   - Installs dependencies: `npm ci`
   - Runs tests with coverage: `npm run test:coverage`
   - Generates LCOV coverage report: `frontend/coverage/frontend/lcov.info`

5. **SonarCloud Analysis**
   - **Backend:** Maven SonarQube plugin (`mvn sonar:sonar`)
   - **Frontend:** SonarQube Scan Action (official action from SonarSource)
   - Uploads code quality metrics and coverage to SonarCloud

6. **Artifacts Upload** (retention: 7 days)
   - Backend test reports (`backend/target/surefire-reports/`)
   - Backend coverage reports (`backend/target/site/jacoco/`)
   - Frontend coverage reports (`frontend/coverage/`)

**Required Secrets:**
- `SONAR_TOKEN` - SonarCloud authentication token

**Environment Variables:**
- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - Test database config
- `JWT_SECRET`, `JWT_EXPIRATION` - Test JWT config
- `SECURITY_ENABLED=false` - Disables security for testing

**Actions Used:**
- `actions/checkout@v5` - Code checkout
- `actions/setup-java@v5` - JDK setup
- `actions/setup-node@v6` - Node.js setup
- `actions/cache@v4` - Dependency caching
- `SonarSource/sonarqube-scan-action@v6` - Frontend SonarCloud analysis
- `actions/upload-artifact@v5` - Artifacts upload

**SonarCloud Projects:**
- Backend: `kojder_photo-map-app`
- Frontend: `kojder_photo-map-app-frontend`

## Troubleshooting

### Workflow fails on backend tests
- Check backend test logs in GitHub Actions UI
- Download `backend-test-reports` artifact for detailed error messages
- Verify database configuration in workflow environment variables

### Workflow fails on frontend tests
- Check frontend test logs in GitHub Actions UI
- Download `frontend-coverage-reports` artifact
- Verify ChromeHeadlessCI browser is available in GitHub Actions runner

### SonarCloud analysis fails
- Verify `SONAR_TOKEN` secret is configured in repository settings
- Check SonarCloud project keys match:
  - Backend: `kojder_photo-map-app`
  - Frontend: `kojder_photo-map-app-frontend`
- Ensure coverage reports are generated before SonarCloud step

### Cache not working
- Check cache keys in workflow file
- Verify paths match actual dependency locations
- Cache keys use file hashes (`pom.xml`, `package-lock.json`) for invalidation

## Manual Trigger (Future Enhancement)

To enable manual workflow trigger, add to `on:` section:

```yaml
on:
  workflow_dispatch:  # Enables manual trigger from GitHub UI
```

## Local Testing

**Backend:**
```bash
cd backend
mvn clean test jacoco:report
# Report: target/site/jacoco/index.html
```

**Frontend:**
```bash
cd frontend
npm run test:coverage
# Report: coverage/frontend/index.html
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

## Related Documentation

- Main instructions: `/.github/copilot-instructions.md`
- Backend config: `/backend/pom.xml` (SonarCloud properties + JaCoCo plugin)
- Frontend config: `/frontend/sonar-project.properties`
- Feature spec: `/.ai/features/feature-github-actions-sonarcloud.md`
- Progress tracker: `/PROGRESS_TRACKER.md`

---

**Last Updated:** 2025-10-26
