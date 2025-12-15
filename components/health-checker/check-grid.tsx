"use client";

import {
  Globe,
  Shield,
  Eye,
  Zap,
  CheckCircle,
  Search
} from "lucide-react";

const iconMap = {
  Globe,
  Shield,
  Eye,
  Zap,
  CheckCircle,
  Search
};

interface CheckGridProps {
  checks: Array<{ 
    id: string; 
    label: string; 
    description: string; 
    icon: string;
    color: string;
  }>;
  isValidUrl: boolean;
  isLoading: boolean;
  onCheckClick: (id: string) => void;
}

export function CheckGrid({ checks, isValidUrl, isLoading, onCheckClick }: CheckGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {checks.map((check) => {
        const IconComponent = iconMap[check.icon as keyof typeof iconMap];
        return (
          <button
            key={check.id}
            className={`group relative p-6 rounded-lg text-left transition-all duration-300 hover:-translate-y-1 ${
              isValidUrl && !isLoading
                ? "hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-card hover:bg-accent border border-border hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                : "opacity-50 cursor-not-allowed bg-muted/50 border border-border"
            }`}
            disabled={!isValidUrl || isLoading}
            onClick={() => onCheckClick(check.id)}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-lg bg-muted group-hover:bg-muted/70 transition-all duration-300">
                <IconComponent className="h-6 w-6 text-foreground transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground transition-colors duration-300">
                  {check.label}
                </h3>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300 leading-relaxed">
                  {check.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
