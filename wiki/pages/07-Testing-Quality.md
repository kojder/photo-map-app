# Testing & Quality

> Complete testing guide for Photo Map MVP - local testing, CI/CD pipeline, writing tests, coverage requirements, and code quality standards.

---

## 📖 Table of Contents

- [Local Testing](#local-testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Writing Tests](#writing-tests)
- [Code Quality Standards](#code-quality-standards)

---

## 🧪 Local Testing

### Frontend Unit Tests (Karma + Jasmine)

**Run tests:**

```bash
cd frontend
npm test                    # Watch mode (continuous)
npm run test:coverage       # Coverage report
```

**Features:**
- 199 tests (Jasmine test framework)
- Karma test runner
- Coverage threshold: >50%
- ChromeHeadless browser

**Coverage report location:**
```
frontend/coverage/frontend/index.html
```

**Example test:**
```typescript
describe('PhotoService', () => {
  it('should load photos from API', () => {
    const photos = service.getPhotos();
    expect(photos).toBeDefined();
  });
});
```

---

### Backend Unit Tests (JUnit 5 + Mockito)

**Run tests:**

```bash
cd backend
./mvnw test                   # Run all tests
./mvnw test jacoco:report     # Coverage report
```

**Features:**
- 78 tests (JUnit 5)
- Mockito for mocking
- Spring Boot Test for integration tests
- Coverage threshold: >50%

**Coverage report location:**
```
backend/target/site/jacoco/index.html
```

**Example test:**
```java
@Test
public void testAuthenticationSuccess() {
    AuthResponse response = authService.login("admin@example.com", "password");
    assertNotNull(response.getToken());
}
```

---

### E2E Tests (Playwright)

**Prerequisites:**
- Test database (PostgreSQL port 5433)
- Backend and frontend running (auto-started by Playwright)

**Run tests:**

```bash
cd frontend
npm run test:e2e              # Headless mode
npm run test:e2e:ui           # Playwright UI
npm run test:e2e:debug        # Debug mode
```

**Test specs:**

| Spec | Description | Tests |
|------|-------------|-------|
| `auth.spec.ts` | Login flow, form validation | 2 |
| `admin.spec.ts` | Admin panel, search, user management | 3 |
| `gallery.spec.ts` | Upload button, filter FAB, upload dialog | 3 |
| `map.spec.ts` | Map container, filter FAB, Leaflet loading | 3 |
| `filters.spec.ts` | Open/close panel, inputs, date filling | 3 |
| `navigation.spec.ts` | Full flow, admin link visibility | 2 |

**Total:** 6 specs, 16 test cases

**Test report location:**
```
frontend/playwright-report/index.html
```

**Example test:**
```typescript
test('should display login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('h1')).toHaveText('Login');
});
```

---

### Run All Tests (Single Command)

**One command to run all tests** (frontend unit + backend + E2E):

```bash
./scripts/run-all-tests.sh
```

**Features:**
- ✅ Automatically checks and starts test PostgreSQL (port 5433)
- ✅ Runs sequentially:
  1. Frontend Unit Tests (Karma): `npm run test:coverage`
  2. Backend Tests (Maven): `./mvnw test`
  3. E2E Tests (Playwright): `npm run test:e2e`
- ✅ Stops at first failure
- ✅ Displays detailed summary with results
- ✅ Shows paths to coverage reports
- ✅ Exit code 0 (success) or 1 (failure)

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

**Use cases:**
- Before commit (manually or via pre-commit hook)
- After major code changes
- Verification before pull request
- Local debugging

---

### Pre-push Hook

**Automatic test execution before every push to remote.**

**Installation (one-time):**
```bash
./scripts/install-hooks.sh
```

**How it works:**
1. Every `git push` triggers the hook automatically
2. Hook executes `./scripts/run-all-tests.sh`
3. If any test fails → push is **blocked**
4. If all tests pass → push proceeds

**Why pre-push (not pre-commit)?**
- ✅ Commit is fast (local operation, multiple commits per session)
- ✅ Push is verified by tests (before sending to remote)
- ✅ Less frustration - tests only once before push, not on every commit

**Bypass (emergency only):**
```bash
git push --no-verify
```

⚠️ **Use only for:**
- WIP branches (not main/master!)
- Emergency hotfixes (fix tests in next commit)
- Situations where you're certain tests will pass on CI/CD

**Never bypass for pushes to main/master!**

---

## 🤖 CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/build.yml`

**Name:** CI: Build, Test & SonarCloud Analysis

**Triggers:**
- Push to `master` branch
- Pull requests (opened, synchronize, reopened)

### Workflow Steps

**Job 1: Build, Test & SonarCloud Analysis**

1. **Checkout & Setup**
   - Checks out code with full git history (for SonarCloud)
   - Sets up JDK 17 (Zulu distribution)
   - Sets up Node.js 20

2. **Caching**
   - Maven dependencies (`~/.m2`)
   - SonarCloud packages (`~/.sonar/cache`)
   - npm dependencies (`frontend/node_modules`)
   - Cache keys use file hashes (`pom.xml`, `package-lock.json`)

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
   - **Shared project:** `kojder_photo-map-app` (monorepo approach for MVP)

6. **Artifacts Upload** (retention: 7 days)
   - Backend test reports (`backend/target/surefire-reports/`)
   - Backend coverage reports (`backend/target/site/jacoco/`)
   - Frontend coverage reports (`frontend/coverage/`)

**Actions Used:**
- `actions/checkout@v5` - Code checkout
- `actions/setup-java@v5` - JDK setup
- `actions/setup-node@v6` - Node.js setup
- `actions/cache@v4` - Dependency caching
- `SonarSource/sonarqube-scan-action@v6` - Frontend SonarCloud analysis
- `actions/upload-artifact@v5` - Artifacts upload

**Required Secrets:**
- `SONAR_TOKEN` - SonarCloud authentication token

**Environment Variables:**
- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - Test database config
- `JWT_SECRET`, `JWT_EXPIRATION` - Test JWT config
- `SECURITY_ENABLED=false` - Disables security for testing

### SonarCloud Integration

**Dashboard:** https://sonarcloud.io/project/overview?id=kojder_photo-map-app

**Two Separate Projects:**
- **Backend:** `kojder_photo-map-app-backend` (Java)
- **Frontend:** `kojder_photo-map-app-frontend` (TypeScript)

**Metrics:**
- Code quality (bugs, vulnerabilities, code smells)
- Test coverage (JaCoCo backend, LCOV frontend)
- Quality gate enforcement
- Automatic analysis on every push/PR

**Current Coverage:**
- Backend: >50%
- Frontend: >50%

**Badges:**

**Backend:**
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-backend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-backend)

**Frontend:**
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=kojder_photo-map-app-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=kojder_photo-map-app-frontend)

### Caching Strategy

**Maven dependencies:**
- Cache key: `maven-${{ hashFiles('backend/pom.xml') }}`
- Path: `~/.m2`
- Invalidated when `pom.xml` changes

**npm dependencies:**
- Cache key: `npm-${{ hashFiles('frontend/package-lock.json') }}`
- Path: `frontend/node_modules`
- Invalidated when `package-lock.json` changes

**SonarCloud cache:**
- Cache key: `sonar-cache`
- Path: `~/.sonar/cache`
- Reduces SonarCloud analysis time

**Performance Impact:**
- Without caching: ~8 minutes
- With caching: ~4-5 minutes

---

## ✍️ Writing Tests

### Testing Policy (Approved 2025-10-23)

#### Unit Tests

**When:** Before every commit (TDD-like approach)

**What:** All service methods, utility classes, business logic

**Coverage:** >70% for new code

**Framework:**
- Backend: JUnit 5 + Mockito + Spring Boot Test
- Frontend: Jasmine + Karma

**Pattern:**
1. Implement feature
2. Verify with curl/Postman (backend) or manual test (frontend)
3. Write unit tests (>70% coverage)
4. Run tests: `./mvnw test` (backend) or `ng test` (frontend)
5. All tests passing → commit

#### Integration Tests

**When:** At the end of each phase (before moving to next phase)

**What:** Full flow tests with Spring Context, database, HTTP endpoints

**Framework:**
- Backend: `@SpringBootTest` + MockMvc
- Frontend: Playwright (E2E tests)

**Example:** End of Phase 1 → test all `/api/auth/*` endpoints with real DB

#### Commit Checklist

```
- [ ] Code implementation ready
- [ ] Verification passing (curl/Postman or manual test)
- [ ] Unit tests written (coverage >70%)
- [ ] All tests passing (./mvnw test or ng test)
- [ ] Code review (git diff --cached)
- [ ] Commit message (Conventional Commits)
```

### Frontend Testing Patterns

**Component Test Example:**

```typescript
describe('GalleryComponent', () => {
  let component: GalleryComponent;
  let fixture: ComponentFixture<GalleryComponent>;
  let photoService: PhotoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GalleryComponent],
      providers: [PhotoService, HttpClient]
    });
    fixture = TestBed.createComponent(GalleryComponent);
    component = fixture.componentInstance;
    photoService = TestBed.inject(PhotoService);
  });

  it('should load photos on init', () => {
    const mockPhotos = [{ id: '1', filename: 'photo1.jpg' }];
    spyOn(photoService, 'loadPhotos').and.returnValue(of(mockPhotos));

    component.ngOnInit();

    expect(component.photos().length).toBe(1);
  });
});
```

**Service Test Example:**

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should login and return token', () => {
    const mockResponse = { token: 'jwt-token' };

    service.login('user@example.com', 'password').subscribe(response => {
      expect(response.token).toBe('jwt-token');
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```

### Backend Testing Patterns

**Service Test Example:**

```java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void testLoginSuccess() {
        // Given
        User user = new User();
        user.setEmail("user@example.com");
        user.setPasswordHash("hashed");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "hashed")).thenReturn(true);

        // When
        AuthResponse response = authService.login("user@example.com", "password");

        // Then
        assertNotNull(response.getToken());
    }
}
```

**Integration Test Example:**

```java
@SpringBootTest
@AutoConfigureMockMvc
class PhotoControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void testListPhotos() throws Exception {
        mockMvc.perform(get("/api/photos")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }
}
```

### E2E Testing Patterns

**Page Object Model Example:**

```typescript
// pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
  }

  async getErrorMessage() {
    return await this.page.textContent('[data-testid="error-message"]');
  }
}

// specs/auth.spec.ts
test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('admin@example.com', process.env.ADMIN_PASSWORD);
  await expect(page).toHaveURL('/gallery');
});
```

---

## 🏆 Code Quality Standards

### Coverage Requirements

**Frontend:**
- Minimum: >50% (configurable in `karma.conf.js`)
- Recommended: >70% for new code
- Target: >80% for critical paths (auth, photo upload, rating)

**Backend:**
- Minimum: >50% (configurable in `pom.xml`)
- Recommended: >70% for new code
- Target: >80% for critical paths (auth, photo processing, rating)

### SonarCloud Quality Gate

**Conditions:**
- No new bugs
- No new vulnerabilities
- No new security hotspots
- Coverage on new code: >70%
- Duplicated lines: <3%
- Maintainability rating: A

**Quality Gate Enforcement:**
- Pull requests blocked if quality gate fails
- Must fix issues before merging

### Code Review Checklist

**Before committing:**
- [ ] All tests passing locally
- [ ] Coverage >70% for new code
- [ ] No console.log() or System.out.println() (use logger)
- [ ] No hardcoded credentials or secrets
- [ ] Code follows project conventions
- [ ] Commit message follows Conventional Commits format

**Before pushing:**
- [ ] Pre-push hook passed (all tests)
- [ ] No failing tests
- [ ] No merge conflicts
- [ ] Branch up-to-date with master

**Before merging PR:**
- [ ] GitHub Actions CI passing
- [ ] SonarCloud quality gate passing
- [ ] Code reviewed by at least one person
- [ ] All comments addressed

---

## 🔗 Related Pages

**Testing:**
- [Development Setup](Development-Setup) - Environment configuration
- [Scripts Reference](Scripts-Reference) - Test scripts documentation
- [Contributing](Contributing) - Git workflow and PR process

**CI/CD:**
- [Deployment](Deployment) - Production deployment process
- [Architecture](Architecture) - System architecture overview

**External Resources:**
- [Karma Documentation](https://karma-runner.github.io/)
- [Jasmine Documentation](https://jasmine.github.io/)
- [JUnit 5 Documentation](https://junit.org/junit5/)
- [Playwright Documentation](https://playwright.dev/)
- [SonarCloud Documentation](https://docs.sonarcloud.io/)

---

**Last Updated:** 2025-11-10

**Sources:**
- `README.md` (Testing section)
- `CLAUDE.md` (Testing & Quality Standards)
- `.github/workflows/README.md` (CI/CD Pipeline)
- `scripts/README.md` (Test scripts)
