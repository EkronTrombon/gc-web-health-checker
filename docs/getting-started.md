# Getting Started with GC Web Health Checker

Welcome to the GC Web Health Checker! This guide will help you get up and running quickly.

## Overview

GC Web Health Checker is a comprehensive Next.js application that analyzes website health across multiple dimensions:

- **W3C Markup Validation** - HTML standards compliance
- **Accessibility Check** - WCAG compliance analysis
- **Contrast Checker** - Color contrast validation
- **Lighthouse Report** - Performance and quality metrics
- **SEO Analysis** - Search engine optimization assessment
- **Security Headers** - Security configuration analysis

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18 or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- A code editor (VS Code recommended)
- Basic knowledge of React and Next.js

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gc-web-health-checker
```

### 2. Install Dependencies

Choose your preferred package manager:

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install

# Using bun
bun install
```

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Firecrawl API (for web crawling)
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Google PageSpeed Insights API (optional, for Lighthouse)
PAGESPEED_API_KEY=your_pagespeed_api_key_here

# DataForSEO API (optional, for advanced SEO analysis)
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_api_password_here
```

> **Note:** The application will work without API keys, but with limited functionality. See the [API Integration Guide](./api-integration.md) for details.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Quick Start

### Running Your First Health Check

1. **Enter a URL**
   - Type a valid website URL (e.g., `https://example.com`)
   - The input validates URLs in real-time

2. **Choose Your Analysis**
   - Click individual check buttons for specific analysis
   - Or click **"Run All Checks"** for comprehensive analysis

3. **View Results**
   - Results appear below with scores and recommendations
   - Click on result cards to view detailed reports
   - Each check provides actionable insights

### Understanding Results

Each health check returns:

- **Status**: Success (green), Warning (yellow), or Error (red)
- **Score**: 0-100 rating where applicable
- **Message**: Summary of findings
- **Details**: Specific issues and recommendations
- **Data Source**: Whether API or simulation was used

## Project Structure

```
gc-web-health-checker/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── crawl/           # Web crawling endpoint
│   │   └── validate/        # Health check endpoints
│   ├── report/              # Report viewing page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── health-checker/      # Health checker components
│   ├── ui/                  # shadcn/ui components
│   └── theme-toggle.tsx     # Theme switcher
├── config/                  # Configuration files
│   └── health-checks.json   # Health check definitions
├── hooks/                   # Custom React hooks
│   └── use-health-check.ts  # Health check logic
├── lib/                     # Utility functions
│   └── utils.ts            # Helper utilities
├── types/                   # TypeScript types
│   └── crawl.ts            # Type definitions
└── public/                  # Static assets
```

## Available Scripts

- **`npm run dev`** - Start development server with Turbopack
- **`npm run build`** - Build for production
- **`npm start`** - Start production server
- **`npm run lint`** - Run ESLint

## Features Overview

### Real-time URL Validation
The URL input validates as you type, ensuring only valid URLs are submitted.

### Responsive Design
Works seamlessly on desktop, tablet, and mobile devices.

### Dark/Light Mode
Toggle between themes using the theme switcher in the header.

### Individual or Batch Analysis
Run checks individually or all at once for comprehensive analysis.

### Detailed Reports
Each check generates a detailed report with:
- Overall score
- Specific issues found
- Actionable recommendations
- Technical details

### API Integration
Integrates with external APIs for enhanced analysis:
- Firecrawl for web crawling
- Google PageSpeed Insights for Lighthouse
- DataForSEO for advanced SEO metrics

### Fallback Mechanisms
When APIs are unavailable, the app falls back to local analysis to ensure continuous functionality.

## Next Steps

- **[API Integration Guide](./api-integration.md)** - Configure external APIs
- **[Architecture Overview](./architecture.md)** - Understand the system design
- **[Development Guide](./development.md)** - Learn development workflows
- **[Deployment Guide](./deployment.md)** - Deploy to production

## Troubleshooting

### Port Already in Use

If port 3000 is busy:

```bash
# Use a different port
PORT=3001 npm run dev
```

### Module Not Found Errors

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

Ensure you're using Node.js 18+:

```bash
node --version
```

## Getting Help

- Check the [Development Guide](./development.md) for common issues
- Review the [Architecture Overview](./architecture.md) to understand the codebase
- See the [API Integration Guide](./api-integration.md) for API-related issues

## What's Next?

Now that you're set up, explore:

1. **Customize Health Checks** - Modify `config/health-checks.json`
2. **Add New Validators** - Create new API routes in `app/api/validate/`
3. **Enhance UI** - Customize components in `components/`
4. **Configure APIs** - Set up external services for enhanced analysis

Happy coding! 🚀
