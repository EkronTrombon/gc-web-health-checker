# Architecture Overview

This document provides a comprehensive overview of the GC Web Health Checker's architecture, design patterns, and technical implementation.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   React    │  │  Components  │  │  Custom Hooks    │   │
│  │   19.1.0   │  │  (shadcn/ui) │  │  (State Mgmt)    │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 15 Layer                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ App Router │  │  API Routes  │  │  Server Actions  │   │
│  │  (Pages)   │  │  (Handlers)  │  │   (Optional)     │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Validation Layer                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌────┐│
│  │Markup│  │Access│  │Contra│  │Light │  │ SEO  │  │Sec │││
│  │      │  │ ibility│  │  st  │  │house │  │      │  │    │││
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Firecrawl   │  │  PageSpeed   │  │ DataForSEO   │     │
│  │     API      │  │  Insights    │  │     API      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 19.1.0** - UI library with latest features
- **Next.js 15.5.4** - React framework with App Router
- **TypeScript 5** - Type safety and developer experience
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Component library built on Radix UI
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Node.js 18+** - Runtime environment

### External APIs
- **Firecrawl** - Web crawling and content extraction
- **Google PageSpeed Insights** - Lighthouse analysis
- **DataForSEO** - Advanced SEO metrics

## Directory Structure

```
gc-web-health-checker/
│
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── crawl/               # Web crawling endpoint
│   │   │   └── route.ts         # Crawl handler
│   │   └── validate/            # Validation endpoints
│   │       ├── accessibility/   # WCAG checks
│   │       ├── contrast/        # Color contrast
│   │       ├── lighthouse/      # Performance
│   │       ├── markup/          # HTML validation
│   │       ├── security/        # Security headers
│   │       └── seo/            # SEO analysis
│   ├── report/                  # Report viewing
│   │   └── [id]/               # Dynamic report page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
│
├── components/                  # React Components
│   ├── health-checker/         # Health checker components
│   │   ├── check-grid.tsx     # Check selection grid
│   │   ├── results-grid.tsx   # Results display
│   │   └── url-input.tsx      # URL input field
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── health-checker.tsx      # Main component
│   ├── theme-provider.tsx      # Theme context
│   └── theme-toggle.tsx        # Theme switcher
│
├── config/                     # Configuration
│   └── health-checks.json     # Health check definitions
│
├── hooks/                      # Custom React Hooks
│   └── use-health-check.ts    # Health check logic
│
├── lib/                        # Utilities
│   └── utils.ts               # Helper functions
│
├── types/                      # TypeScript Types
│   └── crawl.ts               # Type definitions
│
├── public/                     # Static Assets
│   └── ...
│
└── docs/                       # Documentation
    ├── getting-started.md
    ├── api-integration.md
    ├── architecture.md
    ├── development.md
    └── deployment.md
```

## Core Components

### 1. Health Checker Component

**Location:** `components/health-checker.tsx`

Main orchestrator component that:
- Manages URL input state
- Coordinates health checks
- Displays results

```typescript
export function HealthChecker() {
  const {
    url,
    isValidUrl,
    isLoading,
    healthResults,
    enabledHealthChecks,
    handleUrlChange,
    handleCheckClick,
    handleRunAllChecks
  } = useHealthCheck();
  
  // Renders URL input, check grid, and results
}
```

### 2. Health Check Hook

**Location:** `hooks/use-health-check.ts`

Custom hook managing:
- URL validation
- Check execution
- Result state
- Loading states

**Key Functions:**
- `handleUrlChange()` - Validates and updates URL
- `handleCheckClick()` - Runs individual check
- `handleRunAllChecks()` - Runs all checks concurrently

### 3. Check Grid Component

**Location:** `components/health-checker/check-grid.tsx`

Displays available health checks as interactive cards:
- Shows check icon, label, and description
- Handles click events
- Shows loading states

### 4. Results Grid Component

**Location:** `components/health-checker/results-grid.tsx`

Displays check results:
- Color-coded status indicators
- Score visualization
- Expandable details
- Link to detailed reports

## API Routes

### Crawl Endpoint

**Path:** `/api/crawl`

**Purpose:** Extract website content and metadata

**Flow:**
```
POST /api/crawl
  ↓
Check for FIRECRAWL_API_KEY
  ↓
If exists → Use Firecrawl API
  ↓
If not → Use basic fetch
  ↓
Return structured data
```

**Response:**
```typescript
{
  success: boolean;
  data?: CrawlData;
  error?: string;
}
```

### Validation Endpoints

All validation endpoints follow the same pattern:

**Path:** `/api/validate/{check-type}`

**Types:**
- `markup` - W3C HTML validation
- `accessibility` - WCAG compliance
- `contrast` - Color contrast
- `lighthouse` - Performance metrics
- `seo` - SEO analysis
- `security` - Security headers

**Flow:**
```
POST /api/validate/{type}
  ↓
Validate URL
  ↓
Crawl website (via /api/crawl)
  ↓
Run specific analysis
  ↓
Generate score and recommendations
  ↓
Return HealthCheckResult
```

**Response:**
```typescript
{
  id: string;
  label: string;
  status: "success" | "warning" | "error";
  score?: number;
  message: string;
  details?: Array<{
    type: "error" | "warning" | "info";
    message: string;
  }>;
  timestamp: number;
  reportId?: string;
  dataSource?: string;
}
```

## Data Flow

### Health Check Execution Flow

```
1. User enters URL
   ↓
2. URL validation (client-side)
   ↓
3. User clicks check button
   ↓
4. Frontend calls API endpoint
   ↓
5. API validates request
   ↓
6. API calls crawl endpoint
   ↓
7. Crawl returns HTML/metadata
   ↓
8. API runs specific analysis
   ↓
9. API generates report
   ↓
10. Frontend receives result
   ↓
11. Result displayed to user
```

### Concurrent Check Execution

When "Run All Checks" is clicked:

```typescript
const results = await Promise.allSettled(
  enabledChecks.map(check => 
    fetch(check.apiEndpoint, {
      method: 'POST',
      body: JSON.stringify({ url })
    })
  )
);
```

All checks run in parallel for optimal performance.

## Design Patterns

### 1. Fallback Pattern

Every external API integration includes a fallback:

```typescript
async function performCheck(url: string) {
  try {
    if (API_KEY_EXISTS) {
      return await useExternalAPI(url);
    } else {
      return await useLocalAnalysis(url);
    }
  } catch (error) {
    console.error('API failed:', error);
    return await useLocalAnalysis(url);
  }
}
```

### 2. Composition Pattern

Components are composed from smaller, reusable pieces:

```typescript
<HealthChecker>
  <UrlInput />
  <CheckGrid>
    <CheckCard />
    <CheckCard />
  </CheckGrid>
  <ResultsGrid>
    <ResultCard />
    <ResultCard />
  </ResultsGrid>
</HealthChecker>
```

### 3. Hook Pattern

Business logic separated into custom hooks:

```typescript
// In component
const { url, handleUrlChange } = useHealthCheck();

// In hook
export function useHealthCheck() {
  const [url, setUrl] = useState('');
  const handleUrlChange = (value: string) => {
    // Validation and state update logic
  };
  return { url, handleUrlChange };
}
```

### 4. Configuration-Driven Pattern

Health checks defined in JSON configuration:

```json
{
  "healthChecks": [
    {
      "id": "markup",
      "label": "W3C Markup Validation",
      "apiEndpoint": "/api/validate/markup",
      "enabled": true
    }
  ]
}
```

This allows easy addition/removal of checks without code changes.

## State Management

### Client State

Managed with React hooks:
- `useState` - Local component state
- `useEffect` - Side effects
- Custom hooks - Shared logic

### Server State

API responses cached in:
- Component state (short-term)
- Browser memory (session)
- Future: localStorage or database

## Styling Architecture

### Tailwind CSS 4

Utility-first approach with custom configuration:

```css
/* globals.css */
@theme {
  --color-primary: ...;
  --color-background: ...;
}
```

### Component Variants

Using `class-variance-authority`:

```typescript
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "...",
        destructive: "...",
      }
    }
  }
);
```

### Theme System

Dark/light mode via `next-themes`:

```typescript
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
>
  {children}
</ThemeProvider>
```

## Performance Optimizations

### 1. Turbopack

Development and build use Turbopack for faster compilation:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack"
  }
}
```

### 2. Parallel Execution

Health checks run concurrently:

```typescript
await Promise.allSettled(checks.map(runCheck));
```

### 3. Code Splitting

Next.js automatically splits code by route.

### 4. Image Optimization

Next.js Image component for optimized images.

## Security Considerations

### 1. Environment Variables

Sensitive data in `.env.local`:
- Never committed to Git
- Server-side only access
- Different keys per environment

### 2. API Route Protection

Input validation on all endpoints:

```typescript
if (!url || typeof url !== 'string') {
  return NextResponse.json(
    { error: 'Invalid URL' },
    { status: 400 }
  );
}
```

### 3. CORS

API routes restricted to same origin by default.

### 4. Rate Limiting

Consider implementing rate limiting for production.

## Error Handling

### Client-Side

```typescript
try {
  const response = await fetch('/api/validate/...');
  if (!response.ok) throw new Error('Check failed');
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
  // Show user-friendly error message
}
```

### Server-Side

```typescript
try {
  // Perform check
} catch (error) {
  console.error('Server error:', error);
  return NextResponse.json(
    { 
      success: false,
      error: 'Analysis failed',
      details: error.message 
    },
    { status: 500 }
  );
}
```

## Testing Strategy

### Unit Tests
- Test individual functions
- Test component rendering
- Test hooks logic

### Integration Tests
- Test API endpoints
- Test component interactions
- Test data flow

### E2E Tests
- Test complete user flows
- Test all health checks
- Test error scenarios

## Scalability Considerations

### Current Architecture
- Serverless functions (Vercel)
- Stateless design
- No database required

### Future Enhancements
- Add database for result persistence
- Implement caching layer (Redis)
- Add job queue for batch processing
- Implement rate limiting
- Add user authentication

## Deployment Architecture

### Vercel (Recommended)

```
GitHub Repository
  ↓
Automatic Deployment
  ↓
Edge Network (CDN)
  ↓
Serverless Functions
```

### Environment Variables

Set in deployment platform:
- `FIRECRAWL_API_KEY`
- `PAGESPEED_API_KEY`
- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`

## Monitoring and Logging

### Development
- Console logs for debugging
- Next.js dev server logs

### Production
- Vercel Analytics (optional)
- Error tracking (Sentry, etc.)
- API usage monitoring
- Performance metrics

## Future Architecture Improvements

1. **Database Integration**
   - Store check results
   - Historical analysis
   - User accounts

2. **Caching Layer**
   - Redis for API responses
   - Reduce external API calls
   - Improve performance

3. **Queue System**
   - Background job processing
   - Batch URL analysis
   - Scheduled checks

4. **Microservices**
   - Separate validation services
   - Independent scaling
   - Better fault isolation

5. **GraphQL API**
   - Flexible data fetching
   - Reduced over-fetching
   - Better client experience

## Related Documentation

- [Getting Started Guide](./getting-started.md) - Setup and installation
- [API Integration Guide](./api-integration.md) - External API setup
- [Development Guide](./development.md) - Development workflows
- [Deployment Guide](./deployment.md) - Deployment instructions
