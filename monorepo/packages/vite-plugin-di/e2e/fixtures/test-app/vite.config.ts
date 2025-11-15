import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scanDirs = [path.resolve(__dirname, './src')];
const outputDir = path.resolve(__dirname, './.tdi2');

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      scanDirs,
      outputDir,
      verbose: false,
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
