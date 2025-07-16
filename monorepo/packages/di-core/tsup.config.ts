import { defineConfig } from "tsup";

const entries = [
  "index.ts",
  "decorators.ts",
  "types.ts",
  "markers.ts",
  "container.ts",
  "context.tsx",
]
  .map((name) => "src/" + name)
  .map((it) => ({
    entry: [it],
    format: ["esm"],
    dts: true,
    outDir: "dist",
    clean: true,
    skipNodeModulesBundle: true,
    external: ["react", "react-dom"],
     sourcemap: true,
  }));

export default defineConfig([
  ...entries,
  {
    entry: ["tools/index.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist/tools",
    clean: false,
    sourcemap: true,
  },
]);
