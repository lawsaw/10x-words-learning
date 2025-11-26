import { test, expect } from '@playwright/test'
import { authenticateUser } from './helpers/auth'
import { WorkspacePage, CategoryPage, SliderPage } from './page-objects'

test.describe.configure({ mode: 'serial' })

test.describe('Full Learning Flow E2E', () => {
  let workspacePage: WorkspacePage
  let categoryPage: CategoryPage
  let sliderPage: SliderPage

  const languageCode = 'pl'
  const categoryName = 'E2E Test Category'
  const word1 = {
    term: 'Dzień dobry',
    translation: 'Good morning',
    examples: 'Dzień dobry, jak się masz?',
    difficulty: 'easy' as const,
  }
  const word2 = {
    term: 'Dziękuję',
    translation: 'Thank you',
    examples: 'Dziękuję bardzo.',
    difficulty: 'easy' as const,
  }

  test.beforeEach(async ({ page }) => {
    await authenticateUser(page)
    workspacePage = new WorkspacePage(page)
    categoryPage = new CategoryPage(page)
    sliderPage = new SliderPage(page)
  })

  test('1. Add Polish language', async () => {
    await workspacePage.goto()
    // If language already exists from failed run, delete it first (cleanup)
    if (await workspacePage.hasLanguage(languageCode)) {
      await workspacePage.deleteLearningLanguage(languageCode)
    }

    await workspacePage.addNewLearningLanguage(languageCode)
    await expect(workspacePage.getLanguageSection(languageCode)).toBeVisible()
    await expect(workspacePage.getLanguageName(languageCode)).toContainText('Polish')
    await expect(workspacePage.getLanguageName(languageCode)).toContainText('(pl)')
  })

  test('2. Create category', async ({ page }) => {
    await workspacePage.goto()
    await workspacePage.waitForLanguageSection(languageCode)
    await workspacePage.clickAddCategoryMenuItem(languageCode)
    await workspacePage.fillCreateCategoryForm(categoryName)

    // Verify navigation to category page or category existence
    await expect(page.getByRole('heading', { name: categoryName })).toBeVisible()
  })

  test('3. Manual word addition and editing', async ({ page }) => {
    await workspacePage.goto()
    await workspacePage.clickCategory(categoryName)

    // Add first word
    await categoryPage.clickAddWord()
    await categoryPage.fillWordForm(word1)
    await categoryPage.expectWordVisible(word1.term)

    // Add second word
    await categoryPage.clickAddWord()
    await categoryPage.fillWordForm(word2)
    await categoryPage.expectWordVisible(word2.term)

    // Edit first word
    await categoryPage.clickEditWord(word1.term)
    const updatedTranslation = 'Good day'
    await categoryPage.fillWordForm({ ...word1, translation: updatedTranslation })

    // Verify update
    await expect(page.getByRole('cell', { name: updatedTranslation })).toBeVisible()
  })

  test('4. Slider mode navigation and cleanup', async ({ page }) => {
    await workspacePage.goto()
    await workspacePage.clickCategory(categoryName)
    await categoryPage.goToSliderMode()

    await sliderPage.expectVisible()

    // Test Reveal
    await sliderPage.revealCard()
    // Since order is creation time by default, logic depends on sorting.
    // But we can just check if *some* translation is visible.
    await expect(page.locator('text=Good day').or(page.locator('text=Thank you'))).toBeVisible()

    // Test Navigation (if we have multiple cards)
    // Note: word1 (edited) and word2 are present.
    await sliderPage.clickNext()
    // Should show next card

    await sliderPage.clickPrevious()
    // Should go back

    // Test Shuffle
    await sliderPage.clickShuffle()
    // Verify shuffle button is active or some state change (hard to verify logic without more words, but interaction is key)

    // Cleanup
    await workspacePage.goto()
    await workspacePage.deleteLearningLanguage(languageCode)
    await expect(workspacePage.getLanguageSection(languageCode)).not.toBeVisible()
  })
})
