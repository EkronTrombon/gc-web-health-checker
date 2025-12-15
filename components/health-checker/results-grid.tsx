"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { HealthCheckResult } from "@/types/crawl";

interface ResultsGridProps {
  results: HealthCheckResult[];
}

/**
 * Generate external report URL for third-party validation tools
 */
function getExternalReportUrl(checkId: string, url: string): string | null {
  if (!url) return null;

  const encodedUrl = encodeURIComponent(url);

  switch (checkId) {
    case 'lighthouse':
      return `https://pagespeed.web.dev/analysis?url=${encodedUrl}`;
    case 'markup':
      return `https://validator.w3.org/nu/?doc=${encodedUrl}`;
    case 'accessibility':
      return `https://pagespeed.web.dev/analysis?url=${encodedUrl}`;
    case 'contrast':
      return `https://wave.webaim.org/report#/${encodedUrl}`;
    case 'security':
      // Extract domain from URL (remove protocol and path)
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      return `https://observatory.mozilla.org/analyze/${domain}`;
    case 'seo':
      return `https://pagespeed.web.dev/analysis?url=${encodedUrl}`;
    default:
      return null;
  }
}

/**
 * Get display label for external report link
 */
function getExternalReportLabel(checkId: string): string {
  switch (checkId) {
    case 'lighthouse':
      return 'View on PageSpeed Insights';
    case 'markup':
      return 'Validate on W3C';
    case 'accessibility':
      return 'View on PageSpeed Insights';
    case 'contrast':
      return 'Analyze with WAVE';
    case 'security':
      return 'Check with Mozilla Observatory';
    case 'seo':
      return 'View on PageSpeed Insights';
    default:
      return 'View External Report';
  }
}

export function ResultsGrid({ results }: ResultsGridProps) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h3 className="text-2xl font-semibold text-foreground">
        Analysis Results
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => {
          const externalUrl = result.url ? getExternalReportUrl(result.id, result.url) : null;

          return (
            <div
              key={result.id}
              className="rounded-lg p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] bg-card backdrop-blur-lg border border-border shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col h-full space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-lg">{result.label}</h4>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                      result.status === "success"
                        ? "bg-green-500/20 dark:bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30 dark:border-green-500/25"
                        : result.status === "warning"
                        ? "bg-yellow-500/20 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30 dark:border-yellow-500/25"
                        : result.status === "error"
                        ? "bg-red-500/20 dark:bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 dark:border-red-500/25"
                        : "bg-gray-500/20 dark:bg-gray-500/15 text-gray-700 dark:text-gray-300 border border-gray-500/30 dark:border-gray-500/25"
                    }`}
                  >
                    {result.status}
                  </div>
                </div>

                {/* Key Findings Summary */}
                {(() => {
                  const errorCount = result.details?.filter(d => d.type === 'error').length || 0;
                  const warningCount = result.details?.filter(d => d.type === 'warning').length || 0;
                  const infoCount = result.details?.filter(d => d.type === 'info').length || 0;

                  return (
                    <div className="flex flex-wrap gap-2 items-center">
                      {result.details && result.details.length > 0 ? (
                        <>
                          {errorCount > 0 && (
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              {errorCount} error{errorCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {warningCount > 0 && (
                            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                              {warningCount} warning{warningCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {infoCount > 0 && (
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {infoCount} info item{infoCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Analysis completed</span>
                      )}
                    </div>
                  );
                })()}

                <p className="text-sm text-muted-foreground flex-grow leading-relaxed">
                  {result.message}
                </p>

                {result.dataSource && (
                  <span className="text-xs text-muted-foreground">
                    Source: {result.dataSource}
                  </span>
                )}

                <div className="pt-4 mt-auto">
                  {externalUrl && (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="default" className="w-full group hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                        {getExternalReportLabel(result.id)}
                        <ExternalLink className="h-3 w-3 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
