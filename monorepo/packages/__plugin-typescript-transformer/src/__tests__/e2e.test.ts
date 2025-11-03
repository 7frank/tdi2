// src/__tests__/e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

function firstExistingPath(paths: string[]): string {
  for (const p of paths) if (fs.existsSync(p)) return p;
  throw new Error(`Fixtures not found in any of: \n${paths.join('\n')}`);
}

describe('TypeScript Transformer E2E (ts-patch + tsconfig plugin, no copying)', () => {
  const repoRoot = process.cwd();
  const tmpRoot = path.join(repoRoot, '.e2e-tmp');
  const outDir = path.join(tmpRoot, 'dist');
  const genDir = path.join(tmpRoot, 'generated');
  const tsconfigPath = path.join(tmpRoot, 'tsconfig.e2e.json');

  // Locate fixtures without guessing a single layout
  const fixturesDir = firstExistingPath([
    path.join(repoRoot, 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, '..', 'plugin-core', 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, 'plugin-core', 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, 'packages', 'plugin-core', 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, 'packages', 'typescript-transformer', 'src', '__tests__', 'fixtures'),
  ]);

  const counterService = path.join(fixturesDir, 'CounterService.ts');
  const counter = path.join(fixturesDir, 'Counter.tsx');

  beforeAll(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });
    fs.mkdirSync(genDir, { recursive: true });

    // ensure plugin is resolvable via require() (CJS build exposed via package.json "exports.require")
    const transformerPath = require.resolve('@tdi2/typescript-transformer');

    // Use "files" with absolute paths to avoid TS18003
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react',
        outDir,
        rootDir: fixturesDir,
        esModuleInterop: true,
        skipLibCheck: true,
        experimentalDecorators: true,
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true,
        plugins: [
          {
            transform: transformerPath,
            scanDirs: [fixturesDir],
            outputDir: genDir,
            enableFunctionalDI: true,
            enableInterfaceResolution: true,
            verbose: true,
             generateDebugFiles: true,
          },
        ],
      },
      files: [counterService, counter].map(p => p.replace(/\\/g, '/')),
      exclude: [outDir.replace(/\\/g, '/')],
    };

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

    // TypeScript MUST be invoked with Node to honor ts-patch
    const tscBin = require.resolve('typescript/bin/tsc');
    execSync(`node "${tscBin}" -p "${tsconfigPath}"`, {
      stdio: 'inherit',
      cwd: repoRoot,
      env: {
        ...process.env,
        NODE_PATH: `${path.join(repoRoot, 'node_modules')}${path.delimiter}${process.env.NODE_PATH || ''}`,
      },
    });
  }, 60000);

  afterAll(() => {
    if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('emits transformed Counter component using DI hooks', () => {
    const counterOutput = path.join(outDir, 'Counter.js');
    expect(fs.existsSync(counterOutput)).toBe(true);
    const transformed = fs.readFileSync(counterOutput, 'utf8');
    expect(transformed).toContain('useService');
    expect(transformed).toContain('CounterServiceInterface');
    expect(transformed).toContain('@tdi2/di-core/context');
  });

  it('emits CounterService with decorators compiled', () => {
    const serviceOutput = path.join(outDir, 'CounterService.js');
    expect(fs.existsSync(serviceOutput)).toBe(true);
    const compiled = fs.readFileSync(serviceOutput, 'utf8');
    expect(compiled).toContain('CounterService');
  });

  it('generates interface-resolution artifacts without touching src/', () => {
    expect(fs.existsSync(genDir)).toBe(true);
    expect(fs.readdirSync(genDir).length > 0).toBe(true);
  });

  it('writes interface-resolution config under node_modules/.tdi2', () => {
    const tdi2Dir = path.join(repoRoot, 'node_modules', '.tdi2');
    expect(fs.existsSync(path.join(tdi2Dir, 'configs'))).toBe(true);
  });
});
