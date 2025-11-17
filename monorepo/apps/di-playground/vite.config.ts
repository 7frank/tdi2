import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
      // Prevent Node.js modules from being bundled
      'module': false,
      'fs': false,
      'path': false,
      'os': false,
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
