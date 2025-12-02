import { JSDOM } from 'jsdom';

export interface AccessibilityIssue {
    type: string;
    message: string;
    element?: string;
    wcagGuideline?: string;
    severity?: 'critical' | 'serious' | 'moderate' | 'minor';
}

/**
 * Analyzes HTML content for accessibility issues
 * @param html - The HTML content to analyze
 * @returns Array of accessibility issues found
 */
export async function analyzeAccessibility(html: string): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    try {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Check for missing alt attributes on images
        checkImageAltText(document, issues);

        // Check form accessibility
        checkFormAccessibility(document, issues);

        // Check heading hierarchy
        checkHeadingHierarchy(document, issues);

        // Check color contrast (basic check)
        checkBasicContrast(document, issues);

        // Check for ARIA attributes and labels
        checkAriaAccessibility(document, issues);

        // Check keyboard accessibility
        checkKeyboardAccessibility(document, issues);

        // Check page structure
        checkPageStructure(document, issues);

        // Check links and buttons
        checkInteractiveElements(document, issues);

    } catch (error) {
        console.error('Error analyzing accessibility:', error);
        issues.push({
            type: 'warning',
            message: 'Unable to complete full accessibility analysis',
            severity: 'moderate'
        });
    }

    return issues;
}

/**
 * Calculate accessibility score based on issues
 */
export function calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
    const criticalCount = issues.filter(issue => issue.severity === 'critical').length;
    const seriousCount = issues.filter(issue => issue.severity === 'serious').length;
    const moderateCount = issues.filter(issue => issue.severity === 'moderate').length;
    const minorCount = issues.filter(issue => issue.severity === 'minor').length;

    // Calculate score based on severity (adjusted for more realistic scoring)
    return Math.max(0, Math.min(100, 100 - (criticalCount * 10) - (seriousCount * 6) - (moderateCount * 3) - (minorCount * 1)));
}

/**
 * Generate recommendations based on issues found
 */
export function generateAccessibilityRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(issue => issue.message.includes('alt'))) {
        recommendations.push('Add descriptive alt attributes to all images for screen readers');
    }

    if (issues.some(issue => issue.message.includes('label'))) {
        recommendations.push('Associate all form controls with clear, descriptive labels');
    }

    if (issues.some(issue => issue.message.includes('heading'))) {
        recommendations.push('Use proper heading hierarchy (h1, h2, h3, etc.) for page structure');
    }

    if (issues.some(issue => issue.message.includes('keyboard'))) {
        recommendations.push('Ensure all interactive elements are keyboard accessible');
    }

    if (issues.some(issue => issue.message.includes('contrast'))) {
        recommendations.push('Improve color contrast to meet WCAG standards');
    }

    if (issues.some(issue => issue.message.includes('ARIA'))) {
        recommendations.push('Use ARIA attributes correctly and reference valid IDs');
    }

    if (issues.length > 0) {
        recommendations.push('Test with screen readers and keyboard-only navigation');
        recommendations.push('Use automated accessibility testing tools in your development workflow');
        recommendations.push('Consider user testing with people who use assistive technologies');
    }

    return recommendations;
}

// ============================================================================
// Check Functions
// ============================================================================

function checkImageAltText(document: Document, issues: AccessibilityIssue[]): void {
    const images = document.querySelectorAll('img');

    images.forEach((img) => {
        const alt = img.getAttribute('alt');
        const src = img.getAttribute('src');

        if (alt === null) {
            issues.push({
                type: 'error',
                message: `Image missing alt attribute (src: ${src?.substring(0, 50) || 'unknown'})`,
                element: 'img',
                wcagGuideline: 'WCAG 1.1.1 - Non-text Content',
                severity: 'critical'
            });
        } else if (alt === '') {
            // Empty alt is okay for decorative images, but check if it's likely decorative
            if (src && !src.includes('icon') && !src.includes('decoration')) {
                issues.push({
                    type: 'warning',
                    message: `Image has empty alt attribute - ensure this is decorative (src: ${src.substring(0, 50)})`,
                    element: 'img',
                    wcagGuideline: 'WCAG 1.1.1 - Non-text Content',
                    severity: 'minor'
                });
            }
        } else if (alt.length > 125) {
            issues.push({
                type: 'warning',
                message: 'Alt text is very long - consider shorter, more concise description',
                element: 'img',
                wcagGuideline: 'WCAG 1.1.1 - Non-text Content',
                severity: 'minor'
            });
        }
    });
}

function checkFormAccessibility(document: Document, issues: AccessibilityIssue[]): void {
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach((input) => {
        const id = input.getAttribute('id');
        const type = input.getAttribute('type');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');

        // Skip hidden inputs
        if (type === 'hidden') return;

        // Check if input has a label
        let hasLabel = false;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) hasLabel = true;
        }

        if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
            issues.push({
                type: 'error',
                message: `Form ${input.tagName.toLowerCase()} missing label or aria-label`,
                element: input.tagName.toLowerCase(),
                wcagGuideline: 'WCAG 1.3.1 - Info and Relationships',
                severity: 'serious'
            });
        }

        // Check for required fields without indication
        if (input.hasAttribute('required')) {
            const ariaRequired = input.getAttribute('aria-required');
            if (!ariaRequired) {
                issues.push({
                    type: 'warning',
                    message: 'Required field should have aria-required="true" attribute',
                    element: input.tagName.toLowerCase(),
                    wcagGuideline: 'WCAG 3.3.2 - Labels or Instructions',
                    severity: 'moderate'
                });
            }
        }
    });
}

function checkHeadingHierarchy(document: Document, issues: AccessibilityIssue[]): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels: number[] = [];

    headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));
        headingLevels.push(level);
    });

    if (headingLevels.length === 0) {
        issues.push({
            type: 'warning',
            message: 'No heading elements found - page structure may be unclear',
            wcagGuideline: 'WCAG 1.3.1 - Info and Relationships',
            severity: 'moderate'
        });
        return;
    }

    if (!headingLevels.includes(1)) {
        issues.push({
            type: 'error',
            message: 'Page missing h1 heading - should have exactly one h1',
            element: 'h1',
            wcagGuideline: 'WCAG 1.3.1 - Info and Relationships',
            severity: 'serious'
        });
    }

    // Check for skipped heading levels
    for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i];
        const prevLevel = headingLevels[i - 1];

        if (currentLevel > prevLevel + 1) {
            issues.push({
                type: 'warning',
                message: `Heading hierarchy skip detected: h${prevLevel} followed by h${currentLevel}`,
                element: `h${currentLevel}`,
                wcagGuideline: 'WCAG 1.3.1 - Info and Relationships',
                severity: 'moderate'
            });
        }
    }
}

function checkBasicContrast(document: Document, issues: AccessibilityIssue[]): void {
    // This is a basic check - the dedicated contrast API does the detailed analysis
    const style = document.querySelector('style');
    const styleContent = style?.textContent || '';

    if (styleContent.includes('#999') || styleContent.includes('#666') || styleContent.includes('color: gray')) {
        issues.push({
            type: 'warning',
            message: 'Detected potentially low contrast colors in CSS',
            wcagGuideline: 'WCAG 1.4.3 - Contrast (Minimum)',
            severity: 'moderate'
        });
    }
}

function checkAriaAccessibility(document: Document, issues: AccessibilityIssue[]): void {
    // Check for ARIA landmarks
    const landmarks = document.querySelectorAll('[role="main"], [role="banner"], [role="navigation"], [role="contentinfo"], main, nav, header, footer');

    if (landmarks.length === 0) {
        issues.push({
            type: 'warning',
            message: 'No ARIA landmarks or semantic HTML5 elements found',
            wcagGuideline: 'WCAG 1.3.1 - Info and Relationships',
            severity: 'moderate'
        });
    }

    // Check for invalid ARIA attributes
    const elementsWithAria = document.querySelectorAll('[aria-labelledby], [aria-describedby]');
    elementsWithAria.forEach((element) => {
        const labelledBy = element.getAttribute('aria-labelledby');
        const describedBy = element.getAttribute('aria-describedby');

        if (labelledBy && !document.getElementById(labelledBy)) {
            issues.push({
                type: 'error',
                message: `aria-labelledby references non-existent ID: ${labelledBy}`,
                element: element.tagName.toLowerCase(),
                wcagGuideline: 'WCAG 1.3.1 - Info and Relationships',
                severity: 'serious'
            });
        }

        if (describedBy && !document.getElementById(describedBy)) {
            issues.push({
                type: 'error',
                message: `aria-describedby references non-existent ID: ${describedBy}`,
                element: element.tagName.toLowerCase(),
                wcagGuideline: 'WCAG 1.3.1 - Info and Relationships',
                severity: 'serious'
            });
        }
    });
}

function checkKeyboardAccessibility(document: Document, issues: AccessibilityIssue[]): void {
    // Check for interactive elements without proper keyboard support
    const interactiveElements = document.querySelectorAll('div[onclick], span[onclick], p[onclick]');

    interactiveElements.forEach((element) => {
        const tabindex = element.getAttribute('tabindex');
        const role = element.getAttribute('role');

        if (!tabindex && role !== 'button') {
            issues.push({
                type: 'error',
                message: `Interactive ${element.tagName.toLowerCase()} element not keyboard accessible`,
                element: element.tagName.toLowerCase(),
                wcagGuideline: 'WCAG 2.1.1 - Keyboard',
                severity: 'serious'
            });
        }
    });

    // Check for positive tabindex values
    const positiveTabindex = document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
    if (positiveTabindex.length > 0) {
        issues.push({
            type: 'warning',
            message: 'Avoid positive tabindex values - use logical DOM order instead',
            wcagGuideline: 'WCAG 2.4.3 - Focus Order',
            severity: 'moderate'
        });
    }
}

function checkPageStructure(document: Document, issues: AccessibilityIssue[]): void {
    // Check for page language
    const html = document.documentElement;
    const lang = html.getAttribute('lang');

    if (!lang) {
        issues.push({
            type: 'error',
            message: 'HTML element missing lang attribute',
            element: 'html',
            wcagGuideline: 'WCAG 3.1.1 - Language of Page',
            severity: 'serious'
        });
    }

    // Check for page title
    const title = document.querySelector('title');
    if (!title || !title.textContent?.trim()) {
        issues.push({
            type: 'error',
            message: 'Page missing descriptive title',
            element: 'title',
            wcagGuideline: 'WCAG 2.4.2 - Page Titled',
            severity: 'serious'
        });
    }
}

function checkInteractiveElements(document: Document, issues: AccessibilityIssue[]): void {
    // Check links
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
        const href = link.getAttribute('href');
        const textContent = link.textContent?.trim();

        if (!href || href === '#') {
            issues.push({
                type: 'warning',
                message: 'Link missing href or has empty href',
                element: 'a',
                wcagGuideline: 'WCAG 2.1.1 - Keyboard',
                severity: 'moderate'
            });
        }

        if (!textContent && !link.getAttribute('aria-label')) {
            issues.push({
                type: 'error',
                message: 'Link has no accessible text content',
                element: 'a',
                wcagGuideline: 'WCAG 2.4.4 - Link Purpose (In Context)',
                severity: 'serious'
            });
        }

        if (textContent && (textContent.toLowerCase().includes('click here') || textContent.toLowerCase().includes('read more'))) {
            issues.push({
                type: 'warning',
                message: 'Link text is not descriptive - avoid "click here" or "read more"',
                element: 'a',
                wcagGuideline: 'WCAG 2.4.4 - Link Purpose (In Context)',
                severity: 'minor'
            });
        }
    });

    // Check buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button) => {
        const textContent = button.textContent?.trim();

        if (!textContent && !button.getAttribute('aria-label')) {
            issues.push({
                type: 'error',
                message: 'Button has no accessible text content',
                element: 'button',
                wcagGuideline: 'WCAG 4.1.2 - Name, Role, Value',
                severity: 'serious'
            });
        }
    });
}
