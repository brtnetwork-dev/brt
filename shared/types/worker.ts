/**
 * Shared TypeScript types for worker data structures
 */

/**
 * Worker identification and metadata
 */
export interface Worker {
  id: string; // Worker identifier (e.g., "desktop-001")
  name: string; // Display name
  lastSeen: Date;
  status: 'active' | 'inactive' | 'offline';
}

/**
 * Mining session information for a worker
 */
export interface MiningSession {
  workerId: string;
  startTime: Date;
  endTime?: Date;
  totalHashes: number;
  acceptedShares: number;
  rejectedShares: number;
  averageHashrate: number;
  peakHashrate: number;
  isActive: boolean;
}

/**
 * Periodic snapshot of worker mining statistics
 * Corresponds to workers_snapshot table in database
 */
export interface ContributionSnapshot {
  id: number;
  ts: Date;
  worker: string;
  hashrate1m: number;
  hashrate10m: number;
  accepted: number;
  rejected: number;
  totalHashes: number;
  createdAt: Date;
}

/**
 * Points ledger entry for tracking contribution rewards
 * Corresponds to points_ledger table in database
 */
export interface PointsLedgerEntry {
  id: number;
  ts: Date;
  worker: string;
  points: number;
  reason: string;
  createdAt: Date;
}

/**
 * Aggregated worker statistics with current state
 */
export interface WorkerStats {
  worker: string;
  status: 'active' | 'inactive' | 'offline';
  currentHashrate: number;
  hashrate1m: number;
  hashrate10m: number;
  totalAccepted: number;
  totalRejected: number;
  totalPoints: number;
  lastSeenAt: Date;
  uptimePercentage: number;
}

/**
 * Worker contribution summary for dashboard display
 */
export interface WorkerContribution {
  workerId: string;
  workerName: string;
  hashrate: number;
  acceptedShares: number;
  rejectedShares: number;
  points: number;
  status: 'active' | 'inactive' | 'offline';
  lastActive: Date;
}
