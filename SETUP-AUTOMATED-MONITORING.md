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
- Value: `9f09d3c6baf33e4e54f34c04f67722babf025e1745a2d50be1a867946864fc06`

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

**Done!** Your website will now be checked every 5 minutes automatically.

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
    "schedule": "*/5 * * * *"
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
  -d '{"secret":"9f09d3c6baf33e4e54f34c04f67722babf025e1745a2d50be1a867946864fc06"}'
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
2. You should see "Website Monitor" running every 5 minutes
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
- Solution: Wait 5 minutes after first action runs
- Manually trigger: Actions → Website Monitor → Run workflow

---

## What Happens Next

Once automated monitoring is set up:

1. **Every 5 minutes**: GitHub Actions triggers a check
2. **Your website is fetched**: Status code and response time recorded
3. **Content is analyzed**: HTML changes detected
4. **Data is stored**: Checks, incidents, and snapshots saved
5. **Dashboard updates**: Real-time status displayed
6. **Reports generate**: After 10+ checks, reports become available

---

## Timeline for Data

- **First check**: Within 5 minutes of setup
- **Usable dashboard**: After 3-5 checks (15-25 minutes)
- **24-hour stats**: After 24 hours
- **Meaningful reports**: After 50+ checks (4-6 hours)

---

## Monitoring Frequency

Current setting: **Every 5 minutes**

To change:
1. Edit `.github/workflows/monitor.yml`
2. Change `cron: '*/5 * * * *'` to:
   - Every minute: `'* * * * *'`
   - Every 15 minutes: `'*/15 * * * *'`
   - Every hour: `'0 * * * *'`

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
6. Done! Checks run every 5 minutes

---

**Last Updated:** November 14, 2025
