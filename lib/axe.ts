import { JSDOM } from 'jsdom';
import axe from 'axe-core';

// Type definition for window with axe injected
interface WindowWithAxe extends Window {
    axe: {
        run: (doc: Document, options: unknown) => Promise<{
            violations: Array<{
                id: string;
                impact?: string;
                help: string;
                description: string;
                tags: string[];
                nodes: Array<{
                    html?: string;
                    failureSummary?: string;
                    any?: Array<{ data?: { contrastRatio?: number; expectedContrastRatio?: string } }>;
                }>;
            }>;
            passes: unknown[];
            incomplete: Array<{
                help: string;
                tags: string[];
            }>;
        }>;
    };
}

export interface AxeIssue {
    type: 'error' | 'warning' | 'info';
    message: string;
    element?: string;
    impact?: 'critical' | 'serious' | 'moderate' | 'minor';
    wcagTags?: string[];
}

export interface AxeResult {
    score: number;
    issues: AxeIssue[];
    violations: number;
    passes: number;
    incomplete: number;
}

/**
 * Run Axe accessibility analysis on HTML content
 */
export async function runAxeAnalysis(html: string, url?: string): Promise<AxeResult> {
    try {
        console.log('[Axe] Starting accessibility analysis');

        // Create a DOM from the HTML
        const dom = new JSDOM(html, {
            url: url || 'http://localhost',
            runScripts: 'outside-only',
            resources: 'usable',
        });

        const { window } = dom;
        const { document } = window;

        // Inject axe-core into the JSDOM window
        const axeSource = axe.source;
        const script = document.createElement('script');
        script.textContent = axeSource;
        document.head.appendChild(script);

        // Run axe analysis
        const results = await (window as unknown as WindowWithAxe).axe.run(document, {
            runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
            },
            resultTypes: ['violations', 'passes', 'incomplete']
        });

        console.log('[Axe] Analysis complete:', {
            violations: results.violations.length,
            passes: results.passes.length,
            incomplete: results.incomplete.length
        });

        // Convert axe results to our format
        const issues: AxeIssue[] = [];

        // Process violations
        for (const violation of results.violations) {
            const impact = violation.impact || 'moderate';
            const type = impact === 'critical' || impact === 'serious' ? 'error' : 'warning';

            for (const node of violation.nodes) {
                issues.push({
                    type,
                    message: `${violation.help} - ${node.failureSummary || violation.description}`,
                    element: node.html ? node.html.substring(0, 100) : undefined,
                    impact: impact as 'critical' | 'serious' | 'moderate' | 'minor',
                    wcagTags: violation.tags
                });
            }
        }

        // Process incomplete items as warnings
        for (const incomplete of results.incomplete) {
            issues.push({
                type: 'warning',
                message: `Needs review: ${incomplete.help}`,
                impact: 'moderate',
                wcagTags: incomplete.tags
            });
        }

        // Calculate score based on violations
        const criticalCount = results.violations.filter((v: { impact?: string }) => v.impact === 'critical').length;
        const seriousCount = results.violations.filter((v: { impact?: string }) => v.impact === 'serious').length;
        const moderateCount = results.violations.filter((v: { impact?: string }) => v.impact === 'moderate').length;
        const minorCount = results.violations.filter((v: { impact?: string }) => v.impact === 'minor').length;

        const score = Math.max(0, Math.min(100,
            100 - (criticalCount * 20) - (seriousCount * 10) - (moderateCount * 5) - (minorCount * 2)
        ));

        console.log('[Axe] Calculated score:', score);

        return {
            score,
            issues,
            violations: results.violations.length,
            passes: results.passes.length,
            incomplete: results.incomplete.length
        };

    } catch (error) {
        console.error('[Axe] Analysis error:', error);
        throw new Error(`Axe analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Run Axe analysis specifically for color contrast issues
 */
export async function runAxeContrastAnalysis(html: string, url?: string): Promise<{
    score: number;
    issues: AxeIssue[];
}> {
    try {
        console.log('[Axe Contrast] Starting contrast analysis');

        const dom = new JSDOM(html, {
            url: url || 'http://localhost',
            runScripts: 'outside-only',
            resources: 'usable',
        });

        const { window } = dom;
        const { document } = window;

        // Inject axe-core
        const axeSource = axe.source;
        const script = document.createElement('script');
        script.textContent = axeSource;
        document.head.appendChild(script);

        // Run axe with only contrast rules
        const results = await (window as unknown as WindowWithAxe).axe.run(document, {
            runOnly: {
                type: 'rule',
                values: ['color-contrast', 'color-contrast-enhanced']
            },
            resultTypes: ['violations']
        });

        console.log('[Axe Contrast] Found violations:', results.violations.length);

        // Convert to our format
        const issues: AxeIssue[] = [];

        for (const violation of results.violations) {
            const impact = violation.impact || 'moderate';
            const type = impact === 'critical' || impact === 'serious' ? 'error' : 'warning';

            for (const node of violation.nodes) {
                const contrastData = node.any?.[0]?.data;
                const contrastRatio = contrastData?.contrastRatio?.toFixed(2) || 'unknown';
                const expectedRatio = contrastData?.expectedContrastRatio || '';

                issues.push({
                    type,
                    message: `Contrast ratio ${contrastRatio}:1 is below required ${expectedRatio} - ${violation.help}`,
                    element: node.html ? node.html.substring(0, 100) : undefined,
                    impact: impact as 'critical' | 'serious' | 'moderate' | 'minor',
                    wcagTags: violation.tags
                });
            }
        }

        // Calculate score
        const errorCount = issues.filter(i => i.type === 'error').length;
        const warningCount = issues.filter(i => i.type === 'warning').length;
        const score = Math.max(0, Math.min(100, 100 - (errorCount * 15) - (warningCount * 5)));

        return { score, issues };

    } catch (error) {
        console.error('[Axe Contrast] Analysis error:', error);
        throw new Error(`Axe contrast analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if Axe is available (always true since it's bundled)
 */
export function isAxeAvailable(): boolean {
    return true;
}
