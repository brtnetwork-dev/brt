/**
 * GET /api/proxy/workers
 * Fetches real-time worker data from proxy server
 */

import { NextRequest, NextResponse } from 'next/server';
import { GetWorkersResponse } from '@/shared/types/api';

export const runtime = 'edge';
export const revalidate = 0; // Disable caching for real-time data

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
    // xmrig-proxy returns workers as array: [worker_id, ip, ?, accepted, rejected, ?, hashes, timestamp, hashrates...]
    const workers = (proxyData.workers || []).map((workerData: Array<string | number>) => {
      const workerId = workerData[0] as string;
      const accepted = workerData[3] as number;
      const rejected = workerData[4] as number;
      const lastShareTimestamp = workerData[7] as number;
      const hashrate1m = workerData[9] as number;
      const hashrate10m = workerData[10] as number;

      const lastSeenAt = lastShareTimestamp ? new Date(lastShareTimestamp) : new Date();
      const status = getWorkerStatus(lastSeenAt);

      return {
        worker: workerId || 'unknown',
        status,
        hashrate1m: hashrate1m || 0,
        hashrate10m: hashrate10m || 0,
        totalAccepted: accepted || 0,
        totalRejected: rejected || 0,
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
