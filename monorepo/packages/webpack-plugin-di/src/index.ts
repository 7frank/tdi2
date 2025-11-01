/**
 * @tdi2/webpack-plugin-di
 *
 * Webpack plugin for TDI2 dependency injection
 */

import type { Compiler } from 'webpack';
import {
  getDefaultConfig,
  validateConfig,
  shouldProcessFile,
  TransformOrchestrator,
  createPerformanceTracker,
  type PluginConfig,
} from '@tdi2/plugin-core';

export interface WebpackPluginDIOptions extends PluginConfig {}

/**
 * TDI2 Webpack Plugin
 *
 * Integrates TDI2 dependency injection transformations into the Webpack build process.
 *
 * @example
 * ```javascript
 * const { TDI2WebpackPlugin } = require('@tdi2/webpack-plugin-di');
 *
 * module.exports = {
 *   plugins: [
 *     new TDI2WebpackPlugin({
 *       srcDir: './src',
 *       enableFunctionalDI: true,
 *       verbose: false
 *     })
 *   ]
 * };
 * ```
 */
export class TDI2WebpackPlugin {
  private config: Required<PluginConfig>;
  private orchestrator?: TransformOrchestrator;
  private performanceTracker = createPerformanceTracker();

  constructor(userOptions: WebpackPluginDIOptions = {}) {
    this.config = getDefaultConfig(userOptions);
    validateConfig(this.config);
  }

  apply(compiler: Compiler): void {
    const pluginName = 'TDI2WebpackPlugin';

    // Initialize on compilation start
    compiler.hooks.beforeCompile.tapPromise(pluginName, async () => {
      if (this.config.verbose) {
        console.log('🚀 TDI2 Webpack Plugin: Starting compilation...');
      }

      this.performanceTracker.startTransformation();

      try {
        this.orchestrator = new TransformOrchestrator({
          ...this.config,
          pluginName: 'Webpack',
        });

        await this.orchestrator.initialize();
        this.performanceTracker.recordCacheHit();

        if (this.config.verbose) {
          console.log('✅ TDI2 Webpack Plugin: Initialization complete');
        }
      } catch (error) {
        this.performanceTracker.recordError();
        console.error('❌ TDI2 initialization failed:', error);
        throw error;
      }

      this.performanceTracker.endTransformation();
    });

    // Transform modules
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      compilation.hooks.buildModule.tap(pluginName, (module: any) => {
        // Skip non-source modules
        if (!module.resource || !this.orchestrator) {
          return;
        }

        const filePath = module.resource;

        // Check if file should be processed
        if (!shouldProcessFile(filePath, this.config.advanced.fileExtensions ?? ['.ts', '.tsx'])) {
          return;
        }

        try {
          // Get original source
          const originalSource = module._source?._value;
          if (!originalSource) return;

          // Transform
          const result = this.orchestrator.transformFile(filePath, originalSource);

          if (result.wasTransformed) {
            // Replace module source with transformed code
            module._source = {
              _value: result.code,
              source: () => result.code,
              size: () => result.code.length,
            };

            this.performanceTracker.recordCacheHit();

            if (this.config.verbose) {
              console.log(`🔄 Transformed: ${filePath}`);
            }
          } else {
            this.performanceTracker.recordCacheMiss();
          }
        } catch (error) {
          this.performanceTracker.recordError();
          console.error(`❌ TDI2 transformation failed for ${filePath}:`, error);
        }
      });
    });

    // Report statistics on done
    compiler.hooks.done.tap(pluginName, () => {
      if (this.config.verbose && this.orchestrator) {
        console.log('\n📊 TDI2 Webpack Plugin Statistics:');
        console.log(`   Transformed files: ${this.orchestrator.getTransformedFileCount()}`);
        console.log(this.performanceTracker.formatStats());
      }
    });
  }
}

// Default export
export default TDI2WebpackPlugin;
