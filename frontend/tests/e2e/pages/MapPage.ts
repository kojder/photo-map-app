import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MapPage extends BasePage {
  readonly mapContainer: Locator;
  readonly filterFab: Locator;

  constructor(page: Page) {
    super(page);
    this.mapContainer = page.locator('#map');
    this.filterFab = page.getByTestId('filter-fab-button');
  }

  async goto() {
    await this.page.goto('/map');
  }

  async isMapLoaded(): Promise<boolean> {
    return await this.mapContainer.isVisible();
  }

  async waitForMapLoad() {
    await this.mapContainer.waitFor({ state: 'visible' });
    // Wait for Leaflet initialization
    await this.page.waitForTimeout(1000);
  }
}
