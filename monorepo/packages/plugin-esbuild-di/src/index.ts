/**
 * @tdi2/esbuild-plugin-di
 *
 * esbuild plugin for TDI2 dependency injection
 */

import type { Plugin, OnLoadResult } from 'esbuild';
import * as fs from 'fs';
import {
  getDefaultConfig,
  validateConfig,
  shouldProcessFile,
  TransformOrchestrator,
  createPerformanceTracker,
  type PluginConfig,
} from '@tdi2/plugin-core';

export interface EsbuildPluginDIOptions extends PluginConfig {}

/**
 * TDI2 esbuild Plugin
 *
 * Integrates TDI2 dependency injection transformations into the esbuild build process.
 *
 * @example
 * ```javascript
 * import { tdi2Plugin } from '@tdi2/esbuild-plugin-di';
 * import * as esbuild from 'esbuild';
 *
 * await esbuild.build({
 *   entryPoints: ['src/index.ts'],
 *   bundle: true,
 *   plugins: [
 *     tdi2Plugin({
 *       srcDir: './src',
 *       enableFunctionalDI: true
 *     })
 *   ]
 * });
 * ```
 */
export function tdi2Plugin(userOptions: EsbuildPluginDIOptions = {}): Plugin {
  const config = getDefaultConfig(userOptions);
  validateConfig(config);

  let orchestrator: TransformOrchestrator;
  const performanceTracker = createPerformanceTracker();
  let initialized = false;

  return {
    name: 'tdi2-esbuild-plugin',

    setup(build) {
      // Initialize on build start
      build.onStart(async () => {
        performanceTracker.startTransformation();

        try {
          orchestrator = new TransformOrchestrator({
            ...config,
            pluginName: 'esbuild',
          });

          await orchestrator.initialize();
          initialized = true;
          performanceTracker.recordCacheHit();
        } catch (error) {
          performanceTracker.recordError();
          console.error('❌ TDI2 initialization failed:', error);
          return {
            errors: [
              {
                text: `TDI2 initialization failed: ${error}`,
              },
            ],
          };
        }

        performanceTracker.endTransformation();
      });

      // Transform files
      build.onLoad({ filter: /\.(ts|tsx)$/ }, async (args): Promise<OnLoadResult | null> => {
        if (!initialized || !orchestrator) {
          return null;
        }

        // Check if file should be processed
        if (!shouldProcessFile(args.path, config.advanced.fileExtensions ?? ['.ts', '.tsx'])) {
          return null;
        }

        try {
          // Read original file
          const originalCode = await fs.promises.readFile(args.path, 'utf8');

          // Transform
          const result = orchestrator.transformFile(args.path, originalCode);

          if (result.wasTransformed) {
            performanceTracker.recordCacheHit();

            return {
              contents: result.code,
              loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts',
            };
          }

          performanceTracker.recordCacheMiss();
          return null;
        } catch (error) {
          performanceTracker.recordError();
          console.error(`❌ TDI2 transformation failed for ${args.path}:`, error);
          return null;
        }
      });

      // Report statistics on build end
      build.onEnd(() => {
        // Statistics available via DEBUG environment variable
      });
    },
  };
}

// Default export
export default tdi2Plugin;
