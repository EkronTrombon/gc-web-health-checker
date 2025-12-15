# API Reference

Complete reference for all validators, server actions, and validation functions in the GC Web Health Checker.

**Version:** 0.1.0
**Last Updated:** December 2025

---

## Table of Contents

- [Server Actions](#server-actions)
- [Validator Functions](#validator-functions)
- [Type Definitions](#type-definitions)
- [External Integrations](#external-integrations)

---

## Server Actions

All server actions are located in `app/actions/` and marked with `'use server'` directive.

### crawlUrl

**Location:** `app/actions/crawl.ts`

Extracts website content and metadata using Firecrawl API.

```typescript
function crawlUrl(url: string): Promise<CrawlResponse>
```

**Parameters:**
- `url` (string): The URL to crawl

**Returns:**
```typescript
interface CrawlResponse {
  success: boolean;
  data?: CrawlData;
  error?: string;
}
```

**Example:**
```typescript
const result = await crawlUrl('https://example.com');
if (result.success) {
  console.log(result.data.html);
}
```

**Requirements:**
- `FIRECRAWL_API_KEY` environment variable must be set

---

### validateAccessibility

**Location:** `app/actions/validate/accessibility.ts`

Performs WCAG 2.0/2.1 accessibility analysis using Axe-core and JSDOM.

```typescript
function validateAccessibility(
  url: string,
  html?: string
): Promise<HealthCheckResult>
```

**Parameters:**
- `url` (string): The URL being checked
- `html` (string, optional): HTML content to analyze

**Validation Logic:**
Uses `lib/axe.ts` integration and falls back to `lib/validators/accessibility.ts` for local analysis.

**Checks:**
- Missing alt attributes on images
- Missing form labels
- Heading hierarchy issues
- Missing lang attribute
- ARIA usage
- Keyboard accessibility
- Color contrast (basic)

**Returns:** `HealthCheckResult` with:
- Score: 0-100 based on issue severity
- Issues categorized by impact (critical, serious, moderate, minor)
- WCAG guideline references
- Recommendations for fixes

**Data Source:**
- Primary: Axe-core (bundled)
- Fallback: Local JSDOM analysis

---

### validateContrast

**Location:** `app/actions/validate/contrast.ts`

Analyzes color contrast ratios for WCAG AA/AAA compliance.

```typescript
function validateContrast(
  url: string,
  html?: string
): Promise<HealthCheckResult>
```

**Parameters:**
- `url` (string): The URL being checked
- `html` (string, optional): HTML content to analyze

**Validation Logic:**
Uses `lib/validators/contrast.ts` and `lib/axe.ts` for professional contrast analysis.

**Checks:**
- Text contrast ratios (WCAG AA: 4.5:1, AAA: 7:1)
- Large text contrast ratios (WCAG AA: 3:1, AAA: 4.5:1)
- UI component contrast
- Background/foreground combinations

**Returns:** `HealthCheckResult` with:
- Score: 0-100 based on contrast failures
- Specific contrast ratios for each violation
- Element selectors
- Expected vs actual ratios

**Data Source:**
- Primary: Axe-core contrast rules
- Fallback: Custom luminance calculations

---

### validateLighthouse

**Location:** `app/actions/validate/lighthouse.ts`

Runs Google Lighthouse analysis via PageSpeed Insights API.

```typescript
function validateLighthouse(
  url: string,
  strategy?: 'mobile' | 'desktop'
): Promise<HealthCheckResult>
```

**Parameters:**
- `url` (string): The URL to analyze
- `strategy` ('mobile' | 'desktop'): Analysis strategy (default: 'desktop')

**Validation Logic:**
Uses `lib/validators/lighthouse.ts` to wrap Google PageSpeed Insights API.

**Metrics:**
- **Performance** score (0-100) - primary metric displayed
- Accessibility score
- Best Practices score
- SEO score

**Returns:** `HealthCheckResult` with:
- Score: Performance score (0-100)
- Message: "Performance score: X/100 (Desktop)"
- Link to full PageSpeed Insights report

**Data Source:**
- Primary: Google PageSpeed Insights API (requires `GOOGLE_PAGESPEED_API_KEY`)
- Fallback: Simulated scores (85, 90, 88, 92)

**Note:** Currently uses **desktop strategy** and **performance score only** as the primary metric.

---

### validateMarkup

**Location:** `app/actions/validate/markup.ts`

Validates HTML markup against W3C standards.

```typescript
function validateMarkup(
  url: string,
  html?: string
): Promise<HealthCheckResult>
```

**Parameters:**
- `url` (string): The URL being checked
- `html` (string, optional): HTML content to validate

**Validation Logic:**
Uses `lib/validators/markup.ts` for W3C validation.

**Checks:**
- DOCTYPE declaration
- HTML structure validity
- Unclosed tags
- Invalid nesting
- Missing required attributes
- Deprecated elements

**Returns:** `HealthCheckResult` with:
- Score: 0-100 based on error count
- Errors with line numbers (when available)
- Warnings for deprecated features
- Info messages for best practices

**Data Source:**
- Primary: W3C Nu HTML Checker API
- Fallback: Local regex-based validation

---

### validateSEO

**Location:** `app/actions/validate/seo.ts`

Comprehensive SEO analysis with 13+ checks.

```typescript
function validateSEO(
  url: string,
  html?: string
): Promise<HealthCheckResult>
```

**Parameters:**
- `url` (string): The URL being checked
- `html` (string, optional): HTML content to analyze

**Validation Logic:**
Uses `lib/validators/seo.ts` and optionally `lib/dataforseo.ts` for professional SEO metrics.

**Checks:**
- Title tag (length, presence)
- Meta description (length, uniqueness)
- H1 heading (presence, uniqueness)
- Heading hierarchy
- Open Graph tags
- Twitter Card tags
- Canonical URL
- Robots meta tag
- Structured data (JSON-LD)
- Image alt attributes
- Internal/external links
- Mobile viewport tag
- Language declaration

**Returns:** `HealthCheckResult` with:
- Score: 0-100 based on check results
- Detailed findings for each check
- Recommendations for improvements
- Missing elements

**Data Source:**
- Primary: DataForSEO API (requires `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`)
- Fallback: Local JSDOM analysis

---

### validateSecurity

**Location:** `app/actions/validate/security.ts`

Analyzes HTTP security headers configuration.

```typescript
function validateSecurity(url: string): Promise<HealthCheckResult>
```

**Parameters:**
- `url` (string): The URL to check

**Validation Logic:**
Uses `lib/validators/security.ts` to fetch and analyze HTTP headers.

**Headers Checked:**
- **Strict-Transport-Security (HSTS)** - Enforces HTTPS
- **Content-Security-Policy (CSP)** - Prevents XSS attacks
- **X-Content-Type-Options** - Prevents MIME sniffing
- **X-Frame-Options** - Prevents clickjacking
- **X-XSS-Protection** - Legacy XSS protection
- **Referrer-Policy** - Controls referrer information
- **Permissions-Policy** - Feature policy control

**Returns:** `HealthCheckResult` with:
- Score: 0-100 based on header presence and configuration
- Missing headers
- Weak configurations
- Recommendations for hardening

**Data Source:**
- Direct HTTP fetch from target URL

---

## Validator Functions

Pure TypeScript functions in `lib/validators/` that perform the actual analysis logic.

### Accessibility Validator

**Location:** `lib/validators/accessibility.ts`

#### analyzeAccessibility

```typescript
function analyzeAccessibility(
  html: string,
  url: string
): Promise<AccessibilityIssue[]>
```

Performs JSDOM-based accessibility analysis.

#### calculateAccessibilityScore

```typescript
function calculateAccessibilityScore(
  issues: AccessibilityIssue[]
): number
```

**Scoring Formula:**
```
score = 100 - (critical × 20) - (serious × 10) - (moderate × 5) - (minor × 2)
```

#### generateAccessibilityRecommendations

```typescript
function generateAccessibilityRecommendations(
  issues: AccessibilityIssue[]
): string[]
```

Returns actionable recommendations based on found issues.

---

### Contrast Validator

**Location:** `lib/validators/contrast.ts`

#### analyzeContrast

```typescript
function analyzeContrast(
  html: string,
  url: string
): Promise<ContrastIssue[]>
```

Analyzes text and background color combinations.

#### calculateContrastRatio

```typescript
function calculateContrastRatio(
  foreground: string,
  background: string
): number
```

Calculates WCAG contrast ratio between two colors.

**Formula:**
```
ratio = (L1 + 0.05) / (L2 + 0.05)
where L1 is lighter color luminance, L2 is darker
```

#### getRelativeLuminance

```typescript
function getRelativeLuminance(rgb: [number, number, number]): number
```

Calculates relative luminance for a color.

---

### Lighthouse Validator

**Location:** `lib/validators/lighthouse.ts`

#### analyzeLighthouse

```typescript
function analyzeLighthouse(
  url: string,
  strategy: 'mobile' | 'desktop'
): Promise<LighthouseResult>
```

Calls Google PageSpeed Insights API.

#### calculateLighthouseScore

```typescript
function calculateLighthouseScore(
  categories: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  }
): number
```

**Note:** Currently returns **performance score only**, not an average.

---

### Markup Validator

**Location:** `lib/validators/markup.ts`

#### analyzeMarkup

```typescript
function analyzeMarkup(
  html: string,
  url: string
): Promise<MarkupIssue[]>
```

Validates HTML structure.

#### calculateMarkupScore

```typescript
function calculateMarkupScore(issues: MarkupIssue[]): number
```

**Scoring Formula:**
```
score = 100 - (errors × 10) - (warnings × 3)
```

---

### SEO Validator

**Location:** `lib/validators/seo.ts`

#### analyzeSEO

```typescript
function analyzeSEO(
  html: string,
  url: string
): Promise<SEOIssue[]>
```

Performs comprehensive SEO analysis.

#### calculateSEOScore

```typescript
function calculateSEOScore(checks: SEOCheck[]): number
```

**Scoring:** Each check worth specific points, totaling 100.

---

### Security Validator

**Location:** `lib/validators/security.ts`

#### analyzeSecurityHeaders

```typescript
function analyzeSecurityHeaders(
  url: string
): Promise<SecurityIssue[]>
```

Fetches and analyzes HTTP headers.

#### calculateSecurityScore

```typescript
function calculateSecurityScore(
  headers: Record<string, string>
): number
```

**Scoring:** Each security header present and properly configured adds points.

---

## Type Definitions

**Location:** `types/crawl.ts`

### CrawlData

```typescript
interface CrawlData {
  html: string;
  markdown: string;
  metadata: Record<string, any>;  // ⚠️ Type safety issue - see KNOWN_ISSUES.md
  screenshot?: string;
}
```

### CrawlResponse

```typescript
interface CrawlResponse {
  success: boolean;
  data?: CrawlData;
  error?: string;
}
```

### HealthCheckResult

```typescript
interface HealthCheckResult {
  id: string;
  label: string;
  status: "success" | "warning" | "error";
  score?: number;
  message: string;
  details?: Array<{
    type: "error" | "warning" | "info";
    message: string;
    element?: string;
    line?: number;
    impact?: string;
  }>;
  recommendations?: string[];
  timestamp: number;
  reportId?: string;
  dataSource?: string;
}
```

---

## External Integrations

### Axe-core Integration

**Location:** `lib/axe.ts`

Professional accessibility testing engine (bundled).

#### runAxeAnalysis

```typescript
function runAxeAnalysis(html: string, url?: string): Promise<AxeResult>
```

Runs Axe-core analysis on HTML content.

**Returns:**
```typescript
interface AxeResult {
  score: number;
  issues: AxeIssue[];
  violations: number;
  passes: number;
  incomplete: number;
}
```

#### runAxeContrastAnalysis

```typescript
function runAxeContrastAnalysis(
  html: string,
  url?: string
): Promise<{ score: number; issues: AxeIssue[] }>
```

Runs only contrast-related rules.

#### isAxeAvailable

```typescript
function isAxeAvailable(): boolean
```

Always returns `true` (Axe is bundled).

---

### DataForSEO Integration

**Location:** `lib/dataforseo.ts`

Professional SEO analysis (optional).

Requires environment variables:
- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`

---

## Usage Examples

### Running a Complete Health Check

```typescript
'use client';

import { crawlUrl } from '@/app/actions/crawl';
import { validateAccessibility } from '@/app/actions/validate/accessibility';
import { validateSEO } from '@/app/actions/validate/seo';

async function runHealthCheck(url: string) {
  // 1. Crawl the website
  const crawlResult = await crawlUrl(url);

  if (!crawlResult.success) {
    throw new Error('Crawl failed');
  }

  // 2. Run validators in parallel
  const [a11yResult, seoResult] = await Promise.all([
    validateAccessibility(url, crawlResult.data.html),
    validateSEO(url, crawlResult.data.html)
  ]);

  return { a11yResult, seoResult };
}
```

### Using Validator Functions Directly

```typescript
import { analyzeAccessibility, calculateAccessibilityScore } from '@/lib/validators/accessibility';

async function checkAccessibility(html: string) {
  const issues = await analyzeAccessibility(html, 'https://example.com');
  const score = calculateAccessibilityScore(issues);

  console.log(`Found ${issues.length} issues, score: ${score}`);
}
```

---

## Best Practices

1. **Always pass HTML when available** - Validators work best with HTML from `crawlUrl()`
2. **Run checks in parallel** - Use `Promise.all()` for better performance
3. **Handle errors gracefully** - All validators return structured error results
4. **Use TypeScript** - Full type safety is available for all functions
5. **Check data sources** - Results include `dataSource` field indicating API or fallback

---

## See Also

- [Architecture Guide](./architecture.md) - System design details
- [Development Guide](./development.md) - Adding new validators
- [Known Issues](../KNOWN_ISSUES.md) - Current limitations and bugs

---

**Need Help?**
- Check the [Getting Started Guide](./getting-started.md)
- Review [Architecture Documentation](./architecture.md)
- Open an issue on GitHub
