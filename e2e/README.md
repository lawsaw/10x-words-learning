# E2E Testing Documentation

This directory contains end-to-end tests for the 10x Words Learning application using Playwright.

## Tech Stack

- **Playwright**: E2E testing framework
- **@axe-core/playwright**: Accessibility testing

## Directory Structure

```
e2e/
├── fixtures/            # Test data and fixtures
├── pages/              # Page Object Models (POM)
├── *.spec.ts          # Test files
└── README.md          # This file
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI (headed mode)
npm run test:e2e:headed

# Run tests in interactive UI mode
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Generate tests using codegen
npm run test:e2e:codegen
```

## Page Object Model (POM)

We use the Page Object Model pattern to make tests more maintainable and readable.

### Example Page Object

```typescript
import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class MyPage extends BasePage {
  readonly myButton: Locator

  constructor(page: Page) {
    super(page, '/my-page')
    this.myButton = page.getByRole('button', { name: 'Click me' })
  }

  async clickButton() {
    await this.myButton.click()
  }
}
```

### Using Page Objects in Tests

```typescript
import { test, expect } from '@playwright/test'
import { MyPage } from './pages/MyPage'

test('should interact with page', async ({ page }) => {
  const myPage = new MyPage(page)
  await myPage.goto()
  await myPage.clickButton()
  expect(await myPage.getTitle()).toContain('Success')
})
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/')

    // Interact
    await page.getByRole('button', { name: 'Click' }).click()

    // Assert
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

### Using Fixtures

```typescript
import { testUsers } from './fixtures/test-data'

test('should login with valid credentials', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(testUsers.valid.email)
  await page.getByLabel('Password').fill(testUsers.valid.password)
  await page.getByRole('button', { name: 'Login' }).click()
})
```

## Best Practices

1. **Use Page Object Model**: Encapsulate page interactions in page objects
2. **Use semantic locators**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
3. **Wait for elements**: Use `waitFor` methods or auto-waiting assertions
4. **Isolate tests**: Each test should be independent
5. **Use test fixtures**: Store test data in the `fixtures/` directory
6. **Test user flows**: Focus on real user scenarios
7. **Handle authentication**: Use storage state to avoid repeated logins
8. **Take screenshots**: Use screenshots for debugging and visual regression
9. **Use traces**: Enable traces for debugging test failures
10. **Test accessibility**: Use axe-core for accessibility checks

## Locator Strategies

Playwright recommends using locators in this order of priority:

1. **Role-based**: `page.getByRole('button', { name: 'Submit' })`
2. **Label-based**: `page.getByLabel('Email')`
3. **Placeholder**: `page.getByPlaceholder('Enter email')`
4. **Text**: `page.getByText('Welcome')`
5. **Test ID**: `page.getByTestId('submit-button')`
6. **CSS/XPath**: As last resort

## API Testing

Playwright can also test APIs:

```typescript
test('should fetch user data', async ({ request }) => {
  const response = await request.get('/api/profile')
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data).toHaveProperty('id')
})
```

## Visual Regression Testing

```typescript
test('should match screenshot', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('homepage.png')
})
```

## Accessibility Testing

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/')

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

## Test Hooks

```typescript
test.beforeEach(async ({ page }) => {
  // Setup before each test
  await page.goto('/')
})

test.afterEach(async ({ page }) => {
  // Cleanup after each test
})
```

## Configuration

Test configuration is in `playwright.config.ts`. Key settings:

- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: `http://localhost:3000`
- **Timeout**: 30s per test
- **Retries**: 2 on CI, 0 locally
- **Parallel**: Enabled (use `fullyParallel: true`)
- **Screenshots**: On failure
- **Traces**: On first retry
- **Web Server**: Auto-starts dev server

## Debugging

### Using UI Mode

```bash
npm run test:e2e:ui
```

This opens Playwright's interactive UI for running and debugging tests.

### Using Debug Mode

```bash
npm run test:e2e:debug
```

This opens Playwright Inspector for step-by-step debugging.

### Using Trace Viewer

After a test run with traces enabled:

```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

Tests are configured to run in CI with:

- Retry on failure (2 retries)
- Single worker (no parallelization)
- GitHub Actions reporter
- Screenshot and trace capture on failure

## Troubleshooting

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Use explicit `waitFor` methods
- Check if elements are truly visible

### Flaky tests

- Avoid `page.waitForTimeout()`
- Use auto-waiting locators
- Ensure proper test isolation
- Check for race conditions

### Authentication issues

- Use storage state to persist authentication
- Clear cookies between tests if needed
- Check token expiration
