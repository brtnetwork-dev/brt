/**
 * Token bucket rate limiter
 * Limits requests to 30 per minute per IP address
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const buckets = new Map<string, TokenBucket>();

const MAX_TOKENS = 30; // Maximum requests per minute
const REFILL_RATE = 30 / 60; // Tokens per second (30 per 60 seconds)
const REFILL_INTERVAL = 1000; // Check every second

/**
 * Check if a request should be rate limited
 * @param identifier Unique identifier (e.g., IP address)
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(identifier);

  // Initialize bucket if it doesn't exist
  if (!bucket) {
    bucket = {
      tokens: MAX_TOKENS - 1,
      lastRefill: now,
    };
    buckets.set(identifier, bucket);
    return true;
  }

  // Calculate tokens to add based on time elapsed
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = (timePassed / 1000) * REFILL_RATE;

  // Refill tokens
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  // Check if request is allowed
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

/**
 * Get remaining tokens for an identifier
 * @param identifier Unique identifier (e.g., IP address)
 */
export function getRemainingTokens(identifier: string): number {
  const bucket = buckets.get(identifier);
  if (!bucket) {
    return MAX_TOKENS;
  }

  const now = Date.now();
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = (timePassed / 1000) * REFILL_RATE;

  return Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
}

/**
 * Clean up old buckets to prevent memory leaks
 * Run periodically to remove inactive identifiers
 */
export function cleanupBuckets(): void {
  const now = Date.now();
  const MAX_IDLE_TIME = 5 * 60 * 1000; // 5 minutes

  for (const [identifier, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > MAX_IDLE_TIME) {
      buckets.delete(identifier);
    }
  }
}

// Cleanup old buckets every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupBuckets, 5 * 60 * 1000);
}
