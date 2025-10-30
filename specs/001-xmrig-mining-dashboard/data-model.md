# Data Model

**Feature**: XMRig Mining Contribution Dashboard
**Date**: 2025-10-30

## Overview

This document defines the data entities, relationships, and validation rules for the XMRig Mining Contribution Dashboard. The model is derived from the functional requirements in [spec.md](./spec.md) and supports both desktop application state management and dashboard persistence.

## Entity Definitions

### 1. Worker

**Description**: Represents an individual mining participant identified by email address. Tracks real-time mining statistics and connection state.

**Source**: Extracted from spec Key Entities section

**Attributes**:

| Field | Type | Description | Validation | Source |
|-------|------|-------------|------------|--------|
| worker_id | string (email) | Unique identifier (user's email) | Valid email format (RFC 5322) | FR-002, FR-003 |
| hashrate_current | bigint | Current hashrate in H/s | ≥ 0 | FR-007 |
| accepted_shares | bigint | Total accepted share count | ≥ 0 | FR-007 |
| rejected_shares | bigint | Total rejected share count | ≥ 0 | FR-007 |
| session_start_time | timestamp | When current session began | ISO 8601 | FR-007 |
| connection_status | enum | `connected`, `disconnected`, `error` | One of enum values | FR-026 |
| last_seen | timestamp | Last activity timestamp | ISO 8601, auto-updated | FR-026 |
| accumulated_points | numeric | Total lifetime contribution points | ≥ 0, precision 2 | FR-022 |

**Validation Rules**:
- Email must match pattern: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- Worker marked disconnected if `last_seen > 1 minute ago` (FR-026)
- Rejection rate should stay below 5% for healthy mining (SC-008)

**State Transitions**:
```
Initial → connected: User completes onboarding and mining starts
connected → disconnected: No activity for 1 minute (FR-026)
connected → error: XMRig process crashes or proxy unreachable
disconnected → connected: Worker reconnects and resumes mining
error → connected: Issue resolved and mining resumes
```

**Relationships**:
- One Worker → Many MiningSession (1:N)
- One Worker → Many ContributionSnapshot (1:N)
- One Worker → Many PointsLedgerEntry (1:N)

---

### 2. MiningSession

**Description**: Represents a continuous period of mining activity for a worker. Sessions are bounded by connection/disconnection events.

**Source**: Extracted from spec Key Entities section

**Attributes**:

| Field | Type | Description | Validation | Source |
|-------|------|-------------|------------|--------|
| session_id | uuid | Unique session identifier | UUID v4 | - |
| worker_id | string (email) | Foreign key to Worker | Must exist in Worker | FK constraint |
| start_time | timestamp | Session start timestamp | ISO 8601 | FR-007 |
| end_time | timestamp | Session end timestamp (nullable) | ISO 8601, after start_time | - |
| duration_seconds | integer | Total session runtime | Computed: end_time - start_time | FR-007 |
| final_accepted_shares | bigint | Accepted shares at session end | ≥ 0 | - |
| final_rejected_shares | bigint | Rejected shares at session end | ≥ 0 | - |
| total_hashes | bigint | Total hashes computed | ≥ 0 | - |

**Validation Rules**:
- `end_time` must be after `start_time` (if not null)
- `duration_seconds = end_time - start_time` when session closed
- Active session has `end_time = NULL`

**Lifecycle**:
1. Created when user clicks "Start Mining" (FR-001)
2. Updated with final stats when mining stops or worker disconnects
3. Historical record for session-level analytics (future phase)

**Relationships**:
- Many MiningSession → One Worker (N:1)

---

### 3. ContributionSnapshot

**Description**: Point-in-time capture of worker statistics, taken every 10 minutes by the cron job. Used for calculating point awards and historical tracking.

**Source**: Extracted from spec Key Entities section

**Attributes**:

| Field | Type | Description | Validation | Source |
|-------|------|-------------|------------|--------|
| snapshot_id | serial | Auto-incrementing primary key | Unique | - |
| snapshot_time | timestamp | When snapshot was captured | ISO 8601, defaults NOW() | FR-020 |
| worker_id | string (email) | Foreign key to Worker | Must exist in Worker | FK constraint |
| hashrate_1m | bigint | 1-minute average hashrate (H/s) | ≥ 0 | Proxy API |
| hashrate_10m | bigint | 10-minute average hashrate (H/s) | ≥ 0 | Proxy API |
| accepted_shares | bigint | Cumulative accepted shares at snapshot | ≥ 0 | FR-021 |
| rejected_shares | bigint | Cumulative rejected shares at snapshot | ≥ 0 | - |
| total_hashes | bigint | Cumulative total hashes at snapshot | ≥ 0 | - |
| calculated_points | numeric | Points awarded for this interval | ≥ 0, precision 2 | FR-021 |

**Validation Rules**:
- Snapshot captured every 10 minutes (±30 seconds tolerance)
- Points calculated as delta from previous snapshot: `points = current_accepted - previous_accepted`
- If no previous snapshot exists, award points for current accepted shares

**Calculation Logic**:
```
For MVP:
  calculated_points = accepted_shares (from current snapshot)
                    - accepted_shares (from last snapshot for same worker)

Future enhancement:
  calculated_points = (total_hashes_delta / 1_000_000) * difficulty_multiplier
```

**Relationships**:
- Many ContributionSnapshot → One Worker (N:1)
- One ContributionSnapshot → One PointsLedgerEntry (1:1, via calculated_points)

---

### 4. PointsLedgerEntry

**Description**: Historical record of point awards. Each entry represents points earned by a worker, typically from a snapshot calculation. Supports auditability and future reward distribution.

**Source**: Extracted from spec Key Entities section

**Attributes**:

| Field | Type | Description | Validation | Source |
|-------|------|-------------|------------|--------|
| ledger_id | serial | Auto-incrementing primary key | Unique | - |
| entry_time | timestamp | When points were awarded | ISO 8601, defaults NOW() | FR-022 |
| worker_id | string (email) | Foreign key to Worker | Must exist in Worker | FK constraint |
| points_awarded | numeric | Points awarded in this entry | > 0, precision 2 | FR-021 |
| reason | string | Source of award | Default: 'snapshot' | - |
| snapshot_id | integer | Reference to snapshot (nullable) | FK to ContributionSnapshot | Optional |
| cumulative_points | numeric | Running total after this entry | ≥ 0, precision 2 | FR-022 |

**Validation Rules**:
- `points_awarded` must be positive
- `cumulative_points` is calculated sum of all points for worker up to this entry
- `reason` typically 'snapshot' for MVP, can be extended ('bonus', 'adjustment', etc.)

**Audit Trail**:
- Immutable records (no updates, only inserts)
- Supports future features: point transfers, adjustments, reward payouts
- Query `SUM(points_awarded) GROUP BY worker_id` for current totals

**Relationships**:
- Many PointsLedgerEntry → One Worker (N:1)
- One PointsLedgerEntry → One ContributionSnapshot (1:1, optional)

---

## Database Schema (PostgreSQL)

### Table: `workers_snapshot`

Corresponds to **ContributionSnapshot** entity.

```sql
CREATE TABLE workers_snapshot (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMP NOT NULL DEFAULT NOW(),
  worker TEXT NOT NULL,
  hashrate_1m BIGINT,
  hashrate_10m BIGINT,
  accepted BIGINT,
  rejected BIGINT,
  total_hashes BIGINT,
  CONSTRAINT chk_hashrates CHECK (hashrate_1m >= 0 AND hashrate_10m >= 0),
  CONSTRAINT chk_shares CHECK (accepted >= 0 AND rejected >= 0),
  CONSTRAINT chk_hashes CHECK (total_hashes >= 0)
);

-- Index for fast worker history queries
CREATE INDEX idx_worker_ts ON workers_snapshot(worker, ts DESC);

-- Index for recent snapshots (cron job queries)
CREATE INDEX idx_ts ON workers_snapshot(ts DESC);
```

**Rationale**:
- `id` as SERIAL for simple auto-increment
- `ts` indexed for time-series queries
- `worker` indexed combined with `ts` for per-worker history
- Constraints enforce non-negative values

---

### Table: `points_ledger`

Corresponds to **PointsLedgerEntry** entity.

```sql
CREATE TABLE points_ledger (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMP NOT NULL DEFAULT NOW(),
  worker TEXT NOT NULL,
  points NUMERIC(10,2) NOT NULL,
  reason TEXT DEFAULT 'snapshot',
  snapshot_id INTEGER REFERENCES workers_snapshot(id) ON DELETE SET NULL,
  CONSTRAINT chk_points_positive CHECK (points > 0)
);

-- Index for worker point totals
CREATE INDEX idx_ledger_worker ON points_ledger(worker, ts DESC);

-- Index for snapshot references
CREATE INDEX idx_snapshot_ref ON points_ledger(snapshot_id);
```

**Rationale**:
- `points` as NUMERIC(10,2) for precise decimal representation (up to 99,999,999.99)
- `snapshot_id` as nullable foreign key (allows non-snapshot point entries in future)
- `reason` as TEXT for flexibility (enum would require schema changes)
- Indexed on `worker` for fast aggregation queries

---

## Desktop Application State (Not Persisted)

### Local Configuration

**Storage**: JSON file in `app.getPath('userData')/config.json`

```typescript
interface AppConfig {
  email: string | null;           // User's registered email
  termsAccepted: boolean;         // Whether user accepted terms
  autoStart: boolean;             // Start mining on app launch (future)
  theme: 'light' | 'dark';        // UI theme preference (future)
}
```

**Validation**:
- Email validated on input (FR-002)
- Config persisted after successful onboarding
- No sensitive data stored (HTTP API token is session-only)

### Real-Time Mining State

**Storage**: In-memory React state (not persisted)

```typescript
interface MiningState {
  status: 'idle' | 'starting' | 'running' | 'stopping' | 'error';
  currentHashrate: number;        // H/s
  acceptedShares: number;
  rejectedShares: number;
  sessionDuration: number;        // seconds
  sessionStartTime: Date | null;
  lastUpdated: Date;
  errorMessage: string | null;
}
```

**Updates**:
- Polled from XMRig HTTP API every 5 seconds (FR-006)
- `sessionDuration` computed as `now - sessionStartTime`
- State cleared on app restart (sessions not persisted locally)

---

## API Response Types

### Proxy API `/1/summary` Response

```typescript
interface ProxySummary {
  uptime: number;                 // Proxy uptime in seconds
  total_workers: number;          // Current active workers
  hashrate: {
    total: number;                // Combined hashrate (H/s)
  };
  results: {
    accepted: number;             // Total accepted shares (all workers)
    rejected: number;             // Total rejected shares (all workers)
  };
}
```

### Proxy API `/1/workers` Response

```typescript
interface ProxyWorker {
  worker: string;                 // Worker ID (email)
  hashrate: {
    total: [number, number, number]; // [10s, 1m, 15m] averages
  };
  accepted: number;               // Total accepted shares
  rejected: number;               // Total rejected shares
  last_share: number;             // Timestamp of last share
  online: boolean;                // Connection status
}

interface ProxyWorkersResponse {
  workers: ProxyWorker[];
}
```

### XMRig HTTP API `/2/summary` Response

```typescript
interface XMRigSummary {
  hashrate: {
    total: [number, number, number]; // [10s, 1m, 15m] averages
  };
  results: {
    accepted: number;             // Accepted shares
    rejected: number;             // Rejected shares
    avg_time: number;             // Average share time
  };
  connection: {
    uptime: number;               // Connection uptime (seconds)
    pool: string;                 // Pool address
  };
}
```

---

## Data Flow Diagrams

### Snapshot & Point Calculation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Vercel Cron (Every 10 minutes)                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Fetch active workers from Proxy API                      │
│    GET http://brtnetwork.duckdns.org:8080/1/workers         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. For each worker:                                          │
│    - Insert snapshot into workers_snapshot table             │
│    - Calculate points (delta from last snapshot)             │
│    - Insert entry into points_ledger table                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Database Transactions:                                    │
│    BEGIN;                                                    │
│    INSERT INTO workers_snapshot (...);                       │
│    INSERT INTO points_ledger (...);                          │
│    COMMIT;                                                   │
└─────────────────────────────────────────────────────────────┘
```

### Desktop Real-Time Updates Flow

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────┐
│ React UI        │      │ Main Process     │      │ XMRig API    │
│ (Renderer)      │      │ (Node.js)        │      │ (127.0.0.1)  │
└────────┬────────┘      └─────────┬────────┘      └──────┬───────┘
         │                         │                       │
         │ IPC: getStats()         │                       │
         ├────────────────────────>│                       │
         │                         │ GET /2/summary        │
         │                         ├──────────────────────>│
         │                         │                       │
         │                         │ JSON response         │
         │                         │<──────────────────────┤
         │ Stats data              │                       │
         │<────────────────────────┤                       │
         │                         │                       │
         │ Update UI (every 5s)    │                       │
         │                         │                       │
```

---

## Query Patterns

### Dashboard: Get Active Workers

```sql
SELECT
  ws.worker,
  ws.hashrate_1m,
  ws.accepted,
  ws.rejected,
  COALESCE(SUM(pl.points), 0) as total_points
FROM workers_snapshot ws
INNER JOIN (
  SELECT worker, MAX(ts) as latest_ts
  FROM workers_snapshot
  WHERE ts > NOW() - INTERVAL '2 minutes'
  GROUP BY worker
) latest ON ws.worker = latest.worker AND ws.ts = latest.latest_ts
LEFT JOIN points_ledger pl ON ws.worker = pl.worker
GROUP BY ws.worker, ws.hashrate_1m, ws.accepted, ws.rejected
ORDER BY ws.hashrate_1m DESC;
```

### Dashboard: Get Worker Point History

```sql
SELECT
  ts,
  points,
  cumulative_points
FROM points_ledger
WHERE worker = $1
ORDER BY ts DESC
LIMIT 100;
```

### Cron: Get Last Snapshot for Worker

```sql
SELECT accepted
FROM workers_snapshot
WHERE worker = $1
ORDER BY ts DESC
LIMIT 1;
```

---

## Validation Summary

### Data Integrity

| Entity | Validation Rules | Enforcement |
|--------|------------------|-------------|
| Worker | Email format, non-negative metrics | Application layer (FR-002) |
| MiningSession | end_time > start_time | Database CHECK constraint |
| ContributionSnapshot | Non-negative values, 10min intervals | Database constraints + cron logic |
| PointsLedgerEntry | Positive points, immutable records | Database constraint + insert-only pattern |

### Business Rules

- Worker timeout: 1 minute of inactivity (FR-026)
- Share rejection rate: < 5% for healthy mining (SC-008)
- Point calculation: Delta of accepted shares between snapshots (FR-021)
- Snapshot frequency: Every 10 minutes (±30s tolerance) (FR-020)

---

## Future Enhancements

### Planned Additions (Out of MVP Scope)

1. **User Authentication**
   - Add `users` table with auth credentials
   - Link workers to user accounts (1:N relationship)
   - Add `user_id` FK to all entities

2. **Reward Payouts**
   - Add `payouts` table for XMR distributions
   - Link to `points_ledger` for conversion tracking
   - Add `payment_status` enum (pending, completed, failed)

3. **GPU Mining Support**
   - Extend `MiningSession` with `device_type` (CPU/GPU)
   - Add `gpu_info` JSON field for device specs

4. **Advanced Analytics**
   - Add `daily_aggregates` table for performance charts
   - Add `worker_rankings` materialized view for leaderboards

5. **Manual Point Adjustments**
   - Extend `reason` enum (bonus, adjustment, penalty)
   - Add `adjusted_by` field for admin tracking
