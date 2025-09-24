import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";

interface ContrastIssue {
  type: string;
  message: string;
  element?: string;
  contrast?: number;
  foreground?: string;
  background?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url, html } = await request.json();

    if (!url && !html) {
      return NextResponse.json(
        { error: "Either URL or HTML content is required" },
        { status: 400 }
      );
    }

    let htmlContent = html;

    // If no HTML provided, crawl the URL first
    if (!htmlContent && url) {
      const crawlResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!crawlResponse.ok) {
        return NextResponse.json(
          { error: "Failed to crawl URL for validation" },
          { status: 500 }
        );
      }

      const crawlData = await crawlResponse.json();
      htmlContent = crawlData.data?.html;

      if (!htmlContent) {
        return NextResponse.json(
          { error: "No HTML content found to validate" },
          { status: 400 }
        );
      }
    }

    // Parse HTML and check contrast
    const contrastIssues = await analyzeContrast(htmlContent);

    const errorCount = contrastIssues.filter(issue => issue.type === 'error').length;
    const warningCount = contrastIssues.filter(issue => issue.type === 'warning').length;

    // Calculate score
    const totalIssues = errorCount + warningCount;
    const score = Math.max(0, Math.min(100, 100 - (errorCount * 12) - (warningCount * 5)));

    const status = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';
    const message = totalIssues === 0
      ? 'All text elements meet WCAG contrast requirements'
      : `Found ${errorCount} contrast errors and ${warningCount} warnings that may affect readability`;

    const recommendations = generateContrastRecommendations(contrastIssues);

    const reportData = {
      id: `contrast-${Date.now()}`,
      label: "Contrast Checker",
      url: url || 'Provided HTML',
      status,
      score,
      timestamp: Date.now(),
      message,
      details: contrastIssues.slice(0, 15), // Limit to first 15 issues
      recommendations
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error("Contrast validation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function analyzeContrast(html: string): Promise<ContrastIssue[]> {
  const issues: ContrastIssue[] = [];

  try {
    // Create a virtual DOM
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Get all text-containing elements
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, span, div, li, td, th, label');

    for (const element of textElements) {
      const computedStyle = dom.window.getComputedStyle(element);
      const textContent = element.textContent?.trim();

      if (!textContent || textContent.length < 3) continue;

      const color = computedStyle.color || '#000000';
      const backgroundColor = computedStyle.backgroundColor || '#ffffff';

      // Convert colors to hex if possible
      const foregroundHex = parseColor(color);
      const backgroundHex = parseColor(backgroundColor);

      if (foregroundHex && backgroundHex) {
        const contrast = calculateContrastRatio(foregroundHex, backgroundHex);
        const tagName = element.tagName.toLowerCase();

        // WCAG AA standard: 4.5:1 for normal text, 3:1 for large text
        const isLargeText = isElementLargeText(element, computedStyle);
        const requiredRatio = isLargeText ? 3.0 : 4.5;

        if (contrast < requiredRatio) {
          const severity = contrast < (requiredRatio * 0.7) ? 'error' : 'warning';
          issues.push({
            type: severity,
            message: `${tagName.toUpperCase()} text has contrast ratio ${contrast.toFixed(1)}:1, below ${isLargeText ? 'AA large text' : 'AA'} standard (${requiredRatio}:1)`,
            element: `<${tagName}>`,
            contrast,
            foreground: foregroundHex,
            background: backgroundHex
          });
        }
      }
    }

    // Check for common low contrast scenarios
    if (issues.length === 0) {
      // Look for potentially problematic color combinations in CSS
      checkCommonContrastIssues(html, issues);
    }

  } catch (error) {
    console.error('Error analyzing contrast:', error);
    // Fallback to basic text analysis
    issues.push({
      type: 'warning',
      message: 'Unable to fully analyze contrast ratios - manual review recommended'
    });
  }

  return issues;
}

function parseColor(color: string): string | null {
  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return rgbToHex(r, g, b);
  }

  // Handle hex colors
  const hexMatch = color.match(/^#[0-9A-Fa-f]{6}$/);
  if (hexMatch) {
    return color;
  }

  // Handle named colors (basic ones)
  const namedColors: { [key: string]: string } = {
    'black': '#000000',
    'white': '#ffffff',
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'silver': '#c0c0c0',
    'gray': '#808080',
    'grey': '#808080'
  };

  return namedColors[color.toLowerCase()] || null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function isElementLargeText(element: Element, computedStyle: CSSStyleDeclaration): boolean {
  const fontSize = parseFloat(computedStyle.fontSize || '16');
  const fontWeight = computedStyle.fontWeight || 'normal';

  // Large text is 18pt (24px) or larger, or 14pt (18.66px) if bold
  const isBold = fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight) >= 700;

  return fontSize >= 24 || (fontSize >= 18.66 && isBold);
}

function checkCommonContrastIssues(html: string, issues: ContrastIssue[]): void {
  // Check for common problematic patterns in HTML/CSS
  const lowContrastPatterns = [
    { pattern: /color:\s*#[89abcdef]{6}/gi, message: 'Light gray text may have poor contrast' },
    { pattern: /color:\s*gray/gi, message: 'Gray text may not meet contrast requirements' },
    { pattern: /color:\s*#666/gi, message: 'Color #666 often fails contrast requirements on white backgrounds' },
  ];

  for (const { pattern, message } of lowContrastPatterns) {
    if (pattern.test(html)) {
      issues.push({
        type: 'warning',
        message
      });
    }
  }
}

function generateContrastRecommendations(issues: ContrastIssue[]): string[] {
  const recommendations: string[] = [];

  if (issues.some(issue => issue.contrast && issue.contrast < 3)) {
    recommendations.push('Use darker text colors or lighter backgrounds to improve contrast ratios');
  }

  if (issues.some(issue => issue.message.includes('AA'))) {
    recommendations.push('Ensure all text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)');
  }

  if (issues.some(issue => issue.message.includes('button') || issue.message.includes('BUTTON'))) {
    recommendations.push('Make interactive elements like buttons and links easily distinguishable');
  }

  if (issues.length > 0) {
    recommendations.push('Use contrast checking tools during design and development');
    recommendations.push('Consider WCAG AAA standards (7:1) for better accessibility');
    recommendations.push('Test your site with users who have visual impairments');
  }

  return recommendations;
}