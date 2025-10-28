import { test, expect } from '../../fixtures/database.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { AdminPage } from '../../pages/AdminPage';
import { TEST_USERS } from '../../fixtures/testData';

test.describe('Admin - Basic Functionality', () => {
  let loginPage: LoginPage;
  let adminPage: AdminPage;

  test.beforeEach(async ({ page, db }) => {
    // Login as admin before each test
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Navigate to admin
    adminPage = new AdminPage(page);
    await adminPage.goto();
  });

  test('should display admin panel with users table', async () => {
    // ASSERT: Verify users table is visible
    await expect(adminPage.usersTable).toBeVisible();
    expect(await adminPage.isUsersTableVisible()).toBe(true);
  });

  test('should display search input', async () => {
    // ASSERT: Verify search input is visible
    await expect(adminPage.searchInput).toBeVisible();
  });

  test('should allow searching users', async () => {
    // ACT: Search for admin user
    await adminPage.searchUser(TEST_USERS.admin.email);

    // ASSERT: Table still visible (results might be filtered)
    await expect(adminPage.usersTable).toBeVisible();
  });
});
