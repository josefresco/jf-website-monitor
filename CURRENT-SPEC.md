# Website Monitor - Current Specification

**Last Updated:** November 14, 2025
**Version:** 1.0.0
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Features](#features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Monitoring System](#monitoring-system)
8. [User Interface](#user-interface)
9. [Deployment](#deployment)
10. [Environment Variables](#environment-variables)
11. [Known Limitations](#known-limitations)

---

## Overview

A production-ready website monitoring application that tracks website availability, response times, and content changes. Deployed on Vercel with automated checks running every 15-20 minutes via GitHub Actions.

**Live URLs:**
- **Production:** https://jf-monitor.vercel.app
- **GitHub:** https://github.com/josefresco/jf-website-monitor
- **Vercel Dashboard:** https://vercel.com/josiah-coles-projects/jf-monitor

---

## Architecture

### Stack Architecture

```
┌─────────────────────────────────────────────────────┐
│                    GitHub Actions                     │
│              (Automated Monitoring Cron)              │
│              Runs every 15-20 minutes                 │
└────────────────────┬────────────────────────────────┘
                     │ POST /api/monitor/check
                     ↓
┌─────────────────────────────────────────────────────┐
│                  Vercel (Hosting)                     │
│  ┌──────────────────────────────────────────────┐   │
│  │         Next.js 14 (App Router)              │   │
│  │  ┌────────────┐         ┌─────────────┐     │   │
│  │  │    API     │         │   Frontend  │     │   │
│  │  │   Routes   │         │  (React 18) │     │   │
│  │  └─────┬──────┘         └──────────┬──┘     │   │
│  │        │                           │        │   │
│  │        └───────────┬───────────────┘        │   │
│  │                    │                        │   │
│  │            ┌───────▼────────┐               │   │
│  │            │  Prisma ORM    │               │   │
│  │            └───────┬────────┘               │   │
│  └────────────────────┼────────────────────────┘   │
└───────────────────────┼────────────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────┐
        │      Vercel Postgres          │
        │   (Prisma-powered Database)   │
        │    - Websites                 │
        │    - Checks                   │
        │    - Incidents                │
        │    - HTML Snapshots           │
        │    - Alert Configurations     │
        └───────────────────────────────┘
```

### Request Flow

1. **User Access:** User visits dashboard → Next.js renders page → API fetches data from database
2. **Automated Monitoring:** GitHub Actions → triggers `/api/monitor/check` → checks all active websites → stores results
3. **Data Storage:** Prisma ORM → Vercel Postgres → stores checks, incidents, and snapshots

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14.2.18 (App Router)
- **React:** 18.x
- **TypeScript:** 5.x
- **Styling:** Tailwind CSS 3.4.1
- **UI Components:** Custom React components

### Backend
- **Runtime:** Node.js (Vercel Serverless)
- **API:** Next.js API Routes
- **ORM:** Prisma 6.1.0
- **Database:** Vercel Postgres (PostgreSQL)

### Infrastructure
- **Hosting:** Vercel (Serverless)
- **Database:** Vercel Postgres
- **CI/CD:** GitHub Actions
- **Monitoring Scheduler:** GitHub Actions Cron (every 15-20 minutes)

### Key Libraries
- **diff:** 7.0.0 - HTML content comparison
- **prisma:** 6.1.0 - Database ORM
- **@prisma/client:** 6.1.0 - Database client
- **@types/diff:** 6.0.0 - TypeScript types for diff

---

## Features

### ✅ Implemented Features

#### 1. Website Monitoring
- ✅ Add/edit/delete websites to monitor
- ✅ Configure check frequency (15-60 minutes)
- ✅ Set content change threshold (1-100%)
- ✅ Enable/disable monitoring per website
- ✅ Automatic status checks (up/down)
- ✅ Response time tracking

#### 2. Content Change Detection
- ✅ HTML snapshot comparison
- ✅ Intelligent content normalization
  - Removes scripts, styles, comments
  - Filters dynamic content (timestamps, ads, CSRF tokens)
  - Preserves line structure for accurate diffs
- ✅ Line-by-line diff visualization
- ✅ Percentage-based change calculation
- ✅ Change threshold alerts

#### 3. Incident Management
- ✅ Automatic incident creation
  - Website down (non-200 status)
  - Content changed beyond threshold
  - Request timeout/error
- ✅ Incident tracking and history
- ✅ Resolution tracking

#### 4. Dashboard & Reporting
- ✅ Real-time website status dashboard
- ✅ Daily check logs with filtering
- ✅ SLA reports (30/90 day)
  - Uptime percentage
  - Average response time
  - Total incidents
- ✅ Snapshot comparison viewer
  - Side-by-side HTML comparison
  - Color-coded diffs
  - "Show only changes" filter

#### 5. Automated Monitoring
- ✅ GitHub Actions cron (every 15-20 minutes)
- ✅ Webhook-based manual triggers
- ✅ Secure API authentication (CRON_SECRET)

### 🚧 Planned Features (Not Implemented)

- ❌ Email alerts (Brevo integration prepared, not configured)
- ❌ Telegram alerts (prepared, not configured)
- ❌ Slack/Discord webhooks
- ❌ SMS alerts
- ❌ Custom alert rules
- ❌ Multi-user authentication
- ❌ API key management
- ❌ Export reports (CSV/PDF)

---

## Database Schema

### Tables

#### **websites**
```prisma
model Website {
  id               String     @id @default(cuid())
  url              String
  name             String
  checkFrequency   Int        @default(300)  // seconds
  changeThreshold  Float      @default(10)   // percentage
  isActive         Boolean    @default(true)
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  checks           Check[]
  incidents        Incident[]
  htmlSnapshots    HtmlSnapshot[]
}
```

#### **checks**
```prisma
model Check {
  id            String    @id @default(cuid())
  websiteId     String
  status        String    // 'up', 'down', 'error'
  statusCode    Int?
  responseTime  Int?      // milliseconds
  contentHash   String?
  changePercent Float?
  hasChange     Boolean   @default(false)
  checkedAt     DateTime  @default(now())
  error         String?

  website       Website   @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@index([websiteId, checkedAt])
}
```

#### **incidents**
```prisma
model Incident {
  id           String    @id @default(cuid())
  websiteId    String
  type         String    // 'down', 'slow', 'change'
  severity     String    // 'critical', 'warning', 'info'
  message      String
  details      String?
  startedAt    DateTime  @default(now())
  resolvedAt   DateTime?
  isResolved   Boolean   @default(false)

  website      Website   @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@index([websiteId, startedAt])
  @@index([isResolved])
}
```

#### **html_snapshots**
```prisma
model HtmlSnapshot {
  id          String   @id @default(cuid())
  websiteId   String
  htmlContent String   @db.Text
  htmlHash    String
  capturedAt  DateTime @default(now())

  website     Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@index([websiteId, capturedAt])
  @@index([htmlHash])
  @@map("html_snapshots")
}
```

#### **alert_config**
```prisma
model AlertConfig {
  id                  String   @id @default(cuid())
  emailEnabled        Boolean  @default(false)
  telegramEnabled     Boolean  @default(false)
  slackEnabled        Boolean  @default(false)
  emailRecipients     String[] // Array of email addresses
  telegramChatIds     String[] // Array of Telegram chat IDs
  slackWebhookUrl     String?
  minSeverity         String   @default("warning") // 'info', 'warning', 'critical'
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("alert_config")
}
```

---

## API Endpoints

### Websites

#### `GET /api/websites`
Get all websites with check counts.

**Response:**
```json
[
  {
    "id": "cmhz33rut0000uj16yyiq0zs3",
    "url": "https://www.colewebdev.com/",
    "name": "COLEwebdev",
    "checkFrequency": 300,
    "changeThreshold": 1,
    "isActive": true,
    "createdAt": "2025-11-14T16:40:40.901Z",
    "updatedAt": "2025-11-14T16:40:40.901Z",
    "_count": {
      "checks": 17,
      "incidents": 2
    }
  }
]
```

#### `POST /api/websites`
Create a new website to monitor.

**Request:**
```json
{
  "name": "My Website",
  "url": "https://example.com",
  "checkFrequency": 900,
  "changeThreshold": 10
}
```

#### `GET /api/websites/[id]`
Get a specific website with recent checks.

#### `PUT /api/websites/[id]`
Update website configuration.

#### `DELETE /api/websites/[id]`
Delete a website and all associated data (cascading delete).

---

### Monitoring

#### `POST /api/monitor/check`
Trigger monitoring checks for all active websites.

**Authentication:** Requires `CRON_SECRET`

**Request:**
```json
{
  "secret": "4d8a0706170839af6591e6fd1c646a9593d3a1eb7c88838a323e7951c0f1dff3"
}
```

**Response:**
```json
{
  "success": true,
  "checksPerformed": 1,
  "incidentsCreated": 0,
  "results": [
    {
      "websiteId": "cmhz33rut0000uj16yyiq0zs3",
      "url": "https://www.colewebdev.com/",
      "status": "up",
      "statusCode": 200,
      "responseTime": 80,
      "changePercent": 0,
      "hasChange": false
    }
  ]
}
```

---

### Checks & Incidents

#### `GET /api/checks`
Get check history with optional filters.

**Query Parameters:**
- `websiteId` (optional): Filter by website
- `status` (optional): Filter by status ('up', 'down', 'error')
- `limit` (optional): Limit results (default: 100)
- `offset` (optional): Pagination offset

#### `GET /api/incidents`
Get all incidents.

**Query Parameters:**
- `websiteId` (optional): Filter by website
- `resolved` (optional): Filter by resolution status

---

### Snapshots

#### `GET /api/snapshots/[websiteId]`
Get HTML snapshots for a website.

**Query Parameters:**
- `limit` (optional): Number of snapshots (default: 10)

#### `GET /api/snapshots/compare`
Compare two HTML snapshots.

**Query Parameters:**
- `oldId`: ID of older snapshot
- `newId`: ID of newer snapshot

**Response:**
```json
{
  "oldSnapshot": { "id": "...", "capturedAt": "...", "htmlHash": "..." },
  "newSnapshot": { "id": "...", "capturedAt": "...", "htmlHash": "..." },
  "diff": [ /* array of diff objects */ ],
  "stats": {
    "totalLines": 300,
    "addedLines": 2,
    "removedLines": 2,
    "unchangedLines": 296,
    "changePercent": 1.33
  }
}
```

---

### Reports

#### `GET /api/reports/sla`
Get SLA report for a website.

**Query Parameters:**
- `websiteId` (required): Website ID
- `days` (optional): Days to analyze (default: 30)

**Response:**
```json
{
  "websiteId": "cmhz33rut0000uj16yyiq0zs3",
  "period": "30 days",
  "totalChecks": 17,
  "uptimePercentage": 100,
  "avgResponseTime": 78,
  "totalIncidents": 2,
  "incidentsByType": {
    "change": 2
  }
}
```

---

### Alert Configuration

#### `GET /api/alerts/config`
Get current alert configuration.

#### `PUT /api/alerts/config`
Update alert configuration.

**Request:**
```json
{
  "emailEnabled": true,
  "emailRecipients": ["user@example.com"],
  "minSeverity": "warning"
}
```

---

## Monitoring System

### Check Frequency

- **GitHub Actions:** Runs every **15-20 minutes** (free tier limitation)
- **Per-website frequency:** Configurable (15 minutes to 60 minutes)
- **Actual interval:** Due to GitHub Actions delays, expect 15-30 minute intervals

### Check Process

1. **Fetch active websites** from database
2. **For each website:**
   - Check if due for monitoring (based on `checkFrequency` and last check time)
   - Fetch website content via HTTP GET
   - Measure response time
   - Record status code
3. **Content comparison:**
   - Normalize HTML (remove dynamic content)
   - Calculate hash of normalized content
   - Compare with previous snapshot
   - Calculate change percentage
4. **Store results:**
   - Create `Check` record
   - If change > threshold: Create `HtmlSnapshot`
   - If issue detected: Create `Incident`

### HTML Normalization

The system intelligently normalizes HTML to avoid false positives:

```typescript
// Removed content:
- HTML comments
- <script> tags
- <style> tags
- Timestamps (ISO format)
- CSRF tokens
- Ad containers
- Dynamic attributes (data-timestamp, etc.)

// Preserved:
- Line structure (for accurate diffs)
- Semantic content
- Overall page structure
```

### Incident Creation

Incidents are automatically created when:

1. **Website Down:** Status code != 200
   - Type: "down"
   - Severity: "critical"

2. **Content Changed:** Change% > threshold
   - Type: "change"
   - Severity: "warning"

3. **Error:** Network error, timeout, etc.
   - Type: "error"
   - Severity: "critical"

---

## User Interface

### Pages

#### 1. **Dashboard** (`/dashboard`)
- Website status cards
- Quick stats (uptime%, avg response time)
- Recent incidents
- Last check timestamp

#### 2. **Websites** (`/websites`)
- List of all websites
- Add/edit/delete websites
- Enable/disable monitoring
- Configure check frequency and thresholds

#### 3. **Daily Logs** (`/logs`)
- Check history by day
- Filter by website and status
- View response times and status codes
- See content change percentages

#### 4. **SLA Reports** (`/reports`)
- 30-day and 90-day reports
- Uptime percentage
- Average response time
- Total incidents breakdown

#### 5. **Snapshots** (`/snapshots`)
- View HTML snapshots for each website
- Side-by-side comparison
- Line-by-line diff view
- "Show only changes" filter
- Color-coded additions (green) and deletions (red)

#### 6. **Settings** (`/settings`)
- Alert configuration
- Email/Telegram/Slack setup
- Minimum severity threshold

---

## Deployment

### Platform: Vercel

**Current Deployment:**
- **URL:** https://jf-monitor.vercel.app
- **Framework Preset:** Next.js
- **Build Command:** `prisma generate && npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Environment Variables (Production)

```bash
CRON_SECRET="4d8a0706170839af6591e6fd1c646a9593d3a1eb7c88838a323e7951c0f1dff3"
APP_URL="https://jf-monitor.vercel.app"
NODE_ENV="production"

# Database (automatically managed by Vercel Postgres integration)
DATABASE_URL="postgres://..."
DATABASE__POSTGRES_URL="postgres://..."
DATABASE__PRISMA_DATABASE_URL="prisma+postgres://..."
```

### GitHub Actions

**Workflow:** `.github/workflows/monitor.yml`

```yaml
name: Website Monitor

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:          # Manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Website Check
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/monitor/check" \
            -H "Content-Type: application/json" \
            -d '{"secret": "${{ secrets.CRON_SECRET }}"}'
```

**Required Secrets:**
- `APP_URL`: https://jf-monitor.vercel.app
- `CRON_SECRET`: (matches Vercel production secret)

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `CRON_SECRET` | Secret for authenticating monitoring API calls | `4d8a0706...` |
| `APP_URL` | Production URL of the application | `https://jf-monitor.vercel.app` |
| `DATABASE_URL` | PostgreSQL connection string (Vercel-managed) | `postgres://...` |

### Optional (Alerts - Not Configured)

| Variable | Description |
|----------|-------------|
| `BREVO_API_KEY` | Brevo API key for email alerts |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Telegram chat ID |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |

---

## Known Limitations

### Current Limitations

1. **Check Frequency**
   - GitHub Actions free tier: 15-20 minute intervals (not precise)
   - Cannot check more frequently than every 15 minutes reliably
   - Actual delays can be 15-30 minutes during high load

2. **Content Detection**
   - Only detects changes in HTML structure/content
   - Does not detect JavaScript-rendered content changes
   - Cannot monitor sites requiring authentication
   - Does not screenshot visual changes

3. **Alerts**
   - Alert integrations prepared but not configured
   - No email/Telegram/Slack notifications active
   - No SMS alerts

4. **Scalability**
   - Vercel Postgres free tier: 256 MB storage, 60 hours compute/month
   - Serverless function timeout: 5 minutes max
   - No built-in rate limiting

5. **Security**
   - Single CRON_SECRET for all monitoring (no per-user auth)
   - No IP whitelisting
   - No API rate limiting

6. **Reporting**
   - Cannot export reports to CSV/PDF
   - Limited to 30/90 day SLA reports
   - No custom date range reports

### Workarounds

- **More Frequent Checks:** Upgrade to Vercel Pro ($20/month) for Vercel Cron
- **Better Scheduling:** Use third-party cron service (cron-job.org)
- **Authenticated Sites:** Configure Prisma to pass auth headers
- **JavaScript Content:** Use headless browser (Playwright/Puppeteer) - not implemented

---

## File Structure

```
jf-monitor/
├── .github/
│   └── workflows/
│       └── monitor.yml          # GitHub Actions monitoring cron
├── prisma/
│   └── schema.prisma            # Database schema
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API Routes
│   │   │   ├── alerts/
│   │   │   ├── checks/
│   │   │   ├── incidents/
│   │   │   ├── monitor/check/   # Main monitoring endpoint
│   │   │   ├── reports/
│   │   │   ├── snapshots/
│   │   │   └── websites/
│   │   ├── dashboard/
│   │   ├── logs/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── snapshots/
│   │   └── websites/
│   ├── components/              # React components
│   │   └── Navigation.tsx
│   └── lib/                     # Utilities
│       ├── prisma.ts            # Prisma client
│       ├── monitor.ts           # Monitoring logic
│       └── html-utils.ts        # HTML normalization & diff
├── .env.example                 # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vercel.json                  # Vercel configuration
├── README.md                    # Main documentation
├── CHANGELOG.md                 # Version history
├── SECURITY-UPDATE.md           # Security incident documentation
├── SETUP-AUTOMATED-MONITORING.md # Setup guide
└── CURRENT-SPEC.md              # This file
```

---

## Quick Reference

### Common Tasks

**Add a website:**
```bash
curl -X POST https://jf-monitor.vercel.app/api/websites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Site",
    "url": "https://example.com",
    "checkFrequency": 900,
    "changeThreshold": 10
  }'
```

**Trigger manual check:**
```bash
curl -X POST https://jf-monitor.vercel.app/api/monitor/check \
  -H "Content-Type: application/json" \
  -d '{"secret":"4d8a0706170839af6591e6fd1c646a9593d3a1eb7c88838a323e7951c0f1dff3"}'
```

**View GitHub Actions runs:**
```bash
gh run list --repo josefresco/jf-website-monitor --limit 5
```

**Check Vercel deployment:**
```bash
vercel --prod --yes
```

---

## Support & Documentation

- **GitHub Issues:** https://github.com/josefresco/jf-website-monitor/issues
- **Vercel Logs:** https://vercel.com/josiah-coles-projects/jf-monitor
- **GitHub Actions:** https://github.com/josefresco/jf-website-monitor/actions

---

**End of Specification**
