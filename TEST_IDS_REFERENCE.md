# Test IDs Reference

This document lists all `data-test-id` attributes for E2E testing.

## Login Page

### Login Form (`components/public/login-form.tsx`)

**HTML IDs (use with `page.locator('#id')`):**
- `#login-email` - Email input field
- `#login-password` - Password input field

**Test IDs (use with `page.getByTestId('id')`):**
- `login-submit` - Login submit button

**Example:**
```typescript
await page.locator('#login-email').fill('test@test.test');
await page.locator('#login-password').fill('123456');
await page.getByTestId('login-submit').click();
```

## Workspace Page (`/app`)

### Action Buttons (`app/(app)/app/workspace-client.tsx`)

- `add-learning-language-button` - "Add learning language" button
  - **Note:** Appears in TWO places:
    1. In the overview card (always visible)
    2. In the empty state (visible when no languages exist)
  - **Usage:** Use `.first()` to click the first available one

- `add-category-button` - "Add category" button
- `empty-state` - Empty state container

**Example:**
```typescript
// Click first "Add learning language" button
await page.getByTestId('add-learning-language-button').first().click();
```

### Language Sections

- `language-section-{code}` - Language section container
  - Example: `language-section-pl` for Polish
  - Example: `language-section-en` for English

- `language-name-{code}` - Language name/title
  - Example: `language-name-pl` for Polish

**Example:**
```typescript
// Check if Polish section exists
await expect(page.getByTestId('language-section-pl')).toBeVisible();
await expect(page.getByTestId('language-name-pl')).toContainText('Polish');
```

## Add Learning Language Dialog

### Dialog Container
- `add-learning-language-dialog` - Main dialog container

### Form Elements
- `language-select-trigger` - Select dropdown trigger button
- `language-option-{code}` - Individual language option in dropdown
  - Example: `language-option-pl` for Polish
  - Example: `language-option-en` for English
  - Example: `language-option-es` for Spanish

### Action Buttons
- `dialog-submit` - Submit button ("Add language")
- `dialog-cancel` - Cancel button

**Example:**
```typescript
// Open dialog
await page.getByTestId('add-learning-language-button').first().click();
await page.getByTestId('add-learning-language-dialog').waitFor({ state: 'visible' });

// Select Polish
await page.getByTestId('language-select-trigger').click();
await page.getByTestId('language-option-pl').click();

// Submit
await page.getByTestId('dialog-submit').click();
```

## Complete E2E Flow Example

```typescript
import { test, expect } from '@playwright/test';

test('Add Polish language', async ({ page }) => {
  // 1. Login
  await page.goto('/auth/login');
  await page.locator('#login-email').fill('test@test.test');
  await page.locator('#login-password').fill('123456');
  await page.getByTestId('login-submit').click();
  
  // 2. Wait for /app page
  await page.waitForURL('/app');
  
  // 3. Click "Add learning language"
  await page.getByTestId('add-learning-language-button').first().click();
  
  // 4. Wait for dialog
  await page.getByTestId('add-learning-language-dialog').waitFor({ state: 'visible' });
  
  // 5. Select Polish
  await page.getByTestId('language-select-trigger').click();
  await page.getByTestId('language-option-pl').click();
  
  // 6. Submit
  await page.getByTestId('dialog-submit').click();
  
  // 7. Verify Polish section appears
  await expect(page.getByTestId('language-section-pl')).toBeVisible();
  await expect(page.getByTestId('language-name-pl')).toContainText('Polish');
});
```

## Language Codes

Common language codes used in test IDs:
- `pl` - Polish
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `zh` - Chinese
- `ko` - Korean
- `ar` - Arabic

## Tips

1. **Always use `.first()`** when targeting `add-learning-language-button` because it appears in multiple locations
2. **Wait for visibility** before clicking elements: `await element.waitFor({ state: 'visible' })`
3. **Wait for dialog to close** after submission: `await dialog.waitFor({ state: 'hidden' })`
4. **Use networkidle** after navigation: `await page.waitForLoadState('networkidle')`
5. **Language codes are lowercase** in all test IDs

