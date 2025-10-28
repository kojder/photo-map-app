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
    const { email, password } = TEST_USERS.admin;

    await loginPage.login(email, password);

    await expect(page).toHaveURL(/\/gallery/);

    const token = await loginPage.getAuthToken();
    expect(token).not.toBeNull();
    expect(token).toBeTruthy();

    const user = await loginPage.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user.email).toBe(email);
    expect(user.role).toBe('ADMIN');
  });

  test('should display login form with required fields', async ({ page }) => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toHaveText('Sign in');
  });
});
