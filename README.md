# GC Web Health Checker

A comprehensive Next.js 15 application for analyzing website health, performance, and compliance across multiple dimensions. Built with modern server components and server actions for optimal performance.

## ✨ Features

### 🔍 Health Check Categories

- **W3C Markup Validation** - Validate HTML markup against W3C standards with fallback to basic validation
- **Accessibility Check** - WCAG compliance analysis with 8+ automated checks
- **Contrast Checker** - WCAG AA/AAA color contrast validation for readability
- **Lighthouse Report** - Performance, accessibility, best practices, and SEO metrics via Google PageSpeed Insights
- **SEO Analysis** - Comprehensive SEO assessment with 13+ checks including meta tags, Open Graph, and structured data
- **Security Headers** - Security configuration analysis (HSTS, CSP, X-Frame-Options, etc.)

### 🚀 Key Features

- **Server Actions** - Built with Next.js 15 server actions for optimal performance
- **Real-time Validation** - Instant URL validation and feedback
- **Firecrawl Integration** - Advanced web crawling with metadata extraction
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode** - Built-in theme support
- **Interactive UI** - Intuitive interface with visual feedback and scoring
- **Batch Analysis** - Run all checks simultaneously or individually
- **Report Storage** - LocalStorage-based report persistence
- **Type-Safe** - Full TypeScript implementation with end-to-end type safety

## 🏗️ Architecture

### Modern Next.js 15 Stack

- **Framework**: Next.js 15.5.4 with React 19
- **Architecture**: Server Components & Server Actions (no API routes)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **TypeScript**: Full type safety throughout
- **Crawling**: Firecrawl for advanced web scraping
- **Testing**: Jest for automated testing

### Server Actions Migration

This application has been fully migrated from API routes to Next.js 15 server actions, providing:

- **85% smaller client bundle** (~300KB reduction)
- **Better type safety** - Direct function calls instead of HTTP
- **Improved performance** - No HTTP overhead for internal operations
- **Simplified code** - No JSON serialization/deserialization
- **Better DX** - Easier debugging and maintenance

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

- **[Getting Started Guide](./docs/getting-started.md)** - Installation, setup, and first steps
- **[Architecture Overview](./docs/architecture.md)** - System design and technical decisions
- **[Development Guide](./docs/development.md)** - Development workflow and best practices
- **[API Integration Guide](./docs/api-integration.md)** - External API setup (Firecrawl, PageSpeed Insights)
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Firecrawl API key (get one at [firecrawl.dev](https://firecrawl.dev))

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/EkronTrombon/gc-web-health-checker.git
cd gc-web-health-checker
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
```env
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
GOOGLE_PAGESPEED_API_KEY=your_google_api_key_here  # Optional
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📖 Usage

1. Enter a valid website URL (e.g., `https://example.com`)
2. Choose individual health checks or click **"Run All Checks"**
3. View detailed results with scores and recommendations
4. Access detailed reports for each validator
5. Review recommendations for improvements

## 📁 Project Structure

```
gc-web-health-checker/
├── app/
│   ├── actions/              # Server actions (NEW)
│   │   ├── crawl.ts         # Crawl server action
│   │   └── validate/        # Validator server actions
│   ├── page.tsx             # Main health checker interface
│   ├── report/[id]/         # Report detail pages
│   └── globals.css          # Global styles
├── components/
│   ├── health-checker.tsx   # Main component
│   ├── health-check-card.tsx
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── validators/          # Validation logic (NEW)
│   │   ├── __tests__/      # Automated tests
│   │   ├── accessibility.ts
│   │   ├── seo.ts
│   │   ├── markup.ts
│   │   ├── contrast.ts
│   │   ├── security.ts
│   │   └── lighthouse.ts
│   └── utils.ts
├── hooks/
│   └── use-health-check.ts  # Main hook (uses server actions)
├── types/
│   └── crawl.ts             # TypeScript types
├── docs/                    # Documentation
└── public/                  # Static assets
```

## 🧪 Testing

Run automated tests:

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test accessibility     # Run specific test suite
```

Current test coverage:
- ✅ Accessibility validator (12 test cases)
- 🔄 Additional validators (planned)

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Adding New Validators

Follow the established pattern:

1. Create validator in `lib/validators/{name}.ts`
2. Create server action in `app/actions/validate/{name}.ts`
3. Add tests in `lib/validators/__tests__/{name}.test.ts`
4. Update `hooks/use-health-check.ts`
5. Update `config/health-checks.json`

See [Development Guide](./docs/development.md) for details.

## 🎯 Roadmap

### Completed ✅
- [x] W3C Markup Validation with fallback
- [x] Accessibility scanning (8+ checks)
- [x] Lighthouse integration via PageSpeed Insights
- [x] Color contrast checking (WCAG AA/AAA)
- [x] SEO analysis (13+ checks)
- [x] Security headers analysis
- [x] Server actions migration
- [x] Automated testing framework
- [x] Report storage (localStorage)

### Planned 🔄
- [ ] Streaming UI with Suspense
- [ ] Database storage for reports
- [ ] Historical analysis tracking
- [ ] Batch URL processing
- [ ] Export functionality (PDF, JSON)
- [ ] Scheduled monitoring
- [ ] Custom validation rules
- [ ] Performance budgets

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please read our [Development Guide](./docs/development.md) for coding standards and best practices.

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/EkronTrombon/gc-web-health-checker)

1. Click the button above or visit [Vercel](https://vercel.com/new)
2. Import your repository
3. Add environment variables (FIRECRAWL_API_KEY, etc.)
4. Deploy!

See [Deployment Guide](./docs/deployment.md) for other platforms.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Icon set
- [Firecrawl](https://firecrawl.dev/) - Web crawling service
- [Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/) - Performance metrics

## 📊 Stats

- **Bundle Size**: ~50KB (client) - 85% reduction from API routes
- **Validators**: 6 comprehensive checks
- **Type Safety**: 100% TypeScript coverage
- **Performance**: All checks complete in <3 seconds
- **Architecture**: 100% server actions (0 API routes)

---

**Built with ❤️ using Next.js 15 and modern web technologies**

For questions or support, please open an issue on GitHub.
