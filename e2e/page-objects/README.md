# Page Object Model (POM) Documentation

This directory contains Page Object Model classes for E2E testing with Playwright.

## Structure

```
e2e/page-objects/
├── BasePage.ts                          # Base class for all page objects
├── LoginPage.ts                         # Login page interactions
├── WorkspacePage.ts                     # Workspace page (/app) interactions
├── components/
│   └── AddLearningLanguageDialog.ts    # Add language dialog component
├── index.ts                             # Central exports
└── README.md                            # This file
```

## Architecture

### BasePage
Base class providing common functionality for all page objects:
- `goto()` - Navigate to page
- `getUrl()` - Get current URL
- `waitForNavigation()` - Wait for navigation to complete
- `screenshot()` - Take screenshot

### LoginPage
Handles login page interactions:
- **Locators**: `emailInput`, `passwordInput`, `submitButton`, `errorMessage`
- **Methods**:
  - `fillEmail(email)` - Fill email field
  - `fillPassword(password)` - Fill password field
  - `login(email, password, waitForRedirect)` - Complete login flow
  - `hasError()` - Check if error is displayed
  - `getErrorMessage()` - Get error message text

### WorkspacePage
Handles workspace page (/app) interactions:
- **Locators**: `addLearningLanguageButton`, `addCategoryButton`, `emptyState`
- **Components**: `addLearningLanguageDialog`
- **Methods**:
  - `isEmptyState()` - Check if empty state is visible
  - `clickAddLearningLanguage()` - Click add language button
  - `openAddLearningLanguageDialog()` - Open add language dialog
  - `addNewLearningLanguage(code)` - Complete flow to add language
  - `getLanguageSection(code)` - Get language section locator
  - `hasLanguage(code)` - Check if language exists
  - `waitForLanguageSection(code)` - Wait for language section to appear

### AddLearningLanguageDialog (Component)
Handles add learning language dialog:
- **Locators**: `dialog`, `languageSelectTrigger`, `submitButton`, `cancelButton`
- **Methods**:
  - `waitForOpen()` - Wait for dialog to open
  - `waitForClose()` - Wait for dialog to close
  - `selectLanguage(code)` - Select language by code
  - `addLanguage(code, waitForClose)` - Complete flow to add language
  - `clickCancel()` - Cancel dialog

## Usage Examples

### Example 1: Login
```typescript
import { LoginPage } from './page-objects';

test('should login successfully', async ({ page }) => {
  // ARRANGE
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // ACT
  await loginPage.login('user@example.com', 'password');

  // ASSERT
  expect(page.url()).toContain('/app');
});
```

### Example 2: Add Language
```typescript
import { WorkspacePage } from './page-objects';

test('should add Polish language', async ({ page }) => {
  // ARRANGE
  const workspacePage = new WorkspacePage(page);
  await workspacePage.goto();

  // ACT
  await workspacePage.addNewLearningLanguage('pl');

  // ASSERT
  await expect(workspacePage.getLanguageSection('pl')).toBeVisible();
});
```

### Example 3: Dialog Interaction
```typescript
import { WorkspacePage } from './page-objects';

test('should open and cancel dialog', async ({ page }) => {
  // ARRANGE
  const workspacePage = new WorkspacePage(page);
  await workspacePage.goto();

  // ACT
  await workspacePage.openAddLearningLanguageDialog();
  await workspacePage.addLearningLanguageDialog.selectLanguage('pl');
  await workspacePage.addLearningLanguageDialog.clickCancel();

  // ASSERT
  await expect(workspacePage.addLearningLanguageDialog.dialog).not.toBeVisible();
});
```

## Best Practices

### 1. Follow Arrange-Act-Assert Pattern
```typescript
test('example test', async ({ page }) => {
  // ARRANGE: Set up test preconditions
  const workspacePage = new WorkspacePage(page);
  await workspacePage.goto();

  // ACT: Perform the action being tested
  await workspacePage.addNewLearningLanguage('pl');

  // ASSERT: Verify the expected outcome
  await expect(workspacePage.getLanguageSection('pl')).toBeVisible();
});
```

### 2. Use data-testid Attributes
All page objects use `data-testid` attributes as primary selectors with role-based fallbacks:
```typescript
// Primary selector (data-testid)
this.submitButton = page.getByTestId('dialog-submit')
  // Fallback selector (role-based)
  .or(page.getByRole('button', { name: /add language/i }));
```

### 3. Encapsulate Complex Flows
Create high-level methods for common user flows:
```typescript
// Instead of multiple steps in test
await workspacePage.clickAddLearningLanguage();
await workspacePage.addLearningLanguageDialog.waitForOpen();
await workspacePage.addLearningLanguageDialog.selectLanguage('pl');
await workspacePage.addLearningLanguageDialog.clickSubmit();

// Use high-level method
await workspacePage.addNewLearningLanguage('pl');
```

### 4. Return Locators for Flexibility
Methods that return locators allow for flexible assertions:
```typescript
const section = workspacePage.getLanguageSection('pl');
await expect(section).toBeVisible();
await expect(section).toContainText('Polish');
```

### 5. Use TypeScript for Type Safety
All page objects use TypeScript for better IDE support and type checking.

## Selector Strategy

### Priority Order:
1. **data-testid** - Primary, most resilient to changes
2. **HTML ID** - For standard form elements
3. **Role-based** - Semantic, accessible fallback
4. **Text-based** - Last resort for dynamic content

### Example:
```typescript
// Best: data-testid
page.getByTestId('add-learning-language-button')

// Good: HTML ID (for form inputs)
page.locator('#login-email')

// Fallback: Role-based
page.getByRole('button', { name: /add learning language/i })

// Last resort: Text/content
page.locator('section').filter({ hasText: /polish/i })
```

## Testing Workflow

1. **Write test using POM**
2. **Run test**: `npx playwright test filename`
3. **Debug with headed mode**: `npx playwright test filename --headed`
4. **Use trace viewer**: `npx playwright test filename --trace on`
5. **Update POM** as UI changes

## Language Codes

Common language codes used in tests:
- `pl` - Polish
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian

