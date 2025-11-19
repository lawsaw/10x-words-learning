import { Page } from '@playwright/test'
import { LoginPage } from '../page-objects'

/**
 * Authenticate test user using credentials from .env.test
 * Uses LoginPage POM for consistent authentication flow
 *
 * Flow:
 * 1. Navigate to /auth/login
 * 2. Fill email and password
 * 3. Click submit button
 * 4. Wait for redirect to /app
 */
export async function authenticateUser(page: Page): Promise<void> {
  const email = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD

  if (!email || !password) {
    throw new Error('E2E_USERNAME and E2E_PASSWORD must be set in .env.test')
  }

  // Use LoginPage POM
  const loginPage = new LoginPage(page)

  // Navigate to login page
  await loginPage.goto()

  // Check if already logged in (would redirect away from login page)
  if (!page.url().includes('/auth/login')) {
    return
  }

  // Perform login
  await loginPage.login(email, password, true)
}
