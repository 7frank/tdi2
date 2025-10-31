/**
 * Type definitions for TDI2 TypeScript transformer plugin
 */

import type * as ts from 'typescript';

/**
 * Plugin configuration that can be specified in tsconfig.json
 */
export interface TDI2TransformerConfig {
  /**
   * Source directory to scan for DI decorators and interfaces
   * @default './src'
   */
  srcDir?: string;

  /**
   * Output directory for generated DI configuration files
   * @default './src/generated'
   */
  outputDir?: string;

  /**
   * Enable verbose logging for debugging
   * @default false
   */
  verbose?: boolean;

  /**
   * Enable functional component dependency injection transformation
   * @default true
   */
  enableFunctionalDI?: boolean;

  /**
   * Enable automatic interface-to-implementation resolution
   * @default true
   */
  enableInterfaceResolution?: boolean;

  /**
   * Generate debug files for transformation inspection
   * @default false
   */
  generateDebugFiles?: boolean;

  /**
   * Custom suffix for configuration identification
   */
  customSuffix?: string;

  /**
   * Enable parameter normalization in functional components
   * @default true
   */
  enableParameterNormalization?: boolean;

  /**
   * Generate fallback implementations for missing dependencies
   * @default false
   */
  generateFallbacks?: boolean;
}

/**
 * Extended plugin configuration from ts-patch
 */
export interface PluginConfig extends TDI2TransformerConfig {
  /**
   * Name of the transformer (auto-populated by ts-patch)
   */
  transform?: string;

  /**
   * Apply transformer after TypeScript's own transformers
   * @default false
   */
  after?: boolean;

  /**
   * Transform the entire Program (not just SourceFile)
   * @default false
   */
  transformProgram?: boolean;

  /**
   * Type of transformer
   */
  type?: 'program' | 'config' | 'checker' | 'raw' | 'compilerOptions';

  /**
   * Additional custom options
   */
  [key: string]: any;
}

/**
 * Transformer extras provided by ts-patch
 */
export interface TransformerExtras {
  /**
   * TypeScript instance being used
   */
  ts: typeof ts;

  /**
   * Additional library instances
   */
  library?: string;

  /**
   * Diagnostics collector
   */
  addDiagnostic?: (diagnostic: ts.Diagnostic) => number;
}

/**
 * Result of a file transformation
 */
export interface TransformResult {
  /**
   * The transformed source file
   */
  sourceFile: ts.SourceFile;

  /**
   * Whether the file was actually transformed
   */
  wasTransformed: boolean;

  /**
   * Any diagnostics generated during transformation
   */
  diagnostics?: ts.Diagnostic[];
}

/**
 * Options for the transformation orchestrator
 */
export interface TransformOrchestratorOptions extends TDI2TransformerConfig {
  /**
   * TypeScript program instance
   */
  program: ts.Program;

  /**
   * TypeScript instance
   */
  tsInstance: typeof ts;

  /**
   * Transformation context
   */
  context: ts.TransformationContext;
}

/**
 * Statistics about transformation
 */
export interface TransformStats {
  /**
   * Total files processed
   */
  filesProcessed: number;

  /**
   * Files that were transformed
   */
  filesTransformed: number;

  /**
   * Files that were skipped
   */
  filesSkipped: number;

  /**
   * Dependencies resolved
   */
  dependenciesResolved: number;

  /**
   * Errors encountered
   */
  errors: number;

  /**
   * Warnings generated
   */
  warnings: number;
}
