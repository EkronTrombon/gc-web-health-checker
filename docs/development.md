# Development Guide

This guide covers development workflows, best practices, and common tasks for contributing to the GC Web Health Checker.

## Development Setup

### Prerequisites

Ensure you have completed the [Getting Started Guide](./getting-started.md) setup.

### Recommended Tools

- **VS Code** - Code editor
- **VS Code Extensions:**
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
- **Git** - Version control
- **Postman** or **Thunder Client** - API testing

## Development Workflow

### Starting Development

```bash
# Start development server
npm run dev

# Server runs at http://localhost:3000
# Hot reload enabled
# Turbopack for fast compilation
```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit files
   - Test locally
   - Ensure no errors

3. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Project Structure Guide

### Adding a New Health Check

⚠️ **Important**: This app uses **server actions**, not API routes. Follow this pattern:

To add a new health check (e.g., "Performance Budget"):

#### 1. Create Validator Logic

Create `lib/validators/performance-budget.ts`:

```typescript
import { JSDOM } from 'jsdom';

export interface PerformanceBudgetIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  size?: number;
  limit?: number;
}

/**
 * Analyze performance budget compliance
 */
export async function analyzePerformanceBudget(
  html: string,
  url: string
): Promise<PerformanceBudgetIssue[]> {
  const issues: PerformanceBudgetIssue[] = [];
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Example: Check script sizes
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    // Your analysis logic here
    issues.push({
      type: 'warning',
      message: `Large script detected: ${src}`,
      size: 150, // KB
      limit: 100
    });
  });

  return issues;
}

/**
 * Calculate score based on issues
 */
export function calculatePerformanceBudgetScore(
  issues: PerformanceBudgetIssue[]
): number {
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;

  return Math.max(0, Math.min(100,
    100 - (errorCount * 15) - (warningCount * 5)
  ));
}

/**
 * Generate actionable recommendations
 */
export function generatePerformanceBudgetRecommendations(
  issues: PerformanceBudgetIssue[]
): string[] {
  const recommendations: string[] = [];

  if (issues.some(i => i.type === 'error')) {
    recommendations.push('Reduce bundle sizes below budget limits');
  }

  recommendations.push('Consider code splitting and lazy loading');
  recommendations.push('Compress and minify assets');

  return recommendations;
}
```

#### 2. Create Server Action

Create `app/actions/validate/performance-budget.ts`:

```typescript
'use server';

import { HealthCheckResult } from '@/types/crawl';
import {
  analyzePerformanceBudget,
  calculatePerformanceBudgetScore,
  generatePerformanceBudgetRecommendations
} from '@/lib/validators/performance-budget';

export async function validatePerformanceBudget(
  url: string,
  html?: string
): Promise<HealthCheckResult> {
  try {
    if (!html) {
      throw new Error('HTML content is required');
    }

    // Run analysis
    const issues = await analyzePerformanceBudget(html, url);
    const score = calculatePerformanceBudgetScore(issues);
    const recommendations = generatePerformanceBudgetRecommendations(issues);

    // Determine status
    const status = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error';

    return {
      id: `performance-budget-${Date.now()}`,
      label: 'Performance Budget',
      status,
      score,
      message: `Performance score: ${score}/100`,
      details: issues,
      recommendations,
      timestamp: Date.now(),
      dataSource: 'Local Analysis'
    };

  } catch (error) {
    console.error('[validatePerformanceBudget] Error:', error);

    return {
      id: `performance-budget-${Date.now()}`,
      label: 'Performance Budget',
      status: 'error',
      message: 'Performance budget check failed',
      details: [{
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }],
      timestamp: Date.now()
    };
  }
}
```

#### 3. Update Configuration

Edit `config/health-checks.json`:

```json
{
  "healthChecks": [
    {
      "id": "performance-budget",
      "label": "Performance Budget",
      "description": "Check resource sizes against budgets",
      "icon": "Gauge",
      "color": "text-primary",
      "enabled": true
    }
  ]
}
```

**Note**: No `apiEndpoint` field needed - that's for the old API routes architecture.

#### 4. Update Hook

Edit `hooks/use-health-check.ts` to add your validator:

```typescript
const runHealthCheck = async (checkType: string, crawlData: CrawlData) => {
  switch (checkType) {
    // ... existing cases
    case 'performance-budget': {
      const { validatePerformanceBudget } = await import(
        '@/app/actions/validate/performance-budget'
      );
      return await validatePerformanceBudget(url, crawlData.html);
    }
    default:
      throw new Error(`Unknown check type: ${checkType}`);
  }
};
```

#### 5. Write Tests

Create `lib/validators/__tests__/performance-budget.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  analyzePerformanceBudget,
  calculatePerformanceBudgetScore
} from '../performance-budget';

describe('Performance Budget Validator', () => {
  it('should detect oversized scripts', async () => {
    const html = '<html><script src="large.js"></script></html>';
    const issues = await analyzePerformanceBudget(html, 'https://example.com');

    expect(issues.length).toBeGreaterThan(0);
  });

  it('should calculate score correctly', () => {
    const issues = [
      { type: 'error' as const, message: 'Test' },
      { type: 'warning' as const, message: 'Test' }
    ];

    const score = calculatePerformanceBudgetScore(issues);
    expect(score).toBe(80); // 100 - (1*15) - (1*5)
  });
});
```

#### 6. Test Your Check

```bash
# Start dev server
npm run dev

# Open http://localhost:3000
# Enter a URL and click your new check button
```

**Benefits of This Pattern:**
- ✅ No HTTP overhead
- ✅ End-to-end type safety
- ✅ Easier debugging
- ✅ Smaller client bundle
- ✅ Direct function calls

### Adding a New Component

#### 1. Create Component File

Create `components/my-component.tsx`:

```typescript
"use client";

import { Button } from "@/components/ui/button";

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <Button onClick={onAction}>Click Me</Button>
    </div>
  );
}
```

#### 2. Use Component

```typescript
import { MyComponent } from "@/components/my-component";

export default function Page() {
  return (
    <MyComponent 
      title="Hello" 
      onAction={() => console.log('Clicked')} 
    />
  );
}
```

### Adding a shadcn/ui Component

```bash
# Example: Add dialog component
npx shadcn@latest add dialog

# Component added to components/ui/dialog.tsx
# Import and use:
import { Dialog } from "@/components/ui/dialog";
```

## Code Style Guidelines

### TypeScript

```typescript
// ✅ Good: Explicit types
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User {
  // ...
}

// ❌ Bad: Implicit any
function getUser(id) {
  // ...
}
```

### React Components

```typescript
// ✅ Good: Functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ Bad: No types, default export
export default function Button(props) {
  return <button>{props.label}</button>;
}
```

### Naming Conventions

- **Components:** PascalCase (`HealthChecker`, `UrlInput`)
- **Files:** kebab-case (`health-checker.tsx`, `url-input.tsx`)
- **Functions:** camelCase (`handleUrlChange`, `validateUrl`)
- **Constants:** UPPER_SNAKE_CASE (`API_ENDPOINT`, `MAX_RETRIES`)
- **Types/Interfaces:** PascalCase (`HealthCheckResult`, `CrawlData`)

### File Organization

```typescript
// 1. Imports - external first, then internal
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Constants
const MAX_ITEMS = 10;

// 4. Component
export function MyComponent({ }: Props) {
  // 4a. Hooks
  const [state, setState] = useState();
  
  // 4b. Functions
  const handleClick = () => {
    // ...
  };
  
  // 4c. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 4d. Render
  return (
    <div>...</div>
  );
}

// 5. Helper functions (if any)
function helperFunction() {
  // ...
}
```

## Testing

### Manual Testing

1. **Test URL Validation**
   - Valid URLs: `https://example.com`
   - Invalid URLs: `not-a-url`, `ftp://example.com`

2. **Test Individual Checks**
   - Click each check button
   - Verify results display
   - Check for errors in console

3. **Test "Run All Checks"**
   - Click "Run All Checks"
   - Verify all checks run
   - Verify results display correctly

4. **Test Error Handling**
   - Test with unreachable URLs
   - Test with invalid URLs
   - Verify error messages

### API Testing

Using curl:

```bash
# Test crawl endpoint
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Test validation endpoint
curl -X POST http://localhost:3000/api/validate/markup \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Using Postman:
1. Create new POST request
2. URL: `http://localhost:3000/api/validate/markup`
3. Body: `{"url":"https://example.com"}`
4. Send and verify response

## Debugging

### Client-Side Debugging

```typescript
// Add console logs
console.log('URL:', url);
console.log('Results:', healthResults);

// Use React DevTools
// Install: https://react.dev/learn/react-developer-tools
```

### Server-Side Debugging

```typescript
// In API routes
export async function POST(request: NextRequest) {
  console.log('Request received:', await request.json());
  
  try {
    // Your code
    console.log('Processing...');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

Check terminal for server logs.

### Common Issues

**Issue: Port 3000 already in use**
```bash
# Use different port
PORT=3001 npm run dev
```

**Issue: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
```

**Issue: Type errors**
```bash
# Check TypeScript
npx tsc --noEmit
```

**Issue: Lint errors**
```bash
# Run linter
npm run lint

# Auto-fix
npm run lint -- --fix
```

## Environment Variables

### Development

Create `.env.local`:

```bash
# Optional APIs
FIRECRAWL_API_KEY=fc-dev-key
PAGESPEED_API_KEY=dev-key
DATAFORSEO_LOGIN=dev@example.com
DATAFORSEO_PASSWORD=dev-password

# Base URL (optional)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Accessing in Code

```typescript
// Server-side only
const apiKey = process.env.FIRECRAWL_API_KEY;

// Client and server
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
```

## Git Workflow

### Commit Messages

Follow conventional commits:

```bash
# Format: type(scope): message

# Types:
feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: adding tests
chore: maintenance

# Examples:
git commit -m "feat(seo): add meta description check"
git commit -m "fix(lighthouse): correct score calculation"
git commit -m "docs: update API integration guide"
```

### Branch Naming

```bash
feature/add-performance-check
fix/lighthouse-score-bug
docs/update-readme
refactor/simplify-validation
```

## Performance Tips

### 1. Optimize Imports

```typescript
// ✅ Good: Import only what you need
import { Button } from "@/components/ui/button";

// ❌ Bad: Import entire library
import * as UI from "@/components/ui";
```

### 2. Memoization

```typescript
import { useMemo, useCallback } from "react";

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

### 3. Code Splitting

```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <p>Loading...</p>,
});
```

## Building for Production

### Local Production Build

```bash
# Build
npm run build

# Start production server
npm start
```

### Build Optimization

Next.js automatically:
- Minifies code
- Optimizes images
- Splits code by route
- Generates static pages where possible

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run ESLint

# Package management
npm install <package>   # Install package
npm uninstall <package> # Remove package
npm update              # Update packages

# Git
git status              # Check status
git log --oneline       # View commits
git diff                # View changes

# TypeScript
npx tsc --noEmit       # Type check without building
```

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Next.js DevTools](https://nextjs.org/docs/app/building-your-application/optimizing/devtools)

## Next Steps

- [Architecture Overview](./architecture.md) - Understand the system
- [API Integration Guide](./api-integration.md) - Configure APIs
- [Deployment Guide](./deployment.md) - Deploy your changes
