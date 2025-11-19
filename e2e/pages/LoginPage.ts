import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Login Page Object Model
 * This demonstrates the Page Object Model pattern
 */

export class LoginPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page, '/auth/login')
    this.emailInput = page.getByLabel(/email/i)
    this.passwordInput = page.getByLabel(/password/i)
    this.submitButton = page.getByRole('button', { name: /login|sign in/i })
    this.errorMessage = page.locator('[role="alert"]')
  }

  /**
   * Fill login form
   */
  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  /**
   * Submit login form
   */
  async submit() {
    await this.submitButton.click()
  }

  /**
   * Perform complete login
   */
  async login(email: string, password: string) {
    await this.fillLoginForm(email, password)
    await this.submit()
  }

  /**
   * Check if error message is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.errorMessage.isVisible()
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || ''
  }
}
