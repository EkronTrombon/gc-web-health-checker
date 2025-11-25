"use client";

import { useState } from "react";
import healthChecksConfig from "@/config/health-checks.json";
import type { CrawlData, CrawlResponse, HealthCheckResult } from "@/types/crawl";

export function useHealthCheck() {
    const [url, setUrl] = useState("");
    const [isValidUrl, setIsValidUrl] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
    const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([]);

    const enabledHealthChecks = healthChecksConfig.healthChecks.filter(check => check.enabled);

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

    const handleUrlChange = (value: string) => {
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

    const runHealthCheck = async (checkType: string, data: CrawlData) => {
        try {
            // Call the appropriate validation API
            const apiEndpoint = `/api/validate/${checkType}`;
            const requestBody = checkType === 'security' || checkType === 'lighthouse'
                ? { url: data.url }
                : { url: data.url, html: data.html };

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            const validationResult = await response.json();

            if (!validationResult.success) {
                throw new Error(validationResult.error || 'Validation failed');
            }

            const reportData = validationResult.data;

            const result: HealthCheckResult = {
                id: checkType,
                label: reportData.label || enabledHealthChecks.find(c => c.id === checkType)?.label || checkType,
                status: reportData.status,
                message: reportData.message,
                timestamp: reportData.timestamp,
                reportId: reportData.id,
                score: reportData.score
            };

            setHealthResults(prev => [...prev.filter(r => r.id !== checkType), result]);

            // Store full report data for the report page (in a real app, this would be saved to a database)
            if (typeof window !== 'undefined') {
                localStorage.setItem(`report-${result.reportId}`, JSON.stringify({
                    ...reportData,
                    crawlData: data
                }));
            }

        } catch (error) {
            console.error(`Error running ${checkType} check:`, error);

            // Create error result
            const result: HealthCheckResult = {
                id: checkType,
                label: enabledHealthChecks.find(c => c.id === checkType)?.label || checkType,
                status: "error",
                message: error instanceof Error ? error.message : "An unknown error occurred",
                timestamp: Date.now(),
                reportId: `${checkType}-${Date.now()}-error`
            };

            setHealthResults(prev => [...prev.filter(r => r.id !== checkType), result]);
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

            // Run the specific health check only if we have data
            if (data) {
                await runHealthCheck(checkType, data);
            }
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

            // Run all enabled health checks only if we have data
            if (data) {
                for (const check of enabledHealthChecks) {
                    await runHealthCheck(check.id, data);
                }
            }
        } catch (error) {
            console.error("Error running all checks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        url,
        isValidUrl,
        isLoading,
        healthResults,
        enabledHealthChecks,
        handleUrlChange,
        handleCheckClick,
        handleRunAllChecks
    };
}
