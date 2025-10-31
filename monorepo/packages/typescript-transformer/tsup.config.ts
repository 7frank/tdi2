import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // TODO: Fix DTS generation issue
  clean: true,
  sourcemap: true,
  external: ['typescript', 'ts-patch', 'ts-morph', '@tdi2/di-core'],
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2020',
});
