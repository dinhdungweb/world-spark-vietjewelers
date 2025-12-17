/**
 * Unit tests for /api/sparks endpoints
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../app/api/sparks/route';
import { prisma } from '../../lib/prisma';
import { SparkStatus } from '../../lib/spark-service';
import * as locationServiceModule from '../../lib/location-service';
import { sparkRateLimiter } from '../../lib/rate-limiter';
import { NextRequest } from 'next/server';

describe('Spark API Unit Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.spark.deleteMany({});
    sparkRateLimiter.clear();
    
    vi.spyOn(locationServiceModule.locationService, 'approximateLocation').mockImplementation(
      async (lat: number, lng: number) => {
        const approximateLat = Math.round(lat * 10) / 10;
        const approximateLng = Math.round(lng * 10) / 10;
        return {
          latitude: approximateLat,
          longitude: approximateLng,
          displayName: `Near Test City, Test Country`
        };
      }
    );
  });

  test('POST /api/sparks accepts valid submission without authentication', async () => {
    const submission = {
      text: 'This is a test spark',
      latitude: 52.5,
      longitude: 13.4,
      category: 'Thought'
    };

    const request = new NextRequest('http://localhost:3000/api/sparks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.100',
      },
      body: JSON.stringify(submission)
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.spark).toBeDefined();
    expect(data.spark.status).toBe(SparkStatus.PENDING);
  });

  test('POST /api/sparks accepts single character text', async () => {
    const submission = {
      text: '!',
      latitude: 0,
      longitude: 0,
      category: 'Thought'
    };

    const request = new NextRequest('http://localhost:3000/api/sparks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.101',
      },
      body: JSON.stringify(submission)
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.spark).toBeDefined();
    expect(data.spark.status).toBe(SparkStatus.PENDING);
  });
});
