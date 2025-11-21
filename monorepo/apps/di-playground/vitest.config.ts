import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      // Browser polyfills for Node.js modules
      'crypto': path.resolve(__dirname, './src/polyfills/crypto.ts'),
      'module': path.resolve(__dirname, './src/polyfills/empty.ts'),
      'fs': path.resolve(__dirname, './src/polyfills/empty.ts'),
      'path': path.resolve(__dirname, './src/polyfills/path.ts'),
      'os': path.resolve(__dirname, './src/polyfills/empty.ts'),
    },
  },
});
