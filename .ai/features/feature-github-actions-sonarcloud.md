# GitHub Actions CI/CD with SonarCloud Integration

**Feature Type:** DevOps - Continuous Integration & Code Quality
**Estimated Time:** 3-4 hours
**Priority:** High (before deployment)
**Created:** 2025-10-26

---

## Overview

Automated CI/CD pipeline using GitHub Actions with SonarCloud integration for code quality analysis of both Spring Boot backend and Angular frontend.

**Benefits:**
- ✅ Automated testing on every push/PR
- ✅ Code quality metrics (bugs, vulnerabilities, code smells)
- ✅ Test coverage tracking
- ✅ Early detection of issues before deployment
- ✅ Quality gate enforcement (prevent merging bad code)

---

## Prerequisites (Already Configured)

- ✅ GitHub repository: `kojder/photo-map-app`
- ✅ SonarCloud organization: `kojder`
- ✅ SonarCloud project created and connected to GitHub
- ✅ `SONAR_TOKEN` secret configured in GitHub repository settings

---

## Implementation Plan

### Phase 1: Project Structure & Configuration (45-60 min)

**1.1 Backend SonarCloud Configuration**
- Create `backend/pom.xml` SonarCloud properties section
- Configure project key: `kojder_photo-map-app`
- Configure organization: `kojder`
- Configure source directories: `src/main/java`
- Configure test directories: `src/test/java`
- Configure coverage report path: `target/site/jacoco/jacoco.xml`
- Configure exclusions (if needed): generated code, DTOs, configs

**1.2 Frontend SonarCloud Configuration**
- Create `frontend/sonar-project.properties` file
- Configure project key: `kojder_photo-map-app-frontend`
- Configure organization: `kojder`
- Configure source directories: `src`
- Configure test directories: `src` (with test exclusions)
- Configure coverage report path: `coverage/frontend/lcov.info`
- Configure TypeScript settings
- Configure exclusions: `node_modules`, `dist`, `coverage`, test files

**1.3 Root-level Configuration**
- Create `.sonarcloud.properties` (optional, for multi-module)
- Document SonarCloud setup in `README.md`

### Phase 2: GitHub Actions Workflow (60-75 min)

**2.1 Workflow File Structure**
- Create `.github/workflows/build.yml`
- Define workflow name: "CI: Build, Test & SonarCloud Analysis"
- Configure triggers: push to `master`, pull requests (opened, synchronize, reopened)
- Define single job: "build" (runs on ubuntu-latest)

**2.2 Checkout & Setup Steps**
- Checkout code with full git history (`fetch-depth: 0` for SonarCloud)
- Setup JDK 17 (Zulu distribution)
- Setup Node.js 20
- Configure Maven dependency caching (`~/.m2`)
- Configure SonarCloud cache (`~/.sonar/cache`)
- Configure npm dependency caching (`frontend/node_modules`)

**2.3 Backend Build & Test**
- Run Maven clean install
- Run backend tests with coverage: `mvn test jacoco:report`
- Verify test results
- Upload test reports as GitHub Actions artifacts

**2.4 Frontend Build & Test**
- Install npm dependencies: `cd frontend && npm ci`
- Run Angular tests with coverage: `npm run test -- --watch=false --browsers=ChromeHeadless --code-coverage`
- Verify test results
- Upload coverage reports as GitHub Actions artifacts

**2.5 SonarCloud Analysis - Backend**
- Run Maven SonarCloud plugin
- Command: `mvn sonar:sonar -Dsonar.projectKey=kojder_photo-map-app`
- Use `SONAR_TOKEN` from GitHub secrets
- Wait for analysis completion

**2.6 SonarCloud Analysis - Frontend**
- Run sonar-scanner for TypeScript/JavaScript
- Use `sonar-project.properties` configuration
- Use `SONAR_TOKEN` from GitHub secrets
- Wait for analysis completion

**2.7 Quality Gate Check**
- Add SonarCloud Quality Gate check (automatic via SonarCloud app)
- Fail workflow if quality gate fails
- Display quality gate status in PR

### Phase 3: Maven Jacoco Plugin Configuration (30-45 min)

**3.1 Add Jacoco Plugin to pom.xml**
- Add `jacoco-maven-plugin` dependency
- Configure execution: prepare-agent (before tests)
- Configure execution: report (after tests)
- Configure coverage output: `target/site/jacoco/jacoco.xml`

**3.2 Configure Coverage Rules (optional)**
- Set minimum coverage thresholds
- Configure exclusions: DTOs, configs, entities (if needed)

**3.3 Verify Coverage Locally**
- Run: `mvn clean test jacoco:report`
- Check report: `backend/target/site/jacoco/index.html`
- Verify XML report exists: `backend/target/site/jacoco/jacoco.xml`

### Phase 4: Angular Karma Coverage Configuration (30-45 min)

**4.1 Update karma.conf.js**
- Enable coverage reporter
- Configure coverage output: `coverage/frontend/lcov.info`
- Configure coverage formats: `html`, `lcovonly`, `text-summary`

**4.2 Update angular.json**
- Add `codeCoverage: true` option to test configuration
- Configure coverage directory: `coverage/frontend`

**4.3 Update package.json Scripts**
- Update test script to support coverage flag
- Add dedicated coverage script: `"test:coverage": "ng test --code-coverage --watch=false --browsers=ChromeHeadless"`

**4.4 Verify Coverage Locally**
- Run: `npm run test:coverage`
- Check report: `frontend/coverage/frontend/index.html`
- Verify lcov.info exists: `frontend/coverage/frontend/lcov.info`

### Phase 5: SonarCloud Quality Profile & Rules (15-30 min)

**5.1 Configure Java Quality Profile**
- Review default Sonar way profile
- Enable/disable rules based on project needs
- Configure severity levels
- Save as custom profile (optional)

**5.2 Configure TypeScript/JavaScript Quality Profile**
- Review default Sonar way profile
- Enable Angular-specific rules
- Configure severity levels
- Save as custom profile (optional)

**5.3 Configure Quality Gate**
- Set coverage thresholds (e.g., >70% for new code)
- Set bug/vulnerability thresholds (0 for new code)
- Set code smell thresholds
- Set duplication thresholds

### Phase 6: Testing & Validation (30-45 min)

**6.1 Local Testing**
- Run backend tests: `mvn clean test jacoco:report`
- Run frontend tests: `npm run test:coverage`
- Verify coverage reports generated
- Check for test failures

**6.2 GitHub Actions Dry Run**
- Push to feature branch
- Verify workflow triggers
- Check all steps execute successfully
- Verify artifacts uploaded

**6.3 SonarCloud Validation**
- Check backend analysis results in SonarCloud dashboard
- Check frontend analysis results in SonarCloud dashboard
- Verify coverage metrics displayed
- Check quality gate status

**6.4 Pull Request Integration**
- Create test PR
- Verify workflow runs on PR
- Check SonarCloud PR decoration (comments on PR)
- Verify quality gate status in PR checks

### Phase 7: Documentation & Cleanup (15-30 min)

**7.1 Update README.md**
- Add CI/CD badges (build status, quality gate, coverage)
- Document workflow triggers
- Document SonarCloud integration
- Add links to SonarCloud dashboard

**7.2 Update PROGRESS_TRACKER.md**
- Mark GitHub Actions feature as completed
- Document configuration details
- Add next steps (if any)

**7.3 Create .github/workflows/README.md**
- Document workflow purpose
- Document manual trigger instructions (if added)
- Document secrets required
- Document troubleshooting steps

**7.4 Git Ignore Updates**
- Verify `.gitignore` excludes coverage reports
- Verify `.gitignore` excludes SonarCloud cache
- Add any missing patterns

---

## Configuration Files Breakdown

### Backend: pom.xml additions

**SonarCloud Properties Section:**
- `sonar.projectKey` - unique project identifier
- `sonar.organization` - SonarCloud organization
- `sonar.host.url` - SonarCloud URL
- `sonar.java.source` - Java version
- `sonar.coverage.jacoco.xmlReportPaths` - coverage report path

**Jacoco Plugin Section:**
- `jacoco-maven-plugin` version
- Execution: prepare-agent (phase: initialize)
- Execution: report (phase: test)
- Output directory: `target/site/jacoco`

### Frontend: sonar-project.properties

**Core Properties:**
- `sonar.projectKey=kojder_photo-map-app-frontend`
- `sonar.organization=kojder`
- `sonar.sources=src`
- `sonar.tests=src`
- `sonar.test.inclusions=**/*.spec.ts`
- `sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.spec.ts`
- `sonar.typescript.lcov.reportPaths=coverage/frontend/lcov.info`
- `sonar.host.url=https://sonarcloud.io`

### GitHub Actions: .github/workflows/build.yml

**Workflow Structure:**
- Name: "CI: Build, Test & SonarCloud Analysis"
- Triggers: push (master), pull_request (opened, synchronize, reopened)
- Job: build (ubuntu-latest)
- Steps: checkout, setup, cache, build, test, analyze

**Key Steps:**
1. Checkout with `fetch-depth: 0`
2. Setup JDK 17 (Zulu)
3. Setup Node.js 20
4. Cache Maven, npm, SonarCloud
5. Backend: `mvn clean install`
6. Backend: `mvn test jacoco:report`
7. Frontend: `npm ci`
8. Frontend: `npm run test:coverage`
9. Backend SonarCloud: `mvn sonar:sonar`
10. Frontend SonarCloud: `npx sonar-scanner`

---

## Potential Issues & Solutions

### Issue 1: Coverage not uploaded to SonarCloud
**Solution:** Verify report paths in `pom.xml` and `sonar-project.properties` match actual output

### Issue 2: Frontend tests fail in CI (work locally)
**Solution:** Add `ChromeHeadless` custom launcher in `karma.conf.js` with `--no-sandbox` flag

### Issue 3: SonarCloud token authentication fails
**Solution:** Verify `SONAR_TOKEN` secret is set in GitHub repository settings (not organization)

### Issue 4: Quality gate fails unexpectedly
**Solution:** Review SonarCloud dashboard for specific issues, adjust thresholds if too strict

### Issue 5: Workflow slow (>10 minutes)
**Solution:** Optimize caching (Maven, npm, SonarCloud), consider matrix builds for parallel execution

### Issue 6: Duplicate analysis (backend + frontend)
**Solution:** Current approach is correct - separate analysis for each layer with different tools/rules

---

## Success Criteria

- ✅ GitHub Actions workflow runs successfully on push to master
- ✅ GitHub Actions workflow runs successfully on pull requests
- ✅ Backend tests execute with >70% coverage
- ✅ Frontend tests execute with >70% coverage
- ✅ SonarCloud analysis completes for backend (Java)
- ✅ SonarCloud analysis completes for frontend (TypeScript/JavaScript)
- ✅ Quality gate passes (or fails with clear issues)
- ✅ Coverage reports visible in SonarCloud dashboard
- ✅ PR decoration shows SonarCloud results
- ✅ CI badges display in README.md

---

## Future Enhancements (Post-MVP)

### Deployment Pipeline
- Add deployment step after successful build (master branch only)
- Deploy to staging environment (Mikrus VPS)
- Add smoke tests after deployment
- Add rollback mechanism

### Performance Testing
- Add Lighthouse CI for frontend performance
- Add backend performance tests (load testing)
- Track performance metrics over time

### Security Scanning
- Add OWASP Dependency Check (Maven + npm)
- Add Snyk security scanning
- Add Trivy container scanning (if Dockerized)

### Advanced SonarCloud Features
- Configure PR decoration rules
- Set up quality profiles per branch
- Add custom rules for project-specific patterns
- Integrate with Slack/email notifications

---

**Document Purpose:** Implementation plan for GitHub Actions CI/CD with SonarCloud
**Related Files:**
- `.github/workflows/build.yml` (to be created)
- `backend/pom.xml` (to be updated)
- `frontend/sonar-project.properties` (to be created)
- `README.md` (to be updated with badges)

**Last Updated:** 2025-10-26
