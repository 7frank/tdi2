import { defineConfig } from "tsup";

export default defineConfig([
  // Main analytics and utilities
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist",
    clean: true,
    sourcemap: true,
    external: ["@tdi2/di-core"]
  },
  // Container analytics utilities
  {
    entry: ["src/utils/container-analytics.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist/utils",
    clean: false,
    sourcemap: true,
    external: ["@tdi2/di-core"]
  },
  // Serve functionality
  {
    entry: ["src/serve/index.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist/serve",
    clean: false,
    sourcemap: true,
    external: ["express", "ws", "chokidar", "open", "@tdi2/di-core"]
  },
  // CLI executable
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist",
    clean: false,
    sourcemap: true,
    banner: {
      js: "#!/usr/bin/env node"
    },
    esbuildOptions(options) {
      options.platform = "node";
    },
    external: ["@tdi2/di-core"]
  }
]);