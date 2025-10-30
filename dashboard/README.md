# BRT - Web Dashboard

Next.js 14 web dashboard for tracking and visualizing mining contributions across multiple workers.

## Features

- **Real-time Monitoring**: Live worker status updates every 5 seconds
- **Leaderboard**: Points-based ranking system
- **Worker Details**: Historical data and contribution graphs
- **Pool Statistics**: Aggregate hashrate and share counts
- **Rate Limiting**: Token bucket algorithm (30 req/min per IP)
- **Edge Runtime**: Fast global performance via Vercel Edge Functions

## Tech Stack

- Next.js 14 with App Router
- React Server Components
- Vercel Postgres (Neon)
- SWR for client-side data fetching
- TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- Vercel account (for deployment)
- PostgreSQL database (Vercel Postgres or Neon)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# .env.local
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
```

3. Initialize database:
```bash
# Run the schema from sql/schema.sql
psql $POSTGRES_URL < sql/schema.sql
```

4. Start development server:
```bash
npm run dev
```

Visit http://localhost:3000

## Database Setup

### Schema Initialization

Run `sql/schema.sql` to create tables:

```sql
CREATE TABLE workers_snapshot (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  worker VARCHAR(255) NOT NULL,
  hashrate_1m DECIMAL(12, 2) NOT NULL DEFAULT 0,
  hashrate_10m DECIMAL(12, 2) NOT NULL DEFAULT 0,
  accepted BIGINT NOT NULL DEFAULT 0,
  rejected BIGINT NOT NULL DEFAULT 0,
  total_hashes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE points_ledger (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  worker VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Vercel Postgres Setup

1. Connect Vercel project to Postgres storage
2. Environment variables are automatically configured
3. Run schema using Vercel Postgres dashboard or CLI

## API Endpoints

### POST /api/contributions
Submit worker mining snapshot.

**Request:**
```json
{
  "worker": "desktop-001",
  "hashrate1m": 1234.56,
  "hashrate10m": 1200.00,
  "accepted": 100,
  "rejected": 2,
  "totalHashes": 100000
}
```

**Response:**
```json
{
  "success": true,
  "snapshotId": 12345,
  "pointsAwarded": 5,
  "message": "Contribution recorded. Earned 5 points!"
}
```

### GET /api/workers
List all workers with current status.

**Response:**
```json
{
  "workers": [
    {
      "worker": "desktop-001",
      "status": "active",
      "hashrate1m": 1234.56,
      "hashrate10m": 1200.00,
      "totalAccepted": 1000,
      "totalRejected": 10,
      "totalPoints": 500,
      "lastSeenAt": "2025-01-15T12:00:00Z"
    }
  ],
  "timestamp": "2025-01-15T12:00:00Z"
}
```

### GET /api/workers/[workerId]
Get detailed stats for a specific worker.

**Response:**
```json
{
  "worker": "desktop-001",
  "status": "active",
  "currentHashrate": 1234.56,
  "totalAccepted": 1000,
  "totalRejected": 10,
  "totalPoints": 500,
  "lastSeenAt": "2025-01-15T12:00:00Z",
  "recentSnapshots": [...],
  "recentPoints": [...]
}
```

### GET /api/leaderboard
Get top contributors ranked by points.

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "worker": "desktop-001",
      "totalPoints": 5000,
      "totalHashes": 500000000,
      "averageHashrate": 1234.56,
      "uptimePercentage": 98.5
    }
  ],
  "timestamp": "2025-01-15T12:00:00Z"
}
```

## Configuration

### Environment Variables

```env
# Database
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."

# Next.js (optional)
NEXT_PUBLIC_API_URL="https://your-dashboard.vercel.app"
```

### Rate Limiting

Default: 30 requests per minute per IP address.

Modify in `lib/rate-limit.ts`:
```typescript
const MAX_TOKENS = 30; // requests per minute
```

### Worker Status Thresholds

Configure in `lib/worker-status.ts`:
```typescript
const ACTIVE_THRESHOLD = 60 * 1000;    // 1 minute
const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
```

## Project Structure

```
dashboard/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── components/         # React components
│   │   ├── WorkerList.tsx
│   │   └── LeaderboardTable.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useWorkers.ts
│   │   └── useLeaderboard.ts
│   └── api/                # API routes
│       ├── contributions/
│       ├── workers/
│       └── leaderboard/
├── lib/                    # Utility libraries
│   ├── db.ts
│   ├── rate-limit.ts
│   ├── worker-status.ts
│   └── points-calculator.ts
├── sql/
│   └── schema.sql          # Database schema
└── shared/                 # Shared types (symlinked)
    └── types/
```

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel dashboard
3. Connect Postgres storage
4. Deploy

```bash
# Or use Vercel CLI
vercel deploy --prod
```

### Environment Setup

Vercel automatically sets:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### Custom Domain

Configure in Vercel dashboard under Settings > Domains.

## Performance Optimization

### Caching Strategy

- Workers API: 5s cache, 10s stale-while-revalidate
- Leaderboard: 10s cache, 30s stale-while-revalidate
- SWR client-side: 5s refresh for workers, 10s for leaderboard

### Edge Runtime

All API routes use Vercel Edge Runtime for:
- Low latency globally
- Fast cold starts
- Efficient resource usage

## Monitoring

### Vercel Analytics

Enable in Vercel dashboard for:
- Page views
- API request metrics
- Error tracking

### Database Monitoring

Monitor query performance in Vercel Postgres dashboard.

## Troubleshooting

### Database Connection Issues
- Verify `POSTGRES_URL` is correct
- Check Vercel Postgres is provisioned
- Test connection from Vercel dashboard

### Slow API Responses
- Check database indexes are created
- Review query performance
- Consider adding more aggressive caching

### Rate Limit Errors
- Increase `MAX_TOKENS` in rate-limit.ts
- Implement Redis-based rate limiting for production

## License

MIT License

## Support

- Next.js Documentation: https://nextjs.org/docs
- Vercel Documentation: https://vercel.com/docs
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
# Test - 1761847831
