'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    runLighthouse,
    calculateLighthouseScore,
    generateLighthouseRecommendations
} from '@/lib/validators/lighthouse';

export async function validateLighthouse(url: string): Promise<HealthCheckResult> {
    try {
        const result = await runLighthouse(url);
        const score = calculateLighthouseScore(result);

        const status = score >= 90 ? 'success' : score >= 50 ? 'warning' : 'error';
        const message = `Lighthouse Score: ${score}/100 (Performance: ${result.performance}, Accessibility: ${result.accessibility}, Best Practices: ${result.bestPractices}, SEO: ${result.seo})`;

        const recommendations = generateLighthouseRecommendations(result);

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
