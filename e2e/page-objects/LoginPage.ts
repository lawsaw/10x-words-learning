import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 * Handles login page interactions
 */
export class LoginPage extends BasePage {
  // Locators using HTML IDs and data-testid
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, '/auth/login');
    
    // Using HTML IDs for form inputs (standard approach)
    this.emailInput = page.locator('#login-email');
    this.passwordInput = page.locator('#login-password');
    
    // Using data-testid for buttons (with role-based fallback)
    this.submitButton = page.getByTestId('login-submit')
      .or(page.getByRole('button', { name: /log in/i }));
    
    this.errorMessage = page.locator('.text-destructive');
  }

  /**
   * Arrange: Navigate to login page and wait for it to load
   */
  async goto(): Promise<void> {
    await super.goto();
    // Wait for the form to be visible
    await this.emailInput.waitFor({ state: 'visible' });
  }

  /**
   * Act: Fill in email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Act: Fill in password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Act: Click submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Act: Complete login flow with credentials
   * @param email User email
   * @param password User password
   * @param waitForRedirect Whether to wait for redirect to /app (default: true)
   */
  async login(email: string, password: string, waitForRedirect: boolean = true): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    
    if (waitForRedirect) {
      await Promise.all([
        this.page.waitForURL('/app', { timeout: 15000 }),
        this.clickSubmit(),
      ]);
    } else {
      await this.clickSubmit();
    }
  }

  /**
   * Assert: Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Assert: Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
}

