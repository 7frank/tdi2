import type { Plugin } from "vite";
import {
  EnhancedDITransformer,
  FunctionalDIEnhancedTransformer,
  ConfigManager,
} from "@tdi2/di-core/tools";

import * as fs from "fs";
import * as path from "path";

import type {
  DIPluginOptions,
  DIHotUpdateContext,
  DIBuildContext,
} from './types';

import { 
  getDIPluginDefaults, 
  validateDIPluginOptions,
  createDebugEndpoints,
  detectDIPatterns,
  createPerformanceTracker,
} from './utils';

/**
 * TDI2 Enhanced Vite Plugin
 * 
 * Provides build-time dependency injection transformation with:
 * - Interface-based automatic resolution
 * - Functional component DI transformation
 * - Hot reload support
 * - Development debugging endpoints
 * - Production build optimization
 */
export function diEnhancedPlugin(userOptions: DIPluginOptions = {}): Plugin {
  const options = getDIPluginDefaults(userOptions);
  validateDIPluginOptions(options);

  if (options.verbose){
    console.log("🔧 TDI2 Vite Plugin Options:", options);
  }

  // Plugin state
  let classTransformer: EnhancedDITransformer;
  let functionalTransformer: FunctionalDIEnhancedTransformer;
  let configManager: ConfigManager;
  let buildContext: DIBuildContext;
  let isTransforming = false;
  let transformedFiles: Map<string, string> = new Map();
  let lastConfigCheck = 0;
  const performanceTracker = createPerformanceTracker();
  
  const CONFIG_CHECK_INTERVAL = 5000; // 5 seconds

  /**
   * Check for existing valid configuration before creating new one
   */
  const checkExistingConfig = (): boolean => {
    try {
      const tempConfigManager = new ConfigManager({
        srcDir: options.srcDir!,
        outputDir: options.outputDir!,
        enableFunctionalDI: options.enableFunctionalDI!,
        verbose: false, // Don't spam logs during check
        customSuffix: options.customSuffix,
      });

      const existingConfig = tempConfigManager.findExistingConfig();
      if (existingConfig && tempConfigManager.isConfigValid()) {
        if (options.verbose) {
          console.log(`♻️  Found valid existing config: ${existingConfig}`);
        }
        return true;
      }
    } catch (error) {
      if (options.verbose) {
        console.warn("⚠️  Error checking existing config:", error);
      }
    }

    return false;
  };

  /**
   * Main transformation function
   */
  const transformDI = async (force: boolean = false): Promise<void> => {
    if (isTransforming) return;

    const startTime = Date.now();
    performanceTracker.startTransformation();

    // Check if we should reuse existing config
    const now = Date.now();
    if (
      !force &&
      options.reuseExistingConfig &&
      now - lastConfigCheck < CONFIG_CHECK_INTERVAL
    ) {
      if (checkExistingConfig()) {
        if (options.verbose) {
          console.log("🔄 Reusing existing DI configuration");
        }
        performanceTracker.recordCacheHit();
        return;
      }
    }
    lastConfigCheck = now;
    performanceTracker.recordCacheMiss();

    isTransforming = true;
    try {
      if (options.verbose) {
        console.log(
          "🚀 Running enhanced DI transformation with interface resolution..."
        );
      }

      // Clean old configs periodically (but not if reusing)
      if (options.cleanOldConfigs && !options.reuseExistingConfig) {
        ConfigManager.cleanOldConfigs(options.keepConfigCount);
      }

      // Create config manager first to check for existing configs
      configManager = new ConfigManager({
        srcDir: options.srcDir!,
        outputDir: options.outputDir!,
        enableFunctionalDI: options.enableFunctionalDI!,
        verbose: options.verbose!,
        customSuffix: options.customSuffix,
      });

      // Check if config is already valid and we should reuse it
      if (options.reuseExistingConfig && configManager.isConfigValid()) {
        if (options.verbose) {
          console.log(
            `♻️  Reusing valid config: ${configManager.getConfigHash()}`
          );
        }

        // Generate bridge files to ensure they're up to date
        configManager.generateBridgeFiles();

        // Still run functional transformation as it doesn't persist
        if (options.enableFunctionalDI) {
          functionalTransformer = new FunctionalDIEnhancedTransformer({
            srcDir: options.srcDir,
            outputDir: options.outputDir,
            generateDebugFiles: options.generateDebugFiles,
            verbose: options.verbose,
            customSuffix: options.customSuffix,
          });

          try {
            transformedFiles = await functionalTransformer.transformForBuild();

            if (options.verbose) {
              const summary = functionalTransformer.getTransformationSummary();
              console.log(
                `🎯 Functional DI: transformed ${summary.count} components (reused config)`
              );
            }
          } catch (error) {
            console.warn("⚠️  Functional DI transformation failed:", error);
            transformedFiles = new Map();
            buildContext.errors.push(`Functional DI: ${error}`);
          }
        }

        performanceTracker.endTransformation();
        isTransforming = false;
        return;
      }

      // Run class-based DI transformation with interface resolution
      performanceTracker.startScan();
      classTransformer = new EnhancedDITransformer({
        srcDir: options.srcDir,
        outputDir: options.outputDir,
        verbose: options.verbose,
        enableInterfaceResolution: options.enableInterfaceResolution,
        customSuffix: options.customSuffix,
      });

      await classTransformer.transform();
      await classTransformer.save();
      performanceTracker.endScan();

      // Get the config manager from the transformer
      configManager = classTransformer.getConfigManager();

      // Run functional DI transformation with interface resolution
      if (options.enableFunctionalDI) {
        functionalTransformer = new FunctionalDIEnhancedTransformer({
          srcDir: options.srcDir,
          outputDir: options.outputDir,
          generateDebugFiles: options.generateDebugFiles,
          verbose: options.verbose,
          customSuffix: options.customSuffix,
        });

        try {
          transformedFiles = await functionalTransformer.transformForBuild();
          buildContext.transformedCount = transformedFiles.size;

          if (options.verbose) {
            const summary = functionalTransformer.getTransformationSummary();
            console.log(
              `🎯 Functional DI: transformed ${summary.count} components`
            );
            console.log(
              `📋 Resolved ${summary.resolvedDependencies} interface implementations`
            );
          }
        } catch (error) {
          console.warn("⚠️  Functional DI transformation failed:", error);
          transformedFiles = new Map();
          buildContext.errors.push(`Functional DI: ${error}`);
        }
      }

      performanceTracker.endTransformation();

      if (options.verbose) {
        console.log("✅ Enhanced DI transformation completed");
        console.log(`⏱️  Transformation time: ${Date.now() - startTime}ms`);
        
        if (configManager) {
          console.log(`🏗️  Config: ${configManager.getConfigHash()}`);
          console.log(`📁 Config dir: ${configManager.getConfigDir()}`);
          console.log(`🌉 Bridge dir: ${configManager.getBridgeDir()}`);
        }

        // Show interface resolution summary
        if (classTransformer) {
          const debugInfo = await classTransformer.getDebugInfo();
          console.log(`\n📊 Interface Resolution Summary:`);
          console.log(
            `   ${debugInfo.implementations.length} interface implementations`
          );
          console.log(
            `   ${debugInfo.dependencies.length} services with dependencies`
          );

          if (debugInfo.validation && !debugInfo.validation.isValid) {
            console.log(`\n⚠️  Validation Issues:`);
            if (debugInfo.validation.missingImplementations.length > 0) {
              console.log(
                `   Missing: ${debugInfo.validation.missingImplementations.join(
                  ", "
                )}`
              );
            }
            if (debugInfo.validation.circularDependencies.length > 0) {
              console.log(
                `   Circular: ${debugInfo.validation.circularDependencies.join(
                  ", "
                )}`
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Enhanced DI transformation failed:", error);
      buildContext.errors.push(`Transformation: ${error}`);
      performanceTracker.recordError();
    } finally {
      isTransforming = false;
    }
  };

  /**
   * Handle hot module replacement for DI files
   */
  const handleDIHotUpdate = async (context: DIHotUpdateContext) => {
    if (!options.watch) return null

    if (context.hasDIPatterns) {
      if (options.verbose) {
        console.log(
          `🔄 DI change detected in ${path.relative(process.cwd(), context.file)}`
        );
      }

      // Force transformation on file changes
      await transformDI(true);

      return {
        requiresFullReload: context.requiresFullReload,
        affectedModules: context.affectedModules,
      };
    }

    return null;
  };

  return {
    name: "vite-plugin-di-enhanced",

    async buildStart() {
      buildContext = {
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        isWatch: false,
        transformedCount: 0,
        errors: [],
        warnings: [],
      };

      await transformDI(false); // Don't force, allow reuse
    },

    async load(id) {
      // Check if this file was transformed by functional DI
      const absolutePath = path.resolve(id);

      for (const [originalPath, transformedContent] of transformedFiles) {
        const absoluteOriginal = path.resolve(originalPath);

        if (absolutePath === absoluteOriginal) {
          if (options.verbose) {
            console.log(
              `🔄 Loading transformed version of ${path.basename(id)}`
            );
          }
          return transformedContent;
        }
      }

      return null;
    },

    resolveId(id) {
      // Handle bridge file resolution
      if (id.startsWith("./.tdi2/") && configManager) {
        const bridgeFile = path.resolve(
          configManager.getBridgeDir(),
          id.replace("./.tdi2/", "")
        );
        if (fs.existsSync(bridgeFile)) {
          return bridgeFile;
        }
      }
      return null;
    },

    async handleHotUpdate({ file, server }) {
      if (!options.watch) return;

      if (
        file.includes(options.srcDir!) &&
        (file.endsWith(".ts") || file.endsWith(".tsx"))
      ) {
        try {
          const content = fs.readFileSync(file, "utf-8");
          const diPatterns = detectDIPatterns(content, options);
          
          if (diPatterns.hasDI) {
            const context: DIHotUpdateContext = {
              file,
              hasDIPatterns: true,
              affectedModules: [file],
              requiresFullReload: false,
            };

            const result = await handleDIHotUpdate(context);
            
            if (result) {
              const absoluteFile = path.resolve(file);
              if (transformedFiles.has(absoluteFile)) {
                const mod = server.moduleGraph.getModuleById(file);
                if (mod) {
                  server.reloadModule(mod);
                } else {
                  context.requiresFullReload = true;
                }
              }

              if (context.requiresFullReload) {
                server.ws.send({
                  type: "full-reload",
                });
              }
            }
          }
        } catch (error) {
          console.error("Error checking file for DI changes:", error);
          buildContext.errors.push(`Hot update: ${error}`);
        }
      }

      // Handle bridge file changes
      if (file.includes(".tdi2") && configManager) {
        const relativePath = path.relative(configManager.getBridgeDir(), file);
        if (!relativePath.startsWith("..")) {
          if (options.verbose) {
            console.log(`🌉 Bridge file changed: ${relativePath}`);
          }

          server.ws.send({
            type: "full-reload",
          });
        }
      }
    },

    configureServer(server) {
      // Set up debug endpoints
      createDebugEndpoints(server, {
        options,
        getClassTransformer: () => classTransformer,
        getFunctionalTransformer: () => functionalTransformer,
        getConfigManager: () => configManager,
        getTransformedFiles: () => transformedFiles,
        getBuildContext: () => buildContext,
        getPerformanceTracker: () => performanceTracker,
        transformDI,
      });
    },

    async generateBundle() {
      if (configManager) {
        configManager.generateBridgeFiles();

        if (options.verbose) {
          console.log("🏗️  Generated bridge files for production build");
        }
      }

      // Log final build statistics
      if (options.verbose && buildContext) {
        console.log("\n📊 Final Build Statistics:");
        console.log(`   Transformed files: ${buildContext.transformedCount}`);
        console.log(`   Errors: ${buildContext.errors.length}`);
        console.log(`   Warnings: ${buildContext.warnings.length}`);
        
        const perf = performanceTracker.getStats();
        if (perf.transformationTime > 0) {
          console.log(`   Total transformation time: ${perf.transformationTime}ms`);
          console.log(`   Cache hits: ${perf.cacheHits}, misses: ${perf.cacheMisses}`);
        }
      }
    },
  };
}