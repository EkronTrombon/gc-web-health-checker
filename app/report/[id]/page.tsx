import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ReportPageProps {
  params: {
    id: string;
  };
}

// This would typically fetch from a database or cache
async function getReportData(id: string) {
  // For now, we'll simulate report data
  // In a real implementation, you'd fetch this from your database
  const mockReports: Record<string, any> = {
    "markup-example": {
      id: "markup",
      label: "W3C Markup Validation",
      url: "https://example.com",
      status: "error",
      score: 72,
      timestamp: Date.now(),
      message: "Found 5 HTML validation errors and 3 warnings",
      details: [
        { type: "error", message: "Missing alt attribute on img element", line: 23 },
        { type: "error", message: "Unclosed div element", line: 45 },
        { type: "warning", message: "Consider using semantic HTML5 elements", line: 12 }
      ],
      recommendations: [
        "Add alt attributes to all img elements for accessibility",
        "Ensure all HTML elements are properly closed",
        "Use semantic HTML5 elements like <header>, <main>, <footer>"
      ]
    }
  };

  return mockReports[id] || null;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const report = await getReportData(params.id);

  if (!report) {
    notFound();
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
                {report.details.map((detail: any, index: number) => (
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