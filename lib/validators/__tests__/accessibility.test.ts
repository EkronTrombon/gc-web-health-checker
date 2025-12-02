import { describe, it, expect } from '@jest/globals';
import {
    analyzeAccessibility,
    calculateAccessibilityScore,
    generateAccessibilityRecommendations,
    type AccessibilityIssue
} from '../accessibility';

describe('Accessibility Validator', () => {
    describe('analyzeAccessibility', () => {
        it('should detect missing alt text on images', async () => {
            const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Test</title></head>
          <body>
            <img src="test.jpg" />
          </body>
        </html>
      `;

            const issues = await analyzeAccessibility(html);

            expect(issues).toContainEqual(
                expect.objectContaining({
                    type: 'error',
                    message: expect.stringContaining('alt attribute'),
                    severity: 'critical'
                })
            );
        });

        it('should pass for images with alt text', async () => {
            const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Test</title></head>
          <body>
            <img src="test.jpg" alt="Test image" />
          </body>
        </html>
      `;

            const issues = await analyzeAccessibility(html);
            const criticalIssues = issues.filter(i => i.severity === 'critical');

            expect(criticalIssues).toHaveLength(0);
        });

        it('should detect missing form labels', async () => {
            const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Test</title></head>
          <body>
            <form>
              <input type="text" name="email" />
            </form>
          </body>
        </html>
      `;

            const issues = await analyzeAccessibility(html);

            expect(issues).toContainEqual(
                expect.objectContaining({
                    message: expect.stringContaining('label'),
                    severity: 'serious'
                })
            );
        });

        it('should pass for properly labeled form inputs', async () => {
            const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Test</title></head>
          <body>
            <form>
              <label for="email">Email</label>
              <input type="text" id="email" name="email" />
            </form>
          </body>
        </html>
      `;

            const issues = await analyzeAccessibility(html);
            const formIssues = issues.filter(i => i.message.includes('label'));

            expect(formIssues).toHaveLength(0);
        });

        it('should detect missing h1 heading', async () => {
            const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Test</title></head>
          <body>
            <h2>Subheading</h2>
            <p>Content</p>
          </body>
        </html>
      `;

            const issues = await analyzeAccessibility(html);

            expect(issues).toContainEqual(
                expect.objectContaining({
                    message: expect.stringContaining('h1'),
                    severity: 'serious'
                })
            );
        });

        it('should detect missing lang attribute', async () => {
            const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body>
            <h1>Heading</h1>
          </body>
        </html>
      `;

            const issues = await analyzeAccessibility(html);

            expect(issues).toContainEqual(
                expect.objectContaining({
                    message: expect.stringContaining('lang attribute'),
                    severity: 'serious'
                })
            );
        });

        it('should pass for fully accessible HTML', async () => {
            const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Accessible Page</title></head>
          <body>
            <header>
              <h1>Main Heading</h1>
            </header>
            <main>
              <img src="test.jpg" alt="Test image" />
              <form>
                <label for="name">Name</label>
                <input type="text" id="name" />
              </form>
              <a href="/page">Go to page</a>
            </main>
          </body>
        </html>
      `;

            const issues = await analyzeAccessibility(html);
            const criticalAndSerious = issues.filter(i =>
                i.severity === 'critical' || i.severity === 'serious'
            );

            expect(criticalAndSerious).toHaveLength(0);
        });
    });

    describe('calculateAccessibilityScore', () => {
        it('should return 100 for no issues', () => {
            const issues: AccessibilityIssue[] = [];
            const score = calculateAccessibilityScore(issues);
            expect(score).toBe(100);
        });

        it('should deduct 10 points per critical issue', () => {
            const issues: AccessibilityIssue[] = [
                { type: 'error', message: 'Test', severity: 'critical' },
                { type: 'error', message: 'Test', severity: 'critical' }
            ];
            const score = calculateAccessibilityScore(issues);
            expect(score).toBe(80); // 100 - (2 * 10)
        });

        it('should deduct 6 points per serious issue', () => {
            const issues: AccessibilityIssue[] = [
                { type: 'error', message: 'Test', severity: 'serious' },
                { type: 'error', message: 'Test', severity: 'serious' }
            ];
            const score = calculateAccessibilityScore(issues);
            expect(score).toBe(88); // 100 - (2 * 6)
        });

        it('should handle mixed severity issues', () => {
            const issues: AccessibilityIssue[] = [
                { type: 'error', message: 'Test', severity: 'critical' },
                { type: 'error', message: 'Test', severity: 'serious' },
                { type: 'warning', message: 'Test', severity: 'moderate' },
                { type: 'warning', message: 'Test', severity: 'minor' }
            ];
            const score = calculateAccessibilityScore(issues);
            expect(score).toBe(80); // 100 - 10 - 6 - 3 - 1
        });

        it('should not go below 0', () => {
            const issues: AccessibilityIssue[] = Array(20).fill({
                type: 'error',
                message: 'Test',
                severity: 'critical'
            });
            const score = calculateAccessibilityScore(issues);
            expect(score).toBe(0);
        });
    });

    describe('generateAccessibilityRecommendations', () => {
        it('should recommend alt text for image issues', () => {
            const issues: AccessibilityIssue[] = [
                { type: 'error', message: 'Image missing alt attribute', severity: 'critical' }
            ];
            const recommendations = generateAccessibilityRecommendations(issues);

            expect(recommendations).toContainEqual(
                expect.stringContaining('alt attributes')
            );
        });

        it('should recommend form labels for label issues', () => {
            const issues: AccessibilityIssue[] = [
                { type: 'error', message: 'Form input missing label', severity: 'serious' }
            ];
            const recommendations = generateAccessibilityRecommendations(issues);

            expect(recommendations).toContainEqual(
                expect.stringContaining('form controls')
            );
        });

        it('should include general recommendations when issues exist', () => {
            const issues: AccessibilityIssue[] = [
                { type: 'error', message: 'Some issue', severity: 'moderate' }
            ];
            const recommendations = generateAccessibilityRecommendations(issues);

            expect(recommendations.length).toBeGreaterThan(0);
            expect(recommendations).toContainEqual(
                expect.stringContaining('screen readers')
            );
        });

        it('should return empty array for no issues', () => {
            const issues: AccessibilityIssue[] = [];
            const recommendations = generateAccessibilityRecommendations(issues);

            expect(recommendations).toEqual([]);
        });
    });
});
