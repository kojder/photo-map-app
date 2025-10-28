import { test, expect } from '../../fixtures/database.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { MapPage } from '../../pages/MapPage';
import { TEST_USERS } from '../../fixtures/testData';

test.describe('Map - Basic Functionality', () => {
  let loginPage: LoginPage;
  let mapPage: MapPage;

  test.beforeEach(async ({ page, db }) => {
    // Login before each test
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Navigate to map
    mapPage = new MapPage(page);
    await mapPage.goto();
  });

  test('should display map container', async () => {
    // ASSERT: Verify map container is visible
    await expect(mapPage.mapContainer).toBeVisible();
    expect(await mapPage.isMapLoaded()).toBe(true);
  });

  test('should display filter FAB button', async () => {
    // ASSERT: Verify filter FAB is visible
    await expect(mapPage.filterFab).toBeVisible();
  });

  test('should load map successfully', async () => {
    // ACT: Wait for map to load
    await mapPage.waitForMapLoad();

    // ASSERT: Verify map container is present and visible
    await expect(mapPage.mapContainer).toBeVisible();
  });
});
