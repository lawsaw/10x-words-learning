import { Page, Locator } from '@playwright/test';

/**
 * Delete Learning Language Dialog Component
 * Handles interactions with the delete learning language confirmation dialog
 */
export class DeleteLearningLanguageDialog {
  private readonly page: Page;
  
  // Dialog locators
  readonly dialog: Locator;
  readonly titleElement: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Dialog container
    this.dialog = page.getByTestId('delete-learning-language-dialog')
      .or(page.getByRole('dialog'));
    
    this.titleElement = this.dialog.getByRole('heading', { name: /delete learning language/i });
    
    // Action buttons
    this.confirmButton = page.getByTestId('dialog-confirm-delete')
      .or(this.dialog.getByRole('button', { name: /delete language/i }));
    
    this.cancelButton = page.getByTestId('dialog-cancel')
      .or(this.dialog.getByRole('button', { name: /cancel/i }));
    
    this.errorMessage = this.dialog.locator('.text-destructive');
  }

  /**
   * Assert: Check if dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  /**
   * Arrange: Wait for dialog to open
   */
  async waitForOpen(timeout: number = 10000): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout });
  }

  /**
   * Arrange: Wait for dialog to close
   */
  async waitForClose(timeout: number = 10000): Promise<void> {
    await this.dialog.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Act: Click confirm delete button
   */
  async clickConfirm(): Promise<void> {
    await this.confirmButton.click();
  }

  /**
   * Act: Click cancel button
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Act: Complete flow to confirm deletion
   * @param waitForClose Whether to wait for dialog to close
   */
  async confirmDelete(waitForClose: boolean = true): Promise<void> {
    if (waitForClose) {
      await Promise.all([
        this.waitForClose(),
        this.clickConfirm(),
      ]);
    } else {
      await this.clickConfirm();
    }
  }

  /**
   * Assert: Check if error is displayed
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

