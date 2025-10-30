/**
 * GET /api/workers/[workerId]
 * Returns detailed statistics for a specific worker
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { GetWorkerDetailResponse } from '@/shared/types/api';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { workerId: string } }
) {
  try {
    const workerId = params.workerId;

    // Get latest snapshot
    const latestResult = await sql`
      SELECT
        worker,
        ts,
        hashrate_1m,
        hashrate_10m,
        accepted,
        rejected
      FROM workers_snapshot
      WHERE worker = ${workerId}
      ORDER BY ts DESC
      LIMIT 1
    `;

    if (latestResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Worker not found',
        },
        { status: 404 }
      );
    }

    const latest = latestResult.rows[0];
    const lastSeenAt = new Date(latest.ts);
    const status = getWorkerStatus(lastSeenAt);

    // Get total accepted/rejected shares
    const totalsResult = await sql`
      SELECT
        MAX(accepted) as total_accepted,
        MAX(rejected) as total_rejected
      FROM workers_snapshot
      WHERE worker = ${workerId}
    `;

    const totals = totalsResult.rows[0];

    // Get total points
    const pointsResult = await sql`
      SELECT COALESCE(SUM(points), 0) as total_points
      FROM points_ledger
      WHERE worker = ${workerId}
    `;

    const totalPoints = parseInt(pointsResult.rows[0]?.total_points || '0');

    // Get recent snapshots (last 24 hours)
    const snapshotsResult = await sql`
      SELECT
        ts,
        hashrate_1m,
        hashrate_10m,
        accepted,
        rejected
      FROM workers_snapshot
      WHERE worker = ${workerId}
        AND ts > NOW() - INTERVAL '24 hours'
      ORDER BY ts DESC
      LIMIT 100
    `;

    const recentSnapshots = snapshotsResult.rows.map((row) => ({
      ts: new Date(row.ts).toISOString(),
      hashrate1m: parseFloat(row.hashrate_1m),
      hashrate10m: parseFloat(row.hashrate_10m),
      accepted: parseInt(row.accepted),
      rejected: parseInt(row.rejected),
    }));

    // Get recent points events
    const pointsEventsResult = await sql`
      SELECT
        ts,
        points,
        reason
      FROM points_ledger
      WHERE worker = ${workerId}
      ORDER BY ts DESC
      LIMIT 50
    `;

    const recentPoints = pointsEventsResult.rows.map((row) => ({
      ts: new Date(row.ts).toISOString(),
      points: parseInt(row.points),
      reason: row.reason,
    }));

    const response: GetWorkerDetailResponse = {
      worker: workerId,
      status,
      currentHashrate: parseFloat(latest.hashrate_1m),
      totalAccepted: parseInt(totals.total_accepted),
      totalRejected: parseInt(totals.total_rejected),
      totalPoints,
      lastSeenAt: lastSeenAt.toISOString(),
      recentSnapshots,
      recentPoints,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Error fetching worker details:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch worker details',
      },
      { status: 500 }
    );
  }
}
