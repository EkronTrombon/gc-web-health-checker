# DataForSEO Integration Setup Guide

This guide will help you integrate DataForSEO API into your Web Health Checker application for advanced SEO analysis.

## What is DataForSEO?

DataForSEO is a comprehensive SEO data provider that offers various APIs for SEO analysis, including:
- On-Page SEO Analysis
- Technical SEO Metrics
- Page Speed Insights
- Content Analysis
- Structured Data Validation
- And much more

## Getting Your API Credentials

1. **Sign up for DataForSEO**
   - Visit [https://dataforseo.com](https://dataforseo.com)
   - Create an account or sign in
   - Navigate to your dashboard

2. **Get Your Credentials**
   - Go to your profile settings or API section
   - You'll receive:
     - **Login** (usually your email address)
     - **Password** (API password, different from your account password)

   **Note:** DataForSEO uses Basic Authentication with your email and a separate API password.

## Configuration

### 1. Update Environment Variables

Open your `.env.local` file and add your DataForSEO credentials:

```bash
# DataForSEO API Configuration
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_api_password_here
```

**Important:**
- Replace `your_email@example.com` with your actual DataForSEO account email
- Replace `your_api_password_here` with your API password from DataForSEO
- Keep these credentials secure and never commit them to version control

### 2. Verify Configuration

The application will automatically detect if DataForSEO is configured. When you run an SEO analysis:

- **With DataForSEO configured**: Uses advanced API analysis with detailed metrics
- **Without DataForSEO**: Falls back to local HTML analysis (basic checks)

## How It Works

### API Integration Flow

1. When you analyze a URL with the SEO checker:
   ```
   User enters URL → SEO Route checks if DataForSEO is configured
   ↓
   If configured: Calls DataForSEO API → Gets comprehensive SEO data
   ↓
   If not configured: Uses local HTML parsing → Basic SEO checks
   ↓
   Returns unified report with score and recommendations
   ```

2. The DataForSEO integration provides:
   - **On-Page Score**: Professional SEO score (0-100)
   - **Meta Tag Analysis**: Title, description, canonical, etc.
   - **Content Metrics**: Word count, text-to-HTML ratio
   - **Image Analysis**: Count, alt text validation
   - **Link Analysis**: Internal/external links, broken links
   - **Performance Data**: Load times, DOM metrics
   - **Mobile Optimization**: Viewport and responsive design checks

### API Endpoints Used

The integration uses the following DataForSEO endpoint:
- `POST /v3/on_page/instant_pages` - Instant on-page SEO analysis

## Features

### Enhanced SEO Analysis

With DataForSEO, your reports include:

✅ **Professional SEO Score**
- Industry-standard scoring algorithm
- Comprehensive factor analysis

✅ **Advanced Meta Analysis**
- Title tag optimization
- Meta description quality
- Canonical URL validation
- Open Graph and Twitter Cards

✅ **Content Quality Metrics**
- Word count analysis
- Text-to-HTML ratio
- Content structure evaluation

✅ **Technical SEO**
- Broken link detection
- Image optimization checks
- Mobile-friendliness validation
- Structured data analysis

✅ **Performance Insights**
- Page load metrics
- Resource analysis
- Core Web Vitals indicators

### Fallback Mechanism

The application includes intelligent fallback:
- If DataForSEO API fails or is not configured, it automatically switches to local analysis
- No disruption to user experience
- Seamless degradation

## API Usage and Pricing

### Free Tier
DataForSEO offers a free tier with limited credits to test the API.

### Pricing
- Pay-as-you-go model
- Check current pricing at [https://dataforseo.com/pricing](https://dataforseo.com/pricing)
- On-Page analysis typically costs a few cents per request

### Monitor Usage
You can monitor your API usage through:
1. DataForSEO dashboard
2. The application logs (when enabled)

## Troubleshooting

### Common Issues

**1. Authentication Errors**
```
Error: DataForSEO credentials not configured
```
**Solution:** Ensure `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` are set in `.env.local`

**2. API Request Failed**
```
Error: DataForSEO API request failed: 401
```
**Solution:** Check that your credentials are correct. Verify on DataForSEO dashboard.

**3. No Results Returned**
```
Error: No results returned from DataForSEO
```
**Solution:** The URL might not be accessible. Check if the website is publicly available.

**4. Rate Limiting**
```
Error: 429 Too Many Requests
```
**Solution:** You've hit the rate limit. Wait a moment or upgrade your plan.

### Debug Mode

To see detailed logs, check the server console when running the application:

```bash
npm run dev
```

Look for messages like:
- `Using DataForSEO API for advanced SEO analysis...`
- `DataForSEO analysis failed, falling back to local analysis:`

## API Response Example

Here's what the enhanced report includes:

```json
{
  "success": true,
  "data": {
    "id": "seo-1234567890",
    "label": "SEO Analysis",
    "url": "https://example.com",
    "status": "success",
    "score": 87,
    "timestamp": 1234567890,
    "message": "Excellent SEO optimization...",
    "details": [...],
    "recommendations": [...],
    "dataSource": "DataForSEO API",
    "dataForSEOMetrics": {
      "onPageScore": 87,
      "checks": {
        "meta": { ... },
        "images": { ... },
        "links": { ... },
        "content": { ... },
        "performance": { ... }
      }
    }
  }
}
```

## Best Practices

1. **API Key Security**
   - Never commit `.env.local` to Git
   - Use different credentials for development and production
   - Rotate API keys periodically

2. **Cost Optimization**
   - Cache results when possible
   - Use local analysis for development/testing
   - Enable DataForSEO only for production

3. **Error Handling**
   - The application handles errors gracefully
   - Falls back to local analysis if API fails
   - Logs errors for debugging

## Additional Resources

- [DataForSEO Documentation](https://docs.dataforseo.com/)
- [On-Page API Reference](https://docs.dataforseo.com/v3/on_page/overview/)
- [DataForSEO Support](https://dataforseo.com/contact)

## Questions?

If you encounter issues:
1. Check the troubleshooting section above
2. Review DataForSEO documentation
3. Check server logs for detailed error messages
4. Contact DataForSEO support for API-specific issues
