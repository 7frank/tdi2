import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: false,
    outDir: "dist",
    clean: true,
    skipNodeModulesBundle: true,
  },
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: { only: true },
    outDir: ".",
    clean: false,
    //     banner: {
    //       js: "#!/usr/bin/env node",
    //     },
    //     onSuccess: "chmod +x dist/index.js",
  },
]);
