// tools/functional-di-enhanced-transformer/index.ts - Public API

// Main transformer
export { FunctionalDIEnhancedTransformer } from './functional-di-enhanced-transformer';

// Individual components
export { DependencyExtractor } from './dependency-extractor';
export { ComponentTransformer } from './component-transformer';
export { ImportManager } from './import-manager';
export { CodeGenerator } from './code-generator';
export { DestructuringProcessor } from './destructuring-processor';
export { DebugFileGenerator } from './debug-file-generator';

// Types and interfaces
export type {
  FunctionalDependency,
  TransformationOptions,
  DICodeGenerationResult,
  ParameterAnalysisResult,
  TypeResolutionContext,
  TransformationContext
} from './types';

// Utility functions
export * from './utils';