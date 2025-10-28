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
