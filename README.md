# BRT - Mining Contribution Dashboard

A comprehensive mining contribution tracking system consisting of a desktop Electron application and a web dashboard.

## Project Structure

```
.
├── desktop/          # Electron desktop application
├── dashboard/        # Next.js web dashboard
└── shared/           # Shared TypeScript types
```

## Features

### Desktop Application (Electron)
- Easy onboarding flow for new users
- Configure mining pool, wallet, and worker settings
- Real-time mining statistics display
- Automatic contribution reporting to dashboard
- Cross-platform support (Windows, macOS)

### Web Dashboard (Next.js)
- Real-time worker monitoring
- Points-based leaderboard
- Worker contribution history
- Aggregate pool statistics
- Auto-refreshing data with SWR

## Tech Stack

### Desktop
- **Electron**: Cross-platform desktop framework
- **React**: UI library
- **TypeScript**: Type-safe development
- **XMRig**: Mining engine (GPLv3)

### Dashboard
- **Next.js 14**: React framework with App Router
- **Vercel**: Hosting and Edge Functions
- **PostgreSQL**: Database (via Vercel Postgres/Neon)
- **SWR**: Data fetching and caching

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- XMRig binaries (see desktop/resources/xmrig/README.md)

### Desktop Application

```bash
cd desktop
npm install
npm run dev
```

### Web Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Visit http://localhost:3000 to view the dashboard.

## Configuration

### Desktop App
On first launch, the desktop app will guide you through configuration:
1. Mining pool URL
2. Monero wallet address
3. Worker ID (unique identifier)
4. CPU thread allocation

### Dashboard
Set the following environment variables:

```env
# Vercel Postgres connection string
POSTGRES_URL="..."

# Or individual credentials
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
```

## Points System

Workers earn points based on the delta of accepted shares:
- Each accepted share = 1 point
- Points are calculated on every contribution snapshot (every 5 seconds)
- Leaderboard ranks workers by total points

## API Endpoints

### POST /api/contributions
Submit worker mining snapshot
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

### GET /api/workers
List all workers with current status

### GET /api/workers/[workerId]
Get detailed statistics for a specific worker

### GET /api/leaderboard
Get top contributors ranked by points

## Building for Production

### Desktop App

```bash
cd desktop
npm run build              # All platforms
npm run build:win          # Windows only
npm run build:mac          # macOS only
```

### Web Dashboard

```bash
cd dashboard
npm run build
```

Deploy to Vercel:
```bash
vercel deploy --prod
```

## Database Schema

### workers_snapshot
Stores periodic snapshots of worker mining statistics.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| ts | TIMESTAMP | Snapshot timestamp |
| worker | VARCHAR(255) | Worker identifier |
| hashrate_1m | DECIMAL(12,2) | 1-minute hashrate |
| hashrate_10m | DECIMAL(12,2) | 10-minute hashrate |
| accepted | BIGINT | Cumulative accepted shares |
| rejected | BIGINT | Cumulative rejected shares |
| total_hashes | BIGINT | Total hashes computed |

### points_ledger
Records point accumulation events for each worker.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| ts | TIMESTAMP | Event timestamp |
| worker | VARCHAR(255) | Worker identifier |
| points | INTEGER | Points awarded |
| reason | VARCHAR(255) | Reason for points |

## License

### Application Code
This application (desktop and dashboard code) is released under the MIT License.

### XMRig
This application uses XMRig, which is licensed under GPLv3. See `desktop/resources/LICENSE-XMRIG.txt` for details.

XMRig binaries are not distributed with this source code and must be downloaded separately from:
https://github.com/xmrig/xmrig/releases

## Development

### Desktop Development
```bash
cd desktop
npm install
npm run dev
```

The app will launch in development mode with hot reload.

### Dashboard Development
```bash
cd dashboard
npm install
npm run dev
```

Access the dashboard at http://localhost:3000

### Shared Types
TypeScript types shared between desktop and dashboard are in `shared/types/`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- GitHub Issues: [Project Issues](https://github.com/your-org/xmrig-dashboard/issues)
- XMRig Documentation: https://xmrig.com/docs

## Acknowledgments

- XMRig team for the excellent mining software
- Vercel for hosting and infrastructure
- The Monero community
