import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    // Skip DI plugin in test mode to avoid hanging
    ...(mode === 'test'
      ? []
      : [
          diEnhancedPlugin({
            scanDirs: [
              path.resolve(__dirname, 'fixtures/package-a'),
              path.resolve(__dirname, 'fixtures/package-b'),
            ],
            outputDir: path.resolve(__dirname, 'generated'),
            verbose: true,
            enableFunctionalDI: true,
            enableInterfaceResolution: true,
            generateDebugFiles: true,
          }),
        ]),
    react(),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './test-setup.ts',
  },
}));
