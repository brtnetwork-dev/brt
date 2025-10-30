/**
 * POST /api/contributions
 * Endpoint for desktop clients to submit mining contribution snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { checkRateLimit } from '@/lib/rate-limit';
import { calculateAndAwardPoints } from '@/lib/points-calculator';
import { PostContributionRequest, PostContributionResponse } from '@/shared/types/api';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
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
