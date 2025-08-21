// TDI2 Debug Tools - Analytics, CLI, and Web Dashboard for DI Analysis

// Analytics exports
export * from './analytics/index.js';

// Container analytics bridge utilities
export * from './utils/container-analytics.js';

// Serve functionality (for programmatic usage)
export * from './serve/index.js';

// Re-export types for convenience
export type {
  AnalyticsConfig,
  DependencyGraph,
  ValidationResult,
  ResolutionPath,
  GraphVisualizationOptions,
  ValidationIssue,
  ContainerInspectionResult
} from './analytics/types.js';

export type {
  ServerOptions,
  WebSocketMessage,
  AnalysisResponse,
  GraphResponse
} from './serve/types.js';