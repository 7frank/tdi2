import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/playground/',
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
      '../../packages/di-core/tools/functional-di-enhanced-transformer/transformation-pipeline.ts': path.resolve(__dirname, '../../packages/di-core/tools/functional-di-enhanced-transformer/transformation-pipeline.ts'),
      '../../packages/di-core/tools/interface-resolver/integrated-interface-resolver.ts': path.resolve(__dirname, '../../packages/di-core/tools/interface-resolver/integrated-interface-resolver.ts'),
      '../../packages/di-core/tools/shared/SharedDependencyExtractor.ts': path.resolve(__dirname, '../../packages/di-core/tools/shared/SharedDependencyExtractor.ts'),
      '../../packages/di-core/tools/shared/SharedTypeResolver.ts': path.resolve(__dirname, '../../packages/di-core/tools/shared/SharedTypeResolver.ts'),
      '../../packages/di-core/tools/functional-di-enhanced-transformer/di-inject-markers.ts': path.resolve(__dirname, '../../packages/di-core/tools/functional-di-enhanced-transformer/di-inject-markers.ts'),
      '../../packages/di-core/tools/functional-di-enhanced-transformer/import-manager.ts': path.resolve(__dirname, '../../packages/di-core/tools/functional-di-enhanced-transformer/import-manager.ts'),

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
