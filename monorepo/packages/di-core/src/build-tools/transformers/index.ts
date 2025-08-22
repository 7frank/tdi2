// tools/functional-di-enhanced-transformer/index.ts - Public API

// Main transformer
export { FunctionalDIEnhancedTransformer } from './functional-di-enhanced-transformer.js';

// Individual components (only export what exists)
export { ImportManager } from './import-manager.js';
export { DebugFileGenerator } from './debug-file-generator.js';
export { PropertyAccessUpdater } from './property-access-updater.js';

// Transformation pipeline
export { TransformationPipeline } from './transformation-pipeline.js';

// Types and interfaces
export type {
  FunctionalDependency,
  TransformationOptions,
  DICodeGenerationResult,
  ParameterAnalysisResult,
  TypeResolutionContext,
  TransformationContext
} from './types.js';

// Utility functions
export * from './utils.js';