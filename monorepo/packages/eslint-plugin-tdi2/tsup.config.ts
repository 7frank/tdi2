import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.js'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'es2020',
  treeshake: true,
});
