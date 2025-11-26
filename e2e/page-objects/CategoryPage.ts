import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class CategoryPage extends BasePage {
  readonly addWordButton: Locator
  readonly wordTable: Locator
  readonly wordFormDialog: Locator
  readonly sliderModeLink: Locator

  constructor(page: Page) {
    super(page, '/app') // Dynamic path, base is not enough

    this.addWordButton = page.getByRole('button', { name: /add word/i })
    this.wordTable = page.locator('table')
    this.wordFormDialog = page.getByRole('dialog')
    this.sliderModeLink = page.getByRole('link', { name: /slider mode/i })
  }

  /**
   * Click "Add word" button
   */
  async clickAddWord(): Promise<void> {
    await this.addWordButton.click()
  }

  /**
   * Fill and submit word form
   */
  async fillWordForm(word: {
    term: string
    translation: string
    transcription?: string
    examples?: string
    difficulty?: 'easy' | 'medium' | 'advanced'
  }): Promise<void> {
    await this.page.fill('#word-term', word.term)
    await this.page.fill('#word-translation', word.translation)
    if (word.transcription) {
      await this.page.fill('#word-transcription', word.transcription)
    }
    if (word.examples) {
      await this.page.fill('#word-examples', word.examples)
    }
    // Difficulty is a select, usually hard to interact with by ID if it's shadcn Select
    // shadcn select uses a trigger button.
    // The ID 'word-difficulty' is on the SelectTrigger probably.
    if (word.difficulty) {
      // Open select
      await this.page.locator('#word-difficulty').click()
      // Select option
      const difficultyLabel = word.difficulty.charAt(0).toUpperCase() + word.difficulty.slice(1)
      await this.page.getByRole('option', { name: difficultyLabel }).click()
    }

    await this.page.getByRole('button', { name: 'Save' }).click()
  }

  /**
   * Verify word exists in table
   */
  async expectWordVisible(term: string): Promise<void> {
    await expect(this.page.getByRole('cell', { name: term, exact: true })).toBeVisible()
  }

  /**
   * Open edit dialog for a word
   */
  async clickEditWord(term: string): Promise<void> {
    // Find the row containing the term
    const row = this.page.locator('tr', { hasText: term })
    // Click the actions menu button (MoreHorizontal)
    await row.getByRole('button', { name: /open word actions/i }).click()
    // Click Edit in the portal menu
    await this.page.getByRole('menuitem', { name: /edit/i }).click()
  }

  /**
   * Verify word does not exist in table
   */
  async expectWordNotVisible(term: string): Promise<void> {
    await expect(this.page.getByRole('cell', { name: term, exact: true })).not.toBeVisible()
  }

  /**
   * Go to Slider Mode
   */
  async goToSliderMode(): Promise<void> {
    await this.page.getByRole('link', { name: /slider/i }).click()
    // Add wait for URL to change or slider element to verify transition
    await this.page.waitForURL(/\/study$/)
  }
}
