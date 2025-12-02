'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    analyzeContrast,
    calculateContrastScore,
    generateContrastRecommendations
} from '@/lib/validators/contrast';

export async function validateContrast(
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

        const issues = await analyzeContrast(htmlContent);
        const score = calculateContrastScore(issues);

        const errorCount = issues.filter(issue => issue.type === 'error').length;
        const warningCount = issues.filter(issue => issue.type === 'warning').length;
        const totalIssues = errorCount + warningCount;
        timestamp: Date.now(),
            details: issues.slice(0, 15).map(issue => ({
                type: issue.type as 'error' | 'warning' | 'info',
                message: issue.message
            })),
                reportId: `contrast-${Date.now()}`
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
