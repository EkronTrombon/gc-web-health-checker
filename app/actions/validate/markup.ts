'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    validateMarkup,
    calculateMarkupScore
} from '@/lib/validators/markup';

/**
 * Server action to validate HTML markup
 */
export async function validateHTMLMarkup(
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

        const details = await validateMarkup(htmlContent);
        const score = calculateMarkupScore(details);

        const errorCount = details.filter(d => d.type === 'error').length;
        const warningCount = details.filter(d => d.type === 'warning').length;

        const status = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';
        const message = status === 'error'
            ? `Found ${errorCount} markup errors.`
            : status === 'warning'
                ? `Found ${warningCount} markup warnings.`
                : 'HTML markup is valid.';

        return {
            id: 'markup',
            label: 'W3C Markup Validation',
            status,
            score,
            message,
            timestamp: Date.now(),
            details: details.slice(0, 20).map(detail => ({
                type: detail.type as 'error' | 'warning' | 'info',
                message: detail.line ? `Line ${detail.line}: ${detail.message}` : detail.message
            })),
            reportId: `markup-${Date.now()}`
        };

    } catch (error) {
        console.error('Markup validation error:', error);

        return {
            id: 'markup',
            label: 'W3C Markup Validation',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: Date.now()
        };
    }
}
