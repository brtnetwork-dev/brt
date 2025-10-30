# API Contracts

This directory contains OpenAPI 3.0 specifications for all APIs used in the XMRig Mining Contribution Dashboard.

## Files

### `dashboard-api.yaml`

**Purpose**: Dashboard backend API (Next.js server routes)

**Base URL**: `https://your-dashboard.vercel.app/api`

**Endpoints**:
- `GET /proxy/summary` - Network-wide mining summary
- `GET /proxy/workers` - List of active workers with stats
- `POST /cron/snapshot` - Scheduled snapshot capture (Vercel Cron only)

**Usage**:
- Client-side: React components use SWR to fetch from proxy endpoints
- Server-side: Vercel Cron calls snapshot endpoint every 10 minutes

**Authentication**:
- Proxy endpoints: None (public dashboard)
- Cron endpoint: Vercel Cron secret header

**Rate Limiting**: 30 requests/minute per IP address

---

### `xmrig-http-api.yaml`

**Purpose**: XMRig local HTTP API (read-only monitoring)

**Base URL**: `http://127.0.0.1:18080`

**Endpoints Used in MVP**:
- `GET /2/summary` - Mining statistics (polled every 5 seconds)

**Endpoints Not Used (Future)**:
- `GET /2/backends` - Backend information
- `GET /2/config` - Get configuration
- `POST /2/config` - Update configuration
- `POST /2/pause` - Pause mining
- `POST /2/resume` - Resume mining
- `POST /2/stop` - Stop mining

**Usage**:
- Desktop app main process polls `/2/summary` via HTTP
- Data forwarded to renderer process via IPC
- React components display stats in UI

**Authentication**: Bearer token (random 32-char hex, generated on app launch)

**Security**:
- Bound to 127.0.0.1 only (`--http-host=127.0.0.1`)
- Restricted mode (control endpoints disabled in MVP)

---

## Contract Usage in Implementation

### Desktop Application

```typescript
// Main process (src/main/api-client.ts)
import fetch from 'node-fetch';

class XMRigAPIClient {
  private baseURL = 'http://127.0.0.1:18080';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async getSummary(): Promise<XMRigSummary> {
    const response = await fetch(`${this.baseURL}/2/summary`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });

    if (!response.ok) {
      throw new Error(`XMRig API error: ${response.status}`);
    }

    return response.json();
  }
}
```

### Dashboard Application

```typescript
// Server route (app/api/proxy/summary/route.ts)
export const runtime = 'edge';

export async function GET(request: Request) {
  const response = await fetch(
    'http://brtnetwork.duckdns.org:8080/1/summary',
    {
      headers: {
        Authorization: `Bearer ${process.env.PROXY_API_TOKEN}`
      }
    }
  );

  return Response.json(await response.json());
}

// Client component (app/page.tsx)
import useSWR from 'swr';

function Dashboard() {
  const { data } = useSWR<ProxySummary>('/api/proxy/summary', {
    refreshInterval: 5000
  });

  return <div>{/* Render summary */}</div>;
}
```

---

## Testing with Contracts

### Generating Mock Servers

```bash
# Install Prism (OpenAPI mock server)
npm install -g @stoplight/prism-cli

# Mock dashboard API
prism mock dashboard-api.yaml -p 4010

# Mock XMRig API (for testing without real miner)
prism mock xmrig-http-api.yaml -p 18080
```

### Contract Testing

```typescript
// Example: Jest test with contract validation
import { OpenAPIValidator } from 'express-openapi-validator';

describe('Dashboard API /proxy/summary', () => {
  it('returns valid ProxySummary schema', async () => {
    const response = await fetch('http://localhost:3000/api/proxy/summary');
    const data = await response.json();

    // Validate against schema
    expect(data).toMatchObject({
      uptime: expect.any(Number),
      total_workers: expect.any(Number),
      hashrate: {
        total: expect.any(Number)
      },
      results: {
        accepted: expect.any(Number),
        rejected: expect.any(Number)
      }
    });
  });
});
```

---

## External API Dependencies

### Proxy Server API

**Base URL**: `http://brtnetwork.duckdns.org:8080`

**Endpoints** (not under our control):
- `GET /1/summary` - Network summary
- `GET /1/workers` - Worker list
- `GET /` - Fallback summary endpoint
- `GET /workers.json` - Fallback workers endpoint

**Authentication**: Bearer token (5e4a327d3e2a)

**Contract Status**: No official OpenAPI spec available. Dashboard API contract documents expected response formats based on proxy behavior.

**Error Handling**: Dashboard implements fallback endpoints and graceful degradation if primary endpoints fail.

---

## Versioning

API contracts use semantic versioning:

- **Major version** (e.g., `2.0.0` → `3.0.0`): Breaking changes (response schema changes)
- **Minor version** (e.g., `1.0.0` → `1.1.0`): Backward-compatible additions (new optional fields)
- **Patch version** (e.g., `1.0.0` → `1.0.1`): Documentation updates, clarifications

Current versions:
- Dashboard API: `1.0.0` (MVP baseline)
- XMRig HTTP API: `2.0.0` (matches XMRig API version)

---

## Future Contract Additions

Planned for post-MVP phases:

1. **Authentication API**: User login, registration, token management
2. **Admin API**: User management, manual point adjustments
3. **Rewards API**: Point redemption, payout tracking
4. **Analytics API**: Historical charts, performance trends
5. **WebSocket API**: Real-time updates (alternative to polling)

---

## References

- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [XMRig API Documentation](https://xmrig.com/docs/miner/api)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [SWR Documentation](https://swr.vercel.app/)
