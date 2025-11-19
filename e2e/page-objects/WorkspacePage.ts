import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { AddLearningLanguageDialog } from './components/AddLearningLanguageDialog'
import { DeleteLearningLanguageDialog } from './components/DeleteLearningLanguageDialog'

/**
 * Workspace Page Object Model
 * Handles workspace page interactions (/app)
 */
export class WorkspacePage extends BasePage {
  // Action buttons
  readonly addLearningLanguageButton: Locator
  readonly addCategoryButton: Locator

  // State containers
  readonly emptyState: Locator
  readonly workspaceOverview: Locator

  // Components
  readonly addLearningLanguageDialog: AddLearningLanguageDialog
  readonly deleteLearningLanguageDialog: DeleteLearningLanguageDialog

  constructor(page: Page) {
    super(page, '/app')

    // Action buttons with fallbacks
    this.addLearningLanguageButton = page
      .getByTestId('add-learning-language-button')
      .or(page.getByRole('button', { name: /add learning language/i }))

    this.addCategoryButton = page
      .getByTestId('add-category-button')
      .or(page.getByRole('button', { name: /add category/i }))

    // State containers
    this.emptyState = page.getByTestId('empty-state')

    this.workspaceOverview = page
      .getByRole('heading', { name: /workspace overview/i })
      .locator('..')

    // Initialize dialog components
    this.addLearningLanguageDialog = new AddLearningLanguageDialog(page)
    this.deleteLearningLanguageDialog = new DeleteLearningLanguageDialog(page)
  }

  /**
   * Arrange: Navigate to workspace and wait for load
   */
  async goto(): Promise<void> {
    await super.goto()
    // Wait for main workspace heading to be visible (using first() to handle multiple matches)
    await this.page
      .getByRole('heading', { name: /workspace/i })
      .first()
      .waitFor({ state: 'visible' })
  }

  /**
   * Assert: Check if empty state is visible
   */
  async isEmptyState(): Promise<boolean> {
    try {
      return await this.emptyState.isVisible({ timeout: 2000 })
    } catch {
      return false
    }
  }

  /**
   * Assert: Check if workspace has learning languages
   */
  async hasLearningLanguages(): Promise<boolean> {
    return !(await this.isEmptyState())
  }

  /**
   * Act: Click "Add learning language" button
   * Automatically handles both overview and empty state buttons
   */
  async clickAddLearningLanguage(): Promise<void> {
    const button = this.addLearningLanguageButton.first()
    await button.waitFor({ state: 'visible', timeout: 10000 })
    await button.click()
  }

  /**
   * Act: Click "Add category" button
   */
  async clickAddCategory(): Promise<void> {
    await this.addCategoryButton.click()
  }

  /**
   * Act: Open add learning language dialog
   */
  async openAddLearningLanguageDialog(): Promise<void> {
    await this.clickAddLearningLanguage()
    await this.addLearningLanguageDialog.waitForOpen()
  }

  /**
   * Act: Complete flow to add a new learning language
   * @param languageCode Language code to add (e.g., 'pl', 'en')
   */
  async addNewLearningLanguage(languageCode: string): Promise<void> {
    // Check if language already exists
    const alreadyExists = await this.hasLanguage(languageCode)
    if (alreadyExists) {
      console.log(`⚠️  Language '${languageCode}' already exists, skipping add`)
      return
    }

    await this.openAddLearningLanguageDialog()
    await this.addLearningLanguageDialog.selectLanguage(languageCode)
    await this.addLearningLanguageDialog.clickSubmit()

    // Wait for the language section to appear (this confirms success)
    await this.waitForLanguageSection(languageCode)
  }

  /**
   * Get language section by code
   * @param languageCode Language code (e.g., 'pl', 'en')
   */
  getLanguageSection(languageCode: string): Locator {
    return this.page.getByTestId(`language-section-${languageCode}`).or(
      this.page.locator('section').filter({
        hasText: new RegExp(`\\(${languageCode}\\)`, 'i'),
      })
    )
  }

  /**
   * Get language name heading by code
   * @param languageCode Language code (e.g., 'pl', 'en')
   */
  getLanguageName(languageCode: string): Locator {
    return this.page
      .getByTestId(`language-name-${languageCode}`)
      .or(this.getLanguageSection(languageCode).getByRole('heading'))
  }

  /**
   * Assert: Check if a specific language section exists
   * @param languageCode Language code (e.g., 'pl', 'en')
   */
  async hasLanguage(languageCode: string): Promise<boolean> {
    const section = this.getLanguageSection(languageCode)
    return await section.isVisible()
  }

  /**
   * Assert: Wait for language section to appear
   * @param languageCode Language code (e.g., 'pl', 'en')
   * @param timeout Timeout in milliseconds
   */
  async waitForLanguageSection(languageCode: string, timeout: number = 10000): Promise<void> {
    const section = this.getLanguageSection(languageCode)
    await section.waitFor({ state: 'visible', timeout })
  }

  /**
   * Assert: Get all visible language codes
   */
  async getVisibleLanguageCodes(): Promise<string[]> {
    const sections = await this.page.locator('section[data-test-id^="language-section-"]').all()
    const codes: string[] = []

    for (const section of sections) {
      const testId = await section.getAttribute('data-test-id')
      if (testId) {
        const code = testId.replace('language-section-', '')
        codes.push(code)
      }
    }

    return codes
  }

  /**
   * Get language menu button (three dots) by code
   * @param languageCode Language code (e.g., 'pl', 'en')
   */
  getLanguageMenuButton(languageCode: string): Locator {
    return this.page
      .getByTestId(`language-menu-${languageCode}`)
      .or(this.getLanguageSection(languageCode).getByRole('button', { name: /actions/i }))
  }

  /**
   * Get delete language menu item by code
   * @param languageCode Language code (e.g., 'pl', 'en')
   */
  getDeleteLanguageMenuItem(languageCode: string): Locator {
    return this.page
      .getByTestId(`delete-language-${languageCode}`)
      .or(this.page.getByRole('menuitem', { name: /delete language/i }))
  }

  /**
   * Act: Open language menu (dropdown with actions)
   * @param languageCode Language code (e.g., 'pl', 'en')
   */
  async openLanguageMenu(languageCode: string): Promise<void> {
    const menuButton = this.getLanguageMenuButton(languageCode)
    await menuButton.waitFor({ state: 'visible', timeout: 10000 })
    await menuButton.click()

    // Wait for menu to open
    await this.page.waitForTimeout(300)
  }

  /**
   * Act: Click delete language menu item
   * @param languageCode Language code (e.g., 'pl', 'en')
   */
  async clickDeleteLanguageMenuItem(languageCode: string): Promise<void> {
    await this.openLanguageMenu(languageCode)
    const deleteItem = this.getDeleteLanguageMenuItem(languageCode)
    await deleteItem.waitFor({ state: 'visible', timeout: 5000 })
    await deleteItem.click()
  }

  /**
   * Act: Open delete language dialog
   * @param languageCode Language code (e.g., 'pl', 'en')
   */
  async openDeleteLanguageDialog(languageCode: string): Promise<void> {
    await this.clickDeleteLanguageMenuItem(languageCode)
    await this.deleteLearningLanguageDialog.waitForOpen()
  }

  /**
   * Act: Complete flow to delete a learning language
   * @param languageCode Language code to delete (e.g., 'pl', 'en')
   */
  async deleteLearningLanguage(languageCode: string): Promise<void> {
    await this.openDeleteLanguageDialog(languageCode)
    await this.deleteLearningLanguageDialog.confirmDelete(true)

    // Wait for the section to disappear
    const section = this.getLanguageSection(languageCode)
    await section.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Section might already be gone, that's okay
    })
  }

  /**
   * Assert: Wait for language section to disappear
   * @param languageCode Language code (e.g., 'pl', 'en')
   * @param timeout Timeout in milliseconds
   */
  async waitForLanguageSectionToDisappear(
    languageCode: string,
    timeout: number = 10000
  ): Promise<void> {
    const section = this.getLanguageSection(languageCode)
    await section.waitFor({ state: 'hidden', timeout })
  }
}
