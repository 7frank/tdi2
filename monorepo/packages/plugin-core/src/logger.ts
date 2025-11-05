/**
 * Logging utilities for TDI2 plugins
 */

import type { PluginLogger } from './types';

/**
 * Create a logger that respects verbose flag
 */
export function createLogger(verbose: boolean, prefix: string = 'TDI2'): PluginLogger {
  return {
    info(message: string): void {
      if (verbose) {
        console.log(`[${prefix}] ${message}`);
      }
    },

    warn(message: string): void {
      console.warn(`[${prefix}] ⚠️  ${message}`);
    },

    error(message: string): void {
      console.error(`[${prefix}] ❌ ${message}`);
    },

    debug(message: string): void {
      if (verbose) {
        console.debug(`[${prefix}] 🔍 ${message}`);
      }
    },
  };
}

/**
 * Format a file path for logging (relative to cwd)
 */
export function formatFilePath(filePath: string): string {
  const cwd = process.cwd();
  if (filePath.startsWith(cwd)) {
    return filePath.substring(cwd.length + 1);
  }
  return filePath;
}

/**
 * Format time duration for logging
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format file size for logging
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}
