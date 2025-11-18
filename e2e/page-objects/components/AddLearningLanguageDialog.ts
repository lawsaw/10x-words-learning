import { Page, Locator } from '@playwright/test';

/**
 * Add Learning Language Dialog Component
 * Handles interactions with the add learning language dialog
 */
export class AddLearningLanguageDialog {
  private readonly page: Page;
  
  // Dialog locators
  readonly dialog: Locator;
  readonly titleElement: Locator;
  readonly languageSelectTrigger: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Dialog container with fallback to role-based selector
    this.dialog = page.getByTestId('add-learning-language-dialog')
      .or(page.getByRole('dialog'));
    
    this.titleElement = this.dialog.getByRole('heading', { name: /add learning language/i });
    
    // Language select using HTML ID (standard form element)
    this.languageSelectTrigger = page.locator('#learning-language-select');
    
    // Action buttons with fallbacks
    this.submitButton = page.getByTestId('dialog-submit')
      .or(this.dialog.getByRole('button', { name: /add language/i }));
    
    this.cancelButton = page.getByTestId('dialog-cancel')
      .or(this.dialog.getByRole('button', { name: /cancel/i }));
    
    this.loadingIndicator = page.getByTestId('dialog-loading');
    this.errorMessage = page.getByTestId('dialog-submit-error');
  }

  /**
   * Get language menu trigger button for a specific language by code
   * @param languageCode Language code (e.g., 'pl', 'en', 'es')
   */
  getLanguageMenuTrigger(languageCode: string): Locator {
    return this.page.getByTestId(`language-menu-${languageCode}`);
  }

  /**
   * Get delete language menu item for a specific language by code
   * @param languageCode Language code (e.g., 'pl', 'en', 'es')
   */
  getDeleteLanguageMenuItem(languageCode: string): Locator {
    return this.page.getByTestId(`delete-language-${languageCode}`);
  }

  /**
   * Get add category menu item for a specific language by code
   * @param languageCode Language code (e.g., 'pl', 'en', 'es')
   */
  getAddCategoryMenuItem(languageCode: string): Locator {
    return this.page.getByTestId(`add-category-${languageCode}`);
  }

  /**
   * Act: Open language menu dropdown for a specific language
   * @param languageCode Language code (e.g., 'pl', 'en', 'es')
   */
  async openLanguageMenu(languageCode: string): Promise<void> {
    await this.getLanguageMenuTrigger(languageCode).click();
    // Wait for menu to be visible
    await this.page.waitForTimeout(200);
  }

  /**
   * Act: Delete a language via the dropdown menu
   * @param languageCode Language code (e.g., 'pl', 'en', 'es')
   */
  async deleteLanguageViaMenu(languageCode: string): Promise<void> {
    await this.openLanguageMenu(languageCode);
    await this.getDeleteLanguageMenuItem(languageCode).click();
  }

  /**
   * Act: Add category to a language via the dropdown menu
   * @param languageCode Language code (e.g., 'pl', 'en', 'es')
   */
  async addCategoryViaMenu(languageCode: string): Promise<void> {
    await this.openLanguageMenu(languageCode);
    await this.getAddCategoryMenuItem(languageCode).click();
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
   * Act: Select a language by code
   * @param languageCode Language code (e.g., 'pl', 'en', 'es')
   */
  async selectLanguage(languageCode: string): Promise<void> {
    // Click the select trigger to open dropdown
    await this.languageSelectTrigger.click();
    
    // Wait for dropdown to open
    await this.page.waitForTimeout(500);
    
    // Select the language option by test-id or text
    const languageOption = this.page.getByTestId(`language-option-${languageCode}`)
      .or(this.page.getByRole('option', { name: new RegExp(languageCode, 'i') }));
    
    await languageOption.click();
  }

  /**
   * Act: Click submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Act: Click cancel button
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Act: Complete flow to add a language
   * @param languageCode Language code to add
   * @param waitForClose Whether to wait for dialog to close
   */
  async addLanguage(languageCode: string, waitForClose: boolean = true): Promise<void> {
    await this.selectLanguage(languageCode);
    await this.clickSubmit();
    
    if (waitForClose) {
      // Wait for dialog to close, but handle if it stays open (e.g., due to error)
      await this.waitForClose().catch(() => {
        // Dialog didn't close - might be an error or duplicate language
        console.log('⚠️  Dialog did not close - check for errors');
      });
    }
  }

  /**
   * Assert: Check if loading indicator is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible();
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
    
    // Dialog container with fallback to role-based selector
    this.dialog = page.getByTestId('delete-learning-language-dialog')
      .or(page.getByRole('dialog').filter({ hasText: /delete learning language/i }));
    
    this.titleElement = this.dialog.getByRole('heading', { name: /delete learning language/i });
    
    // Action buttons with fallbacks
    this.confirmButton = page.getByTestId('dialog-confirm-delete')
      .or(this.dialog.getByRole('button', { name: /delete language/i }));
    
    this.cancelButton = page.getByTestId('dialog-cancel')
      .or(this.dialog.getByRole('button', { name: /cancel/i }));
    
    this.errorMessage = this.dialog.locator('[role="alert"]');
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
   * Act: Click confirm button
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
   * Act: Complete flow to delete a language
   * @param waitForClose Whether to wait for dialog to close
   */
  async deleteLanguage(waitForClose: boolean = true): Promise<void> {
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

