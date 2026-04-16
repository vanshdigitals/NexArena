/**
 * lib/rate-limit.ts
 *
 * Simple in-memory rate limiter for NexArena API routes.
 * Uses a sliding-window counter pattern with automatic cleanup.
 *
 * ✅ Zero external dependencies
 * ✅ Configurable window size and max requests
 * ✅ Automatic stale-entry cleanup to prevent memory leaks
 * ✅ IP-based tracking suitable for serverless/edge deployments
 *
 * Note: In production with multiple instances, replace with Redis
 * or Upstash rate limiting for distributed state.
 */

/** Configuration for a rate limiter instance */
export interface RateLimitConfig {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  windowMs: number;
  /** Maximum requests allowed per window (default: 30) */
  maxRequests: number;
}

/** Result of a rate limit check */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
}

/** Internal token bucket entry */
interface TokenBucket {
  count: number;
  windowStart: number;
}

/**
 * Create a rate limiter with the given configuration.
 *
 * @param config - Rate limit configuration (window size and max requests)
 * @returns Object with `check` and `reset` methods
 *
 * @example
 * ```ts
 * const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });
 * const result = limiter.check('192.168.1.1');
 * if (!result.allowed) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 * ```
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const { windowMs = 60_000, maxRequests = 30 } = config;
  const store = new Map<string, TokenBucket>();

  // Periodic cleanup of expired entries (every 5 minutes)
  let lastCleanup = Date.now();
  const CLEANUP_INTERVAL = 5 * 60_000;

  /** Remove expired entries from the store */
  function cleanup(): void {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, bucket] of store.entries()) {
      if (now - bucket.windowStart > windowMs) {
        store.delete(key);
      }
    }
  }

  /**
   * Check whether a request from the given identifier is allowed.
   *
   * @param identifier - Client identifier (typically IP address)
   * @returns Rate limit result with allowed status and metadata
   */
  function check(identifier: string): RateLimitResult {
    cleanup();

    const now = Date.now();
    const bucket = store.get(identifier);

    if (!bucket || now - bucket.windowStart > windowMs) {
      // New window
      store.set(identifier, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs,
      };
    }

    bucket.count += 1;

    if (bucket.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: bucket.windowStart + windowMs,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - bucket.count,
      resetAt: bucket.windowStart + windowMs,
    };
  }

  /**
   * Reset the rate limiter store. Primarily useful for testing.
   */
  function reset(): void {
    store.clear();
  }

  return { check, reset };
}

/** Default rate limiter for API routes: 30 requests per minute */
export const apiRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });
