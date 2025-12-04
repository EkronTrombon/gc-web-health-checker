# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GC Web Health Checker is a Next.js 15 application for comprehensive website health analysis. Built with **server actions architecture** (no API routes), it validates websites across 6 dimensions: W3C markup, accessibility, color contrast, Lighthouse performance, SEO, and security headers.

**Key Architecture Decision**: This codebase has been fully migrated from API routes to Next.js 15 server actions, achieving 85% client bundle reduction and improved type safety.

## Essential Commands

### Development
```bash
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build with Turbopack
npm start            # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
npm test                      # Run all tests (Jest)
npm test -- --watch          # Watch mode
npm test accessibility       # Run specific test suite
```

**Note**: Currently there's a compilation error in `lib/validators/lighthouse.ts:50` - the `extractMetrics` function is referenced but not defined. This needs to be fixed before building.

## Architecture

### Server Actions Pattern (Critical)

This app uses **server actions exclusively** - there are NO API routes in `app/api/`. All backend logic is in:

1. **`app/actions/crawl.ts`** - Server action for web crawling via Firecrawl
2. **`app/actions/validate/*.ts`** - Server actions for each validator type
3. **`lib/validators/*.ts`** - Pure validation logic (no Next.js dependencies)

When adding new features, follow this pattern:
- Put validation logic in `lib/validators/`
- Create server action in `app/actions/validate/`
- Import and call from client components via dynamic imports

### Data Flow

```
User Input (Client)
  ↓
hooks/use-health-check.ts (Client Hook)
  ↓
app/actions/crawl.ts (Server Action) → Firecrawl API
  ↓
app/actions/validate/*.ts (Server Actions)
  ↓
lib/validators/*.ts (Pure Functions)
  ↓
Results back to Client
```

### Key Files

- **`hooks/use-health-check.ts`** - Main client hook orchestrating all checks
- **`components/health-checker/check-grid.tsx`** - Check selection UI
- **`types/crawl.ts`** - Core TypeScript types (CrawlData, HealthCheckResult)
- **`config/health-checks.json`** - Configuration-driven check definitions

## Adding New Validators

Follow this exact pattern (documented in docs/development.md):

1. **Create validator logic** in `lib/validators/your-check.ts`:
   - Export validation function that accepts HTML/URL and returns issues
   - Export `calculateScore()` function
   - Export `generateRecommendations()` function

2. **Create server action** in `app/actions/validate/your-check.ts`:
   ```typescript
   'use server'

   import { HealthCheckResult } from '@/types/crawl';
   import { analyzeYourCheck, calculateScore, generateRecommendations } from '@/lib/validators/your-check';

   export async function validateYourCheck(url: string, html?: string): Promise<HealthCheckResult> {
     // Implementation following existing pattern
   }
   ```

3. **Add to config** in `config/health-checks.json`:
   ```json
   {
     "id": "your-check",
     "label": "Your Check Name",
     "description": "Description",
     "icon": "IconName",
     "enabled": true
   }
   ```

4. **Update hook** in `hooks/use-health-check.ts`:
   - Add case in `runHealthCheck()` function to dynamically import your server action

5. **Write tests** in `lib/validators/__tests__/your-check.test.ts`

## TypeScript Configuration

- **Path alias**: `@/*` maps to project root
- **Strict mode**: Enabled
- **Target**: ES2017
- All files must have explicit types - no implicit `any`

## External APIs & Environment Variables

Required in `.env.local`:

```env
FIRECRAWL_API_KEY=your_key_here          # Required for crawling
GOOGLE_PAGESPEED_API_KEY=your_key_here   # Optional (Lighthouse falls back to simulated)
```

All validators include **fallback logic** when API keys are missing - they return simulated/local analysis instead of failing.

## Server Actions vs API Routes

**NEVER create new API routes** - use server actions instead:

```typescript
// ✅ CORRECT: Server Action
'use server'

export async function myAction(data: string) {
  // Server-side code
  return result;
}

// ❌ WRONG: API Route
// Don't create app/api/*/route.ts files
```

## Client Component Patterns

Components using hooks or browser APIs must have `"use client"` directive:

```typescript
"use client";

import { useState } from "react";
// Client component code
```

Server components (default) should NOT have this directive.

## Testing Strategy

- **Unit tests**: For validators in `lib/validators/__tests__/`
- **Pattern**: Test edge cases, malformed input, and scoring functions
- Current coverage: Accessibility validator (12 test cases)
- All new validators should include comprehensive test suites

## Styling

- **Tailwind CSS 4** with utility-first approach
- **shadcn/ui** components in `components/ui/`
- **Theme**: Dark/light mode via `next-themes`
- Add new shadcn components: `npx shadcn@latest add <component>`

## Known Issues

1. **Build Error**: `lib/validators/lighthouse.ts:50` references undefined `extractMetrics` function
   - Function is called but not implemented in the file
   - Likely the function definition was removed accidentally (lines 89-99 show orphaned code)

2. **ESLint**: Currently set to not ignore during builds (`ignoreDuringBuilds: false` in `next.config.ts`)

## Performance Optimizations

- **Turbopack**: Used for both dev and build
- **Parallel execution**: All health checks run via `Promise.allSettled()`
- **Code splitting**: Automatic via Next.js App Router
- **Dynamic imports**: Used in `use-health-check.ts` for lazy-loading validators

## Important Conventions

1. **Never commit** `.env.local` or API keys
2. **File naming**: kebab-case for files, PascalCase for components
3. **Exports**: Use named exports, not default exports (except page.tsx)
4. **Error handling**: All validators must handle errors gracefully with fallbacks
5. **No over-engineering**: Keep solutions simple and focused on the task
6. **Avoid backwards-compatibility hacks**: Delete unused code completely

## Documentation

Comprehensive docs in `docs/` directory - **Start with `docs/README.md` for the full documentation index**:

- **`docs/README.md`** - Documentation index and navigation hub for all guides
- **`docs/getting-started.md`** - Installation, quick start, and basic usage (15-20 min)
- **`docs/architecture.md`** - System design, patterns, component structure, and data flow
- **`docs/development.md`** - Development workflows, adding validators, testing, and best practices
- **`docs/api-integration.md`** - External API configuration (Firecrawl, Google PageSpeed, DataForSEO)
- **`docs/deployment.md`** - Production deployment guides (Vercel, Netlify, Docker, self-hosted)

## Reference Architecture Details

**Server Components Migration**: Previously used API routes in `app/api/`, now fully migrated to server actions achieving:
- 85% smaller client bundle (~300KB reduction)
- Better type safety through direct function calls
- No HTTP overhead for internal operations
- Simplified debugging

**Report Storage**: Currently uses localStorage. Database integration is planned for future versions.

**Crawling**: Uses Firecrawl API for advanced scraping with metadata extraction, HTML, and markdown formats.
