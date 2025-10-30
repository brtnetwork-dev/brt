/**
 * GET /api/workers
 * Returns list of all workers with their current status and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { GetWorkersResponse } from '@/shared/types/api';

export const runtime = 'edge';

// Worker status determination - inlined for edge runtime compatibility
type WorkerStatus = 'active' | 'inactive' | 'offline';
const ACTIVE_THRESHOLD = 60 * 1000; // 1 minute
const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

function getWorkerStatus(lastSeenAt: Date): WorkerStatus {
  const now = new Date();
  const timeSinceLastSeen = now.getTime() - lastSeenAt.getTime();

  if (timeSinceLastSeen < ACTIVE_THRESHOLD) {
    return 'active';
  } else if (timeSinceLastSeen < OFFLINE_THRESHOLD) {
    return 'inactive';
  } else {
    return 'offline';
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get latest snapshot for each worker
    const result = await sql`
      WITH latest_snapshots AS (
        SELECT DISTINCT ON (worker)
          worker,
          ts,
          hashrate_1m,
          hashrate_10m,
          accepted,
          rejected
        FROM workers_snapshot
        ORDER BY worker, ts DESC
      ),
      worker_totals AS (
        SELECT
          worker,
          MAX(accepted) as total_accepted,
          MAX(rejected) as total_rejected
        FROM workers_snapshot
        GROUP BY worker
      ),
      worker_points AS (
        SELECT
          worker,
          COALESCE(SUM(points), 0) as total_points
        FROM points_ledger
        GROUP BY worker
      )
      SELECT
        ls.worker,
        ls.ts as last_seen_at,
        ls.hashrate_1m,
        ls.hashrate_10m,
        wt.total_accepted,
        wt.total_rejected,
        COALESCE(wp.total_points, 0) as total_points
      FROM latest_snapshots ls
      LEFT JOIN worker_totals wt ON ls.worker = wt.worker
      LEFT JOIN worker_points wp ON ls.worker = wp.worker
      ORDER BY ls.ts DESC
    `;

    const workers = result.rows.map((row) => {
      const lastSeenAt = new Date(row.last_seen_at);
      const status = getWorkerStatus(lastSeenAt);

      return {
        worker: row.worker,
        status,
        hashrate1m: parseFloat(row.hashrate_1m),
        hashrate10m: parseFloat(row.hashrate_10m),
        totalAccepted: parseInt(row.total_accepted),
        totalRejected: parseInt(row.total_rejected),
        totalPoints: parseInt(row.total_points),
        lastSeenAt: lastSeenAt.toISOString(),
      };
    });

    const response: GetWorkersResponse = {
      workers,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch workers',
      },
      { status: 500 }
    );
  }
}
