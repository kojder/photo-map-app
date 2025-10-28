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
