import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5174,
    host: true
  },
  resolve: {
    alias: {
      // Import browser-compatible tools directly from source
      '../../packages/di-core/tools/functional-di-enhanced-transformer/transformation-pipeline': path.resolve(__dirname, '../../packages/di-core/tools/functional-di-enhanced-transformer/transformation-pipeline.ts'),
      '../../packages/di-core/tools/interface-resolver/integrated-interface-resolver': path.resolve(__dirname, '../../packages/di-core/tools/interface-resolver/integrated-interface-resolver.ts'),
      '../../packages/di-core/tools/shared/SharedDependencyExtractor': path.resolve(__dirname, '../../packages/di-core/tools/shared/SharedDependencyExtractor.ts'),
      '../../packages/di-core/tools/shared/SharedTypeResolver': path.resolve(__dirname, '../../packages/di-core/tools/shared/SharedTypeResolver.ts'),
      '../../packages/di-core/tools/functional-di-enhanced-transformer/di-inject-markers': path.resolve(__dirname, '../../packages/di-core/tools/functional-di-enhanced-transformer/di-inject-markers.ts'),

      // Prevent Node.js modules from being bundled
      'crypto': path.resolve(__dirname, './src/polyfills/crypto.ts'),
      'module': path.resolve(__dirname, './src/polyfills/empty.ts'),
      'fs': path.resolve(__dirname, './src/polyfills/empty.ts'),
      'path': path.resolve(__dirname, './src/polyfills/path.ts'),
      'os': path.resolve(__dirname, './src/polyfills/empty.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@tdi2/di-core'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
});
