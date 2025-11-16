import type { ViteDevServer } from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import {
  getDefaultConfig as getCoreDefaults,
  validateConfig as validateCoreConfig,
  detectDIPatterns,
  createPerformanceTracker as coreCreatePerformanceTracker,
  type PluginConfig,
} from '@tdi2/plugin-core';

import type {
  DIPluginOptions,
  DIPluginPreset,
  DIDebugInfo,
  TransformationSummary,
  ConfigInfo,
  DIBuildContext,
} from './types';
import { EnhancedDITransformer } from '@tdi2/di-core/tools';

/**
 * Get default plugin options with sensible defaults (wraps plugin-core)
 */
export function getDIPluginDefaults(userOptions: DIPluginOptions): Required<DIPluginOptions> {
  // Get base config from plugin-core
  const baseConfig = getCoreDefaults(userOptions as PluginConfig);

  // Add Vite-specific defaults
  return {
    ...baseConfig,
    watch: userOptions.watch ?? true,
    cleanOldConfigs: userOptions.cleanOldConfigs ?? true,
    keepConfigCount: userOptions.keepConfigCount ?? 3,
    reuseExistingConfig: userOptions.reuseExistingConfig ?? true,
  } as Required<DIPluginOptions>;
}

/**
 * Validate plugin options (wraps plugin-core validation)
 */
export function validateDIPluginOptions(options: Required<DIPluginOptions>): void {
  // Use core validation
  validateCoreConfig(options as any);

  // Add Vite-specific validation
  if (typeof options.watch !== 'boolean') {
    throw new Error('DIPlugin: watch must be a boolean');
  }

  if (options.keepConfigCount < 1) {
    throw new Error('DIPlugin: keepConfigCount must be at least 1');
  }
}

/**
 * Create preset configurations for common use cases
 */
export function createDIPluginPresets(): Record<string, DIPluginPreset> {
  return {
    development: {
      name: 'Development',
      description: 'Optimized for development with hot reload',
      options: {
        watch: true,
        enableFunctionalDI: true,
        enableInterfaceResolution: true,
        generateDebugFiles: true,
        reuseExistingConfig: true,
        cleanOldConfigs: false,
      },
    },

    production: {
      name: 'Production',
      description: 'Optimized for production builds',
      options: {
        watch: false,
        enableFunctionalDI: true,
        enableInterfaceResolution: true,
        generateDebugFiles: false,
        reuseExistingConfig: false,
        cleanOldConfigs: true,
        keepConfigCount: 1,
      },
    },

    testing: {
      name: 'Testing',
      description: 'Optimized for test environments with fast rebuilds',
      options: {
        watch: false,
        enableFunctionalDI: true,
        enableInterfaceResolution: true,
        generateDebugFiles: false,
        reuseExistingConfig: true,
        cleanOldConfigs: false,
      },
    },

    minimal: {
      name: 'Minimal',
      description: 'Basic DI without functional components or interface resolution',
      options: {
        watch: true,
        enableFunctionalDI: false,
        enableInterfaceResolution: false,
        generateDebugFiles: false,
        reuseExistingConfig: true,
      },
    },

    debugging: {
      name: 'Debugging',
      description: 'Maximum debug information for troubleshooting',
      options: {
        watch: true,
        enableFunctionalDI: true,
        enableInterfaceResolution: true,
        generateDebugFiles: true,
        reuseExistingConfig: false,
        cleanOldConfigs: false,
        advanced: {
          performance: {
            parallel: false, // Easier to debug sequentially
            maxConcurrency: 1,
            enableCache: false,
          },
        },
      },
    },
  };
}

// Export detectDIPatterns directly from plugin-core
export { detectDIPatterns };

/**
 * Create performance tracking utilities (wraps plugin-core)
 */
export function createPerformanceTracker() {
  return coreCreatePerformanceTracker();
}

/**
 * Create debug endpoints for the Vite dev server
 */
export function createDebugEndpoints(
  server: ViteDevServer,
  context: {
    options: Required<DIPluginOptions>;
    getClassTransformer: () => EnhancedDITransformer;
    getFunctionalTransformer: () => any;
    getConfigManager: () => any;
    getTransformedFiles: () => Map<string, string>;
    getBuildContext: () => DIBuildContext;
    getPerformanceTracker: () => ReturnType<typeof createPerformanceTracker>;
    transformDI: (force?: boolean) => Promise<void>;
  }
): void {
  
  // Main debug endpoint
  server.middlewares.use('/_di_debug', async (req, res, next) => {
    if (req.url === '/_di_debug') {
      try {
        const functionalTransformer = context.getFunctionalTransformer();
        const classTransformer = context.getClassTransformer();
        const configManager = context.getConfigManager();
        const buildContext = context.getBuildContext();
        const performanceTracker = context.getPerformanceTracker();

        const summary = functionalTransformer?.getTransformationSummary();
        const configInfo = configManager
          ? {
              hash: configManager.getConfigHash(),
              configDir: configManager.getConfigDir(),
              bridgeDir: configManager.getBridgeDir(),
              isValid: configManager.isConfigValid(),
            }
          : null;

        const debugInfo = classTransformer
          ? await classTransformer.getDebugInfo()
          : null;

        const response: DIDebugInfo = {
          config: configInfo as ConfigInfo,
          transformedFiles: Array.from(context.getTransformedFiles().keys()),
          functionalSummary: summary || {
            count: 0,
            functions: [],
            transformedFiles: [],
            resolvedDependencies: 0,
            errors: [],
          },
          interfaceResolution: debugInfo
            ? {
                implementations: debugInfo.implementations.map(
                  ([key, impl]) => ({
                    sanitizedKey: key,
                    interfaceName: impl.interfaceName,
                    implementationClass: impl.implementationClass,
                    filePath: impl.filePath,
                    isGeneric: impl.isGeneric,
                    typeParameters: impl.typeParameters,
                    registrationType: impl.isClassBased 
                      ? 'class' 
                      : impl.isInheritanceBased 
                        ? 'inheritance' 
                        : 'interface',
                  })
                ),
                dependencies: debugInfo.dependencies.map(
                  ([service, deps]) => ({
                    serviceClass: service,
                    filePath: deps.filePath,
                    constructorParams: deps.constructorParams.map((p) => ({
                      paramName: p.paramName,
                      interfaceType: p.interfaceType,
                      isOptional: p.isOptional,
                      sanitizedKey: p.sanitizedKey,
                    })),
                  })
                ),
                validation: debugInfo.validation || {
                  isValid: false,
                  missingImplementations: [],
                  circularDependencies: [],
                 // warnings: [],
                },
                stats: {
                  totalInterfaces: debugInfo.implementations.length,
                  totalImplementations: debugInfo.implementations.length,
                  totalDependencies: debugInfo.dependencies.length,
                  registrationTypes: debugInfo.implementations.reduce((acc, [, impl]) => {
                    const type = impl.isClassBased 
                      ? 'class' 
                      : impl.isInheritanceBased 
                        ? 'inheritance' 
                        : 'interface';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>),
                },
              }
            : null,
          options: context.options,
          timestamp: new Date().toISOString(),
          performance: performanceTracker.getStats(),
        };

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
      }
    } else {
      next();
    }
  });

  // Interface mappings endpoint
  server.middlewares.use('/_di_interfaces', async (req, res, next) => {
    if (req.url === '/_di_interfaces') {
      try {
        const classTransformer = context.getClassTransformer();
        const configManager = context.getConfigManager();
        
        const debugInfo = classTransformer
          ? await classTransformer.getDebugInfo()
          : null;

        const interfaceData = {
          implementations: debugInfo
            ? debugInfo.implementations.map(([key, impl]) => ({
                sanitizedKey: key,
                interfaceName: impl.interfaceName,
                implementationClass: impl.implementationClass,
                filePath: impl.filePath,
                isGeneric: impl.isGeneric,
                typeParameters: impl.typeParameters,
                registrationType: impl.isClassBased 
                  ? 'class' 
                  : impl.isInheritanceBased 
                    ? 'inheritance' 
                    : 'interface',
              }))
            : [],
          dependencies: debugInfo
            ? debugInfo.dependencies.map(([service, deps]) => ({
                serviceClass: service,
                filePath: deps.filePath,
                constructorParams: deps.constructorParams.map((p) => ({
                  paramName: p.paramName,
                  interfaceType: p.interfaceType,
                  isOptional: p.isOptional,
                  sanitizedKey: p.sanitizedKey,
                })),
              }))
            : [],
          validation: debugInfo ? debugInfo.validation : null,
          configHash: configManager?.getConfigHash() || 'unknown',
        };

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(interfaceData, null, 2));
      } catch (error: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
      }
    } else {
      next();
    }
  });

  // Config directory listing
  server.middlewares.use('/_di_configs', (req, res, next) => {
    if (req.url === '/_di_configs') {
      try {
        const configsDir = path.resolve('node_modules/.tdi2/configs');
        const configManager = context.getConfigManager();
        
        const configs = fs.existsSync(configsDir)
          ? fs.readdirSync(configsDir).map((name) => {
              const configPath = path.join(configsDir, name);
              const metaFile = path.join(configPath, '.config-meta.json');
              let metadata = null;

              if (fs.existsSync(metaFile)) {
                try {
                  metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
                } catch (error) {
                  // Ignore metadata read errors
                }
              }

              return {
                name,
                path: configPath,
                metadata,
                stats: fs.statSync(configPath),
                isValid: fs.existsSync(
                  path.join(configPath, 'di-config.ts')
                ),
                isCurrent: configManager?.getConfigHash() === name,
              };
            })
          : [];

        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify(
            {
              configs,
              current: configManager?.getConfigHash() || null,
              interfaceResolutionEnabled: context.options.enableInterfaceResolution,
              reuseExistingConfig: context.options.reuseExistingConfig,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          )
        );
      } catch (error:any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
      }
    } else {
      next();
    }
  });

  // Force regeneration endpoint
  server.middlewares.use('/_di_regenerate', async (req, res, next) => {
    if (req.url === '/_di_regenerate' && req.method === 'POST') {
      try {
        console.log('🔄 Forcing DI regeneration via API...');

        // Force cleanup and regeneration
        const configManager = context.getConfigManager();
        if (configManager) {
          configManager.forceRegenerate();
        }

        await context.transformDI(true); // Force transformation

        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            message: 'DI configuration regenerated',
            newConfig: configManager?.getConfigHash() || 'unknown',
            timestamp: new Date().toISOString(),
          })
        );

        // Trigger full reload
        server.ws.send({
          type: 'full-reload',
        });
      } catch (error :any) {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            success: false,
            error: error.message,
          })
        );
      }
    } else {
      next();
    }
  });

  // Performance stats endpoint
  server.middlewares.use('/_di_performance', (req, res, next) => {
    if (req.url === '/_di_performance') {
      try {
        const performanceTracker = context.getPerformanceTracker();
        const buildContext = context.getBuildContext();
        
        const stats = {
          performance: performanceTracker.getStats(),
          buildContext,
          transformedFiles: context.getTransformedFiles().size,
          memoryUsage: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        };

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(stats, null, 2));
      } catch (error : any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
      }
    } else {
      next();
    }
  });
}

/**
 * Helper function to format file sizes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Helper function to format duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}