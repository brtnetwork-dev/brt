/**
 * POST /api/cron/snapshot
 * Cron job that runs every 10 minutes to:
 * 1. Fetch worker data from proxy server
 * 2. Store snapshot in database
 * 3. Calculate and award points based on share deltas
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'edge';
export const maxDuration = 60; // Allow up to 60 seconds for cron job

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proxyUrl = process.env.PROXY_API_URL || 'http://brtnetwork.duckdns.org:8080';
    const proxyToken = process.env.PROXY_API_TOKEN || '5e4a327d3e2a';

    // Fetch workers from proxy server
    const response = await fetch(`${proxyUrl}/1/workers`, {
      headers: {
        'Authorization': `Bearer ${proxyToken}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Proxy server returned ${response.status}`);
    }

    const proxyData = await response.json();
    const workers = proxyData.workers || {};

    let snapshotsCreated = 0;
    let pointsAwarded = 0;

    // Process each worker
    for (const [workerId, data] of Object.entries<any>(workers)) {
      // Insert snapshot
      const currentAccepted = data.accepted || 0;
      const currentRejected = data.rejected || 0;
      const hashrate1m = data.hashrate?.total?.[1] || 0;
      const hashrate10m = data.hashrate?.total?.[2] || 0;

      await sql`
        INSERT INTO workers_snapshot (
          worker, hashrate_1m, hashrate_10m, accepted, rejected, total_hashes, ts
        ) VALUES (
          ${workerId},
          ${hashrate1m},
          ${hashrate10m},
          ${currentAccepted},
          ${currentRejected},
          ${currentAccepted + currentRejected},
          NOW()
        )
      `;

      snapshotsCreated++;

      // Calculate points based on accepted shares delta
      const previousSnapshot = await sql`
        SELECT accepted
        FROM workers_snapshot
        WHERE worker = ${workerId}
        ORDER BY ts DESC
        LIMIT 1 OFFSET 1
      `;

      if (previousSnapshot.rows.length > 0) {
        const previousAccepted = parseInt(previousSnapshot.rows[0].accepted);
        const delta = currentAccepted - previousAccepted;

        if (delta > 0) {
          // Award points (1 point per accepted share)
          await sql`
            INSERT INTO points_ledger (worker, points, reason, ts)
            VALUES (
              ${workerId},
              ${delta},
              'Accepted shares',
              NOW()
            )
          `;

          pointsAwarded += delta;
        }
      }
    }

    return NextResponse.json({
      success: true,
      snapshotsCreated,
      pointsAwarded,
      workersProcessed: Object.keys(workers).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cron snapshot job:', error);

    return NextResponse.json(
      {
        error: 'Snapshot job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
