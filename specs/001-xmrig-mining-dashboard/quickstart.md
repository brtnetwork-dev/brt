# Quickstart Guide: XMRig Mining Contribution Dashboard

**Feature**: XMRig Mining Contribution Dashboard
**Branch**: `001-xmrig-mining-dashboard`
**For**: Developers setting up the project for the first time

---

## Overview

This guide helps you set up both components of the XMRig Mining Contribution Dashboard:

1. **Desktop Application** (Electron) - For Windows/macOS users to mine
2. **Web Dashboard** (Next.js) - For visualizing contributions

**Estimated Setup Time**: 30-45 minutes

---

## Prerequisites

### Required Software

- **Node.js**: v18+ (LTS recommended)
- **npm** or **yarn**: Latest version
- **Git**: For cloning the repository
- **PostgreSQL**: For local database (or use Vercel Postgres)

### Platform-Specific

**For Desktop Development**:
- Windows: Visual Studio Build Tools (for native modules)
- macOS: Xcode Command Line Tools

**For Dashboard Deployment**:
- Vercel account (free tier sufficient)

### External Dependencies

- Access to mining proxy server: `brtnetwork.duckdns.org:3333`
- Access to proxy API: `brtnetwork.duckdns.org:8080`
- Proxy API token: `5e4a327d3e2a` (from spec)

---

## Repository Structure

```
brt/
├── desktop/           # Electron application
│   ├── src/
│   ├── resources/     # XMRig binaries (see Binary Setup below)
│   └── package.json
├── dashboard/         # Next.js web application
│   ├── app/
│   ├── components/
│   └── package.json
└── shared/            # Shared TypeScript types (optional)
    └── types/
```

---

## Part 1: Desktop Application Setup

### 1. Install Dependencies

```bash
cd desktop
npm install

# Or with yarn
yarn install
```

### 2. Download XMRig Binaries

**Option A: Download Pre-built Binaries (Recommended)**

```bash
# Create resources directory
mkdir -p resources/xmrig/{win-x64,darwin-x64,darwin-arm64}

# Download from official XMRig releases
# https://github.com/xmrig/xmrig/releases

# Example: Download v6.21.0
# Windows x64:
curl -L https://github.com/xmrig/xmrig/releases/download/v6.21.0/xmrig-6.21.0-msvc-win64.zip -o xmrig-win.zip
unzip xmrig-win.zip
mv xmrig-6.21.0/xmrig.exe resources/xmrig/win-x64/

# macOS Intel:
curl -L https://github.com/xmrig/xmrig/releases/download/v6.21.0/xmrig-6.21.0-macos-x64.tar.gz -o xmrig-mac-x64.tar.gz
tar -xzf xmrig-mac-x64.tar.gz
mv xmrig-6.21.0/xmrig resources/xmrig/darwin-x64/

# macOS Apple Silicon:
curl -L https://github.com/xmrig/xmrig/releases/download/v6.21.0/xmrig-6.21.0-macos-arm64.tar.gz -o xmrig-mac-arm64.tar.gz
tar -xzf xmrig-mac-arm64.tar.gz
mv xmrig-6.21.0/xmrig resources/xmrig/darwin-arm64/
```

**Option B: Build from Source** (Advanced)

```bash
# Clone XMRig repository
git clone https://github.com/xmrig/xmrig.git
cd xmrig

# Build for your platform (see XMRig build docs)
mkdir build && cd build
cmake .. -DWITH_HTTPD=ON
make -j$(nproc)

# Copy binary to resources directory
cp xmrig ../../resources/xmrig/<platform>/
```

### 3. Add License File

```bash
# Download GPLv3 license
curl https://raw.githubusercontent.com/xmrig/xmrig/master/LICENSE -o resources/LICENSE-XMRIG.txt
```

### 4. Configure Development Environment

Create `desktop/.env.development`:

```env
# Development configuration
XMRIG_PROXY_HOST=brtnetwork.duckdns.org
XMRIG_PROXY_PORT=3333
XMRIG_HTTP_PORT=18080
```

### 5. Run in Development Mode

```bash
npm run dev

# Or with yarn
yarn dev
```

**What Happens**:
1. Electron main window opens
2. Development server starts for React renderer
3. Hot reload enabled for both main and renderer processes

### 6. Build for Production

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:win    # Windows x64
npm run build:mac    # macOS (both Intel and Apple Silicon)

# Output: dist/ directory contains installers
```

**Expected Output**:
- Windows: `dist/XMRig Dashboard Setup 1.0.0.exe`
- macOS: `dist/XMRig Dashboard-1.0.0.dmg`

---

## Part 2: Web Dashboard Setup

### 1. Install Dependencies

```bash
cd dashboard
npm install

# Or with yarn
yarn install
```

### 2. Set Up Database

**Option A: Vercel Postgres (Recommended for Deployment)**

```bash
# Install Vercel CLI
npm install -g vercel

# Link to Vercel project
vercel link

# Create Postgres database
vercel postgres create

# Pull environment variables
vercel env pull .env.local
```

**Option B: Local PostgreSQL (Development)**

```bash
# Create database
createdb xmrig_dashboard

# Run schema
psql xmrig_dashboard < sql/schema.sql
```

Create `dashboard/.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/xmrig_dashboard

# Proxy API
PROXY_API_BASE=http://brtnetwork.duckdns.org:8080
PROXY_API_TOKEN=5e4a327d3e2a

# Cron secret (generate random string)
CRON_SECRET=your-random-secret-here
```

### 3. Initialize Database Schema

```bash
# Apply schema
npm run db:init

# Or manually
psql $DATABASE_URL < sql/schema.sql
```

**Schema Created**:
- Table: `workers_snapshot`
- Table: `points_ledger`
- Indexes on `(worker, ts)` for fast queries

### 4. Run in Development Mode

```bash
npm run dev

# Dashboard available at http://localhost:3000
```

**Test Endpoints**:
- `http://localhost:3000` - Main dashboard
- `http://localhost:3000/api/proxy/summary` - Summary API
- `http://localhost:3000/api/proxy/workers` - Workers API

### 5. Test Cron Job Locally

```bash
# Trigger snapshot manually
curl -X POST http://localhost:3000/api/cron/snapshot \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 6. Deploy to Vercel

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Configure Cron Job** in Vercel Dashboard:
- Path: `/api/cron/snapshot`
- Schedule: `*/10 * * * *` (every 10 minutes)

---

## Part 3: End-to-End Testing

### 1. Start Desktop Application

```bash
cd desktop
npm run dev
```

1. Complete onboarding flow
2. Enter test email: `test@example.com`
3. Click "Start Mining"
4. Verify statistics update every 5 seconds

### 2. Verify Dashboard

Open dashboard: `http://localhost:3000` or your Vercel deployment URL

**Check**:
- Worker appears in list (may take up to 5 seconds)
- Hashrate displays correctly
- Accepted/rejected shares increment
- Summary shows aggregated statistics

### 3. Verify Snapshot Job

Wait 10 minutes or trigger manually:

```bash
curl -X POST https://your-dashboard.vercel.app/api/cron/snapshot \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Verify Database**:
```sql
-- Check snapshots
SELECT * FROM workers_snapshot ORDER BY ts DESC LIMIT 10;

-- Check points
SELECT worker, SUM(points) as total_points
FROM points_ledger
GROUP BY worker;
```

---

## Part 4: Development Workflow

### Desktop Development

```bash
cd desktop

# Start dev server with hot reload
npm run dev

# Run tests
npm test

# Run integration tests (requires XMRig binary)
npm run test:integration

# Lint code
npm run lint

# Format code
npm run format
```

### Dashboard Development

```bash
cd dashboard

# Start dev server
npm run dev

# Run tests
npm test

# Run API route tests
npm run test:api

# Type check
npm run type-check

# Lint
npm run lint
```

### Database Management

```bash
# Connect to database
psql $DATABASE_URL

# Reset database (WARNING: deletes all data)
npm run db:reset

# Seed with test data
npm run db:seed
```

---

## Common Issues & Solutions

### Issue: XMRig Binary Not Found

**Error**: `ENOENT: no such file or directory, spawn xmrig`

**Solution**:
```bash
# Verify binary exists
ls -la desktop/resources/xmrig/

# Check file permissions (macOS/Linux)
chmod +x desktop/resources/xmrig/darwin-*/xmrig

# Rebuild app
cd desktop && npm run build
```

---

### Issue: XMRig API Connection Failed

**Error**: `ECONNREFUSED 127.0.0.1:18080`

**Solution**:
- Verify XMRig process started: Check desktop app logs
- Confirm HTTP API enabled: XMRig launched with `--http-*` arguments
- Check port not in use: `lsof -i :18080` (macOS/Linux) or `netstat -ano | findstr :18080` (Windows)

---

### Issue: Proxy Connection Failed

**Error**: `Mining status: error - Unable to connect to proxy`

**Solution**:
```bash
# Test proxy connectivity
telnet brtnetwork.duckdns.org 3333

# Verify DNS resolution
nslookup brtnetwork.duckdns.org

# Check firewall not blocking port 3333
```

---

### Issue: Dashboard Shows No Workers

**Possible Causes**:
1. Desktop app not started or mining inactive
2. Proxy API unreachable
3. Token authentication failed

**Debug Steps**:
```bash
# Test proxy API directly
curl http://brtnetwork.duckdns.org:8080/1/workers \
  -H "Authorization: Bearer 5e4a327d3e2a"

# Check dashboard API route
curl http://localhost:3000/api/proxy/workers

# Check browser console for errors
# Open DevTools > Console
```

---

### Issue: Database Connection Timeout (Vercel)

**Error**: `Error: Connection pool timeout`

**Solution**:
- Verify `DATABASE_URL` in Vercel environment variables
- Check Vercel Postgres not in sleep mode
- Increase connection pool size in `lib/db.ts`:
  ```typescript
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10 // Increase from default
  });
  ```

---

### Issue: Rate Limit Exceeded

**Error**: `429 Too Many Requests`

**Solution**:
- Reduce client refresh interval (increase from 5s to 10s)
- Implement exponential backoff in API client
- Check for infinite polling loops in React components

---

## Environment Variables Reference

### Desktop Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `XMRIG_PROXY_HOST` | No | `brtnetwork.duckdns.org` | Mining proxy hostname |
| `XMRIG_PROXY_PORT` | No | `3333` | Mining proxy port |
| `XMRIG_HTTP_PORT` | No | `18080` | Local XMRig HTTP API port |

### Dashboard Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `PROXY_API_BASE` | No | `http://brtnetwork.duckdns.org:8080` | Proxy API base URL |
| `PROXY_API_TOKEN` | Yes | - | Proxy API authentication token |
| `CRON_SECRET` | Yes | - | Vercel Cron authentication secret |
| `NODE_ENV` | No | `development` | Environment mode |

---

## Production Checklist

### Before Desktop Release

- [ ] XMRig binaries included for all target platforms
- [ ] Code signing certificates configured (Windows & macOS)
- [ ] Auto-update mechanism tested (optional)
- [ ] License files bundled (GPLv3, app license)
- [ ] Installer tested on clean systems
- [ ] CPU usage reasonable (not 100% on all cores)
- [ ] Graceful shutdown on app quit

### Before Dashboard Deployment

- [ ] Environment variables configured in Vercel
- [ ] Database schema applied to production
- [ ] Cron job scheduled (every 10 minutes)
- [ ] Rate limiting tested under load
- [ ] API response times < 500ms
- [ ] Error handling covers proxy downtime
- [ ] License notice visible on dashboard

---

## Next Steps

After completing the quickstart:

1. **Read Documentation**:
   - [spec.md](./spec.md) - Feature requirements
   - [plan.md](./plan.md) - Implementation plan
   - [research.md](./research.md) - Technology decisions
   - [data-model.md](./data-model.md) - Database schema

2. **Explore Contracts**:
   - [contracts/](./contracts/) - API specifications
   - Use Prism to mock APIs for testing

3. **Run `/speckit.tasks`**:
   - Generate implementation task list
   - Break down development into actionable items

4. **Start Implementation**:
   - Follow tasks.md (after generation)
   - Implement desktop and dashboard in parallel
   - Test integration continuously

---

## Support & Resources

### Documentation

- [Electron Docs](https://www.electronjs.org/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [XMRig Docs](https://xmrig.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Community

- GitHub Issues: [Project Repository Issues]
- XMRig GitHub: https://github.com/xmrig/xmrig

### License Compliance

- XMRig: GPLv3 - https://github.com/xmrig/xmrig/blob/master/LICENSE
- Source code link required in both desktop and dashboard UIs
