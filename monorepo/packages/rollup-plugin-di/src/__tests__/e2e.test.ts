import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { tdi2Plugin } from '../index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Rollup Plugin E2E', () => {
  let tempDir: string;
  let outputFile: string;

  beforeAll(async () => {
    // Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollup-test-'));
    outputFile = path.join(tempDir, 'bundle.js');

    // Copy test fixtures
    const fixturesSource = path.join(__dirname, '../../../plugin-core/src/__tests__/fixtures');
    const fixturesDest = path.join(tempDir, 'src');

    fs.mkdirSync(fixturesDest, { recursive: true });
    fs.copyFileSync(
      path.join(fixturesSource, 'CounterService.ts'),
      path.join(fixturesDest, 'CounterService.ts')
    );
    fs.copyFileSync(
      path.join(fixturesSource, 'Counter.tsx'),
      path.join(fixturesDest, 'Counter.tsx')
    );

    // Create entry file
    const entryFile = path.join(fixturesDest, 'index.ts');
    fs.writeFileSync(entryFile, `
      export { Counter } from './Counter';
      export { CounterService } from './CounterService';
    `);

    // Run rollup with TDI2 plugin
    const bundle = await rollup({
      input: entryFile,
      plugins: [
        nodeResolve({
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        }),
        tdi2Plugin({
          scanDirs: [fixturesDest],
          outputDir: path.join(fixturesDest, 'generated'),
          verbose: true,
          enableFunctionalDI: true,
          enableInterfaceResolution: true,
        }),
        typescript({
          tsconfig: false,
          compilerOptions: {
            target: 'ES2020',
            module: 'ESNext',
            jsx: 'react',
            esModuleInterop: true,
            skipLibCheck: true,
            experimentalDecorators: true,
          },
        }),
      ],
      external: [
        'react',
        '@tdi2/di-core',
        '@tdi2/di-core/markers',
        '@tdi2/di-core/context',
      ],
    });

    await bundle.write({
      file: outputFile,
      format: 'cjs',
    });

    await bundle.close();
  });

  afterAll(() => {
    // Cleanup
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should transform Counter component to use DI', () => {
    expect(fs.existsSync(outputFile)).toBe(true);

    const bundleContent = fs.readFileSync(outputFile, 'utf-8');

    // Verify transformation happened
    expect(bundleContent).toContain('useService');
    expect(bundleContent).toContain('CounterServiceInterface');

    // Verify imports were added
    expect(bundleContent).toContain('@tdi2/di-core/context');
  });

  it('should generate interface resolution config', () => {
    const generatedDir = path.join(tempDir, 'src', 'generated');
    expect(fs.existsSync(generatedDir)).toBe(true);

    // Check for generated config files
    const files = fs.readdirSync(generatedDir);
    expect(files.length).toBeGreaterThan(0);
  });
});
