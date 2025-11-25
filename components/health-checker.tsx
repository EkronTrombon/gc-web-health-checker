"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { useHealthCheck } from "@/hooks/use-health-check";
import { UrlInput } from "./health-checker/url-input";
import { CheckGrid } from "./health-checker/check-grid";
import { ResultsGrid } from "./health-checker/results-grid";

export function HealthChecker() {
  const {
    url,
    isValidUrl,
    isLoading,
    healthResults,
    enabledHealthChecks,
    handleUrlChange,
    handleCheckClick,
    handleRunAllChecks
  } = useHealthCheck();

  return (
    <div className="space-y-8">
      <Card className="p-8 glass border-0 space-y-8">
        <UrlInput 
          url={url} 
          isValidUrl={isValidUrl} 
          onUrlChange={handleUrlChange} 
        />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              Health Checks
            </h2>
            {isValidUrl && (
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105"
                disabled={!isValidUrl || isLoading}
                onClick={handleRunAllChecks}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Analysis...
                  </>
                ) : (
                  <>
                    Run All Checks
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
          
          <CheckGrid 
            checks={enabledHealthChecks}
            isValidUrl={isValidUrl}
            isLoading={isLoading}
            onCheckClick={handleCheckClick}
          />
        </div>
      </Card>

      <ResultsGrid results={healthResults} />
    </div>
  );
}