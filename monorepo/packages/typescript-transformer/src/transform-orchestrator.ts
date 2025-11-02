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
import { getDefaultConfig, validateConfig, shouldProcessFile } from '@tdi2/plugin-core';
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
        console.log('🔧 Initializing TDI2 TypeScript transformer...');
        console.log(`📂 Scan directories: ${this.options.scanDirs?.join(', ')}`);
      }

      // Step 1: Run class-based DI transformer for interface resolution
      if (this.options.verbose) {
        console.log('🔍 Building interface resolution map...');
      }

      const classTransformer = new EnhancedDITransformer({
        scanDirs: this.options.scanDirs,
        outputDir: this.options.outputDir,
        verbose: this.options.verbose,
        enableInterfaceResolution: this.options.enableInterfaceResolution,
        customSuffix: this.options.customSuffix,
      });

      await classTransformer.transform();
      await classTransformer.save();

      // Step 2: Run functional DI transformer
      if (this.options.enableFunctionalDI) {
        if (this.options.verbose) {
          console.log('🎯 Transforming functional components...');
        }

        const functionalTransformer = new FunctionalDIEnhancedTransformer({
          scanDirs: this.options.scanDirs,
          outputDir: this.options.outputDir,
          generateDebugFiles: this.options.generateDebugFiles,
          verbose: this.options.verbose,
          customSuffix: this.options.customSuffix,
          enableParameterNormalization: this.options.enableParameterNormalization,
          generateFallbacks: this.options.generateFallbacks,
        });

        // This transforms ALL files and returns a Map<filePath, transformedContent>
        this.transformedFilesCache = await functionalTransformer.transformForBuild();

        this.stats.filesTransformed = this.transformedFilesCache.size;

        if (this.options.verbose) {
          console.log(`✅ Transformed ${this.transformedFilesCache.size} files`);
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
   * Transform a single source file (synchronous after initialization)
   */
  transformSourceFile(sourceFile: ts.SourceFile): TransformResult {
    this.stats.filesProcessed++;

    try {
      const filePath = sourceFile.fileName;
      const content = sourceFile.getFullText();

      // Use plugin-core's shouldProcessFile utility
      if (!shouldProcessFile(filePath, this.options.advanced?.fileExtensions ?? ['.ts', '.tsx'])) {
        this.stats.filesSkipped++;
        return {
          sourceFile,
          wasTransformed: false,
        };
      }

      // Skip generated files and node_modules
      if (
        filePath.includes('node_modules') ||
        filePath.includes(this.options.outputDir!) ||
        filePath.includes('.tdi2')
      ) {
        this.stats.filesSkipped++;
        return {
          sourceFile,
          wasTransformed: false,
        };
      }

      // Check if file was transformed during initialization
      const transformedContent = this.getTransformedContent(filePath);

      if (!transformedContent || transformedContent === content) {
        this.stats.filesSkipped++;
        return {
          sourceFile,
          wasTransformed: false,
        };
      }

      if (this.options.verbose) {
        console.log(`🔄 Using transformed version of ${filePath}`);
      }

      // Create new TypeScript source file with transformed content
      const newSourceFile = this.options.tsInstance.createSourceFile(
        sourceFile.fileName,
        transformedContent,
        sourceFile.languageVersion,
        true // setParentNodes
      );

      return {
        sourceFile: newSourceFile,
        wasTransformed: true,
      };
    } catch (error) {
      this.stats.errors++;
      console.error(`❌ Unexpected error transforming ${sourceFile.fileName}:`, error);
      return {
        sourceFile,
        wasTransformed: false,
        diagnostics: [this.createDiagnostic(sourceFile, String(error))],
      };
    }
  }

  /**
   * Ensure initialization is complete (call this before transforming files)
   */
  async ensureInitialized(): Promise<void> {
    await this.initialize();
  }

  /**
   * Create a TypeScript diagnostic for errors
   */
  private createDiagnostic(sourceFile: ts.SourceFile, message: string): ts.Diagnostic {
    return {
      category: this.options.tsInstance.DiagnosticCategory.Error,
      code: 9999,
      file: sourceFile,
      start: 0,
      length: 0,
      messageText: `TDI2 Transformer Error: ${message}`,
    };
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
