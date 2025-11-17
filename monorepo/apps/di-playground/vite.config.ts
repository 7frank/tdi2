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
  optimizeDeps: {
    exclude: ['@tdi2/di-core']
  }
});
