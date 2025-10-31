/**
 * Shared types for TDI2 build tool plugins
 */

/**
 * Base plugin configuration shared across all build tools
 */
export interface BasePluginConfig {
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
 * Advanced configuration options
 */
export interface AdvancedPluginConfig {
  /**
   * File extensions to process
   * @default ['.ts', '.tsx']
   */
  fileExtensions?: string[];

  /**
   * Custom regex patterns for detecting DI usage
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
     * Enable parallel processing
     * @default true
     */
    parallel?: boolean;

    /**
     * Maximum number of concurrent operations
     * @default 10
     */
    maxConcurrency?: number;

    /**
     * Enable result caching
     * @default true
     */
    enableCache?: boolean;
  };
}

/**
 * Complete plugin configuration with advanced options
 */
export interface PluginConfig extends BasePluginConfig {
  advanced?: AdvancedPluginConfig;
}

/**
 * DI pattern detection result
 */
export interface DIPatternDetection {
  /**
   * Whether the content contains any DI patterns
   */
  hasDI: boolean;

  /**
   * Whether the content contains @Service decorator
   */
  hasService: boolean;

  /**
   * Whether the content contains Inject<> type usage
   */
  hasInject: boolean;

  /**
   * Whether the content contains interface implementations
   */
  hasInterface: boolean;

  /**
   * Whether the content contains React components
   */
  hasComponent: boolean;
}

/**
 * Performance tracking statistics
 */
export interface PerformanceStats {
  /**
   * Total transformation time in milliseconds
   */
  transformationTime: number;

  /**
   * Time spent scanning files in milliseconds
   */
  scanTime: number;

  /**
   * Number of cache hits
   */
  cacheHits: number;

  /**
   * Number of cache misses
   */
  cacheMisses: number;

  /**
   * Number of errors encountered
   */
  errors: number;
}

/**
 * Transformation result
 */
export interface TransformResult {
  /**
   * Transformed code content
   */
  code: string;

  /**
   * Source map if available
   */
  map?: string | null;

  /**
   * Whether the file was actually transformed
   */
  wasTransformed: boolean;

  /**
   * Any warnings generated during transformation
   */
  warnings?: string[];
}

/**
 * File filter function
 */
export type FileFilter = (id: string) => boolean;

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}
