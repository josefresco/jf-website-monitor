# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database (Supabase Recommended)
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Get your database connection string:
   - Go to Settings → Database
   - Copy the **Transaction pooler** connection string
   - Format: `postgresql://postgres.xxx:[PASSWORD]@xxx.supabase.co:6543/postgres`

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="your-supabase-connection-string"
CRON_SECRET="any-random-string-here"
APP_URL="http://localhost:3000"
NODE_ENV="development"

# Optional (for alerts)
BREVO_API_KEY=""
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
```

### 4. Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 5. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000 → You'll be redirected to the dashboard!

### 6. Add Your First Website
1. Click "Websites" in the navigation
2. Click "Add Website"
3. Enter:
   - Name: "My Website"
   - URL: https://example.com
   - Check Frequency: 5 minutes
   - Change Threshold: 10%
4. Save

### 7. Test Monitoring
Manually trigger a check:
```bash
curl -X POST http://localhost:3000/api/monitor/check \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-cron-secret"}'
```

## 📧 Setting Up Email Alerts (Optional)

1. Create a free account at https://brevo.com
2. Go to SMTP & API → API Keys
3. Generate a new API key
4. Add to `.env`: `BREVO_API_KEY="your-key"`
5. Configure in Settings page of the app

## 💬 Setting Up Telegram Alerts (Optional)

1. Open Telegram and chat with @BotFather
2. Send `/newbot` and follow instructions
3. Copy the bot token to `.env`: `TELEGRAM_BOT_TOKEN="your-token"`
4. Start a chat with your bot and send a message
5. Get your chat ID:
   ```bash
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
6. Add to `.env`: `TELEGRAM_CHAT_ID="your-chat-id"`

## 🚀 Deploying to Production

### Deploy to Vercel
1. Push code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables (same as `.env` but use production values)
5. Deploy!

### Set Up GitHub Actions
1. Go to GitHub repository → Settings → Secrets
2. Add secrets:
   - `APP_URL`: Your Vercel URL (e.g., https://jf-monitor.vercel.app)
   - `CRON_SECRET`: Same as in Vercel environment
3. Enable GitHub Actions

### Run Production Migrations
```bash
# Install Vercel CLI
npm i -g vercel

# Pull env variables
vercel env pull

# Run migrations
npx prisma migrate deploy
```

## ✅ Verification Checklist

- [ ] Dependencies installed successfully
- [ ] Database connected and migrated
- [ ] Development server running
- [ ] Can access dashboard at http://localhost:3000
- [ ] Can add a website
- [ ] Manual check works
- [ ] (Optional) Email alerts configured
- [ ] (Optional) Telegram alerts configured
- [ ] (Production) Deployed to Vercel
- [ ] (Production) GitHub Actions enabled

## 🐛 Common Issues

**"Cannot find module '@prisma/client'"**
```bash
npx prisma generate
```

**"Database connection error"**
- Check DATABASE_URL is correct
- For Supabase, use Transaction pooler, not Session pooler
- Ensure password is URL-encoded

**"Build fails on Vercel"**
```json
// vercel.json should include:
{
  "buildCommand": "prisma generate && npm run build"
}
```

**"GitHub Actions not working"**
- Check secrets are set in repository settings
- Verify Actions are enabled for your repository
- For private repos, Actions may need a paid plan

## 📚 Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Review [website-monitor-spec.md](./website-monitor-spec.md) for technical details
3. Explore the API endpoints in `src/app/api/`
4. Customize the dashboard in `src/app/dashboard/page.tsx`
5. Add more monitoring features!

## 🆘 Need Help?

- Check the [README.md](./README.md) troubleshooting section
- Review the [specification document](./website-monitor-spec.md)
- Open an issue on GitHub

Happy monitoring! 🎉
