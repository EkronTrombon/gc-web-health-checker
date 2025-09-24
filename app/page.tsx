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
  Search
} from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);

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
  };

  const handleCheckClick = (checkType: string) => {
    if (!isValidUrl) return;
    console.log(`Running ${checkType} check for:`, url);
  };

  const healthChecks = [
    {
      id: "markup",
      label: "W3C Markup Validation",
      description: "Validate HTML markup",
      icon: Globe,
      color: "text-blue-600"
    },
    {
      id: "accessibility",
      label: "Accessibility Check",
      description: "WCAG compliance analysis",
      icon: Eye,
      color: "text-green-600"
    },
    {
      id: "contrast",
      label: "Contrast Checker",
      description: "Color contrast validation",
      icon: Shield,
      color: "text-purple-600"
    },
    {
      id: "lighthouse",
      label: "Lighthouse Report",
      description: "Performance & best practices",
      icon: Zap,
      color: "text-orange-600"
    },
    {
      id: "seo",
      label: "SEO Analysis",
      description: "Search engine optimization",
      icon: Search,
      color: "text-indigo-600"
    },
    {
      id: "security",
      label: "Security Headers",
      description: "Security configuration check",
      icon: CheckCircle,
      color: "text-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Web Health Checker
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Comprehensive website analysis for markup validation, accessibility, performance, and more
            </p>
          </div>

          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="url-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                <p className="text-sm text-red-600 dark:text-red-400">
                  Please enter a valid URL (e.g., https://example.com)
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Health Check Options
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthChecks.map((check) => {
                  const IconComponent = check.icon;
                  return (
                    <Button
                      key={check.id}
                      variant="outline"
                      size="lg"
                      className="h-auto p-4 flex flex-col items-start text-left space-y-2 hover:shadow-md transition-shadow disabled:opacity-50"
                      disabled={!isValidUrl}
                      onClick={() => handleCheckClick(check.id)}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <IconComponent className={`h-5 w-5 ${check.color}`} />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {check.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 text-left">
                        {check.description}
                      </p>
                    </Button>
                  );
                })}
              </div>
            </div>

            {isValidUrl && (
              <div className="pt-4 border-t">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    healthChecks.forEach(check => handleCheckClick(check.id));
                  }}
                >
                  Run All Checks
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
