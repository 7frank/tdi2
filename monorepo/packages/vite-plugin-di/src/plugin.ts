import type { Plugin } from "vite";
import {
  EnhancedDITransformer,
  FunctionalDIEnhancedTransformer,
  ConfigManager,
  consoleFor,
} from "@tdi2/di-core/tools";

import * as fs from "fs";
import * as path from "path";

const console = consoleFor('vite-plugin-di:plugin');

import type {
  DIPluginOptions,
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
        scanDirs: options.scanDirs!,
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

  // Normalize scanDirs to absolute paths for HMR matching
  const absoluteScanDirs = options.scanDirs!.map(dir => path.resolve(dir));

  /**
   * Main transformation function
   */
  const transformDI = async (force: boolean = false): Promise<void> => {
    if (isTransforming) return;

    const startTime = Date.now();
    performanceTracker.startTransformation();

    // Check if we should reuse existing config (but always transform on force for HMR)
    const now = Date.now();
    if (
      !force &&
      options.reuseExistingConfig &&
      now - lastConfigCheck < CONFIG_CHECK_INTERVAL &&
      transformedFiles.size > 0  // Only skip if we already have transformed files
    ) {
      if (checkExistingConfig()) {
        if (options.verbose) {
          console.log("🔄 Reusing existing DI configuration (cache hit)");
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
        ConfigManager.cleanOldConfigs(options.keepConfigCount, options.outputDir);
      }

      // Create config manager first to check for existing configs
      // If forcing regeneration (e.g., new service added), use timestamp suffix to create new config
      const configSuffix = force ? `hmr-${Date.now()}` : options.customSuffix;
      configManager = new ConfigManager({
        scanDirs: options.scanDirs!,
        outputDir: options.outputDir!,
        enableFunctionalDI: options.enableFunctionalDI!,
        verbose: options.verbose!,
        customSuffix: configSuffix,
      });

      // Check if config is already valid and we should reuse it
      if (options.reuseExistingConfig && configManager.isConfigValid() && !force) {
        if (options.verbose) {
          console.log(
            `♻️  Reusing valid config: ${configManager.getConfigHash()}`
          );
        }

        // Generate bridge files to ensure they're up to date
        configManager.generateBridgeFiles();

        // Still run functional transformation as it doesn't persist (and for HMR updates)
        if (options.enableFunctionalDI) {
          functionalTransformer = new FunctionalDIEnhancedTransformer({
            scanDirs: options.scanDirs,
            outputDir: options.outputDir,
            generateDebugFiles: options.generateDebugFiles,
            verbose: options.verbose,
            customSuffix: configSuffix,
          });

          try {
            // IMPORTANT: Always refresh transformedFiles map for HMR to work
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
        scanDirs: options.scanDirs,
        outputDir: options.outputDir,
        verbose: options.verbose,
        enableInterfaceResolution: options.enableInterfaceResolution,
        customSuffix: configSuffix,
      });

      await classTransformer.transform();
      await classTransformer.save();
      performanceTracker.endScan();

      // Get the config manager from the transformer
      configManager = classTransformer.getConfigManager();

      // Run functional DI transformation with interface resolution
      if (options.enableFunctionalDI) {
        functionalTransformer = new FunctionalDIEnhancedTransformer({
          scanDirs: options.scanDirs,
          outputDir: options.outputDir,
          generateDebugFiles: options.generateDebugFiles,
          verbose: options.verbose,
          customSuffix: configSuffix,
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

          // Return with code and optional map for better HMR support
          return {
            code: transformedContent,
            map: null,
          };
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

    async handleHotUpdate({ file, server, modules }) {
      if (!options.watch) return undefined;

      if (options.verbose) {
        console.log(`🔥 handleHotUpdate called for: ${file}`);
      }

      const isInScanDir = absoluteScanDirs.some(dir => file.startsWith(dir));

      if (
        isInScanDir &&
        (file.endsWith(".ts") || file.endsWith(".tsx"))
      ) {
        try {
          const content = fs.readFileSync(file, "utf-8");
          const diPatterns = detectDIPatterns(content, options);

          if (diPatterns.hasDI) {
            const absoluteFile = path.resolve(file);

            if (options.verbose) {
              console.log(`🔄 HMR: Re-transforming ${path.basename(file)}`);
            }

            // Re-transform if this file was previously transformed
            const wasTransformed = transformedFiles.has(absoluteFile);
            if (wasTransformed) {
              try {
                // Create a fresh transformer instance to pick up file changes
                const freshTransformer = new FunctionalDIEnhancedTransformer({
                  scanDirs: options.scanDirs,
                  outputDir: options.outputDir,
                  generateDebugFiles: options.generateDebugFiles,
                  verbose: false, // Suppress transformer logs during HMR
                  customSuffix: options.customSuffix,
                });

                // Re-run transformation with fresh instance
                const newTransformed = await freshTransformer.transformForBuild();

                // Update our cache with all the new transformations
                transformedFiles.clear();
                for (const [path, content] of newTransformed.entries()) {
                  transformedFiles.set(path, content);
                }

                if (options.verbose) {
                  console.log(`   Updated ${transformedFiles.size} transformed file(s)`);
                }
              } catch (error) {
                console.error('Error retransforming file during HMR:', error);
              }
            }

            // Find all modules associated with this file
            const affectedModules = modules.filter(mod => {
              const modFile = mod.file;
              return modFile === file || modFile === absoluteFile;
            });

            if (affectedModules.length > 0) {
              // Invalidate modules so they reload with the updated transformed content
              for (const mod of affectedModules) {
                server.moduleGraph.invalidateModule(mod);
              }

              // Return the affected modules to trigger HMR update
              return affectedModules;
            }
          }
        } catch (error) {
          console.error("Error checking file for DI changes:", error);
          buildContext.errors.push(`Hot update: ${error}`);
        }
      }

      // Handle service file additions/changes - check if file has @Service decorator
      if (
        isInScanDir &&
        (file.endsWith(".ts") || file.endsWith(".tsx")) &&
        !file.endsWith(".test.ts") &&
        !file.endsWith(".test.tsx") &&
        !file.endsWith(".spec.ts") &&
        !file.endsWith(".spec.tsx")
      ) {
        try {
          const content = fs.readFileSync(file, "utf-8");
          const hasServiceDecorator = /@Service\s*\(/.test(content);

          if (hasServiceDecorator) {
            if (options.verbose) {
              console.log(`🔄 Service file detected: ${path.basename(file)} - regenerating config`);
            }

            // Regenerate the entire DI configuration
            await transformDI(true);

            // Invalidate all bridge files, config modules, AND transformed components
            const moduleGraph = server.moduleGraph;
            const bridgeDir = configManager?.getBridgeDir();
            if (bridgeDir) {
              // Invalidate all modules in the bridge directory
              for (const [id, mod] of moduleGraph.idToModuleMap) {
                if (id.includes('.tdi2')) {
                  moduleGraph.invalidateModule(mod);
                }
              }
            }

            // Also invalidate all transformed component files so they get re-transformed with new service registry
            for (const transformedPath of transformedFiles.keys()) {
              const mods = moduleGraph.getModulesByFile(transformedPath);
              if (mods) {
                for (const mod of mods) {
                  moduleGraph.invalidateModule(mod);
                }
              }
            }

            // Trigger full page reload so new service gets registered
            server.ws.send({
              type: "full-reload",
              path: "*",
            });

            return [];
          }
        } catch (error) {
          // File might not exist yet or be unreadable
          if (options.verbose) {
            console.log(`Could not read file for service detection: ${file}`, error);
          }
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
          return [];
        }
      }

      // Return undefined to let Vite handle HMR normally
      return undefined;
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

      // Watch for new service files being added
      if (options.watch) {
        server.watcher.on('add', async (file) => {
          const isInScanDir = absoluteScanDirs.some(dir => file.startsWith(dir));

          if (
            isInScanDir &&
            (file.endsWith(".ts") || file.endsWith(".tsx")) &&
            !file.endsWith(".test.ts") &&
            !file.endsWith(".test.tsx") &&
            !file.endsWith(".spec.ts") &&
            !file.endsWith(".spec.tsx")
          ) {
            try {
              const content = fs.readFileSync(file, "utf-8");
              const hasServiceDecorator = /@Service\s*\(/.test(content);

              if (hasServiceDecorator) {
                if (options.verbose) {
                  console.log(`🆕 New service file detected: ${path.basename(file)} - regenerating config`);
                }

                // Regenerate the entire DI configuration
                await transformDI(true);

                // Invalidate all bridge files, config modules, AND transformed components
                const moduleGraph = server.moduleGraph;
                const bridgeDir = configManager?.getBridgeDir();
                if (bridgeDir) {
                  // Invalidate all modules in the bridge directory
                  for (const [id, mod] of moduleGraph.idToModuleMap) {
                    if (id.includes('.tdi2')) {
                      moduleGraph.invalidateModule(mod);
                    }
                  }
                }

                // Also invalidate all transformed component files so they get re-transformed with new service registry
                for (const transformedPath of transformedFiles.keys()) {
                  const mods = moduleGraph.getModulesByFile(transformedPath);
                  if (mods) {
                    for (const mod of mods) {
                      moduleGraph.invalidateModule(mod);
                    }
                  }
                }

                // Trigger full page reload so new service gets registered
                server.ws.send({
                  type: "full-reload",
                  path: "*",
                });
              }
            } catch (error) {
              if (options.verbose) {
                console.log(`Could not read new file for service detection: ${file}`, error);
              }
            }
          }
        });
      }
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