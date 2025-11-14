# JF Monitor - Website Monitoring Dashboard

A comprehensive website monitoring solution built with Next.js 14, TypeScript, and Prisma. Monitor website uptime, performance, and content changes with real-time alerts via email and Telegram.

## Features

- ✅ **Multi-Website Monitoring** - Monitor up to 3 websites simultaneously
- 📊 **Real-time Dashboard** - Live status updates with auto-refresh
- 🔔 **Smart Alerts** - Email (via Brevo) and Telegram notifications
- 📈 **SLA Reports** - Detailed uptime and performance metrics
- 🔍 **Content Change Detection** - Track HTML changes with configurable thresholds
- ⚡ **Fast Response Tracking** - Monitor response times and performance
- 🌐 **Free Hosting** - Deployable on Vercel free tier
- 🤖 **GitHub Actions Integration** - Automated monitoring with cron jobs

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js serverless functions
- **Database:** Vercel Postgres (Prisma Postgres powered by Neon)
- **ORM:** Prisma 5
- **Monitoring:** GitHub Actions (cron scheduling)
- **Alerts:** Brevo API (email), Telegram Bot API
- **Hosting:** Vercel

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Vercel account (free tier includes Postgres database)
- Brevo account for email alerts (optional)
- Telegram bot for Telegram alerts (optional)

### Installation

1. **Clone the repository**
   ```bash
   cd jf-monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   BREVO_API_KEY="your-brevo-api-key"
   TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
   TELEGRAM_CHAT_ID="your-telegram-chat-id"
   CRON_SECRET="your-random-secret-key"
   APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev --name init

   # (Optional) Open Prisma Studio to view database
   npx prisma studio
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup with Vercel Postgres

1. Go to your Vercel project dashboard
2. Click the **Storage** tab
3. Click **Create Database** → Choose **Postgres**
4. Select the **Hobby** plan (free tier: 256 MB, 60 hours compute/month)
5. Click **Connect** and use prefix `DATABASE_`
6. The connection string is automatically added to your project
7. Run migrations: `npx prisma db push`

**Note:** Vercel Postgres is optimized for serverless functions and works perfectly with this application.

## Setting Up Alerts

### Email Alerts (Brevo)

1. Create a free account at [brevo.com](https://www.brevo.com) (formerly Sendinblue)
2. Go to SMTP & API → API Keys
3. Generate a new API key
4. Add to `.env` as `BREVO_API_KEY`
5. Configure email settings in the Settings page of the app

### Telegram Alerts

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow instructions to create a bot
3. Copy the bot token to `.env` as `TELEGRAM_BOT_TOKEN`
4. Start a chat with your bot and send any message
5. Get your chat ID:
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
6. Add chat ID to `.env` as `TELEGRAM_CHAT_ID`

## Deployment to Vercel

### 1. Prepare for Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Ensure your `.gitignore` includes:
   ```
   .env
   .env*.local
   ```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure environment variables in the project settings:
   - `DATABASE_URL`
   - `BREVO_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `CRON_SECRET`
   - `APP_URL` (your Vercel deployment URL)
   - `NODE_ENV=production`

5. Deploy!

### 3. Run Database Migrations in Production

After deploying, run migrations:

```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull

# Run migrations
npx prisma migrate deploy
```

### 4. Set Up GitHub Actions

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add repository secrets:
   - `APP_URL`: Your Vercel deployment URL
   - `CRON_SECRET`: Same value as in Vercel

3. Enable GitHub Actions in your repository

The workflow will automatically trigger every 15-20 minutes to check your websites (GitHub Actions free tier limitation).

## Usage

### Adding Websites to Monitor

1. Navigate to the **Websites** page
2. Click "Add Website"
3. Fill in the form:
   - **Name**: Display name for the website
   - **URL**: Full URL including `https://`
   - **Check Frequency**: How often to check (15-60 minutes)
   - **Change Threshold**: Percentage of HTML change to trigger alert (default 10%)
4. Click "Save"

### Viewing Dashboard

The dashboard shows:
- Real-time status of all monitored websites
- Current response times
- 24-hour uptime percentage
- Active incidents count
- Last check timestamp

Auto-refreshes every 30 seconds.

### Daily Logs

View detailed check history:
- Filter by date range, website, and status
- Sort by any column
- Export to CSV
- View error details

### SLA Reports

Generate monthly reports showing:
- Uptime percentage
- Average response time
- 95th percentile response time
- Total incidents and downtime
- Mean Time To Recovery (MTTR)
- Incident timeline charts

### Configuring Alerts

In the **Settings** page:
- Toggle email/Telegram alerts on/off
- Set recipient email addresses
- Configure alert preferences (downtime, content changes, recovery)
- Test alerts before going live

## API Endpoints

### Monitoring
- `POST /api/monitor/check` - Trigger monitoring checks (requires secret)

### Websites
- `GET /api/websites` - List all websites
- `POST /api/websites` - Create new website
- `GET /api/websites/[id]` - Get website details
- `PUT /api/websites/[id]` - Update website
- `DELETE /api/websites/[id]` - Deactivate website

### Data
- `GET /api/checks` - Get check history
- `GET /api/incidents` - Get incidents
- `GET /api/reports/sla` - Get SLA metrics

### Alerts
- `GET /api/alerts/config` - Get alert configuration
- `PUT /api/alerts/config` - Update alert configuration

## Development

### Useful Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run type-check

# Run linting
npm run lint

# Generate Prisma client
npx prisma generate

# Create a migration
npx prisma migrate dev --name <migration-name>

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## Project Structure

```
jf-monitor/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── monitor/       # Monitoring endpoints
│   │   │   ├── websites/      # Website CRUD
│   │   │   ├── checks/        # Check history
│   │   │   ├── incidents/     # Incident logs
│   │   │   ├── reports/       # SLA reports
│   │   │   └── alerts/        # Alert configuration
│   │   ├── dashboard/         # Dashboard page
│   │   ├── logs/              # Daily logs page
│   │   ├── reports/           # SLA reports page
│   │   ├── websites/          # Website management
│   │   ├── settings/          # Settings page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   └── lib/                   # Utility functions
│       ├── prisma.ts          # Prisma client
│       ├── monitor.ts         # Core monitoring logic
│       ├── html-utils.ts      # HTML normalization
│       ├── incident-handler.ts # Incident management
│       └── alerts.ts          # Alert services
├── prisma/
│   └── schema.prisma          # Database schema
├── .github/
│   └── workflows/
│       └── monitor.yml        # GitHub Actions workflow
├── .env.example               # Environment variables template
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── next.config.js             # Next.js configuration
└── vercel.json                # Vercel deployment config
```

## Monitoring Logic

### HTML Normalization

The system normalizes HTML before comparison to avoid false positives:
- Removes comments
- Strips script and style tags
- Removes timestamps and dynamic content
- Filters out ads and tracking elements
- Normalizes whitespace

### Change Detection

Uses the `diff` library to calculate the percentage of lines changed between snapshots. Alerts are triggered when changes exceed the configured threshold (default 10%).

### Incident Handling

- **Downtime**: Triggered when status code ≠ 200
- **Content Change**: Triggered when HTML changes > threshold
- **Timeout**: Triggered when request takes > 30 seconds
- **Recovery**: Automatically resolves incidents when site returns to normal

## Troubleshooting

### Database Connection Issues

- Ensure `DATABASE_URL` is correct in Vercel environment variables
- For Vercel Postgres, the connection is automatically configured
- If using external database, ensure it allows connections from Vercel IPs
- Run `npx prisma db push` to sync schema after changes

### GitHub Actions Not Triggering

- Verify `APP_URL` and `CRON_SECRET` are set in repository secrets
- Check that GitHub Actions are enabled for your repository
- Note: Actions don't run in private repos on free plans

### Alerts Not Sending

- Verify API keys are correct in settings
- Check that alert types are enabled in configuration
- Test alerts using the "Test Alert" button in settings
- Check Vercel function logs for errors

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Rebuild
npm run build
```

## Performance Considerations

- Each check times out after 30 seconds
- GitHub Actions has a 5-minute execution limit
- Vercel free tier: 100GB bandwidth/month
- Supabase free tier: 500MB storage, 2GB bandwidth/month
- Keep only last 10 HTML snapshots per website
- Automatic cleanup of checks older than 90 days

## Security

- API endpoints use secret key authentication
- Sensitive credentials stored as environment variables
- API keys encrypted in database
- No public access to monitoring endpoints
- HTTPS enforced in production

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Documentation

- **[API Documentation](./docs/API.md)** - Complete API reference with examples
- **[Architecture](./docs/ARCHITECTURE.md)** - Technical architecture and design decisions
- **[Contributing Guide](./docs/CONTRIBUTING.md)** - How to contribute to the project
- **[Setup Guide](./SETUP.md)** - Quick setup instructions
- **[Deployment Guide](./DEPLOYMENT-FINAL.md)** - Production deployment guide

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/josefresco/jf-website-monitor/issues)
- Check the [troubleshooting section](#troubleshooting) above
- Review the [API documentation](./docs/API.md) for endpoint details
- Check the [architecture documentation](./docs/ARCHITECTURE.md) for technical details

## Roadmap

Future enhancements planned:
- Multi-user support with authentication
- Custom alert rules and thresholds
- API endpoint monitoring (JSON validation)
- SSL certificate expiration monitoring
- Mobile app (React Native)
- Public status pages
- Slack/Discord integrations
- Advanced analytics with AI-powered insights

---

Built with ❤️ using Next.js, TypeScript, and Prisma
