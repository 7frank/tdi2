/**
 * TDI2 TypeScript custom transformer for ts-patch
 *
 * This transformer integrates TDI2's dependency injection transformation
 * into the TypeScript compilation process via ts-patch.
 */

import type * as ts from 'typescript';
import type { PluginConfig, TransformerExtras } from './types';
import { TransformOrchestrator } from './transform-orchestrator';

/**
 * Cache orchestrator per program to avoid re-initialization
 */
const orchestratorCache = new WeakMap<ts.Program, TransformOrchestrator>();

/**
 * Main transformer factory function for ts-patch
 *
 * @param program - TypeScript Program instance
 * @param config - Plugin configuration from tsconfig.json
 * @param extras - Additional context from ts-patch
 * @returns TypeScript TransformerFactory
 */
export default function tdi2Transformer(
  program: ts.Program,
  config: PluginConfig,
  extras: TransformerExtras
): ts.TransformerFactory<ts.SourceFile> {
  const { ts: tsInstance } = extras;

  if (config.verbose) {
    console.log('🚀 TDI2 TypeScript Transformer loaded');
    console.log('📋 Configuration:', config);
  }

  // Get or create orchestrator for this program
  let orchestrator = orchestratorCache.get(program);
  if (!orchestrator) {
    orchestrator = new TransformOrchestrator({
      program,
      tsInstance,
      context: null as any, // Context not needed for cache-based approach
      ...config,
    });
    orchestratorCache.set(program, orchestrator);

    // Trigger async initialization immediately
    orchestrator.ensureInitialized().catch((error) => {
      console.error('❌ TDI2 transformer initialization failed:', error);
    });
  }

  /**
   * Return the actual transformer factory
   */
  return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    /**
     * Visitor function for each source file
     * NOTE: This is synchronous - we rely on the orchestrator being pre-initialized
     */
    return (sourceFile: ts.SourceFile): ts.SourceFile => {
      // Skip declaration files
      if (sourceFile.isDeclarationFile) {
        return sourceFile;
      }

      try {
        // Synchronous transformation lookup (orchestrator caches results during initialization)
        const result = orchestrator!.transformSourceFile(sourceFile);

        // Report any diagnostics
        if (result.diagnostics && extras.addDiagnostic) {
          result.diagnostics.forEach((diagnostic) => {
            extras.addDiagnostic!(diagnostic);
          });
        }

        return result.wasTransformed ? result.sourceFile : sourceFile;
      } catch (error) {
        console.error(`❌ TDI2 transformer error for ${sourceFile.fileName}:`, error);
        return sourceFile;
      }
    };
  };
}

/**
 * Cleanup function to dispose orchestrators when program is done
 */
export function cleanup(program: ts.Program): void {
  const orchestrator = orchestratorCache.get(program);
  if (orchestrator) {
    if ((orchestrator as any).options?.verbose) {
      const stats = orchestrator.getStats();
      console.log('\n📊 TDI2 Transformation Summary:');
      console.log(`   Files processed: ${stats.filesProcessed}`);
      console.log(`   Files transformed: ${stats.filesTransformed}`);
      console.log(`   Files skipped: ${stats.filesSkipped}`);
      console.log(`   Dependencies resolved: ${stats.dependenciesResolved}`);
      console.log(`   Errors: ${stats.errors}`);
      console.log(`   Warnings: ${stats.warnings}`);
    }
    orchestrator.dispose();
    orchestratorCache.delete(program);
  }
}
