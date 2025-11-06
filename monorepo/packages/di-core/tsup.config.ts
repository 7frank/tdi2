import { defineConfig, Format } from "tsup";

const examples = {
  entry: [
    "tools/functional-di-enhanced-transformer/__tests__/__fixtures__/*.ts*",
  ],
  format: ["esm"] as Format[],
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
  },
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

export default defineConfig([
  {
    entry: entries,
    format: ["esm"] as Format[],
    dts: true,
    outDir: "dist",
    splitting: false,
    clean: true,
    skipNodeModulesBundle: true,
    external: ["react", "react-dom"],
    sourcemap: true,
    // esbuildOptions(options) {
    //   options.bundle = true;
    // },
  },
  examples,
  {
    entry: ["tools/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    outDir: "dist/tools",
    clean: false,
    sourcemap: true,
    // esbuildOptions(options) {
    //   options.bundle = true;
    // },
  },
]);
