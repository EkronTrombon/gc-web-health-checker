import { NextRequest, NextResponse } from "next/server";

interface ValidationError {
  type: string;
  message: string;
  line?: number;
  column?: number;
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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      (request.headers.get('host') ? `http://${request.headers.get('host')}` : 'http://localhost:3000');
      const crawlResponse = await fetch(`${baseUrl}/api/crawl`, {
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

      console.log("Crawl data received:", {
        hasData: !!crawlData.data,
        hasHtml: !!crawlData.data?.html,
        htmlLength: crawlData.data?.html?.length || 0
      });

      if (!htmlContent) {
        return NextResponse.json(
          { error: "No HTML content found to validate", crawlData },
          { status: 400 }
        );
      }
    }

    // Use W3C HTML Validator API
    const validatorResponse = await fetch('https://validator.w3.org/nu/', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'User-Agent': 'Web Health Checker/1.0',
      },
      body: htmlContent,
    });

    if (!validatorResponse.ok) {
      return NextResponse.json(
        { error: "W3C validator service unavailable" },
        { status: 503 }
      );
    }

    const validatorText = await validatorResponse.text();

    // Parse W3C validator response (it returns plain text)
    const details: ValidationError[] = [];
    const lines = validatorText.split('\n');

    let errorCount = 0;
    let warningCount = 0;

    // Simple parsing of validator output
    for (const line of lines) {
      if (line.includes('Error:') || line.includes('error:')) {
        errorCount++;
        const match = line.match(/line (\d+)/i);
        details.push({
          type: 'error',
          message: line.replace(/^.*?Error:\s*/i, '').trim(),
          line: match ? parseInt(match[1]) : undefined
        });
      } else if (line.includes('Warning:') || line.includes('warning:')) {
        warningCount++;
        const match = line.match(/line (\d+)/i);
        details.push({
          type: 'warning',
          message: line.replace(/^.*?Warning:\s*/i, '').trim(),
          line: match ? parseInt(match[1]) : undefined
        });
      }
    }

    // If W3C validator doesn't work, do basic HTML validation
    if (details.length === 0) {
      const basicValidation = validateHTMLBasic(htmlContent);
      details.push(...basicValidation.details);
      errorCount = basicValidation.errorCount;
      warningCount = basicValidation.warningCount;
    }

    // Calculate score
    const totalIssues = errorCount + warningCount;
    const score = Math.max(0, Math.min(100, 100 - (errorCount * 8) - (warningCount * 3)));

    const status = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';
    const message = totalIssues === 0
      ? 'HTML markup is valid with no issues found'
      : `Found ${errorCount} HTML validation errors and ${warningCount} warnings`;

    const recommendations = generateMarkupRecommendations(details);

    const reportData = {
      id: `markup-${Date.now()}`,
      label: "W3C Markup Validation",
      url: url || 'Provided HTML',
      status,
      score,
      timestamp: Date.now(),
      message,
      details: details.slice(0, 20), // Limit to first 20 issues
      recommendations
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error("Markup validation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

function validateHTMLBasic(html: string) {
  const details: ValidationError[] = [];
  let errorCount = 0;
  let warningCount = 0;

  // Check for basic HTML structure
  if (!html.includes('<!DOCTYPE') && !html.includes('<!doctype')) {
    details.push({
      type: 'error',
      message: 'Missing DOCTYPE declaration'
    });
    errorCount++;
  }

  if (!html.includes('<html')) {
    details.push({
      type: 'error',
      message: 'Missing html element'
    });
    errorCount++;
  }

  if (!html.includes('<head>')) {
    details.push({
      type: 'error',
      message: 'Missing head element'
    });
    errorCount++;
  }

  if (!html.includes('<body>')) {
    details.push({
      type: 'error',
      message: 'Missing body element'
    });
    errorCount++;
  }

  // Check for unclosed tags (basic check)
  const openTags = html.match(/<[^\/][^>]*>/g) || [];
  const closeTags = html.match(/<\/[^>]*>/g) || [];

  if (openTags.length - closeTags.length > 5) {
    details.push({
      type: 'warning',
      message: 'Potentially unclosed HTML elements detected'
    });
    warningCount++;
  }

  // Check for images without alt attributes
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  for (const img of imgMatches) {
    if (!img.includes('alt=')) {
      details.push({
        type: 'error',
        message: 'Image element missing alt attribute for accessibility'
      });
      errorCount++;
    }
  }

  // Check for missing title
  if (!html.includes('<title>')) {
    details.push({
      type: 'error',
      message: 'Missing title element'
    });
    errorCount++;
  }

  return { details, errorCount, warningCount };
}

function generateMarkupRecommendations(details: ValidationError[]): string[] {
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