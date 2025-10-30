# Phase 0: Research & Technology Decisions

**Feature**: XMRig Mining Contribution Dashboard
**Date**: 2025-10-30

## Overview

This document captures key technology decisions, best practices research, and architectural patterns for implementing the XMRig Mining Contribution Dashboard MVP.

## Technology Stack Decisions

### Desktop Application: Electron + React

**Decision**: Use Electron with React/TypeScript for cross-platform desktop application

**Rationale**:
- **Cross-platform**: Single codebase for Windows and macOS (required by FR-025)
- **Fast development**: React ecosystem for UI, Node.js for system integration
- **Process management**: Native `child_process` API for XMRig subprocess control
- **Binary bundling**: electron-builder supports platform-specific resource inclusion
- **No Rust required**: Avoid additional language complexity for MVP

**Alternatives Considered**:
1. **Tauri (Rust + Web)**: More performant and smaller binaries, but adds Rust learning curve and toolchain complexity
2. **Native (Swift/C++)**: Best performance but requires separate codebases per platform, significantly slower development
3. **Qt/PyQt**: Good cross-platform support but less modern UI capabilities and larger deployment footprint

**Implementation Notes**:
- Use IPC (Inter-Process Communication) between main and renderer processes
- Main process handles XMRig subprocess and local HTTP API polling
- Renderer process displays UI with 5-second React state updates
- Store email/config in `app.getPath('userData')` directory

### Web Dashboard: Next.js 14 on Vercel

**Decision**: Next.js 14 (App Router) deployed on Vercel with Edge runtime

**Rationale**:
- **Server + Client unified**: App Router handles both API routes and frontend in single framework
- **Edge runtime**: Minimal cold start for API routes (critical for 5-second refresh requirement)
- **Built-in**: No separate API framework needed
- **Vercel integration**: Native Postgres support, cron jobs, environment variables
- **Free tier sufficient**: Supports MVP scale (10-50 workers, ~500 req/hour)

**Alternatives Considered**:
1. **Separate API (Express/Fastify)**: More flexible but requires separate deployment, increased complexity
2. **Remix**: Excellent DX but less mature Edge runtime support, no built-in cron
3. **SvelteKit**: Good performance but smaller ecosystem, team may have less familiarity

**Implementation Notes**:
- Use `export const runtime = 'edge'` for API routes
- SWR for client-side data fetching with automatic 5-second revalidation
- Server-side rate limiting with in-memory token bucket (sufficient for Edge)
- No session/auth needed for MVP (public dashboard)

### Database: Vercel Postgres (Neon)

**Decision**: Vercel Postgres powered by Neon serverless PostgreSQL

**Rationale**:
- **Serverless-compatible**: Connection pooling handled automatically
- **Free tier**: Sufficient for MVP (~1000 records/day snapshot data)
- **Vercel integration**: Environment variables auto-configured
- **SQL**: Strong consistency for point calculations, familiar query language
- **No ORM overhead**: Direct SQL for simple queries

**Alternatives Considered**:
1. **MongoDB/DynamoDB**: NoSQL flexibility not needed, relational model clearer for ledger data
2. **Supabase**: Similar to Neon but less integrated with Vercel, would require separate setup
3. **SQLite**: Not suitable for serverless functions (ephemeral filesystem)

**Schema Design**:
```sql
CREATE TABLE workers_snapshot (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMP NOT NULL DEFAULT NOW(),
  worker TEXT NOT NULL,
  hashrate_1m BIGINT,
  hashrate_10m BIGINT,
  accepted BIGINT,
  rejected BIGINT,
  total_hashes BIGINT
);

CREATE TABLE points_ledger (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMP NOT NULL DEFAULT NOW(),
  worker TEXT NOT NULL,
  points NUMERIC(10,2) NOT NULL,
  reason TEXT DEFAULT 'snapshot'
);

CREATE INDEX idx_worker_ts ON workers_snapshot(worker, ts DESC);
CREATE INDEX idx_ledger_worker ON points_ledger(worker, ts DESC);
```

## XMRig Integration Patterns

### HTTP API vs stdout Parsing

**Decision**: Use XMRig HTTP API (127.0.0.1:18080) for statistics retrieval

**Rationale**:
- **Structured data**: JSON responses vs regex parsing stdout
- **Reliable**: Dedicated API designed for monitoring vs parsing debug output
- **Non-blocking**: HTTP polling doesn't interfere with process stdout/stderr
- **Future-proof**: API supports advanced features (/2/pause, /2/config) for future phases

**Configuration**:
```bash
xmrig \
  -o brtnetwork.duckdns.org:3333 \
  -u user@example.com \
  -p x \
  --rig-id=user@example.com \
  --http-host=127.0.0.1 \
  --http-port=18080 \
  --http-access-token=<random-32-char-hex> \
  --keepalive \
  --donate-level=1
```

**Security**:
- `--http-host=127.0.0.1`: Localhost-only (FR-009)
- `--http-access-token`: Random token generated on app launch
- Restricted mode (default): No control endpoints exposed in MVP

**API Endpoints Used**:
- `GET /2/summary`: Returns hashrate, shares (accepted/rejected), connection status
- Response polling: Every 5 seconds from main process
- Error handling: Retry with exponential backoff if API unavailable

### Process Lifecycle Management

**Pattern**: Graceful subprocess management with cleanup hooks

```typescript
// Pseudocode
class XMRigManager {
  private process: ChildProcess | null;
  private token: string;

  start(email: string): void {
    this.token = crypto.randomBytes(16).toString('hex');
    const args = [
      '-o', 'brtnetwork.duckdns.org:3333',
      '-u', email,
      '-p', 'x',
      '--rig-id', email,
      '--http-host', '127.0.0.1',
      '--http-port', '18080',
      '--http-access-token', this.token,
      '--keepalive',
      '--donate-level', '1'
    ];

    this.process = spawn(xmrigPath, args);
    this.process.on('exit', this.handleExit);
  }

  stop(): Promise<void> {
    // Send SIGTERM, wait 5s, then SIGKILL if needed
  }

  async getStats(): Promise<Stats> {
    // HTTP GET to 127.0.0.1:18080/2/summary with Authorization header
  }
}
```

**Best Practices**:
- Spawn with `detached: false` to ensure cleanup on app quit
- Listen to `app.on('before-quit')` to stop XMRig gracefully
- Handle crashes: restart with exponential backoff (max 3 attempts)
- Log stdout/stderr for debugging but don't parse for data

## Proxy API Integration

### API Client Pattern

**Decision**: Server-side API client with fallback endpoints

```typescript
// dashboard/lib/proxy-api.ts
const API_BASE = process.env.PROXY_API_BASE || 'http://brtnetwork.duckdns.org:8080';
const TOKEN = process.env.PROXY_API_TOKEN;

async function fetchWithFallback(primary: string, fallback: string) {
  const headers = { Authorization: `Bearer ${TOKEN}` };

  try {
    const res = await fetch(`${API_BASE}${primary}`, { headers });
    if (res.ok) return res.json();
  } catch (error) {
    console.warn(`Primary endpoint failed: ${primary}, trying fallback`);
  }

  const res = await fetch(`${API_BASE}${fallback}`, { headers });
  return res.json();
}

export async function getSummary() {
  return fetchWithFallback('/1/summary', '/');
}

export async function getWorkers() {
  return fetchWithFallback('/1/workers', '/workers.json');
}
```

**Security**:
- Token stored in `PROXY_API_TOKEN` environment variable (FR-018)
- Never expose token to client (server-only API routes)
- Rate limiting on server routes (30 req/min per IP - FR-017)

### Rate Limiting Implementation

**Pattern**: In-memory token bucket (sufficient for Edge runtime)

```typescript
// dashboard/lib/rate-limiter.ts
const buckets = new Map<string, { tokens: number; lastRefill: number }>();

export function rateLimit(ip: string, limit = 30, window = 60000): boolean {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = { tokens: limit, lastRefill: now };
    buckets.set(ip, bucket);
  }

  // Refill tokens
  const elapsed = now - bucket.lastRefill;
  if (elapsed > window) {
    bucket.tokens = limit;
    bucket.lastRefill = now;
  }

  // Consume token
  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false; // Rate limit exceeded
}
```

**Cleanup**: Periodic sweep to prevent memory leak (every 5 minutes)

## Real-Time Data Patterns

### Client-Side Refresh with SWR

**Decision**: Use SWR for automatic client-side polling with tab visibility detection

```typescript
// dashboard/app/page.tsx
import useSWR from 'swr';

function Dashboard() {
  const { data: summary } = useSWR('/api/proxy/summary', {
    refreshInterval: 5000, // 5 seconds
    focusThrottleInterval: 10000 // 10s when tab inactive
  });

  const { data: workers } = useSWR('/api/proxy/workers', {
    refreshInterval: 5000
  });

  return <div>{/* Render dashboard */}</div>;
}
```

**Benefits**:
- Automatic revalidation on focus (FR-014)
- Built-in error handling and retry
- Optimistic UI updates
- No manual interval management

### Desktop Real-Time Updates

**Pattern**: React hook with setInterval for 5-second polling

```typescript
// desktop/src/renderer/hooks/useMiningStats.ts
function useMiningStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const newStats = await window.electron.getStats(); // IPC call
      setStats(newStats);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
```

## Point Calculation Strategy

### Formula Decision

**Decision**: Use accepted shares as primary point metric (simple and fair)

```typescript
// dashboard/app/api/cron/snapshot/route.ts
async function calculatePoints(snapshot: WorkerSnapshot): number {
  // MVP: 1 point per accepted share
  return snapshot.accepted;

  // Future: Difficulty-weighted
  // return snapshot.total_hashes / 1_000_000;
}
```

**Rationale**:
- Accepted shares directly correlate with work contribution
- Simple for users to understand
- Proxy server already tracks this metric
- Can adjust formula later without schema changes

**Cron Job Flow**:
1. Fetch current workers from proxy API
2. For each active worker:
   - Insert snapshot record
   - Calculate points since last snapshot (delta accepted shares)
   - Insert points_ledger record with delta
3. Log success/failure for observability

## Testing Strategy

### Desktop Application Tests

**Unit Tests** (Jest + React Testing Library):
- Component rendering (Onboarding, MiningStats)
- Email validation logic
- Stats formatting utilities

**Integration Tests**:
- XMRig process spawn/stop lifecycle
- HTTP API polling with mock server
- IPC communication between main/renderer

**E2E Tests** (optional for MVP):
- Full flow: onboarding → mining → stats display
- Use Spectron or Playwright for Electron

### Dashboard Tests

**API Route Tests**:
- Mock external proxy API responses
- Test rate limiting enforcement
- Test error handling and fallbacks

**Component Tests**:
- WorkersTable rendering with mock data
- SummaryCard calculations
- PointsLog pagination

**Integration Tests**:
- Database queries with test fixtures
- Cron job snapshot creation

## Deployment & Operations

### Desktop Distribution

**electron-builder Configuration**:
```javascript
// electron-builder.config.js
module.exports = {
  appId: 'com.example.xmrig-dashboard',
  productName: 'XMRig Dashboard',
  directories: {
    output: 'dist'
  },
  files: ['build/**/*', 'resources/**/*'],
  extraResources: [
    {
      from: 'resources/xmrig',
      to: 'xmrig',
      filter: ['**/*']
    }
  ],
  win: {
    target: ['nsis'],
    arch: ['x64']
  },
  mac: {
    target: ['dmg'],
    arch: ['x64', 'arm64'],
    category: 'public.app-category.utilities'
  }
};
```

**Binary Inclusion**:
- Download XMRig releases from https://github.com/xmrig/xmrig/releases
- Place in `resources/xmrig/` by platform
- Include LICENSE file (GPLv3) and source link

### Vercel Deployment

**vercel.json Configuration**:
```json
{
  "crons": [
    {
      "path": "/api/cron/snapshot",
      "schedule": "*/10 * * * *"
    }
  ],
  "env": {
    "PROXY_API_BASE": "http://brtnetwork.duckdns.org:8080",
    "PROXY_API_TOKEN": "@proxy-api-token"
  }
}
```

**Environment Variables** (Vercel Dashboard):
- `PROXY_API_TOKEN`: Set to `5e4a327d3e2a` (from requirements)
- `DATABASE_URL`: Auto-configured by Vercel Postgres integration

**Deployment Flow**:
1. Push to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically on push to main branch

## License Compliance (GPLv3)

### XMRig Attribution Requirements

**GPLv3 Obligations**:
1. **Source availability**: Link to https://github.com/xmrig/xmrig
2. **License display**: Include full GPLv3 text in distribution
3. **Modification notice**: Document any changes (none for MVP - using binary as-is)
4. **User notification**: Visible notice in both desktop app and dashboard

**Implementation**:
- Desktop: LicenseNotice component in footer with link
- Dashboard: Footer with "Powered by XMRig (GPLv3)" + source link
- File: `resources/LICENSE-XMRIG.txt` bundled with app
- File: `dashboard/public/licenses/XMRIG-LICENSE.txt` served from web

**Display Text**:
```
This application uses XMRig (GPLv3 licensed).
Source code: https://github.com/xmrig/xmrig
No modifications have been made to the XMRig binary.
Full license: [View GPLv3 License]
```

## Security Considerations

### Token Management

- **Desktop**: Local HTTP API token generated per session, never persisted
- **Dashboard**: Proxy API token in environment variable only (server-side)
- **Database**: No user authentication needed for MVP (public dashboard)

### API Security

- **CORS**: Restrict to dashboard domain (can be `*` for MVP public demo)
- **Rate limiting**: 30 req/min per IP prevents abuse
- **Input validation**: Sanitize email input (basic regex validation)
- **SQL injection**: Use parameterized queries

### Desktop Security

- **Local API**: 127.0.0.1 binding prevents network access
- **Process isolation**: XMRig runs as separate process, no elevated privileges
- **File permissions**: Config files stored in user-specific app data directory

## Performance Optimization

### Desktop

- **Startup time**: Lazy-load XMRig binary (don't bundle in renderer)
- **Memory**: Use React.memo for stats components (avoid re-renders)
- **HTTP polling**: Reuse connection with keep-alive

### Dashboard

- **Edge runtime**: 0-50ms cold start vs 200-500ms for Node.js runtime
- **Database**: Index on `(worker, ts)` for fast queries
- **Caching**: No caching needed for real-time data (Cache-Control: no-store)

### Cron Job

- **Batch processing**: Process all workers in single database transaction
- **Timeout**: Set 50s timeout (Vercel limit: 60s for free tier)
- **Error recovery**: Log failures but continue processing other workers

## Open Questions & Future Enhancements

### Resolved in Research

1. **Point calculation formula**: Using accepted shares (simple, MVP-appropriate)
2. **Worker timeout**: 1 minute (from spec clarification FR-026)
3. **Real-time approach**: Polling (sufficient for 5s requirement, simpler than WebSockets)

### Deferred to Future Phases

1. **Advanced controls**: /2/pause, /2/config endpoints (out of MVP scope)
2. **GPU mining**: CUDA/OpenCL support (CPU-only for MVP)
3. **Throttling**: Dynamic CPU usage adjustment (future UX enhancement)
4. **Historical analytics**: Charts, trends, export (dashboard v2)
5. **Email verification**: SMTP integration (requires auth system)
6. **Multi-user accounts**: Authentication, profiles (significant scope increase)

## References

- [XMRig Documentation](https://xmrig.com/docs)
- [XMRig HTTP API](https://xmrig.com/docs/miner/api)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Next.js Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [SWR Documentation](https://swr.vercel.app/)
