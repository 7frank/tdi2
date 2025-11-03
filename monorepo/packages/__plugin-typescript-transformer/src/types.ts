/**
 * Type definitions for TDI2 TypeScript transformer plugin
 */

import type * as ts from 'typescript';
import type { PluginConfig as BasePluginConfig } from '@tdi2/plugin-core';

/**
 * Plugin configuration that can be specified in tsconfig.json
 * Extends the base plugin-core configuration
 */
export interface TDI2TransformerConfig extends BasePluginConfig {
  // TypeScript-specific options can be added here
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
