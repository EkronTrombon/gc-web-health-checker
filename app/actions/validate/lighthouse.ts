'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    runLighthouse,
    calculateLighthouseScore
} from '@/lib/validators/lighthouse';

export async function validateLighthouse(url: string): Promise<HealthCheckResult> {
    try {
        const result = await runLighthouse(url);
        const score = calculateLighthouseScore(result);

        const status = score < 50 ? 'error' : score < 90 ? 'warning' : 'success';
        const message = `Lighthouse score: ${score}/100`;

        return {
            id: 'lighthouse',
            label: 'Lighthouse Audit',
            status,
            score,
            message,
            timestamp: Date.now(),
            details: [
                { type: 'info', message: `Performance: ${result.performance}/100` },
                { type: 'info', message: `Accessibility: ${result.accessibility}/100` },
                { type: 'info', message: `Best Practices: ${result.bestPractices}/100` },
                { type: 'info', message: `SEO: ${result.seo}/100` }
            ],
            reportId: `lighthouse-${Date.now()}`,
            dataSource: process.env.GOOGLE_PAGESPEED_API_KEY ? 'Google PageSpeed Insights' : 'Simulated'
        };

    } catch (error) {
        console.error('Lighthouse validation error:', error);

        return {
            id: 'lighthouse',
            label: 'Lighthouse Audit',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: Date.now()
        };
    }
}
