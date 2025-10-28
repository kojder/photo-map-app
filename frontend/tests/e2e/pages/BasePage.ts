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
