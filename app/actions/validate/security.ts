'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    analyzeSecurity,
    calculateSecurityScore
} from '@/lib/validators/security';

export async function validateSecurity(url: string): Promise<HealthCheckResult> {
    try {
        const issues = await analyzeSecurity(url);
        const score = calculateSecurityScore(issues);

        const highCount = issues.filter(i => i.severity === 'high').length;
        const mediumCount = issues.filter(i => i.severity === 'medium').length;

        const status = highCount > 0 ? 'error' : mediumCount > 0 ? 'warning' : 'success';
        const message = status === 'error'
            ? `Found ${highCount} high severity security issues.`
            : status === 'warning'
                ? `Found ${mediumCount} medium severity security issues.`
                : 'Security headers are well-configured.';

        return {
            id: 'security',
            label: 'Security Headers',
            status,
            score,
            message,
            timestamp: Date.now(),
            details: issues.map(issue => ({
                type: issue.type as 'error' | 'warning' | 'info',
                message: issue.message
            })),
            reportId: `security-${Date.now()}`
        };

    } catch (error) {
        console.error('Security validation error:', error);

        return {
            id: 'security',
            label: 'Security Headers',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: Date.now()
        };
    }
}
