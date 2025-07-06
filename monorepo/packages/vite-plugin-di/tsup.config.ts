import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false, // Keep readable for debugging
  treeshake: true,
  target: 'node18',
  external: [
    'vite',
    '@tdi2/di-core',
    // Node.js built-ins
    'fs',
    'path',
    'url',
    'util',
    'events',
    'stream',
    'buffer',
    'crypto',
  ],
  banner: {
    js: '// @tdi2/vite-plugin-di - Vite plugin for TDI2 dependency injection',
  },
  esbuildOptions(options) {
    options.conditions = ['node'];
  },
  onSuccess: async () => {
    console.log('✅ @tdi2/vite-plugin-di built successfully');
  },
});