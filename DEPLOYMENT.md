# Deployment Guide - JF Monitor

## Current Status
✅ Code pushed to GitHub: https://github.com/josefresco/jf-website-monitor
🔄 Installing Vercel CLI...

## Quick Deploy Steps

### Option A: Deploy via Vercel Dashboard (Easiest - 5 minutes)

1. **Go to** https://vercel.com and sign in with GitHub
2. **Click "Add New Project"**
3. **Import** `josefresco/jf-website-monitor` repository
4. **Configure Project:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `prisma generate && npm run build` (auto-configured in vercel.json)
5. **Add Environment Variables:**
   ```
   DATABASE_URL=your-supabase-connection-string
   CRON_SECRET=your-random-secret (generate at https://randomkeygen.com)
   APP_URL=https://your-app.vercel.app (will get this after deployment)
   NODE_ENV=production
   BREVO_API_KEY=(optional - leave empty for now)
   TELEGRAM_BOT_TOKEN=(optional - leave empty for now)
   TELEGRAM_CHAT_ID=(optional - leave empty for now)
   ```
6. **Click "Deploy"**
7. **Wait for deployment** (~2 minutes)
8. **Copy your deployment URL** (e.g., `https://jf-website-monitor.vercel.app`)
9. **Update APP_URL:**
   - Go to Settings → Environment Variables
   - Edit `APP_URL` and set it to your deployment URL
   - Redeploy

### Option B: Deploy via CLI (Using this session)

Once you provide the Supabase connection string, I'll:
1. Create `.env.production` file
2. Run `vercel` command to deploy
3. Set up environment variables
4. Run database migrations
5. Give you the live URL

## After Deployment

### Run Database Migrations
```bash
# Pull environment variables from Vercel
vercel env pull

# Run migrations
npx prisma migrate deploy
```

### Add Your First Website
Use the API or dashboard:
```bash
curl -X POST https://your-app.vercel.app/api/websites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Website",
    "url": "https://example.com",
    "checkFrequency": 300,
    "changeThreshold": 10
  }'
```

### Test Monitoring
```bash
curl -X POST https://your-app.vercel.app/api/monitor/check \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-cron-secret"}'
```

### Set Up GitHub Actions (Optional)
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `APP_URL`: Your Vercel deployment URL
   - `CRON_SECRET`: Same value as in Vercel
3. Restore the workflow file:
   ```bash
   mv monitor-workflow.yml.backup .github/workflows/monitor.yml
   git add .github/workflows/monitor.yml
   git commit -m "Add GitHub Actions workflow"
   git push
   ```
4. Enable Actions in your repository

## What You'll Have

✅ Live dashboard at `https://your-app.vercel.app`
✅ Monitor up to 3 websites
✅ Real-time status updates
✅ API for managing websites
✅ Database storing all check history
✅ (Optional) Automated checks every 5 minutes via GitHub Actions
✅ (Optional) Email and Telegram alerts

## Next Steps After Deployment

1. Visit your dashboard
2. Add 1-3 websites to monitor
3. Trigger a manual check via API
4. View results in dashboard
5. (Optional) Configure email/Telegram alerts in Settings

---

**Ready to deploy?** Just provide the Supabase connection string and I'll handle the rest!
