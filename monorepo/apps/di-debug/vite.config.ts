import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      verbose: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      generateDebugFiles: true,
    }),
    react(),
  ],
  build: {
    outDir: 'dist/dashboard',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
});