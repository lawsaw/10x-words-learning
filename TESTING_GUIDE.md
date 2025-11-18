# Testing Guide for 10x Words Learning

This guide provides an overview of the testing environment and best practices for the 10x Words Learning application.

## Overview

The project uses a comprehensive testing strategy with:

- **Vitest** for unit and integration tests
- **Playwright** for end-to-end tests
- **React Testing Library** for component testing
- **@axe-core/playwright** for accessibility testing

## Quick Start

### Installation

All testing dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Running Tests

```bash
# Unit & Integration Tests
npm test                    # Run all tests
npm run test:watch          # Watch mode for development
npm run test:ui             # Interactive UI mode
npm run test:coverage       # Generate coverage report
npm run test:unit           # Run only unit tests
npm run test:integration    # Run only integration tests

# E2E Tests
npm run test:e2e            # Run E2E tests
npm run test:e2e:headed     # Run with visible browser
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:debug      # Debug mode
npm run test:e2e:report     # View test report
npm run test:e2e:codegen    # Generate tests via recording
```

## Project Structure

```
10x-words-learning/
├── tests/                          # Unit & Integration Tests
│   ├── setup.ts                    # Test configuration
│   ├── unit/                       # Unit tests
│   │   ├── example.test.ts         # Example unit test
│   │   └── utils.test.ts           # Utils tests
│   ├── integration/                # Integration tests
│   │   └── example-component.test.tsx
│   └── README.md                   # Unit testing docs
├── e2e/                            # E2E Tests
│   ├── example.spec.ts             # Example E2E test
│   ├── pages/                      # Page Object Models
│   │   ├── BasePage.ts             # Base page class
│   │   └── LoginPage.ts            # Login page POM
│   ├── fixtures/                   # Test data
│   │   └── test-data.ts            # Test fixtures
│   └── README.md                   # E2E testing docs
├── vitest.config.ts                # Vitest configuration
├── playwright.config.ts            # Playwright configuration
└── TESTING_GUIDE.md               # This file
```

## Testing Strategy

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual functions, utilities, and services in isolation.

**What to test**:
- Utility functions
- Service methods
- Data transformations
- Business logic
- Validation functions

**Example**:

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
  });
});
```

### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test how components interact with each other and with dependencies.

**What to test**:
- React components
- Component interactions
- Form submissions
- State management
- API integrations (mocked)

**Example**:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### 3. E2E Tests (`e2e/`)

**Purpose**: Test complete user flows in a real browser environment.

**What to test**:
- User authentication flows
- Complete feature workflows
- Navigation between pages
- Form submissions with backend
- Real API interactions
- Accessibility compliance

**Example**:

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/app');
});
```

## Best Practices

### General Testing Principles

1. **Write tests that reflect user behavior**: Test what users do, not implementation details
2. **Keep tests independent**: Each test should run in isolation
3. **Use descriptive test names**: "should display error when email is invalid"
4. **Follow AAA pattern**: Arrange, Act, Assert
5. **Mock external dependencies**: Don't make real API calls in unit/integration tests
6. **Test error cases**: Don't just test the happy path
7. **Keep tests maintainable**: Avoid duplication, use helper functions

### Vitest Best Practices

1. **Use `vi.fn()` for mocks**:
```typescript
const mockFunction = vi.fn();
mockFunction.mockReturnValue('value');
expect(mockFunction).toHaveBeenCalledWith(arg);
```

2. **Use `vi.mock()` for modules**:
```typescript
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() }
}));
```

3. **Use inline snapshots**:
```typescript
expect(data).toMatchInlineSnapshot(`
  {
    "key": "value",
  }
`);
```

4. **Test async code properly**:
```typescript
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Playwright Best Practices

1. **Use Page Object Model**:
```typescript
export class LoginPage extends BasePage {
  readonly emailInput = this.page.getByLabel('Email');
  
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

2. **Use semantic locators**:
```typescript
// Good
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByText('Welcome')

// Avoid
page.locator('.submit-btn')
page.locator('#email-input')
```

3. **Wait for conditions**:
```typescript
await expect(page.getByText('Success')).toBeVisible();
await page.waitForLoadState('networkidle');
```

4. **Use test fixtures**:
```typescript
import { testUsers } from './fixtures/test-data';

test('login', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(testUsers.valid.email);
});
```

## Configuration

### Vitest Configuration

Located in `vitest.config.ts`:

- **Environment**: jsdom (for DOM testing)
- **Setup file**: `tests/setup.ts`
- **Coverage**: v8 provider with 70% thresholds
- **Path aliases**: Match TypeScript paths (`@/components`, etc.)

### Playwright Configuration

Located in `playwright.config.ts`:

- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: http://localhost:3000
- **Parallel execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Traces**: On first retry
- **Web server**: Auto-starts dev server

## Mocking

### Mocking Supabase

```typescript
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
        }))
      }))
    }))
  }
}));
```

### Mocking Next.js Router

Already configured in `tests/setup.ts`:

```typescript
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
```

### Mocking Environment Variables

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
```

## Coverage

Run coverage reports with:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory with:
- HTML report: `coverage/index.html`
- LCOV report: `coverage/lcov.info`
- JSON report: `coverage/coverage-final.json`

**Coverage Thresholds**:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Continuous Integration

Tests should be run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Unit Tests
  run: npm run test:coverage

- name: Run E2E Tests
  run: npm run test:e2e
```

## Debugging

### Debug Vitest Tests

1. **Use console.log**: Simple but effective
2. **Use Vitest UI**: `npm run test:ui`
3. **Use VS Code debugger**: Set breakpoints in test files
4. **Check test output**: Vitest provides detailed error messages

### Debug Playwright Tests

1. **Headed mode**: `npm run test:e2e:headed`
2. **UI mode**: `npm run test:e2e:ui`
3. **Debug mode**: `npm run test:e2e:debug`
4. **Trace viewer**: After failure, use traces to debug
5. **Screenshots**: Check `test-results/` for failure screenshots

## Common Issues

### Tests not found

**Problem**: Vitest doesn't find test files

**Solution**: 
- Check file naming: Use `.test.ts` or `.spec.ts`
- Check include pattern in `vitest.config.ts`

### Import path errors

**Problem**: Cannot resolve module paths

**Solution**:
- Check path aliases in `vitest.config.ts` match `tsconfig.json`
- Ensure paths start with `@/`

### DOM not available

**Problem**: `document is not defined`

**Solution**:
- Set `environment: 'jsdom'` in `vitest.config.ts`
- Import `@testing-library/jest-dom` in setup

### Playwright timeout

**Problem**: Tests timeout waiting for elements

**Solution**:
- Increase timeout in config
- Use explicit `waitFor` methods
- Check if element selector is correct

### Flaky E2E tests

**Problem**: Tests pass/fail inconsistently

**Solution**:
- Avoid `page.waitForTimeout()`
- Use auto-waiting locators
- Ensure proper test isolation
- Check for race conditions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Next Steps

1. **Write tests for existing code**: Start with utility functions and services
2. **Implement TDD**: Write tests before implementing new features
3. **Improve coverage**: Aim for higher coverage in critical paths
4. **Add more E2E tests**: Cover main user workflows
5. **Set up CI/CD**: Automate test execution on pull requests
6. **Add visual regression tests**: Use Playwright screenshots
7. **Implement accessibility tests**: Use axe-core in E2E tests

## Questions?

For more detailed information:
- Unit/Integration tests: See `tests/README.md`
- E2E tests: See `e2e/README.md`
- Configuration details: Check `vitest.config.ts` and `playwright.config.ts`

