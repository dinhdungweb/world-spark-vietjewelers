/**
 * Property-based tests for SparkForm component
 * Tests location selection methods and form validation
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import SparkForm from '@/components/SparkForm';

describe('SparkForm Property Tests', () => {
  /**
   * Feature: world-spark, Property 13: Location selection methods
   * Validates: Requirements 3.2
   * 
   * For any location input (either globe click coordinates or manual entry),
   * the submission form should accept and store the location data.
   */
  it('Property 13: Location selection methods', () => {
    fc.assert(
      fc.property(
        // Generate valid coordinates
        fc.record({
          lat: fc.double({ min: -90, max: 90, noNaN: true }),
          lng: fc.double({ min: -180, max: 180, noNaN: true })
        }),
        (coordinates) => {
          // Test 1: Globe click method (initialLocation prop)
          const mockSubmit = async (data: any) => {};
          const mockCancel = () => {};

          const { unmount } = render(
            <SparkForm
              initialLocation={coordinates}
              onSubmit={mockSubmit}
              onCancel={mockCancel}
            />
          );

          // Verify the form displays the coordinates from globe click
          const displayText = screen.getByText(/Selected:/);
          expect(displayText).toBeDefined();
          expect(displayText.textContent).toContain(coordinates.lat.toFixed(2));
          expect(displayText.textContent).toContain(coordinates.lng.toFixed(2));

          unmount();

          // Test 2: Manual entry method
          const { unmount: unmount2 } = render(
            <SparkForm
              onSubmit={mockSubmit}
              onCancel={mockCancel}
            />
          );

          // Switch to manual entry
          const manualButton = screen.getByText('Enter manually');
          fireEvent.click(manualButton);

          // Enter coordinates manually
          const latInput = screen.getByLabelText(/Latitude/);
          const lngInput = screen.getByLabelText(/Longitude/);

          fireEvent.change(latInput, { target: { value: coordinates.lat.toString() } });
          fireEvent.change(lngInput, { target: { value: coordinates.lng.toString() } });

          // Verify the inputs accept the values
          expect((latInput as HTMLInputElement).value).toBe(coordinates.lat.toString());
          expect((lngInput as HTMLInputElement).value).toBe(coordinates.lng.toString());

          unmount2();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Verify form accepts both location methods for submission
   */
  it('accepts location from both globe click and manual entry for submission', async () => {
    const testCoordinates = { lat: 52.5, lng: 13.4 };
    const testText = 'This is a valid spark text';
    let submittedData: any = null;

    const mockSubmit = async (data: any) => {
      submittedData = data;
    };

    const mockCancel = () => {};

    // Test globe click method
    const { unmount } = render(
      <SparkForm
        initialLocation={testCoordinates}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    );

    const textArea = screen.getByPlaceholderText(/Share your thought/);
    fireEvent.change(textArea, { target: { value: testText } });

    const submitButton = screen.getByText('Submit Spark');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submittedData).not.toBeNull();
      expect(submittedData.latitude).toBe(testCoordinates.lat);
      expect(submittedData.longitude).toBe(testCoordinates.lng);
      expect(submittedData.text).toBe(testText);
    });

    unmount();

    // Test manual entry method
    submittedData = null;

    const { unmount: unmount2 } = render(
      <SparkForm
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    );

    const textArea2 = screen.getByPlaceholderText(/Share your thought/);
    fireEvent.change(textArea2, { target: { value: testText } });

    const manualButton = screen.getByText('Enter manually');
    fireEvent.click(manualButton);

    const latInput = screen.getByLabelText(/Latitude/);
    const lngInput = screen.getByLabelText(/Longitude/);

    fireEvent.change(latInput, { target: { value: testCoordinates.lat.toString() } });
    fireEvent.change(lngInput, { target: { value: testCoordinates.lng.toString() } });

    const submitButton2 = screen.getByText('Submit Spark');
    fireEvent.click(submitButton2);

    await waitFor(() => {
      expect(submittedData).not.toBeNull();
      expect(submittedData.latitude).toBe(testCoordinates.lat);
      expect(submittedData.longitude).toBe(testCoordinates.lng);
      expect(submittedData.text).toBe(testText);
    });

    unmount2();
  });
});
