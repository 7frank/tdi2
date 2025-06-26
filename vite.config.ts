// vite.config.ts - Updated for enhanced interface-based DI

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { diEnhancedPlugin } from './vite-plugin-di-enhanced'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      verbose: true,
      watch: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true, // NEW: Enable automatic interface resolution
      generateDebugFiles: true,
      cleanOldConfigs: true,
      keepConfigCount: 3
    }),
    react()
  ],
  server: {
    // Add custom middleware endpoints for DI debugging
    host: true,
    port: 5173
  },
  build: {
    // Ensure DI transformation runs before build
    target: 'es2020'
  }
})