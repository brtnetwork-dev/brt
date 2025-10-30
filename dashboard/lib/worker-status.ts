/**
 * Worker status determination logic
 * Based on last seen timestamp and configured timeout
 */

export type WorkerStatus = 'active' | 'inactive' | 'offline';

// Worker timeout configuration (in milliseconds)
const ACTIVE_THRESHOLD = 60 * 1000; // 1 minute - worker is active
const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes - worker is offline

/**
 * Determine worker status based on last seen timestamp
 * @param lastSeenAt Last time worker sent data
 * @returns Worker status: active, inactive, or offline
 */
export function getWorkerStatus(lastSeenAt: Date): WorkerStatus {
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

/**
 * Check if worker is considered active
 * @param lastSeenAt Last time worker sent data
 */
export function isWorkerActive(lastSeenAt: Date): boolean {
  return getWorkerStatus(lastSeenAt) === 'active';
}

/**
 * Check if worker is considered offline
 * @param lastSeenAt Last time worker sent data
 */
export function isWorkerOffline(lastSeenAt: Date): boolean {
  return getWorkerStatus(lastSeenAt) === 'offline';
}

/**
 * Get time until worker becomes inactive
 * @param lastSeenAt Last time worker sent data
 * @returns Milliseconds until inactive, or 0 if already inactive
 */
export function getTimeUntilInactive(lastSeenAt: Date): number {
  const now = new Date();
  const timeSinceLastSeen = now.getTime() - lastSeenAt.getTime();
  const remaining = ACTIVE_THRESHOLD - timeSinceLastSeen;

  return Math.max(0, remaining);
}

/**
 * Get time until worker becomes offline
 * @param lastSeenAt Last time worker sent data
 * @returns Milliseconds until offline, or 0 if already offline
 */
export function getTimeUntilOffline(lastSeenAt: Date): number {
  const now = new Date();
  const timeSinceLastSeen = now.getTime() - lastSeenAt.getTime();
  const remaining = OFFLINE_THRESHOLD - timeSinceLastSeen;

  return Math.max(0, remaining);
}
