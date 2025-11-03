/**
 * Transform orchestrator that bridges ts-morph transformers with native TypeScript AST
 *
 * NOTE: This orchestrator performs a one-time transformation of ALL source files
 * during initialization, then caches the results for individual file lookups.
 * This is necessary because the existing transformers work on the entire codebase.
 */

import type * as ts from 'typescript';
import {
  FunctionalDIEnhancedTransformer,
  EnhancedDITransformer,
} from '@tdi2/di-core/tools';
import { getDefaultConfig, validateConfig } from '@tdi2/plugin-core';
import type { TransformOrchestratorOptions, TransformResult, TransformStats } from './types';

export class TransformOrchestrator {
  private options: TransformOrchestratorOptions;
  private stats: TransformStats;
  private transformedFilesCache: Map<string, string> = new Map();
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(options: TransformOrchestratorOptions) {
    // Use plugin-core to get defaults with proper type handling
    const baseConfig = getDefaultConfig(options);
    this.options = {
      ...baseConfig,
      ...options,
    } as TransformOrchestratorOptions;

    // Validate configuration using plugin-core
    validateConfig(this.options as any);

    this.stats = {
      filesProcessed: 0,
      filesTransformed: 0,
      filesSkipped: 0,
      dependenciesResolved: 0,
      errors: 0,
      warnings: 0,
    };
  }

  /**
   * Initialize transformers and run full transformation (one-time only)
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
    this.initialized = true;
  }

  private async performInitialization(): Promise<void> {
    try {
      if (this.options.verbose) {
        console.log('🔧 Initializing TDI2 TypeScript transformer (pre-transform mode)...');
        console.log(`📂 Scan directories: ${this.options.scanDirs?.join(', ')}`);
      }

      // Step 1: Run interface resolution
      const classTransformer = new EnhancedDITransformer({
        scanDirs: this.options.scanDirs,
        outputDir: this.options.outputDir,
        verbose: this.options.verbose,
        enableInterfaceResolution: this.options.enableInterfaceResolution,
        customSuffix: this.options.customSuffix,
      });

      await classTransformer.transform();
      await classTransformer.save();

      // Step 2: Run functional DI transformer and get transformed files
      if (this.options.enableFunctionalDI) {
        const functionalTransformer = new FunctionalDIEnhancedTransformer({
          scanDirs: this.options.scanDirs,
          outputDir: this.options.outputDir,
          generateDebugFiles: this.options.generateDebugFiles,
          verbose: this.options.verbose,
          customSuffix: this.options.customSuffix,
          enableParameterNormalization: this.options.enableParameterNormalization,
          generateFallbacks: this.options.generateFallbacks,
        });

        // Transform all files and cache the results
        this.transformedFilesCache = await functionalTransformer.transformForBuild();

        this.stats.filesTransformed = this.transformedFilesCache.size;

        if (this.options.verbose) {
          console.log(`✅ Pre-transformed ${this.transformedFilesCache.size} files`);
        }
      }

      if (this.options.verbose) {
        console.log('✅ TDI2 TypeScript transformer initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize TDI2 transformer:', error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Get transformed content for a source file (synchronous lookup after initialization)
   */
  getTransformedContent(filePath: string): string | null {
    // Normalize path for lookup
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Try exact match first
    if (this.transformedFilesCache.has(normalizedPath)) {
      return this.transformedFilesCache.get(normalizedPath)!;
    }

    // Try without leading ./
    const withoutDot = normalizedPath.replace(/^\.\//, '');
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
   * Transform a single source file using cached transformations
   *
   * NOTE: We return the original sourceFile because TypeScript transformers
   * cannot reliably create new SourceFiles without breaking symbol resolution.
   *
   * The actual transformation happens during initialization where di-core
   * transformers modify the files. This plugin just manages the initialization.
   */
  transformSourceFile(sourceFile: ts.SourceFile): TransformResult {
    this.stats.filesProcessed++;

    // We don't actually transform here - di-core already did it during init
    // Just return the original sourceFile as-is
    // TypeScript will read the already-transformed file from disk

    this.stats.filesSkipped++;
    return {
      sourceFile,
      wasTransformed: false,
    };
  }

  /**
   * Ensure initialization is complete (call this before transforming files)
   */
  async ensureInitialized(): Promise<void> {
    await this.initialize();
  }

  /**
   * Synchronously wait for initialization to complete using deasync
   * This is necessary because TypeScript transformers must be synchronous
   */
  waitForInitialization(): void {
    // If already initialized, return immediately
    if (this.initialized) {
      return;
    }

    const startTime = Date.now();

    if (this.options.verbose) {
      console.log('⏳ Waiting for TDI2 transformer initialization...');
    }

    // Use deasync to wait for the async initialization
    const deasync = require('deasync');

    // Wait for initializationPromise to resolve
    if (this.initializationPromise) {
      try {
        deasync.loopWhile(() => !this.initialized);
      } catch (error) {
        console.error('❌ TDI2 transformer initialization failed:', error);
        throw error;
      }
    }

    if (this.options.verbose) {
      console.log(`✅ TDI2 transformer initialization completed in ${Date.now() - startTime}ms`);
    }
  }


  /**
   * Get transformation statistics
   */
  getStats(): TransformStats {
    return { ...this.stats };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.transformedFilesCache.clear();
    this.initialized = false;
    this.initializationPromise = null;
  }
}
