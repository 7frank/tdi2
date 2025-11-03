// tsup.config.ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs','esm'],
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
  dts: false,
  clean: true,
  sourcemap: true,
  external: ['typescript','ts-patch','ts-morph','@tdi2/di-core'],
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2020',
});
