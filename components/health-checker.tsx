"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Globe,
  Shield,
  Eye,
  Zap,
  CheckCircle,
  Search,
  Loader2,
  ExternalLink
} from "lucide-react";
import healthChecksConfig from "@/config/health-checks.json";
import type { CrawlData, CrawlResponse, HealthCheckResult } from "@/types/crawl";
import Link from "next/link";

const iconMap = {
  Globe,
  Shield,
  Eye,
  Zap,
  CheckCircle,
  Search
};

export function HealthChecker() {
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([]);

  const validateUrl = (value: string) => {
    try {
      const urlPattern = /^https?:\/\/.+\..+/;
      const isValid = urlPattern.test(value);
      setIsValidUrl(isValid);
      return isValid;
    } catch {
      setIsValidUrl(false);
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    validateUrl(value);
    // Clear previous results when URL changes
    setCrawlData(null);
    setHealthResults([]);
  };

  const crawlUrl = async (): Promise<CrawlData | null> => {
    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result: CrawlResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to crawl URL");
      }

      return result.data;
    } catch (error) {
      console.error("Crawl error:", error);
      throw error;
    }
  };

  const handleCheckClick = async (checkType: string) => {
    if (!isValidUrl) return;

    setIsLoading(true);

    try {
      // First crawl the URL if we don't have data yet
      let data = crawlData;
      if (!data) {
        data = await crawlUrl();
        setCrawlData(data);
      }

      // Run the specific health check
      await runHealthCheck(checkType, data);
    } catch (error) {
      console.error(`Error running ${checkType} check:`, error);
      // Add error result
      const errorResult: HealthCheckResult = {
        id: checkType,
        label: enabledHealthChecks.find(c => c.id === checkType)?.label || checkType,
        status: "error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        timestamp: Date.now()
      };
      setHealthResults(prev => [...prev.filter(r => r.id !== checkType), errorResult]);
    } finally {
      setIsLoading(false);
    }
  };

  const runHealthCheck = async (checkType: string, data: CrawlData) => {
    // Placeholder for actual health check logic
    // This will be implemented in the next step
    const result: HealthCheckResult = {
      id: checkType,
      label: enabledHealthChecks.find(c => c.id === checkType)?.label || checkType,
      status: "success",
      message: `${checkType} check completed successfully`,
      timestamp: Date.now(),
      reportId: `${checkType}-${Date.now()}` // Generate unique report ID
    };

    setHealthResults(prev => [...prev.filter(r => r.id !== checkType), result]);

    // Store report data for the report page (in a real app, this would be saved to a database)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`report-${result.reportId}`, JSON.stringify({
        ...result,
        url: data.url,
        crawlData: data
      }));
    }
  };

  const handleRunAllChecks = async () => {
    if (!isValidUrl) return;

    setIsLoading(true);

    try {
      // Crawl the URL once
      let data = crawlData;
      if (!data) {
        data = await crawlUrl();
        setCrawlData(data);
      }

      // Run all enabled health checks
      for (const check of enabledHealthChecks) {
        await runHealthCheck(check.id, data);
      }
    } catch (error) {
      console.error("Error running all checks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const enabledHealthChecks = healthChecksConfig.healthChecks.filter(check => check.enabled);

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <label htmlFor="url-input" className="text-sm font-medium text-foreground">
          Website URL
        </label>
        <div className="relative">
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={handleUrlChange}
            className={`pr-10 ${
              url && !isValidUrl
                ? "border-red-500 focus-visible:border-red-500"
                : url && isValidUrl
                ? "border-green-500 focus-visible:border-green-500"
                : ""
            }`}
          />
          {url && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidUrl ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-red-500" />
              )}
            </div>
          )}
        </div>
        {url && !isValidUrl && (
          <p className="text-sm text-destructive">
            Please enter a valid URL (e.g., https://example.com)
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Health Check Options
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enabledHealthChecks.map((check) => {
            const IconComponent = iconMap[check.icon as keyof typeof iconMap];
            return (
              <Button
                key={check.id}
                variant="outline"
                size="lg"
                className="h-auto p-4 flex flex-col items-start text-left space-y-2 hover:shadow-md transition-shadow disabled:opacity-50"
                disabled={!isValidUrl || isLoading}
                onClick={() => handleCheckClick(check.id)}
              >
                <div className="flex items-center space-x-2 w-full">
                  <IconComponent className={`h-5 w-5 ${check.color}`} />
                  <span className="font-medium text-foreground">
                    {check.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  {check.description}
                </p>
              </Button>
            );
          })}
        </div>
      </div>

      {isValidUrl && (
        <>
          <div className="pt-4 border-t">
            <Button
              size="lg"
              className="w-full"
              disabled={!isValidUrl || isLoading}
              onClick={handleRunAllChecks}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Running Checks..." : "Run All Checks"}
            </Button>
          </div>

          {healthResults.length > 0 && (
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Health Check Results
              </h3>
              <div className="space-y-3">
                {healthResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-4 rounded-lg border ${
                      result.status === "success"
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                        : result.status === "warning"
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
                        : result.status === "error"
                        ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{result.label}</h4>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            result.status === "success"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : result.status === "warning"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : result.status === "error"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {result.status.toUpperCase()}
                        </div>
                        {result.reportId && (
                          <Link href={`/report/${result.reportId}`}>
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Report
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{result.message}</p>
                    {result.score !== undefined && (
                      <p className="text-sm font-medium mt-1">Score: {result.score}/100</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}