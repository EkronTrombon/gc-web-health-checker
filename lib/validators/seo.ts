import { JSDOM } from 'jsdom';

export interface SEOIssue {
    type: string;
    message: string;
    element?: string;
    priority?: 'high' | 'medium' | 'low';
    category?: 'meta' | 'content' | 'structure' | 'performance' | 'mobile';
}

/**
 * Analyzes HTML content for SEO issues
 * @param html - The HTML content to analyze
 * @returns Array of SEO issues found
 */
export async function analyzeSEO(html: string): Promise<SEOIssue[]> {
    const issues: SEOIssue[] = [];

    try {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        checkTitle(document, issues);
        checkMetaDescription(document, issues);
        checkMetaKeywords(document, issues);
        checkHeadingsForSEO(document, issues);
        checkImagesForSEO(document, issues);
        checkInternalLinking(document, issues);
        checkOpenGraph(document, issues);
        checkTwitterCards(document, issues);
        checkStructuredData(document, issues);
        checkCanonical(document, issues);
        checkMobileFriendliness(document, issues);
        checkPerformanceForSEO(html, issues);
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

/**
 * Calculate SEO score based on issues
 */
export function calculateSEOScore(issues: SEOIssue[]): number {
    const highPriorityCount = issues.filter(issue => issue.priority === 'high').length;
    const mediumPriorityCount = issues.filter(issue => issue.priority === 'medium').length;
    const lowPriorityCount = issues.filter(issue => issue.priority === 'low').length;

    let score = 100;
    score -= (highPriorityCount * 12);
    score -= (mediumPriorityCount * 5);
    score -= (lowPriorityCount * 2);

    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate SEO recommendations
 */
export function generateSEORecommendations(issues: SEOIssue[]): string[] {
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

// Check functions (extracted from route.ts)
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
}

function checkImagesForSEO(document: Document, issues: SEOIssue[]): void {
    const images = document.querySelectorAll('img');
    let imagesWithoutAlt = 0;

    images.forEach(img => {
        const alt = img.getAttribute('alt');
        if (!alt && alt !== '') {
            imagesWithoutAlt++;
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
}

function checkInternalLinking(document: Document, issues: SEOIssue[]): void {
    const links = document.querySelectorAll('a[href]');
    let internalLinks = 0;

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href?.startsWith('/') || href?.startsWith('./')) {
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

function checkCanonical(document: Document, issues: SEOIssue[]): void {
    const canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical) {
        issues.push({
            type: 'warning',
            message: 'Missing canonical URL - helps prevent duplicate content issues',
            element: 'link[rel="canonical"]',
            priority: 'medium',
            category: 'meta'
        });
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
    }
}

function checkPerformanceForSEO(html: string, issues: SEOIssue[]): void {
    const renderBlockingCSS = (html.match(/<link[^>]*rel="stylesheet"/g) || []).length;

    if (renderBlockingCSS > 3) {
        issues.push({
            type: 'warning',
            message: 'Multiple render-blocking CSS files may hurt Core Web Vitals',
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
}
