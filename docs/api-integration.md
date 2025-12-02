# API Integration Guide

This guide covers integrating external APIs to enhance the GC Web Health Checker's capabilities.

## Overview

The application integrates with three external APIs:

1. **Firecrawl API** - Web crawling and content extraction
2. **Google PageSpeed Insights API** - Lighthouse performance analysis
3. **DataForSEO API** - Advanced SEO metrics

All APIs are **optional**. The application includes fallback mechanisms for local analysis when APIs are unavailable.

---

## Firecrawl API

### Purpose
Firecrawl extracts structured data from websites, including:
- HTML content
- Metadata (title, description, keywords)
- Open Graph tags
- Screenshots
- Links and structure

### Setup

1. **Get API Key**
   - Visit [firecrawl.dev](https://firecrawl.dev)
   - Sign up for an account
   - Navigate to API settings
   - Copy your API key

2. **Configure Environment**

Add to `.env.local`:

```bash
FIRECRAWL_API_KEY=fc-your-api-key-here
```

3. **Verify Configuration**

The crawl endpoint will automatically use Firecrawl when configured:

```typescript
// app/api/crawl/route.ts
const apiKey = process.env.FIRECRAWL_API_KEY;
if (apiKey) {
  // Uses Firecrawl API
} else {
  // Falls back to basic fetch
}
```

### Usage

The crawl API is called automatically by health checks:

```typescript
const response = await fetch('/api/crawl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});
```

### Response Format

```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Domain",
    "description": "Example description",
    "html": "<html>...</html>",
    "markdown": "# Example...",
    "screenshot": "base64-encoded-image",
    "links": [...],
    "metadata": {...}
  }
}
```

### Pricing
- Free tier available
- Pay-as-you-go pricing
- Check [firecrawl.dev/pricing](https://firecrawl.dev/pricing)

---

## Google PageSpeed Insights API

### Purpose
Provides real Lighthouse analysis from Google's infrastructure:
- Performance metrics
- Accessibility score
- Best practices score
- SEO score
- Core Web Vitals

### Setup

1. **Get API Key**
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable **PageSpeed Insights API**
   - Create credentials (API Key)
   - Copy the API key

2. **Configure Environment**

Add to `.env.local`:

```bash
PAGESPEED_API_KEY=AIzaSy...your-api-key-here
```

3. **Verify Configuration**

The Lighthouse endpoint automatically detects the API key:

```typescript
// app/api/validate/lighthouse/route.ts
const apiKey = process.env.PAGESPEED_API_KEY;
if (apiKey) {
  return await analyzeWithPageSpeedAPI(url, apiKey);
} else {
  return await runSimulation(url);
}
```

### API Behavior

**With API Key:**
- Real Lighthouse analysis from Google
- Actual performance metrics
- Comprehensive audit results
- Data source: "Google PageSpeed Insights API"

**Without API Key:**
- Local simulation
- Estimated metrics based on HTML analysis
- Basic performance checks
- Data source: "Simulated Analysis"

### Response Format

```json
{
  "id": "lighthouse-123456",
  "label": "Lighthouse Report",
  "status": "success",
  "score": 87,
  "message": "Good performance...",
  "details": [...],
  "recommendations": [...],
  "dataSource": "Google PageSpeed Insights API",
  "metrics": {
    "performanceScore": 87,
    "accessibilityScore": 92,
    "bestPracticesScore": 85,
    "seoScore": 90,
    "firstContentfulPaint": 1.2,
    "largestContentfulPaint": 2.5
  }
}
```

### Quotas and Limits
- **Free tier**: 25,000 requests/day
- **Rate limit**: 400 requests/100 seconds
- Monitor usage in Google Cloud Console

### Best Practices
- Cache results when possible
- Use simulation for development
- Enable API only for production
- Monitor quota usage

---

## DataForSEO API

### Purpose
Advanced SEO analysis with professional-grade metrics:
- On-page SEO score
- Meta tag analysis
- Content quality metrics
- Link analysis
- Technical SEO checks
- Mobile optimization

### Setup

1. **Get API Credentials**
   - Visit [dataforseo.com](https://dataforseo.com)
   - Create an account
   - Navigate to API settings
   - Note your login (email) and API password

2. **Configure Environment**

Add to `.env.local`:

```bash
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_api_password_here
```

> **Important:** DataForSEO uses Basic Authentication with email and a separate API password (not your account password).

3. **Verify Configuration**

The SEO endpoint detects DataForSEO credentials:

```typescript
// app/api/validate/seo/route.ts
const login = process.env.DATAFORSEO_LOGIN;
const password = process.env.DATAFORSEO_PASSWORD;

if (login && password) {
  // Uses DataForSEO API
} else {
  // Falls back to local HTML analysis
}
```

### API Behavior

**With DataForSEO:**
- Professional on-page SEO score
- Comprehensive meta analysis
- Content quality metrics
- Link analysis (internal/external)
- Performance insights
- Data source: "DataForSEO API"

**Without DataForSEO:**
- Basic HTML parsing
- Meta tag validation
- Simple content checks
- Data source: "Local Analysis"

### Response Format

```json
{
  "id": "seo-123456",
  "label": "SEO Analysis",
  "status": "success",
  "score": 87,
  "message": "Excellent SEO optimization",
  "details": [...],
  "recommendations": [...],
  "dataSource": "DataForSEO API",
  "dataForSEOMetrics": {
    "onPageScore": 87,
    "checks": {
      "meta": {...},
      "images": {...},
      "links": {...},
      "content": {...}
    }
  }
}
```

### Pricing
- Free tier with limited credits
- Pay-as-you-go model
- ~$0.02-0.05 per request
- Check [dataforseo.com/pricing](https://dataforseo.com/pricing)

### Detailed Setup Guide
See [DATAFORSEO_SETUP.md](../DATAFORSEO_SETUP.md) for comprehensive setup instructions.

---

## Environment Variables Reference

Complete `.env.local` template:

```bash
# ============================================
# Firecrawl API - Web Crawling
# ============================================
# Get your key at: https://firecrawl.dev
FIRECRAWL_API_KEY=fc-your-api-key-here

# ============================================
# Google PageSpeed Insights - Lighthouse
# ============================================
# Get your key at: https://console.cloud.google.com
PAGESPEED_API_KEY=AIzaSy...your-api-key-here

# ============================================
# DataForSEO - Advanced SEO Analysis
# ============================================
# Get credentials at: https://dataforseo.com
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_api_password_here
```

---

## Fallback Mechanisms

### How Fallbacks Work

Each health check implements graceful degradation:

```typescript
try {
  if (API_KEY_EXISTS) {
    return await useExternalAPI();
  } else {
    return await useLocalAnalysis();
  }
} catch (error) {
  console.error('API failed, falling back:', error);
  return await useLocalAnalysis();
}
```

### Fallback Capabilities

| Check | With API | Without API |
|-------|----------|-------------|
| **Crawl** | Full extraction, screenshots | Basic HTML fetch |
| **Lighthouse** | Real metrics from Google | Simulated analysis |
| **SEO** | Professional scoring | Basic meta checks |
| **Markup** | N/A (local only) | HTML validation |
| **Accessibility** | N/A (local only) | WCAG checks |
| **Contrast** | N/A (local only) | Color analysis |
| **Security** | N/A (local only) | Header checks |

---

## Testing API Integration

### Test Firecrawl

```bash
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### Test Lighthouse

```bash
curl -X POST http://localhost:3000/api/validate/lighthouse \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### Test SEO

```bash
curl -X POST http://localhost:3000/api/validate/seo \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Check the `dataSource` field in responses to confirm which method was used.

---

## Troubleshooting

### API Key Not Working

**Firecrawl:**
- Verify key starts with `fc-`
- Check account status at firecrawl.dev
- Ensure sufficient credits

**PageSpeed:**
- Verify API is enabled in Google Cloud
- Check API key restrictions
- Monitor quota usage

**DataForSEO:**
- Verify login is your email
- Use API password, not account password
- Check account balance

### Rate Limiting

If you hit rate limits:
- Implement caching
- Add delays between requests
- Upgrade API plan
- Use fallback for development

### API Errors in Console

Enable detailed logging:

```typescript
// Add to API routes for debugging
console.log('API Response:', response);
console.log('API Error:', error);
```

---

## Security Best Practices

1. **Never commit `.env.local`**
   - Already in `.gitignore`
   - Use different keys for dev/prod

2. **Rotate API keys periodically**
   - Update keys every 90 days
   - Revoke old keys immediately

3. **Restrict API keys**
   - Use domain restrictions when possible
   - Limit API scopes to minimum required

4. **Monitor usage**
   - Set up billing alerts
   - Track API usage regularly
   - Watch for unusual patterns

---

## Cost Optimization

### Development
- Use fallback mechanisms
- Cache results locally
- Limit API calls during testing

### Production
- Implement result caching
- Set reasonable rate limits
- Monitor and optimize usage
- Consider batch processing

### Recommended Strategy
- **Development**: Use fallbacks only
- **Staging**: Enable APIs with caching
- **Production**: Full API integration with monitoring

---

## Next Steps

- [Architecture Overview](./architecture.md) - Understand how APIs integrate
- [Development Guide](./development.md) - Learn development workflows
- [Deployment Guide](./deployment.md) - Deploy with API keys
