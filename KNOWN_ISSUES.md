# Known Issues

This document tracks known issues, technical debt, and areas requiring attention in the GC Web Health Checker codebase.

**Last Updated:** December 2025
**Version:** 0.1.0

---

## 🔴 Critical Issues (P0)

### 1. Obsolete API Route References in Validators

**Status:** Open
**Priority:** P0
**Impact:** Breaks fallback logic when HTML is not provided

**Description:**
Several validator server actions still reference the old `/api/crawl` endpoint that no longer exists after the migration to server actions.

**Affected Files:**
- `app/actions/validate/accessibility.ts` (line 22)
- `app/actions/validate/contrast.ts` (line 22)
- `app/actions/validate/markup.ts` (line 21)
- `app/actions/validate/seo.ts` (line 21)

**Problematic Code Pattern:**
```typescript
const crawlResponse = await fetch(`${baseUrl}/api/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
});
```

**Why It's Wrong:**
1. `/api/crawl` endpoint doesn't exist (no `app/api/crawl` directory)
2. Should use `crawlUrl()` server action directly
3. Creates HTTP overhead where direct server action call would be more efficient
4. Breaks when called in server context

**Current Workaround:**
The `use-health-check.ts` hook calls `crawlUrl()` before validators and passes HTML, so validators never hit the broken fallback path.

**Recommended Fix:**
```typescript
// Remove fetch call, accept HTML as required parameter
export async function validateAccessibility(
  url: string,
  html: string  // Make required, not optional
): Promise<HealthCheckResult> {
  if (!html) {
    throw new Error('HTML content is required');
  }
  // Continue with validation
}
```

---

### 2. Report Page References Non-Existent API Routes

**Status:** Open
**Priority:** P0
**Impact:** Report page fallback logic fails

**Description:**
The report page (`app/report/[id]/page.tsx`) includes fallback logic that tries to fetch from `/api/validate/*` routes that don't exist.

**Affected File:**
- `app/report/[id]/page.tsx` (line 94)

**Problematic Code:**
```typescript
const apiEndpoint = `/api/validate/${reportType}`;
// Then calls: fetch(apiEndpoint, ...)
```

**Recommended Fix:**
Either:
1. Remove the API fallback logic entirely (rely only on localStorage)
2. Convert to use server actions directly

---

## 🟠 High Priority Issues (P1)

### 3. Type Safety Violation in CrawlData Interface

**Status:** Open
**Priority:** P1
**Impact:** ESLint error, reduces type safety

**Description:**
The `metadata` field uses `Record<string, any>` which violates TypeScript strict mode and ESLint rules.

**Affected File:**
- `types/crawl.ts` (line 18)

**Current Code:**
```typescript
export interface CrawlData {
  html: string;
  markdown: string;
  metadata: Record<string, any>;  // ❌ ESLint error
  screenshot?: string;
}
```

**Recommended Fix:**
```typescript
interface CrawlMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
  statusCode?: number;
  [key: string]: unknown;  // Allow additional properties
}

export interface CrawlData {
  html: string;
  markdown: string;
  metadata: CrawlMetadata;  // ✅ Type safe
  screenshot?: string;
}
```

---

### 4. Jest Not Configured

**Status:** Open
**Priority:** P1
**Impact:** Cannot run test suite

**Description:**
Test files exist but Jest is not installed or configured, making tests unrunnable.

**Issues:**
- `@jest/globals` not in package.json
- No `jest.config.js` or `jest.config.ts`
- No `test` script in package.json
- Test file (`lib/validators/__tests__/accessibility.test.ts`) imports missing modules

**Recommended Fix:**
1. Install Jest dependencies:
   ```bash
   npm install --save-dev jest @jest/globals @types/jest ts-jest
   ```

2. Create `jest.config.js`:
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>'],
     testMatch: ['**/__tests__/**/*.test.ts'],
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/$1'
     }
   };
   ```

3. Add test script to `package.json`:
   ```json
   "scripts": {
     "test": "jest",
     "test:watch": "jest --watch"
   }
   ```

---

## 🟡 Medium Priority Issues (P2)

### 5. Unused Import in useHealthCheck Hook

**Status:** Open
**Priority:** P2
**Impact:** ESLint warning

**Description:**
`CrawlResponse` is imported but never used.

**Affected File:**
- `hooks/use-health-check.ts` (line 5)

**Fix:**
```typescript
// Remove CrawlResponse from import
import type { CrawlData, HealthCheckResult } from "@/types/crawl";
```

---

### 6. Obsolete Config Fields in health-checks.json

**Status:** Open
**Priority:** P2
**Impact:** Causes confusion about architecture

**Description:**
Configuration file includes `apiEndpoint` fields pointing to `/api/validate/*` routes that don't exist. These fields are never used but suggest the old API routes architecture.

**Affected File:**
- `config/health-checks.json`

**Example:**
```json
{
  "id": "markup",
  "label": "W3C Markup Validation",
  "apiEndpoint": "/api/validate/markup"  // ← OBSOLETE, never used
}
```

**Recommended Fix:**
Remove all `apiEndpoint` fields from the configuration. The hook uses dynamic imports instead.

---

### 7. LIGHTHOUSE_DEBUG.md is Outdated

**Status:** Open
**Priority:** P2
**Impact:** Confusing documentation

**Description:**
`LIGHTHOUSE_DEBUG.md` describes a debugging process for an issue that has already been fixed (desktop strategy + performance score). The file should be archived or removed.

**Recommended Action:**
- Move to `docs/archive/lighthouse-debugging-history.md`, or
- Delete entirely

---

### 8. Confusing Re-Crawl Logic in Accessibility Validator

**Status:** Open
**Priority:** P2
**Impact:** Code complexity, potential performance issues

**Description:**
The accessibility validator has a complex flow where it tries to use Axe when available (which is always), calls `getHtmlContent()` which attempts to fetch from `/api/crawl`. This creates confusion about when and how HTML is obtained.

**Current Flow:**
1. User clicks check → `use-health-check.ts` calls `crawlUrl()`
2. HTML passed to `validateAccessibility(url, html)`
3. Validator ignores HTML parameter and tries to re-crawl via `/api/crawl`

**Recommended Fix:**
Simplify the flow - if HTML is provided, use it. Don't try to re-crawl.

---

## 🟢 Low Priority Issues (P3)

### 9. No Test Coverage for Most Validators

**Status:** Open
**Priority:** P3
**Impact:** Lack of test coverage

**Description:**
Only the accessibility validator has tests. Other validators (contrast, SEO, markup, security, lighthouse) lack test coverage.

**Recommended Action:**
Add comprehensive test suites for all validators following the accessibility test pattern.

---

### 10. Axe.ts Integration Not Fully Utilized

**Status:** Open
**Priority:** P3
**Impact:** Sub-optimal accessibility testing

**Description:**
The `lib/axe.ts` file provides professional accessibility testing with Axe-core, but the integration could be cleaner. The accessibility validator should use it more directly.

**Recommendation:**
Refactor accessibility validator to call `runAxeAnalysis()` directly when HTML is available, removing the complex fallback logic.

---

## 📊 Summary Statistics

| Priority | Count | Status |
|----------|-------|--------|
| P0 (Critical) | 2 | Open |
| P1 (High) | 2 | Open |
| P2 (Medium) | 4 | Open |
| P3 (Low) | 2 | Open |
| **Total** | **10** | **10 Open** |

---

## 🎯 Recommended Action Plan

### Phase 1: Critical Fixes (Week 1)
1. Fix API route references in validators
2. Fix report page API fallback logic
3. Test all validators to ensure they work with HTML-only flow

### Phase 2: High Priority (Week 2)
4. Fix type safety issues (`Record<string, any>`)
5. Set up Jest configuration and run existing tests
6. Add missing test dependencies

### Phase 3: Clean-up (Week 3)
7. Remove obsolete config fields
8. Archive LIGHTHOUSE_DEBUG.md
9. Remove unused imports
10. Refactor accessibility validator flow

### Phase 4: Testing (Week 4+)
11. Add test coverage for all validators
12. Improve Axe integration
13. Add integration tests

---

## 📝 Notes for Contributors

When working on these issues:
- Follow the server actions pattern (see `docs/development.md`)
- Update tests when fixing issues
- Update documentation when changing architecture
- Run linter before committing: `npm run lint`
- Test locally with: `npm run dev`

---

## 🔄 Update Log

| Date | Issue # | Action | By |
|------|---------|--------|-----|
| 2025-12-15 | All | Initial documentation | System Review |

---

For questions or to report new issues, please open a GitHub issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Relevant code snippets or error messages
