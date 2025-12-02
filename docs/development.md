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

To add a new health check (e.g., "Performance Budget"):

#### 1. Update Configuration

Edit `config/health-checks.json`:

```json
{
  "healthChecks": [
    // ... existing checks
    {
      "id": "performance-budget",
      "label": "Performance Budget",
      "description": "Check resource sizes",
      "icon": "Gauge",
      "color": "text-primary",
      "enabled": true,
      "apiEndpoint": "/api/validate/performance-budget"
    }
  ]
}
```

#### 2. Create API Route

Create `app/api/validate/performance-budget/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Crawl website
    const crawlResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/crawl`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      }
    );

    const crawlData = await crawlResponse.json();
    
    if (!crawlData.success) {
      throw new Error('Failed to crawl website');
    }

    // Perform your analysis
    const issues = [];
    const html = crawlData.data.html;
    
    // Your validation logic here
    // ...

    // Calculate score
    const score = calculateScore(issues);

    // Generate response
    return NextResponse.json({
      id: `performance-budget-${Date.now()}`,
      label: 'Performance Budget',
      status: score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error',
      score,
      message: generateMessage(score),
      details: issues,
      timestamp: Date.now(),
      dataSource: 'Local Analysis'
    });

  } catch (error) {
    console.error('Performance budget check error:', error);
    return NextResponse.json(
      { 
        error: 'Performance budget check failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function calculateScore(issues: any[]): number {
  // Your scoring logic
  return 85;
}

function generateMessage(score: number): string {
  if (score >= 80) return 'Excellent performance budget';
  if (score >= 60) return 'Good, but could be improved';
  return 'Performance budget exceeded';
}
```

#### 3. Test Your Check

```bash
# Start dev server
npm run dev

# Test via UI or curl
curl -X POST http://localhost:3000/api/validate/performance-budget \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

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
