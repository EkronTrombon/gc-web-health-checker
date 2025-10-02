import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";

interface SEOIssue {
  type: string;
  message: string;
  element?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: 'meta' | 'content' | 'structure' | 'performance' | 'mobile';
}

export async function POST(request: NextRequest) {
  try {
    const { url, html } = await request.json();

    if (!url && !html) {
      return NextResponse.json(
        { error: "Either URL or HTML content is required" },
        { status: 400 }
      );
    }

    let htmlContent = html;
    let pageUrl = url;

    // If no HTML provided, crawl the URL first
    if (!htmlContent && url) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      (request.headers.get('host') ? `http://${request.headers.get('host')}` : 'http://localhost:3000');
      const crawlResponse = await fetch(`${baseUrl}/api/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!crawlResponse.ok) {
        return NextResponse.json(
          { error: "Failed to crawl URL for validation" },
          { status: 500 }
        );
      }

      const crawlData = await crawlResponse.json();
      htmlContent = crawlData.data?.html;
      pageUrl = crawlData.data?.url || url;

      if (!htmlContent) {
        return NextResponse.json(
          { error: "No HTML content found to validate" },
          { status: 400 }
        );
      }
    }

    // Analyze SEO factors
    const seoIssues = await analyzeSEO(htmlContent, pageUrl);

    const highPriorityCount = seoIssues.filter(issue => issue.priority === 'high').length;
    const mediumPriorityCount = seoIssues.filter(issue => issue.priority === 'medium').length;
    const lowPriorityCount = seoIssues.filter(issue => issue.priority === 'low').length;

    // Calculate score based on SEO factors
    let score = 100;
    score -= (highPriorityCount * 20);
    score -= (mediumPriorityCount * 8);
    score -= (lowPriorityCount * 3);
    score = Math.max(0, Math.min(100, Math.round(score)));

    const status = highPriorityCount > 0 ? 'error' : mediumPriorityCount > 2 ? 'warning' : 'success';
    const totalIssues = seoIssues.length;
    const message = totalIssues === 0
      ? 'Excellent SEO optimization - all key factors implemented'
      : `SEO analysis completed - ${highPriorityCount} critical issues, ${mediumPriorityCount + lowPriorityCount} improvements needed`;

    const recommendations = generateSEORecommendations(seoIssues);

    const reportData = {
      id: `seo-${Date.now()}`,
      label: "SEO Analysis",
      url: pageUrl || 'Provided HTML',
      status,
      score,
      timestamp: Date.now(),
      message,
      details: seoIssues.slice(0, 15),
      recommendations
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error("SEO validation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function analyzeSEO(html: string, url?: string): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Check title tag
    checkTitle(document, issues);

    // Check meta description
    checkMetaDescription(document, issues);

    // Check meta keywords (less important but still analyzed)
    checkMetaKeywords(document, issues);

    // Check headings structure
    checkHeadingsForSEO(document, issues);

    // Check images for SEO
    checkImagesForSEO(document, issues);

    // Check internal linking
    checkInternalLinking(document, issues, url);

    // Check Open Graph tags
    checkOpenGraph(document, issues);

    // Check Twitter Card tags
    checkTwitterCards(document, issues);

    // Check structured data
    checkStructuredData(document, issues);

    // Check canonical URL
    checkCanonical(document, issues, url);

    // Check mobile friendliness
    checkMobileFriendliness(document, issues);

    // Check page performance indicators
    checkPerformanceForSEO(html, issues);

    // Check content quality indicators
    checkContentQuality(document, issues);

  } catch (error) {
    console.error('Error analyzing SEO:', error);
    issues.push({
      type: 'warning',
      message: 'Unable to complete full SEO analysis',
      priority: 'medium'
    });
  }

  return issues;
}

function checkTitle(document: Document, issues: SEOIssue[]): void {
  const title = document.querySelector('title');
  const titleText = title?.textContent?.trim();

  if (!title || !titleText) {
    issues.push({
      type: 'error',
      message: 'Missing title tag - critical for SEO',
      element: 'title',
      priority: 'high',
      category: 'meta'
    });
  } else {
    if (titleText.length < 30) {
      issues.push({
        type: 'warning',
        message: `Title too short (${titleText.length} chars) - recommended 50-60 characters`,
        element: 'title',
        priority: 'medium',
        category: 'meta'
      });
    } else if (titleText.length > 60) {
      issues.push({
        type: 'warning',
        message: `Title too long (${titleText.length} chars) - may be truncated in search results`,
        element: 'title',
        priority: 'medium',
        category: 'meta'
      });
    }

    // Check for duplicate words in title
    const words = titleText.toLowerCase().split(/\s+/);
    const uniqueWords = [...new Set(words)];
    if (words.length - uniqueWords.length > 2) {
      issues.push({
        type: 'warning',
        message: 'Title contains many repeated words - could be more concise',
        element: 'title',
        priority: 'low',
        category: 'meta'
      });
    }
  }
}

function checkMetaDescription(document: Document, issues: SEOIssue[]): void {
  const metaDescription = document.querySelector('meta[name="description"]');
  const description = metaDescription?.getAttribute('content')?.trim();

  if (!metaDescription || !description) {
    issues.push({
      type: 'error',
      message: 'Missing meta description - important for search result snippets',
      element: 'meta[name="description"]',
      priority: 'high',
      category: 'meta'
    });
  } else {
    if (description.length < 120) {
      issues.push({
        type: 'warning',
        message: `Meta description too short (${description.length} chars) - recommended 150-160 characters`,
        element: 'meta[name="description"]',
        priority: 'medium',
        category: 'meta'
      });
    } else if (description.length > 160) {
      issues.push({
        type: 'warning',
        message: `Meta description too long (${description.length} chars) - may be truncated`,
        element: 'meta[name="description"]',
        priority: 'medium',
        category: 'meta'
      });
    }
  }
}

function checkMetaKeywords(document: Document, issues: SEOIssue[]): void {
  const metaKeywords = document.querySelector('meta[name="keywords"]');

  if (metaKeywords) {
    issues.push({
      type: 'warning',
      message: 'Meta keywords tag is deprecated and ignored by modern search engines',
      element: 'meta[name="keywords"]',
      priority: 'low',
      category: 'meta'
    });
  }
}

function checkHeadingsForSEO(document: Document, issues: SEOIssue[]): void {
  const h1s = document.querySelectorAll('h1');
  const h2s = document.querySelectorAll('h2');

  if (h1s.length === 0) {
    issues.push({
      type: 'error',
      message: 'Missing H1 heading - important for page topic clarity',
      element: 'h1',
      priority: 'high',
      category: 'structure'
    });
  } else if (h1s.length > 1) {
    issues.push({
      type: 'warning',
      message: `Multiple H1 tags found (${h1s.length}) - use only one per page`,
      element: 'h1',
      priority: 'medium',
      category: 'structure'
    });
  }

  const h1Text = h1s[0]?.textContent?.trim();
  if (h1Text && h1Text.length < 20) {
    issues.push({
      type: 'warning',
      message: 'H1 heading is very short - consider more descriptive text',
      element: 'h1',
      priority: 'low',
      category: 'content'
    });
  }

  if (h2s.length === 0) {
    issues.push({
      type: 'warning',
      message: 'No H2 headings found - helps structure content for SEO',
      element: 'h2',
      priority: 'low',
      category: 'structure'
    });
  }
}

function checkImagesForSEO(document: Document, issues: SEOIssue[]): void {
  const images = document.querySelectorAll('img');
  let imagesWithoutAlt = 0;
  let imagesWithBadAlt = 0;

  images.forEach(img => {
    const alt = img.getAttribute('alt');

    if (!alt && alt !== '') {
      imagesWithoutAlt++;
    } else if (alt && (alt.toLowerCase().includes('image') || alt.toLowerCase().includes('picture'))) {
      imagesWithBadAlt++;
    }
  });

  if (imagesWithoutAlt > 0) {
    issues.push({
      type: 'error',
      message: `${imagesWithoutAlt} images missing alt text - bad for SEO and accessibility`,
      element: 'img',
      priority: 'high',
      category: 'content'
    });
  }

  if (imagesWithBadAlt > 0) {
    issues.push({
      type: 'warning',
      message: `${imagesWithBadAlt} images have generic alt text - be more descriptive`,
      element: 'img',
      priority: 'medium',
      category: 'content'
    });
  }
}

function checkInternalLinking(document: Document, issues: SEOIssue[], url?: string): void {
  const links = document.querySelectorAll('a[href]');
  let internalLinks = 0;
  let externalLinks = 0;
  let noFollowLinks = 0;

  links.forEach(link => {
    const href = link.getAttribute('href');
    const rel = link.getAttribute('rel');

    if (href?.startsWith('http')) {
      if (url && href.includes(new URL(url).hostname)) {
        internalLinks++;
      } else {
        externalLinks++;
        if (rel?.includes('nofollow')) {
          noFollowLinks++;
        }
      }
    } else if (href?.startsWith('/') || href?.startsWith('./')) {
      internalLinks++;
    }
  });

  if (internalLinks < 3 && links.length > 5) {
    issues.push({
      type: 'warning',
      message: 'Few internal links found - helps with site navigation and SEO',
      priority: 'low',
      category: 'structure'
    });
  }

  if (externalLinks > 10 && noFollowLinks < externalLinks * 0.5) {
    issues.push({
      type: 'warning',
      message: 'Many external links without nofollow - consider link equity',
      priority: 'low',
      category: 'structure'
    });
  }
}

function checkOpenGraph(document: Document, issues: SEOIssue[]): void {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  if (!ogTitle) {
    issues.push({
      type: 'warning',
      message: 'Missing Open Graph title - improves social media sharing',
      element: 'meta[property="og:title"]',
      priority: 'medium',
      category: 'meta'
    });
  }

  if (!ogDescription) {
    issues.push({
      type: 'warning',
      message: 'Missing Open Graph description - improves social media sharing',
      element: 'meta[property="og:description"]',
      priority: 'medium',
      category: 'meta'
    });
  }

  if (!ogImage) {
    issues.push({
      type: 'warning',
      message: 'Missing Open Graph image - important for social media previews',
      element: 'meta[property="og:image"]',
      priority: 'medium',
      category: 'meta'
    });
  }
}

function checkTwitterCards(document: Document, issues: SEOIssue[]): void {
  const twitterCard = document.querySelector('meta[name="twitter:card"]');

  if (!twitterCard) {
    issues.push({
      type: 'warning',
      message: 'Missing Twitter Card markup - improves Twitter sharing',
      element: 'meta[name="twitter:card"]',
      priority: 'low',
      category: 'meta'
    });
  }
}

function checkStructuredData(document: Document, issues: SEOIssue[]): void {
  const jsonLd = document.querySelector('script[type="application/ld+json"]');
  const microdata = document.querySelector('[itemscope]');
  const rdfa = document.querySelector('[typeof]');

  if (!jsonLd && !microdata && !rdfa) {
    issues.push({
      type: 'warning',
      message: 'No structured data found - helps search engines understand content',
      priority: 'medium',
      category: 'structure'
    });
  }
}

function checkCanonical(document: Document, issues: SEOIssue[], url?: string): void {
  const canonical = document.querySelector('link[rel="canonical"]');

  if (!canonical) {
    issues.push({
      type: 'warning',
      message: 'Missing canonical URL - helps prevent duplicate content issues',
      element: 'link[rel="canonical"]',
      priority: 'medium',
      category: 'meta'
    });
  } else {
    const canonicalUrl = canonical.getAttribute('href');
    if (url && canonicalUrl !== url && !canonicalUrl?.startsWith('http')) {
      issues.push({
        type: 'warning',
        message: 'Canonical URL should be absolute, not relative',
        element: 'link[rel="canonical"]',
        priority: 'low',
        category: 'meta'
      });
    }
  }
}

function checkMobileFriendliness(document: Document, issues: SEOIssue[]): void {
  const viewport = document.querySelector('meta[name="viewport"]');

  if (!viewport) {
    issues.push({
      type: 'error',
      message: 'Missing viewport meta tag - critical for mobile SEO',
      element: 'meta[name="viewport"]',
      priority: 'high',
      category: 'mobile'
    });
  } else {
    const content = viewport.getAttribute('content');
    if (!content?.includes('width=device-width')) {
      issues.push({
        type: 'warning',
        message: 'Viewport should include width=device-width for mobile optimization',
        element: 'meta[name="viewport"]',
        priority: 'medium',
        category: 'mobile'
      });
    }
  }
}

function checkPerformanceForSEO(html: string, issues: SEOIssue[]): void {
  // Check for render-blocking resources
  const renderBlockingCSS = (html.match(/<link[^>]*rel="stylesheet"/g) || []).length;
  const renderBlockingJS = (html.match(/<script[^>]*src=.*(?!async)(?!defer).*>/g) || []).length;

  if (renderBlockingCSS > 3) {
    issues.push({
      type: 'warning',
      message: 'Multiple render-blocking CSS files may hurt Core Web Vitals',
      priority: 'medium',
      category: 'performance'
    });
  }

  if (renderBlockingJS > 2) {
    issues.push({
      type: 'warning',
      message: 'Multiple render-blocking JavaScript files may hurt page speed',
      priority: 'medium',
      category: 'performance'
    });
  }
}

function checkContentQuality(document: Document, issues: SEOIssue[]): void {
  const textContent = document.body?.textContent?.trim();
  const wordCount = textContent ? textContent.split(/\s+/).length : 0;

  if (wordCount < 300) {
    issues.push({
      type: 'warning',
      message: `Low word count (${wordCount} words) - consider adding more valuable content`,
      priority: 'low',
      category: 'content'
    });
  }

  // Check for headings without content
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let emptyHeadings = 0;
  headings.forEach(heading => {
    if (!heading.textContent?.trim()) {
      emptyHeadings++;
    }
  });

  if (emptyHeadings > 0) {
    issues.push({
      type: 'warning',
      message: `${emptyHeadings} empty heading elements found`,
      priority: 'low',
      category: 'content'
    });
  }
}

function generateSEORecommendations(issues: SEOIssue[]): string[] {
  const recommendations: string[] = [];

  if (issues.some(issue => issue.category === 'meta')) {
    recommendations.push('Optimize meta tags (title, description) for better search results');
  }

  if (issues.some(issue => issue.element === 'h1')) {
    recommendations.push('Use a clear, descriptive H1 heading that matches your target keywords');
  }

  if (issues.some(issue => issue.element === 'img')) {
    recommendations.push('Add descriptive alt text to all images for SEO and accessibility');
  }

  if (issues.some(issue => issue.category === 'structure')) {
    recommendations.push('Improve content structure with proper headings and internal links');
  }

  if (issues.some(issue => issue.message.includes('Open Graph'))) {
    recommendations.push('Add Open Graph tags to improve social media sharing');
  }

  if (issues.some(issue => issue.message.includes('structured data'))) {
    recommendations.push('Implement structured data markup for rich search results');
  }

  if (issues.some(issue => issue.category === 'mobile')) {
    recommendations.push('Ensure mobile-friendliness with proper viewport and responsive design');
  }

  if (issues.some(issue => issue.category === 'performance')) {
    recommendations.push('Optimize page speed and Core Web Vitals for better rankings');
  }

  if (issues.some(issue => issue.category === 'content')) {
    recommendations.push('Create high-quality, valuable content with good keyword targeting');
  }

  if (issues.length > 0) {
    recommendations.push('Use tools like Google Search Console to monitor SEO performance');
    recommendations.push('Regularly audit and update your SEO strategy');
  }

  return recommendations;
}