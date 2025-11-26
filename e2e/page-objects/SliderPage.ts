import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class SliderPage extends BasePage {
  readonly previousButton: Locator
  readonly nextButton: Locator
  readonly shuffleButton: Locator
  readonly resetButton: Locator
  readonly revealButton: Locator
  readonly termText: Locator
  readonly translationText: Locator

  constructor(page: Page) {
    super(page, '/app')

    this.previousButton = page.getByRole('button', { name: 'Previous', exact: true })
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true })
    this.shuffleButton = page.getByRole('button', { name: /shuffle/i })
    this.resetButton = page.getByRole('button', { name: /reset order/i })
    this.revealButton = page.getByRole('button', { name: /reveal/i })

    // In slider card, term is in an h2 usually
    this.termText = page.locator('h2')
    // Translation appears after reveal
    this.translationText = page.getByTestId('slider-card-translation')
  }

  async expectVisible(): Promise<void> {
    await expect(this.termText).toBeVisible()
  }

  async revealCard(): Promise<void> {
    await this.revealButton.click()
  }

  async expectTranslationVisible(translation: string): Promise<void> {
    await expect(this.page.getByText(translation)).toBeVisible()
  }

  async clickNext(): Promise<void> {
    await this.nextButton.click()
  }

  async clickPrevious(): Promise<void> {
    await this.previousButton.click()
  }

  async clickShuffle(): Promise<void> {
    await this.shuffleButton.click()
  }
}
