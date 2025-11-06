import { defineConfig } from "tsup";

export default defineConfig([
  // ESM build with types
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist",
    clean: true,
    skipNodeModulesBundle: true,
    sourcemap: true,
    target: "es2020",
    splitting: false,
    treeshake: true
  },
  // Additional entry points for subpath exports
  {
    entry: {
      "types": "src/types.ts",
      "console": "src/console-monkey-patch.ts", 
      "otel": "src/otel-logger-provider.ts",
      "service": "src/tdi-logger-service.ts"
    },
    format: ["esm"],
    dts: true,
    outDir: "dist",
    clean: false,
    skipNodeModulesBundle: true,
    sourcemap: true,
    target: "es2020"
  }
]);