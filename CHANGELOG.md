# Changelog

All notable changes to JF Monitor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-13

### Added

#### Core Features
- 🎉 Initial release of JF Monitor
- ✅ Website uptime monitoring with configurable check frequencies (5-60 minutes)
- 📊 Real-time dashboard showing status, uptime, and response times
- 🔔 Email alerts via Brevo API
- 📱 Telegram alerts via Bot API
- 🔍 HTML content change detection with configurable thresholds
- 📈 SLA reporting with uptime percentage, response times, and incident metrics
- ⚡ Response time tracking (min, max, average, p95, p99)

#### Infrastructure
- 🚀 Deployed on Vercel serverless platform
- 💾 Vercel Postgres database (Prisma Postgres powered by Neon)
- 🤖 GitHub Actions integration for automated monitoring (5-minute cron)
- 🔐 Secret-based authentication for monitoring endpoints

#### UI Components
- Dashboard page with status cards and auto-refresh (30s)
- Websites management page with add/edit/delete functionality
- Navigation component with routing
- Loading states and error handling
- Responsive design with Tailwind CSS

#### API Endpoints
- `POST /api/monitor/check` - Trigger monitoring checks
- `GET /api/websites` - List all websites
- `POST /api/websites` - Create website
- `GET /api/websites/[id]` - Get website details
- `PUT /api/websites/[id]` - Update website
- `DELETE /api/websites/[id]` - Deactivate website
- `GET /api/checks` - Get check history with filtering
- `GET /api/incidents` - Get incidents with filtering
- `GET /api/reports/sla` - Generate SLA reports
- `GET /api/alerts/config` - Get alert configuration
- `PUT /api/alerts/config` - Update alert configuration

#### Database Schema
- `Website` model - Monitored websites configuration
- `Check` model - Check history and results
- `HtmlSnapshot` model - HTML content snapshots
- `Incident` model - Downtime and change incidents
- `AlertConfig` model - Alert settings and preferences

#### Monitoring Features
- HTTP status code checking (200 = UP)
- Response time measurement
- HTML normalization (removes dynamic content)
- SHA-256 hash generation for content comparison
- Line-by-line diff calculation for change percentage
- Automatic incident creation and resolution
- Recovery notifications

#### Alert System
- Configurable alert types (downtime, content change, recovery)
- Email alerts with formatted HTML templates
- Telegram alerts with rich formatting
- Alert deduplication to prevent spam
- Recovery alerts when incidents are resolved

#### Documentation
- Comprehensive README with setup instructions
- API documentation with examples
- Architecture documentation
- Contributing guidelines
- Deployment guide
- Environment variables template
- MIT License

### Technical Details

#### Tech Stack
- Next.js 14 (App Router)
- React 18
- TypeScript
- Prisma ORM 5
- Tailwind CSS
- Vercel Postgres
- Brevo API (email)
- Telegram Bot API

#### Dependencies
- `axios` - HTTP client for website checks
- `diff` - Line-by-line content comparison
- `crypto` - SHA-256 hash generation
- `@prisma/client` - Database ORM
- `sib-api-v3-sdk` - Brevo email API
- `zod` - Schema validation (future)

### Known Limitations

- Maximum 3 websites monitored (configurable)
- Check frequency limited to 5-60 minutes
- No user authentication (single-tenant)
- JavaScript-rendered content not detected
- No API rate limiting
- Data retention: 90 days
- Limited to HTTP/HTTPS monitoring
- No SSL certificate expiration monitoring (planned)

### Future Roadmap

See [README.md](./README.md#roadmap) for planned features.

---

## Version History

### [Unreleased]
- Multi-user support with authentication
- API endpoint monitoring with JSON validation
- SSL certificate expiration monitoring
- Public status pages
- Advanced analytics with AI insights
- Slack/Discord integrations
- Mobile app (React Native)
- Automated testing (Jest, Playwright)

---

## Release Notes

### How to Update

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Update database schema
npx prisma db push

# Rebuild application
npm run build

# Deploy to production
vercel --prod
```

### Breaking Changes

None in v1.0.0 (initial release)

---

## Contributors

- Initial development by JF Monitor team
- Built with Next.js, Prisma, and Vercel

---

## Links

- **Repository**: https://github.com/josefresco/jf-website-monitor
- **Live Demo**: https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app
- **Documentation**: [./docs](./docs)
- **Issues**: https://github.com/josefresco/jf-website-monitor/issues

---

**Legend:**
- ✨ New feature
- 🐛 Bug fix
- 🔥 Breaking change
- 📝 Documentation
- 🎨 UI/UX improvement
- ⚡ Performance improvement
- 🔒 Security fix
- ♻️ Refactoring
- 🚀 Deployment
