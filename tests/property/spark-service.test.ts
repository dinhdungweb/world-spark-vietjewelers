/**
 * Property-based tests for SparkService
 * Tests correctness properties for spark management business logic
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { sparkService, SparkService, SparkStatus, SparkSubmission } from '../../lib/spark-service';
import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import * as locationServiceModule from '../../lib/location-service';

describe('SparkService Property Tests', () => {
  // Clean up database before each test to ensure isolation
  beforeEach(async () => {
    await prisma.spark.deleteMany({});
    // Wait a bit to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
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

  // Feature: world-spark, Property 1: Approved sparks visibility
  // Validates: Requirements 1.4, 5.1
  test('Property 1: Only approved sparks are visible in public queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of sparks with mixed statuses
        fc.array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            category: fc.constantFrom('Thought', 'Question', 'Observation', 'Dream', 'Memory'),
            status: fc.constantFrom(SparkStatus.PENDING, SparkStatus.APPROVED, SparkStatus.REJECTED)
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (sparkData) => {
          // Ensure clean state for this test iteration
          await prisma.spark.deleteMany({});
          // Create sparks with mixed statuses in database
          const createdSparks = await Promise.all(
            sparkData.map(data =>
              prisma.spark.create({
                data: {
                  text: data.text,
                  latitude: new Decimal(data.latitude),
                  longitude: new Decimal(data.longitude),
                  category: data.category,
                  locationDisplay: `Near Test, Country`,
                  status: data.status,
                  approvedAt: data.status === SparkStatus.APPROVED ? new Date() : null
                }
              })
            )
          );

          // Get approved sparks using service
          const approvedSparks = await sparkService.getApprovedSparks();

          // Count expected approved sparks
          const expectedApprovedCount = sparkData.filter(s => s.status === SparkStatus.APPROVED).length;

          // Verify only approved sparks are returned
          expect(approvedSparks.length).toBe(expectedApprovedCount);
          
          // Verify all returned sparks have approved status
          approvedSparks.forEach(spark => {
            expect(spark.status).toBe(SparkStatus.APPROVED);
          });

          // Verify no pending or rejected sparks are included
          const returnedIds = new Set(approvedSparks.map(s => s.id));
          const pendingAndRejectedSparks = createdSparks.filter(
            s => s.status === SparkStatus.PENDING || s.status === SparkStatus.REJECTED
          );
          
          pendingAndRejectedSparks.forEach(spark => {
            expect(returnedIds.has(spark.id)).toBe(false);
          });
        }
      ),
      { numRuns: 50 }
    );
  }, 30000);

  // Feature: world-spark, Property 2: Pending spark creation
  // Validates: Requirements 3.5
  test('Property 2: Valid spark submissions create sparks with pending status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 500 })
            .filter(s => s.trim().length > 0)
            .filter(s => !s.includes('@'))
            .filter(s => !s.includes('http'))
            .filter(s => !s.includes('www.'))
            .filter(s => !/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(s)),
          latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true }),
          category: fc.constantFrom('Thought', 'Question', 'Observation', 'Dream', 'Memory')
        }),
        async (submission: SparkSubmission) => {
          // Create spark using service
          const createdSpark = await sparkService.createSpark(submission);

          // Verify spark has pending status
          expect(createdSpark.status).toBe(SparkStatus.PENDING);

          // Verify spark was actually created in database
          const dbSpark = await prisma.spark.findUnique({
            where: { id: createdSpark.id }
          });

          expect(dbSpark).not.toBeNull();
          expect(dbSpark?.status).toBe(SparkStatus.PENDING);
          expect(dbSpark?.approvedAt).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  }, 30000);

  // Feature: world-spark, Property 7: Spark approval state transition
  // Validates: Requirements 5.2
  test('Property 7: Approving a pending spark changes status to approved and sets timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          latitude: fc.double({ min: -90, max: 90 }),
          longitude: fc.double({ min: -180, max: 180 }),
          category: fc.constantFrom('Thought', 'Question', 'Observation', 'Dream', 'Memory')
        }),
        async (sparkData) => {
          // Create a pending spark
          const pendingSpark = await prisma.spark.create({
            data: {
              text: sparkData.text,
              latitude: new Decimal(sparkData.latitude),
              longitude: new Decimal(sparkData.longitude),
              category: sparkData.category,
              locationDisplay: `Near Test, Country`,
              status: SparkStatus.PENDING
            }
          });

          const beforeApproval = new Date();

          // Approve the spark
          const approvedSpark = await sparkService.approveSpark(pendingSpark.id);

          const afterApproval = new Date();

          // Verify status changed to approved
          expect(approvedSpark.status).toBe(SparkStatus.APPROVED);

          // Verify approvedAt timestamp was set
          expect(approvedSpark.approvedAt).toBeDefined();
          expect(approvedSpark.approvedAt).not.toBeNull();

          // Verify timestamp is reasonable (between before and after)
          if (approvedSpark.approvedAt) {
            expect(approvedSpark.approvedAt.getTime()).toBeGreaterThanOrEqual(beforeApproval.getTime() - 1000);
            expect(approvedSpark.approvedAt.getTime()).toBeLessThanOrEqual(afterApproval.getTime() + 1000);
          }

          // Verify change persisted in database
          const dbSpark = await prisma.spark.findUnique({
            where: { id: pendingSpark.id }
          });

          expect(dbSpark?.status).toBe(SparkStatus.APPROVED);
          expect(dbSpark?.approvedAt).not.toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  }, 30000);

  // Feature: world-spark, Property 8: Spark rejection state transition
  // Validates: Requirements 5.3
  test('Property 8: Rejecting a pending spark changes status to rejected and excludes from public queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          latitude: fc.double({ min: -90, max: 90 }),
          longitude: fc.double({ min: -180, max: 180 }),
          category: fc.constantFrom('Thought', 'Question', 'Observation', 'Dream', 'Memory')
        }),
        async (sparkData) => {
          // Create a pending spark
          const pendingSpark = await prisma.spark.create({
            data: {
              text: sparkData.text,
              latitude: new Decimal(sparkData.latitude),
              longitude: new Decimal(sparkData.longitude),
              category: sparkData.category,
              locationDisplay: `Near Test, Country`,
              status: SparkStatus.PENDING
            }
          });

          // Reject the spark
          await sparkService.rejectSpark(pendingSpark.id);

          // Verify status changed to rejected in database
          const dbSpark = await prisma.spark.findUnique({
            where: { id: pendingSpark.id }
          });

          expect(dbSpark?.status).toBe(SparkStatus.REJECTED);

          // Verify rejected spark does not appear in public queries
          const approvedSparks = await sparkService.getApprovedSparks();
          const rejectedSparkInPublic = approvedSparks.find(s => s.id === pendingSpark.id);
          expect(rejectedSparkInPublic).toBeUndefined();

          // Verify rejected spark does not appear in pending queries
          const pendingSparks = await sparkService.getPendingSparks();
          const rejectedSparkInPending = pendingSparks.find(s => s.id === pendingSpark.id);
          expect(rejectedSparkInPending).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  }, 30000);
});
