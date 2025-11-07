import { defineConfig, Format } from "tsup";
import { promises as fs } from "fs";
import { join } from "path";

async function waitFor(file: string, timeoutMs = 30000, intervalMs = 100) {
  const start = Date.now();
  for (;;) {
    try {
      console.log("exists?", file);
      await fs.access(file);
      return;
    } catch {}
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timeout waiting for ${file}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

const onSuccessWaitFor =
  (name: string, files: string[], timeoutMs = 30000) =>
  async () => {
    console.log("Built", name, "waiting for declaration files");
    for (const f of files) {
      await waitFor(f, timeoutMs);
    }
    console.log(name, "declaration files ready");
  };

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
  },
};

const entries = [
  "index.ts",
  "decorators.ts",
  "types.ts",
  "markers.ts",
  "container.ts",
  "context.tsx",
].map((name) => "src/" + name);

const expectedDtsFiles = entries
  .map((it) =>
    it
      .replace("src/", "dist/")
      .replace(".ts", ".d.ts")
      .replace(".d.tsx", ".d.ts")
  )
  .map((it) => join(process.cwd(), it));

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
    onSuccess: onSuccessWaitFor("entries", expectedDtsFiles),
  },
  examples,
  {
    entry: ["tools/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    outDir: "dist/tools",
    clean: false,
    sourcemap: true,
    onSuccess: onSuccessWaitFor("tools", [
      join(process.cwd(), "dist", "tools", "index.d.ts"),
    ]),
  },
]);
