# Testing Guide

Comprehensive guide for testing the GC Web Health Checker application.

**Version:** 0.1.0
**Last Updated:** December 2025

---

## Table of Contents

- [Testing Overview](#testing-overview)
- [Setting Up Testing](#setting-up-testing)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Testing Patterns](#testing-patterns)
- [Manual Testing](#manual-testing)
- [CI/CD Integration](#cicd-integration)

---

## Testing Overview

### Current Testing Status

| Component | Test Coverage | Status |
|-----------|--------------|--------|
| Accessibility Validator | ✅ 12 test cases | Complete |
| Contrast Validator | ❌ No tests | TODO |
| Lighthouse Validator | ❌ No tests | TODO |
| Markup Validator | ❌ No tests | TODO |
| SEO Validator | ❌ No tests | TODO |
| Security Validator | ❌ No tests | TODO |
| Server Actions | ❌ No tests | TODO |
| Components | ❌ No tests | TODO |
| Hooks | ❌ No tests | TODO |

### Testing Strategy

1. **Unit Tests** - Test individual validator functions
2. **Integration Tests** - Test server actions and data flow
3. **Component Tests** - Test React components
4. **E2E Tests** - Test complete user workflows (future)

---

## Setting Up Testing

### Prerequisites

Currently, Jest is **not fully configured**. Follow these steps to set it up:

### 1. Install Dependencies

```bash
npm install --save-dev jest @jest/globals @types/jest ts-jest
```

### 2. Create Jest Configuration

Create `jest.config.js` in the project root:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app
  dir: './',
});

const customJestConfig = {
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test environment
  testEnvironment: 'jest-environment-node',

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],

  // Module name mapper (for path aliases)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Coverage settings
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Transform settings
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
};

module.exports = createJestConfig(customJestConfig);
```

### 3. Create Setup File

Create `jest.setup.js`:

```javascript
// Add custom matchers or setup code here
```

### 4. Update package.json

Add test scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

### 5. Update tsconfig.json

Ensure Jest types are included:

```json
{
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Specific Test File

```bash
npm test accessibility
```

### Run with Coverage

```bash
npm run test:coverage
```

### Run Tests for CI/CD

```bash
npm run test:ci
```

---

## Writing Tests

### Validator Test Pattern

Follow the established pattern from `lib/validators/__tests__/accessibility.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  analyzeYourValidator,
  calculateYourValidatorScore,
  generateYourValidatorRecommendations
} from '../your-validator';

describe('Your Validator', () => {
  describe('analyzeYourValidator', () => {
    it('should detect issues', async () => {
      const html = '<html><body>Test</body></html>';
      const issues = await analyzeYourValidator(html, 'https://example.com');

      expect(Array.isArray(issues)).toBe(true);
    });

    it('should handle empty HTML', async () => {
      const html = '';
      const issues = await analyzeYourValidator(html, 'https://example.com');

      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBe('error');
    });
  });

  describe('calculateYourValidatorScore', () => {
    it('should return 100 for no issues', () => {
      const score = calculateYourValidatorScore([]);
      expect(score).toBe(100);
    });

    it('should calculate correct score', () => {
      const issues = [
        { type: 'error' as const, message: 'Error' },
        { type: 'warning' as const, message: 'Warning' }
      ];

      const score = calculateYourValidatorScore(issues);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should not go below 0', () => {
      const manyIssues = Array(100).fill({
        type: 'error' as const,
        message: 'Error'
      });

      const score = calculateYourValidatorScore(manyIssues);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateYourValidatorRecommendations', () => {
    it('should return array of recommendations', () => {
      const issues = [
        { type: 'error' as const, message: 'Error' }
      ];

      const recs = generateYourValidatorRecommendations(issues);
      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should return empty array for no issues', () => {
      const recs = generateYourValidatorRecommendations([]);
      expect(recs).toEqual([]);
    });
  });
});
```

---

## Testing Patterns

### 1. Testing Validators

**Structure:**
```
lib/validators/__tests__/
  ├── accessibility.test.ts ✅
  ├── contrast.test.ts (TODO)
  ├── lighthouse.test.ts (TODO)
  ├── markup.test.ts (TODO)
  ├── seo.test.ts (TODO)
  └── security.test.ts (TODO)
```

**What to Test:**
- ✅ Issue detection with various HTML inputs
- ✅ Score calculation with different issue counts
- ✅ Edge cases (empty HTML, malformed HTML)
- ✅ Recommendation generation
- ✅ Boundary conditions (score never < 0 or > 100)

### 2. Testing Server Actions

```typescript
// app/actions/__tests__/validate.test.ts
import { validateAccessibility } from '../validate/accessibility';

describe('validateAccessibility', () => {
  it('should return HealthCheckResult', async () => {
    const html = '<html lang="en"><body><img alt="test" /></body></html>';
    const result = await validateAccessibility('https://example.com', html);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('score');
    expect(result.label).toBe('Accessibility Check');
  });

  it('should handle errors gracefully', async () => {
    const result = await validateAccessibility('https://example.com', '');

    expect(result.status).toBe('error');
    expect(result.details).toBeDefined();
  });
});
```

### 3. Testing Components

```typescript
// components/__tests__/health-checker.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HealthChecker } from '../health-checker';

describe('HealthChecker', () => {
  it('should render URL input', () => {
    render(<HealthChecker />);
    const input = screen.getByPlaceholderText(/enter website url/i);
    expect(input).toBeInTheDocument();
  });

  it('should render check buttons', () => {
    render(<HealthChecker />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
```

### 4. Testing Hooks

```typescript
// hooks/__tests__/use-health-check.test.ts
import { renderHook, act } from '@testing-library/react';
import { useHealthCheck } from '../use-health-check';

describe('useHealthCheck', () => {
  it('should validate URL correctly', () => {
    const { result } = renderHook(() => useHealthCheck());

    act(() => {
      result.current.handleUrlChange('https://example.com');
    });

    expect(result.current.isValidUrl).toBe(true);
  });

  it('should reject invalid URLs', () => {
    const { result } = renderHook(() => useHealthCheck());

    act(() => {
      result.current.handleUrlChange('not-a-url');
    });

    expect(result.current.isValidUrl).toBe(false);
  });
});
```

---

## Manual Testing

### Testing Individual Validators

#### 1. Accessibility Check

Test URLs:
- ✅ Good: https://www.w3.org (should score high)
- ❌ Bad: Create test page with missing alt attributes, no headings

Expected results:
- Detects missing alt text
- Identifies heading hierarchy issues
- Finds form label problems
- Reports ARIA issues

#### 2. Contrast Check

Test scenarios:
- Light text on light background (should fail)
- Dark text on dark background (should fail)
- Proper contrast combinations (should pass)

#### 3. Lighthouse Check

Test with:
- Fast website (good score)
- Slow website (poor score)
- Both mobile and desktop strategies

#### 4. Markup Validation

Test with:
- Valid HTML5 (should pass)
- Missing DOCTYPE (should fail)
- Unclosed tags (should fail)
- Deprecated elements (should warn)

#### 5. SEO Check

Test pages:
- With all meta tags (good score)
- Missing title (should fail)
- No meta description (should warn)
- Missing Open Graph tags (should note)

#### 6. Security Check

Test domains:
- HTTPS with security headers (good score)
- HTTP without headers (poor score)
- Partial header implementation (medium score)

---

## Test Data

### Sample HTML for Testing

```typescript
// test-fixtures.ts

export const validHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <meta name="description" content="Test description">
</head>
<body>
  <h1>Test Heading</h1>
  <p>Test content</p>
  <img src="test.jpg" alt="Test image" />
</body>
</html>
`;

export const invalidHTML = `
<html>
<body>
  <img src="test.jpg" />
  <p>Unclosed paragraph
</body>
`;

export const noAccessibilityHTML = `
<!DOCTYPE html>
<html>
<body>
  <img src="test.jpg" />
  <input type="text" />
  <div>Content without headings</div>
</body>
</html>
`;
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Coverage Goals

### Short Term (v0.2.0)
- ✅ All validators have unit tests
- ✅ Server actions have integration tests
- ✅ 70%+ code coverage

### Medium Term (v0.3.0)
- ✅ Component tests for all UI components
- ✅ Hook tests for custom hooks
- ✅ 85%+ code coverage

### Long Term (v1.0.0)
- ✅ E2E tests with Playwright/Cypress
- ✅ Visual regression tests
- ✅ Performance benchmarks
- ✅ 90%+ code coverage

---

## Troubleshooting

### Jest Can't Find @jest/globals

```bash
npm install --save-dev @jest/globals @types/jest
```

### Tests timing out

Increase timeout for async tests:

```typescript
it('should complete long operation', async () => {
  // Your test
}, 10000); // 10 second timeout
```

### Module resolution issues

Check `tsconfig.json` has correct path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Best Practices

1. **Test behavior, not implementation** - Focus on what functions do, not how
2. **Use descriptive test names** - Clearly state what's being tested
3. **Test edge cases** - Empty inputs, null values, extreme values
4. **Keep tests independent** - Each test should work in isolation
5. **Use factories for test data** - Create reusable test fixtures
6. **Mock external dependencies** - Don't rely on external APIs in tests
7. **Maintain test speed** - Fast tests = faster development

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

---

## See Also

- [Development Guide](./development.md) - Development workflows
- [API Reference](./API_REFERENCE.md) - Function signatures
- [Known Issues](../KNOWN_ISSUES.md) - Testing setup issues

---

**Questions?** Open an issue on GitHub or check the development documentation.
