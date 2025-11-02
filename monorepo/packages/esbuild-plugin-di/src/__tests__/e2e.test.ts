import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as esbuild from 'esbuild';
import { tdi2Plugin } from '../index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('esbuild Plugin E2E', () => {
  let tempDir: string;
  let outputFile: string;

  beforeAll(async () => {
    // Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'esbuild-test-'));
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

    // Run esbuild with TDI2 plugin
    await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: outputFile,
      platform: 'node',
      format: 'cjs',
      plugins: [
        tdi2Plugin({
          scanDirs: [fixturesDest],
          outputDir: path.join(fixturesDest, 'generated'),
          verbose: false,
          enableFunctionalDI: true,
          enableInterfaceResolution: true,
        }),
      ],
      external: [
        'react',
        '@tdi2/di-core',
        '@tdi2/di-core/markers',
        '@tdi2/di-core/context',
      ],
    });
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
