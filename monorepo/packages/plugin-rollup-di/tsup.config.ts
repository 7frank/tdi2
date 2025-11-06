import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['rollup', '@tdi2/di-core', '@tdi2/plugin-core'],
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2020',
});
