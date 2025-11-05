/**
 * @tdi2/plugin-core
 *
 * Shared utilities for TDI2 build tool plugins
 */

// Export configuration utilities
export {
  getDefaultConfig,
  validateConfig,
  normalizePath,
  shouldProcessFile,
} from './config';

// Export pattern detection
export {
  detectDIPatterns,
  quickDICheck,
  isServiceFile,
  isComponentFile,
} from './pattern-detection';

// Export performance tracking
export {
  PerformanceTracker,
  createPerformanceTracker,
} from './performance-tracker';

// Export logging utilities
export {
  createLogger,
  formatFilePath,
  formatDuration,
  formatFileSize,
} from './logger';

// Export transformation orchestrator
export {
  TransformOrchestrator,
  type OrchestratorOptions,
} from './transform-orchestrator';

// Export types
export type {
  BasePluginConfig,
  AdvancedPluginConfig,
  PluginConfig,
  DIPatternDetection,
  PerformanceStats,
  TransformResult,
  FileFilter,
  PluginLogger,
} from './types';
