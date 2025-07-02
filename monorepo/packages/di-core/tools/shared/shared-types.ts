// tools/shared/shared-types.ts

import type { SourceFile, ClassDeclaration, FunctionDeclaration, ArrowFunction } from 'ts-morph';

/**
 * Common transformation options used across all shared services
 */
export interface SharedTransformationOptions {
  srcDir: string;
  outputDir: string;
  verbose: boolean;
  enableInterfaceResolution: boolean;
  enableInheritanceDI: boolean;
  enableStateDI: boolean;
  customSuffix?: string;
}

/**
 * Transformation candidate represents a code element that can be transformed
 */
export interface TransformationCandidate {
  type: 'class' | 'function' | 'arrow-function';
  node: ClassDeclaration | FunctionDeclaration | ArrowFunction;
  filePath: string;
  sourceFile: SourceFile;
  metadata?: {
    hasServiceDecorator?: boolean;
    hasInjectMarkers?: boolean;
    componentName?: string;
    isReactComponent?: boolean;
  };
}

/**
 * Context information for transformations
 */
export interface TransformationContext {
  candidate: TransformationCandidate;
  configHash: string;
  environment: 'development' | 'production' | 'test';
  timestamp: string;
}

/**
 * Result of a transformation operation
 */
export interface TransformationResult {
  transformedFiles: Map<string, TransformedContent>;
  summary: TransformationSummary;
  errors: TransformationError[];
  warnings: TransformationWarning[];
}

/**
 * Content that has been transformed
 */
export interface TransformedContent {
  originalContent: string;
  transformedContent: string;
  imports: string[];
  statements: string[];
  removedElements: string[];
  addedElements: string[];
  filePath: string;
  transformationType: 'class-injection' | 'function-hooks';
}

/**
 * Summary of transformation operation
 */
export interface TransformationSummary {
  totalCandidates: number;
  successfulTransformations: number;
  failedTransformations: number;
  skippedTransformations: number;
  dependenciesResolved: number;
  dependenciesUnresolved: number;
  byType: {
    class: number;
    function: number;
    arrowFunction: number;
  };
  byResolutionStrategy: {
    interface: number;
    inheritance: number;
    state: number;
    class: number;
    notFound: number;
  };
  performance: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

/**
 * Transformation error
 */
export interface TransformationError {
  type: 'resolution-error' | 'generation-error' | 'validation-error' | 'file-error';
  message: string;
  sourceLocation?: string;
  candidate?: TransformationCandidate;
  details?: any;
}

/**
 * Transformation warning
 */
export interface TransformationWarning {
  type: 'optional-missing' | 'multiple-implementations' | 'deprecated-pattern' | 'performance';
  message: string;
  sourceLocation?: string;
  suggestion?: string;
}

/**
 * Validation result for dependencies or configurations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

/**
 * Validation error
 */
export interface ValidationError {
  type: 'missing-implementation' | 'circular-dependency' | 'type-mismatch' | 'configuration-error';
  message: string;
  location?: string;
  affectedServices?: string[];
  severity: 'error' | 'warning';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  type: 'performance' | 'style' | 'compatibility' | 'suggestion';
  message: string;
  location?: string;
  recommendation?: string;
}

/**
 * Code generation target specification
 */
export interface CodeGenerationTarget {
  type: 'class-injection' | 'function-hooks';
  context: TransformationContext;
  dependencies: import('./SharedDependencyExtractor').ExtractedDependency[];
  outputOptions: {
    addImports: boolean;
    removeOriginalDestructuring: boolean;
    generateDebugComments: boolean;
    minimizeOutput: boolean;
  };
}

/**
 * Generated code result
 */
export interface GeneratedCode {
  imports: string[];
  statements: string[];
  removedStatements: string[];
  registrations: import('./SharedServiceRegistry').ServiceRegistration[];
  metadata: {
    dependencyCount: number;
    hookCount: number;
    importCount: number;
    hasErrors: boolean;
    warnings: string[];
  };
}

/**
 * Interface information extracted from AST
 */
export interface ExtractedInterfaceInfo {
  name: string;                    // Base interface name
  fullType: string;               // Full type with generics
  isGeneric: boolean;
  typeParameters: string[];
  sourceLocation: string;
  extractionMethod: 'implements' | 'extends' | 'heritage-clause';
}

/**
 * Service class metadata
 */
export interface ServiceClassMetadata {
  className: string;
  filePath: string;
  hasServiceDecorator: boolean;
  implementedInterfaces: ExtractedInterfaceInfo[];
  inheritanceInfo: {
    hasInheritance: boolean;
    baseClasses: string[];
    inheritanceChain: string[];
  };
  constructorInfo: {
    hasConstructor: boolean;
    parameterCount: number;
    hasInjectDecorators: boolean;
  };
}

/**
 * Function component metadata
 */
export interface FunctionComponentMetadata {
  functionName: string;
  filePath: string;
  isArrowFunction: boolean;
  parameterInfo: {
    hasParameters: boolean;
    firstParameterType?: string;
    hasInjectMarkers: boolean;
  };
  returnsJSX: boolean;
  isReactComponent: boolean;
}

/**
 * Dependency resolution statistics
 */
export interface ResolutionStatistics {
  totalRequests: number;
  successfulResolutions: number;
  failedResolutions: number;
  cacheHits: number;
  cacheMisses: number;
  averageResolutionTime: number;
  byStrategy: Record<string, number>;
  byInterfaceType: Record<string, number>;
}

/**
 * Performance metrics for transformation operations
 */
export interface PerformanceMetrics {
  scanTime: number;               // Time to scan project
  resolutionTime: number;         // Time to resolve dependencies
  generationTime: number;         // Time to generate code
  writeTime: number;              // Time to write files
  totalTime: number;              // Total transformation time
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  fileStats: {
    filesScanned: number;
    filesTransformed: number;
    linesGenerated: number;
    bytesGenerated: number;
  };
}

/**
 * Configuration for debugging and development
 */
export interface DebugConfiguration {
  enableVerboseLogging: boolean;
  generateDebugFiles: boolean;
  includeSourceMaps: boolean;
  preserveComments: boolean;
  generateStats: boolean;
  outputDebugUrls: boolean;
  logResolutionSteps: boolean;
  trackPerformance: boolean;
}

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfiguration {
  nodeEnv: 'development' | 'production' | 'test';
  enableHotReload: boolean;
  enableOptimizations: boolean;
  generateMinified: boolean;
  includeDevelopmentWarnings: boolean;
  enableTypeChecking: boolean;
}