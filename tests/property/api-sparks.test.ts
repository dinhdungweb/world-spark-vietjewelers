/**
 * Property-based tests for /api/sparks endpoints
 * Tests correctness properties for public spark API operations
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { POST, GET } from '../../app/api/sparks/route';
import { prisma } from '../../lib/prisma';
import { SparkStatus } from '../../lib/spark-service';
import { sanitizeInput } from '../../lib/security';
import * as locationServiceModule from '../../lib/location-service';
import { sparkRateLimiter } from '../../lib/rate-limiter';
import { NextRequest } from 'next/server';

describe('Spark API Property Tests', () => {
  // Clean up database before each test to ensure isolation
  beforeEach(async () => {
    // Clear all mocks first
    vi.clearAllMocks();
    
    // Clean database
    await prisma.spark.deleteMany({});
    
    // Clear rate limiter to avoid hitting limits during tests
    sparkRateLimiter.clear();
    
    // Mock location service to avoid external API calls
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

  // Feature: world-spark, Property 18: Unauthenticated submission acceptance
  // Validates: Requirements 8.2
  test('Property 18: Valid spark submissions are accepted without authentication', async () => {
    let requestCounter = 0;
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 500 })
            .filter(s => s.trim().length > 0)
            .filter(s => sanitizeInput(s).trim().length > 0) // Must be non-empty after sanitization
            .filter(s => !s.includes('@'))
            .filter(s => !s.includes('http'))
            .filter(s => !s.includes('www.'))
            .filter(s => !/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(s)),
          latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true }),
          category: fc.constantFrom('Thought', 'Question', 'Observation', 'Dream', 'Memory')
        }),
        async (submission) => {
          // Use a unique IP for each request to avoid rate limiting during tests
          const uniqueIp = `192.168.1.${requestCounter % 256}`;
          requestCounter++;
          
          // Create a request without any authentication headers
          const request = new NextRequest('http://localhost:3000/api/sparks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-forwarded-for': uniqueIp,
              // Explicitly no Authorization header
            },
            body: JSON.stringify(submission)
          });

          // Call the API endpoint
          const response = await POST(request);
          const data = await response.json();

          // Verify the submission was accepted (201 Created)
          expect(response.status).toBe(201);
          
          // Verify response contains success message and spark data
          expect(data.message).toBeDefined();
          expect(data.spark).toBeDefined();
          expect(data.spark.id).toBeDefined();
          
          // Verify the spark was created with pending status
          expect(data.spark.status).toBe(SparkStatus.PENDING);
          
          // Verify the spark exists in the database
          const dbSpark = await prisma.spark.findUnique({
            where: { id: data.spark.id }
          });
          
          expect(dbSpark).not.toBeNull();
          expect(dbSpark?.status).toBe(SparkStatus.PENDING);
          // Text is sanitized (trimmed and HTML-encoded) for security
          expect(dbSpark?.text).toBe(sanitizeInput(submission.text));
          
          // Verify the spark is NOT visible in public queries (since it's pending)
          const publicResponse = await GET();
          const publicData = await publicResponse.json();
          const sparkInPublic = publicData.find((s: any) => s.id === data.spark.id);
          expect(sparkInPublic).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});
