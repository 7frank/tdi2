import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      // Stub out Node.js built-in modules for browser compatibility
      // ts-morph and related packages try to import these but don't actually need them
      // when using in-memory file system
      'fs': path.resolve(__dirname, 'src/stubs/node-stub.ts'),
      'path': path.resolve(__dirname, 'src/stubs/node-stub.ts'),
      'os': path.resolve(__dirname, 'src/stubs/node-stub.ts'),
      'crypto': path.resolve(__dirname, 'src/stubs/node-stub.ts'),
      'module': path.resolve(__dirname, 'src/stubs/node-stub.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@tdi2/di-core'],
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      // Override Node.js built-ins for browser compatibility
      inject: []
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'global': 'globalThis'
  }
});
