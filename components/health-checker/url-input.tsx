"use client";

import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

interface UrlInputProps {
  url: string;
  isValidUrl: boolean;
  onUrlChange: (value: string) => void;
}

export function UrlInput({ url, isValidUrl, onUrlChange }: UrlInputProps) {
  return (
    <div className="space-y-4">
      <label htmlFor="url-input" className="text-lg font-medium text-foreground">
        Enter Website URL
      </label>
      <div className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${isValidUrl ? 'opacity-50' : ''}`}></div>
        <div className="relative flex items-center">
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="h-14 px-6 text-lg bg-background/80 backdrop-blur-sm border-0 ring-offset-0 focus-visible:ring-0 shadow-sm rounded-lg pr-12"
          />
          <div className="absolute right-4">
            {url && (
              isValidUrl ? (
                <CheckCircle className="h-6 w-6 text-green-500 animate-in zoom-in duration-300" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )
            )}
          </div>
        </div>
      </div>
      {url && !isValidUrl && (
        <p className="text-sm text-destructive animate-in slide-in-from-top-1">
          Please enter a valid URL (e.g., https://example.com)
        </p>
      )}
    </div>
  );
}
