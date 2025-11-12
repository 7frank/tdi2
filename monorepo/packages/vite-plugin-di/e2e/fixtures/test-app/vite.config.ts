import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';
import path from 'path';




const scanDirs = [path.resolve(__dirname, './src')];
const outputDir = path.resolve(__dirname, './.tdi2');

console.log("scanDirs",scanDirs)
console.log("outputDir",outputDir)

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      scanDirs,
      outputDir,
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
