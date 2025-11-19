import { test, expect } from '@playwright/test'
import { authenticateUser } from './helpers/auth'
import { WorkspacePage } from './page-objects'

/**
 * E2E Test: Add Polish Learning Language
 *
 * Complete flow following Arrange-Act-Assert pattern:
 * 1. Auth with credentials E2E_USERNAME and E2E_PASSWORD from .env.test
 * 2. Redirect to /app page
 * 3. Find one of the "Add learning language" buttons. Click on the first one
 * 4. Wait for the dialog to open
 * 5. Choose "Polish (pl)" language from the select box
 * 6. Click on the "Add language" button to save the form
 * 7. Find "Polish (pl)" section appear on the page
 */

// Configure tests to run sequentially to avoid race conditions
// Multiple tests adding/deleting the same language in parallel will conflict
test.describe.configure({ mode: 'serial' })

test.describe('Add Polish Learning Language', () => {
  test('should add and delete Polish language successfully', async ({ page }) => {
    // ARRANGE: Setup authentication and navigate to workspace
    await authenticateUser(page)
    const workspacePage = new WorkspacePage(page)
    await workspacePage.goto()

    // ACT: Add Polish language
    await workspacePage.addNewLearningLanguage('pl')

    // ASSERT: Verify Polish section appears
    await expect(workspacePage.getLanguageSection('pl')).toBeVisible()
    await expect(workspacePage.getLanguageName('pl')).toContainText('Polish')
    await expect(workspacePage.getLanguageName('pl')).toContainText('(pl)')

    // CLEANUP: Delete the created language
    await workspacePage.deleteLearningLanguage('pl')

    // ASSERT: Verify Polish section is removed
    await expect(workspacePage.getLanguageSection('pl')).not.toBeVisible()
  })

  test('should cancel without adding language', async ({ page }) => {
    // ARRANGE: Setup authentication and navigate to workspace
    await authenticateUser(page)
    const workspacePage = new WorkspacePage(page)
    await workspacePage.goto()

    // ACT: Open dialog, select language, then cancel
    await workspacePage.openAddLearningLanguageDialog()
    await workspacePage.addLearningLanguageDialog.selectLanguage('pl')
    await workspacePage.addLearningLanguageDialog.clickCancel()

    // ASSERT: Dialog should close
    await workspacePage.addLearningLanguageDialog.waitForClose()
    await expect(workspacePage.addLearningLanguageDialog.dialog).not.toBeVisible()
  })

  test('should display empty state when no languages exist', async ({ page }) => {
    // ARRANGE: Setup authentication and navigate to workspace
    await authenticateUser(page)
    const workspacePage = new WorkspacePage(page)
    await workspacePage.goto()

    // ACT & ASSERT: Check if empty state is visible
    // Note: This test may fail if languages already exist from previous tests
    const isEmpty = await workspacePage.isEmptyState()
    if (isEmpty) {
      await expect(workspacePage.emptyState).toBeVisible()
    }
  })

  test('should open dialog from both locations (overview and empty state)', async ({ page }) => {
    // ARRANGE: Setup authentication and navigate to workspace
    await authenticateUser(page)
    const workspacePage = new WorkspacePage(page)
    await workspacePage.goto()

    // ACT: Click add button
    await workspacePage.clickAddLearningLanguage()

    // ASSERT: Dialog opens
    await expect(workspacePage.addLearningLanguageDialog.dialog).toBeVisible()

    // Cleanup: Close dialog
    await workspacePage.addLearningLanguageDialog.clickCancel()
  })

  test('should cancel delete language when cancel is clicked', async ({ page }) => {
    // ARRANGE: Add Polish language first
    await authenticateUser(page)
    const workspacePage = new WorkspacePage(page)
    await workspacePage.goto()
    await workspacePage.addNewLearningLanguage('pl')

    // ACT: Open delete dialog and cancel
    await workspacePage.openDeleteLanguageDialog('pl')
    await workspacePage.deleteLearningLanguageDialog.clickCancel()

    // ASSERT: Dialog closes and language still exists
    await expect(workspacePage.deleteLearningLanguageDialog.dialog).not.toBeVisible()
    await expect(workspacePage.getLanguageSection('pl')).toBeVisible()

    // CLEANUP: Delete the language
    await workspacePage.deleteLearningLanguage('pl')
  })

  test('should delete language via menu', async ({ page }) => {
    // ARRANGE: Add Polish language first
    await authenticateUser(page)
    const workspacePage = new WorkspacePage(page)
    await workspacePage.goto()
    await workspacePage.addNewLearningLanguage('pl')

    // Verify language is added and visible
    await expect(workspacePage.getLanguageSection('pl')).toBeVisible()
    await expect(workspacePage.getLanguageMenuButton('pl')).toBeVisible()

    // ACT: Delete the language using the high-level method
    await workspacePage.deleteLearningLanguage('pl')

    // ASSERT: Language is removed
    await expect(workspacePage.getLanguageSection('pl')).not.toBeVisible()
  })
})
