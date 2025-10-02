"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

interface ReportDetail {
  type: string;
  message: string;
  element?: string;
  line?: number;
  [key: string]: unknown;
}

interface ReportData {
  id: string;
  label: string;
  url: string;
  status: "success" | "warning" | "error";
  score?: number;
  timestamp: number;
  message: string;
  details?: ReportDetail[];
  recommendations?: string[];
}

// This would typically fetch from a database or cache
async function getReportData(id: string) {
  // In a real implementation, you would fetch stored report data from your database

  // First, check if the report data exists in localStorage (from health checker)
  try {
    const storedData = localStorage.getItem(`report-${id}`);
    if (storedData) {
      const reportData = JSON.parse(storedData);
      return reportData;
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }

  // Extract the report type and timestamp from the ID (e.g., "contrast-1758735258007")
  const [reportType, timestamp] = id.split('-');

  if (!reportType || !timestamp) {
    return null;
  }

  // For demonstration, we'll use a test URL
  // In a real app, you'd store the URL with the report ID in a database
  const testUrl = "https://example.com";

  try {
    // Call the appropriate validation API
    const apiEndpoint = `/api/validate/${reportType}`;
    const requestBody = reportType === 'security' || reportType === 'lighthouse'
      ? { url: testUrl }
      : { url: testUrl };

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`API call failed for ${reportType}:`, response.statusText);
      return null;
    }

    const result = await response.json();

    if (!result.success) {
      console.error(`Validation failed for ${reportType}:`, result.error);
      return null;
    }

    // Return the report data from the API
    return result.data;

  } catch (error) {
    console.error(`Error fetching report data for ${reportType}:`, error);

    // Fallback to mock data if API fails
    return getFallbackData(reportType, testUrl);
  }
}

// Fallback mock data in case APIs fail
function getFallbackData(reportType: string, url: string): ReportData | null {
  const fallbackTemplates: Record<string, ReportData> = {
    "markup": {
      id: `markup-${Date.now()}`,
      label: "W3C Markup Validation",
      url,
      status: "warning",
      score: 85,
      timestamp: Date.now(),
      message: "API temporarily unavailable - showing sample results",
      details: [
        { type: "warning", message: "Unable to connect to validation service" }
      ],
      recommendations: [
        "Try refreshing the page to retry validation",
        "Check your internet connection"
      ]
    },
    "contrast": {
      id: `contrast-${Date.now()}`,
      label: "Contrast Checker",
      url,
      status: "warning",
      score: 85,
      timestamp: Date.now(),
      message: "API temporarily unavailable - showing sample results",
      details: [
        { type: "warning", message: "Unable to analyze contrast ratios" }
      ],
      recommendations: [
        "Try refreshing the page to retry validation",
        "Use online contrast checkers as an alternative"
      ]
    },
    "accessibility": {
      id: `accessibility-${Date.now()}`,
      label: "Accessibility Check",
      url,
      status: "warning",
      score: 85,
      timestamp: Date.now(),
      message: "API temporarily unavailable - showing sample results",
      details: [
        { type: "warning", message: "Unable to perform accessibility analysis" }
      ],
      recommendations: [
        "Try refreshing the page to retry validation",
        "Use browser accessibility dev tools"
      ]
    },
    "lighthouse": {
      id: `lighthouse-${Date.now()}`,
      label: "Lighthouse Report",
      url,
      status: "warning",
      score: 85,
      timestamp: Date.now(),
      message: "API temporarily unavailable - showing sample results",
      details: [
        { type: "warning", message: "Unable to perform performance analysis" }
      ],
      recommendations: [
        "Try refreshing the page to retry validation",
        "Use Google PageSpeed Insights directly"
      ]
    },
    "seo": {
      id: `seo-${Date.now()}`,
      label: "SEO Analysis",
      url,
      status: "warning",
      score: 85,
      timestamp: Date.now(),
      message: "API temporarily unavailable - showing sample results",
      details: [
        { type: "warning", message: "Unable to perform SEO analysis" }
      ],
      recommendations: [
        "Try refreshing the page to retry validation",
        "Use SEO analysis tools manually"
      ]
    },
    "security": {
      id: `security-${Date.now()}`,
      label: "Security Headers",
      url,
      status: "warning",
      score: 85,
      timestamp: Date.now(),
      message: "API temporarily unavailable - showing sample results",
      details: [
        { type: "warning", message: "Unable to analyze security headers" }
      ],
      recommendations: [
        "Try refreshing the page to retry validation",
        "Use Security Headers.com to check manually"
      ]
    }
  };

  return fallbackTemplates[reportType] || null;
}

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const reportData = await getReportData(id);
        if (!reportData) {
          setError("Report not found");
          return;
        }
        setReport(reportData);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchReportData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted dark:from-background dark:to-card">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading report...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted dark:from-background dark:to-card">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Report Not Found</h1>
              <p className="text-muted-foreground mb-6">{error || "The requested report could not be found."}</p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-400";
      case "error":
        return "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted dark:from-background dark:to-card">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {report.label} Report
                </h1>
                <p className="text-muted-foreground">
                  Analysis for {report.url}
                </p>
              </div>
            </div>
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:underline"
            >
              Visit Site <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>

          {/* Overview Card */}
          <Card className={`p-6 border-2 ${getStatusColor(report.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.status === "success"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : report.status === "warning"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : report.status === "error"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {report.status.toUpperCase()}
                </div>
                {report.score !== undefined && (
                  <div className="text-2xl font-bold text-foreground">
                    {report.score}/100
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(report.timestamp).toLocaleDateString()} at{" "}
                {new Date(report.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <p className="text-lg font-medium text-foreground mb-2">
              {report.message}
            </p>
          </Card>

          {/* Details Section */}
          {report.details && report.details.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Detailed Issues
              </h2>
              <div className="space-y-3">
                {report.details.map((detail: ReportDetail, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      detail.type === "error"
                        ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                        : detail.type === "warning"
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
                        : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          detail.type === "error"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : detail.type === "warning"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {detail.type.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground">{detail.message}</p>
                        {detail.line && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Line {detail.line}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations Section */}
          {report.recommendations && report.recommendations.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Recommendations
              </h2>
              <div className="space-y-2">
                {report.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <p className="text-foreground">{recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}