/**
 * @tdi2/rollup-plugin-di
 *
 * Rollup plugin for TDI2 dependency injection
 */

import type { Plugin } from 'rollup';
import {
  getDefaultConfig,
  validateConfig,
  shouldProcessFile,
  TransformOrchestrator,
  createPerformanceTracker,
  type PluginConfig,
} from '@tdi2/plugin-core';
import { consoleFor } from '@tdi2/di-core/tools';

const console = consoleFor('plugin-rollup-di');

export interface RollupPluginDIOptions extends PluginConfig {}

/**
 * TDI2 Rollup Plugin
 *
 * Integrates TDI2 dependency injection transformations into the Rollup build process.
 *
 * @example
 * ```javascript
 * import { tdi2Plugin } from '@tdi2/rollup-plugin-di';
 *
 * export default {
 *   plugins: [
 *     tdi2Plugin({
 *       srcDir: './src',
 *       enableFunctionalDI: true
 *     })
 *   ]
 * };
 * ```
 */
export function tdi2Plugin(userOptions: RollupPluginDIOptions = {}): Plugin {
  const config = getDefaultConfig(userOptions);
  validateConfig(config);

  let orchestrator: TransformOrchestrator;
  const performanceTracker = createPerformanceTracker();

  return {
    name: 'tdi2-rollup-plugin',

    async buildStart() {
      console.log('🚀 TDI2 Rollup Plugin: Starting build...');
      performanceTracker.startTransformation();

      // Initialize orchestrator
      orchestrator = new TransformOrchestrator({
        ...config,
        pluginName: 'Rollup',
      });

      try {
        await orchestrator.initialize();
        performanceTracker.recordCacheHit();
      } catch (error) {
        performanceTracker.recordError();
        console.error('❌ TDI2 initialization failed:', error);
        throw error;
      }

      performanceTracker.endTransformation();
      console.log('✅ TDI2 Rollup Plugin: Initialization complete');
    },

    load(id: string) {
      // Only intercept .ts/.tsx files before Rollup tries to parse them
      if (!shouldProcessFile(id, config.advanced.fileExtensions ?? ['.ts', '.tsx'])) {
        return null;
      }

      // Get transformed content from cache
      const transformedCode = orchestrator?.getTransformedContent(id);

      if (transformedCode) {
        console.debug(`[Rollup] 🔍 Using transformed version of ${id}`);
        return transformedCode;
      }

      return null;
    },

    async transform(code: string, id: string) {
      // Skip if file shouldn't be processed
      if (!shouldProcessFile(id, config.advanced.fileExtensions ?? ['.ts', '.tsx'])) {
        return null;
      }

      try {
        const result = orchestrator.transformFile(id, code);

        if (result.wasTransformed) {
          performanceTracker.recordCacheHit();
          return {
            code: result.code,
            map: result.map,
          };
        }

        performanceTracker.recordCacheMiss();
        return null;
      } catch (error) {
        performanceTracker.recordError();
        console.error(`❌ TDI2 transformation failed for ${id}:`, error);
        return null;
      }
    },

    buildEnd() {
      console.log('\n📊 TDI2 Rollup Plugin Statistics:');
      console.log(`   Transformed files: ${orchestrator?.getTransformedFileCount() ?? 0}`);
      console.log(performanceTracker.formatStats());
    },
  };
}

// Default export
export default tdi2Plugin;
