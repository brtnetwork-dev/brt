/**
 * POST /api/contributions
 *
 * ⚠️  DEPRECATED ⚠️
 * This endpoint is deprecated and will be removed in a future version.
 *
 * Desktop workers should connect directly to the proxy server (port 3333) via XMRig.
 * The dashboard now fetches data from the proxy server API (port 8080).
 *
 * This endpoint is kept for backward compatibility only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { PostContributionRequest, PostContributionResponse } from '@/shared/types/api';

export const runtime = 'edge';

// Rate limiting - inlined for edge runtime compatibility
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}
const buckets = new Map<string, TokenBucket>();
const MAX_TOKENS = 30;
const REFILL_RATE = 30 / 60;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(identifier);

  if (!bucket) {
    bucket = {
      tokens: MAX_TOKENS - 1,
      lastRefill: now,
    };
    buckets.set(identifier, bucket);
    return true;
  }

  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = (timePassed / 1000) * REFILL_RATE;

  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

// Points calculation - inlined for edge runtime compatibility
async function calculateAndAwardPoints(
  worker: string,
  currentAccepted: number
): Promise<{ pointsAwarded: number; reason: string } | null> {
  try {
    const previousSnapshot = await sql`
      SELECT accepted
      FROM workers_snapshot
      WHERE worker = ${worker}
      ORDER BY ts DESC
      LIMIT 1 OFFSET 1
    `;

    if (previousSnapshot.rows.length === 0) {
      return null;
    }

    const previousAccepted = parseInt(previousSnapshot.rows[0].accepted);
    const delta = currentAccepted - previousAccepted;

    if (delta <= 0) {
      return null;
    }

    const pointsAwarded = delta;
    const reason = `Accepted ${delta} shares`;

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

export async function POST(request: NextRequest) {
  // Log deprecation warning
  console.warn('[DEPRECATED] POST /api/contributions was called. This endpoint is deprecated.');
  console.warn('Desktop workers should connect to proxy server directly, not the dashboard.');
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: PostContributionRequest = await request.json();

    // Validate required fields
    if (!body.worker || typeof body.worker !== 'string') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Worker ID is required' },
        { status: 400 }
      );
    }

    if (body.hashrate1m === undefined || body.hashrate10m === undefined) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Hashrate data is required' },
        { status: 400 }
      );
    }

    // Insert snapshot into database
    const result = await sql`
      INSERT INTO workers_snapshot (
        worker,
        hashrate_1m,
        hashrate_10m,
        accepted,
        rejected,
        total_hashes,
        ts
      ) VALUES (
        ${body.worker},
        ${body.hashrate1m},
        ${body.hashrate10m},
        ${body.accepted || 0},
        ${body.rejected || 0},
        ${body.totalHashes || 0},
        NOW()
      )
      RETURNING id
    `;

    const snapshotId = result.rows[0]?.id;

    // Calculate and award points based on accepted shares delta
    const pointsResult = await calculateAndAwardPoints(body.worker, body.accepted || 0);

    const response: PostContributionResponse = {
      success: true,
      snapshotId,
      pointsAwarded: pointsResult?.pointsAwarded,
      message: pointsResult
        ? `Contribution recorded. Earned ${pointsResult.pointsAwarded} points!`
        : 'Contribution recorded successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error recording contribution:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to record contribution',
      },
      { status: 500 }
    );
  }
}
