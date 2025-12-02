'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    analyzeSEO,
    calculateSEOScore,
    generateSEORecommendations
} from '@/lib/validators/seo';

/**
 * Server action to validate SEO of a webpage
 */
export async function validateSEO(
    url: string,
    html?: string
): Promise<HealthCheckResult> {
    try {
        let htmlContent = html;

        if (!htmlContent) {
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

        const issues = await analyzeSEO(htmlContent, url);
        const score = calculateSEOScore(issues);

        const highPriorityCount = issues.filter(issue => issue.priority === 'high').length;
        const mediumPriorityCount = issues.filter(issue => issue.priority === 'medium').length;
        const lowPriorityCount = issues.filter(issue => issue.priority === 'low').length;

        const status = highPriorityCount > 0 ? 'error' : mediumPriorityCount > 2 ? 'warning' : 'success';
        const totalIssues = issues.length;
        const message = totalIssues === 0
            ? 'Excellent SEO optimization - all key factors implemented'
            : `SEO analysis completed - ${highPriorityCount} critical issues, ${mediumPriorityCount + lowPriorityCount} improvements needed`;

        const recommendations = generateSEORecommendations(issues);

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
            dataSource: 'Local Analysis'
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
