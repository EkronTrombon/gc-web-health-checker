'use server'

import { HealthCheckResult } from '@/types/crawl';
import {
    analyzeSecurity,
    calculateSecurityScore,
    generateSecurityRecommendations
} from '@/lib/validators/security';

export async function validateSecurity(url: string): Promise<HealthCheckResult> {
    try {
        const issues = await analyzeSecurity(url);
        const score = calculateSecurityScore(issues);

        const highCount = issues.filter(i => i.severity === 'high').length;
        const mediumCount = issues.filter(i => i.severity === 'medium').length;
        const lowCount = issues.filter(i => i.severity === 'low').length;
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
