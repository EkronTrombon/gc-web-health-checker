'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    analyzeAccessibility,
    calculateAccessibilityScore
} from '@/lib/validators/accessibility';
import {
    runAxeAnalysis,
    isAxeAvailable
} from '@/lib/axe';

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
 * Server action to validate accessibility of a webpage
 * @param url - The URL to validate
 * @param html - Optional HTML content (if already crawled)
 * @returns HealthCheckResult with accessibility analysis
 */
export async function validateAccessibility(
    url: string,
    html?: string
): Promise<HealthCheckResult> {
    try {
        // Check if Axe is available
        const useAxe = isAxeAvailable();

        let score: number;
        let issues: Array<{ type: string; message: string; severity?: 'critical' | 'serious' | 'moderate' | 'minor'; impact?: string; wcagGuideline?: string }>;
        let dataSource: string;

        if (useAxe) {
            // Use Axe for professional accessibility analysis
            console.log('[Accessibility Validator] Using Axe for accessibility analysis');

            try {
                const htmlContent = await getHtmlContent(url, html);
                const axeResult = await runAxeAnalysis(htmlContent, url);
                score = axeResult.score;
                issues = axeResult.issues.map(issue => ({
                    type: issue.type,
                    message: issue.message,
                    severity: (issue.impact || 'moderate') as 'critical' | 'serious' | 'moderate' | 'minor',
                    impact: issue.impact,
                    wcagGuideline: issue.wcagTags?.join(', ')
                }));
                dataSource = 'Axe DevTools';
                console.log(`[Accessibility Validator] Axe returned score: ${score}, issues: ${issues.length}`);
            } catch (axeError) {
                console.warn('[Accessibility Validator] Axe analysis failed, falling back to local analysis:', axeError);
                // Fallback to local analysis
                const htmlContent = await getHtmlContent(url, html);
                issues = await analyzeAccessibility(htmlContent);
                score = calculateAccessibilityScore(issues);
                dataSource = 'Local Analysis (Axe Fallback)';
            }
        } else {
            // Use local analysis
            console.log('[Accessibility Validator] Axe not available, using local analysis');
            const htmlContent = await getHtmlContent(url, html);
            issues = await analyzeAccessibility(htmlContent);
            score = calculateAccessibilityScore(issues);
            dataSource = 'Local Analysis';
        }

        // Count issues by severity
        const criticalCount = issues.filter(issue => issue.severity === 'critical').length;
        const seriousCount = issues.filter(issue => issue.severity === 'serious').length;
        const moderateCount = issues.filter(issue => issue.severity === 'moderate').length;

        // Determine status
        const status = criticalCount > 0 || seriousCount > 0 ? 'error' : moderateCount > 0 ? 'warning' : 'success';

        // Generate message
        const message = status === 'error'
            ? `Found ${criticalCount} critical and ${seriousCount} serious accessibility issues.`
            : status === 'warning'
                ? `Found ${moderateCount} moderate accessibility issues.`
                : 'No significant accessibility issues found.';
        return {
            id: 'accessibility',
            label: 'Accessibility Check',
            status,
            score,
            message,
            timestamp: Date.now(),
            details: issues.slice(0, 20).map(issue => ({
                type: issue.type as 'error' | 'warning' | 'info',
                message: `${issue.message}${issue.wcagGuideline ? ` (${issue.wcagGuideline})` : ''}`
            })),
            reportId: `accessibility-${Date.now()}`,
            dataSource,
            url
        };



    } catch (error) {
        console.error('Accessibility validation error:', error);

        return {
            id: 'accessibility',
            label: 'Accessibility Check',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: Date.now()
        };
    }
}
