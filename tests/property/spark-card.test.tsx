import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import SparkCard from '../../components/SparkCard';

// Arbitrary generators for Spark data
const sparkArbitrary = fc.record({
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
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
});

describe('SparkCard Property Tests', () => {
  // Feature: world-spark, Property 11: Spark card displays required fields
  // Validates: Requirements 2.1
  test('Property 11: Spark card displays required fields - text, category, and location', () => {
    fc.assert(
      fc.property(
        sparkArbitrary,
        (spark) => {
          // Render the SparkCard component
          const { container } = render(
            <SparkCard
              spark={spark}
              onClose={() => {}}
              onNext={() => {}}
              onAddSpark={() => {}}
            />
          );

          try {
            // Get the rendered text content (not HTML, to avoid escaping issues)
            const textContent = container.textContent || '';

            // Property 1: Spark text should be present in the rendered output
            expect(textContent).toContain(spark.text);

            // Property 2: Category should be present in the rendered output
            expect(textContent).toContain(spark.category);

            // Property 3: Location display should be present in the rendered output
            expect(textContent).toContain(spark.locationDisplay);

            // Property 4: All three required fields should be present simultaneously
            const hasText = textContent.includes(spark.text);
            const hasCategory = textContent.includes(spark.category);
            const hasLocation = textContent.includes(spark.locationDisplay);
            expect(hasText && hasCategory && hasLocation).toBe(true);

            // Property 5: The "Next spark" button should be present
            expect(container.querySelector('button')).toBeDefined();
            expect(textContent).toContain('Next spark');

            // Property 6: The "Add your spark" button should be present
            expect(textContent).toContain('Add your spark');
          } finally {
            // Clean up after each render
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: world-spark, Property 12: Click outside closes card
  // Validates: Requirements 2.5
  test('Property 12: Click outside closes card', () => {
    fc.assert(
      fc.property(
        sparkArbitrary,
        (spark) => {
          let closeCalled = false;
          const onClose = () => {
            closeCalled = true;
          };

          // Render the SparkCard component
          const { container } = render(
            <SparkCard
              spark={spark}
              onClose={onClose}
              onNext={() => {}}
              onAddSpark={() => {}}
            />
          );

          try {
            // Property 1: Initially, onClose should not have been called
            expect(closeCalled).toBe(false);

            // Find the card element (the inner div with the content)
            const cardElement = container.querySelector('.bg-gray-900');
            expect(cardElement).toBeDefined();

            // Property 2: Clicking on the card itself should NOT close it
            if (cardElement) {
              cardElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
              expect(closeCalled).toBe(false);
            }

            // Property 3: Clicking outside the card (on the overlay) should close it
            const overlayElement = container.querySelector('.fixed.inset-0');
            if (overlayElement) {
              overlayElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
              expect(closeCalled).toBe(true);
            }
          } finally {
            // Clean up after each render
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
