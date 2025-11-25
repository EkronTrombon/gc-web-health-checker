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
  checks: any[];
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
            className={`group relative p-6 rounded-xl text-left transition-all duration-300 hover:-translate-y-1 ${
              isValidUrl && !isLoading 
                ? "hover:shadow-xl cursor-pointer bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 border border-transparent hover:border-primary/20" 
                : "opacity-50 cursor-not-allowed bg-muted/20 border border-border/50"
            }`}
            disabled={!isValidUrl || isLoading}
            onClick={() => onCheckClick(check.id)}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${check.color.replace('text-', 'from-').replace('500', '100')} to-transparent dark:from-white/10`}>
                <IconComponent className={`h-6 w-6 ${check.color}`} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {check.label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
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
