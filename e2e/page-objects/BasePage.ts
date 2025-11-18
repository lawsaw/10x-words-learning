import { Page } from '@playwright/test';

/**
 * Base Page Object Model
 * Provides common functionality for all page objects
 */
export class BasePage {
  protected readonly page: Page;
  protected readonly path: string;

  constructor(page: Page, path: string = '/') {
    this.page = page;
    this.path = path;
  }

  /**
   * Navigate to the page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }
}

