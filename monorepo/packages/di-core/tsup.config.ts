import { defineConfig } from "tsup";

const examples = {
  entry: [
    "tools/functional-di-enhanced-transformer/__tests__/__fixtures__/*.ts*",
  ],
  format: ["esm"],
  dts: false,
  outDir: "dist/examples",
  splitting: false,
  clean: true,
  skipNodeModulesBundle: true,
  external: ["react", "react-dom"],
  sourcemap: true,
  //experimentalDts: { compilerOptions: { noEmitOnError: false } },
  esbuildOptions(options) {
    // Modify esbuild config here
    //options.minify = false;
    options.bundle = true;
    // options.external = ['react', 'react-dom'];
    // options.define = {
    //   'process.env.NODE_ENV': '"development"'
    // };
  }
};

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
  examples,
  ...entries,
  {
    entry: ["tools/index.ts"],
    format: ["esm"],
    dts: true,
    outDir: "dist/tools",
    clean: false,
    sourcemap: true
  },
]);
