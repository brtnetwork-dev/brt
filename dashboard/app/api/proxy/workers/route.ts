/**
 * GET /api/proxy/workers
 * Fetches real-time worker data from proxy server
 */

import { NextRequest, NextResponse } from 'next/server';
import { GetWorkersResponse } from '@/shared/types/api';
import { getWorkerStatus } from '@/lib/worker-status';

export const runtime = 'edge';
export const revalidate = 0; // Disable caching for real-time data

export async function GET(_request: NextRequest) {
  try {
    const proxyUrl = process.env.PROXY_API_URL || 'http://brtnetwork.duckdns.org:8080';
    const proxyToken = process.env.PROXY_API_TOKEN || '5e4a327d3e2a';

    // Fetch workers from proxy server
    const response = await fetch(`${proxyUrl}/1/workers`, {
      headers: {
        'Authorization': `Bearer ${proxyToken}`,
        'Accept': 'application/json',
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Proxy server returned ${response.status}: ${response.statusText}`);
    }

    const proxyData = await response.json();

    // Transform proxy data to dashboard format
    const workers = Object.entries(proxyData.workers || {}).map(([workerId, data]: [string, any]) => {
      const lastSeenAt = data.last_share ? new Date(data.last_share * 1000) : new Date();
      const status = getWorkerStatus(lastSeenAt);

      return {
        worker: workerId,
        status,
        hashrate1m: data.hashrate?.total?.[1] || 0,
        hashrate10m: data.hashrate?.total?.[2] || 0,
        totalAccepted: data.accepted || 0,
        totalRejected: data.rejected || 0,
        totalPoints: 0, // Points come from dashboard database, not proxy
        lastSeenAt: lastSeenAt.toISOString(),
      };
    });

    const responseData: GetWorkersResponse = {
      workers,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching workers from proxy:', error);

    // Return graceful error response
    return NextResponse.json(
      {
        error: 'Proxy server unavailable',
        message: error instanceof Error ? error.message : 'Failed to fetch workers from proxy server',
        workers: [],
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
