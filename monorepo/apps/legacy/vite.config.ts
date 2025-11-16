// vite.config.ts - Updated for enhanced interface-based DI

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

// this is actually required for class based inject to work properly with vite
const compilerOptions = { experimentalDecorators: true };

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      watch: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true, // NEW: Enable automatic interface resolution
      generateDebugFiles: true,
      cleanOldConfigs: true,
      keepConfigCount: 3,
    }),
    react(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      tsconfigRaw: { compilerOptions },
    },
  },

  server: {
    // Add custom middleware endpoints for DI debugging
    host: true,
    port: 5173,
  },
  build: {
    // Ensure DI transformation runs before build
    target: "es2020",
  },
});
