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
