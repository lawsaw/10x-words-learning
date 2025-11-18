import { test, expect } from '@playwright/test';

/**
 * Example E2E test file
 * This demonstrates basic Playwright functionality
 */

test.describe('Landing Page', () => {
  test('should load the landing page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be loaded
    await expect(page).toHaveTitle(/10x Words Learning/i);
  });

  test('should have visible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if main navigation elements are visible
    await expect(page.locator('header')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click login link
    const loginLink = page.getByRole('link', { name: /login/i });
    await loginLink.click();
    
    // Verify navigation
    await expect(page).toHaveURL(/.*auth\/login/);
  });
});

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check if form elements are present
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should show validation errors on empty form submission', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await submitButton.click();
    
    // Wait for validation messages to appear
    // Note: Adjust selectors based on your actual form implementation
    await page.waitForTimeout(500);
  });
});

