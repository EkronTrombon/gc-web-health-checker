import { NextRequest, NextResponse } from "next/server";

interface SecurityIssue {
  type: string;
  message: string;
  header?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  category?: 'headers' | 'content' | 'transport' | 'authentication';
  recommendation?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required for security analysis" },
        { status: 400 }
      );
    }

    // Analyze security headers and configurations
    const securityIssues = await analyzeSecurityHeaders(url);

    const criticalCount = securityIssues.filter(issue => issue.severity === 'critical').length;
    const highCount = securityIssues.filter(issue => issue.severity === 'high').length;
    const mediumCount = securityIssues.filter(issue => issue.severity === 'medium').length;
    const lowCount = securityIssues.filter(issue => issue.severity === 'low').length;

    // Calculate score based on security issues
    let score = 100;
    score -= (criticalCount * 25);
    score -= (highCount * 15);
    score -= (mediumCount * 8);
    score -= (lowCount * 3);
    score = Math.max(0, Math.min(100, Math.round(score)));

    const status = criticalCount > 0 ? 'error' : highCount > 0 ? 'error' : mediumCount > 2 ? 'warning' : 'success';
    const totalIssues = securityIssues.length;
    const message = totalIssues === 0
      ? 'Excellent security configuration - all headers properly set'
      : `Security analysis completed - ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low priority issues`;

    const recommendations = generateSecurityRecommendations(securityIssues);

    const reportData = {
      id: `security-${Date.now()}`,
      label: "Security Headers",
      url,
      status,
      score,
      timestamp: Date.now(),
      message,
      details: securityIssues.slice(0, 15),
      recommendations
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error("Security validation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function analyzeSecurityHeaders(url: string): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];

  try {
    // Fetch the URL to check headers
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Web Health Checker/1.0)'
      }
    });

    const headers = response.headers;

    // Check HTTPS usage
    if (!url.startsWith('https://')) {
      issues.push({
        type: 'error',
        message: 'Site not served over HTTPS - data transmission is not encrypted',
        severity: 'critical',
        category: 'transport',
        recommendation: 'Implement HTTPS with valid SSL/TLS certificate'
      });
    }

    // Check Content Security Policy
    checkCSP(headers, issues);

    // Check X-Frame-Options
    checkXFrameOptions(headers, issues);

    // Check X-Content-Type-Options
    checkXContentTypeOptions(headers, issues);

    // Check X-XSS-Protection
    checkXXSSProtection(headers, issues);

    // Check Strict-Transport-Security
    checkHSTS(headers, issues, url);

    // Check Referrer Policy
    checkReferrerPolicy(headers, issues);

    // Check Permissions Policy
    checkPermissionsPolicy(headers, issues);

    // Check Server header information disclosure
    checkServerHeader(headers, issues);

    // Check X-Powered-By header information disclosure
    checkXPoweredBy(headers, issues);

    // Check Set-Cookie security attributes
    checkCookieSecurity(headers, issues);

    // Additional security checks
    checkAdditionalSecurity(response, issues);

  } catch (error) {
    console.error('Error analyzing security headers:', error);
    issues.push({
      type: 'error',
      message: 'Unable to analyze security headers - connection failed',
      severity: 'high',
      category: 'transport'
    });
  }

  return issues;
}

function checkCSP(headers: Headers, issues: SecurityIssue[]): void {
  const csp = headers.get('content-security-policy') || headers.get('content-security-policy-report-only');

  if (!csp) {
    issues.push({
      type: 'error',
      message: 'Missing Content Security Policy (CSP) header',
      header: 'Content-Security-Policy',
      severity: 'high',
      category: 'headers',
      recommendation: 'Implement CSP to prevent XSS and data injection attacks'
    });
  } else {
    // Check for unsafe CSP directives
    if (csp.includes("'unsafe-inline'")) {
      issues.push({
        type: 'warning',
        message: 'CSP contains unsafe-inline directive - reduces XSS protection',
        header: 'Content-Security-Policy',
        severity: 'medium',
        category: 'headers',
        recommendation: 'Use nonces or hashes instead of unsafe-inline'
      });
    }

    if (csp.includes("'unsafe-eval'")) {
      issues.push({
        type: 'warning',
        message: 'CSP contains unsafe-eval directive - allows dangerous eval()',
        header: 'Content-Security-Policy',
        severity: 'medium',
        category: 'headers',
        recommendation: 'Remove unsafe-eval and refactor code to avoid eval()'
      });
    }

    if (csp.includes('*')) {
      issues.push({
        type: 'warning',
        message: 'CSP contains wildcard (*) directive - reduces security effectiveness',
        header: 'Content-Security-Policy',
        severity: 'low',
        category: 'headers',
        recommendation: 'Use specific domains instead of wildcards'
      });
    }
  }
}

function checkXFrameOptions(headers: Headers, issues: SecurityIssue[]): void {
  const xFrameOptions = headers.get('x-frame-options');

  if (!xFrameOptions) {
    issues.push({
      type: 'error',
      message: 'Missing X-Frame-Options header - vulnerable to clickjacking',
      header: 'X-Frame-Options',
      severity: 'high',
      category: 'headers',
      recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN'
    });
  } else {
    const value = xFrameOptions.toLowerCase();
    if (value !== 'deny' && value !== 'sameorigin' && !value.startsWith('allow-from')) {
      issues.push({
        type: 'warning',
        message: 'X-Frame-Options has invalid value',
        header: 'X-Frame-Options',
        severity: 'medium',
        category: 'headers',
        recommendation: 'Use DENY, SAMEORIGIN, or ALLOW-FROM with valid origin'
      });
    }
  }
}

function checkXContentTypeOptions(headers: Headers, issues: SecurityIssue[]): void {
  const xContentTypeOptions = headers.get('x-content-type-options');

  if (!xContentTypeOptions) {
    issues.push({
      type: 'warning',
      message: 'Missing X-Content-Type-Options header',
      header: 'X-Content-Type-Options',
      severity: 'medium',
      category: 'headers',
      recommendation: 'Set X-Content-Type-Options to nosniff'
    });
  } else if (xContentTypeOptions.toLowerCase() !== 'nosniff') {
    issues.push({
      type: 'warning',
      message: 'X-Content-Type-Options should be set to "nosniff"',
      header: 'X-Content-Type-Options',
      severity: 'low',
      category: 'headers',
      recommendation: 'Change value to nosniff'
    });
  }
}

function checkXXSSProtection(headers: Headers, issues: SecurityIssue[]): void {
  const xssProtection = headers.get('x-xss-protection');

  if (!xssProtection) {
    issues.push({
      type: 'warning',
      message: 'Missing X-XSS-Protection header',
      header: 'X-XSS-Protection',
      severity: 'low',
      category: 'headers',
      recommendation: 'Set X-XSS-Protection to "1; mode=block"'
    });
  } else if (xssProtection !== '1; mode=block' && xssProtection !== '0') {
    issues.push({
      type: 'warning',
      message: 'X-XSS-Protection has suboptimal configuration',
      header: 'X-XSS-Protection',
      severity: 'low',
      category: 'headers',
      recommendation: 'Set to "1; mode=block" or "0" if using CSP'
    });
  }
}

function checkHSTS(headers: Headers, issues: SecurityIssue[], url: string): void {
  if (url.startsWith('https://')) {
    const hsts = headers.get('strict-transport-security');

    if (!hsts) {
      issues.push({
        type: 'error',
        message: 'Missing Strict-Transport-Security (HSTS) header on HTTPS site',
        header: 'Strict-Transport-Security',
        severity: 'high',
        category: 'transport',
        recommendation: 'Implement HSTS with max-age=31536000; includeSubDomains; preload'
      });
    } else {
      // Check max-age value
      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;

      if (maxAge < 31536000) { // Less than 1 year
        issues.push({
          type: 'warning',
          message: `HSTS max-age is too low (${maxAge} seconds) - recommend at least 1 year`,
          header: 'Strict-Transport-Security',
          severity: 'medium',
          category: 'transport',
          recommendation: 'Set max-age to at least 31536000 (1 year)'
        });
      }

      if (!hsts.includes('includeSubDomains')) {
        issues.push({
          type: 'warning',
          message: 'HSTS missing includeSubDomains directive',
          header: 'Strict-Transport-Security',
          severity: 'low',
          category: 'transport',
          recommendation: 'Add includeSubDomains to protect all subdomains'
        });
      }
    }
  }
}

function checkReferrerPolicy(headers: Headers, issues: SecurityIssue[]): void {
  const referrerPolicy = headers.get('referrer-policy');

  if (!referrerPolicy) {
    issues.push({
      type: 'warning',
      message: 'Missing Referrer-Policy header',
      header: 'Referrer-Policy',
      severity: 'low',
      category: 'headers',
      recommendation: 'Set Referrer-Policy to strict-origin-when-cross-origin or no-referrer'
    });
  } else {
    const policy = referrerPolicy.toLowerCase();
    const unsafePolicies = ['unsafe-url', 'origin-when-cross-origin'];

    if (unsafePolicies.includes(policy)) {
      issues.push({
        type: 'warning',
        message: `Referrer-Policy "${policy}" may leak sensitive information`,
        header: 'Referrer-Policy',
        severity: 'low',
        category: 'headers',
        recommendation: 'Consider using strict-origin-when-cross-origin or no-referrer'
      });
    }
  }
}

function checkPermissionsPolicy(headers: Headers, issues: SecurityIssue[]): void {
  const permissionsPolicy = headers.get('permissions-policy') || headers.get('feature-policy');

  if (!permissionsPolicy) {
    issues.push({
      type: 'warning',
      message: 'Missing Permissions-Policy header',
      header: 'Permissions-Policy',
      severity: 'low',
      category: 'headers',
      recommendation: 'Implement Permissions-Policy to control browser features'
    });
  }
}

function checkServerHeader(headers: Headers, issues: SecurityIssue[]): void {
  const server = headers.get('server');

  if (server) {
    // Check if server header reveals too much information
    const detailedServers = ['apache', 'nginx', 'microsoft-iis', 'express'];
    const serverLower = server.toLowerCase();

    if (detailedServers.some(s => serverLower.includes(s))) {
      if (serverLower.match(/\d+\.\d+/)) { // Contains version number
        issues.push({
          type: 'warning',
          message: 'Server header reveals software version - information disclosure risk',
          header: 'Server',
          severity: 'low',
          category: 'headers',
          recommendation: 'Remove or obfuscate server version information'
        });
      }
    }
  }
}

function checkXPoweredBy(headers: Headers, issues: SecurityIssue[]): void {
  const xPoweredBy = headers.get('x-powered-by');

  if (xPoweredBy) {
    issues.push({
      type: 'warning',
      message: 'X-Powered-By header reveals technology stack - information disclosure',
      header: 'X-Powered-By',
      severity: 'low',
      category: 'headers',
      recommendation: 'Remove X-Powered-By header to reduce information disclosure'
    });
  }
}

function checkCookieSecurity(headers: Headers, issues: SecurityIssue[]): void {
  const setCookies = headers.get('set-cookie');

  if (setCookies) {
    const cookies = Array.isArray(setCookies) ? setCookies : [setCookies];

    cookies.forEach(cookie => {
      if (!cookie.includes('Secure')) {
        issues.push({
          type: 'warning',
          message: 'Cookie missing Secure attribute - vulnerable over HTTP',
          header: 'Set-Cookie',
          severity: 'medium',
          category: 'authentication',
          recommendation: 'Add Secure attribute to all cookies'
        });
      }

      if (!cookie.includes('HttpOnly')) {
        issues.push({
          type: 'warning',
          message: 'Cookie missing HttpOnly attribute - vulnerable to XSS',
          header: 'Set-Cookie',
          severity: 'medium',
          category: 'authentication',
          recommendation: 'Add HttpOnly attribute to prevent JavaScript access'
        });
      }

      if (!cookie.includes('SameSite')) {
        issues.push({
          type: 'warning',
          message: 'Cookie missing SameSite attribute - CSRF protection incomplete',
          header: 'Set-Cookie',
          severity: 'low',
          category: 'authentication',
          recommendation: 'Add SameSite=Strict or SameSite=Lax attribute'
        });
      }
    });
  }
}

function checkAdditionalSecurity(response: Response, issues: SecurityIssue[]): void {
  // Check for HTTP methods
  const allowHeader = response.headers.get('allow');
  if (allowHeader && (allowHeader.includes('TRACE') || allowHeader.includes('TRACK'))) {
    issues.push({
      type: 'warning',
      message: 'Dangerous HTTP methods (TRACE/TRACK) are enabled',
      severity: 'low',
      category: 'transport',
      recommendation: 'Disable TRACE and TRACK HTTP methods'
    });
  }

  // Check response status for security implications
  if (response.status === 200) {
    // Additional checks could be added here for specific content analysis
  }
}

function generateSecurityRecommendations(issues: SecurityIssue[]): string[] {
  const recommendations: string[] = [];

  if (issues.some(issue => issue.message.includes('HTTPS'))) {
    recommendations.push('Implement HTTPS with a valid SSL/TLS certificate for all pages');
  }

  if (issues.some(issue => issue.message.includes('Content Security Policy'))) {
    recommendations.push('Implement a strict Content Security Policy to prevent XSS attacks');
  }

  if (issues.some(issue => issue.message.includes('X-Frame-Options'))) {
    recommendations.push('Set X-Frame-Options to prevent clickjacking attacks');
  }

  if (issues.some(issue => issue.message.includes('HSTS'))) {
    recommendations.push('Enable HTTP Strict Transport Security with long max-age');
  }

  if (issues.some(issue => issue.category === 'authentication')) {
    recommendations.push('Secure cookies with Secure, HttpOnly, and SameSite attributes');
  }

  if (issues.some(issue => issue.message.includes('information disclosure'))) {
    recommendations.push('Remove server banners and version information to reduce attack surface');
  }

  if (issues.some(issue => issue.severity === 'critical' || issue.severity === 'high')) {
    recommendations.push('Address critical and high-severity security issues immediately');
  }

  if (issues.length > 0) {
    recommendations.push('Regularly audit security headers using tools like Security Headers.com');
    recommendations.push('Implement security headers at the web server or CDN level');
    recommendations.push('Consider using security.txt file to provide security contact information');
  }

  return recommendations;
}