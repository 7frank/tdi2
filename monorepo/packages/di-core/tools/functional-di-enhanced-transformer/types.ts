// tools/functional-di-enhanced-transformer/types.ts - Types for functional DI transformation

export interface FunctionalDependency {
  serviceKey: string; // The property name (e.g., "userService")
  interfaceType: string; // The interface type (e.g., "UserServiceInterface")
  sanitizedKey: string; // Sanitized key for lookups
  isOptional: boolean; // Whether the dependency is optional
}

export interface TransformationOptions {
  srcDir?: string; // Source directory for file resolution (backward compat - use scanDirs)
  scanDirs?: string[]; // Array of directories to scan (preferred over srcDir)
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
