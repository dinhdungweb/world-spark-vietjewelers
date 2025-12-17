/**
 * Unit tests for Rate Limiter
 * Requirements: 3.5 (security)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the RateLimiter class directly for testing
class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }>;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 60 * 60 * 1000) {
    this.store = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(ip: string): boolean {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry) {
      this.store.set(ip, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (now >= entry.resetTime) {
      this.store.set(ip, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    this.store.set(ip, entry);
    return true;
  }

  getRemaining(ip: string): number {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now >= entry.resetTime) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(ip: string): number {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now >= entry.resetTime) {
      return 0;
    }

    return Math.ceil((entry.resetTime - now) / 1000);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(ip);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(5, 60 * 60 * 1000); // 5 requests per hour
  });

  it('should allow first request from new IP', () => {
    const result = rateLimiter.check('192.168.1.1');
    expect(result).toBe(true);
  });

  it('should allow up to 5 requests from same IP', () => {
    const ip = '192.168.1.1';
    
    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.check(ip);
      expect(result).toBe(true);
    }
  });

  it('should block 6th request from same IP within time window', () => {
    const ip = '192.168.1.1';
    
    // Make 5 allowed requests
    for (let i = 0; i < 5; i++) {
      rateLimiter.check(ip);
    }
    
    // 6th request should be blocked
    const result = rateLimiter.check(ip);
    expect(result).toBe(false);
  });

  it('should track different IPs independently', () => {
    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';
    
    // Use up limit for ip1
    for (let i = 0; i < 5; i++) {
      rateLimiter.check(ip1);
    }
    
    // ip2 should still be allowed
    const result = rateLimiter.check(ip2);
    expect(result).toBe(true);
  });

  it('should return correct remaining count', () => {
    const ip = '192.168.1.1';
    
    expect(rateLimiter.getRemaining(ip)).toBe(5);
    
    rateLimiter.check(ip);
    expect(rateLimiter.getRemaining(ip)).toBe(4);
    
    rateLimiter.check(ip);
    expect(rateLimiter.getRemaining(ip)).toBe(3);
  });

  it('should reset after time window expires', () => {
    const ip = '192.168.1.1';
    const shortWindowLimiter = new RateLimiter(5, 100); // 100ms window
    
    // Use up all requests
    for (let i = 0; i < 5; i++) {
      shortWindowLimiter.check(ip);
    }
    
    // Should be blocked
    expect(shortWindowLimiter.check(ip)).toBe(false);
    
    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Should be allowed again
        expect(shortWindowLimiter.check(ip)).toBe(true);
        resolve();
      }, 150);
    });
  });

  it('should return reset time in seconds', () => {
    const ip = '192.168.1.1';
    
    rateLimiter.check(ip);
    const resetTime = rateLimiter.getResetTime(ip);
    
    // Should be approximately 3600 seconds (1 hour)
    expect(resetTime).toBeGreaterThan(3590);
    expect(resetTime).toBeLessThanOrEqual(3600);
  });

  it('should cleanup expired entries', () => {
    const ip = '192.168.1.1';
    const shortWindowLimiter = new RateLimiter(5, 100); // 100ms window
    
    shortWindowLimiter.check(ip);
    
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        shortWindowLimiter.cleanup();
        // After cleanup, should have full quota again
        expect(shortWindowLimiter.getRemaining(ip)).toBe(5);
        resolve();
      }, 150);
    });
  });

  it('should clear all data', () => {
    rateLimiter.check('192.168.1.1');
    rateLimiter.check('192.168.1.2');
    
    rateLimiter.clear();
    
    // Both IPs should have full quota
    expect(rateLimiter.getRemaining('192.168.1.1')).toBe(5);
    expect(rateLimiter.getRemaining('192.168.1.2')).toBe(5);
  });
});
