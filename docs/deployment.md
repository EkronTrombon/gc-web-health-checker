# Deployment Guide

This guide covers deploying the GC Web Health Checker to production environments.

## Deployment Platforms

### Vercel (Recommended)

Vercel is the recommended platform as it's built by the creators of Next.js and offers:
- Zero-configuration deployment
- Automatic HTTPS
- Edge network (CDN)
- Serverless functions
- Environment variable management
- Automatic preview deployments

### Other Platforms

The app can also be deployed to:
- **Netlify** - Similar to Vercel
- **AWS Amplify** - AWS integration
- **Railway** - Simple deployment
- **DigitalOcean App Platform** - VPS alternative
- **Self-hosted** - Docker or Node.js server

## Deploying to Vercel

### Prerequisites

- GitHub, GitLab, or Bitbucket account
- Vercel account (free tier available)
- Repository pushed to Git hosting

### Step-by-Step Deployment

#### 1. Push Code to Git

```bash
# Initialize git (if not already)
git init

# Add remote
git remote add origin <your-repo-url>

# Commit and push
git add .
git commit -m "Initial commit"
git push -u origin main
```

#### 2. Import to Vercel

1. Visit [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your Git repository
4. Vercel auto-detects Next.js configuration

#### 3. Configure Build Settings

Vercel automatically detects:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

No changes needed unless you have custom requirements.

#### 4. Set Environment Variables

In Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add your API keys:

```bash
# Firecrawl API
FIRECRAWL_API_KEY=fc-your-production-key

# Google PageSpeed Insights
PAGESPEED_API_KEY=AIzaSy...your-production-key

# DataForSEO
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your-production-password
```

3. Set for **Production**, **Preview**, and **Development** environments
4. Click **Save**

#### 5. Deploy

Click **Deploy** button.

Vercel will:
- Install dependencies
- Build the application
- Deploy to edge network
- Provide deployment URL

#### 6. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. Vercel automatically provisions SSL certificate

### Automatic Deployments

Once connected:
- **Push to main branch** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

## Deploying to Netlify

### Step-by-Step

#### 1. Push to Git

Same as Vercel setup.

#### 2. Import to Netlify

1. Visit [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git repository

#### 3. Configure Build

```bash
# Build command
npm run build

# Publish directory
.next

# Functions directory (optional)
netlify/functions
```

#### 4. Environment Variables

In Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add your API keys (same as Vercel)

#### 5. Deploy

Click **Deploy site**.

### Netlify Configuration File

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
```

## Self-Hosted Deployment

### Using Node.js

#### 1. Build Application

```bash
npm run build
```

#### 2. Start Production Server

```bash
npm start
```

Server runs on port 3000 by default.

#### 3. Use Process Manager

Install PM2:

```bash
npm install -g pm2
```

Start with PM2:

```bash
pm2 start npm --name "health-checker" -- start
pm2 save
pm2 startup
```

#### 4. Configure Reverse Proxy

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com
```

### Using Docker

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### 2. Update next.config.ts

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

#### 3. Build and Run

```bash
# Build image
docker build -t health-checker .

# Run container
docker run -p 3000:3000 \
  -e FIRECRAWL_API_KEY=your-key \
  -e PAGESPEED_API_KEY=your-key \
  -e DATAFORSEO_LOGIN=your-email \
  -e DATAFORSEO_PASSWORD=your-password \
  health-checker
```

#### 4. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
      - PAGESPEED_API_KEY=${PAGESPEED_API_KEY}
      - DATAFORSEO_LOGIN=${DATAFORSEO_LOGIN}
      - DATAFORSEO_PASSWORD=${DATAFORSEO_PASSWORD}
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

## Environment Variables

### Production Best Practices

1. **Use different keys for production**
   - Never use development keys in production
   - Rotate keys regularly

2. **Secure storage**
   - Use platform's environment variable management
   - Never commit to Git
   - Use secrets management for sensitive data

3. **Required variables**
   ```bash
   # Optional but recommended for full functionality
   FIRECRAWL_API_KEY=
   PAGESPEED_API_KEY=
   DATAFORSEO_LOGIN=
   DATAFORSEO_PASSWORD=
   ```

4. **Optional variables**
   ```bash
   # Base URL for API calls (auto-detected if not set)
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   
   # Node environment
   NODE_ENV=production
   ```

## Performance Optimization

### 1. Enable Caching

Add caching headers in `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
    ];
  },
};
```

### 2. Image Optimization

Ensure images use Next.js Image component:

```typescript
import Image from 'next/image';

<Image 
  src="/logo.png" 
  alt="Logo" 
  width={200} 
  height={100}
  priority
/>
```

### 3. Bundle Analysis

Analyze bundle size:

```bash
npm install @next/bundle-analyzer

# In next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

## Monitoring

### Vercel Analytics

Enable in Vercel dashboard:
1. Go to **Analytics** tab
2. Enable **Web Analytics**
3. View real-time metrics

### Error Tracking

#### Sentry Integration

```bash
npm install @sentry/nextjs
```

Configure `sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** - Free uptime monitoring
- **Pingdom** - Advanced monitoring
- **StatusCake** - Multi-location checks

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] API keys rotated regularly
- [ ] CORS configured properly
- [ ] Rate limiting implemented (if needed)
- [ ] Security headers configured
- [ ] Dependencies updated
- [ ] Error messages don't expose sensitive data

## Troubleshooting

### Build Fails

**Check build logs:**
- TypeScript errors
- Missing dependencies
- Environment variable issues

**Solutions:**
```bash
# Test build locally
npm run build

# Check TypeScript
npx tsc --noEmit

# Update dependencies
npm update
```

### Runtime Errors

**Check server logs:**
- API endpoint errors
- Missing environment variables
- External API failures

**Solutions:**
- Verify environment variables
- Check API key validity
- Review error messages

### Performance Issues

**Check metrics:**
- Response times
- Bundle size
- API call frequency

**Solutions:**
- Enable caching
- Optimize images
- Reduce API calls
- Use CDN

## Rollback Strategy

### Vercel

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **⋯** → **Promote to Production**

### Git-based

```bash
# Revert to previous commit
git revert HEAD
git push

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Post-Deployment

### 1. Verify Deployment

- [ ] Visit production URL
- [ ] Test all health checks
- [ ] Verify API integrations
- [ ] Check error tracking
- [ ] Monitor performance

### 2. DNS Configuration

If using custom domain:
- Update DNS records
- Wait for propagation (up to 48 hours)
- Verify SSL certificate

### 3. Monitor

- Set up uptime monitoring
- Configure error alerts
- Review analytics
- Monitor API usage

## Scaling Considerations

### Serverless (Vercel/Netlify)
- Automatically scales
- Pay per execution
- No server management

### Self-Hosted
- Use load balancer
- Multiple instances with PM2
- Database for result caching
- Redis for session storage

## Cost Estimation

### Vercel Free Tier
- 100 GB bandwidth
- Unlimited deployments
- Serverless function executions

### Vercel Pro ($20/month)
- 1 TB bandwidth
- Advanced analytics
- Team collaboration

### External APIs
- **Firecrawl:** ~$0.01-0.05 per request
- **PageSpeed:** Free (25k/day)
- **DataForSEO:** ~$0.02-0.05 per request

**Estimated monthly cost:**
- 1000 checks/month: ~$10-50
- 10000 checks/month: ~$100-500

## Related Documentation

- [Getting Started Guide](./getting-started.md) - Initial setup
- [API Integration Guide](./api-integration.md) - Configure APIs
- [Architecture Overview](./architecture.md) - System design
- [Development Guide](./development.md) - Development workflows
