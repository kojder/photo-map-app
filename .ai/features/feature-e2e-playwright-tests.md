# Feature: Testy E2E z Playwright

**Status:** 🟡 In Progress
**Priorytet:** High
**Odpowiedzialny:** Development Team
**Data utworzenia:** 2025-10-28
**Ostatnia aktualizacja:** 2025-10-28

---

## 📋 Spis treści

1. [Kontekst i cel](#kontekst-i-cel)
2. [Strategia testowa](#strategia-testowa)
3. [Architektura testów](#architektura-testów)
4. [Setup infrastruktury](#setup-infrastruktury)
5. [Page Object Models](#page-object-models)
6. [Przykłady testów](#przykłady-testów)
7. [Plan implementacji](#plan-implementacji)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Referencje](#referencje)

---

## Kontekst i cel

### Problem
Obecnie Photo Map nie posiada testów end-to-end weryfikujących kluczowe ścieżki użytkownika. Brak automatycznych testów E2E zwiększa ryzyko regresji i utrudnia pewne wdrażanie zmian.

### Cel biznesowy
Wprowadzenie testów E2E z Playwright do weryfikacji podstawowych funkcjonalności aplikacji (smoke tests - happy paths), zapewniających:
- Stabilność kluczowych ścieżek użytkownika (login, galeria, mapa, admin)
- Automatyczną detekcję regresji przed wdrożeniem
- Dokumentację zachowania aplikacji poprzez testy

### Zakres pierwszej iteracji (MVP)

**Phase 1: Setup + Login Test**
- Dedykowana baza testowa PostgreSQL (port 5433)
- Konfiguracja Playwright z auto-start backend + frontend
- Pierwszy test: logowanie admina przez UI

**Phase 2: Smoke Tests**
- Galeria: wyświetlanie, przycisk upload
- Mapa: nawigacja, kontener mapy
- Admin: panel administracyjny, tabela użytkowników
- Filtry: otwarcie FAB, zastosowanie filtru, zamknięcie
- Navigation flow: login → gallery → map → admin → logout

**Poza zakresem MVP:**
- Edge cases (błędne dane, walidacja)
- Performance testing
- Visual regression testing
- Mobile-specific gestures (swipe)
- Testy API (zostają w osobnej kategorii)

---

## Strategia testowa

### Kluczowe decyzje

#### 1. Dedykowana baza testowa
**Wybór:** Osobna instancja PostgreSQL na porcie 5433

**Uzasadnienie:**
- ✅ Pełna izolacja od środowiska development
- ✅ Bezpieczne dla testów równoległych (przyszłość)
- ✅ Możliwość cleanup bez wpływu na dev data
- ✅ Łatwe przełączanie (env variables)

**Implementacja:**
```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:15-alpine
    container_name: photomap-postgres-test
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: photomap_test
      POSTGRES_USER: photomap_test
      POSTGRES_PASSWORD: test123
```

#### 2. Cleanup hybrydowy
**Wybór:** Czyszczenie przed i po testach (beforeEach + teardown)

**Uzasadnienie:**
- ✅ Czysty stan na start każdego testu (beforeEach)
- ✅ Brak śladów po całej sesji (teardown)
- ✅ Maksymalna stabilność testów
- ⚠️ Więcej overhead (akceptowalne dla smoke tests)

**Implementacja:**
```typescript
// fixtures/database.fixture.ts
export const test = base.extend({
  db: async ({}, use) => {
    const client = new Client(testDbConfig);
    await client.connect();

    // BEFORE: Cleanup przed testem
    await client.query('TRUNCATE ratings, photos, users RESTART IDENTITY CASCADE');

    // Seed testowych użytkowników
    await seedTestUsers(client);

    await use(client);

    // AFTER: Cleanup po teście (opcjonalny)
    await client.end();
  },
});
```

#### 3. Logowanie przez UI (na start)
**Wybór:** Proste logowanie przez formularz (bez optymalizacji auth.fixture)

**Uzasadnienie:**
- ✅ Prostsze na start - mniej kodu setup
- ✅ Testuje faktyczny flow użytkownika
- ✅ Łatwiejsze do zrozumienia dla nowych członków zespołu
- 🔄 Refactor na auth.fixture w przyszłości (gdy więcej testów)

**Przyszła optymalizacja:**
```typescript
// fixtures/auth.fixture.ts (future)
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Logowanie przez API (szybsze)
    const response = await page.request.post('/api/auth/login', {
      data: { email: 'admin@example.com', password: 'admin123' }
    });
    const { token } = await response.json();

    // Set token w localStorage
    await page.goto('/gallery');
    await page.evaluate((t) => {
      localStorage.setItem('auth_token', t);
    }, token);

    await use(page);
  },
});
```

#### 4. Smoke tests (happy paths)
**Wybór:** Podstawowe scenariusze bez edge cases

**Uzasadnienie:**
- ✅ Szybka implementacja (5-7 godzin)
- ✅ Pokrywa 80% krytycznych ścieżek
- ✅ Łatwe w utrzymaniu
- 🔄 Rozszerzenie o edge cases w przyszłości

**Przykład smoke test vs comprehensive:**

| Smoke Test | Comprehensive Test |
|------------|-------------------|
| ✅ Login z poprawnymi danymi | ✅ Login z poprawnymi danymi |
| ❌ Login z błędnymi danymi | ✅ Login z błędnymi danymi |
| ❌ Walidacja pustych pól | ✅ Walidacja pustych pól |
| ❌ Rate limiting | ✅ Rate limiting |
| ❌ Session expiry | ✅ Session expiry |

---

## Architektura testów

### Struktura folderów

```
frontend/
├── tests/
│   └── e2e/
│       ├── pages/              # Page Object Models
│       │   ├── BasePage.ts
│       │   ├── LoginPage.ts
│       │   ├── GalleryPage.ts
│       │   ├── MapPage.ts
│       │   ├── AdminPage.ts
│       │   ├── FilterFabPage.ts
│       │   └── NavbarPage.ts
│       ├── specs/              # Testy
│       │   ├── auth/
│       │   │   └── login.spec.ts
│       │   ├── gallery/
│       │   │   └── gallery-basic.spec.ts
│       │   ├── map/
│       │   │   └── map-basic.spec.ts
│       │   ├── admin/
│       │   │   └── admin-basic.spec.ts
│       │   ├── filters/
│       │   │   └── filter-fab.spec.ts
│       │   └── navigation/
│       │       └── tabs-flow.spec.ts
│       ├── fixtures/           # Test fixtures
│       │   ├── database.fixture.ts
│       │   └── testData.ts
│       └── utils/              # Helpers
│           └── db-helpers.ts
├── playwright.config.ts
└── package.json
```

### Konwencje nazewnictwa

**Page Object Models:**
- Format: `{ComponentName}Page.ts`
- Przykłady: `LoginPage.ts`, `GalleryPage.ts`
- Export: `export class LoginPage extends BasePage`

**Testy:**
- Format: `{feature}-{variant}.spec.ts`
- Przykłady: `login.spec.ts`, `gallery-basic.spec.ts`, `tabs-flow.spec.ts`
- Describe block: `test.describe('Feature - Description')`

**Fixtures:**
- Format: `{purpose}.fixture.ts`
- Przykłady: `database.fixture.ts`, `auth.fixture.ts`

**data-testid:**
- Format: `{component}-{element}-{type}`
- Przykłady: `login-email-input`, `gallery-upload-button`, `filter-fab-button`

---

## Setup infrastruktury

### 1. Docker Compose dla bazy testowej

**Plik:** `docker-compose.test.yml`

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15-alpine
    container_name: photomap-postgres-test
    environment:
      POSTGRES_DB: photomap_test
      POSTGRES_USER: photomap_test
      POSTGRES_PASSWORD: test123
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U photomap_test -d photomap_test"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_test_data:
```

**Uruchomienie:**
```bash
# Start bazy testowej
docker-compose -f docker-compose.test.yml up -d

# Zastosowanie migracji
export DB_PORT=5433
export DB_NAME=photomap_test
export DB_USERNAME=photomap_test
export DB_PASSWORD=test123

cd backend
./mvnw flyway:migrate
```

### 2. Konfiguracja Playwright

**Plik:** `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.test
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: false, // Sequential (shared database state)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker (database isolation)
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start backend + frontend
  webServer: [
    {
      command: 'cd ../backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=test',
      port: 8080,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        DB_PORT: '5433',
        DB_NAME: 'photomap_test',
        DB_USERNAME: 'photomap_test',
        DB_PASSWORD: 'test123',
      },
    },
    {
      command: 'npm run start',
      port: 4200,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### 3. Environment variables

**Plik:** `frontend/.env.test`

```bash
# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=photomap_test
DB_USERNAME=photomap_test
DB_PASSWORD=test123

# Test users (seeded via Flyway migration)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=user123
```

**⚠️ WAŻNE:** Dodaj `.env.test` do `.gitignore`!

### 4. Package.json scripts

**Plik:** `frontend/package.json`

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

### 5. Database fixtures (cleanup hybrydowy)

**Plik:** `frontend/tests/e2e/fixtures/database.fixture.ts`

```typescript
import { test as base } from '@playwright/test';
import { Client } from 'pg';

const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'photomap_test',
  user: process.env.DB_USERNAME || 'photomap_test',
  password: process.env.DB_PASSWORD || 'test123',
};

async function seedTestUsers(client: Client) {
  // Admin user (BCrypt hash dla 'admin123')
  await client.query(`
    INSERT INTO users (email, password_hash, role, can_view_photos, can_rate, created_at)
    VALUES
      ('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', true, true, NOW()),
      ('user@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'USER', true, true, NOW())
    ON CONFLICT (email) DO NOTHING
  `);
}

export const test = base.extend({
  db: async ({}, use) => {
    const client = new Client(testDbConfig);
    await client.connect();

    // CLEANUP BEFORE: Czysty stan przed testem
    await client.query('TRUNCATE ratings, photos, users RESTART IDENTITY CASCADE');

    // Seed testowych użytkowników
    await seedTestUsers(client);

    // Użyj klienta w teście
    await use(client);

    // CLEANUP AFTER: Opcjonalne (już jest w beforeEach)
    // await client.query('TRUNCATE ratings, photos, users RESTART IDENTITY CASCADE');

    await client.end();
  },
});

export { expect } from '@playwright/test';
```

**Plik:** `frontend/tests/e2e/fixtures/testData.ts`

```typescript
export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN',
  },
  regularUser: {
    email: 'user@example.com',
    password: 'user123',
    role: 'USER',
  },
};

export const BASE_URL = 'http://localhost:4200';
export const API_BASE_URL = 'http://localhost:8080';
```

---

## Page Object Models

### BasePage (wspólna logika)

**Plik:** `frontend/tests/e2e/pages/BasePage.ts`

```typescript
import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(url: string) {
    await this.page.goto(url);
  }

  async waitForUrl(urlPattern: string | RegExp) {
    await this.page.waitForURL(urlPattern);
  }

  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => localStorage.getItem('auth_token'));
    return token !== null;
  }

  async getAuthToken(): Promise<string | null> {
    return await this.page.evaluate(() => localStorage.getItem('auth_token'));
  }

  async getCurrentUser(): Promise<any | null> {
    const userStr = await this.page.evaluate(() => localStorage.getItem('current_user'));
    return userStr ? JSON.parse(userStr) : null;
  }

  async waitForNavigation(urlPattern: string | RegExp) {
    await this.page.waitForURL(urlPattern);
  }
}
```

### LoginPage

**Plik:** `frontend/tests/e2e/pages/LoginPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.registerLink = page.getByText('Register');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWait(email: string, password: string) {
    await this.login(email, password);
    await this.waitForUrl(/\/gallery/);
  }

  async getErrorMessage(): Promise<string | null> {
    const errorBanner = this.page.locator('.bg-red-50');
    if (await errorBanner.isVisible()) {
      return await errorBanner.textContent();
    }
    return null;
  }
}
```

### GalleryPage

**Plik:** `frontend/tests/e2e/pages/GalleryPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class GalleryPage extends BasePage {
  readonly uploadButton: Locator;
  readonly photoCards: Locator;
  readonly filterFab: Locator;

  constructor(page: Page) {
    super(page);
    this.uploadButton = page.getByTestId('gallery-upload-button');
    this.photoCards = page.getByTestId('gallery-photo-card');
    this.filterFab = page.getByTestId('filter-fab-button');
  }

  async goto() {
    await this.page.goto('/gallery');
  }

  async getPhotoCount(): Promise<number> {
    return await this.photoCards.count();
  }

  async clickPhotoCard(index: number) {
    await this.photoCards.nth(index).click();
  }

  async openUploadDialog() {
    await this.uploadButton.click();
  }

  async openFilters() {
    await this.filterFab.click();
  }

  async hasUploadButton(): Promise<boolean> {
    return await this.uploadButton.isVisible();
  }
}
```

### MapPage

**Plik:** `frontend/tests/e2e/pages/MapPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MapPage extends BasePage {
  readonly mapContainer: Locator;
  readonly filterFab: Locator;

  constructor(page: Page) {
    super(page);
    this.mapContainer = page.locator('#map');
    this.filterFab = page.getByTestId('filter-fab-button');
  }

  async goto() {
    await this.page.goto('/map');
  }

  async isMapLoaded(): Promise<boolean> {
    return await this.mapContainer.isVisible();
  }

  async waitForMapLoad() {
    await this.mapContainer.waitFor({ state: 'visible' });
    // Wait for Leaflet initialization
    await this.page.waitForTimeout(1000);
  }
}
```

### AdminPage

**Plik:** `frontend/tests/e2e/pages/AdminPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  readonly searchInput: Locator;
  readonly usersTable: Locator;
  readonly roleSelect: Locator;
  readonly saveRoleButton: Locator;
  readonly deleteUserButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByTestId('admin-search-input');
    this.usersTable = page.getByTestId('admin-users-table');
    this.roleSelect = page.getByTestId('admin-user-role-select');
    this.saveRoleButton = page.getByTestId('admin-save-role-button');
    this.deleteUserButton = page.getByTestId('admin-delete-user-button');
  }

  async goto() {
    await this.page.goto('/admin');
  }

  async isUsersTableVisible(): Promise<boolean> {
    return await this.usersTable.isVisible();
  }

  async searchUser(email: string) {
    await this.searchInput.fill(email);
    await this.page.waitForTimeout(500); // debounce
  }
}
```

### FilterFabPage

**Plik:** `frontend/tests/e2e/pages/FilterFabPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class FilterFabPage extends BasePage {
  readonly fabButton: Locator;
  readonly badge: Locator;
  readonly backdrop: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly ratingSelect: Locator;
  readonly applyButton: Locator;
  readonly clearButton: Locator;

  constructor(page: Page) {
    super(page);
    this.fabButton = page.getByTestId('filter-fab-button');
    this.badge = page.getByTestId('filter-fab-badge');
    this.backdrop = page.getByTestId('filter-backdrop');
    this.dateFromInput = page.getByTestId('filter-date-from');
    this.dateToInput = page.getByTestId('filter-date-to');
    this.ratingSelect = page.getByTestId('filter-rating');
    this.applyButton = page.getByTestId('filter-apply-button');
    this.clearButton = page.getByTestId('filter-clear-button');
  }

  async openFilters() {
    await this.fabButton.click();
    await this.dateFromInput.waitFor({ state: 'visible' });
  }

  async closeFilters() {
    await this.backdrop.click();
    await this.dateFromInput.waitFor({ state: 'hidden' });
  }

  async applyDateFilter(from: string, to: string) {
    await this.dateFromInput.fill(from);
    await this.dateToInput.fill(to);
    await this.applyButton.click();
  }

  async applyRatingFilter(minRating: number) {
    await this.ratingSelect.selectOption(minRating.toString());
    await this.applyButton.click();
  }

  async getActiveFilterCount(): Promise<number> {
    const badgeText = await this.badge.textContent();
    return parseInt(badgeText || '0');
  }

  async clearAllFilters() {
    await this.clearButton.click();
  }
}
```

### NavbarPage

**Plik:** `frontend/tests/e2e/pages/NavbarPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class NavbarPage extends BasePage {
  readonly galleryLink: Locator;
  readonly mapLink: Locator;
  readonly adminLink: Locator;
  readonly logoutButton: Locator;
  readonly hamburgerButton: Locator;
  readonly mobileMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.galleryLink = page.getByTestId('navbar-gallery-link');
    this.mapLink = page.getByTestId('navbar-map-link');
    this.adminLink = page.getByTestId('navbar-admin-link');
    this.logoutButton = page.getByTestId('navbar-logout-btn');
    this.hamburgerButton = page.getByTestId('navbar-hamburger-btn');
    this.mobileMenu = page.getByTestId('navbar-mobile-menu');
  }

  async goToGallery() {
    await this.galleryLink.click();
    await this.waitForUrl(/\/gallery/);
  }

  async goToMap() {
    await this.mapLink.click();
    await this.waitForUrl(/\/map/);
  }

  async goToAdmin() {
    await this.adminLink.click();
    await this.waitForUrl(/\/admin/);
  }

  async logout() {
    await this.logoutButton.click();
    await this.waitForUrl(/\/login/);
  }

  async isAdminLinkVisible(): Promise<boolean> {
    return await this.adminLink.isVisible();
  }
}
```

---

## Przykłady testów

### Test 1: Login admina (AAA pattern)

**Plik:** `frontend/tests/e2e/specs/auth/login.spec.ts`

```typescript
import { test, expect } from '../../fixtures/database.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { TEST_USERS } from '../../fixtures/testData';

test.describe('Auth - Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page, db }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login successfully as admin and redirect to gallery', async ({ page }) => {
    // ARRANGE: Przygotowanie danych
    const { email, password } = TEST_USERS.admin;

    // ACT: Wykonanie akcji
    await loginPage.login(email, password);

    // ASSERT: Weryfikacja rezultatu
    await expect(page).toHaveURL(/\/gallery/);

    // Verify JWT token in localStorage
    const token = await loginPage.getAuthToken();
    expect(token).not.toBeNull();
    expect(token).toBeTruthy();

    // Verify current user in localStorage
    const user = await loginPage.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user.email).toBe(email);
    expect(user.role).toBe('ADMIN');
  });

  test('should display login form with required fields', async ({ page }) => {
    // ASSERT: Weryfikacja elementów UI
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toHaveText('Login');
  });
});
```

### Test 2: Gallery basic

**Plik:** `frontend/tests/e2e/specs/gallery/gallery-basic.spec.ts`

```typescript
import { test, expect } from '../../fixtures/database.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { GalleryPage } from '../../pages/GalleryPage';
import { TEST_USERS } from '../../fixtures/testData';

test.describe('Gallery - Basic Functionality', () => {
  let loginPage: LoginPage;
  let galleryPage: GalleryPage;

  test.beforeEach(async ({ page, db }) => {
    // Login before each test
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Navigate to gallery
    galleryPage = new GalleryPage(page);
    await galleryPage.goto();
  });

  test('should display gallery page with upload button', async () => {
    // ASSERT: Verify upload button is visible
    await expect(galleryPage.uploadButton).toBeVisible();
    expect(await galleryPage.hasUploadButton()).toBe(true);
  });

  test('should display filter FAB button', async () => {
    // ASSERT: Verify filter FAB is visible
    await expect(galleryPage.filterFab).toBeVisible();
  });

  test('should open upload dialog when clicking upload button', async ({ page }) => {
    // ACT: Click upload button
    await galleryPage.openUploadDialog();

    // ASSERT: Verify dialog is visible
    const uploadDialog = page.getByTestId('upload-dialog');
    await expect(uploadDialog).toBeVisible();
  });
});
```

### Test 3: Navigation flow (tabs)

**Plik:** `frontend/tests/e2e/specs/navigation/tabs-flow.spec.ts`

```typescript
import { test, expect } from '../../fixtures/database.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { GalleryPage } from '../../pages/GalleryPage';
import { MapPage } from '../../pages/MapPage';
import { AdminPage } from '../../pages/AdminPage';
import { NavbarPage } from '../../pages/NavbarPage';
import { TEST_USERS } from '../../fixtures/testData';

test.describe('Navigation - Tabs Flow', () => {
  let loginPage: LoginPage;
  let navbarPage: NavbarPage;
  let galleryPage: GalleryPage;
  let mapPage: MapPage;
  let adminPage: AdminPage;

  test.beforeEach(async ({ page, db }) => {
    // Initialize pages
    loginPage = new LoginPage(page);
    navbarPage = new NavbarPage(page);
    galleryPage = new GalleryPage(page);
    mapPage = new MapPage(page);
    adminPage = new AdminPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('should navigate through all tabs: Gallery → Map → Admin → Logout', async ({ page }) => {
    // STEP 1: Verify starting at Gallery
    await expect(page).toHaveURL(/\/gallery/);
    await expect(galleryPage.uploadButton).toBeVisible();

    // STEP 2: Navigate to Map
    await navbarPage.goToMap();
    await expect(page).toHaveURL(/\/map/);
    await mapPage.waitForMapLoad();
    expect(await mapPage.isMapLoaded()).toBe(true);

    // STEP 3: Navigate to Admin (ADMIN role required)
    await navbarPage.goToAdmin();
    await expect(page).toHaveURL(/\/admin/);
    expect(await adminPage.isUsersTableVisible()).toBe(true);

    // STEP 4: Navigate back to Gallery
    await navbarPage.goToGallery();
    await expect(page).toHaveURL(/\/gallery/);

    // STEP 5: Logout
    await navbarPage.logout();
    await expect(page).toHaveURL(/\/login/);

    // Verify token removed
    const token = await loginPage.getAuthToken();
    expect(token).toBeNull();
  });

  test('should display admin link only for ADMIN role', async ({ page }) => {
    // ASSERT: Admin link visible for admin user
    expect(await navbarPage.isAdminLinkVisible()).toBe(true);
  });
});
```

### Test 4: Filter FAB

**Plik:** `frontend/tests/e2e/specs/filters/filter-fab.spec.ts`

```typescript
import { test, expect } from '../../fixtures/database.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { GalleryPage } from '../../pages/GalleryPage';
import { FilterFabPage } from '../../pages/FilterFabPage';
import { TEST_USERS } from '../../fixtures/testData';

test.describe('Filters - Filter FAB', () => {
  let loginPage: LoginPage;
  let galleryPage: GalleryPage;
  let filterFabPage: FilterFabPage;

  test.beforeEach(async ({ page, db }) => {
    // Login and navigate to gallery
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.admin.email, TEST_USERS.admin.password);

    galleryPage = new GalleryPage(page);
    await galleryPage.goto();

    filterFabPage = new FilterFabPage(page);
  });

  test('should open and close filter panel', async () => {
    // ACT: Open filters
    await filterFabPage.openFilters();

    // ASSERT: Panel visible
    await expect(filterFabPage.dateFromInput).toBeVisible();
    await expect(filterFabPage.backdrop).toBeVisible();

    // ACT: Close filters
    await filterFabPage.closeFilters();

    // ASSERT: Panel hidden
    await expect(filterFabPage.dateFromInput).not.toBeVisible();
  });

  test('should apply date filter and update badge', async () => {
    // ACT: Open filters and apply date range
    await filterFabPage.openFilters();
    await filterFabPage.applyDateFilter('2024-01-01', '2024-12-31');

    // ASSERT: Badge shows active filters
    const filterCount = await filterFabPage.getActiveFilterCount();
    expect(filterCount).toBeGreaterThan(0);
  });

  test('should clear all filters', async () => {
    // ARRANGE: Apply some filters
    await filterFabPage.openFilters();
    await filterFabPage.applyDateFilter('2024-01-01', '2024-12-31');

    // ACT: Clear filters
    await filterFabPage.openFilters();
    await filterFabPage.clearAllFilters();

    // ASSERT: Badge shows 0
    const filterCount = await filterFabPage.getActiveFilterCount();
    expect(filterCount).toBe(0);
  });
});
```

---

## Plan implementacji

### Phase 1: Setup + Login Test (2-3 godziny)

#### Krok 1.1: Instalacja Playwright
```bash
cd frontend
npm install -D @playwright/test @types/node
npm install -D pg @types/pg dotenv
npx playwright install chromium
```

#### Krok 1.2: Setup bazy testowej
- [ ] Utworzenie `docker-compose.test.yml`
- [ ] Uruchomienie: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Zastosowanie migracji Flyway (z env DB_PORT=5433)
- [ ] Weryfikacja: połączenie do bazy na porcie 5433

#### Krok 1.3: Konfiguracja Playwright
- [ ] Utworzenie `playwright.config.ts`
- [ ] Utworzenie `.env.test` z credentials
- [ ] Dodanie `.env.test` do `.gitignore`
- [ ] Dodanie scripts do `package.json`

#### Krok 1.4: Database fixtures
- [ ] Utworzenie `tests/e2e/fixtures/database.fixture.ts`
- [ ] Utworzenie `tests/e2e/fixtures/testData.ts`
- [ ] Implementacja cleanup hybrydowego
- [ ] Seed testowych użytkowników

#### Krok 1.5: Pierwszy POM + test
- [ ] Utworzenie `BasePage.ts`
- [ ] Utworzenie `LoginPage.ts`
- [ ] Utworzenie `specs/auth/login.spec.ts`
- [ ] Uruchomienie: `npm run test:e2e specs/auth/login.spec.ts`

**Acceptance criteria Phase 1:**
- ✅ Baza testowa działa (port 5433)
- ✅ Playwright config załadowany
- ✅ Test logowania przechodzi (green)
- ✅ JWT token zapisany w localStorage
- ✅ Redirect do /gallery działa

---

### Phase 2: Smoke Tests (3-4 godziny)

#### Krok 2.1: Gallery smoke test
- [ ] Utworzenie `GalleryPage.ts`
- [ ] Utworzenie `specs/gallery/gallery-basic.spec.ts`
- [ ] Test: display gallery + upload button

#### Krok 2.2: Map smoke test
- [ ] Utworzenie `MapPage.ts`
- [ ] Utworzenie `specs/map/map-basic.spec.ts`
- [ ] Test: navigate to map + verify container

#### Krok 2.3: Admin smoke test
- [ ] Utworzenie `AdminPage.ts`
- [ ] Utworzenie `specs/admin/admin-basic.spec.ts`
- [ ] Test: navigate to admin + verify users table

#### Krok 2.4: Filter FAB test
- [ ] Utworzenie `FilterFabPage.ts`
- [ ] Utworzenie `specs/filters/filter-fab.spec.ts`
- [ ] Test: open/close filters + apply date filter

#### Krok 2.5: Navigation flow test
- [ ] Utworzenie `NavbarPage.ts`
- [ ] Utworzenie `specs/navigation/tabs-flow.spec.ts`
- [ ] Test: login → gallery → map → admin → logout

**Acceptance criteria Phase 2:**
- ✅ Wszystkie smoke tests przechodzą (green)
- ✅ Navigation flow działa (wszystkie taby)
- ✅ Filter FAB open/close działa
- ✅ Testy są stabilne (3x uruchomienie bez flakiness)

---

## Acceptance Criteria

### Funkcjonalne
- [ ] Test logowania admina przechodzi (JWT w localStorage, redirect do /gallery)
- [ ] Test wyświetlania galerii przechodzi (upload button visible)
- [ ] Test nawigacji do mapy przechodzi (map container visible)
- [ ] Test nawigacji do panelu admin przechodzi (users table visible)
- [ ] Test otwarcia/zamknięcia filtrów przechodzi (FAB panel toggle)
- [ ] Test navigation flow przechodzi (login → gallery → map → admin → logout)

### Niefunkcjonalne
- [ ] Dedykowana baza testowa działa (port 5433, izolowana od dev)
- [ ] Cleanup hybrydowy działa (przed i po testach)
- [ ] Wszystkie testy używają Page Object Models
- [ ] Wszystkie testy używają AAA pattern (Arrange-Act-Assert)
- [ ] Wszystkie testy są stabilne (3x uruchomienie 100% pass rate)
- [ ] Czas wykonania całej suity < 3 minuty
- [ ] Playwright report generowany poprawnie

### Dokumentacja
- [ ] Dokument feature utworzony w `.ai/features/feature-e2e-playwright-tests.md`
- [ ] README w `tests/e2e/README.md` z instrukcjami uruchomienia
- [ ] Komentarze w kodzie POM (JSDoc dla public methods)

---

## Referencje

### Dokumentacja oficjalna
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Page Object Models](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Authentication](https://playwright.dev/docs/auth)

### Notatki ze szkolenia
- Konfiguracja bazy chmurowej (Supabase → PostgreSQL adaptacja)
- Page Object Models pattern
- data-testid selectors
- Teardown / cleanup strategies
- Optymalizacja logowania (auth.fixture - future)

### Wewnętrzne dokumenty projektu
- `.ai/prd.md` - MVP requirements
- `.ai/tech-stack.md` - Technology specs
- `.ai/ui-plan.md` - Frontend architecture
- `.ai/api-plan.md` - REST API specification
- `PROGRESS_TRACKER.md` - Project status

### GitHub Issues / PRs
- (Do uzupełnienia po implementacji)

---

## Historia zmian

| Data | Osoba | Zmiana |
|------|-------|--------|
| 2025-10-28 | Development Team | Utworzenie dokumentu feature |

---

## Pytania i odpowiedzi

**Q: Dlaczego dedykowana baza testowa zamiast współdzielonej?**
A: Pełna izolacja od developmentu, bezpieczne dla testów równoległych (przyszłość), możliwość cleanup bez wpływu na dev data.

**Q: Dlaczego cleanup hybrydowy zamiast tylko teardown?**
A: Czysty stan na start każdego testu (beforeEach) + brak śladów po sesji (teardown) = maksymalna stabilność testów.

**Q: Dlaczego proste logowanie przez UI zamiast auth.fixture?**
A: Prostsze na start, testuje faktyczny flow użytkownika, łatwiejsze dla nowych członków zespołu. Optymalizacja auth.fixture w przyszłości (gdy więcej testów).

**Q: Dlaczego smoke tests zamiast comprehensive?**
A: Szybka implementacja (5-7h), pokrywa 80% krytycznych ścieżek, łatwe w utrzymaniu. Rozszerzenie o edge cases w przyszłości.

**Q: Co jeśli testy będą niestabilne (flaky)?**
A: Analiza trace (playwright show-trace), zwiększenie timeoutów, dodanie explicit wait, weryfikacja cleanup bazy.

---

**Status:** 🟡 In Progress
**Następny krok:** Implementacja Phase 1 (Setup + Login Test)
