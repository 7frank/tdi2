import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { diEnhancedPlugin } from "@tdi2/vite-plugin-di";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    diEnhancedPlugin({
      scanDirs: [
        path.resolve(__dirname, "fixtures/package-a"),
        path.resolve(__dirname, "fixtures/package-b"),
      ],
      outputDir: path.resolve(__dirname, "generated"),
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      generateDebugFiles: true,
    }),

    react(),
  ],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./test-setup.ts",
  },
}));
