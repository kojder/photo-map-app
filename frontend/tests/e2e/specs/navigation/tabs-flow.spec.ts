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
