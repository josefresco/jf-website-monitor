# Setting Up Automated Monitoring

Your monitoring application is deployed, but **no checks are being performed automatically**. This guide will help you set up automated monitoring in 10 minutes.

## Why No Data is Showing

Currently, your website has been added but hasn't been checked yet because:
1. ❌ GitHub Actions cron job is not configured
2. ❌ Vercel deployment protection is blocking API access

## Solution: Set Up Automated Monitoring

You have **two options** - choose the one that works best for you:

---

## Option 1: GitHub Actions (Recommended - Free)

### Step 1: Disable Vercel Deployment Protection

1. Go to your Vercel project: https://vercel.com/josiah-coles-projects/jf-monitor
2. Click **Settings** (top navigation)
3. Scroll down to **Deployment Protection**
4. Click **Manage**
5. **Disable** deployment protection for Production deployments
   - Or select "Only Enable for Preview Deployments"
6. Click **Save**

**Why:** Deployment protection blocks GitHub Actions from accessing your API endpoints.

### Step 2: Add GitHub Repository Secrets

1. Go to your GitHub repository: https://github.com/josefresco/jf-website-monitor
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

**Secret 1:**
- Name: `APP_URL`
- Value: `https://jf-monitor-5aengd1k3-josiah-coles-projects.vercel.app`

**Secret 2:**
- Name: `CRON_SECRET`
- Value: `[Get this from Vercel: Settings → Environment Variables → CRON_SECRET]`

### Step 3: Add GitHub Workflow File

Since I can't push workflow files directly, you'll need to add it manually:

1. Go to your repository: https://github.com/josefresco/jf-website-monitor
2. Click **Add file** → **Create new file**
3. Name it: `.github/workflows/monitor.yml`
4. Paste this content:

```yaml
name: Website Monitor

on:
  schedule:
    # Run every 15 minutes (GitHub Actions free tier limitation)
    - cron: '*/15 * * * *'
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

5. Commit the file

### Step 4: Enable GitHub Actions

1. Go to your repository **Actions** tab
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. You should see "Website Monitor" workflow listed

### Step 5: Test It!

1. Click on **"Website Monitor"** workflow
2. Click **"Run workflow"** dropdown
3. Click **"Run workflow"** button
4. Wait 30 seconds
5. Go to your dashboard: https://jf-monitor-5aengd1k3-josiah-coles-projects.vercel.app/dashboard
6. You should see data!

**Done!** Your website will now be checked every 15-20 minutes automatically (GitHub Actions free tier limitation).

---

## Option 2: Vercel Cron (Alternative - Requires Paid Plan)

If you have a Vercel Pro plan, you can use Vercel Cron instead of GitHub Actions.

### Step 1: Create vercel.json with Cron

Add this to your `vercel.json`:

```json
{
  "buildCommand": "prisma generate && npm run build",
  "functions": {
    "src/app/api/monitor/check/route.ts": {
      "maxDuration": 300
    }
  },
  "crons": [{
    "path": "/api/monitor/check",
    "schedule": "*/15 * * * *"
  }]
}
```

### Step 2: Deploy

```bash
vercel --prod
```

**Note:** Vercel Cron is only available on Pro and Enterprise plans ($20/month+).

---

## Option 3: Manual Checks (Temporary Solution)

If you want to see data immediately while setting up automation:

### Disable Deployment Protection First

1. Go to: https://vercel.com/josiah-coles-projects/jf-monitor/settings
2. **Deployment Protection** → **Manage**
3. **Disable** for Production
4. **Save**

### Then Run Manual Check

Visit this URL in your browser (logged into Vercel):

```
https://jf-monitor-5aengd1k3-josiah-coles-projects.vercel.app/api/monitor/check
```

Then send a POST request with the secret:

```bash
curl -X POST https://jf-monitor-5aengd1k3-josiah-coles-projects.vercel.app/api/monitor/check \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_CRON_SECRET_HERE"}'
```

After running this, check your dashboard - you should see data!

---

## Verification

After setup, verify everything is working:

1. **Dashboard**: Should show your website status
2. **Logs**: Should show check history
3. **Reports**: Will populate after 10+ checks

### Check GitHub Actions

1. Go to: https://github.com/josefresco/jf-website-monitor/actions
2. You should see "Website Monitor" running every 15-20 minutes
3. Click on any run to see the output

### Common Issues

**Issue: GitHub Actions not running**
- Solution: Make sure you enabled Actions in the repository settings
- Check: Repository → Settings → Actions → Allow all actions

**Issue: Actions failing with 401 Unauthorized**
- Solution: Check that `CRON_SECRET` matches exactly (no extra spaces)
- Regenerate secret if needed

**Issue: Actions failing with authentication required**
- Solution: Disable Vercel Deployment Protection (see Step 1)

**Issue: No data in dashboard**
- Solution: Wait 15-20 minutes after first action runs
- Manually trigger: Actions → Website Monitor → Run workflow

---

## What Happens Next

Once automated monitoring is set up:

1. **Every 15-20 minutes**: GitHub Actions triggers a check (free tier limitation)
2. **Your website is fetched**: Status code and response time recorded
3. **Content is analyzed**: HTML changes detected
4. **Data is stored**: Checks, incidents, and snapshots saved
5. **Dashboard updates**: Real-time status displayed
6. **Reports generate**: After 10+ checks, reports become available

**Note**: GitHub Actions scheduled workflows may be delayed during high load. Actual check intervals range from 15-30 minutes on the free tier.

---

## Timeline for Data

- **First check**: Within 15-20 minutes of setup
- **Usable dashboard**: After 3-5 checks (1-2 hours)
- **24-hour stats**: After 24 hours
- **Meaningful reports**: After 50+ checks (12-24 hours)

---

## Monitoring Frequency

Current setting: **Every 15 minutes** (due to GitHub Actions free tier limitations)

**Note**: GitHub Actions scheduled workflows on the free tier are not guaranteed to run at exact intervals. Expect 15-30 minute intervals.

To change frequency:
1. Edit `.github/workflows/monitor.yml`
2. Change `cron: '*/15 * * * *'` to:
   - Every 30 minutes: `'*/30 * * * *'`
   - Every hour: `'0 * * * *'`

**For more reliable scheduling**, consider:
- Upgrading to Vercel Pro ($20/month) for Vercel Cron
- Using a third-party cron service like cron-job.org (free tier available)

---

## Need Help?

- **Check workflow runs**: https://github.com/josefresco/jf-website-monitor/actions
- **View Vercel logs**: https://vercel.com/josiah-coles-projects/jf-monitor
- **Documentation**: See README.md and docs/ folder

---

## Quick Start (TL;DR)

1. Disable Vercel Deployment Protection
2. Add GitHub secrets: `APP_URL` and `CRON_SECRET`
3. Create `.github/workflows/monitor.yml` (copy from above)
4. Enable GitHub Actions
5. Run workflow manually to test
6. Done! Checks run every 15-20 minutes (GitHub Actions free tier limitation)

---

**Last Updated:** November 14, 2025
