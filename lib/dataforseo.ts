/**
 * DataForSEO API Integration
 * Documentation: https://docs.dataforseo.com/v3/on_page/overview/
 */

interface DataForSEOCredentials {
  login: string;
  password: string;
}

interface OnPageTask {
  url: string;
  max_crawl_pages?: number;
  enable_javascript?: boolean;
  load_resources?: boolean;
  enable_browser_rendering?: boolean;
}

interface DataForSEOResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    id: string;
    status_code: number;
    status_message: string;
    result?: any[];
  }>;
}

interface SEOMetrics {
  onPageScore?: number;
  checks?: {
    meta?: {
      title?: { length: number; content: string };
      description?: { length: number; content: string };
      canonical?: string;
      h1?: string[];
      viewport?: string;
    };
    images?: {
      total: number;
      withoutAlt: number;
      brokenImages: number;
    };
    links?: {
      internal: number;
      external: number;
      broken: number;
    };
    content?: {
      size: number;
      wordCount: number;
      ratios?: {
        text_to_html: number;
      };
    };
    performance?: {
      loadTime?: number;
      domContentLoaded?: number;
      totalSize?: number;
    };
  };
  issues?: Array<{
    type: string;
    message: string;
    element?: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Get DataForSEO credentials from environment variables
 */
function getCredentials(): DataForSEOCredentials {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured. Please set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in your .env.local file');
  }

  return { login, password };
}

/**
 * Make authenticated request to DataForSEO API
 */
async function makeDataForSEORequest(
  endpoint: string,
  data?: any
): Promise<DataForSEOResponse> {
  const credentials = getCredentials();
  const auth = Buffer.from(`${credentials.login}:${credentials.password}`).toString('base64');

  const response = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Perform instant on-page SEO analysis using DataForSEO
 * This uses the instant endpoint for immediate results
 */
export async function analyzePageSEO(url: string): Promise<SEOMetrics> {
  try {
    // Use DataForSEO's Instant Pages endpoint for immediate analysis
    const response = await makeDataForSEORequest('on_page/instant_pages', [
      {
        url: url,
        enable_javascript: true,
        enable_browser_rendering: true,
        load_resources: true,
      }
    ]);

    if (response.status_code !== 20000) {
      throw new Error(`DataForSEO API error: ${response.status_message}`);
    }

    const task = response.tasks?.[0];
    if (!task || !task.result || task.result.length === 0) {
      throw new Error('No results returned from DataForSEO');
    }

    const pageData = task.result[0];

    // Extract and format SEO metrics
    return extractSEOMetrics(pageData);

  } catch (error) {
    console.error('DataForSEO analysis error:', error);
    throw error;
  }
}

/**
 * Get on-page SEO score and recommendations
 */
export async function getOnPageScore(url: string): Promise<{
  score: number;
  checks: any;
  issues: any[];
}> {
  try {
    const response = await makeDataForSEORequest('on_page/instant_pages', [
      {
        url: url,
        enable_javascript: true,
        enable_browser_rendering: true,
      }
    ]);

    if (response.status_code !== 20000) {
      throw new Error(`DataForSEO API error: ${response.status_message}`);
    }

    const task = response.tasks?.[0];
    const pageData = task?.result?.[0];

    if (!pageData) {
      throw new Error('No page data returned');
    }

    // Extract checks and calculate score
    const checks = pageData.onpage_score || pageData.checks || {};
    const issues = extractIssuesFromChecks(pageData);

    // Calculate score (DataForSEO might provide on_page_score)
    const score = pageData.onpage_score || calculateScoreFromChecks(checks);

    return {
      score,
      checks,
      issues,
    };

  } catch (error) {
    console.error('Error getting on-page score:', error);
    throw error;
  }
}

/**
 * Extract SEO metrics from DataForSEO response
 */
function extractSEOMetrics(pageData: any): SEOMetrics {
  const metrics: SEOMetrics = {
    onPageScore: pageData.onpage_score,
    checks: {
      meta: {
        title: pageData.meta?.title,
        description: pageData.meta?.description,
        canonical: pageData.meta?.canonical,
        h1: pageData.meta?.htags?.h1 || [],
        viewport: pageData.meta?.viewport,
      },
      images: {
        total: pageData.meta?.images || 0,
        withoutAlt: pageData.checks?.no_image_alt || 0,
        brokenImages: pageData.broken?.images || 0,
      },
      links: {
        internal: pageData.meta?.internal_links_count || 0,
        external: pageData.meta?.external_links_count || 0,
        broken: pageData.broken?.links || 0,
      },
      content: {
        size: pageData.meta?.content?.plain_text_size || 0,
        wordCount: pageData.meta?.content?.plain_text_word_count || 0,
        ratios: {
          text_to_html: pageData.meta?.content?.text_to_html_ratio || 0,
        },
      },
      performance: {
        loadTime: pageData.page_timing?.time_to_interactive,
        domContentLoaded: pageData.page_timing?.dom_complete,
        totalSize: pageData.total_transfer_size,
      },
    },
    issues: extractIssuesFromChecks(pageData),
  };

  return metrics;
}

/**
 * Extract SEO issues from DataForSEO checks
 */
function extractIssuesFromChecks(pageData: any): Array<{
  type: string;
  message: string;
  element?: string;
  priority?: 'high' | 'medium' | 'low';
}> {
  const issues: Array<{
    type: string;
    message: string;
    element?: string;
    priority?: 'high' | 'medium' | 'low';
  }> = [];

  // Check for common SEO issues from DataForSEO response
  const checks = pageData.checks || {};
  const meta = pageData.meta || {};

  // Title issues
  if (!meta.title || meta.title.length === 0) {
    issues.push({
      type: 'error',
      message: 'Missing page title',
      element: 'title',
      priority: 'high',
    });
  } else if (meta.title.length < 30) {
    issues.push({
      type: 'warning',
      message: `Title too short (${meta.title.length} chars)`,
      element: 'title',
      priority: 'medium',
    });
  } else if (meta.title.length > 60) {
    issues.push({
      type: 'warning',
      message: `Title too long (${meta.title.length} chars)`,
      element: 'title',
      priority: 'medium',
    });
  }

  // Meta description
  if (!meta.description || meta.description.length === 0) {
    issues.push({
      type: 'error',
      message: 'Missing meta description',
      element: 'meta[name="description"]',
      priority: 'high',
    });
  }

  // H1 check
  const h1Count = meta.htags?.h1?.length || 0;
  if (h1Count === 0) {
    issues.push({
      type: 'error',
      message: 'Missing H1 heading',
      element: 'h1',
      priority: 'high',
    });
  } else if (h1Count > 1) {
    issues.push({
      type: 'warning',
      message: `Multiple H1 tags found (${h1Count})`,
      element: 'h1',
      priority: 'medium',
    });
  }

  // Image alt text
  if (checks.no_image_alt && checks.no_image_alt > 0) {
    issues.push({
      type: 'warning',
      message: `${checks.no_image_alt} images missing alt text`,
      element: 'img',
      priority: 'high',
    });
  }

  // Canonical
  if (!meta.canonical) {
    issues.push({
      type: 'warning',
      message: 'Missing canonical URL',
      element: 'link[rel="canonical"]',
      priority: 'medium',
    });
  }

  // Viewport
  if (!meta.viewport) {
    issues.push({
      type: 'error',
      message: 'Missing viewport meta tag',
      element: 'meta[name="viewport"]',
      priority: 'high',
    });
  }

  // Low content
  const wordCount = meta.content?.plain_text_word_count || 0;
  if (wordCount < 300) {
    issues.push({
      type: 'warning',
      message: `Low word count (${wordCount} words)`,
      priority: 'low',
    });
  }

  // Broken links
  if (pageData.broken?.links > 0) {
    issues.push({
      type: 'error',
      message: `${pageData.broken.links} broken links found`,
      priority: 'high',
    });
  }

  return issues;
}

/**
 * Calculate SEO score from checks (0-100)
 */
function calculateScoreFromChecks(checks: any): number {
  let score = 100;
  let deductions = 0;

  // Count various issues and deduct points
  if (checks.no_title) deductions += 20;
  if (checks.no_description) deductions += 15;
  if (checks.no_h1) deductions += 15;
  if (checks.no_image_alt) deductions += (Math.min(checks.no_image_alt, 5) * 2);
  if (checks.duplicate_title) deductions += 10;
  if (checks.duplicate_description) deductions += 10;
  if (checks.no_canonical) deductions += 8;
  if (checks.no_viewport) deductions += 12;

  score -= deductions;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Check if DataForSEO API is configured
 */
export function isDataForSEOConfigured(): boolean {
  return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

/**
 * Get DataForSEO API usage statistics
 */
export async function getAPIUsage(): Promise<any> {
  try {
    const response = await makeDataForSEORequest('appendix/user_data');
    return response;
  } catch (error) {
    console.error('Error fetching API usage:', error);
    return null;
  }
}
