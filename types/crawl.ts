export interface CrawlData {
  url: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  html: string;
  markdown: string;
  statusCode: number;
  responseTime: number;
  screenshot: string | null;
  links: Array<{
    text: string;
    href: string;
  }>;
  metadata: Record<string, any>;
}

export interface CrawlResponse {
  success: boolean;
  data?: CrawlData;
  error?: string;
  details?: string;
}

export interface HealthCheckResult {
  id: string;
  label: string;
  status: "pending" | "running" | "success" | "warning" | "error";
  score?: number;
  message: string;
  details?: Array<{
    type: "error" | "warning" | "info";
    message: string;
  }>;
  timestamp: number;
  reportId?: string;
}