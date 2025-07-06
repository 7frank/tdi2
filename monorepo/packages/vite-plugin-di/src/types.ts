/**
 * Type definitions for the TDI2 Vite plugin
 */

export interface DIPluginOptions {
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
   * Enable file watching for hot reload during development
   * @default true
   */
  watch?: boolean;

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
   * Automatically clean old configuration files
   * @default true
   */
  cleanOldConfigs?: boolean;

  /**
   * Number of recent configurations to keep when cleaning
   * @default 3
   */
  keepConfigCount?: number;

  /**
   * Reuse existing valid configurations instead of regenerating
   * @default true
   */
  reuseExistingConfig?: boolean;

  /**
   * Additional configuration for advanced use cases
   */
  advanced?: {
    /**
     * Custom file extensions to scan for DI patterns
     * @default ['.ts', '.tsx']
     */
    fileExtensions?: string[];

    /**
     * Custom patterns to detect DI usage
     */
    diPatterns?: {
      serviceDecorator?: RegExp;
      injectDecorator?: RegExp;
      interfaceMarker?: RegExp;
    };

    /**
     * Performance optimization settings
     */
    performance?: {
      /**
       * Enable parallel processing for large codebases
       * @default true
       */
      parallel?: boolean;

      /**
       * Maximum number of files to process concurrently
       * @default 10
       */
      maxConcurrency?: number;

      /**
       * Enable caching of transformation results
       * @default true
       */
      enableCache?: boolean;
    };
  };
}

export interface TransformationSummary {
  count: number;
  functions: string[];
  transformedFiles: string[];
  resolvedDependencies: number;
  errors: Array<{
    file: string;
    error: string;
  }>;
}

export interface ConfigInfo {
  hash: string;
  configDir: string;
  bridgeDir: string;
  isValid: boolean;
  timestamp: string;
  metadata?: {
    enableFunctionalDI: boolean;
    enableInterfaceResolution: boolean;
    packageName: string;
    environment: string;
  };
}

export interface InterfaceImplementation {
  sanitizedKey: string;
  interfaceName: string;
  implementationClass: string;
  filePath: string;
  isGeneric: boolean;
  typeParameters: string[];
  registrationType: 'interface' | 'class' | 'inheritance' | 'state';
}

export interface ServiceDependency {
  serviceClass: string;
  filePath: string;
  constructorParams: Array<{
    paramName: string;
    interfaceType: string;
    isOptional: boolean;
    sanitizedKey: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  missingImplementations: string[];
  circularDependencies: string[];
  warnings: string[];
}

export interface InterfaceResolutionInfo {
  implementations: InterfaceImplementation[];
  dependencies: ServiceDependency[];
  validation: ValidationResult;
  stats: {
    totalInterfaces: number;
    totalImplementations: number;
    totalDependencies: number;
    registrationTypes: Record<string, number>;
  };
}

export interface DIDebugInfo {
  config: ConfigInfo;
  transformedFiles: string[];
  functionalSummary: TransformationSummary;
  interfaceResolution: InterfaceResolutionInfo | null;
  options: DIPluginOptions;
  timestamp: string;
  performance?: {
    transformationTime: number;
    scanTime: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

/**
 * Plugin preset configurations for common use cases
 */
export interface DIPluginPreset {
  name: string;
  description: string;
  options: DIPluginOptions;
}

/**
 * Hot module replacement context for DI files
 */
export interface DIHotUpdateContext {
  file: string;
  hasDIPatterns: boolean;
  affectedModules: string[];
  requiresFullReload: boolean;
}

/**
 * Build context information
 */
export interface DIBuildContext {
  mode: 'development' | 'production' | 'test';
  isWatch: boolean;
  transformedCount: number;
  errors: string[];
  warnings: string[];
}