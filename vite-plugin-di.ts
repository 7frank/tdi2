// vite-plugin-di.ts - Enhanced with build-time functional DI transformation

import { Plugin } from 'vite';

import { BuildTimeDITransformer } from './tools/build-time-di-transformer';
import * as fs from 'fs';
import * as path from 'path';

interface DIPluginOptions {
  srcDir?: string;
  outputDir?: string;
  verbose?: boolean;
  watch?: boolean;
  enableFunctionalDI?: boolean;
  generateDebugFiles?: boolean;
}

export function diPlugin(options: DIPluginOptions = {}): Plugin {
  const opts = {
    srcDir: './src',
    outputDir: './src/generated',
    verbose: false,
    watch: true,
    enableFunctionalDI: true,
    generateDebugFiles: false,
    ...options
  };

  let buildTimeTransformer: BuildTimeDITransformer;
  let isTransforming = false;
  let transformedFiles: Map<string, string> = new Map();

  const transformDI = async () => {
    if (isTransforming) return;
    
    isTransforming = true;
    try {
      if (opts.verbose) {
        console.log('🔧 Running DI transformation...');
      }
      
      // Run build-time functional DI transformation
      if (opts.enableFunctionalDI) {
        buildTimeTransformer = new BuildTimeDITransformer({
          srcDir: opts.srcDir,
          outputDir: opts.outputDir,
          generateDebugFiles: opts.generateDebugFiles,
          verbose: opts.verbose
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
    },

    configureServer(server) {
      // Add middleware to serve transformed files
      server.middlewares.use('/_di_debug', (req, res, next) => {
        if (req.url === '/_di_debug') {
          // Serve debug information about transformed files
          const summary = buildTimeTransformer?.getTransformationSummary();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            transformedFiles: Array.from(transformedFiles.keys()),
            summary: summary || { count: 0, functions: [], transformedFiles: [] }
          }, null, 2));
        } else {
          next();
        }
      });
    }
  };
}