'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    analyzeSEO,
    calculateSEOScore
} from '@/lib/validators/seo';
import {
    getOnPageScore,
    isDataForSEOConfigured
} from '@/lib/dataforseo';

/**
 * Helper function to fetch HTML content for validation
 */
async function getHtmlContent(url: string, providedHtml?: string): Promise<string> {
    if (providedHtml) {
        return providedHtml;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const crawlResponse = await fetch(`${baseUrl}/api/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });

    if (!crawlResponse.ok) {
        throw new Error('Failed to crawl URL for validation');
    }

    const crawlData = await crawlResponse.json();
    const htmlContent = crawlData.data?.html;

    if (!htmlContent) {
        throw new Error('No HTML content found to validate');
    }

    return htmlContent;
}

/**
 * Server action to validate SEO of a webpage
 */
export async function validateSEO(
    url: string,
    html?: string
): Promise<HealthCheckResult> {
    try {
        // Check if DataForSEO is configured
        const useDataForSEO = isDataForSEOConfigured();

        let score: number;
        let issues: Array<{ type: string; message: string; element?: string; priority?: 'high' | 'medium' | 'low' }>;
        let dataSource: string;

        if (useDataForSEO) {
            // Use DataForSEO API for professional analysis
            console.log('[SEO Validator] Using DataForSEO API for analysis');

            try {
                const dataForSEOResult = await getOnPageScore(url);
                score = dataForSEOResult.score;
                issues = dataForSEOResult.issues;
                dataSource = 'DataForSEO API';
                console.log(`[SEO Validator] DataForSEO returned score: ${score}`);
            } catch (apiError) {
                console.warn('[SEO Validator] DataForSEO API failed, falling back to local analysis:', apiError);
                // Fallback to local analysis
                const htmlContent = await getHtmlContent(url, html);
                issues = await analyzeSEO(htmlContent);
                score = calculateSEOScore(issues);
                dataSource = 'Local Analysis (API Fallback)';
            }
        } else {
            // Use local JSDOM analysis
            console.log('[SEO Validator] DataForSEO not configured, using local analysis');
            const htmlContent = await getHtmlContent(url, html);
            issues = await analyzeSEO(htmlContent);
            score = calculateSEOScore(issues);
            dataSource = 'Local Analysis';
        }

        const highPriorityCount = issues.filter(issue => issue.priority === 'high').length;
        const mediumPriorityCount = issues.filter(issue => issue.priority === 'medium').length;

        const status = highPriorityCount > 0 ? 'error' : mediumPriorityCount > 0 ? 'warning' : 'success';
        const message = status === 'error'
            ? `Found ${highPriorityCount} high priority SEO issues.`
            : status === 'warning'
                ? `Found ${mediumPriorityCount} medium priority SEO issues.`
                : 'SEO is well-optimized.';

        return {
            id: 'seo',
            label: 'SEO Analysis',
            status,
            score,
            message,
            timestamp: Date.now(),
            details: issues.slice(0, 15).map(issue => ({
                type: issue.type as 'error' | 'warning' | 'info',
                message: issue.message
            })),
            reportId: `seo-${Date.now()}`,
            dataSource,
            url
        };

    } catch (error) {
        console.error('SEO validation error:', error);

        return {
            id: 'seo',
            label: 'SEO Analysis',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: Date.now()
        };
    }
}
