// vite-plugin-di.ts - Enhanced with ConfigManager and bridge files

import { Plugin } from 'vite';
import { DITransformer } from './tools/di-transformer';
import { BuildTimeDITransformer } from './tools/build-time-di-transformer';
import { ConfigManager } from './tools/config-manager';
import * as fs from 'fs';
import * as path from 'path';

interface DIPluginOptions {
  srcDir?: string;
  outputDir?: string;
  verbose?: boolean;
  watch?: boolean;
  enableFunctionalDI?: boolean;
  generateDebugFiles?: boolean;
  customSuffix?: string;
  cleanOldConfigs?: boolean;
  keepConfigCount?: number;
}

export function diPlugin(options: DIPluginOptions = {}): Plugin {
  const opts = {
    srcDir: './src',
    outputDir: './src/generated', // Will be overridden by ConfigManager
    verbose: false,
    watch: true,
    enableFunctionalDI: true,
    generateDebugFiles: false,
    cleanOldConfigs: true,
    keepConfigCount: 3,
    ...options
  };

  let transformer: DITransformer;
  let buildTimeTransformer: BuildTimeDITransformer;
  let configManager: ConfigManager;
  let isTransforming = false;
  let transformedFiles: Map<string, string> = new Map();

  const transformDI = async () => {
    if (isTransforming) return;
    
    isTransforming = true;
    try {
      if (opts.verbose) {
        console.log('🔧 Running DI transformation...');
      }
      
      // Clean old configs periodically
      if (opts.cleanOldConfigs) {
        ConfigManager.cleanOldConfigs(opts.keepConfigCount);
      }
      
      // Run class-based DI transformation (ONLY class-based, no functional DI)
      transformer = new DITransformer({
        srcDir: opts.srcDir,
        outputDir: opts.outputDir,
        verbose: opts.verbose,
        enableFunctionalDI: false, // Explicitly disable
        customSuffix: opts.customSuffix
      });
      
      await transformer.transform();
      await transformer.save();
      
      // Get the config manager for bridge file generation
      configManager = transformer.getConfigManager();

      // Run build-time functional DI transformation
      if (opts.enableFunctionalDI) {
        buildTimeTransformer = new BuildTimeDITransformer({
          srcDir: opts.srcDir,
          outputDir: opts.outputDir,
          generateDebugFiles: opts.generateDebugFiles,
          verbose: opts.verbose,
          customSuffix: opts.customSuffix
        });
        
        try {
          transformedFiles = await buildTimeTransformer.transformForBuild();
          
          if (opts.verbose) {
            const summary = buildTimeTransformer.getTransformationSummary();
            console.log(`🎯 Functional DI: transformed ${summary.count} components in ${summary.transformedFiles.length} files`);
          }
        } catch (error) {
          console.warn('⚠️  Functional DI transformation failed:', error);
          // Continue without functional DI
          transformedFiles = new Map();
        }
      }
      
      if (opts.verbose) {
        console.log('✅ DI transformation completed');
        if (configManager) {
          console.log(`🏗️  Config: ${configManager.getConfigHash()}`);
          console.log(`📁 Config dir: ${configManager.getConfigDir()}`);
          console.log(`🌉 Bridge dir: ${configManager.getBridgeDir()}`);
        }
      }
    } catch (error) {
      console.error('❌ DI transformation failed:', error);
    } finally {
      isTransforming = false;
    }
  };

  return {
    name: 'vite-plugin-di',
    
    async buildStart() {
      // Run transformation at build start
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
      
      // Let Vite handle the original file
      return null;
    },

    resolveId(id) {
      // Handle bridge file resolution for better IDE support
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
      
      // Check if the changed file contains DI decorators or markers
      if (file.includes(opts.srcDir!) && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const hasDI = content.includes('@Service') || 
                       content.includes('@Inject') || 
                       content.includes('@Autowired') ||
                       content.includes('Inject<') ||
                       content.includes('InjectOptional<');
          
          if (hasDI) {
            if (opts.verbose) {
              console.log(`🔄 DI change detected in ${path.relative(process.cwd(), file)}`);
            }
            await transformDI();
            
            // For functional DI changes, we need to invalidate modules
            const absoluteFile = path.resolve(file);
            if (transformedFiles.has(absoluteFile)) {
              const mod = server.moduleGraph.getModuleById(file);
              if (mod) {
                server.reloadModule(mod);
              }
            } else {
              // For class-based DI, trigger a full reload
              server.ws.send({
                type: 'full-reload'
              });
            }
          }
        } catch (error) {
          console.error('Error checking file for DI changes:', error);
        }
      }
      
      // Also watch for changes to bridge files
      if (file.includes('.tdi2') && configManager) {
        const relativePath = path.relative(configManager.getBridgeDir(), file);
        if (!relativePath.startsWith('..')) {
          if (opts.verbose) {
            console.log(`🌉 Bridge file changed: ${relativePath}`);
          }
          
          // Trigger reload of modules that import from bridge files
          server.ws.send({
            type: 'full-reload'
          });
        }
      }
    },

    configureServer(server) {
      // Add middleware to serve debug information
      server.middlewares.use('/_di_debug', (req, res, next) => {
        if (req.url === '/_di_debug') {
          // Serve debug information about transformed files
          const summary = buildTimeTransformer?.getTransformationSummary();
          const configInfo = configManager ? {
            hash: configManager.getConfigHash(),
            configDir: configManager.getConfigDir(),
            bridgeDir: configManager.getBridgeDir()
          } : null;
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            config: configInfo,
            transformedFiles: Array.from(transformedFiles.keys()),
            summary: summary || { count: 0, functions: [], transformedFiles: [] },
            timestamp: new Date().toISOString()
          }, null, 2));
        } else {
          next();
        }
      });
      
      // Add middleware to serve config directory listing
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

    // Add build hook to ensure bridge files are properly generated for production
    async generateBundle() {
      if (configManager) {
        // Ensure bridge files are up to date for production build
        configManager.generateBridgeFiles();
        
        if (opts.verbose) {
          console.log('🏗️  Generated bridge files for production build');
        }
      }
    }
  };
}