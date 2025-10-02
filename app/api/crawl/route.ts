import { NextRequest, NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Initialize Firecrawl (you'll need to set FIRECRAWL_API_KEY in environment variables)
    const firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY
    });

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: "Firecrawl API key not configured" },
        { status: 500 }
      );
    }

    // Scrape the URL with various options for comprehensive analysis
    const scrapeResult = await firecrawl.scrapeUrl(url, {
      formats: ["markdown", "html"],
      includeTags: ["title", "meta", "link", "script", "img", "a"],
      onlyMainContent: false,
      waitFor: 2000
    });

    if (!scrapeResult.success) {
      console.error("Firecrawl scrape failed:", scrapeResult);
      return NextResponse.json(
        { error: "Failed to crawl URL", details: scrapeResult.error },
        { status: 500 }
      );
    }

    console.log("Firecrawl response structure:", {
      hasHtml: !!scrapeResult.html,
      hasMarkdown: !!scrapeResult.markdown,
      responseKeys: Object.keys(scrapeResult)
    });

    // Extract useful data for health checks
    const crawlData = {
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
      links: scrapeResult.links || [],
      metadata: scrapeResult.metadata || {}
    };

    return NextResponse.json({
      success: true,
      data: crawlData
    });

  } catch (error) {
    console.error("Crawling error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}