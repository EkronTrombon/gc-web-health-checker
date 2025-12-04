'use server'

import FirecrawlApp from "@mendable/firecrawl-js";
import type { CrawlData } from '@/types/crawl';

/**
 * Server action to crawl a URL using Firecrawl
 */
export async function crawlUrl(url: string): Promise<CrawlData> {
    if (!url) {
        throw new Error('URL is required');
    }

    const firecrawl = new FirecrawlApp({
        apiKey: process.env.FIRECRAWL_API_KEY
    });

    if (!process.env.FIRECRAWL_API_KEY) {
        throw new Error('Firecrawl API key not configured');
    }

    try {
        // Scrape the URL with various options for comprehensive analysis
        const scrapeResult = await firecrawl.scrapeUrl(url, {
            formats: ["markdown", "html"],
            includeTags: ["title", "meta", "link", "script", "img", "a"],
            onlyMainContent: false,
            waitFor: 2000
        });

        if (!scrapeResult.success) {
            console.error("Firecrawl scrape failed:", scrapeResult);
            throw new Error(scrapeResult.error || 'Failed to crawl URL');
        }

        console.log("Firecrawl response structure:", {
            hasHtml: !!scrapeResult.html,
            hasMarkdown: !!scrapeResult.markdown,
            responseKeys: Object.keys(scrapeResult)
        });

        // Extract useful data for health checks
        const crawlData: CrawlData = {
            url: url,
            title: scrapeResult.metadata?.title || scrapeResult.title || "",
            description: scrapeResult.metadata?.description || scrapeResult.description || "",
            keywords: scrapeResult.metadata?.keywords || "",
            ogTitle: scrapeResult.metadata?.ogTitle || "",
            ogDescription: scrapeResult.metadata?.ogDescription || "",
            ogImage: scrapeResult.metadata?.ogImage || "",
            html: scrapeResult.html || "",
            markdown: scrapeResult.markdown || "",
            statusCode: scrapeResult.metadata?.statusCode || 200,
            responseTime: scrapeResult.metadata?.responseTime || 0,
            screenshot: scrapeResult.screenshot || null,
            links: (scrapeResult.links || []).map((link: string | { text: string; href: string }) =>
                typeof link === 'string' ? { text: '', href: link } : link
            ) as { text: string; href: string }[],
            metadata: scrapeResult.metadata || {}
        };

        return crawlData;

    } catch (error) {
        console.error("Crawling error:", error);
        throw error instanceof Error ? error : new Error('Unknown crawling error');
    }
}
