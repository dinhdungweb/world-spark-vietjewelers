/**
 * Unit tests for IP utilities
 */

import { describe, it, expect } from 'vitest';
import { getClientIp } from '@/lib/ip-utils';
import { NextRequest } from 'next/server';

describe('getClientIp', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1'
      }
    });

    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should extract first IP from x-forwarded-for with multiple IPs', () => {
    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1'
      }
    });

    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should extract IP from x-real-ip header', () => {
    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-real-ip': '192.168.1.2'
      }
    });

    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.2');
  });

  it('should extract IP from cf-connecting-ip header', () => {
    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'cf-connecting-ip': '192.168.1.3'
      }
    });

    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.3');
  });

  it('should prioritize x-forwarded-for over other headers', () => {
    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.2',
        'cf-connecting-ip': '192.168.1.3'
      }
    });

    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should return "unknown" when no IP headers present', () => {
    const request = new NextRequest('http://localhost:3000');

    const ip = getClientIp(request);
    expect(ip).toBe('unknown');
  });
});
