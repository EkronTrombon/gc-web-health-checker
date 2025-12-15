# Lighthouse Score Debugging Guide

## Changes Made

### 1. Switched to Desktop Strategy
- **Old**: API calls defaulted to `mobile` (or no strategy parameter)
- **New**: API calls now default to `desktop` strategy
- This ensures your scores match PageSpeed Insights **Desktop** tab

### 2. Using Performance Score as Primary Metric
- **Old**: Showed average of all 4 categories (Performance, Accessibility, Best Practices, SEO)
- **New**: Shows **Performance score only** (matches PageSpeed Insights prominent display)

### 3. Added Comprehensive Logging
All Lighthouse operations now log to the console with `[Lighthouse]` and `[validateLighthouse]` prefixes.

## How to Debug the Score Discrepancy

### Step 1: Check Your Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Run a Lighthouse check on your website
4. Look for these log messages:

```
[Lighthouse] Making API request for https://example.com with strategy: desktop
[Lighthouse] Raw API scores: { performance: 0.85, accessibility: 0.9, ... }
[Lighthouse] Converted scores (0-100): { performance: 85, accessibility: 90, ... }
[validateLighthouse] Using Performance score as primary: 85/100
[useHealthCheck] Final result object: { score: 85, status: 'warning', ... }
```

### Step 2: Verify the Score Flow

The logs show the complete flow:

1. **Raw API Response** (0-1 scale): e.g., `0.62` = 62%
2. **Converted Score** (0-100 scale): `62`
3. **Primary Score Used**: Performance score `62`
4. **Final Display**: Should show `62/100`

### Step 3: Compare with PageSpeed Insights

1. Go to https://pagespeed.web.dev/
2. Enter your URL
3. **Click the "Desktop" tab** (important!)
4. Compare the **Performance** score with what you see in your app

### Step 4: Check for Common Issues

#### Issue 1: API Key Not Set
**Symptom**: Logs show "using simulated scores"
**Fix**: Set `GOOGLE_PAGESPEED_API_KEY` in `.env.local`

#### Issue 2: API Call Failing Silently
**Symptom**: Logs show error messages, then "Returning simulated fallback scores"
**Fix**: Check the error message for API quota, invalid key, or network issues

#### Issue 3: Comparing Mobile vs Desktop
**Symptom**: Scores don't match PageSpeed Insights
**Fix**: Make sure you're comparing **Desktop** scores (not Mobile)

#### Issue 4: Cached Results
**Symptom**: Old scores showing up
**Solution**: Clear localStorage and refresh:
```javascript
// Run in browser console
localStorage.clear();
location.reload();
```

### Step 5: Verify API Response Directly

You can test the Google PageSpeed API directly to see what it returns:

**Desktop Request:**
```bash
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=YOUR_API_KEY&strategy=desktop&category=performance"
```

Look for this in the response:
```json
{
  "lighthouseResult": {
    "categories": {
      "performance": {
        "score": 0.62  // This is 62/100
      }
    }
  }
}
```

**Mobile Request (for comparison):**
```bash
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=YOUR_API_KEY&strategy=mobile&category=performance"
```

## Understanding the Score Difference

If you're seeing **85** from the API but **62** on your site, here are the possibilities:

### Scenario 1: You're comparing Mobile vs Desktop
- **Mobile Performance**: Often lower (e.g., 62)
- **Desktop Performance**: Often higher (e.g., 85)
- **Solution**: The app now defaults to Desktop, matching PageSpeed Insights Desktop tab

### Scenario 2: You're looking at different metrics
- **Performance score**: 62 (what we now display)
- **Average of all scores**: (62 + 90 + 88 + 92) / 4 = 83 ≈ 85
- **Solution**: We now show Performance score only, not the average

### Scenario 3: API is failing and showing simulated scores
- **Real Performance**: 62
- **Simulated Performance**: 85 (hardcoded fallback)
- **Solution**: Check console logs for API errors

## Expected Log Output

When everything works correctly, you should see:

```
[validateLighthouse] Starting validation for https://example.com with strategy: desktop
[Lighthouse] Making API request for https://example.com with strategy: desktop
[Lighthouse] Raw API scores: {
  performance: 0.62,
  accessibility: 0.95,
  bestPractices: 0.92,
  seo: 0.98
}
[Lighthouse] Converted scores (0-100): {
  performance: 62,
  accessibility: 95,
  bestPractices: 92,
  seo: 98
}
[validateLighthouse] Received Lighthouse result: { performance: 62, ... }
[validateLighthouse] Using Performance score as primary: 62/100
[validateLighthouse] Returning HealthCheckResult: {
  score: 62,
  status: 'warning',
  message: 'Performance score: 62/100 (Desktop)'
}
[useHealthCheck] Final result object: {
  id: 'lighthouse',
  score: 62,
  status: 'warning',
  message: 'Performance score: 62/100 (Desktop)'
}
```

## What Changed in the Code

### Files Modified:

1. **`lib/validators/lighthouse.ts`**
   - Default strategy: `'mobile'` → `'desktop'`
   - Added detailed logging
   - Better error handling

2. **`app/actions/validate/lighthouse.ts`**
   - Score calculation: `average of 4` → `performance score only`
   - Default strategy: `'mobile'` → `'desktop'`
   - Added logging at each step

3. **`hooks/use-health-check.ts`**
   - Added logging for Lighthouse check flow

## Next Steps

1. **Run a test** with your website URL
2. **Check the console logs** to see the actual flow
3. **Compare with PageSpeed Insights Desktop** tab
4. **Report back** what you see in the logs vs what displays in the UI

If the scores still don't match, share:
- The console logs (especially the `[Lighthouse]` and `[validateLighthouse]` messages)
- What score you see in the UI
- What score PageSpeed Insights Desktop shows
- Whether you have `GOOGLE_PAGESPEED_API_KEY` set in `.env.local`
