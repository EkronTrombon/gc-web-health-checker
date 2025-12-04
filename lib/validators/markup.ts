export interface ValidationError {
    type: string;
    message: string;
    line?: number;
    column?: number;
}

/**
 * Validate HTML markup using W3C Validator API
 */
export async function validateMarkup(html: string): Promise<ValidationError[]> {
    try {
        const validatorResponse = await fetch('https://validator.w3.org/nu/?out=json', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'User-Agent': 'Mozilla/5.0 (compatible; HealthChecker/1.0)'
            },
            body: html,
        });

        if (validatorResponse.ok) {
            const validatorText = await validatorResponse.text();
            const w3cResults = parseW3CResponse(validatorText);

            if (w3cResults.length > 0) {
                return w3cResults;
            }
        }
    } catch (error) {
        console.warn('W3C validator unavailable, using basic validation:', error);
    }

    // Fallback to basic HTML validation
    return validateHTMLBasic(html);
}

/**
 * Calculate markup validation score
 */
export function calculateMarkupScore(details: ValidationError[]): number {
    const errorCount = details.filter(d => d.type === 'error').length;
    const warningCount = details.filter(d => d.type === 'warning').length;

    return Math.max(0, Math.min(100, 100 - (errorCount * 8) - (warningCount * 3)));
}

/**
 * Generate markup validation recommendations
 */
export function generateMarkupRecommendations(details: ValidationError[]): string[] {
    const recommendations: string[] = [];

    if (details.some(d => d.message.includes('alt'))) {
        recommendations.push('Add alt attributes to all img elements for accessibility');
    }

    if (details.some(d => d.message.includes('DOCTYPE'))) {
        recommendations.push('Add a valid HTML5 DOCTYPE declaration');
    }

    if (details.some(d => d.message.includes('unclosed') || d.message.includes('Unclosed'))) {
        recommendations.push('Ensure all HTML elements are properly closed');
    }

    if (details.some(d => d.message.includes('title'))) {
        recommendations.push('Include a descriptive title element in the document head');
    }

    if (details.length > 0) {
        recommendations.push('Use semantic HTML5 elements like <header>, <main>, <footer>');
        recommendations.push('Validate HTML regularly during development');
    }

    return recommendations;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse W3C validator response
 */
function parseW3CResponse(validatorText: string): ValidationError[] {
    const details: ValidationError[] = [];
    const lines = validatorText.split('\n');

    for (const line of lines) {
        if (line.includes('Error:') || line.includes('error:')) {
            const match = line.match(/line (\d+)/i);
            details.push({
                type: 'error',
                message: line.replace(/^.*?Error:\s*/i, '').trim(),
                line: match ? parseInt(match[1]) : undefined
            });
        } else if (line.includes('Warning:') || line.includes('warning:')) {
            const match = line.match(/line (\d+)/i);
            details.push({
                type: 'warning',
                message: line.replace(/^.*?Warning:\s*/i, '').trim(),
                line: match ? parseInt(match[1]) : undefined
            });
        }
    }

    return details;
}

/**
 * Basic HTML validation (fallback when W3C validator is unavailable)
 */
function validateHTMLBasic(html: string): ValidationError[] {
    const details: ValidationError[] = [];

    // Check for basic HTML structure
    if (!html.includes('<!DOCTYPE') && !html.includes('<!doctype')) {
        details.push({
            type: 'error',
            message: 'Missing DOCTYPE declaration'
        });
    }

    if (!html.includes('<html')) {
        details.push({
            type: 'error',
            message: 'Missing html element'
        });
    }

    if (!html.includes('<head>')) {
        details.push({
            type: 'error',
            message: 'Missing head element'
        });
    }

    if (!html.includes('<body>')) {
        details.push({
            type: 'error',
            message: 'Missing body element'
        });
    }

    // Check for unclosed tags (basic check)
    const openTags = html.match(/<[^\/][^>]*>/g) || [];
    const closeTags = html.match(/<\/[^>]*>/g) || [];

    if (openTags.length - closeTags.length > 5) {
        details.push({
            type: 'warning',
            message: 'Potentially unclosed HTML elements detected'
        });
    }

    // Check for images without alt attributes
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    for (const img of imgMatches) {
        if (!img.includes('alt=')) {
            details.push({
                type: 'error',
                message: 'Image element missing alt attribute for accessibility'
            });
        }
    }

    // Check for missing title
    if (!html.includes('<title>')) {
        details.push({
            type: 'error',
            message: 'Missing title element'
        });
    }

    return details;
}
