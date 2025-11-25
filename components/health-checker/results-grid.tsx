"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { HealthCheckResult } from "@/types/crawl";

interface ResultsGridProps {
  results: HealthCheckResult[];
}

export function ResultsGrid({ results }: ResultsGridProps) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h3 className="text-2xl font-semibold text-foreground">
        Analysis Results
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <div
            key={result.id}
            className="glass rounded-xl p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border-0"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-lg">{result.label}</h4>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                    result.status === "success"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                      : result.status === "warning"
                      ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
                      : result.status === "error"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                  }`}
                >
                  {result.status}
                </div>
              </div>

              {result.score !== undefined && (
                <div className="flex flex-col">
                  <div className="flex items-end space-x-2">
                    <span className="text-4xl font-bold tracking-tighter">
                      {result.score}
                    </span>
                    <span className="text-sm text-muted-foreground mb-1.5">/ 100</span>
                  </div>
                  {result.dataSource && (
                    <span className="text-xs text-muted-foreground mt-1">
                      Source: {result.dataSource}
                    </span>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground flex-grow line-clamp-3 leading-relaxed">
                {result.message}
              </p>

              {result.reportId && (
                <Link href={`/report/${result.reportId}`} target="_blank" rel="noopener noreferrer" className="pt-4 mt-auto">
                  <Button variant="outline" className="w-full group hover:border-primary/50 hover:bg-primary/5">
                    View Full Report
                    <ExternalLink className="h-3 w-3 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
