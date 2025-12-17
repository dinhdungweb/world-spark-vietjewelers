/**
 * Rate Limiter Service
 * Implements IP-based rate limiting for spark submissions
 * Requirements: 3.5 (security)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number; // Unix timestamp in milliseconds
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 60 * 60 * 1000) {
    this.store = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs; // Default: 1 hour
  }

  /**
   * Check if a request from the given IP should be allowed
   * @param ip - IP address of the requester
   * @returns true if request is allowed, false if rate limit exceeded
   */
  check(ip: string): boolean {
    const now = Date.now();
    const entry = this.store.get(ip);

    // No entry exists, create new one
    if (!entry) {
      this.store.set(ip, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    // Time window has expired, reset the counter
    if (now >= entry.resetTime) {
      this.store.set(ip, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    // Within time window, check if limit exceeded
    if (entry.count >= this.maxRequests) {
      return false;
    }

    // Increment counter
    entry.count++;
    this.store.set(ip, entry);
    return true;
  }

  /**
   * Get remaining requests for an IP
   * @param ip - IP address of the requester
   * @returns number of remaining requests
   */
  getRemaining(ip: string): number {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now >= entry.resetTime) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get time until reset for an IP (in seconds)
   * @param ip - IP address of the requester
   * @returns seconds until reset, or 0 if no limit active
   */
  getResetTime(ip: string): number {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now >= entry.resetTime) {
      return 0;
    }

    return Math.ceil((entry.resetTime - now) / 1000);
  }

  /**
   * Clean up expired entries to prevent memory leaks
   * Should be called periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(ip);
      }
    }
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  clear(): void {
    this.store.clear();
  }
}

// Singleton instance for spark submission rate limiting
export const sparkRateLimiter = new RateLimiter(5, 60 * 60 * 1000); // 5 requests per hour

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    sparkRateLimiter.cleanup();
  }, 10 * 60 * 1000);
}
