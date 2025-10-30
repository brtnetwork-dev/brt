/**
 * Points calculation logic
 * Awards points based on delta of accepted shares
 */

import { sql } from '@vercel/postgres';

/**
 * Calculate and award points for a contribution
 * Points = delta of accepted shares since last snapshot
 */
export async function calculateAndAwardPoints(
  worker: string,
  currentAccepted: number
): Promise<{ pointsAwarded: number; reason: string } | null> {
  try {
    // Get the previous snapshot for this worker
    const previousSnapshot = await sql`
      SELECT accepted
      FROM workers_snapshot
      WHERE worker = ${worker}
      ORDER BY ts DESC
      LIMIT 1 OFFSET 1
    `;

    // If this is the first snapshot, no points yet
    if (previousSnapshot.rows.length === 0) {
      return null;
    }

    const previousAccepted = parseInt(previousSnapshot.rows[0].accepted);

    // Calculate delta
    const delta = currentAccepted - previousAccepted;

    // Only award points if there's a positive delta
    if (delta <= 0) {
      return null;
    }

    // Award points equal to the delta
    const pointsAwarded = delta;
    const reason = `Accepted ${delta} shares`;

    // Insert into points ledger
    await sql`
      INSERT INTO points_ledger (worker, points, reason, ts)
      VALUES (${worker}, ${pointsAwarded}, ${reason}, NOW())
    `;

    return { pointsAwarded, reason };
  } catch (error) {
    console.error('Error calculating points:', error);
    return null;
  }
}

/**
 * Get total points for a worker
 */
export async function getTotalPoints(worker: string): Promise<number> {
  try {
    const result = await sql`
      SELECT COALESCE(SUM(points), 0) as total_points
      FROM points_ledger
      WHERE worker = ${worker}
    `;

    return parseInt(result.rows[0]?.total_points || '0');
  } catch (error) {
    console.error('Error getting total points:', error);
    return 0;
  }
}

/**
 * Get points history for a worker
 */
export async function getPointsHistory(
  worker: string,
  limit: number = 50
): Promise<Array<{ ts: Date; points: number; reason: string }>> {
  try {
    const result = await sql`
      SELECT ts, points, reason
      FROM points_ledger
      WHERE worker = ${worker}
      ORDER BY ts DESC
      LIMIT ${limit}
    `;

    return result.rows.map((row) => ({
      ts: new Date(row.ts),
      points: parseInt(row.points),
      reason: row.reason,
    }));
  } catch (error) {
    console.error('Error getting points history:', error);
    return [];
  }
}
