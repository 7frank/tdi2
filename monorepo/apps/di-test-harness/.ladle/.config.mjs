// .ladle/config.mjs - Fixed config for TypeScript
import { defineConfig } from "@ladle/react";

import react from "@vitejs/plugin-react";
import { diEnhancedPlugin } from "@tdi2/vite-plugin-di";

// this is actually required for class based inject to work properly with vite
const compilerOptions = { experimentalDecorators: true };

export default defineConfig({
  stories: "src/**/*.stories.{js,jsx,ts,tsx}",
  viteConfig: {
    plugins: [
      diEnhancedPlugin({
        verbose: true,
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
    build: {
      // Ensure DI transformation runs before build
      target: "es2020",
    },
  },
});
