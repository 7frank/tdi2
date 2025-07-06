import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { diEnhancedPlugin } from "@tdi2/vite-plugin-di";

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
  ],
});
