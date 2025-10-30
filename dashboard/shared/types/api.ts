/**
 * Shared TypeScript types for API request/response structures
 */

/**
 * XMRig HTTP API response structure
 * Based on XMRig 6.x HTTP API: /2/summary endpoint
 */
export interface XMRigSummary {
  id: string;
  worker_id: string;
  uptime: number;
  restricted: boolean;
  resources: {
    memory: {
      free: number;
      total: number;
      resident_set_size: number;
    };
    load_average: [number, number, number];
  };
  features: string[];
  results: {
    diff_current: number;
    shares_good: number;
    shares_total: number;
    avg_time: number;
    avg_time_ms: number;
    hashes_total: number;
    best: [number, number, number, number, number, number, number, number, number, number];
    error_log: Array<{
      count: number;
      last_message: string;
      last_time: number;
    }>;
  };
  algo: string;
  connection: {
    diff: number;
    algo: string;
    pool: string;
    ip: string;
    uptime: number;
    uptime_ms: number;
    ping: number;
    failures: number;
    tls: string | null;
    tls_fingerprint: string | null;
    error_log: Array<unknown>;
  };
  version: string;
  kind: string;
  ua: string;
  cpu: {
    brand: string;
    family: number;
    model: number;
    stepping: number;
    proc_info: number;
    aes: boolean;
    avx2: boolean;
    x64: boolean;
    '64_bit': boolean;
    l2: number;
    l3: number;
    cores: number;
    threads: number;
    packages: number;
    nodes: number;
    backend: string;
    msr: string;
    assembly: string;
    arch: string;
    flags: string[];
  };
  donate_level: number;
  paused: boolean;
  algorithms: string[];
  hashrate: {
    total: [number | null, number | null, number | null];
    highest: number | null;
  };
  hugepages: boolean;
}

/**
 * Proxy summary response for desktop app
 * Aggregated view of worker statistics
 */
export interface ProxySummary {
  workers: ProxyWorker[];
  totalHashrate: number;
  totalAccepted: number;
  totalRejected: number;
  activeWorkers: number;
  timestamp: string;
}

/**
 * Individual worker data in proxy summary
 */
export interface ProxyWorker {
  id: string;
  name: string;
  hashrate: number;
  hashrate1m: number;
  hashrate10m: number;
  accepted: number;
  rejected: number;
  uptime: number;
  lastSeen: string;
  status: 'active' | 'inactive' | 'offline';
}

/**
 * Dashboard API: POST /api/contributions request body
 */
export interface PostContributionRequest {
  worker: string;
  hashrate1m: number;
  hashrate10m: number;
  accepted: number;
  rejected: number;
  totalHashes: number;
}

/**
 * Dashboard API: POST /api/contributions response
 */
export interface PostContributionResponse {
  success: boolean;
  snapshotId: number;
  pointsAwarded?: number;
  message?: string;
}

/**
 * Dashboard API: GET /api/workers response
 */
export interface GetWorkersResponse {
  workers: Array<{
    worker: string;
    status: 'active' | 'inactive' | 'offline';
    hashrate1m: number;
    hashrate10m: number;
    totalAccepted: number;
    totalRejected: number;
    totalPoints: number;
    lastSeenAt: string;
  }>;
  timestamp: string;
}

/**
 * Dashboard API: GET /api/workers/[workerId] response
 */
export interface GetWorkerDetailResponse {
  worker: string;
  status: 'active' | 'inactive' | 'offline';
  currentHashrate: number;
  totalAccepted: number;
  totalRejected: number;
  totalPoints: number;
  lastSeenAt: string;
  recentSnapshots: Array<{
    ts: string;
    hashrate1m: number;
    hashrate10m: number;
    accepted: number;
    rejected: number;
  }>;
  recentPoints: Array<{
    ts: string;
    points: number;
    reason: string;
  }>;
}

/**
 * Dashboard API: GET /api/leaderboard response
 */
export interface GetLeaderboardResponse {
  leaderboard: Array<{
    rank: number;
    worker: string;
    totalPoints: number;
    totalHashes: number;
    averageHashrate: number;
    uptimePercentage: number;
  }>;
  timestamp: string;
}

/**
 * Error response for API endpoints
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
