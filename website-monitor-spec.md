# Website Monitor - Technical Specification Document

**Version:** 1.0  
**Date:** November 13, 2025  
**Status:** Draft

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Database Schema](#database-schema)
4. [Feature Specifications](#feature-specifications)
5. [API Endpoints](#api-endpoints)
6. [UI/UX Specifications](#uiux-specifications)
7. [Monitoring Logic](#monitoring-logic)
8. [Alert System](#alert-system)
9. [Deployment](#deployment)
10. [Testing Strategy](#testing-strategy)
11. [Timeline](#timeline)

---

## 1. Project Overview

### 1.1 Purpose
A web application to monitor the uptime and content changes of multiple websites, providing real-time alerts and historical SLA reporting.

### 1.2 Core Requirements
- Monitor 3 websites simultaneously
- Check HTTP status codes (200 OK expected)
- Detect HTML code changes exceeding 10% threshold
- Configurable check frequency (5 minutes to 1 hour per site)
- Email and Telegram alerts for incidents
- Daily logs and monthly SLA reports
- Free tier hosting (Vercel/Netlify)

### 1.3 Success Criteria
- 99%+ reliability in scheduled checks
- Alerts delivered within 1 minute of detection
- Dashboard loads in < 2 seconds
- Historical data retained for minimum 90 days
- Zero cost deployment on free tiers

---

## 2. Technical Architecture

### 2.1 Technology Stack

**Frontend:**
- Framework: Next.js 14+ (App Router)
- Language: TypeScript 5+
- UI Library: React 18+
- Styling: Tailwind CSS
- Charts: Recharts
- State Management: React Context (for simple state)

**Backend:**
- Runtime: Node.js (Vercel serverless functions)
- API: Next.js API Routes
- ORM: Prisma 5+

**Database:**
- Primary: Supabase PostgreSQL (free tier)
  - Storage: 500MB
  - API Requests: 50,000/month
  - Bandwidth: 2GB/month
- Alternative: Vercel Postgres

**Scheduling:**
- Primary: GitHub Actions (cron)
- Frequency: Every 5 minutes
- Fallback: Vercel Cron (for backup checks)

**External Services:**
- Email: Brevo API (free tier: 300 emails/day)
- Telegram: Bot API (via node-telegram-bot-api)
- Hosting: Vercel (free tier)

**Key Libraries:**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "axios": "^1.6.0",
    "diff": "^5.1.0",
    "@getbrevo/brevo": "^2.0.0",
    "node-telegram-bot-api": "^0.64.0",
    "zod": "^3.22.0",
    "date-fns": "^3.0.0",
    "recharts": "^2.10.0"
  }
}
```

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions (Cron)                    │
│                    Triggers every 5 minutes                  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP POST
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Next.js App)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            API Route: /api/monitor/check             │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │           Monitor Service (lib/monitor.ts)           │   │
│  │  • Fetch websites                                    │   │
│  │  • Check status codes                                │   │
│  │  • Compare HTML changes                              │   │
│  │  • Calculate response times                          │   │
│  └────────┬───────────────────────────┬─────────────────┘   │
│           │                           │                      │
│  ┌────────▼────────┐        ┌────────▼─────────┐           │
│  │  Alert Service  │        │  Database (Prisma)│           │
│  │  • Email        │        │  • Store checks    │           │
│  │  • Telegram     │        │  • Store incidents │           │
│  └─────────────────┘        └───────────────────┘           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Frontend (Next.js Pages)                  │   │
│  │  • Dashboard                                          │   │
│  │  • Daily Logs                                         │   │
│  │  • SLA Reports                                        │   │
│  │  • Site Configuration                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                         │
│  • websites table                                            │
│  • checks table                                              │
│  • incidents table                                           │
│  • html_snapshots table                                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Data Flow

**Check Execution Flow:**
1. GitHub Actions triggers webhook every 5 minutes
2. Webhook calls `/api/monitor/check` endpoint
3. Endpoint queries database for sites due for checking
4. For each site:
   - Fetch website content
   - Record status code and response time
   - Normalize HTML content
   - Compare with last snapshot
   - Calculate change percentage
   - Store check result in database
5. If incident detected (down or >10% change):
   - Create incident record
   - Trigger alerts (email + Telegram)
6. Return check results

---

## 3. Database Schema

### 3.1 Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Website {
  id                String    @id @default(cuid())
  url               String    @unique
  name              String
  checkFrequency    Int       @default(300) // seconds (5 minutes default)
  changeThreshold   Float     @default(10.0) // percentage
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  checks            Check[]
  incidents         Incident[]
  htmlSnapshots     HtmlSnapshot[]
  
  @@index([isActive])
}

model Check {
  id              String    @id @default(cuid())
  websiteId       String
  website         Website   @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  
  statusCode      Int
  responseTime    Int       // milliseconds
  isUp            Boolean
  htmlHash        String    // SHA-256 hash of normalized HTML
  changePercent   Float?    // null for first check
  hasChange       Boolean   @default(false)
  
  timestamp       DateTime  @default(now())
  
  errorMessage    String?   // if request failed
  
  @@index([websiteId, timestamp])
  @@index([timestamp])
}

model HtmlSnapshot {
  id              String    @id @default(cuid())
  websiteId       String
  website         Website   @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  
  htmlContent     String    @db.Text // normalized HTML
  htmlHash        String    // SHA-256 hash
  capturedAt      DateTime  @default(now())
  
  @@index([websiteId, capturedAt])
}

model Incident {
  id              String    @id @default(cuid())
  websiteId       String
  website         Website   @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  
  type            IncidentType
  startTime       DateTime
  endTime         DateTime?
  isResolved      Boolean   @default(false)
  
  // Incident details
  statusCode      Int?      // for downtime incidents
  changePercent   Float?    // for content change incidents
  description     String?
  
  // Alert tracking
  alertSent       Boolean   @default(false)
  alertSentAt     DateTime?
  resolutionAlertSent Boolean @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([websiteId, isResolved])
  @@index([startTime])
}

enum IncidentType {
  DOWNTIME        // non-200 status code
  CONTENT_CHANGE  // HTML change > threshold
  TIMEOUT         // request timeout
  ERROR           // other errors
}

model AlertConfig {
  id              String    @id @default(cuid())
  
  // Email settings
  emailEnabled    Boolean   @default(true)
  emailTo         String[]
  emailFrom       String
  brevoApiKey     String?   @db.Text
  
  // Telegram settings
  telegramEnabled Boolean   @default(true)
  telegramBotToken String?  @db.Text
  telegramChatId  String?
  
  // Alert preferences
  alertOnDown     Boolean   @default(true)
  alertOnChange   Boolean   @default(true)
  alertOnRecovery Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### 3.2 Database Indexes
- `Check.websiteId + timestamp`: Fast queries for website history
- `Check.timestamp`: Time-range queries for reports
- `Incident.websiteId + isResolved`: Active incident queries
- `Website.isActive`: Filter active sites for monitoring

### 3.3 Data Retention Policy
- **Checks**: Keep last 90 days, delete older records
- **HtmlSnapshots**: Keep last 10 per website, delete older
- **Incidents**: Permanent retention (small data size)
- Implement cleanup cron job (runs daily)

---

## 4. Feature Specifications

### 4.1 Website Monitoring

**FR-1: HTTP Status Check**
- Make HTTP GET request to configured URL
- Record status code (200, 404, 500, etc.)
- Record response time in milliseconds
- Timeout after 30 seconds
- Mark as "down" if status code ≠ 200

**FR-2: HTML Content Change Detection**
- Fetch full HTML source code
- Normalize HTML:
  - Remove comments
  - Strip whitespace
  - Remove script tags with dynamic content
  - Remove known dynamic elements:
    - Timestamps (regex: `\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}`)
    - CSRF tokens (meta tags with csrf, token)
    - Session IDs (cookie values, session query params)
    - Advertisement divs (class/id containing "ad", "advertisement")
    - Social media counters
- Calculate SHA-256 hash of normalized HTML
- Compare with previous snapshot
- Use diff algorithm to calculate change percentage:
  ```
  changePercent = (added_lines + removed_lines) / total_lines * 100
  ```
- Trigger alert if changePercent > threshold (default 10%)

**FR-3: Configurable Check Frequency**
- Each website has independent check frequency
- Valid range: 300 seconds (5 min) to 3600 seconds (1 hour)
- Stored in `Website.checkFrequency` field
- Monitor service queries sites due for checking:
  ```sql
  SELECT * FROM Website 
  WHERE isActive = true 
  AND (
    lastCheckTime IS NULL 
    OR lastCheckTime < NOW() - INTERVAL 'checkFrequency seconds'
  )
  ```

**FR-4: Error Handling**
- Network errors: Retry once after 5 seconds
- DNS errors: Mark as down, log error
- SSL/TLS errors: Mark as down, log error
- Timeout errors: Mark as timeout incident
- 4xx/5xx status codes: Mark as down

### 4.2 Alert System

**FR-5: Email Alerts**
- Use SendGrid API for sending
- Templates:
  - **Downtime Alert**: Subject: "🔴 [Site Name] is DOWN", includes status code, error details
  - **Content Change Alert**: Subject: "⚠️ [Site Name] content changed by X%", includes change details
  - **Recovery Alert**: Subject: "✅ [Site Name] is back UP", includes downtime duration
- Rate limiting: Max 1 alert per incident
- Email body includes:
  - Incident type and timestamp
  - Website URL
  - Relevant metrics
  - Link to dashboard

**FR-6: Telegram Alerts**
- Use Telegram Bot API
- Message format:
  ```
  🔴 DOWNTIME ALERT
  
  Site: example.com
  Status: 500 Internal Server Error
  Time: 2025-11-13 14:30:00 UTC
  Response Time: 2500ms
  
  View Details: [Dashboard Link]
  ```
- Support for multiple chat IDs
- Include inline keyboard with "View Dashboard" button

**FR-7: Alert Configuration**
- Admin UI to configure alert settings
- Toggle email/Telegram on/off
- Set recipient emails
- Configure Telegram bot token and chat ID
- Test alert functionality with "Send Test Alert" button

### 4.3 Dashboard

**FR-8: Overview Page**
Display for each monitored website:
- Current status (UP/DOWN) with color indicator
  - Green: Up (200 OK)
  - Red: Down (non-200 or error)
  - Yellow: Recent content change
- Last check timestamp
- Response time (current and 24h average)
- Uptime percentage (24h, 7d, 30d)
- Active incidents count
- Quick actions: "Check Now" button

**FR-9: Real-time Updates**
- Auto-refresh every 30 seconds
- Show "Last Updated: X seconds ago"
- Loading indicators during refresh
- WebSocket optional (for real-time updates)

### 4.4 Daily Logs

**FR-10: Check History View**
Table displaying recent checks:
- Columns: Timestamp, Website, Status, Response Time, Change %, Notes
- Filters:
  - Date range picker
  - Website selector
  - Status filter (All, Up, Down, Changed)
- Sorting by any column
- Pagination (50 results per page)
- Export to CSV functionality

**FR-11: Incident Log**
Table displaying all incidents:
- Columns: Started, Ended, Duration, Website, Type, Status
- Filters:
  - Date range
  - Website
  - Type (Downtime, Content Change, Timeout)
  - Status (Active, Resolved)
- Click incident for detailed view:
  - Full error message
  - HTTP response details
  - HTML diff view (for content changes)
  - Alert history

### 4.5 SLA Reports

**FR-12: Monthly SLA Report**
For each website, display:
- **Uptime Percentage**: `(successful_checks / total_checks) * 100`
- **Total Checks**: Count of checks performed
- **Failed Checks**: Count of non-200 status codes
- **Average Response Time**: Mean response time in ms
- **95th Percentile Response Time**: 95th percentile of response times
- **Total Incidents**: Count of incidents
- **Total Downtime**: Sum of incident durations
- **MTTR**: Mean Time To Recovery (average incident duration)
- **Longest Incident**: Duration of longest incident

**FR-13: SLA Visualization**
- Line chart: Uptime % over time (daily granularity)
- Bar chart: Incident count by type
- Scatter plot: Response times over time
- Heatmap: Hourly uptime pattern (show failure patterns)

**FR-14: Report Export**
- Export as PDF report
- Include summary metrics
- Include charts as images
- Professional formatting
- Date range and generation timestamp

### 4.6 Configuration

**FR-15: Website Management**
Form to add/edit websites:
- Fields:
  - Name (display name)
  - URL (must be valid HTTP/HTTPS)
  - Check Frequency (dropdown: 5min, 15min, 30min, 1hr)
  - Change Threshold (0-100%)
  - Active/Inactive toggle
- Validation:
  - URL is valid and reachable
  - Name is unique
  - Frequency in valid range
- Delete website (soft delete, archive data)

**FR-16: Test Check**
- "Test Now" button for each website
- Performs immediate check
- Shows results inline:
  - Status code
  - Response time
  - Current HTML hash
  - Comparison with last check
- Useful for debugging configuration

---

## 5. API Endpoints

### 5.1 Monitoring Endpoints

**POST /api/monitor/check**
- Trigger monitoring check for all due websites
- Request body:
  ```json
  {
    "secret": "CRON_SECRET_KEY", // for security
    "force": false // optional: force check all sites
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "checksPerformed": 3,
    "incidentsCreated": 1,
    "results": [
      {
        "websiteId": "clx...",
        "url": "https://example.com",
        "status": "up",
        "statusCode": 200,
        "responseTime": 245,
        "changePercent": 0.5
      }
    ]
  }
  ```

**POST /api/monitor/test/:websiteId**
- Perform immediate test check for specific website
- Authorization required
- Response: Check result object

### 5.2 Website Management Endpoints

**GET /api/websites**
- List all websites
- Query params: `?active=true`
- Response: Array of Website objects

**POST /api/websites**
- Create new website
- Request body:
  ```json
  {
    "name": "My Website",
    "url": "https://example.com",
    "checkFrequency": 300,
    "changeThreshold": 10.0
  }
  ```
- Validation: URL reachable, name unique

**PUT /api/websites/:id**
- Update website configuration
- Request body: Partial Website object

**DELETE /api/websites/:id**
- Soft delete website (set isActive = false)

### 5.3 Data Endpoints

**GET /api/checks**
- Get check history
- Query params:
  - `websiteId`: Filter by website
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `limit`: Max results (default 50)
  - `offset`: Pagination offset
- Response: Array of Check objects with pagination metadata

**GET /api/incidents**
- Get incidents
- Query params: Similar to checks endpoint
- Response: Array of Incident objects

**GET /api/reports/sla**
- Get SLA metrics
- Query params:
  - `websiteId`: Specific website or "all"
  - `startDate`: ISO date string
  - `endDate`: ISO date string
- Response:
  ```json
  {
    "period": {
      "start": "2025-11-01",
      "end": "2025-11-30"
    },
    "websites": [
      {
        "websiteId": "clx...",
        "name": "Example Site",
        "metrics": {
          "uptimePercent": 99.85,
          "totalChecks": 8640,
          "failedChecks": 13,
          "avgResponseTime": 234,
          "p95ResponseTime": 450,
          "totalIncidents": 3,
          "totalDowntime": 780, // seconds
          "mttr": 260 // seconds
        }
      }
    ]
  }
  ```

### 5.4 Alert Configuration Endpoints

**GET /api/alerts/config**
- Get current alert configuration

**PUT /api/alerts/config**
- Update alert configuration
- Request body: AlertConfig object (without secrets in response)

**POST /api/alerts/test**
- Send test alert
- Request body:
  ```json
  {
    "type": "email" | "telegram",
    "message": "Test alert message"
  }
  ```

---

## 6. UI/UX Specifications

### 6.1 Layout

**Navigation:**
- Sidebar (desktop) / Bottom nav (mobile)
- Menu items:
  - Dashboard (home icon)
  - Daily Logs (calendar icon)
  - SLA Reports (chart icon)
  - Websites (globe icon)
  - Settings (gear icon)

**Color Scheme:**
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)
- Background: Gray-50 (#F9FAFB)
- Text: Gray-900 (#111827)

### 6.2 Dashboard Page

**Header Section:**
- Title: "Website Monitor Dashboard"
- Last updated timestamp
- "Refresh Now" button

**Status Cards (3 cards, one per website):**
```
┌─────────────────────────────────────────┐
│ 🟢 example.com                    [Test]│
├─────────────────────────────────────────┤
│ Status: UP                              │
│ Last Check: 2 minutes ago               │
│ Response Time: 234ms (avg: 245ms)      │
│ Uptime (24h): 99.9%                    │
│ Active Incidents: 0                     │
└─────────────────────────────────────────┘
```

**Recent Activity Timeline:**
- Last 10 checks across all sites
- Visual timeline with status indicators
- Click to view check details

### 6.3 Daily Logs Page

**Filters Bar:**
- Date range picker (default: today)
- Website multi-select dropdown
- Status filter (All, Up, Down, Changed)
- "Apply Filters" button
- "Export CSV" button

**Data Table:**
- Responsive table with horizontal scroll on mobile
- Sortable columns
- Row highlighting for failed checks (red background)
- Expandable rows for detailed view
- Pagination controls

### 6.4 SLA Reports Page

**Report Controls:**
- Month selector (default: current month)
- Website selector (default: all)
- "Generate Report" button
- "Export PDF" button

**Metrics Grid:**
- 2x4 grid of metric cards showing key SLA numbers
- Large font for primary metric
- Trend indicator (up/down arrow)

**Charts Section:**
- Uptime chart (line chart)
- Incident distribution (pie chart)
- Response time trends (area chart)
- Interactive tooltips on hover

### 6.5 Website Management Page

**Website List:**
- Card view showing each website
- Actions: Edit, Test, Delete
- Status indicator
- Quick stats (uptime, last check)

**Add/Edit Form:**
- Modal dialog
- Form fields with validation
- Real-time URL validation
- "Test Connection" button before saving

### 6.6 Settings Page

**Alert Configuration:**
- Section for Email settings
- Section for Telegram settings
- Toggle switches for alert types
- Test buttons for each alert channel
- Save button

**System Settings:**
- Data retention period
- Default check frequency
- Global change threshold
- Export/Import configuration

---

## 7. Monitoring Logic

### 7.1 Check Execution Algorithm

```typescript
async function performCheck(website: Website): Promise<CheckResult> {
  const startTime = Date.now();
  let result: CheckResult;
  
  try {
    // 1. Fetch website with timeout
    const response = await axios.get(website.url, {
      timeout: 30000,
      validateStatus: () => true, // Don't throw on non-200
      maxRedirects: 5
    });
    
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    const isUp = statusCode === 200;
    
    // 2. Extract and normalize HTML
    let htmlContent = response.data;
    const normalizedHtml = normalizeHtml(htmlContent);
    const htmlHash = calculateHash(normalizedHtml);
    
    // 3. Compare with previous snapshot
    const lastSnapshot = await getLastSnapshot(website.id);
    let changePercent = null;
    let hasChange = false;
    
    if (lastSnapshot) {
      changePercent = calculateChangePercent(
        lastSnapshot.htmlContent,
        normalizedHtml
      );
      hasChange = changePercent > website.changeThreshold;
    }
    
    // 4. Store check result
    result = await createCheck({
      websiteId: website.id,
      statusCode,
      responseTime,
      isUp,
      htmlHash,
      changePercent,
      hasChange
    });
    
    // 5. Store new snapshot if changed or first check
    if (!lastSnapshot || hasChange) {
      await createSnapshot({
        websiteId: website.id,
        htmlContent: normalizedHtml,
        htmlHash
      });
    }
    
    // 6. Handle incidents
    await handleIncidents(website, result);
    
    return result;
    
  } catch (error) {
    // Network error, timeout, etc.
    const responseTime = Date.now() - startTime;
    
    result = await createCheck({
      websiteId: website.id,
      statusCode: 0,
      responseTime,
      isUp: false,
      htmlHash: '',
      changePercent: null,
      hasChange: false,
      errorMessage: error.message
    });
    
    await handleIncidents(website, result);
    
    return result;
  }
}
```

### 7.2 HTML Normalization

```typescript
function normalizeHtml(html: string): string {
  let normalized = html;
  
  // Remove HTML comments
  normalized = normalized.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove script tags with dynamic content
  normalized = normalized.replace(
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    ''
  );
  
  // Remove style tags
  normalized = normalized.replace(
    /<style[^>]*>[\s\S]*?<\/style>/gi,
    ''
  );
  
  // Remove timestamps (various formats)
  normalized = normalized.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/g,
    'TIMESTAMP'
  );
  
  // Remove CSRF tokens (meta tags)
  normalized = normalized.replace(
    /<meta[^>]*name=["']csrf-token["'][^>]*>/gi,
    ''
  );
  
  // Remove common dynamic attributes
  normalized = normalized.replace(
    /data-timestamp=["'][^"']*["']/gi,
    ''
  );
  
  // Remove ad containers (common class/id patterns)
  const adPatterns = [
    /<div[^>]*class=["'][^"']*\b(ad|advertisement|banner)\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
    /<div[^>]*id=["'][^"']*\b(ad|advertisement|banner)\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi
  ];
  
  adPatterns.forEach(pattern => {
    normalized = normalized.replace(pattern, '');
  });
  
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}
```

### 7.3 Change Calculation

```typescript
import { diffLines } from 'diff';

function calculateChangePercent(
  oldHtml: string,
  newHtml: string
): number {
  const oldLines = oldHtml.split('\n');
  const newLines = newHtml.split('\n');
  
  const diff = diffLines(oldHtml, newHtml);
  
  let addedLines = 0;
  let removedLines = 0;
  let totalLines = Math.max(oldLines.length, newLines.length);
  
  diff.forEach(part => {
    if (part.added) {
      addedLines += part.count || 0;
    } else if (part.removed) {
      removedLines += part.count || 0;
    }
  });
  
  const changedLines = addedLines + removedLines;
  const changePercent = (changedLines / totalLines) * 100;
  
  return Math.round(changePercent * 100) / 100; // 2 decimal places
}
```

### 7.4 Incident Handling

```typescript
async function handleIncidents(
  website: Website,
  checkResult: CheckResult
): Promise<void> {
  // Check for active incidents
  const activeIncident = await getActiveIncident(website.id);
  
  if (!checkResult.isUp) {
    // Site is down
    if (!activeIncident || activeIncident.type !== 'DOWNTIME') {
      // Create new downtime incident
      const incident = await createIncident({
        websiteId: website.id,
        type: 'DOWNTIME',
        startTime: new Date(),
        statusCode: checkResult.statusCode,
        description: checkResult.errorMessage || 
                    `HTTP ${checkResult.statusCode}`
      });
      
      // Send alert
      await sendAlert(website, incident);
    }
  } else if (checkResult.hasChange) {
    // Content changed significantly
    if (!activeIncident || activeIncident.type !== 'CONTENT_CHANGE') {
      const incident = await createIncident({
        websiteId: website.id,
        type: 'CONTENT_CHANGE',
        startTime: new Date(),
        changePercent: checkResult.changePercent,
        description: `Content changed by ${checkResult.changePercent}%`
      });
      
      await sendAlert(website, incident);
    }
  } else {
    // Site is up and normal
    if (activeIncident) {
      // Resolve incident
      await resolveIncident(activeIncident.id);
      
      // Send recovery alert
      await sendRecoveryAlert(website, activeIncident);
    }
  }
}
```

---

## 8. Alert System

### 8.1 Email Alert Implementation

```typescript
import * as brevo from '@getbrevo/brevo';

async function sendEmailAlert(
  website: Website,
  incident: Incident,
  config: AlertConfig
): Promise<void> {
  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    config.brevoApiKey
  );
  
  const subject = getEmailSubject(incident);
  const htmlContent = generateEmailHtml(website, incident);
  
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = {
    name: "Website Monitor",
    email: config.emailFrom
  };
  sendSmtpEmail.to = config.emailTo.map(email => ({ email }));
  
  await apiInstance.sendTransacEmail(sendSmtpEmail);
  
  // Update incident
  await updateIncident(incident.id, {
    alertSent: true,
    alertSentAt: new Date()
  });
}

function getEmailSubject(incident: Incident): string {
  switch (incident.type) {
    case 'DOWNTIME':
      return `🔴 ${incident.website.name} is DOWN`;
    case 'CONTENT_CHANGE':
      return `⚠️ ${incident.website.name} content changed`;
    default:
      return `⚠️ Issue detected: ${incident.website.name}`;
  }
}

function generateEmailHtml(
  website: Website,
  incident: Incident
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #EF4444; color: white; padding: 20px; }
        .content { padding: 20px; background: #F9FAFB; }
        .detail { margin: 10px 0; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #3B82F6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${getEmailSubject(incident)}</h2>
        </div>
        <div class="content">
          <div class="detail">
            <strong>Website:</strong> ${website.name}
          </div>
          <div class="detail">
            <strong>URL:</strong> ${website.url}
          </div>
          <div class="detail">
            <strong>Time:</strong> ${incident.startTime.toISOString()}
          </div>
          ${incident.statusCode ? `
            <div class="detail">
              <strong>Status Code:</strong> ${incident.statusCode}
            </div>
          ` : ''}
          ${incident.changePercent ? `
            <div class="detail">
              <strong>Change:</strong> ${incident.changePercent}%
            </div>
          ` : ''}
          ${incident.description ? `
            <div class="detail">
              <strong>Details:</strong> ${incident.description}
            </div>
          ` : ''}
          <a href="${process.env.APP_URL}/dashboard" class="button">
            View Dashboard
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

### 8.2 Telegram Alert Implementation

```typescript
import TelegramBot from 'node-telegram-bot-api';

async function sendTelegramAlert(
  website: Website,
  incident: Incident,
  config: AlertConfig
): Promise<void> {
  const bot = new TelegramBot(config.telegramBotToken);
  
  const message = generateTelegramMessage(website, incident);
  const keyboard = {
    inline_keyboard: [[
      {
        text: '📊 View Dashboard',
        url: `${process.env.APP_URL}/dashboard`
      }
    ]]
  };
  
  await bot.sendMessage(
    config.telegramChatId,
    message,
    {
      parse_mode: 'HTML',
      reply_markup: keyboard
    }
  );
}

function generateTelegramMessage(
  website: Website,
  incident: Incident
): string {
  const emoji = incident.type === 'DOWNTIME' ? '🔴' : '⚠️';
  const title = incident.type === 'DOWNTIME' 
    ? 'DOWNTIME ALERT' 
    : 'CONTENT CHANGE ALERT';
  
  return `
<b>${emoji} ${title}</b>

<b>Site:</b> ${website.name}
<b>URL:</b> ${website.url}
<b>Time:</b> ${incident.startTime.toLocaleString('en-US', { timeZone: 'UTC' })} UTC
${incident.statusCode ? `<b>Status:</b> ${incident.statusCode}` : ''}
${incident.changePercent ? `<b>Change:</b> ${incident.changePercent}%` : ''}

${incident.description || ''}
  `.trim();
}
```

### 8.3 Alert Rate Limiting

- Only send one alert per incident (track with `alertSent` flag)
- Send recovery alert when incident resolves
- Implement alert digest for multiple incidents:
  - If multiple incidents occur within 15 minutes, batch them
  - Send single alert with list of all incidents

---

## 9. Deployment

### 9.1 Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# API Keys
BREVO_API_KEY="xkeysib-..."
TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
TELEGRAM_CHAT_ID="123456789"

# Security
CRON_SECRET="random-secret-key-here"
NEXTAUTH_SECRET="another-random-secret"

# App Config
APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

### 9.2 GitHub Actions Workflow

Create `.github/workflows/monitor.yml`:

```yaml
name: Website Monitor

on:
  schedule:
    # Run every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allow manual trigger

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

**Required GitHub Secrets:**
- `APP_URL`: Your Vercel deployment URL
- `CRON_SECRET`: Matches env variable

### 9.3 Vercel Deployment

**vercel.json:**
```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "BREVO_API_KEY": "@brevo-api-key",
    "TELEGRAM_BOT_TOKEN": "@telegram-bot-token",
    "TELEGRAM_CHAT_ID": "@telegram-chat-id",
    "CRON_SECRET": "@cron-secret",
    "APP_URL": "@app-url"
  }
}
```

**Deployment Steps:**
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy
5. Add GitHub secrets for Actions workflow
6. Enable GitHub Actions

### 9.4 Database Setup (Supabase)

1. Create Supabase project
2. Get connection string (Transaction Pooler for Prisma)
3. Add to Vercel environment variables
4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
5. Seed initial data:
   ```bash
   npx prisma db seed
   ```

### 9.5 Post-Deployment Checklist

- [ ] Verify database connection
- [ ] Test manual check endpoint
- [ ] Configure alert settings in UI
- [ ] Send test email alert
- [ ] Send test Telegram alert
- [ ] Add 3 websites to monitor
- [ ] Verify GitHub Actions trigger (wait 5 min)
- [ ] Check logs in Vercel dashboard
- [ ] Verify checks are being recorded in database
- [ ] Test dashboard loads correctly
- [ ] Verify SLA reports generate

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Monitor Service:**
- HTML normalization functions
- Change calculation accuracy
- Hash generation consistency
- Error handling for network failures

**Alert Service:**
- Email template generation
- Telegram message formatting
- Alert deduplication logic

**Database Queries:**
- Check history retrieval
- SLA calculation accuracy
- Incident resolution logic

### 10.2 Integration Tests

**API Endpoints:**
- Check trigger endpoint with auth
- Website CRUD operations
- Report generation
- Alert configuration

**Monitoring Flow:**
- End-to-end check execution
- Incident creation and resolution
- Alert triggering

### 10.3 Manual Testing

**Before Launch:**
- [ ] Add test websites (one up, one down, one with changing content)
- [ ] Verify checks run on schedule
- [ ] Test all alert types (email, Telegram)
- [ ] Verify dashboard displays correct data
- [ ] Test all filters and date ranges
- [ ] Export reports and verify accuracy
- [ ] Test mobile responsiveness
- [ ] Verify performance under load

**Monitoring After Launch:**
- Set up monitoring for the monitor (meta-monitoring)
- Check error logs daily for first week
- Verify no missed checks
- Monitor database size growth
- Verify alert delivery rate

---

## 11. Timeline

### Week 1: Foundation (Nov 13-19)
**Days 1-2:**
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS
- [ ] Configure Prisma with Supabase
- [ ] Create database schema
- [ ] Run initial migration

**Days 3-4:**
- [ ] Implement core monitoring service
- [ ] HTML normalization functions
- [ ] Change detection algorithm
- [ ] Unit tests for monitoring logic

**Days 5-7:**
- [ ] Build monitoring API endpoints
- [ ] Implement check scheduling logic
- [ ] Set up GitHub Actions workflow
- [ ] Test end-to-end monitoring flow

### Week 2: Alerts & UI (Nov 20-26)
**Days 8-10:**
- [ ] Implement email alert service
- [ ] Implement Telegram alert service
- [ ] Create alert configuration API
- [ ] Test alert delivery

**Days 11-12:**
- [ ] Build dashboard UI
- [ ] Implement status cards
- [ ] Add real-time updates
- [ ] Create navigation layout

**Days 13-14:**
- [ ] Build daily logs page
- [ ] Implement filters and sorting
- [ ] Add pagination
- [ ] CSV export functionality

### Week 3: Reports & Polish (Nov 27-Dec 3)
**Days 15-17:**
- [ ] Implement SLA calculation logic
- [ ] Build SLA reports page
- [ ] Add charts and visualizations
- [ ] PDF export functionality

**Days 18-19:**
- [ ] Build website management UI
- [ ] Add/edit/delete website forms
- [ ] Test check functionality
- [ ] Configuration validation

**Days 20-21:**
- [ ] Settings page
- [ ] Alert configuration UI
- [ ] Documentation
- [ ] Code cleanup and optimization

### Week 4: Testing & Launch (Dec 4-10)
**Days 22-24:**
- [ ] Comprehensive testing
- [ ] Fix bugs
- [ ] Performance optimization
- [ ] Security review

**Days 25-26:**
- [ ] Deploy to Vercel
- [ ] Configure production environment
- [ ] Set up GitHub Actions
- [ ] Verify production functionality

**Days 27-28:**
- [ ] Monitor production for issues
- [ ] Fine-tune alert thresholds
- [ ] User documentation
- [ ] README with setup instructions

---

## 12. Future Enhancements

**Phase 2 (Post-MVP):**
- Multi-user support with authentication
- Custom alert rules (if response time > Xms)
- API endpoint monitoring (JSON response validation)
- SSL certificate expiration monitoring
- Response time anomaly detection (ML-based)
- Webhook integrations (Slack, Discord, PagerDuty)
- Mobile app (React Native)
- Status page (public uptime page)
- Historical trend analysis
- Competitive benchmarking

**Technical Debt:**
- Add comprehensive error tracking (Sentry)
- Implement rate limiting on API
- Add request caching
- Optimize database queries with indexes
- Implement WebSocket for real-time updates
- Add E2E tests with Playwright
- Set up CI/CD pipeline
- Add performance monitoring

---

## 13. Success Metrics

**Performance KPIs:**
- Check execution time: < 5 seconds average
- Dashboard load time: < 2 seconds
- Alert delivery latency: < 1 minute
- Database query time: < 100ms
- API response time: < 500ms

**Reliability KPIs:**
- Uptime: 99.9% (monitor itself)
- Missed checks: < 0.1%
- Alert delivery rate: > 99%
- Data retention: 100% for 90 days

**Cost KPIs:**
- Monthly hosting cost: $0 (free tier)
- Database storage usage: < 200MB
- API requests: < 40,000/month
- Email sending: < 300/day

---

## 14. Risk Assessment

**Technical Risks:**
- **Risk:** GitHub Actions delayed/missed triggers
  - **Mitigation:** Implement Vercel Cron as backup
  
- **Risk:** Database storage limit exceeded
  - **Mitigation:** Aggressive data cleanup policy
  
- **Risk:** SendGrid rate limits reached
  - **Mitigation:** Alert batching and rate limiting

**Operational Risks:**
- **Risk:** False positive alerts (site actually up)
  - **Mitigation:** Retry logic and validation
  
- **Risk:** HTML normalization too aggressive
  - **Mitigation:** Configurable threshold, manual review

**Security Risks:**
- **Risk:** Unauthorized access to monitoring API
  - **Mitigation:** Secret key authentication, IP whitelist
  
- **Risk:** Sensitive data in database
  - **Mitigation:** Encrypt API keys, no PII storage

---

## 15. Appendix

### 15.1 Example Check Flow

```
1. GitHub Actions triggers (5-min interval)
   ↓
2. POST /api/monitor/check with secret
   ↓
3. Query websites due for checking
   ↓
4. For each website:
   a. Fetch URL (30s timeout)
   b. Record status & response time
   c. Normalize HTML
   d. Calculate hash
   e. Compare with last snapshot
   f. Calculate change %
   g. Store check result
   h. Update snapshot if changed
   i. Check for incidents
   j. Send alerts if needed
   ↓
5. Return summary results
```

### 15.2 Sample Data

**Sample Website Configuration:**
```json
{
  "id": "clx123abc",
  "name": "Production Website",
  "url": "https://example.com",
  "checkFrequency": 300,
  "changeThreshold": 10.0,
  "isActive": true
}
```

**Sample Check Result:**
```json
{
  "id": "clx456def",
  "websiteId": "clx123abc",
  "statusCode": 200,
  "responseTime": 234,
  "isUp": true,
  "htmlHash": "a1b2c3d4...",
  "changePercent": 2.5,
  "hasChange": false,
  "timestamp": "2025-11-13T14:30:00Z"
}
```

**Sample Incident:**
```json
{
  "id": "clx789ghi",
  "websiteId": "clx123abc",
  "type": "DOWNTIME",
  "startTime": "2025-11-13T14:30:00Z",
  "endTime": "2025-11-13T14:45:00Z",
  "isResolved": true,
  "statusCode": 500,
  "description": "HTTP 500 Internal Server Error",
  "alertSent": true,
  "alertSentAt": "2025-11-13T14:31:00Z"
}
```

### 15.3 Useful Commands

**Development:**
```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

**Database:**
```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

**Deployment:**
```bash
# Deploy to Vercel
vercel deploy --prod

# View logs
vercel logs

# Environment variables
vercel env pull
```

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-13 | Initial | First draft of specification |

---

**End of Specification Document**
