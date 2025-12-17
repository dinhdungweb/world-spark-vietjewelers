/**
 * Integration tests for Spark API rate limiting
 * Requirements: 3.5 (security)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/sparks/route';
import { NextRequest } from 'next/server';
import { sparkRateLimiter } from '@/lib/rate-limiter';

// Mock the spark service
vi.mock('@/lib/spark-service', () => ({
  sparkService: {
    createSpark: vi.fn().mockResolvedValue({
      id: 'test-id',
      text: 'Test spark',
      latitude: 52.5,
      longitude: 13.4,
      category: 'Thought',
      locationDisplay: 'Near Berlin, Germany',
      status: 'pending',
      createdAt: new Date()
    })
  }
}));

describe('POST /api/sparks - Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limiter before each test
    sparkRateLimiter.clear();
  });

  it('should allow first request', async () => {
    const request = new NextRequest('http://localhost:3000/api/sparks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1'
      },
      body: JSON.stringify({
        text: 'Test spark',
        latitude: 52.5,
        longitude: 13.4,
        category: 'Thought'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('should allow up to 5 requests from same IP', async () => {
    for (let i = 0; i < 5; i++) {
      const request = new NextRequest('http://localhost:3000/api/sparks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          text: `Test spark ${i}`,
          latitude: 52.5,
          longitude: 13.4,
          category: 'Thought'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    }
  });

  it('should return 429 on 6th request from same IP', async () => {
    // Make 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const request = new NextRequest('http://localhost:3000/api/sparks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          text: `Test spark ${i}`,
          latitude: 52.5,
          longitude: 13.4,
          category: 'Thought'
        })
      });

      await POST(request);
    }

    // 6th request should be rate limited
    const request = new NextRequest('http://localhost:3000/api/sparks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1'
      },
      body: JSON.stringify({
        text: 'Test spark 6',
        latitude: 52.5,
        longitude: 13.4,
        category: 'Thought'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error).toContain('Rate limit exceeded');
  });

  it('should include rate limit headers in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/sparks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1'
      },
      body: JSON.stringify({
        text: 'Test spark',
        latitude: 52.5,
        longitude: 13.4,
        category: 'Thought'
      })
    });

    const response = await POST(request);
    
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('should include Retry-After header in 429 response', async () => {
    // Use up rate limit
    for (let i = 0; i < 5; i++) {
      const request = new NextRequest('http://localhost:3000/api/sparks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          text: `Test spark ${i}`,
          latitude: 52.5,
          longitude: 13.4,
          category: 'Thought'
        })
      });

      await POST(request);
    }

    // Make rate limited request
    const request = new NextRequest('http://localhost:3000/api/sparks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1'
      },
      body: JSON.stringify({
        text: 'Test spark',
        latitude: 52.5,
        longitude: 13.4,
        category: 'Thought'
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('should track different IPs independently', async () => {
    // Use up limit for first IP
    for (let i = 0; i < 5; i++) {
      const request = new NextRequest('http://localhost:3000/api/sparks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          text: `Test spark ${i}`,
          latitude: 52.5,
          longitude: 13.4,
          category: 'Thought'
        })
      });

      await POST(request);
    }

    // Second IP should still be allowed
    const request = new NextRequest('http://localhost:3000/api/sparks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.2'
      },
      body: JSON.stringify({
        text: 'Test spark from different IP',
        latitude: 52.5,
        longitude: 13.4,
        category: 'Thought'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
