/**
 * GET /api/leaderboard
 * Returns leaderboard of top contributors ranked by points
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { GetLeaderboardResponse } from '@/shared/types/api';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      WITH worker_stats AS (
        SELECT
          worker,
          COALESCE(SUM(points), 0) as total_points
        FROM points_ledger
        GROUP BY worker
      ),
      worker_hashes AS (
        SELECT
          worker,
          MAX(total_hashes) as total_hashes,
          AVG(hashrate_10m) as avg_hashrate
        FROM workers_snapshot
        GROUP BY worker
      ),
      worker_uptime AS (
        SELECT
          worker,
          COUNT(*) as snapshot_count,
          MAX(ts) as last_seen
        FROM workers_snapshot
        GROUP BY worker
      )
      SELECT
        ws.worker,
        ws.total_points,
        COALESCE(wh.total_hashes, 0) as total_hashes,
        COALESCE(wh.avg_hashrate, 0) as avg_hashrate,
        COALESCE(
          ROUND(
            (wu.snapshot_count::numeric / NULLIF(
              EXTRACT(EPOCH FROM (wu.last_seen - (
                SELECT MIN(ts) FROM workers_snapshot WHERE worker = ws.worker
              ))) / 300,
              0
            )) * 100,
            2
          ),
          0
        ) as uptime_percentage
      FROM worker_stats ws
      LEFT JOIN worker_hashes wh ON ws.worker = wh.worker
      LEFT JOIN worker_uptime wu ON ws.worker = wu.worker
      WHERE ws.total_points > 0
      ORDER BY ws.total_points DESC
      LIMIT 100
    `;

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      worker: row.worker,
      totalPoints: parseInt(row.total_points),
      totalHashes: parseInt(row.total_hashes),
      averageHashrate: parseFloat(row.avg_hashrate),
      uptimePercentage: parseFloat(row.uptime_percentage),
    }));

    const response: GetLeaderboardResponse = {
      leaderboard,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch leaderboard',
      },
      { status: 500 }
    );
  }
}
