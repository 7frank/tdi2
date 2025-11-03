import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as esbuild from 'esbuild';
import { tdi2Plugin } from '../index';
import * as fs from 'fs';
import * as path from 'path';

function firstExistingPath(paths: string[]): string {
  for (const p of paths) if (fs.existsSync(p)) return p;
  throw new Error(`Fixtures not found in any of: \n${paths.join('\n')}`);
}

describe('esbuild Plugin E2E', () => {
  const repoRoot = process.cwd();
  const tmpRoot = path.join(repoRoot, '.e2e-tmp');
  let outputFile: string;

  // Locate plugin-core fixtures (Counter/CounterService)
  const fixturesDir = firstExistingPath([
    path.join(repoRoot, '..', 'plugin-core', 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, 'plugin-core', 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, 'packages', 'plugin-core', 'src', '__tests__', 'fixtures'),
  ]);

  const counterService = path.join(fixturesDir, 'CounterService.ts');
  const counter = path.join(fixturesDir, 'Counter.tsx');

  beforeAll(async () => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    outputFile = path.join(tmpRoot, 'bundle.js');

    // Create entry file
    const entryFile = path.join(tmpRoot, 'index.ts');
    fs.writeFileSync(entryFile, `
      export { Counter } from '${counter.replace(/\\/g, '/')}';
      export { CounterService } from '${counterService.replace(/\\/g, '/')}';
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
          scanDirs: [fixturesDir],
          outputDir: path.join(tmpRoot, 'generated'),
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
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
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
    // Config files are in node_modules/.tdi2, not src/generated
    const tdi2Dir = path.join(process.cwd(), 'node_modules', '.tdi2');
    expect(fs.existsSync(tdi2Dir)).toBe(true);

    // Check for generated config files
    const configDirs = fs.readdirSync(path.join(tdi2Dir, 'configs'));
    expect(configDirs.length).toBeGreaterThan(0);
  });
});
