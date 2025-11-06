// tools/functional-di-enhanced-transformer/types.ts - Types for functional DI transformation

import type { DependencyBase } from '../interface-resolver/interface-resolver-types';

/**
 * Represents a dependency used in functional component transformation.
 * Extends DependencyBase with transformer-specific properties.
 */
export interface FunctionalDependency extends DependencyBase {
  /** 
   * The property name in the component props (e.g., "userService")
   * Generated from the interface type name
   */
  serviceKey: string;
}

export interface TransformationOptions {
  scanDirs?: string[]; // Array of directories to scan
  verbose?: boolean; // Enable verbose logging
  outputDir?: string; // Output directory for transformed files
  preserveOriginal?: boolean; // Whether to preserve original files
  transformPatterns?: string[]; // File patterns to transform
  skipPatterns?: string[]; // File patterns to skip
  generateDebugFiles?: boolean; // Whether to generate debug files for transformed components
}

export interface TypeResolutionContext {
  currentFile: string; // Current file being processed
  importMap: Map<string, string>; // Map of type names to import paths
  resolvedTypes: Set<string>; // Types that have been resolved
  circularRefs: Set<string>; // Circular reference detection
}

export interface ComponentTransformResult {
  success: boolean; // Whether transformation succeeded
  transformedCode?: string; // The transformed code
  dependencies: FunctionalDependency[]; // Dependencies found
  errors: string[]; // Any errors encountered
  warnings: string[]; // Any warnings generated
}

export interface ProjectTransformResult {
  totalFiles: number; // Total files processed
  transformedFiles: number; // Successfully transformed files
  failedFiles: number; // Files that failed transformation
  dependencies: Map<string, FunctionalDependency[]>; // Dependencies by file
  errors: string[]; // Global errors
  warnings: string[]; // Global warnings
}

export type DICodeGenerationResult = {
  statements: string[];
  serviceKeys: string[];
};
