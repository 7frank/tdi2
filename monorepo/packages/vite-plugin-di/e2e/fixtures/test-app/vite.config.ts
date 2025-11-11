import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      scanDirs: ['./src'],
      outputDir: './.tdi2',
      verbose: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      generateDebugFiles: false,
      watch: true,
    }),
    react(),
  ],
  server: {
    port: 3000,
  },
});
