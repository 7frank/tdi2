import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { diEnhancedPlugin } from "@tdi2/vite-plugin-di";

const compilerOptions = { experimentalDecorators: true };

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      watch: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
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
});