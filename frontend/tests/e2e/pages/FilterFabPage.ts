import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class FilterFabPage extends BasePage {
  readonly fabButton: Locator;
  readonly badge: Locator;
  readonly backdrop: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly ratingSelect: Locator;
  readonly applyButton: Locator;
  readonly clearButton: Locator;

  constructor(page: Page) {
    super(page);
    this.fabButton = page.getByTestId('filter-fab-button');
    this.badge = page.getByTestId('filter-fab-badge');
    this.backdrop = page.getByTestId('filter-backdrop');
    this.dateFromInput = page.getByTestId('filter-date-from');
    this.dateToInput = page.getByTestId('filter-date-to');
    this.ratingSelect = page.getByTestId('filter-rating');
    this.applyButton = page.getByTestId('filter-apply-button');
    this.clearButton = page.getByTestId('filter-clear-button');
  }

  async openFilters() {
    await this.fabButton.click();
    await this.dateFromInput.waitFor({ state: 'visible' });
  }

  async closeFilters() {
    await this.backdrop.click();
    // Wait for animation (300ms transition in CSS)
    await this.page.waitForTimeout(500);
  }

  async applyDateFilter(from: string, to: string) {
    await this.dateFromInput.fill(from);
    await this.dateToInput.fill(to);
    await this.applyButton.click();
  }

  async applyRatingFilter(minRating: number) {
    await this.ratingSelect.selectOption(minRating.toString());
    await this.applyButton.click();
  }

  async getActiveFilterCount(): Promise<number> {
    const badgeText = await this.badge.textContent();
    return parseInt(badgeText || '0');
  }

  async clearAllFilters() {
    await this.clearButton.click();
  }
}
