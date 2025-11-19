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
 *       enableFunctionalDI: true
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
      this.performanceTracker.startTransformation();

      try {
        this.orchestrator = new TransformOrchestrator({
          ...this.config,
          pluginName: 'Webpack',
        });

        await this.orchestrator.initialize();
        this.performanceTracker.recordCacheHit();
      } catch (error) {
        this.performanceTracker.recordError();
        console.error('❌ TDI2 initialization failed:', error);
        throw error;
      }

      this.performanceTracker.endTransformation();
    });

    // Transform modules by intercepting the source
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.succeedModule.tap(pluginName, (module: any) => {
        if (!module.resource || !this.orchestrator) {
          return;
        }

        const filePath = module.resource;

        // Check if file should be processed
        if (!shouldProcessFile(filePath, this.config.advanced.fileExtensions ?? ['.ts', '.tsx'])) {
          return;
        }

        // Get transformed content from cache
        const transformedCode = this.orchestrator.getTransformedContent(filePath);

        if (transformedCode && module._source) {
          // Create new source with transformed code
          const {webpack} = compilation.compiler;
          module._source = new webpack.sources.RawSource(transformedCode);

          this.performanceTracker.recordCacheHit();
        } else {
          this.performanceTracker.recordCacheMiss();
        }
      });
    });

    // Report statistics on done
    compiler.hooks.done.tap(pluginName, () => {
      // Statistics available via DEBUG environment variable
    });
  }
}

// Default export
export default TDI2WebpackPlugin;
