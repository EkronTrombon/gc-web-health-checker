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
            // Use server action for crawling
            const { crawlUrl: crawlUrlAction } = await import('@/app/actions/crawl');
            const data = await crawlUrlAction(url);
            return data;
        } catch (error) {
            console.error("Crawl error:", error);
            throw error;
        }
    };

    const runHealthCheck = async (checkType: string, data: CrawlData) => {
        try {
            let validationResult;

            // All validators now use server actions
            if (checkType === 'accessibility') {
                const { validateAccessibility } = await import('@/app/actions/validate/accessibility');
                validationResult = await validateAccessibility(data.url, data.html);
                validationResult = { success: true, data: validationResult };
            } else if (checkType === 'seo') {
                const { validateSEO } = await import('@/app/actions/validate/seo');
                validationResult = await validateSEO(data.url, data.html);
                validationResult = { success: true, data: validationResult };
            } else if (checkType === 'markup') {
                const { validateHTMLMarkup } = await import('@/app/actions/validate/markup');
                validationResult = await validateHTMLMarkup(data.url, data.html);
                validationResult = { success: true, data: validationResult };
            } else if (checkType === 'contrast') {
                const { validateContrast } = await import('@/app/actions/validate/contrast');
                validationResult = await validateContrast(data.url, data.html);
                validationResult = { success: true, data: validationResult };
            } else if (checkType === 'security') {
                const { validateSecurity } = await import('@/app/actions/validate/security');
                validationResult = await validateSecurity(data.url);
                validationResult = { success: true, data: validationResult };
            } else if (checkType === 'lighthouse') {
                const { validateLighthouse } = await import('@/app/actions/validate/lighthouse');
                validationResult = await validateLighthouse(data.url);
                validationResult = { success: true, data: validationResult };
            } else {
                throw new Error(`Unknown check type: ${checkType}`);
            }

            if (!validationResult.success) {
                throw new Error('Validation failed');
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

            // Store essential report data for the report page (excluding large data like HTML and screenshots)
            // In a real app, this would be saved to a database
            if (typeof window !== 'undefined' && result.reportId) {
                // Create a lightweight version without large data
                const lightweightReport = {
                    ...reportData,
                    // Include only essential crawl metadata, not the full HTML/screenshot
                    crawlData: {
                        url: data.url,
                        title: data.title,
                        description: data.description,
                        statusCode: data.statusCode,
                        responseTime: data.responseTime,
                        // Exclude: html, markdown, screenshot, links
                    }
                };

                try {
                    localStorage.setItem(`report-${result.reportId}`, JSON.stringify(lightweightReport));
                } catch (error) {
                    // Handle quota exceeded error gracefully
                    if (error instanceof Error && error.name === 'QuotaExceededError') {
                        console.warn('localStorage quota exceeded. Clearing old reports...');
                        // Clear old report data to make space
                        const keys = Object.keys(localStorage);
                        const reportKeys = keys.filter(key => key.startsWith('report-'));
                        // Keep only the 5 most recent reports
                        if (reportKeys.length > 5) {
                            reportKeys.slice(0, reportKeys.length - 5).forEach(key => {
                                localStorage.removeItem(key);
                            });
                        }
                        // Try storing again
                        try {
                            localStorage.setItem(`report-${result.reportId}`, JSON.stringify(lightweightReport));
                        } catch (retryError) {
                            console.error('Failed to store report even after cleanup:', retryError);
                        }
                    } else {
                        console.error('Error storing report:', error);
                    }
                }
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
