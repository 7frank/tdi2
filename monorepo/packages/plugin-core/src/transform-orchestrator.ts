/**
 * Shared transformation orchestrator for all TDI2 plugins
 */

import {
  FunctionalDIEnhancedTransformer,
  EnhancedDITransformer,
} from '@tdi2/di-core/tools';
import type { PluginConfig, TransformResult } from './types';
import { createLogger } from './logger';

export interface OrchestratorOptions extends Required<PluginConfig> {
  /**
   * Plugin name for logging
   */
  pluginName?: string;
}

/**
 * Orchestrates DI transformations for any build tool
 */
export class TransformOrchestrator {
  private options: OrchestratorOptions;
  private transformedFilesCache: Map<string, string> = new Map();
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private logger;

  constructor(options: OrchestratorOptions) {
    this.options = options;
    this.logger = createLogger(options.verbose, options.pluginName || 'TDI2');
  }

  /**
   * Initialize transformers (runs once, cached thereafter)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.performInitialization();
    await this.initPromise;
    this.initialized = true;
  }

  private async performInitialization(): Promise<void> {
    try {
      this.logger.info('Initializing TDI2 transformers...');
      this.logger.debug(`Source directory: ${this.options.srcDir}`);

      // Step 1: Run class-based DI transformer for interface resolution
      this.logger.debug('Building interface resolution map...');

      const classTransformer = new EnhancedDITransformer({
        srcDir: this.options.srcDir,
        outputDir: this.options.outputDir,
        verbose: this.options.verbose,
        enableInterfaceResolution: this.options.enableInterfaceResolution,
        customSuffix: this.options.customSuffix,
      });

      await classTransformer.transform();
      await classTransformer.save();

      // Step 2: Run functional DI transformer
      if (this.options.enableFunctionalDI) {
        this.logger.debug('Transforming functional components...');

        const functionalTransformer = new FunctionalDIEnhancedTransformer({
          srcDir: this.options.srcDir,
          outputDir: this.options.outputDir,
          generateDebugFiles: this.options.generateDebugFiles,
          verbose: this.options.verbose,
          customSuffix: this.options.customSuffix,
          enableParameterNormalization: this.options.enableParameterNormalization,
          generateFallbacks: this.options.generateFallbacks,
        });

        // Transform all files and cache results
        this.transformedFilesCache = await functionalTransformer.transformForBuild();

        this.logger.info(`✅ Transformed ${this.transformedFilesCache.size} files`);
      }

      this.logger.info('✅ TDI2 transformers initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize: ${error}`);
      throw error;
    }
  }

  /**
   * Get transformed content for a file (returns null if not transformed)
   */
  getTransformedContent(filePath: string): string | null {
    // Normalize path for lookup
    const normalized = filePath.replace(/\\/g, '/');

    // Try exact match
    if (this.transformedFilesCache.has(normalized)) {
      return this.transformedFilesCache.get(normalized)!;
    }

    // Try without leading ./
    const withoutDot = normalized.replace(/^\.\//, '');
    if (this.transformedFilesCache.has(withoutDot)) {
      return this.transformedFilesCache.get(withoutDot)!;
    }

    // Try with leading ./
    const withDot = `./${withoutDot}`;
    if (this.transformedFilesCache.has(withDot)) {
      return this.transformedFilesCache.get(withDot)!;
    }

    return null;
  }

  /**
   * Transform a file (synchronous lookup after initialization)
   */
  transformFile(filePath: string, originalCode: string): TransformResult {
    const transformedCode = this.getTransformedContent(filePath);

    if (transformedCode && transformedCode !== originalCode) {
      this.logger.debug(`Using transformed version of ${filePath}`);
      return {
        code: transformedCode,
        map: null,
        wasTransformed: true,
      };
    }

    return {
      code: originalCode,
      map: null,
      wasTransformed: false,
    };
  }

  /**
   * Check if orchestrator is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get number of transformed files
   */
  getTransformedFileCount(): number {
    return this.transformedFilesCache.size;
  }

  /**
   * Clear cache and reset state
   */
  dispose(): void {
    this.transformedFilesCache.clear();
    this.initialized = false;
    this.initPromise = null;
  }
}
