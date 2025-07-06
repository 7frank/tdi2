import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      // Enable automatic interface resolution
      enableInterfaceResolution: true,
      
      // Enable functional component DI
      enableFunctionalDI: true,
      
      // Enable verbose logging for development
      verbose: true,
      
      // Source directory to scan
      srcDir: './src',
    }),
    react(),
  ],
});