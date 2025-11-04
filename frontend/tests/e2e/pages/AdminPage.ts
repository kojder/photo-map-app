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
    try {
      await this.usersTable.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async searchUser(email: string) {
    await this.searchInput.fill(email);
    await this.page.waitForTimeout(500); // debounce
  }
}
