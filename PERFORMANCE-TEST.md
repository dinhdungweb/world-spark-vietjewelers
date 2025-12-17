# Performance Testing Guide

This guide explains how to test the performance optimizations in World Spark.

## Quick Start

### 1. Seed Test Data

Create 10,000 approved sparks for testing:

```bash
npm run prisma:seed-performance
```

This will create 10,000 sparks distributed randomly across the globe. The process takes about 10-20 seconds.

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access Performance Test Page

Navigate to: `http://localhost:3000/performance-test`

## What to Test

### Performance Metrics

The performance test page displays real-time metrics:

- **Current FPS**: Instantaneous frame rate
- **Average FPS**: Average over the last 60 seconds
- **Min FPS**: Lowest FPS recorded
- **Max FPS**: Highest FPS recorded
- **Status**: Good (≥30 FPS) or Poor (<30 FPS)

### Test Scenarios

1. **Idle Performance**
   - Let the globe sit idle
   - Observe FPS with pulsing animations
   - Target: 60 FPS on modern hardware

2. **Rotation Performance**
   - Drag to rotate the globe continuously
   - Observe FPS during rotation
   - Target: ≥30 FPS

3. **Zoom Performance**
   - Scroll or pinch to zoom in/out rapidly
   - Observe FPS during zoom
   - Target: ≥30 FPS

4. **Combined Interactions**
   - Rotate while zooming
   - Click on sparks
   - Observe FPS under load
   - Target: ≥30 FPS

## Expected Results

### With Optimizations (Current)

| Scenario | Expected FPS | Hardware |
|----------|--------------|----------|
| Idle | 60 | Modern GPU |
| Rotation | 45-60 | Modern GPU |
| Zoom | 45-60 | Modern GPU |
| Combined | 30-45 | Modern GPU |
| Idle | 30-45 | Integrated GPU |
| Rotation | 25-35 | Integrated GPU |

### Without Optimizations (Baseline)

For comparison, without the optimizations:
- Idle: 20-30 FPS
- Rotation: 10-20 FPS
- Zoom: 10-20 FPS

## Optimization Features Being Tested

1. **Instanced Rendering**
   - All 10,000 sparks rendered in a single draw call
   - Massive GPU performance improvement

2. **Frustum Culling**
   - Only visible sparks are animated
   - Reduces CPU work by 30-50%

3. **React.memo**
   - Prevents unnecessary component re-renders
   - Reduces React overhead

4. **Code Splitting**
   - Smaller initial bundle
   - Faster page load

5. **Canvas Optimizations**
   - High-performance GPU preference
   - Adaptive pixel ratio
   - Performance degradation handling

## Troubleshooting

### Low FPS (<30)

**Possible causes:**
1. Too many sparks (>10,000)
2. Browser GPU acceleration disabled
3. Other applications using GPU
4. Integrated graphics card

**Solutions:**
1. Reduce spark count
2. Enable GPU acceleration in browser settings
3. Close other GPU-intensive applications
4. Test on device with discrete GPU

### High Memory Usage

**Possible causes:**
1. Memory leak in Three.js objects
2. Too many retained references
3. Large textures not being released

**Solutions:**
1. Check browser DevTools Memory tab
2. Look for detached DOM nodes
3. Verify Three.js objects are disposed properly

### Inconsistent FPS

**Possible causes:**
1. Background processes
2. Thermal throttling
3. Power saving mode

**Solutions:**
1. Close background applications
2. Ensure adequate cooling
3. Disable power saving mode

## Performance Profiling

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with globe
5. Stop recording
6. Analyze flame graph

**Look for:**
- Long tasks (>50ms)
- Excessive garbage collection
- Layout thrashing
- Expensive function calls

### React DevTools Profiler

1. Install React DevTools extension
2. Open Profiler tab
3. Click Record
4. Interact with globe
5. Stop recording
6. Analyze component render times

**Look for:**
- Unnecessary re-renders
- Expensive component updates
- Props that change too frequently

## Benchmarking

### Manual Benchmarking

1. Clear browser cache
2. Open performance test page
3. Wait 60 seconds for FPS to stabilize
4. Record average FPS
5. Perform test scenario
6. Record min/max FPS
7. Repeat 3 times and average results

### Automated Benchmarking

For automated testing, you can use Playwright:

```typescript
// Example test
test('performance with 10k sparks', async ({ page }) => {
  await page.goto('/performance-test');
  
  // Wait for sparks to load
  await page.waitForSelector('text=/Sparks: 10,000/');
  
  // Wait for FPS to stabilize
  await page.waitForTimeout(5000);
  
  // Get FPS
  const fps = await page.textContent('[data-testid="current-fps"]');
  expect(parseInt(fps)).toBeGreaterThan(30);
});
```

## Comparing Results

### Before/After Comparison

To compare performance before and after optimizations:

1. Checkout commit before optimizations
2. Run performance test, record results
3. Checkout current commit
4. Run performance test, record results
5. Compare FPS improvements

### Hardware Comparison

Test on different hardware:
- High-end desktop (discrete GPU)
- Mid-range laptop (integrated GPU)
- Mobile device (ARM GPU)
- Older hardware (2-3 years old)

## Reporting Issues

If you encounter performance issues:

1. Record your hardware specs
2. Note browser and version
3. Capture FPS metrics
4. Take screenshots/video
5. Check browser console for errors
6. Export performance profile
7. Create issue with all information

## Additional Resources

- [Three.js Performance Tips](https://threejs.org/docs/#manual/en/introduction/Performance-tips)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web Performance Best Practices](https://web.dev/performance/)

## Cleanup

To remove test data after testing:

```bash
# Reset database
npm run prisma:migrate reset

# Re-seed with normal data
npm run prisma:seed
```

This will remove all 10,000 test sparks and restore the database to its initial state.
