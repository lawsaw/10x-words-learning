# Testing Documentation

This directory contains unit and integration tests for the 10x Words Learning application.

## Tech Stack

- **Vitest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment for tests

## Directory Structure

```
tests/
├── setup.ts              # Global test setup and configuration
├── unit/                 # Unit tests for utilities, services, and pure functions
└── integration/          # Integration tests for components and API interactions
```

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should return expected result', () => {
    const result = myFunction(input)
    expect(result).toBe(expected)
  })
})
```

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Organize tests by type**: Keep unit tests separate from integration tests
2. **Use descriptive test names**: Clearly state what is being tested and expected outcome
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**: Use `vi.mock()` for modules and `vi.fn()` for functions
5. **Test behavior, not implementation**: Focus on what the code does, not how
6. **Use inline snapshots**: For readable assertions of complex objects
7. **Keep tests isolated**: Each test should be independent and not rely on others
8. **Handle async operations**: Use `async/await` for asynchronous tests

## Mocking

### Mocking modules

```typescript
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))
```

### Mocking functions

```typescript
const mockFn = vi.fn()
mockFn.mockReturnValue('mocked value')
mockFn.mockResolvedValue('async value')
```

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

Coverage thresholds:

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Troubleshooting

### Tests not found

Make sure your test files follow the naming convention: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`

### Import errors

Check that path aliases in `vitest.config.ts` match those in `tsconfig.json`

### DOM not available

Make sure `environment: 'jsdom'` is set in `vitest.config.ts` for component tests
