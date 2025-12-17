/**
 * Performance monitoring utilities
 * Helps track FPS and render performance
 */

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private fpsHistory: number[] = [];
  private maxHistoryLength = 60; // Keep last 60 FPS readings

  /**
   * Update FPS counter - call this in animation loop
   */
  update(): void {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    // Update FPS every second
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.fpsHistory.push(this.fps);
      
      // Keep history limited
      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get average FPS over history
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  /**
   * Get minimum FPS over history
   */
  getMinFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return Math.min(...this.fpsHistory);
  }

  /**
   * Get maximum FPS over history
   */
  getMaxFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return Math.max(...this.fpsHistory);
  }

  /**
   * Check if performance is acceptable (>= 30 FPS)
   */
  isPerformanceAcceptable(): boolean {
    return this.getAverageFPS() >= 30;
  }

  /**
   * Get performance stats
   */
  getStats() {
    return {
      current: this.fps,
      average: this.getAverageFPS(),
      min: this.getMinFPS(),
      max: this.getMaxFPS(),
      acceptable: this.isPerformanceAcceptable(),
    };
  }

  /**
   * Reset all stats
   */
  reset(): void {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.fpsHistory = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
