/**
 * GET /api/proxy/summary
 * Fetches network-wide summary statistics from proxy server
 */

import { NextRequest, NextResponse} from 'next/server';

export const runtime = 'edge';
export const revalidate = 0; // Disable caching for real-time data

export async function GET(_request: NextRequest) {
  try {
    const proxyUrl = process.env.PROXY_API_URL || 'http://brtnetwork.duckdns.org:8080';
    const proxyToken = process.env.PROXY_API_TOKEN || '5e4a327d3e2a';

    // Fetch summary from proxy server
    const response = await fetch(`${proxyUrl}/1/summary`, {
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
    const summary = {
      totalHashrate: proxyData.hashrate?.total?.[2] || 0, // 10-minute average
      activeWorkers: proxyData.workers?.active || 0,
      totalWorkers: proxyData.workers?.total || 0,
      totalShares: proxyData.results?.shares_total || 0,
      acceptedShares: proxyData.results?.shares_good || 0,
      rejectedShares: (proxyData.results?.shares_total || 0) - (proxyData.results?.shares_good || 0),
      uptime: proxyData.uptime || 0,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching summary from proxy:', error);

    // Return graceful error response
    return NextResponse.json(
      {
        error: 'Proxy server unavailable',
        message: error instanceof Error ? error.message : 'Failed to fetch summary from proxy server',
        totalHashrate: 0,
        activeWorkers: 0,
        totalWorkers: 0,
        totalShares: 0,
        acceptedShares: 0,
        rejectedShares: 0,
        uptime: 0,
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
