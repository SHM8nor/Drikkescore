# Testing Guide

This document provides an overview of the testing infrastructure for Drikkescore.

## Test Framework

We use **Vitest** as our test framework, which provides:
- Fast execution with native ESM support
- Jest-compatible API
- TypeScript support out of the box
- React Testing Library integration
- Coverage reporting

## Running Tests

```bash
# Run tests in watch mode (interactive)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Test Organization

Tests are co-located with source files in `__tests__` directories:

```
src/
├── utils/
│   ├── bacCalculator.ts
│   └── __tests__/
│       └── bacCalculator.test.ts
├── components/
│   └── session/
│       └── __tests__/
│           └── QRScanner.security.test.ts
```

### Test Utilities

Common test utilities are available in `src/test/`:
- `setup.ts` - Global test configuration and mocks
- `testUtils.tsx` - Custom render function with React Query provider

## Current Test Coverage

### ✅ Fully Tested Modules

#### 1. BAC Calculator (`src/utils/bacCalculator.ts`)
**41 tests covering:**
- Drink type inference (beer/wine/spirits)
- Alcohol gram calculations
- Widmark formula BAC calculations
- Two-phase absorption model (absorption + elimination)
- Food consumption effects (doubles absorption time)
- Rapid consumption effects (5 min absorption)
- Gender differences (Widmark constant)
- Multi-drink BAC summation
- Time-to-peak calculations
- Time-to-sober calculations
- BAC formatting and descriptions
- Driving limit checks

**Why critical:** This is the core business logic that determines user safety information.

#### 2. Badge Eligibility Checker (`src/utils/badgeChecker.ts`)
**37 tests covering:**
- Condition evaluation for all operators (`>=`, `==`, `<=`, `>`, `<`, `between`)
- AND/OR logic (requireAll flag)
- Progress calculation for badge earning
- Multiple badge evaluation
- Edge cases and error handling
- Invalid input handling

**Why critical:** Ensures badge awards are accurate and fair.

#### 3. QR Scanner Security (`src/components/session/__tests__/QRScanner.security.test.ts`)
**10 tests covering:**
- XSS protection via protocol validation
- Blocking malicious protocols (javascript:, data:, file:, vbscript:)
- Allowing safe protocols (http:, https:)
- Session code extraction
- URL parsing security

**Why critical:** Prevents XSS attacks through QR code scanning.

## Writing Tests

### Example: Testing a Utility Function

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should handle basic case', () => {
    const result = myFunction(5);
    expect(result).toBe(10);
  });

  it('should handle edge case', () => {
    const result = myFunction(0);
    expect(result).toBe(0);
  });
});
```

### Example: Testing a React Component

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/testUtils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Test Helpers

### React Query Testing

When testing components that use React Query, use the custom render function:

```typescript
import { render } from '../test/testUtils'; // Not from @testing-library/react

render(<MyComponent />);
// This provides a fresh QueryClient for each test
```

### Mocking

Vitest uses `vi` for mocking (similar to Jest's `jest`):

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('./myModule', () => ({
  myFunction: vi.fn(() => 'mocked value'),
}));

// Spy on a function
const spy = vi.spyOn(object, 'method');
expect(spy).toHaveBeenCalled();
```

## Coverage Goals

### Current Coverage
- **BAC Calculator:** ~95% (comprehensive)
- **Badge Checker:** ~85% (core logic covered)
- **QR Scanner Security:** 100% (security-critical paths)

### Target Coverage
- **Critical business logic:** 80%+ coverage
- **Utility functions:** 70%+ coverage
- **Components:** 60%+ coverage (focus on user interactions)

## What to Test Next

### High Priority
1. **Analytics Calculations** (`src/utils/analyticsCalculator.ts`)
   - Total drinks/sessions calculations
   - BAC trend analysis
   - WHO guideline comparisons

2. **Calorie Calculator** (`src/utils/calorieCalculator.ts`)
   - Alcohol calorie calculations
   - Total consumption tracking

3. **Session Hooks** (`src/hooks/useSession.ts`)
   - Session creation/joining
   - Participant management
   - Drink logging

### Medium Priority
4. **Badge Metrics** (`src/utils/badgeMetrics.ts`)
   - Individual metric extractors
   - Database query logic

5. **Friend System** (`src/hooks/useFriends.ts`)
   - Friend request flows
   - Friend list management

### Low Priority
6. **UI Components**
   - Critical user flows (session join, drink add)
   - Error states and edge cases

## Best Practices

1. **Test behavior, not implementation**
   - Focus on what the function returns, not how it works internally
   - This makes tests resilient to refactoring

2. **Use descriptive test names**
   - `it('should return 0 for no drinks')` ✅
   - `it('works')` ❌

3. **Arrange-Act-Assert pattern**
   ```typescript
   it('should calculate BAC correctly', () => {
     // Arrange
     const drinks = [/* ... */];
     const profile = {/* ... */};

     // Act
     const bac = calculateBAC(drinks, profile);

     // Assert
     expect(bac).toBe(0.5);
   });
   ```

4. **Test edge cases**
   - Empty inputs
   - Null/undefined values
   - Boundary values (0, negative, very large)
   - Invalid inputs

5. **Keep tests fast**
   - Avoid real API calls (use mocks)
   - Avoid timeouts/delays unless testing timing-critical code
   - Current test suite runs in ~2.5 seconds ✅

## Continuous Integration

Tests should be run:
- Before committing changes
- In pre-commit hooks (recommended)
- In CI/CD pipeline before deployment
- After merging pull requests

### Adding Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run test:run
```

## Troubleshooting

### Tests are slow
- Check for unnecessary `await` calls
- Ensure mocks are properly set up
- Use `test.concurrent` for independent tests

### Tests fail intermittently
- Look for race conditions in async code
- Ensure proper cleanup in `afterEach`
- Check for shared state between tests

### TypeScript errors in tests
- Ensure test file has `.test.ts` or `.test.tsx` extension
- Check that types are imported correctly
- Verify `vitest/globals` is in `tsconfig.json`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://testingjavascript.com/)
