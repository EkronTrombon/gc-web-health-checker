'use server'

import { HealthCheckResult } from '@/types/crawl';
import { runLighthouse } from '@/lib/validators/lighthouse';

export async function validateLighthouse(url: string, strategy: 'mobile' | 'desktop' = 'desktop'): Promise<HealthCheckResult> {
    console.log(`[validateLighthouse] Starting validation for ${url} with strategy: ${strategy}`);

    try {
        // Run Lighthouse with specified strategy (defaults to desktop)
        const result = await runLighthouse(url, strategy);

        console.log('[validateLighthouse] Received Lighthouse result:', result);

        // Use Performance score as primary metric (matches PageSpeed Insights display)
        const score = result.performance;

        console.log(`[validateLighthouse] Using Performance score as primary: ${score}/100`);

        const status: 'error' | 'warning' | 'success' = score < 50 ? 'error' : score < 90 ? 'warning' : 'success';
        const strategyLabel = strategy.charAt(0).toUpperCase() + strategy.slice(1);
        const message = `Performance score: ${score}/100 (${strategyLabel})`;

        const healthCheckResult: HealthCheckResult = {
            id: 'lighthouse',
            label: 'Lighthouse Audit',
            status,
            score,
            message,
            timestamp: Date.now(),
            details: [
                { type: 'info', message: `Strategy: ${strategyLabel}` },
                { type: 'info', message: `Performance: ${result.performance}/100` },
                { type: 'info', message: `Accessibility: ${result.accessibility}/100` },
                { type: 'info', message: `Best Practices: ${result.bestPractices}/100` },
                { type: 'info', message: `SEO: ${result.seo}/100` }
            ],
            reportId: `lighthouse-${Date.now()}`,
            dataSource: process.env.GOOGLE_PAGESPEED_API_KEY ? `Google PageSpeed Insights (${strategyLabel})` : 'Simulated',
            url
        };

        console.log('[validateLighthouse] Returning HealthCheckResult:', {
            score: healthCheckResult.score,
            status: healthCheckResult.status,
            message: healthCheckResult.message
        });

        return healthCheckResult;

    } catch (error) {
        console.error('[validateLighthouse] Validation error:', error);

        return {
            id: 'lighthouse',
            label: 'Lighthouse Audit',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: Date.now()
        };
    }
}
