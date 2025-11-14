# Changelog

All notable changes to JF Monitor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-14

### Added
- 📸 **Snapshot Comparison Viewer** - New `/snapshots` page with side-by-side HTML diff visualization
  - Line-by-line comparison with color-coded changes
  - "Show only changes" filter toggle
  - Snapshot selector dropdown
  - Diff statistics (added/removed/unchanged lines, change percentage)
- 📝 **CURRENT-SPEC.md** - Comprehensive specification document covering:
  - Architecture diagrams
  - Complete API documentation
  - Database schema details
  - Deployment configuration
  - Known limitations and workarounds
- 🔄 **GitHub Actions Monitoring** - Updated to 15-minute intervals
  - More realistic expectations (15-20 minute actual intervals)
  - Documented GitHub Actions free tier limitations

### Fixed
- 🐛 **Critical: HTML Normalization Bug** - Fixed 200% change detection issue
  - **Problem:** HTML normalization was collapsing entire page into single line, causing wildly inaccurate diff calculations (e.g., 4 changed lines reported as 200%)
  - **Solution:** Preserve line structure while normalizing whitespace within lines
  - **Impact:** Now accurately reports ~1-2% for minor changes instead of 200%
  - **File:** src/lib/html-utils.ts:44-54
- 🔒 **Security: CRON_SECRET Newline Issue** - Fixed environment variable format
  - **Problem:** `echo` command was adding `\n` to CRON_SECRET, causing authentication failures
  - **Solution:** Use `printf` instead of `echo` when setting environment variables
  - **Impact:** GitHub Actions monitoring now works correctly
- 🔐 **Security: Removed .env.production from Git** - Added to .gitignore to prevent credential exposure

### Security
- 🔒 **Credential Rotation** - Rotated compromised credentials after GitGuardian alerts
  - Generated new CRON_SECRET (old: `9f09d3c...`, new: `4d8a...dff3`)
  - Updated APP_URL to stable `https://jf-monitor.vercel.app`
  - Discovered application uses Vercel Postgres (not Supabase)
  - Created SECURITY-UPDATE.md with complete incident documentation
- 🔐 **Environment File Security** - Improved .gitignore patterns
  - Added `.env.production`, `.env.vercel.*`
  - Ensured only `.env.example` is tracked
  - Removed exposed credentials from all documentation files

### Changed
- ⏱️ **Check Frequency** - Updated default from 5 minutes to 15 minutes
  - Reflects GitHub Actions free tier limitations
  - UI now shows "Every 15 minutes" as default
  - Documentation updated to reflect 15-20 minute actual intervals
- 📝 **Documentation Restructuring**
  - Removed outdated files: DEPLOYMENT.md, DEPLOYMENT-FINAL.md, DEPLOYMENT-SUCCESS.md, DATABASE-TROUBLESHOOTING.md, PROJECT_STATUS.md, DOCUMENTATION-SUMMARY.md
  - Updated README.md with current features and architecture
  - Added documentation index linking to all key docs
  - Clarified alert status (prepared but not configured)

### Database
- ✅ Confirmed use of Vercel Postgres (not Supabase)
- ✅ All data intact (17+ checks recorded)
- ✅ Database credentials automatically managed by Vercel

### Deployment
- 🚀 Production URL: https://jf-monitor.vercel.app
- 🤖 GitHub Actions: Runs every 15-20 minutes
- ✅ Environment variables properly configured

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
