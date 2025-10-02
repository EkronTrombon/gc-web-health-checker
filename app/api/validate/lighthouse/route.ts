import { NextRequest, NextResponse } from "next/server";

interface LighthouseIssue {
  type: string;
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  impact?: 'high' | 'medium' | 'low';
}

interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  speedIndex: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  performanceScore?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required for Lighthouse analysis" },
        { status: 400 }
      );
    }

    // For now, we'll simulate Lighthouse analysis
    // In a real implementation, you could use:
    // 1. Google PageSpeed Insights API
    // 2. Lighthouse CI programmatically
    // 3. Web.dev API
    const lighthouseData = await analyzePage(url);

    const issues = lighthouseData.issues;
    const metrics = lighthouseData.metrics;

    const criticalCount = issues.filter(issue => issue.impact === 'high').length;
    const warningCount = issues.filter(issue => issue.impact === 'medium' || issue.impact === 'low').length;

    // Calculate score based on Core Web Vitals and other metrics
    let score = 100;
    score -= (criticalCount * 15);
    score -= (warningCount * 5);

    // Adjust score based on specific metrics
    if (metrics.performanceScore < 90) score -= (90 - metrics.performanceScore) * 0.5;
    if (metrics.accessibilityScore < 90) score -= (90 - metrics.accessibilityScore) * 0.3;
    if (metrics.bestPracticesScore < 90) score -= (90 - metrics.bestPracticesScore) * 0.2;
    if (metrics.seoScore < 90) score -= (90 - metrics.seoScore) * 0.2;

    score = Math.max(0, Math.min(100, Math.round(score)));

    const status = criticalCount > 0 ? 'error' : warningCount > 3 ? 'warning' : 'success';
    const message = issues.length === 0
      ? 'Excellent performance and best practices scores'
      : `Performance analysis completed - ${criticalCount} critical issues, ${warningCount} improvements needed`;

    const recommendations = generateLighthouseRecommendations(issues, metrics);

    const reportData = {
      id: `lighthouse-${Date.now()}`,
      label: "Lighthouse Report",
      url,
      status,
      score,
      timestamp: Date.now(),
      message,
      details: issues.slice(0, 15),
      recommendations,
      metrics
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error("Lighthouse validation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function analyzePage(url: string) {
  // This is a simplified simulation of Lighthouse analysis
  // In production, you would integrate with actual Lighthouse or PageSpeed Insights API

  const issues: LighthouseIssue[] = [];

  try {
    // Simulate fetching the page to analyze basic metrics
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Web Health Checker/1.0)'
      }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const html = await response.text();

    // Analyze response time (Largest Contentful Paint simulation)
    if (responseTime > 2500) {
      issues.push({
        type: 'error',
        message: `Slow response time: ${responseTime}ms (should be under 2.5s for LCP)`,
        metric: 'Largest Contentful Paint',
        value: responseTime,
        threshold: 2500,
        impact: 'high'
      });
    } else if (responseTime > 1500) {
      issues.push({
        type: 'warning',
        message: `Response time could be improved: ${responseTime}ms`,
        metric: 'Response Time',
        value: responseTime,
        threshold: 1500,
        impact: 'medium'
      });
    }

    // Check for common performance issues
    checkImageOptimization(html, issues);
    checkResourceHints(html, issues);
    checkCSSOptimization(html, issues);
    checkJavaScriptOptimization(html, issues);
    checkHTTPSUsage(url, issues);
    checkMobileViewport(html, issues);
    checkAccessibilityBasics(html, issues);

    // Generate simulated metrics based on analysis
    const metrics = generateMetrics(issues, responseTime);

    return { issues, metrics };

  } catch (error) {
    console.error('Error analyzing page:', error);
    issues.push({
      type: 'error',
      message: 'Failed to analyze page performance',
      impact: 'high'
    });

    return {
      issues,
      metrics: {
        performanceScore: 0,
        accessibilityScore: 0,
        bestPracticesScore: 0,
        seoScore: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        speedIndex: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0
      }
    };
  }
}

function checkImageOptimization(html: string, issues: LighthouseIssue[]): void {
  const imageMatches = html.match(/<img[^>]*>/gi) || [];

  let unoptimizedImages = 0;
  imageMatches.forEach(img => {
    if (!img.includes('loading="lazy"') && !img.includes('loading=lazy')) {
      unoptimizedImages++;
    }
    if (!img.includes('width=') && !img.includes('height=')) {
      issues.push({
        type: 'warning',
        message: 'Images without explicit dimensions can cause layout shift',
        metric: 'Cumulative Layout Shift',
        impact: 'medium'
      });
    }
  });

  if (unoptimizedImages > 0) {
    issues.push({
      type: 'warning',
      message: `${unoptimizedImages} images could use lazy loading for better performance`,
      metric: 'Image Optimization',
      impact: 'medium'
    });
  }

  // Check for modern image formats
  const hasWebP = html.includes('.webp');
  const hasAvif = html.includes('.avif');

  if (!hasWebP && !hasAvif && imageMatches.length > 0) {
    issues.push({
      type: 'warning',
      message: 'Consider using modern image formats like WebP or AVIF',
      metric: 'Image Optimization',
      impact: 'medium'
    });
  }
}

function checkResourceHints(html: string, issues: LighthouseIssue[]): void {
  const hasDNSPrefetch = html.includes('rel="dns-prefetch"');
  const hasPreconnect = html.includes('rel="preconnect"');
  const hasPreload = html.includes('rel="preload"');

  if (!hasDNSPrefetch && !hasPreconnect) {
    issues.push({
      type: 'warning',
      message: 'Consider using dns-prefetch or preconnect for external resources',
      metric: 'Resource Hints',
      impact: 'low'
    });
  }

  const externalScripts = (html.match(/src="https?:\/\/[^"]*\.js"/g) || []).length;
  if (externalScripts > 0 && !hasPreload) {
    issues.push({
      type: 'warning',
      message: 'Consider preloading critical external scripts',
      metric: 'Resource Loading',
      impact: 'medium'
    });
  }
}

function checkCSSOptimization(html: string, issues: LighthouseIssue[]): void {
  const cssBlocks = (html.match(/<style[^>]*>/g) || []).length;
  const externalCSS = (html.match(/rel="stylesheet"/g) || []).length;

  if (cssBlocks > 5) {
    issues.push({
      type: 'warning',
      message: 'Multiple style blocks detected - consider consolidating CSS',
      metric: 'CSS Optimization',
      impact: 'low'
    });
  }

  if (externalCSS > 3) {
    issues.push({
      type: 'warning',
      message: 'Multiple external CSS files - consider bundling for better performance',
      metric: 'CSS Optimization',
      impact: 'medium'
    });
  }

  // Check for render-blocking CSS
  const renderBlockingCSS = html.includes('<link rel="stylesheet"') && !html.includes('media="print"');
  if (renderBlockingCSS) {
    issues.push({
      type: 'warning',
      message: 'Consider inlining critical CSS or using media queries to avoid render blocking',
      metric: 'First Contentful Paint',
      impact: 'medium'
    });
  }
}

function checkJavaScriptOptimization(html: string, issues: LighthouseIssue[]): void {
  const inlineScripts = (html.match(/<script[^>]*>[^<]/g) || []).length;
  const externalScripts = (html.match(/<script[^>]*src=/g) || []).length;

  if (inlineScripts > 3) {
    issues.push({
      type: 'warning',
      message: 'Multiple inline scripts detected - consider external files for better caching',
      metric: 'JavaScript Optimization',
      impact: 'low'
    });
  }

  if (externalScripts > 5) {
    issues.push({
      type: 'warning',
      message: 'Many external scripts detected - consider bundling and code splitting',
      metric: 'JavaScript Optimization',
      impact: 'medium'
    });
  }

  // Check for async/defer attributes
  const syncScripts = html.match(/<script src=[^>]*(?!async)(?!defer)>/g);
  if (syncScripts && syncScripts.length > 0) {
    issues.push({
      type: 'warning',
      message: 'Scripts without async or defer attributes may block rendering',
      metric: 'First Contentful Paint',
      impact: 'high'
    });
  }
}

function checkHTTPSUsage(url: string, issues: LighthouseIssue[]): void {
  if (!url.startsWith('https://')) {
    issues.push({
      type: 'error',
      message: 'Page is not served over HTTPS',
      metric: 'Security',
      impact: 'high'
    });
  }
}

function checkMobileViewport(html: string, issues: LighthouseIssue[]): void {
  const hasViewport = html.includes('name="viewport"');

  if (!hasViewport) {
    issues.push({
      type: 'error',
      message: 'Page missing viewport meta tag for mobile responsiveness',
      metric: 'Mobile Usability',
      impact: 'high'
    });
  } else {
    const viewportContent = html.match(/name="viewport"[^>]*content="([^"]*)"/);
    if (viewportContent && !viewportContent[1].includes('width=device-width')) {
      issues.push({
        type: 'warning',
        message: 'Viewport meta tag should include width=device-width',
        metric: 'Mobile Usability',
        impact: 'medium'
      });
    }
  }
}

function checkAccessibilityBasics(html: string, issues: LighthouseIssue[]): void {
  const hasLang = html.includes('<html') && html.includes('lang=');
  if (!hasLang) {
    issues.push({
      type: 'warning',
      message: 'HTML element missing lang attribute for accessibility',
      metric: 'Accessibility',
      impact: 'medium'
    });
  }

  const images = (html.match(/<img[^>]*>/gi) || []);
  let imagesWithoutAlt = 0;
  images.forEach(img => {
    if (!img.includes('alt=')) {
      imagesWithoutAlt++;
    }
  });

  if (imagesWithoutAlt > 0) {
    issues.push({
      type: 'warning',
      message: `${imagesWithoutAlt} images missing alt attributes for accessibility`,
      metric: 'Accessibility',
      impact: 'medium'
    });
  }
}

function generateMetrics(issues: LighthouseIssue[], responseTime: number) {
  // Simulate Lighthouse metrics based on detected issues
  let performanceScore = 95;
  let accessibilityScore = 95;
  let bestPracticesScore = 95;
  let seoScore = 95;

  issues.forEach(issue => {
    const deduction = issue.impact === 'high' ? 15 : issue.impact === 'medium' ? 8 : 3;

    if (issue.metric?.includes('Paint') || issue.metric?.includes('Performance') || issue.metric === 'CSS Optimization' || issue.metric === 'JavaScript Optimization') {
      performanceScore = Math.max(0, performanceScore - deduction);
    }

    if (issue.metric === 'Accessibility') {
      accessibilityScore = Math.max(0, accessibilityScore - deduction);
    }

    if (issue.metric === 'Security' || issue.metric === 'Resource Hints') {
      bestPracticesScore = Math.max(0, bestPracticesScore - deduction);
    }

    if (issue.metric === 'Mobile Usability') {
      seoScore = Math.max(0, seoScore - deduction);
    }
  });

  return {
    performanceScore,
    accessibilityScore,
    bestPracticesScore,
    seoScore,
    firstContentfulPaint: Math.max(800, responseTime * 0.7),
    largestContentfulPaint: Math.max(1200, responseTime * 1.2),
    speedIndex: Math.max(1000, responseTime * 1.5),
    cumulativeLayoutShift: issues.some(i => i.message.includes('layout shift')) ? 0.15 : 0.05,
    firstInputDelay: Math.random() * 100 + 50
  };
}

function generateLighthouseRecommendations(issues: LighthouseIssue[], metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];

  if (issues.some(issue => issue.message.includes('image'))) {
    recommendations.push('Optimize images with modern formats and lazy loading');
  }

  if (issues.some(issue => issue.message.includes('script'))) {
    recommendations.push('Use async/defer for non-critical JavaScript and consider code splitting');
  }

  if (issues.some(issue => issue.message.includes('CSS'))) {
    recommendations.push('Optimize CSS delivery and consider critical CSS inlining');
  }

  if (issues.some(issue => issue.message.includes('HTTPS'))) {
    recommendations.push('Serve all content over HTTPS for security and performance');
  }

  if (metrics.performanceScore && metrics.performanceScore < 90) {
    recommendations.push('Focus on Core Web Vitals: LCP, FID, and CLS improvements');
  }

  if (issues.some(issue => issue.message.includes('viewport'))) {
    recommendations.push('Ensure proper mobile viewport configuration');
  }

  if (issues.length > 0) {
    recommendations.push('Use Lighthouse or PageSpeed Insights for detailed performance monitoring');
    recommendations.push('Implement performance budgets in your CI/CD pipeline');
    recommendations.push('Consider using a Content Delivery Network (CDN)');
  }

  return recommendations;
}