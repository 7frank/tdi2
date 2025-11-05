/**
 * Performance tracking utilities
 */

import type { PerformanceStats } from './types';

export class PerformanceTracker {
  private stats: PerformanceStats;
  private transformStartTime: number = 0;
  private scanStartTime: number = 0;

  constructor() {
    this.stats = {
      transformationTime: 0,
      scanTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
    };
  }

  /**
   * Start tracking transformation time
   */
  startTransformation(): void {
    this.transformStartTime = Date.now();
  }

  /**
   * End tracking transformation time
   */
  endTransformation(): void {
    if (this.transformStartTime > 0) {
      this.stats.transformationTime += Date.now() - this.transformStartTime;
      this.transformStartTime = 0;
    }
  }

  /**
   * Start tracking scan time
   */
  startScan(): void {
    this.scanStartTime = Date.now();
  }

  /**
   * End tracking scan time
   */
  endScan(): void {
    if (this.scanStartTime > 0) {
      this.stats.scanTime += Date.now() - this.scanStartTime;
      this.scanStartTime = 0;
    }
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.stats.cacheHits++;
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.stats.cacheMisses++;
  }

  /**
   * Record an error
   */
  recordError(): void {
    this.stats.errors++;
  }

  /**
   * Get current statistics
   */
  getStats(): Readonly<PerformanceStats> {
    return { ...this.stats };
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.stats = {
      transformationTime: 0,
      scanTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
    };
    this.transformStartTime = 0;
    this.scanStartTime = 0;
  }

  /**
   * Get cache hit rate as a percentage
   */
  getCacheHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total === 0 ? 0 : (this.stats.cacheHits / total) * 100;
  }

  /**
   * Format statistics as a readable string
   */
  formatStats(): string {
    const hitRate = this.getCacheHitRate().toFixed(1);
    return `
📊 Performance Statistics:
   Transformation time: ${this.stats.transformationTime}ms
   Scan time: ${this.stats.scanTime}ms
   Cache hits: ${this.stats.cacheHits}
   Cache misses: ${this.stats.cacheMisses}
   Cache hit rate: ${hitRate}%
   Errors: ${this.stats.errors}
    `.trim();
  }
}

/**
 * Create a new performance tracker instance
 */
export function createPerformanceTracker(): PerformanceTracker {
  return new PerformanceTracker();
}
