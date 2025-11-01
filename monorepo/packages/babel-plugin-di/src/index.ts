/**
 * @tdi2/babel-plugin-di
 *
 * Babel plugin for TDI2 dependency injection
 */

import {
  getDefaultConfig,
  validateConfig,
  shouldProcessFile,
  TransformOrchestrator,
  type PluginConfig,
} from '@tdi2/plugin-core';

export interface BabelPluginDIOptions extends PluginConfig {}

/**
 * Shared orchestrator instance (reused across files in the same build)
 */
let orchestratorInstance: TransformOrchestrator | null = null;
let initPromise: Promise<void> | null = null;

/**
 * TDI2 Babel Plugin
 *
 * Integrates TDI2 dependency injection transformations into Babel transformation pipeline.
 *
 * @example
 * ```javascript
 * // .babelrc.js or babel.config.js
 * module.exports = {
 *   plugins: [
 *     ['@tdi2/babel-plugin-di', {
 *       srcDir: './src',
 *       enableFunctionalDI: true,
 *       verbose: false
 *     }]
 *   ]
 * };
 * ```
 */
export default function tdi2BabelPlugin(api: any, options: BabelPluginDIOptions = {}): any {
  // Validate Babel version
  api.assertVersion(7);

  const config = getDefaultConfig(options);
  validateConfig(config);

  // Initialize orchestrator once per build process
  async function ensureInitialized(): Promise<void> {
    if (orchestratorInstance) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      if (config.verbose) {
        console.log('🚀 TDI2 Babel Plugin: Initializing...');
      }

      orchestratorInstance = new TransformOrchestrator({
        ...config,
        pluginName: 'Babel',
      });

      await orchestratorInstance.initialize();

      if (config.verbose) {
        console.log('✅ TDI2 Babel Plugin: Initialization complete');
      }
    })();

    await initPromise;
  }

  return {
    name: 'tdi2-babel-plugin',

    // Note: Babel plugins are synchronous, but we need async initialization
    // We'll use a synchronous visitor and rely on pre-initialization
    pre() {
      // Trigger initialization (fire-and-forget, first file will wait)
      ensureInitialized().catch((error) => {
        console.error('❌ TDI2 initialization failed:', error);
      });
    },

    visitor: {
      Program: {
        // Synchronous transformation after initialization
        exit(path: any, state: any) {
          const filename = state.file.opts.filename;

          // Skip if no filename or shouldn't process
          if (!filename || !shouldProcessFile(filename, config.advanced.fileExtensions ?? ['.ts', '.tsx'])) {
            return;
          }

          // Check if orchestrator is ready
          if (!orchestratorInstance) {
            if (config.verbose) {
              console.warn(`⚠️  TDI2 not yet initialized for ${filename}, skipping...`);
            }
            return;
          }

          try {
            // Get original code
            const originalCode = state.file.code;

            // Transform
            const result = orchestratorInstance.transformFile(filename, originalCode);

            if (result.wasTransformed) {
              // Parse transformed code and replace AST
              const transformedAst = api.parse(result.code, state.file.opts.parserOpts);
              path.replaceWith(transformedAst.program);

              if (config.verbose) {
                console.log(`🔄 Transformed: ${filename}`);
              }
            }
          } catch (error) {
            console.error(`❌ TDI2 transformation failed for ${filename}:`, error);
          }
        },
      },
    },

    // Cleanup after all files processed
    post() {
      if (config.verbose && orchestratorInstance) {
        console.log('\n📊 TDI2 Babel Plugin Statistics:');
        console.log(`   Transformed files: ${orchestratorInstance.getTransformedFileCount()}`);
      }
    },
  };
}

/**
 * Cleanup function (can be called manually if needed)
 */
export function cleanup(): void {
  orchestratorInstance?.dispose();
  orchestratorInstance = null;
  initPromise = null;
}
