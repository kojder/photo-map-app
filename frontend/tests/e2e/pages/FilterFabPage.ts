import { Page, Locator, expect } from '@playwright/test';
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
  readonly desktopPanel: Locator;
  readonly mobilePanel: Locator;

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
    this.desktopPanel = page.getByTestId('filter-panel-desktop');
    this.mobilePanel = page.getByTestId('filter-panel-mobile');
  }

  async openFilters() {
    await this.fabButton.click();
    await this.dateFromInput.waitFor({ state: 'visible' });
  }

  async closeFilters() {
    await this.backdrop.click();
  }

  async applyDateFilter(from: string, to: string) {
    await this.fillDateInput(this.dateFromInput, from);
    await this.fillDateInput(this.dateToInput, to);
    await this.applyButton.click();
    await this.waitForPanelToClose();
  }

  /**
   * Helper method to fill date input (flatpickr component).
   * Uses force option to bypass readonly attribute.
   */
  private async fillDateInput(input: Locator, value: string) {
    // Flatpickr uses readonly input, so we need to force the value
    // and then trigger the change event programmatically
    await input.click(); // Open flatpickr calendar
    await this.page.waitForTimeout(100); // Wait for calendar to open
    await input.fill(value, { force: true }); // Force fill despite readonly
    await this.page.keyboard.press('Enter'); // Confirm selection
    await this.page.waitForTimeout(100); // Wait for flatpickr to process
  }

  async applyRatingFilter(minRating: number) {
    await this.ratingSelect.selectOption(minRating.toString());
    await this.applyButton.click();
    await this.waitForPanelToClose();
  }

  async getActiveFilterCount(): Promise<number> {
    const badgeText = await this.badge.textContent();
    return parseInt(badgeText || '0');
  }

  async clearAllFilters() {
    await this.clearButton.click();
  }

  private async waitForPanelToClose() {
    await expect(this.backdrop).toBeHidden();
    await expect(this.desktopPanel).toHaveClass(/translate-x-full/);
    await expect(this.mobilePanel).toHaveClass(/translate-y-full/);
  }
}
