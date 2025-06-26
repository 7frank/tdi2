// vite-plugin-di-enhanced.ts - Enhanced Vite plugin with interface resolution

import { Plugin } from 'vite';
import { EnhancedDITransformer } from './tools/enhanced-di-transformer';
import { FunctionalDIEnhancedTransformer } from './tools/functional-di-enhanced-transformer';
import { ConfigManager } from './tools/config-manager';
import * as fs from 'fs';
import * as path from 'path';

interface DIPluginOptions {
  srcDir?: string;
  outputDir?: string;
  verbose?: boolean;
  watch?: boolean;
  enableFunctionalDI?: boolean;
  enableInterfaceResolution?: boolean;
  generateDebugFiles?: boolean;
  customSuffix?: string;
  cleanOldConfigs?: boolean;
  keepConfigCount?: number;
}

export function diEnhancedPlugin(options: DIPluginOptions = {}): Plugin {
  const opts = {
    srcDir: './src',
    outputDir: './src/generated',
    verbose: false,
    watch: true,
    enableFunctionalDI: true,
    enableInterfaceResolution: true,
    generateDebugFiles: false,
    cleanOldConfigs: true,
    keepConfigCount: 3,
    ...options
  };

  let classTransformer: EnhancedDITransformer;
  let functionalTransformer: FunctionalDIEnhancedTransformer;
  let configManager: ConfigManager;
  let isTransforming = false;
  let transformedFiles: Map<string, string> = new Map();

  const transformDI = async () => {
    if (isTransforming) return;
    
    isTransforming = true;
    try {
      if (opts.verbose) {
        console.log('🚀 Running enhanced DI transformation with interface resolution...');
      }
      
      // Clean old configs periodically
      if (opts.cleanOldConfigs) {
        ConfigManager.cleanOldConfigs(opts.keepConfigCount);
      }
      
      // Run class-based DI transformation with interface resolution
      classTransformer = new EnhancedDITransformer({
        srcDir: opts.srcDir,
        outputDir: opts.outputDir,
        verbose: opts.verbose,
        enableInterfaceResolution: opts.enableInterfaceResolution,
        customSuffix: opts.customSuffix
      });
      
      await classTransformer.transform();
      await classTransformer.save();
      
      // Get the config manager
      configManager = classTransformer.getConfigManager();

      // Run functional DI transformation with interface resolution
      if (opts.enableFunctionalDI) {
        functionalTransformer = new FunctionalDIEnhancedTransformer({
          srcDir: opts.srcDir,
          outputDir: opts.outputDir,
          generateDebugFiles: opts.generateDebugFiles,
          verbose: opts.verbose,
          customSuffix: opts.customSuffix
        });
        
        try {
          transformedFiles = await functionalTransformer.transformForBuild();
          
          if (opts.verbose) {
            const summary = functionalTransformer.getTransformationSummary();
            console.log(`🎯 Functional DI: transformed ${summary.count} components`);
            console.log(`📋 Resolved ${summary.resolvedDependencies} interface implementations`);
          }
        } catch (error) {
          console.warn('⚠️  Functional DI transformation failed:', error);
          transformedFiles = new Map();
        }
      }
      
      if (opts.verbose) {
        console.log('✅ Enhanced DI transformation completed');
        if (configManager) {
          console.log(`🏗️  Config: ${configManager.getConfigHash()}`);
          console.log(`📁 Config dir: ${configManager.getConfigDir()}`);
          console.log(`🌉 Bridge dir: ${configManager.getBridgeDir()}`);
        }

        // Show interface resolution summary
        if (classTransformer) {
          const debugInfo = await classTransformer.getDebugInfo();
          console.log(`\n📊 Interface Resolution Summary:`);
          console.log(`   ${debugInfo.implementations.length} interface implementations`);
          console.log(`   ${debugInfo.dependencies.length} services with dependencies`);
          
          if (debugInfo.validation && !debugInfo.validation.isValid) {
            console.log(`\n⚠️  Validation Issues:`);
            if (debugInfo.validation.missingImplementations.length > 0) {
              console.log(`   Missing: ${debugInfo.validation.missingImplementations.join(', ')}`);
            }
            if (debugInfo.validation.circularDependencies.length > 0) {
              console.log(`   Circular: ${debugInfo.validation.circularDependencies.join(', ')}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Enhanced DI transformation failed:', error);
    } finally {
      isTransforming = false;
    }
  };

  return {
    name: 'vite-plugin-di-enhanced',
    
    async buildStart() {
      await transformDI();
    },

    async load(id) {
      // Check if this file was transformed by functional DI
      const absolutePath = path.resolve(id);
      
      for (const [originalPath, transformedContent] of transformedFiles) {
        const absoluteOriginal = path.resolve(originalPath);
        
        if (absolutePath === absoluteOriginal) {
          if (opts.verbose) {
            console.log(`🔄 Loading transformed version of ${path.basename(id)}`);
          }
          return transformedContent;
        }
      }
      
      return null;
    },

    resolveId(id) {
      // Handle bridge file resolution
      if (id.startsWith('./.tdi2/') && configManager) {
        const bridgeFile = path.resolve(configManager.getBridgeDir(), id.replace('./.tdi2/', ''));
        if (fs.existsSync(bridgeFile)) {
          return bridgeFile;
        }
      }
      return null;
    },

    async handleHotUpdate({ file, server }) {
      if (!opts.watch) return;
      
      if (file.includes(opts.srcDir!) && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const hasDI = content.includes('@Service') || 
                       content.includes('@Inject') || 
                       content.includes('@Autowired') ||
                       content.includes('@AutoWire') ||
                       content.includes('Inject<') ||
                       content.includes('InjectOptional<') ||
                       content.includes('implements ');
          
          if (hasDI) {
            if (opts.verbose) {
              console.log(`🔄 DI change detected in ${path.relative(process.cwd(), file)}`);
            }
            await transformDI();
            
            const absoluteFile = path.resolve(file);
            if (transformedFiles.has(absoluteFile)) {
              const mod = server.moduleGraph.getModuleById(file);
              if (mod) {
                server.reloadModule(mod);
              }
            } else {
              server.ws.send({
                type: 'full-reload'
              });
            }
          }
        } catch (error) {
          console.error('Error checking file for DI changes:', error);
        }
      }
      
      if (file.includes('.tdi2') && configManager) {
        const relativePath = path.relative(configManager.getBridgeDir(), file);
        if (!relativePath.startsWith('..')) {
          if (opts.verbose) {
            console.log(`🌉 Bridge file changed: ${relativePath}`);
          }
          
          server.ws.send({
            type: 'full-reload'
          });
        }
      }
    },

    configureServer(server) {
      // Enhanced debug middleware
      server.middlewares.use('/_di_debug', async (req, res, next) => {
        if (req.url === '/_di_debug') {
          try {
            const summary = functionalTransformer?.getTransformationSummary();
            const configInfo = configManager ? {
              hash: configManager.getConfigHash(),
              configDir: configManager.getConfigDir(),
              bridgeDir: configManager.getBridgeDir()
            } : null;
            
            const debugInfo = classTransformer ? await classTransformer.getDebugInfo() : null;
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              config: configInfo,
              transformedFiles: Array.from(transformedFiles.keys()),
              functionalSummary: summary || { count: 0, functions: [], transformedFiles: [], resolvedDependencies: 0 },
              interfaceResolution: debugInfo ? {
                implementations: debugInfo.implementations.length,
                dependencies: debugInfo.dependencies.length,
                validation: debugInfo.validation,
                implementationDetails: debugInfo.implementations.map(([key, impl]) => ({
                  key,
                  interface: impl.interfaceName,
                  implementation: impl.implementationClass,
                  isGeneric: impl.isGeneric,
                  typeParameters: impl.typeParameters
                })),
                dependencyDetails: debugInfo.dependencies.map(([service, deps]) => ({
                  service,
                  dependencies: deps.constructorParams.map(p => ({
                    name: p.paramName,
                    type: p.interfaceType,
                    optional: p.isOptional
                  }))
                }))
              } : null,
              timestamp: new Date().toISOString()
            }, null, 2));
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
            const debugInfo = classTransformer ? await classTransformer.getDebugInfo() : null;
            const interfaceResolver = functionalTransformer?.getInterfaceResolver();
            
            const interfaceData = {
              implementations: debugInfo ? debugInfo.implementations.map(([key, impl]) => ({
                sanitizedKey: key,
                interfaceName: impl.interfaceName,
                implementationClass: impl.implementationClass,
                filePath: impl.filePath,
                isGeneric: impl.isGeneric,
                typeParameters: impl.typeParameters
              })) : [],
              dependencies: debugInfo ? debugInfo.dependencies.map(([service, deps]) => ({
                serviceClass: service,
                filePath: deps.filePath,
                constructorParams: deps.constructorParams.map(p => ({
                  paramName: p.paramName,
                  interfaceType: p.interfaceType,
                  isOptional: p.isOptional,
                  sanitizedKey: p.sanitizedKey
                }))
              })) : [],
              validation: debugInfo ? debugInfo.validation : null
            };
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(interfaceData, null, 2));
          } catch (error) {
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
            const configs = fs.existsSync(configsDir) 
              ? fs.readdirSync(configsDir).map(name => {
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
                    stats: fs.statSync(configPath)
                  };
                })
              : [];
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              configs,
              current: configManager?.getConfigHash() || null,
              interfaceResolutionEnabled: opts.enableInterfaceResolution,
              timestamp: new Date().toISOString()
            }, null, 2));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        } else {
          next();
        }
      });
    },

    async generateBundle() {
      if (configManager) {
        configManager.generateBridgeFiles();
        
        if (opts.verbose) {
          console.log('🏗️  Generated bridge files for production build');
        }
      }
    }
  };
}