# 🎉 JF Monitor - Successfully Deployed!

## Your Live Website Monitor is Ready!

### 🌐 **Live URLs:**
- **Dashboard:** https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app/dashboard
- **Websites Management:** https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app/websites
- **GitHub Repo:** https://github.com/josefresco/jf-website-monitor
- **Vercel Project:** https://vercel.com/josiah-coles-projects/jf-monitor

---

## ✅ What's Deployed:

1. ✅ **Next.js 14 Application** deployed to Vercel
2. ✅ **Vercel Postgres Database** (Prisma Postgres powered by Neon)
3. ✅ **Database Schema** created and synced
4. ✅ **Environment Variables:**
   - DATABASE_URL (Vercel Postgres)
   - CRON_SECRET: `9f09d3c6baf33e4e54f34c04f67722babf025e1745a2d50be1a867946864fc06`
   - NODE_ENV: production
   - APP_URL

---

## 🚀 **How to Use Your Monitor:**

### 1. Visit the Dashboard
Go to: https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app/dashboard

You'll see "No websites configured yet"

### 2. Add Your First Website

**Via the Web UI (Recommended):**
1. Go to: https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app/websites
2. Click "+ Add Website"
3. Fill in the form:
   - **Name:** Google
   - **URL:** https://google.com
   - **Check Frequency:** Every 5 minutes
   - **Change Threshold:** 10%
4. Click "Add Website"

**Via API:**
```bash
curl -X POST https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app/api/websites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google",
    "url": "https://google.com",
    "checkFrequency": 300,
    "changeThreshold": 10
  }'
```

### 3. Trigger a Manual Check

```bash
curl -X POST https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app/api/monitor/check \
  -H "Content-Type: application/json" \
  -d '{"secret":"9f09d3c6baf33e4e54f34c04f67722babf025e1745a2d50be1a867946864fc06"}'
```

### 4. View Results

Refresh the dashboard to see your website status, uptime, and response times!

---

## 📊 **Available Pages:**

- **Dashboard:** `/dashboard` - Real-time monitoring overview
- **Websites:** `/websites` - Manage monitored websites
- **Logs:** `/logs` - View check history (to be built)
- **Reports:** `/reports` - SLA metrics and analytics (to be built)
- **Settings:** `/settings` - Configure alerts (to be built)

---

## 📊 **Available API Endpoints:**

- `GET /api/websites` - List all websites
- `POST /api/websites` - Add a website
- `GET /api/websites/[id]` - Get website details
- `PUT /api/websites/[id]` - Update website
- `DELETE /api/websites/[id]` - Remove website
- `POST /api/monitor/check` - Trigger monitoring check (requires CRON_SECRET)
- `GET /api/checks?websiteId=[id]` - Get check history
- `GET /api/incidents?websiteId=[id]` - Get incidents
- `GET /api/reports/sla?websiteId=[id]` - Get SLA metrics
- `GET /api/alerts/config` - Get alert configuration
- `PUT /api/alerts/config` - Update alert configuration

---

## 🤖 **Set Up Automated Monitoring:**

To run checks automatically every 5 minutes, set up GitHub Actions:

### Option 1: GitHub Actions (Free & Recommended)

1. Go to: https://github.com/josefresco/jf-website-monitor/settings/secrets/actions
2. Click "New repository secret"
3. Add these secrets:
   - **Name:** `APP_URL`
     **Value:** `https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app`
   - **Name:** `CRON_SECRET`
     **Value:** `9f09d3c6baf33e4e54f34c04f67722babf025e1745a2d50be1a867946864fc06`
4. Restore the workflow file:
   ```bash
   cd /mnt/c/Users/info/COLEwebdev/Apps/jf-monitor
   mv monitor-workflow.yml.backup .github/workflows/monitor.yml
   git add .github/workflows/monitor.yml
   git commit -m "Add GitHub Actions workflow for automated monitoring"
   git push
   ```
5. Go to **Actions** tab on GitHub and enable workflows

Your websites will be checked automatically every 5 minutes!

---

## 📧 **Set Up Alerts (Optional):**

### Email Alerts (Brevo)
1. Sign up at https://brevo.com (free)
2. Get API key from SMTP & API → API Keys
3. Add to Vercel environment variables:
   ```bash
   echo "your-brevo-api-key" | vercel env add BREVO_API_KEY production
   vercel --prod
   ```

### Telegram Alerts
1. Chat with @BotFather on Telegram
2. Send `/newbot` and create your bot
3. Get bot token and chat ID
4. Add to Vercel:
   ```bash
   echo "your-bot-token" | vercel env add TELEGRAM_BOT_TOKEN production
   echo "your-chat-id" | vercel env add TELEGRAM_CHAT_ID production
   vercel --prod
   ```

---

## 📝 **Important Information:**

### Your CRON_SECRET (Save This!)
```
9f09d3c6baf33e4e54f34c04f67722babf025e1745a2d50be1a867946864fc06
```
This is required to trigger monitoring checks via API.

### Database
- **Type:** Vercel Postgres (Prisma Postgres powered by Neon)
- **Location:** Vercel Storage (connected to jf-monitor project)
- **Schema:** All tables created and synced ✅

### Project Structure
- **GitHub:** https://github.com/josefresco/jf-website-monitor
- **Vercel:** https://vercel.com/josiah-coles-projects/jf-monitor
- **Database:** Vercel Postgres (managed through Vercel Storage)

---

## 🎯 **Next Steps:**

1. ✅ Visit https://jf-monitor-2uwoggew2-josiah-coles-projects.vercel.app/websites
2. ✅ Add 1-3 websites to monitor
3. ✅ Trigger a manual check (or wait for automated checks)
4. ✅ View results in dashboard
5. (Optional) Set up GitHub Actions for automated checks
6. (Optional) Configure email/Telegram alerts

---

## 🆘 **Troubleshooting:**

### Dashboard shows "No websites"
- Add a website using the /websites page

### Can't add website
- Check Vercel function logs: https://vercel.com/josiah-coles-projects/jf-monitor
- Ensure DATABASE_URL is correctly set

### Can't trigger monitoring
- Make sure you're using the correct CRON_SECRET
- Check that the website is active (`isActive: true`)

---

## 🎉 **You're All Set!**

Your website monitor is now live with Vercel Postgres! You can start monitoring websites immediately.

**Need help?** Check the README.md or SETUP.md files in your project.

---

**Deployed on:** November 13, 2025
**Status:** ✅ Live and Running
**Database:** ✅ Vercel Postgres (Prisma Postgres powered by Neon)
**Schema:** ✅ Synced Successfully
