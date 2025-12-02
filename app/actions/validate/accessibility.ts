'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    analyzeAccessibility,
    calculateAccessibilityScore,
    generateAccessibilityRecommendations
} from '@/lib/validators/accessibility';

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
        // Get HTML if not provided
        let htmlContent = html;

        if (!htmlContent) {
            // Crawl the URL to get HTML
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
            htmlContent = crawlData.data?.html;

            if (!htmlContent) {
                throw new Error('No HTML content found to validate');
            }
        }

        // Perform accessibility analysis
        const issues = await analyzeAccessibility(htmlContent);

        // Calculate score
        const score = calculateAccessibilityScore(issues);

        // Count issues by severity
        const criticalCount = issues.filter(issue => issue.severity === 'critical').length;
        const seriousCount = issues.filter(issue => issue.severity === 'serious').length;
        const moderateCount = issues.filter(issue => issue.severity === 'moderate').length;
        const minorCount = issues.filter(issue => issue.severity === 'minor').length;

        // Determine status
        const status = criticalCount > 0 || seriousCount > 0 ? 'error' : moderateCount > 0 ? 'warning' : 'success';

        // Generate message
        const totalIssues = issues.length;
        const message = totalIssues === 0
            ? 'No accessibility violations detected - WCAG compliant'
            : `Found ${totalIssues} accessibility violations: ${criticalCount} critical, ${seriousCount} serious, ${moderateCount} moderate, ${minorCount} minor`;

        // Generate recommendations
        const recommendations = generateAccessibilityRecommendations(issues);

        // Create result
        const result: HealthCheckResult = {
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
            reportId: `accessibility-${Date.now()}`
        };

        return result;

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
