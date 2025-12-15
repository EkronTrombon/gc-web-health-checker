'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    analyzeContrast,
    calculateContrastScore
} from '@/lib/validators/contrast';
import {
    runAxeContrastAnalysis,
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

export async function validateContrast(
    url: string,
    html?: string
): Promise<HealthCheckResult> {
    try {
        // Check if Axe is available
        const useAxe = isAxeAvailable();

        let score: number;
        let issues: Array<{ type: string; message: string; element?: string; impact?: string }>;
        let dataSource: string;

        if (useAxe) {
            // Use Axe for professional contrast analysis
            console.log('[Contrast Validator] Using Axe for contrast analysis');

            try {
                const htmlContent = await getHtmlContent(url, html);
                const axeResult = await runAxeContrastAnalysis(htmlContent, url);
                score = axeResult.score;
                issues = axeResult.issues;
                dataSource = 'Axe DevTools';
                console.log(`[Contrast Validator] Axe returned score: ${score}, issues: ${issues.length}`);
            } catch (axeError) {
                console.warn('[Contrast Validator] Axe analysis failed, falling back to local analysis:', axeError);
                // Fallback to local analysis
                const htmlContent = await getHtmlContent(url, html);
                issues = await analyzeContrast(htmlContent);
                score = calculateContrastScore(issues);
                dataSource = 'Local Analysis (Axe Fallback)';
            }
        } else {
            // Use local analysis
            console.log('[Contrast Validator] Axe not available, using local analysis');
            const htmlContent = await getHtmlContent(url, html);
            issues = await analyzeContrast(htmlContent);
            score = calculateContrastScore(issues);
            dataSource = 'Local Analysis';
        }

        const errorCount = issues.filter(issue => issue.type === 'error').length;
        const warningCount = issues.filter(issue => issue.type === 'warning').length;

        const status = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';
        const message = status === 'error'
            ? `Found ${errorCount} contrast errors.`
            : status === 'warning'
                ? `Found ${warningCount} contrast warnings.`
                : 'Contrast is good.';

        return {
            id: 'contrast',
            label: 'Contrast Checker',
            status,
            score,
            message,
            timestamp: Date.now(),
            details: issues.slice(0, 15).map(issue => ({
                type: issue.type as 'error' | 'warning' | 'info',
                message: issue.message
            })),
            reportId: `contrast-${Date.now()}`,
            dataSource,
            url
        };

    } catch (error) {
        console.error('Contrast validation error:', error);

        return {
            id: 'contrast',
            label: 'Contrast Checker',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: Date.now()
        };
    }
}
