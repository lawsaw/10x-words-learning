# Testing Quick Reference

## 🚀 Quick Start Commands

### Run Tests
```bash
# Unit & Integration
npm test                    # Run all tests
npm run test:watch          # Watch mode (recommended for development)
npm run test:ui             # Interactive UI mode
npm run test:coverage       # Generate coverage report

# E2E
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Interactive UI mode (recommended)
npm run test:e2e:debug      # Debug mode with Playwright Inspector
```

## 📝 Create New Test

### Unit Test
```typescript
// tests/unit/my-feature.test.ts
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Component Test
```typescript
// tests/integration/my-component.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test
```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('should work', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/10x Words Learning/);
});
```

## 🔍 Common Patterns

### Mock Function
```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue('value');
expect(mockFn).toHaveBeenCalled();
```

### Mock Module
```typescript
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn() }
}));
```

### Async Test
```typescript
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### User Interaction (Component)
```typescript
import { fireEvent } from '@testing-library/react';

const button = screen.getByRole('button');
fireEvent.click(button);
```

### User Interaction (E2E)
```typescript
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('test@example.com');
```

## 📂 File Locations

```
tests/unit/              - Pure function tests
tests/integration/       - Component tests
e2e/                     - End-to-end tests
e2e/pages/              - Page Object Models
e2e/fixtures/           - Test data
```

## 🐛 Debug

### Unit Tests
```bash
npm run test:ui          # Visual debugging
console.log(...)         # Good old console
```

### E2E Tests
```bash
npm run test:e2e:ui      # Interactive mode
npm run test:e2e:debug   # Playwright Inspector
npm run test:e2e:report  # View last report
```

## 📊 Coverage

```bash
npm run test:coverage    # Generate report
# Open: coverage/index.html
```

## 🎯 Locators (E2E)

Priority order:
1. `page.getByRole('button', { name: 'Submit' })`
2. `page.getByLabel('Email')`
3. `page.getByPlaceholder('Enter email')`
4. `page.getByText('Welcome')`
5. `page.getByTestId('submit-btn')` (if needed)

## 📚 Full Documentation

- **TESTING_GUIDE.md** - Complete guide
- **tests/README.md** - Unit testing details
- **e2e/README.md** - E2E testing details
- **TESTING_SETUP_SUMMARY.md** - Setup summary

## ✅ Example Tests Included

- ✅ Unit test examples
- ✅ Component test examples
- ✅ E2E test examples
- ✅ Page Object Model examples
- ✅ Test fixtures examples

All examples are working and can be used as templates!

