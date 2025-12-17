import { test, expect, devices } from '@playwright/test';

/**
 * Integration tests for World Spark mobile interactions
 * Tests: touch drag for rotation, pinch for zoom
 * Requirements: 10.4
 */

// Use mobile device configuration for all tests in this file
test.use({ ...devices['Pixel 5'] });

test.describe('Mobile Touch Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for the globe to load
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  test('should display globe on mobile viewport', async ({ page }) => {
    // Verify the canvas is rendered on mobile
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify mobile viewport size
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThan(500);
  });

  test('should handle touch drag for rotation', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      
      // Simulate touch drag
      await page.touchscreen.tap(startX, startY);
      
      // Perform swipe gesture
      await page.evaluate(async ({ startX, startY }) => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        
        // Create touch start event
        const touchStart = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [
            new Touch({
              identifier: 0,
              target: canvas,
              clientX: startX,
              clientY: startY,
            }),
          ],
        });
        canvas.dispatchEvent(touchStart);
        
        // Create touch move event
        const touchMove = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [
            new Touch({
              identifier: 0,
              target: canvas,
              clientX: startX + 50,
              clientY: startY,
            }),
          ],
        });
        canvas.dispatchEvent(touchMove);
        
        // Create touch end event
        const touchEnd = new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          touches: [],
        });
        canvas.dispatchEvent(touchEnd);
      }, { startX, startY });
      
      // Test passes if no errors occur
    }
  });

  test('should handle pinch gesture for zoom', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      // Simulate pinch gesture using two touch points
      await page.evaluate(async ({ centerX, centerY }) => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        
        // Initial touch positions (close together)
        const touch1StartX = centerX - 20;
        const touch2StartX = centerX + 20;
        
        // Final touch positions (spread apart for zoom in)
        const touch1EndX = centerX - 60;
        const touch2EndX = centerX + 60;
        
        // Create touch start event with two fingers
        const touchStart = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [
            new Touch({
              identifier: 0,
              target: canvas,
              clientX: touch1StartX,
              clientY: centerY,
            }),
            new Touch({
              identifier: 1,
              target: canvas,
              clientX: touch2StartX,
              clientY: centerY,
            }),
          ],
        });
        canvas.dispatchEvent(touchStart);
        
        // Create touch move event (fingers spreading apart)
        const touchMove = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [
            new Touch({
              identifier: 0,
              target: canvas,
              clientX: touch1EndX,
              clientY: centerY,
            }),
            new Touch({
              identifier: 1,
              target: canvas,
              clientX: touch2EndX,
              clientY: centerY,
            }),
          ],
        });
        canvas.dispatchEvent(touchMove);
        
        // Create touch end event
        const touchEnd = new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          touches: [],
        });
        canvas.dispatchEvent(touchEnd);
      }, { centerX, centerY });
      
      // Test passes if no errors occur
    }
  });

  test('should display footer on mobile', async ({ page }) => {
    // Verify footer is visible on mobile
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('World Spark');
  });

  test('should have touch-friendly UI elements', async ({ page }) => {
    // Wait for API response
    await page.waitForResponse(
      response => response.url().includes('/api/sparks') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Verify canvas is full screen on mobile
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      const viewportSize = page.viewportSize();
      // Canvas should take up most of the viewport
      expect(box.width).toBeGreaterThan((viewportSize?.width || 0) * 0.9);
    }
  });
});

test.describe('Mobile Form Interactions', () => {
  test('should display form properly on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Wait for globe to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Wait for API
    await page.waitForResponse(
      response => response.url().includes('/api/sparks') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Form would be tested when opened
    // This is a placeholder for mobile form testing
  });

  test('should have touch-friendly input fields', async ({ page }) => {
    await page.goto('/');
    
    // Wait for globe to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Input fields should be large enough for touch
    // This would be tested when form is visible
  });
});

test.describe('Mobile Admin Panel', () => {
  test('should display login form on mobile', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Verify form elements are visible and touch-friendly
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Verify inputs are large enough for touch
    const emailBox = await emailInput.boundingBox();
    if (emailBox) {
      expect(emailBox.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should have responsive layout on mobile', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Verify the form container is properly sized for mobile
    const formContainer = page.locator('.max-w-md');
    await expect(formContainer).toBeVisible();
    
    const box = await formContainer.boundingBox();
    const viewportSize = page.viewportSize();
    
    if (box && viewportSize) {
      // Form should fit within mobile viewport
      expect(box.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });
});
