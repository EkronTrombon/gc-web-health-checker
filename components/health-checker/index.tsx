"use client";

import { useHealthCheck } from "@/hooks/use-health-check";
import { UrlInput } from "./url-input";
import { CheckGrid } from "./check-grid";
import { ResultsGrid } from "./results-grid";

export function HealthChecker() {
  const {
    url,
    isValidUrl,
    isLoading,
    healthResults,
    enabledHealthChecks,
    handleUrlChange,
    handleCheckClick,
  } = useHealthCheck();

  const checks = enabledHealthChecks.map(check => ({
    id: check.id,
    label: check.label,
    description: check.description,
    icon: check.icon,
    color: check.color || "text-primary"
  }));

  return (
    <div className="space-y-8">
      <UrlInput
        url={url}
        isValidUrl={isValidUrl}
        onUrlChange={handleUrlChange}
      />

      <CheckGrid
        checks={checks}
        isValidUrl={isValidUrl}
        isLoading={isLoading}
        onCheckClick={handleCheckClick}
      />

      <ResultsGrid results={healthResults} />
    </div>
  );
}
