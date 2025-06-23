// vite-plugin-di.ts

import { Plugin } from 'vite';
import { DITransformer } from './tools/di-transformer';
import * as fs from 'fs';
import * as path from 'path';

interface DIPluginOptions {
  srcDir?: string;
  outputDir?: string;
  verbose?: boolean;
  watch?: boolean;
}

export function diPlugin(options: DIPluginOptions = {}): Plugin {
  const opts = {
    srcDir: './src',
    outputDir: './src/generated',
    verbose: false,
    watch: true,
    ...options
  };

  let transformer: DITransformer;
  let isTransforming = false;

  const transformDI = async () => {
    if (isTransforming) return;
    
    isTransforming = true;
    try {
      if (opts.verbose) {
        console.log('🔧 Running DI transformation...');
      }
      
      transformer = new DITransformer(opts);
      await transformer.transform();
      await transformer.save();
      
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

    async handleHotUpdate({ file, server }) {
      if (!opts.watch) return;
      
      // Check if the changed file contains DI decorators
      if (file.includes(opts.srcDir!) && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          if (content.includes('@Service') || content.includes('@Inject') || content.includes('@Autowired')) {
            if (opts.verbose) {
              console.log(`🔄 DI change detected in ${path.relative(process.cwd(), file)}`);
            }
            await transformDI();
            
            // Trigger a full reload since DI configuration changed
            server.ws.send({
              type: 'full-reload'
            });
          }
        } catch (error) {
          console.error('Error checking file for DI changes:', error);
        }
      }
    }
  };
}