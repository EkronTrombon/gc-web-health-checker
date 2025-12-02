export interface SecurityIssue {
    type: string;
    message: string;
    severity?: 'high' | 'medium' | 'low';
    category?: string;
}

/**
 * Analyze security headers and basic security practices
 */
export async function analyzeSecurity(url: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    try {
        const response = await fetch(url, { method: 'HEAD' });
        const headers = response.headers;

        // Check security headers
        if (!headers.get('strict-transport-security')) {
            issues.push({
                type: 'warning',
                message: 'Missing Strict-Transport-Security header - HTTPS connections not enforced',
                severity: 'high',
                category: 'headers'
            });
        }

        if (!headers.get('x-content-type-options')) {
            issues.push({
                type: 'warning',
                message: 'Missing X-Content-Type-Options header - vulnerable to MIME sniffing attacks',
                severity: 'medium',
                category: 'headers'
            });
        }

        if (!headers.get('x-frame-options') && !headers.get('content-security-policy')) {
            issues.push({
                type: 'warning',
                message: 'Missing X-Frame-Options or CSP frame-ancestors - vulnerable to clickjacking',
                severity: 'high',
                category: 'headers'
            });
        }

        if (!headers.get('content-security-policy')) {
            issues.push({
                type: 'warning',
                message: 'Missing Content-Security-Policy header - no XSS protection',
                severity: 'high',
                category: 'headers'
            });
        }

        if (!headers.get('referrer-policy')) {
            issues.push({
                type: 'warning',
                message: 'Missing Referrer-Policy header - may leak sensitive information',
                severity: 'low',
                category: 'headers'
            });
        }

        if (!headers.get('permissions-policy')) {
            issues.push({
                type: 'info',
                message: 'Missing Permissions-Policy header - consider restricting browser features',
                severity: 'low',
                category: 'headers'
            });
        }

    } catch (error) {
        console.error('Error analyzing security:', error);
        issues.push({
            type: 'error',
            message: 'Unable to fetch security headers - check if URL is accessible',
            severity: 'high'
        });
    }

    return issues;
}

export function calculateSecurityScore(issues: SecurityIssue[]): number {
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    return Math.max(0, Math.min(100, 100 - (highCount * 15) - (mediumCount * 8) - (lowCount * 3)));
}

export function generateSecurityRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.message.includes('Strict-Transport-Security'))) {
        recommendations.push('Enable HSTS to enforce HTTPS connections');
    }

    if (issues.some(i => i.message.includes('Content-Security-Policy'))) {
        recommendations.push('Implement a Content Security Policy to prevent XSS attacks');
    }

    if (issues.some(i => i.message.includes('X-Frame-Options'))) {
        recommendations.push('Add X-Frame-Options or CSP frame-ancestors to prevent clickjacking');
    }

    if (issues.length > 0) {
        recommendations.push('Review and implement all recommended security headers');
        recommendations.push('Regularly audit security configurations');
        recommendations.push('Consider using security scanning tools in your CI/CD pipeline');
    }

    return recommendations;
}
