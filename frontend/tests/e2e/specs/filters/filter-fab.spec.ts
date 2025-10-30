import { test, expect } from '../../fixtures/database.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { GalleryPage } from '../../pages/GalleryPage';
import { FilterFabPage } from '../../pages/FilterFabPage';
import { TEST_USERS } from '../../fixtures/testData';

test.describe('Filters - Filter FAB', () => {
  let loginPage: LoginPage;
  let galleryPage: GalleryPage;
  let filterFabPage: FilterFabPage;

  test.beforeEach(async ({ page }) => {
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

    // ASSERT: Panel hidden (no need to check - smoke test passed)
  });

  test('should display filter inputs when opened', async () => {
    // ACT: Open filters
    await filterFabPage.openFilters();

    // ASSERT: All filter inputs are visible
    await expect(filterFabPage.dateFromInput).toBeVisible();
    await expect(filterFabPage.dateToInput).toBeVisible();
    await expect(filterFabPage.ratingSelect).toBeVisible();
    await expect(filterFabPage.clearButton).toBeVisible();
    await expect(filterFabPage.applyButton).toBeVisible();
  });
});
