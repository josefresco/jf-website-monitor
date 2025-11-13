# Architecture Documentation

Technical architecture and design decisions for JF Monitor.

## System Overview

JF Monitor is a serverless website monitoring application built on Next.js 14, deployed on Vercel with Postgres database storage. It performs periodic health checks, tracks content changes, and sends alerts when issues are detected.

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                          │
│                 (Cron: Every 5 minutes)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ POST /api/monitor/check
                     │ (with CRON_SECRET)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Serverless                        │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Next.js  │  │  API Routes  │  │   React Pages     │    │
│  │   App     │──│  Endpoints   │──│   (Dashboard)     │    │
│  └───────────┘  └──────┬───────┘  └──────────────────┘    │
└─────────────────────────┼────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│  Vercel        │ │     Brevo      │ │   Telegram     │
│  Postgres      │ │  Email API     │ │   Bot API      │
│  Database      │ │  (Alerts)      │ │  (Alerts)      │
└────────────────┘ └────────────────┘ └────────────────┘
```

## Technology Stack

### Frontend

**Next.js 14 (App Router)**
- Server-side rendering (SSR)
- Client-side navigation
- Automatic code splitting
- Image optimization

**React 18**
- Functional components with hooks
- Concurrent features
- Suspense boundaries

**TypeScript**
- Type safety
- Better IDE support
- Compile-time error checking

**Tailwind CSS**
- Utility-first CSS
- Responsive design
- Dark mode support (future)

### Backend

**Next.js API Routes**
- Serverless functions
- RESTful endpoints
- Edge runtime support (future)

**Prisma ORM**
- Type-safe database access
- Schema migrations
- Connection pooling

**Vercel Postgres**
- Serverless-optimized PostgreSQL
- Automatic connection pooling
- Low latency

### Infrastructure

**Vercel**
- Serverless deployment
- Edge network (CDN)
- Automatic HTTPS
- Environment variables
- Deployment previews

**GitHub Actions**
- Cron-based monitoring
- Automated deployments (future)
- CI/CD pipeline (future)

### External Services

**Brevo (Email)**
- Transactional emails
- Template management
- Delivery tracking

**Telegram Bot API**
- Instant notifications
- Rich message formatting
- No server required

## Architecture Patterns

### Serverless Functions

All API endpoints run as serverless functions with these characteristics:

- **Stateless**: No server-side sessions
- **Auto-scaling**: Handles traffic spikes automatically
- **Cold starts**: ~100-300ms on first request
- **Execution timeout**: 10s default, 300s for monitoring

```typescript
// Example: API Route Structure
export async function GET(request: NextRequest) {
  // 1. Parse request parameters
  // 2. Validate input
  // 3. Query database
  // 4. Transform data
  // 5. Return response
}
```

### Database Design

**Entity-Relationship Diagram:**

```
┌─────────────┐
│   Website   │
│─────────────│
│ id          │───┐
│ url         │   │
│ name        │   │
│ frequency   │   │
│ threshold   │   │
└─────────────┘   │
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│  Check   │  │ Incident │  │ HtmlSnapshot │
│──────────│  │──────────│  │──────────────│
│ id       │  │ id       │  │ id           │
│ website  │  │ website  │  │ website      │
│ status   │  │ type     │  │ html         │
│ time     │  │ start    │  │ hash         │
│ hash     │  │ end      │  │ timestamp    │
└──────────┘  └──────────┘  └──────────────┘
```

**Schema Principles:**

1. **Normalization**: Minimize data redundancy
2. **Indexes**: Optimized for common queries
3. **Cascading deletes**: Automatic cleanup
4. **Timestamps**: Track all changes
5. **Soft deletes**: Archive instead of removing (websites)

### Monitoring Flow

**Check Execution:**

```
1. GitHub Actions triggers cron
      ↓
2. POST /api/monitor/check (with secret)
      ↓
3. Query active websites due for check
      ↓
4. For each website:
   a. Fetch website content
   b. Normalize HTML
   c. Calculate hash
   d. Compare with last snapshot
   e. Record check result
   f. Detect incidents
      ↓
5. If incident detected:
   a. Create/update incident record
   b. Trigger alert system
      ↓
6. If incident resolved:
   a. Update incident record
   b. Send recovery alert
      ↓
7. Return summary of checks
```

**Monitoring Logic:**

```typescript
// Core monitoring algorithm
async function performCheck(website: Website): Promise<CheckResult> {
  try {
    // 1. Fetch website
    const response = await axios.get(website.url, {
      timeout: 30000,
      validateStatus: () => true,
    })

    // 2. Normalize HTML
    const normalizedHtml = normalizeHtml(response.data)
    const htmlHash = generateHash(normalizedHtml)

    // 3. Get last snapshot
    const lastSnapshot = await getLastSnapshot(website.id)

    // 4. Calculate change
    let changePercent = 0
    if (lastSnapshot) {
      changePercent = calculateChangePercent(
        lastSnapshot.htmlContent,
        normalizedHtml
      )
    }

    // 5. Store check result
    const check = await prisma.check.create({
      data: {
        websiteId: website.id,
        statusCode: response.status,
        responseTime: response.duration,
        isUp: response.status === 200,
        htmlHash,
        changePercent,
        hasChange: changePercent > website.changeThreshold,
      },
    })

    // 6. Handle incidents
    await handleIncidents(website, check)

    return check
  } catch (error) {
    // Handle errors
  }
}
```

### HTML Normalization

**Purpose:** Remove dynamic content to avoid false positives

**Algorithm:**

```typescript
function normalizeHtml(html: string): string {
  let normalized = html

  // 1. Remove HTML comments
  normalized = normalized.replace(/<!--[\s\S]*?-->/g, '')

  // 2. Remove script tags and content
  normalized = normalized.replace(
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    ''
  )

  // 3. Remove style tags and content
  normalized = normalized.replace(
    /<style[^>]*>[\s\S]*?<\/style>/gi,
    ''
  )

  // 4. Replace timestamps with placeholder
  normalized = normalized.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/g,
    'TIMESTAMP'
  )

  // 5. Remove CSRF tokens
  normalized = normalized.replace(
    /<meta[^>]*name=["']csrf-token["'][^>]*>/gi,
    ''
  )

  // 6. Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}
```

**Limitations:**

- Cannot detect changes in JavaScript-rendered content
- May miss changes in embedded JSON or data attributes
- Clock skew can affect timestamp normalization

### Change Detection

**Uses the `diff` library:**

```typescript
function calculateChangePercent(
  oldHtml: string,
  newHtml: string
): number {
  const diff = diffLines(oldHtml, newHtml)

  let addedLines = 0
  let removedLines = 0

  diff.forEach((part) => {
    if (part.added) addedLines += part.count || 0
    else if (part.removed) removedLines += part.count || 0
  })

  const totalLines = Math.max(
    oldHtml.split('\n').length,
    newHtml.split('\n').length
  )

  return Math.round(
    ((addedLines + removedLines) / totalLines) * 100 * 100
  ) / 100
}
```

### Incident Management

**Incident Types:**

1. **DOWNTIME**: Status code ≠ 200
2. **CONTENT_CHANGE**: HTML change > threshold
3. **TIMEOUT**: Request takes > 30 seconds
4. **ERROR**: Network or server error

**Incident Lifecycle:**

```
┌──────────┐
│  Normal  │
└────┬─────┘
     │
     │ Issue detected
     ▼
┌──────────┐    Alert sent    ┌──────────────┐
│  Active  │─────────────────>│ Alerted      │
│ Incident │                  │ (alertSent)  │
└────┬─────┘                  └──────────────┘
     │
     │ Issue resolved
     ▼
┌──────────┐    Recovery alert    ┌──────────────┐
│ Resolved │────────────────────>│ Resolved     │
│ Incident │                     │ (notified)   │
└──────────┘                     └──────────────┘
```

### Alert System

**Alert Flow:**

```
Incident Detected
      ↓
Check Alert Config
      ↓
┌─────┴─────┐
│           │
▼           ▼
Email     Telegram
Alert      Alert
(Brevo)    (Bot API)
```

**Alert Types:**

1. **Downtime Alert**: Site is down
2. **Content Change Alert**: Significant content change detected
3. **Recovery Alert**: Site has recovered

**Email Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .alert { padding: 20px; background: #f8d7da; }
    .recovery { background: #d4edda; }
  </style>
</head>
<body>
  <div class="alert">
    <h2>🚨 Website Down: {{website.name}}</h2>
    <p><strong>URL:</strong> {{website.url}}</p>
    <p><strong>Status:</strong> {{incident.statusCode}}</p>
    <p><strong>Time:</strong> {{incident.startTime}}</p>
    <p><strong>Message:</strong> {{incident.description}}</p>
  </div>
</body>
</html>
```

## Performance Optimizations

### Database

1. **Indexes**: On frequently queried columns
   ```sql
   CREATE INDEX idx_website_active ON Website(isActive);
   CREATE INDEX idx_check_website_timestamp ON Check(websiteId, timestamp);
   CREATE INDEX idx_incident_website_resolved ON Incident(websiteId, isResolved);
   ```

2. **Connection Pooling**: Vercel Postgres handles automatically

3. **Query Optimization**:
   - Select only needed fields
   - Use pagination for large datasets
   - Avoid N+1 queries with Prisma includes

### Frontend

1. **Code Splitting**: Automatic with Next.js App Router

2. **Lazy Loading**: Components loaded on demand

3. **Caching**: Static pages cached at edge

4. **Image Optimization**: Next.js Image component

### API

1. **Response Compression**: Automatic with Vercel

2. **Rate Limiting**: To be implemented

3. **Caching**: SLA reports cached for 1 hour (future)

## Security Considerations

### Authentication

**Current:**
- Secret-based authentication for monitoring endpoint
- No user authentication (single-tenant)

**Future:**
- NextAuth.js for user authentication
- Role-based access control
- API key management

### Data Protection

1. **Environment Variables**: All secrets in Vercel
2. **HTTPS Only**: Enforced in production
3. **SQL Injection**: Prevented by Prisma
4. **XSS**: React escapes by default
5. **CSRF**: To be implemented with tokens

### API Security

```typescript
// Example: Secret validation
export async function POST(request: NextRequest) {
  const { secret } = await request.json()

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Proceed with request
}
```

## Scalability

### Current Limits

- **Websites**: Up to 3 (configurable)
- **Check Frequency**: 5-60 minutes
- **Concurrent Checks**: Limited by Vercel function concurrency
- **Data Retention**: 90 days (configurable)

### Scaling Strategies

1. **Horizontal**: More serverless functions (automatic)
2. **Vertical**: Upgrade Vercel plan for longer execution time
3. **Database**: Vercel Postgres scales automatically
4. **Caching**: Add Redis for frequently accessed data
5. **Queue**: Use message queue for check distribution

### Cost Projections

**Vercel Free Tier:**
- 100GB bandwidth/month
- 100 hours serverless execution/month
- Sufficient for ~50 websites checked every 5 minutes

**Vercel Postgres Free Tier:**
- 256 MB storage
- 60 hours compute/month
- Sufficient for ~10,000 checks/month

## Error Handling

### Strategy

1. **Graceful Degradation**: Show cached data if API fails
2. **Retry Logic**: Exponential backoff for transient errors
3. **Error Boundaries**: React error boundaries for UI
4. **Logging**: Vercel function logs
5. **Monitoring**: To be implemented (Sentry)

### Example

```typescript
async function fetchWithRetry(
  url: string,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { timeout: 30000 })
      return response
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(Math.pow(2, i) * 1000) // Exponential backoff
    }
  }
  throw new Error('All retries failed')
}
```

## Future Enhancements

### Planned Features

1. **Multi-user Support**: User authentication and isolation
2. **API Monitoring**: JSON validation and response checking
3. **SSL Monitoring**: Certificate expiration alerts
4. **Public Status Pages**: Shareable status pages
5. **Advanced Analytics**: Trends and predictions
6. **Mobile App**: React Native app

### Technical Improvements

1. **Testing**: Unit, integration, and E2E tests
2. **CI/CD**: Automated deployments
3. **Monitoring**: Application performance monitoring
4. **Documentation**: OpenAPI/Swagger specs
5. **Rate Limiting**: Protect against abuse
6. **Webhooks**: External integrations

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

Last Updated: November 13, 2025
