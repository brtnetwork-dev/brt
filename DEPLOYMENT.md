# Deployment Guide

This guide covers deploying BRT to production.

## Table of Contents

- [Dashboard Deployment (Vercel)](#dashboard-deployment-vercel)
- [Desktop Application Distribution](#desktop-application-distribution)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Post-Deployment](#post-deployment)

## Dashboard Deployment (Vercel)

### Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository
- PostgreSQL database (Vercel Postgres or Neon)

### Step 1: Database Setup

#### Option A: Vercel Postgres

1. Go to Vercel dashboard
2. Select your project
3. Go to Storage tab
4. Create Postgres database
5. Environment variables are automatically configured

#### Option B: External PostgreSQL (Neon)

1. Create database at https://neon.tech
2. Get connection string
3. Add to Vercel environment variables:
   ```
   POSTGRES_URL="postgresql://..."
   POSTGRES_PRISMA_URL="postgresql://..."
   POSTGRES_URL_NON_POOLING="postgresql://..."
   ```

### Step 2: Initialize Database Schema

Run the schema SQL:

```bash
# Using Vercel Postgres dashboard SQL editor
# Or using psql
psql $POSTGRES_URL < dashboard/sql/schema.sql
```

Verify tables exist:
```sql
\dt  -- List tables
SELECT * FROM workers_snapshot LIMIT 1;
SELECT * FROM points_ledger LIMIT 1;
```

### Step 3: Deploy to Vercel

#### Method 1: Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework: Next.js
4. Root Directory: `dashboard`
5. Click Deploy

#### Method 2: Vercel CLI

```bash
cd dashboard

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Step 4: Configure Environment

In Vercel dashboard:
1. Go to Settings > Environment Variables
2. Verify database variables are set
3. Add any custom variables

### Step 5: Verify Deployment

Test API endpoints:

```bash
# Test workers endpoint
curl https://your-dashboard.vercel.app/api/workers

# Test leaderboard
curl https://your-dashboard.vercel.app/api/leaderboard

# Test contributions (with desktop app running)
# Should see data appearing in dashboard
```

## Desktop Application Distribution

### Building for Production

#### Windows

```bash
cd desktop
npm install
npm run build:win
```

Output: `dist-electron/BRT-1.0.0-portable.exe`

#### macOS

```bash
cd desktop
npm install
npm run build:mac
```

Output: `dist-electron/BRT-1.0.0.dmg`

### Code Signing

#### Windows

1. Obtain code signing certificate
2. Add to electron-builder.config.js:
   ```javascript
   win: {
     certificateFile: './cert.p12',
     certificatePassword: process.env.CERT_PASSWORD,
     ...
   }
   ```

#### macOS

1. Obtain Apple Developer ID
2. Add to electron-builder.config.js:
   ```javascript
   mac: {
     identity: 'Developer ID Application: Your Name (TEAMID)',
     ...
   }
   ```

### Distribution

#### GitHub Releases

1. Create new release on GitHub
2. Upload installers:
   - `BRT-1.0.0-portable.exe` (Windows)
   - `BRT-1.0.0.dmg` (macOS)
3. Add release notes
4. Publish release

#### Direct Download

Host installers on:
- Your website
- CDN
- Cloud storage (S3, etc.)

Update README with download links.

## Database Setup

### Performance Optimization

#### Create Indexes

```sql
-- Workers snapshot indexes (already in schema.sql)
CREATE INDEX IF NOT EXISTS idx_workers_snapshot_worker ON workers_snapshot(worker);
CREATE INDEX IF NOT EXISTS idx_workers_snapshot_ts ON workers_snapshot(ts DESC);
CREATE INDEX IF NOT EXISTS idx_workers_snapshot_worker_ts ON workers_snapshot(worker, ts DESC);

-- Points ledger indexes (already in schema.sql)
CREATE INDEX IF NOT EXISTS idx_points_ledger_worker ON points_ledger(worker);
CREATE INDEX IF NOT EXISTS idx_points_ledger_ts ON points_ledger(ts DESC);
CREATE INDEX IF NOT EXISTS idx_points_ledger_worker_ts ON points_ledger(worker, ts DESC);
```

#### Maintenance

Schedule regular maintenance:

```sql
-- Vacuum tables
VACUUM ANALYZE workers_snapshot;
VACUUM ANALYZE points_ledger;

-- Reindex
REINDEX TABLE workers_snapshot;
REINDEX TABLE points_ledger;
```

### Data Retention

Optional: Archive old data

```sql
-- Archive snapshots older than 30 days
DELETE FROM workers_snapshot
WHERE ts < NOW() - INTERVAL '30 days';

-- Keep points ledger indefinitely (it's smaller)
```

## Environment Configuration

### Dashboard Environment Variables

Required:
```env
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."
```

Optional:
```env
NEXT_PUBLIC_API_URL="https://your-dashboard.vercel.app"
```

### Desktop App Configuration

Update default dashboard URL in `desktop/src/main/config-manager.ts`:

```typescript
dashboardUrl: 'https://your-dashboard.vercel.app',
```

Rebuild after changing:
```bash
npm run build
```

## Post-Deployment

### Monitoring

1. **Vercel Analytics**
   - Enable in Vercel dashboard
   - Monitor page views and API calls

2. **Database Monitoring**
   - Check query performance
   - Monitor storage usage
   - Set up alerts for errors

3. **Error Tracking**
   - Review Vercel logs
   - Set up error notifications

### Testing

1. **API Endpoints**
   ```bash
   curl https://your-dashboard.vercel.app/api/workers
   curl https://your-dashboard.vercel.app/api/leaderboard
   ```

2. **Desktop App**
   - Download and install
   - Complete onboarding
   - Verify mining starts
   - Check dashboard shows worker

3. **Load Testing**
   - Simulate multiple workers
   - Test rate limiting
   - Verify performance

### Security

1. **Rate Limiting**
   - Verify rate limits work
   - Adjust if needed in `lib/rate-limit.ts`

2. **API Security**
   - APIs are public (no auth required for MVP)
   - Consider adding API keys for production

3. **Database Security**
   - Ensure connection strings are in environment variables
   - Never commit credentials to git

### Maintenance

1. **Database Backups**
   - Vercel Postgres: Automatic backups
   - Neon: Configure backup schedule

2. **Updates**
   - Monitor XMRig releases
   - Update binaries as needed
   - Update dependencies regularly

3. **Monitoring**
   - Set up uptime monitoring
   - Create alerts for errors
   - Review logs weekly

## Troubleshooting

### Dashboard Issues

**Problem**: API returns 500 errors
- Check Vercel logs
- Verify database connection
- Test database queries manually

**Problem**: Slow response times
- Check database indexes
- Review query performance
- Consider caching improvements

### Desktop App Issues

**Problem**: Can't connect to dashboard
- Verify dashboard URL in config
- Check CORS headers
- Test API endpoints manually

**Problem**: XMRig won't start
- Verify binaries are in resources/
- Check file permissions
- Review electron logs

## Rollback Plan

If deployment fails:

1. **Dashboard**
   - Vercel: Rollback to previous deployment
   - Database: Restore from backup

2. **Desktop App**
   - Keep previous version available
   - Document known issues
   - Release hotfix if critical

## Support

After deployment:

- Monitor GitHub issues
- Respond to user reports
- Document common problems
- Update FAQs

## Checklist

Before going live:

- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Dashboard deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] Desktop apps built for all platforms
- [ ] Installers tested on target platforms
- [ ] API endpoints tested
- [ ] Rate limiting verified
- [ ] Monitoring set up
- [ ] Documentation updated
- [ ] README has correct URLs
- [ ] Release notes written

Congratulations on your deployment! 🚀
