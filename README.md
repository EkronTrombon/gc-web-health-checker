# Web Health Checker

A comprehensive Next.js application for analyzing website health, performance, and compliance across multiple dimensions including markup validation, accessibility, security, and SEO.

## Features

### 🔍 Health Check Categories

- **W3C Markup Validation** - Validate HTML markup against W3C standards
- **Accessibility Check** - WCAG compliance analysis for inclusive web design
- **Contrast Checker** - Color contrast validation for readability
- **Lighthouse Report** - Performance, best practices, and quality metrics
- **SEO Analysis** - Search engine optimization assessment
- **Security Headers** - Security configuration and header analysis

### ✨ Key Features

- **Real-time URL Validation** - Instant feedback on URL validity
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode** - Built-in theme support
- **Interactive UI** - Intuitive interface with visual feedback
- **Batch Analysis** - Run all checks simultaneously or individually

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gc-web-health-checker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. Enter a valid website URL (e.g., `https://example.com`)
2. Choose individual health checks or click "Run All Checks"
3. View results and recommendations for improvements

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main health checker interface
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions
└── public/              # Static assets
```

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Component Library

This project uses [shadcn/ui](https://ui.shadcn.com/) components built on top of Radix UI primitives. Components are located in `components/ui/` and can be customized through the `components.json` configuration.

## Roadmap

- [ ] Implement W3C Markup Validation API integration
- [ ] Add accessibility scanning with axe-core
- [ ] Integrate Lighthouse CI for performance analysis
- [ ] Implement color contrast checking algorithms
- [ ] Add SEO analysis with meta tags and structure validation
- [ ] Security headers analysis and recommendations
- [ ] Results visualization and reporting
- [ ] Export functionality (PDF, JSON)
- [ ] Historical analysis tracking
- [ ] Batch URL processing

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Lucide](https://lucide.dev/) for the icon set
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
