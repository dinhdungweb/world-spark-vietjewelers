import { describe, test, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { SessionProvider } from 'next-auth/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock next-auth/react session hook
const mockSession = {
  data: {
    user: {
      email: 'admin@test.com',
      id: 'test-admin-id',
    },
    expires: '2099-12-31',
  },
  status: 'authenticated' as const,
};

vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react');
  return {
    ...actual,
    useSession: () => mockSession,
  };
});

// Import AdminPage after mocks are set up
import AdminPage from '../../app/admin/page';

// Arbitrary generators for Spark data
const pendingSparkArbitrary = fc.record({
  id: fc.uuid(),
  text: fc.string({ minLength: 1, maxLength: 500 }),
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  category: fc.oneof(
    fc.constant('Thought'),
    fc.constant('Question'),
    fc.constant('Observation'),
    fc.constant('Dream'),
    fc.constant('Memory')
  ),
  locationDisplay: fc.string({ minLength: 5, maxLength: 100 }).map(s => `Near ${s}`),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
  status: fc.constant('pending')
});

describe('Admin Moderation Panel Property Tests', () => {
  // Feature: world-spark, Property 20: Moderation panel displays required fields
  // Validates: Requirements 5.4
  test('Property 20: Moderation panel displays required fields - text, category, location, and timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(pendingSparkArbitrary, { minLength: 1, maxLength: 10 }),
        async (sparks) => {
          // Mock the fetch API to return our generated sparks
          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => sparks,
          });

          try {
            // Render the AdminPage component
            const { container } = render(
              <SessionProvider session={mockSession.data}>
                <AdminPage />
              </SessionProvider>
            );

            // Wait for the component to load and display sparks
            await waitFor(() => {
              const textContent = container.textContent || '';
              expect(textContent).not.toContain('Loading pending sparks');
            }, { timeout: 3000 });

            // Get the rendered text content
            const textContent = container.textContent || '';

            // Property 1: For each spark, the text should be present
            for (const spark of sparks) {
              expect(textContent).toContain(spark.text);
            }

            // Property 2: For each spark, the category should be present
            for (const spark of sparks) {
              expect(textContent).toContain(spark.category);
            }

            // Property 3: For each spark, the location display should be present
            for (const spark of sparks) {
              expect(textContent).toContain(spark.locationDisplay);
            }

            // Property 4: For each spark, the timestamp should be present (formatted)
            for (const spark of sparks) {
              const formattedDate = new Date(spark.createdAt).toLocaleString();
              expect(textContent).toContain(formattedDate);
            }

            // Property 5: Each spark should have approve and reject buttons
            const approveButtons = container.querySelectorAll('button');
            const approveButtonTexts = Array.from(approveButtons).map(btn => btn.textContent);
            
            // Count approve and reject buttons (should be at least one of each per spark)
            const approveCount = approveButtonTexts.filter(text => text?.includes('Approve')).length;
            const rejectCount = approveButtonTexts.filter(text => text?.includes('Reject')).length;
            
            expect(approveCount).toBeGreaterThanOrEqual(sparks.length);
            expect(rejectCount).toBeGreaterThanOrEqual(sparks.length);

            // Property 6: All four required fields should be present simultaneously for each spark
            for (const spark of sparks) {
              const hasText = textContent.includes(spark.text);
              const hasCategory = textContent.includes(spark.category);
              const hasLocation = textContent.includes(spark.locationDisplay);
              const hasTimestamp = textContent.includes(new Date(spark.createdAt).toLocaleString());
              
              expect(hasText && hasCategory && hasLocation && hasTimestamp).toBe(true);
            }
          } finally {
            // Clean up after each render
            cleanup();
            vi.clearAllMocks();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
