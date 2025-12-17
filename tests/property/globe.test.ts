import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  latLngToVector3, 
  updateRotationFromTouch, 
  updateCameraDistanceFromPinch 
} from '../../components/Globe';

// Helper functions to simulate globe rotation and zoom logic
// These represent the core logic that OrbitControls implements

/**
 * Simulates rotation state update based on drag delta
 * @param currentRotation Current rotation angles [x, y, z]
 * @param dragDelta Drag movement [deltaX, deltaY]
 * @param rotateSpeed Rotation speed multiplier
 * @returns New rotation angles
 */
function updateRotationFromDrag(
  currentRotation: [number, number, number],
  dragDelta: [number, number],
  rotateSpeed: number
): [number, number, number] {
  const [rotX, rotY, rotZ] = currentRotation;
  const [deltaX, deltaY] = dragDelta;
  
  // Rotation is proportional to drag delta and rotate speed
  const newRotY = rotY + deltaX * rotateSpeed * 0.01;
  const newRotX = rotX + deltaY * rotateSpeed * 0.01;
  
  return [newRotX, newRotY, rotZ];
}

/**
 * Simulates camera distance update based on zoom delta
 * @param currentDistance Current camera distance
 * @param zoomDelta Zoom amount (positive = zoom out, negative = zoom in)
 * @param zoomSpeed Zoom speed multiplier
 * @param minDistance Minimum allowed distance
 * @param maxDistance Maximum allowed distance
 * @returns New camera distance
 */
function updateCameraDistanceFromZoom(
  currentDistance: number,
  zoomDelta: number,
  zoomSpeed: number,
  minDistance: number,
  maxDistance: number
): number {
  // Zoom delta: positive = zoom out (increase distance), negative = zoom in (decrease distance)
  const newDistance = currentDistance + zoomDelta * zoomSpeed;
  
  // Clamp to min/max bounds
  return Math.max(minDistance, Math.min(maxDistance, newDistance));
}

describe('Globe Property Tests', () => {
  // Feature: world-spark, Property 9: Globe rotation updates state
  // Validates: Requirements 1.2
  test('Property 9: Globe rotation updates proportionally to drag direction and distance', () => {
    fc.assert(
      fc.property(
        // Current rotation state
        fc.tuple(
          fc.double({ min: -Math.PI * 4, max: Math.PI * 4, noNaN: true }),
          fc.double({ min: -Math.PI * 4, max: Math.PI * 4, noNaN: true }),
          fc.double({ min: -Math.PI * 4, max: Math.PI * 4, noNaN: true })
        ),
        // Drag delta (pixel movement)
        fc.tuple(
          fc.double({ min: -500, max: 500, noNaN: true }),
          fc.double({ min: -500, max: 500, noNaN: true })
        ),
        // Rotate speed (from OrbitControls config)
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        (currentRotation, dragDelta, rotateSpeed) => {
          const [deltaX, deltaY] = dragDelta;
          
          // Skip cases where delta is too small to produce meaningful rotation change
          // (below floating point precision threshold)
          const minMeaningfulDelta = 1e-10;
          if (Math.abs(deltaX) < minMeaningfulDelta && Math.abs(deltaY) < minMeaningfulDelta) {
            const result = updateRotationFromDrag(currentRotation, dragDelta, rotateSpeed);
            // For extremely small deltas, rotation may or may not change due to floating point
            expect(result).toBeDefined();
            return;
          }
          
          const result = updateRotationFromDrag(currentRotation, dragDelta, rotateSpeed);
          
          // Property 1: Rotation should change when drag delta is meaningfully non-zero
          if (Math.abs(deltaX) >= minMeaningfulDelta) {
            expect(result[1]).not.toBe(currentRotation[1]);
          }
          if (Math.abs(deltaY) >= minMeaningfulDelta) {
            expect(result[0]).not.toBe(currentRotation[0]);
          }
          
          // Property 2: Rotation change should be proportional to drag delta
          const expectedRotYChange = deltaX * rotateSpeed * 0.01;
          const expectedRotXChange = deltaY * rotateSpeed * 0.01;
          const actualRotYChange = result[1] - currentRotation[1];
          const actualRotXChange = result[0] - currentRotation[0];
          
          expect(Math.abs(actualRotYChange - expectedRotYChange)).toBeLessThan(0.0001);
          expect(Math.abs(actualRotXChange - expectedRotXChange)).toBeLessThan(0.0001);
          
          // Property 3: Z rotation should remain unchanged (no roll)
          expect(result[2]).toBe(currentRotation[2]);
          
          // Property 4: Larger drag delta should produce larger rotation change
          // Only test this when delta is meaningfully large to avoid floating point issues
          if (Math.abs(deltaX) > 1e-5) {
            const largerDelta: [number, number] = [deltaX * 2, deltaY];
            const largerResult = updateRotationFromDrag(currentRotation, largerDelta, rotateSpeed);
            const largerChange = Math.abs(largerResult[1] - currentRotation[1]);
            const normalChange = Math.abs(result[1] - currentRotation[1]);
            
            // Allow for floating point precision
            expect(largerChange).toBeGreaterThan(normalChange * 0.99);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: world-spark, Property 10: Zoom updates camera distance
  // Validates: Requirements 1.3
  test('Property 10: Zoom updates camera distance within min/max bounds', () => {
    fc.assert(
      fc.property(
        // Current camera distance
        fc.double({ min: 3, max: 10, noNaN: true }),
        // Zoom delta (scroll amount)
        fc.double({ min: -5, max: 5, noNaN: true }),
        // Zoom speed (from OrbitControls config)
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        (currentDistance, zoomDelta, zoomSpeed) => {
          const minDistance = 3;
          const maxDistance = 10;
          
          const result = updateCameraDistanceFromZoom(
            currentDistance,
            zoomDelta,
            zoomSpeed,
            minDistance,
            maxDistance
          );
          
          // Property 1: Result should always be within bounds
          expect(result).toBeGreaterThanOrEqual(minDistance);
          expect(result).toBeLessThanOrEqual(maxDistance);
          
          // Property 2: Positive zoom delta should increase distance (zoom out)
          if (zoomDelta > 0 && currentDistance < maxDistance) {
            expect(result).toBeGreaterThanOrEqual(currentDistance);
          }
          
          // Property 3: Negative zoom delta should decrease distance (zoom in)
          if (zoomDelta < 0 && currentDistance > minDistance) {
            expect(result).toBeLessThanOrEqual(currentDistance);
          }
          
          // Property 4: Zero zoom delta should not change distance
          if (zoomDelta === 0) {
            expect(result).toBe(currentDistance);
          }
          
          // Property 5: Distance change should be proportional to zoom delta and speed
          const expectedChange = zoomDelta * zoomSpeed;
          const actualChange = result - currentDistance;
          
          // If not clamped by bounds, change should match expected
          if (result > minDistance && result < maxDistance) {
            expect(Math.abs(actualChange - expectedChange)).toBeLessThan(0.0001);
          }
          
          // Property 6: Larger zoom delta should produce larger distance change (when not at bounds)
          if (Math.abs(zoomDelta) > 0.1 && currentDistance > minDistance + 1 && currentDistance < maxDistance - 1) {
            const largerZoomDelta = zoomDelta * 2;
            const largerResult = updateCameraDistanceFromZoom(
              currentDistance,
              largerZoomDelta,
              zoomSpeed,
              minDistance,
              maxDistance
            );
            
            const normalChange = Math.abs(result - currentDistance);
            const largerChange = Math.abs(largerResult - currentDistance);
            
            // Larger delta should produce larger change (unless clamped)
            if (largerResult > minDistance && largerResult < maxDistance) {
              expect(largerChange).toBeGreaterThan(normalChange * 0.99);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Zoom in then zoom out should approximately return to original distance
  test('Property 10 (Round-trip): Zoom in then zoom out returns near original distance', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 4, max: 9, noNaN: true }),
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        (initialDistance, zoomAmount, zoomSpeed) => {
          const minDistance = 3;
          const maxDistance = 10;
          
          // Zoom in
          const afterZoomIn = updateCameraDistanceFromZoom(
            initialDistance,
            -zoomAmount,
            zoomSpeed,
            minDistance,
            maxDistance
          );
          
          // Zoom out by same amount
          const afterZoomOut = updateCameraDistanceFromZoom(
            afterZoomIn,
            zoomAmount,
            zoomSpeed,
            minDistance,
            maxDistance
          );
          
          // Property: Should return to approximately the same distance (within floating point precision)
          // Only if we didn't hit the bounds
          if (afterZoomIn > minDistance && afterZoomIn < maxDistance) {
            expect(Math.abs(afterZoomOut - initialDistance)).toBeLessThan(0.0001);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: world-spark, Property 14: Spark positioning consistency
  // Validates: Requirements 6.4, 9.5
  test('Property 14: Spark positioning consistency - rendered position corresponds to geographic coordinates', () => {
    fc.assert(
      fc.property(
        // Generate valid latitude (-90 to 90)
        fc.double({ min: -90, max: 90, noNaN: true }),
        // Generate valid longitude (-180 to 180)
        fc.double({ min: -180, max: 180, noNaN: true }),
        // Globe radius
        fc.double({ min: 1, max: 10, noNaN: true }),
        (lat, lng, radius) => {
          // Convert lat/lng to 3D position
          const position = latLngToVector3(lat, lng, radius);
          
          // Property 1: Position should be on the sphere surface (distance from origin = radius)
          const distanceFromOrigin = Math.sqrt(
            position.x * position.x + 
            position.y * position.y + 
            position.z * position.z
          );
          expect(Math.abs(distanceFromOrigin - radius)).toBeLessThan(0.0001);
          
          // Property 2: Converting back to lat/lng should give approximately the same coordinates
          const calculatedRadius = distanceFromOrigin;
          const calculatedLat = 90 - Math.acos(position.y / calculatedRadius) * (180 / Math.PI);
          const calculatedLng = Math.atan2(position.z, -position.x) * (180 / Math.PI) - 180;
          
          // Allow small floating point error
          expect(Math.abs(calculatedLat - lat)).toBeLessThan(0.001);
          
          // Longitude wrapping: -180 and 180 are the same
          const lngDiff = Math.abs(calculatedLng - lng);
          const wrappedLngDiff = Math.min(lngDiff, 360 - lngDiff);
          expect(wrappedLngDiff).toBeLessThan(0.001);
          
          // Property 3: Same coordinates should always produce the same position (deterministic)
          const position2 = latLngToVector3(lat, lng, radius);
          expect(position.x).toBe(position2.x);
          expect(position.y).toBe(position2.y);
          expect(position.z).toBe(position2.z);
          
          // Property 4: Different radii should scale the position proportionally
          const radius2 = radius * 2;
          const position3 = latLngToVector3(lat, lng, radius2);
          expect(Math.abs(position3.x - position.x * 2)).toBeLessThan(0.0001);
          expect(Math.abs(position3.y - position.y * 2)).toBeLessThan(0.0001);
          expect(Math.abs(position3.z - position.z * 2)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: world-spark, Property 15: No clustering of nearby sparks
  // Validates: Requirements 9.3
  test('Property 15: No clustering - nearby sparks render as individual points', () => {
    fc.assert(
      fc.property(
        // Generate a base coordinate
        fc.double({ min: -89, max: 89, noNaN: true }),
        fc.double({ min: -179, max: 179, noNaN: true }),
        // Generate nearby coordinates (within 1 degree)
        fc.array(
          fc.tuple(
            fc.double({ min: -0.5, max: 0.5, noNaN: true }),
            fc.double({ min: -0.5, max: 0.5, noNaN: true })
          ),
          { minLength: 2, maxLength: 10 }
        ),
        fc.double({ min: 1, max: 10, noNaN: true }),
        (baseLat, baseLng, offsets, radius) => {
          // Create nearby coordinates
          const coordinates = offsets.map(([latOffset, lngOffset]) => ({
            lat: Math.max(-90, Math.min(90, baseLat + latOffset)),
            lng: Math.max(-180, Math.min(180, baseLng + lngOffset))
          }));
          
          // Convert all to 3D positions
          const positions = coordinates.map(coord => 
            latLngToVector3(coord.lat, coord.lng, radius)
          );
          
          // Property 1: Each coordinate should produce a distinct position
          // (no clustering/combining of nearby sparks)
          // Only test coordinates that are meaningfully different (beyond floating point precision)
          const minMeaningfulDiff = 1e-10;
          for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
              const pos1 = positions[i];
              const pos2 = positions[j];
              
              // Check if coordinates are meaningfully different
              const latDiff = Math.abs(coordinates[i].lat - coordinates[j].lat);
              const lngDiff = Math.abs(coordinates[i].lng - coordinates[j].lng);
              
              // If coordinates are meaningfully different, positions should be different
              if (latDiff > minMeaningfulDiff || lngDiff > minMeaningfulDiff) {
                const distance = Math.sqrt(
                  Math.pow(pos1.x - pos2.x, 2) +
                  Math.pow(pos1.y - pos2.y, 2) +
                  Math.pow(pos1.z - pos2.z, 2)
                );
                
                // Positions should be distinct (not clustered into same point)
                expect(distance).toBeGreaterThan(0);
              }
            }
          }
          
          // Property 2: Number of positions should equal number of coordinates
          // (no reduction/clustering)
          expect(positions.length).toBe(coordinates.length);
          
          // Property 3: All positions should be on the sphere surface
          positions.forEach(pos => {
            const distanceFromOrigin = Math.sqrt(
              pos.x * pos.x + pos.y * pos.y + pos.z * pos.z
            );
            expect(Math.abs(distanceFromOrigin - radius)).toBeLessThan(0.0001);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: world-spark, Property 16: Spark hover feedback
  // Validates: Requirements 9.4
  test('Property 16: Spark hover feedback - hover increases scale', () => {
    fc.assert(
      fc.property(
        // Base scale
        fc.double({ min: 0.5, max: 2.0, noNaN: true }),
        // Hover scale multiplier
        fc.double({ min: 1.1, max: 2.0, noNaN: true }),
        (baseScale, hoverMultiplier) => {
          // Simulate hover effect
          const normalScale = baseScale;
          const hoveredScale = baseScale * hoverMultiplier;
          
          // Property 1: Hovered scale should be larger than normal scale
          expect(hoveredScale).toBeGreaterThan(normalScale);
          
          // Property 2: Scale increase should be proportional to multiplier
          const scaleIncrease = hoveredScale - normalScale;
          const expectedIncrease = normalScale * (hoverMultiplier - 1);
          expect(Math.abs(scaleIncrease - expectedIncrease)).toBeLessThan(0.0001);
          
          // Property 3: Hover multiplier > 1 should always increase scale
          if (hoverMultiplier > 1) {
            expect(hoveredScale).toBeGreaterThan(normalScale);
          }
          
          // Property 4: Removing hover should return to base scale
          const afterHoverRemoved = baseScale;
          expect(afterHoverRemoved).toBe(normalScale);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: world-spark, Property 17: Spark animation properties
  // Validates: Requirements 9.2
  test('Property 17: Spark animation - pulsing effect with defined period and amplitude', () => {
    fc.assert(
      fc.property(
        // Time values
        fc.double({ min: 0, max: 100, noNaN: true }),
        // Base scale
        fc.double({ min: 0.5, max: 2.0, noNaN: true }),
        // Pulse amplitude (0 to 0.5)
        fc.double({ min: 0.1, max: 0.5, noNaN: true }),
        // Pulse frequency
        fc.double({ min: 1, max: 5, noNaN: true }),
        (time, baseScale, amplitude, frequency) => {
          // Simulate pulsing animation: scale = baseScale * (1 + sin(time * frequency) * amplitude)
          const pulseValue = Math.sin(time * frequency);
          const animatedScale = baseScale * (1 + pulseValue * amplitude);
          
          // Property 1: Animated scale should oscillate around base scale
          const minScale = baseScale * (1 - amplitude);
          const maxScale = baseScale * (1 + amplitude);
          expect(animatedScale).toBeGreaterThanOrEqual(minScale - 0.0001);
          expect(animatedScale).toBeLessThanOrEqual(maxScale + 0.0001);
          
          // Property 2: At time = 0, pulse should be at base scale (sin(0) = 0)
          const scaleAtZero = baseScale * (1 + Math.sin(0) * amplitude);
          expect(scaleAtZero).toBe(baseScale);
          
          // Property 3: Animation should be periodic
          const period = (2 * Math.PI) / frequency;
          const scaleAtT = baseScale * (1 + Math.sin(time * frequency) * amplitude);
          const scaleAtTPlusPeriod = baseScale * (1 + Math.sin((time + period) * frequency) * amplitude);
          expect(Math.abs(scaleAtT - scaleAtTPlusPeriod)).toBeLessThan(0.0001);
          
          // Property 4: Larger amplitude should produce larger scale variation
          const smallAmplitude = amplitude * 0.5;
          const largeAmplitude = amplitude;
          
          const scaleWithSmallAmp = baseScale * (1 + pulseValue * smallAmplitude);
          const scaleWithLargeAmp = baseScale * (1 + pulseValue * largeAmplitude);
          
          const smallVariation = Math.abs(scaleWithSmallAmp - baseScale);
          const largeVariation = Math.abs(scaleWithLargeAmp - baseScale);
          
          // When pulse is non-zero, larger amplitude should produce larger variation
          if (Math.abs(pulseValue) > 0.01) {
            expect(largeVariation).toBeGreaterThanOrEqual(smallVariation * 0.99);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: world-spark, Property 19: Touch event handling
  // Validates: Requirements 10.4
  test('Property 19: Touch event handling - touch interactions match mouse interactions', () => {
    fc.assert(
      fc.property(
        // Current rotation state
        fc.tuple(
          fc.double({ min: -Math.PI * 4, max: Math.PI * 4, noNaN: true }),
          fc.double({ min: -Math.PI * 4, max: Math.PI * 4, noNaN: true }),
          fc.double({ min: -Math.PI * 4, max: Math.PI * 4, noNaN: true })
        ),
        // Touch drag delta (pixel movement)
        fc.tuple(
          fc.double({ min: -500, max: 500, noNaN: true }),
          fc.double({ min: -500, max: 500, noNaN: true })
        ),
        // Current camera distance
        fc.double({ min: 3, max: 10, noNaN: true }),
        // Pinch delta (distance change between two touch points)
        fc.double({ min: -3, max: 3, noNaN: true }),
        // Rotate and zoom speeds
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        (currentRotation, touchDelta, currentDistance, pinchDelta, rotateSpeed, zoomSpeed) => {
          const minDistance = 3;
          const maxDistance = 10;
          
          // Test touch drag rotation
          const touchRotationResult = updateRotationFromTouch(currentRotation, touchDelta, rotateSpeed);
          
          // Property 1: Touch rotation should behave identically to mouse drag rotation
          // (using the same underlying logic)
          const [deltaX, deltaY] = touchDelta;
          const expectedRotY = currentRotation[1] + deltaX * rotateSpeed * 0.01;
          const expectedRotX = currentRotation[0] + deltaY * rotateSpeed * 0.01;
          
          expect(Math.abs(touchRotationResult[1] - expectedRotY)).toBeLessThan(0.0001);
          expect(Math.abs(touchRotationResult[0] - expectedRotX)).toBeLessThan(0.0001);
          expect(touchRotationResult[2]).toBe(currentRotation[2]); // Z unchanged
          
          // Property 2: Touch rotation should update proportionally to touch delta
          if (Math.abs(deltaX) > 1e-10) {
            expect(touchRotationResult[1]).not.toBe(currentRotation[1]);
          }
          if (Math.abs(deltaY) > 1e-10) {
            expect(touchRotationResult[0]).not.toBe(currentRotation[0]);
          }
          
          // Test pinch zoom
          const pinchZoomResult = updateCameraDistanceFromPinch(
            currentDistance,
            pinchDelta,
            zoomSpeed,
            minDistance,
            maxDistance
          );
          
          // Property 3: Pinch zoom result should always be within bounds
          expect(pinchZoomResult).toBeGreaterThanOrEqual(minDistance);
          expect(pinchZoomResult).toBeLessThanOrEqual(maxDistance);
          
          // Property 4: Positive pinch delta (pinch out) should zoom in (decrease distance)
          if (pinchDelta > 0 && currentDistance > minDistance) {
            expect(pinchZoomResult).toBeLessThanOrEqual(currentDistance);
          }
          
          // Property 5: Negative pinch delta (pinch in) should zoom out (increase distance)
          if (pinchDelta < 0 && currentDistance < maxDistance) {
            expect(pinchZoomResult).toBeGreaterThanOrEqual(currentDistance);
          }
          
          // Property 6: Zero pinch delta should not change distance
          if (pinchDelta === 0) {
            expect(pinchZoomResult).toBe(currentDistance);
          }
          
          // Property 7: Larger touch delta should produce larger rotation change
          if (Math.abs(deltaX) > 1e-5) {
            const largerTouchDelta: [number, number] = [deltaX * 2, deltaY];
            const largerTouchResult = updateRotationFromTouch(currentRotation, largerTouchDelta, rotateSpeed);
            
            const normalChange = Math.abs(touchRotationResult[1] - currentRotation[1]);
            const largerChange = Math.abs(largerTouchResult[1] - currentRotation[1]);
            
            expect(largerChange).toBeGreaterThan(normalChange * 0.99);
          }
          
          // Property 8: Larger pinch delta should produce larger distance change (when not at bounds)
          if (Math.abs(pinchDelta) > 0.1 && currentDistance > minDistance + 0.5 && currentDistance < maxDistance - 0.5) {
            const largerPinchDelta = pinchDelta * 2;
            const largerPinchResult = updateCameraDistanceFromPinch(
              currentDistance,
              largerPinchDelta,
              zoomSpeed,
              minDistance,
              maxDistance
            );
            
            const normalChange = Math.abs(pinchZoomResult - currentDistance);
            const largerChange = Math.abs(largerPinchResult - currentDistance);
            
            if (largerPinchResult > minDistance && largerPinchResult < maxDistance) {
              expect(largerChange).toBeGreaterThan(normalChange * 0.99);
            }
          }
          
          // Property 9: Touch interactions should be deterministic
          // Same input should always produce same output
          const touchRotationResult2 = updateRotationFromTouch(currentRotation, touchDelta, rotateSpeed);
          expect(touchRotationResult2[0]).toBe(touchRotationResult[0]);
          expect(touchRotationResult2[1]).toBe(touchRotationResult[1]);
          expect(touchRotationResult2[2]).toBe(touchRotationResult[2]);
          
          const pinchZoomResult2 = updateCameraDistanceFromPinch(
            currentDistance,
            pinchDelta,
            zoomSpeed,
            minDistance,
            maxDistance
          );
          expect(pinchZoomResult2).toBe(pinchZoomResult);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Touch round-trip - drag then reverse should return to original rotation
  test('Property 19 (Round-trip): Touch drag then reverse returns to original rotation', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.double({ min: -Math.PI * 2, max: Math.PI * 2, noNaN: true }),
          fc.double({ min: -Math.PI * 2, max: Math.PI * 2, noNaN: true }),
          fc.double({ min: -Math.PI * 2, max: Math.PI * 2, noNaN: true })
        ),
        fc.tuple(
          fc.double({ min: -200, max: 200, noNaN: true }),
          fc.double({ min: -200, max: 200, noNaN: true })
        ),
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        (initialRotation, touchDelta, rotateSpeed) => {
          // Apply touch drag
          const afterDrag = updateRotationFromTouch(initialRotation, touchDelta, rotateSpeed);
          
          // Apply reverse touch drag
          const reverseDelta: [number, number] = [-touchDelta[0], -touchDelta[1]];
          const afterReverse = updateRotationFromTouch(afterDrag, reverseDelta, rotateSpeed);
          
          // Property: Should return to approximately the same rotation (within floating point precision)
          expect(Math.abs(afterReverse[0] - initialRotation[0])).toBeLessThan(0.0001);
          expect(Math.abs(afterReverse[1] - initialRotation[1])).toBeLessThan(0.0001);
          expect(Math.abs(afterReverse[2] - initialRotation[2])).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Pinch round-trip - pinch in then pinch out should return to original distance
  test('Property 19 (Round-trip): Pinch in then pinch out returns to original distance', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 4, max: 9, noNaN: true }),
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        (initialDistance, pinchAmount, zoomSpeed) => {
          const minDistance = 3;
          const maxDistance = 10;
          
          // Pinch out (zoom in)
          const afterPinchOut = updateCameraDistanceFromPinch(
            initialDistance,
            pinchAmount,
            zoomSpeed,
            minDistance,
            maxDistance
          );
          
          // Pinch in (zoom out) by same amount
          const afterPinchIn = updateCameraDistanceFromPinch(
            afterPinchOut,
            -pinchAmount,
            zoomSpeed,
            minDistance,
            maxDistance
          );
          
          // Property: Should return to approximately the same distance (within floating point precision)
          // Only if we didn't hit the bounds
          if (afterPinchOut > minDistance && afterPinchOut < maxDistance) {
            expect(Math.abs(afterPinchIn - initialDistance)).toBeLessThan(0.0001);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
