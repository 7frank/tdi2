import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { diEnhancedPlugin } from "@tdi2/vite-plugin-di";
import Inspect from 'vite-plugin-inspect'


// this is actually required for class based @Inject decroator to work properly with vite
// the basic example does not require it in its current state though

const compilerOptions = { experimentalDecorators: true };

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      verbose: true,
      watch: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      generateDebugFiles: true,
      cleanOldConfigs: true,
      keepConfigCount: 3,
    }),
    react(),
    Inspect()
  ],

  optimizeDeps: {
    esbuildOptions: {
      tsconfigRaw: { compilerOptions },
    },
  },
});
