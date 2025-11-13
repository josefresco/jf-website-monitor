# Database Connection Troubleshooting

## Current Issue
Vercel cannot connect to Supabase database from serverless functions.

## What We've Tried
1. ✅ Connection pooler (port 6543) - Can't reach
2. ✅ Direct connection (port 5432) - Can't reach
3. ✅ Direct connection with SSL - Testing now...

## Current Connection String
```
postgresql://postgres:q6JuryD5fe7PiQ8u@db.pjmbkqujnhqulfhibado.supabase.co:5432/postgres?sslmode=require
```

## Solution Options

### Option A: Use Different Database (Recommended)

**Vercel Postgres** - Built specifically for Vercel, works perfectly with serverless:

1. Go to https://vercel.com/dashboard
2. Select your project: `jf-monitor`
3. Go to "Storage" tab
4. Click "Create Database" → Choose "Postgres"
5. Select "Hobby" (Free tier: 256 MB, 60 hours compute/month)
6. Copy the connection string
7. Update in Vercel:
   ```bash
   echo "your-vercel-postgres-url" | vercel env add DATABASE_URL production
   vercel --prod
   ```

### Option B: Fix Supabase Connection

**Check Supabase Settings:**

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/pjmbkqujnhqulfhibado
2. **Settings** → **Database** → **Connection Pooling**
3. Enable IPv4 if it's IPv6 only
4. Check if there are any IP restrictions

**Alternative Connection Strings to Try:**

```bash
# Transaction Pooler with Prisma settings
postgresql://postgres:q6JuryD5fe7PiQ8u@db.pjmbkqujnhqulfhibado.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Session Pooler
postgresql://postgres.pjmbkqujnhqulfhibado:q6JuryD5fe7PiQ8u@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Direct with additional parameters
postgresql://postgres:q6JuryD5fe7PiQ8u@db.pjmbkqujnhqulfhibado.supabase.co:5432/postgres?sslmode=require&connect_timeout=10
```

### Option C: Use Prisma Accelerate (Advanced)

Prisma Accelerate provides connection pooling as a service:

1. Sign up at https://console.prisma.io
2. Create new project
3. Connect to Supabase
4. Get Accelerate connection string
5. Update Prisma schema:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

### Option D: Deploy to Different Platform

If Vercel + Supabase connection persists:

**Alternatives:**
- **Railway.app** - Easy Postgres + app hosting, works great
- **Render.com** - Free tier includes Postgres
- **Fly.io** - Good for full-stack apps with databases

## Quick Test

To verify if the connection works, try this in Vercel Function logs:

```bash
vercel logs --follow
```

Then try adding a website in the UI and watch for errors.

## Current Deployment Status

**Latest URL:** https://jf-monitor-lu2a2rw22-josiah-coles-projects.vercel.app

**Testing now with:**
- SSL mode enabled
- Direct connection to Supabase

**If this fails:**
I recommend switching to Vercel Postgres (Option A) - it's designed to work perfectly with Vercel serverless and the setup takes 2 minutes.

---

**Last Updated:** November 13, 2025
