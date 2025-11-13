# API Documentation

Complete API reference for JF Monitor.

## Base URL

**Production:** `https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app`
**Development:** `http://localhost:3000`

## Authentication

Most endpoints use secret-based authentication for write operations. The `CRON_SECRET` must be included in the request body for protected endpoints.

---

## Monitoring Endpoints

### Trigger Website Checks

Triggers monitoring checks for all active websites that are due for checking based on their configured frequency.

**Endpoint:** `POST /api/monitor/check`

**Authentication:** Required (CRON_SECRET)

**Request Body:**
```json
{
  "secret": "your-cron-secret-here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "checksPerformed": 3,
  "results": [
    {
      "websiteId": "clx1234567890",
      "websiteName": "Google",
      "isUp": true,
      "statusCode": 200,
      "responseTime": 145,
      "hasChange": false,
      "changePercent": 0
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing secret
- `500 Internal Server Error` - Server error during checks

**Example:**
```bash
curl -X POST https://your-app.vercel.app/api/monitor/check \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-cron-secret"}'
```

---

## Website Management

### List All Websites

Retrieves all websites with their check and incident counts.

**Endpoint:** `GET /api/websites`

**Query Parameters:**
- `active` (optional): Filter by active status (`true` or `false`)

**Response (200 OK):**
```json
[
  {
    "id": "clx1234567890",
    "url": "https://google.com",
    "name": "Google",
    "checkFrequency": 300,
    "changeThreshold": 10,
    "isActive": true,
    "createdAt": "2025-11-13T10:00:00.000Z",
    "updatedAt": "2025-11-13T10:00:00.000Z",
    "_count": {
      "checks": 48,
      "incidents": 2
    }
  }
]
```

**Example:**
```bash
# Get all websites
curl https://your-app.vercel.app/api/websites

# Get only active websites
curl https://your-app.vercel.app/api/websites?active=true
```

---

### Create Website

Adds a new website to monitor.

**Endpoint:** `POST /api/websites`

**Request Body:**
```json
{
  "name": "Google",
  "url": "https://google.com",
  "checkFrequency": 300,
  "changeThreshold": 10
}
```

**Field Descriptions:**
- `name` (string, required): Display name for the website
- `url` (string, required): Full URL including protocol (https://)
- `checkFrequency` (number, required): Check interval in seconds (300-3600)
- `changeThreshold` (number, required): HTML change percentage to trigger alert (0-100)

**Response (201 Created):**
```json
{
  "id": "clx1234567890",
  "url": "https://google.com",
  "name": "Google",
  "checkFrequency": 300,
  "changeThreshold": 10,
  "isActive": true,
  "createdAt": "2025-11-13T10:00:00.000Z",
  "updatedAt": "2025-11-13T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `409 Conflict` - URL already exists
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST https://your-app.vercel.app/api/websites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google",
    "url": "https://google.com",
    "checkFrequency": 300,
    "changeThreshold": 10
  }'
```

---

### Get Website Details

Retrieves detailed information about a specific website.

**Endpoint:** `GET /api/websites/[id]`

**Response (200 OK):**
```json
{
  "id": "clx1234567890",
  "url": "https://google.com",
  "name": "Google",
  "checkFrequency": 300,
  "changeThreshold": 10,
  "isActive": true,
  "createdAt": "2025-11-13T10:00:00.000Z",
  "updatedAt": "2025-11-13T10:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Website not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl https://your-app.vercel.app/api/websites/clx1234567890
```

---

### Update Website

Updates an existing website's configuration.

**Endpoint:** `PUT /api/websites/[id]`

**Request Body:**
```json
{
  "name": "Google Updated",
  "checkFrequency": 600,
  "changeThreshold": 15,
  "isActive": true
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response (200 OK):**
```json
{
  "id": "clx1234567890",
  "url": "https://google.com",
  "name": "Google Updated",
  "checkFrequency": 600,
  "changeThreshold": 15,
  "isActive": true,
  "createdAt": "2025-11-13T10:00:00.000Z",
  "updatedAt": "2025-11-13T10:15:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `404 Not Found` - Website not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X PUT https://your-app.vercel.app/api/websites/clx1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google Updated",
    "checkFrequency": 600
  }'
```

---

### Delete Website

Deactivates a website (soft delete). The website data is preserved but checks are stopped.

**Endpoint:** `DELETE /api/websites/[id]`

**Response (200 OK):**
```json
{
  "message": "Website deactivated",
  "id": "clx1234567890"
}
```

**Error Responses:**
- `404 Not Found` - Website not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X DELETE https://your-app.vercel.app/api/websites/clx1234567890
```

---

## Check History

### Get Checks

Retrieves check history with filtering options.

**Endpoint:** `GET /api/checks`

**Query Parameters:**
- `websiteId` (optional): Filter by website ID
- `startDate` (optional): ISO date string for start of range
- `endDate` (optional): ISO date string for end of range
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "checks": [
    {
      "id": "clx9876543210",
      "websiteId": "clx1234567890",
      "statusCode": 200,
      "responseTime": 145,
      "isUp": true,
      "htmlHash": "abc123...",
      "changePercent": 0,
      "hasChange": false,
      "timestamp": "2025-11-13T10:00:00.000Z",
      "errorMessage": null
    }
  ],
  "total": 48,
  "limit": 100,
  "offset": 0
}
```

**Example:**
```bash
# Get all checks for a website
curl "https://your-app.vercel.app/api/checks?websiteId=clx1234567890"

# Get checks from last 24 hours
curl "https://your-app.vercel.app/api/checks?startDate=2025-11-12T10:00:00Z"

# Get latest 10 checks
curl "https://your-app.vercel.app/api/checks?limit=10"
```

---

## Incidents

### Get Incidents

Retrieves incident history with filtering options.

**Endpoint:** `GET /api/incidents`

**Query Parameters:**
- `websiteId` (optional): Filter by website ID
- `isResolved` (optional): Filter by resolution status (`true` or `false`)
- `type` (optional): Filter by type (`DOWNTIME`, `CONTENT_CHANGE`, `TIMEOUT`, `ERROR`)
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "incidents": [
    {
      "id": "clx5555555555",
      "websiteId": "clx1234567890",
      "type": "DOWNTIME",
      "startTime": "2025-11-13T08:00:00.000Z",
      "endTime": "2025-11-13T08:05:00.000Z",
      "isResolved": true,
      "statusCode": 503,
      "changePercent": null,
      "description": "Service unavailable",
      "alertSent": true,
      "alertSentAt": "2025-11-13T08:00:30.000Z",
      "resolutionAlertSent": true,
      "createdAt": "2025-11-13T08:00:00.000Z",
      "updatedAt": "2025-11-13T08:05:00.000Z"
    }
  ],
  "total": 2,
  "limit": 100,
  "offset": 0
}
```

**Example:**
```bash
# Get all incidents for a website
curl "https://your-app.vercel.app/api/incidents?websiteId=clx1234567890"

# Get active (unresolved) incidents
curl "https://your-app.vercel.app/api/incidents?isResolved=false"

# Get downtime incidents only
curl "https://your-app.vercel.app/api/incidents?type=DOWNTIME"
```

---

## Reports

### Get SLA Report

Generates Service Level Agreement metrics for a website.

**Endpoint:** `GET /api/reports/sla`

**Query Parameters:**
- `websiteId` (required): Website ID
- `startDate` (optional): ISO date string for report start (default: 30 days ago)
- `endDate` (optional): ISO date string for report end (default: now)

**Response (200 OK):**
```json
{
  "websiteId": "clx1234567890",
  "period": {
    "start": "2025-10-14T00:00:00.000Z",
    "end": "2025-11-13T23:59:59.999Z"
  },
  "uptime": {
    "percentage": 99.95,
    "totalMinutes": 43200,
    "downMinutes": 21.6
  },
  "performance": {
    "avgResponseTime": 156,
    "p95ResponseTime": 312,
    "p99ResponseTime": 489,
    "minResponseTime": 89,
    "maxResponseTime": 1234
  },
  "incidents": {
    "total": 2,
    "downtime": 1,
    "contentChange": 1,
    "timeout": 0,
    "error": 0,
    "avgResolutionTime": 300,
    "mttr": 300
  },
  "checks": {
    "total": 8640,
    "successful": 8638,
    "failed": 2
  }
}
```

**Field Descriptions:**
- `uptime.percentage`: Percentage of time website was available
- `performance.avgResponseTime`: Average response time in milliseconds
- `performance.p95ResponseTime`: 95th percentile response time
- `incidents.mttr`: Mean Time To Recovery in seconds
- `checks.total`: Total number of checks performed

**Error Responses:**
- `400 Bad Request` - Missing websiteId
- `404 Not Found` - Website not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
# Get 30-day SLA report
curl "https://your-app.vercel.app/api/reports/sla?websiteId=clx1234567890"

# Get custom date range
curl "https://your-app.vercel.app/api/reports/sla?websiteId=clx1234567890&startDate=2025-11-01T00:00:00Z&endDate=2025-11-13T23:59:59Z"
```

---

## Alert Configuration

### Get Alert Config

Retrieves the current alert configuration.

**Endpoint:** `GET /api/alerts/config`

**Response (200 OK):**
```json
{
  "id": "clx7777777777",
  "emailEnabled": true,
  "emailTo": ["admin@example.com", "ops@example.com"],
  "emailFrom": "monitor@example.com",
  "brevoApiKey": "xkeysib-***",
  "telegramEnabled": true,
  "telegramBotToken": "123456:ABC-***",
  "telegramChatId": "987654321",
  "alertOnDown": true,
  "alertOnChange": true,
  "alertOnRecovery": true,
  "createdAt": "2025-11-13T10:00:00.000Z",
  "updatedAt": "2025-11-13T10:00:00.000Z"
}
```

**Note:** Sensitive fields like API keys are masked in the response.

**Example:**
```bash
curl https://your-app.vercel.app/api/alerts/config
```

---

### Update Alert Config

Updates the alert configuration.

**Endpoint:** `PUT /api/alerts/config`

**Request Body:**
```json
{
  "emailEnabled": true,
  "emailTo": ["admin@example.com"],
  "emailFrom": "monitor@example.com",
  "brevoApiKey": "xkeysib-your-api-key",
  "telegramEnabled": true,
  "telegramBotToken": "123456:ABC-your-bot-token",
  "telegramChatId": "987654321",
  "alertOnDown": true,
  "alertOnChange": true,
  "alertOnRecovery": true
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response (200 OK):**
```json
{
  "id": "clx7777777777",
  "emailEnabled": true,
  "emailTo": ["admin@example.com"],
  "emailFrom": "monitor@example.com",
  "brevoApiKey": "xkeysib-***",
  "telegramEnabled": true,
  "telegramBotToken": "123456:ABC-***",
  "telegramChatId": "987654321",
  "alertOnDown": true,
  "alertOnChange": true,
  "alertOnRecovery": true,
  "createdAt": "2025-11-13T10:00:00.000Z",
  "updatedAt": "2025-11-13T10:15:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid configuration data
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X PUT https://your-app.vercel.app/api/alerts/config \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "emailTo": ["admin@example.com"],
    "alertOnDown": true,
    "alertOnChange": false
  }'
```

---

## Error Responses

All endpoints may return these standard error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "details": "checkFrequency must be between 300 and 3600 seconds"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing secret"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Website not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

---

## Rate Limiting

- No rate limiting is currently implemented
- GitHub Actions cron jobs run every 5 minutes
- Manual API calls should be throttled on the client side
- Vercel serverless functions have a 10-second execution timeout (300 seconds for monitor/check)

---

## Webhooks

Webhooks are not currently supported but are planned for a future release. This will allow external services to receive real-time notifications about incidents and status changes.

---

## Best Practices

1. **Use environment variables** for API URLs and secrets
2. **Handle errors gracefully** - All endpoints may fail
3. **Implement retry logic** for failed requests
4. **Cache responses** when appropriate (especially SLA reports)
5. **Use pagination** for large datasets (checks and incidents)
6. **Validate input** before sending to the API
7. **Monitor your monitoring** - Set up alerts for failed checks

---

## Example Integration

### JavaScript/TypeScript Client

```typescript
class JFMonitorClient {
  constructor(
    private baseUrl: string,
    private cronSecret: string
  ) {}

  async getWebsites(active?: boolean) {
    const url = new URL(`${this.baseUrl}/api/websites`)
    if (active !== undefined) {
      url.searchParams.set('active', String(active))
    }
    const response = await fetch(url.toString())
    return response.json()
  }

  async createWebsite(data: {
    name: string
    url: string
    checkFrequency: number
    changeThreshold: number
  }) {
    const response = await fetch(`${this.baseUrl}/api/websites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async triggerCheck() {
    const response = await fetch(`${this.baseUrl}/api/monitor/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: this.cronSecret }),
    })
    return response.json()
  }

  async getSLAReport(websiteId: string, startDate?: string, endDate?: string) {
    const url = new URL(`${this.baseUrl}/api/reports/sla`)
    url.searchParams.set('websiteId', websiteId)
    if (startDate) url.searchParams.set('startDate', startDate)
    if (endDate) url.searchParams.set('endDate', endDate)
    const response = await fetch(url.toString())
    return response.json()
  }
}

// Usage
const client = new JFMonitorClient(
  'https://your-app.vercel.app',
  'your-cron-secret'
)

const websites = await client.getWebsites(true)
const report = await client.getSLAReport(websites[0].id)
```

---

## Support

For API issues or questions:
- Open an issue on [GitHub](https://github.com/josefresco/jf-website-monitor/issues)
- Check the [troubleshooting guide](../README.md#troubleshooting)
- Review the [architecture documentation](./ARCHITECTURE.md)
