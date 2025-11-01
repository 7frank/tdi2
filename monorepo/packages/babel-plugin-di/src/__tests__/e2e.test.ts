import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transformFileSync } from '@babel/core';
import tdi2BabelPlugin from '../index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Babel Plugin E2E', () => {
  let tempDir: string;
  let transformedFile: string;

  beforeAll(async () => {
    // Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-test-'));

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

    // Transform Counter.tsx with babel + TDI2 plugin
    const counterFile = path.join(fixturesDest, 'Counter.tsx');
    const result = transformFileSync(counterFile, {
      plugins: [
        ['@babel/plugin-syntax-typescript', { isTSX: true }],
        [
          tdi2BabelPlugin,
          {
            srcDir: fixturesDest,
            outputDir: path.join(fixturesDest, 'generated'),
            verbose: false,
            enableFunctionalDI: true,
            enableInterfaceResolution: true,
          },
        ],
      ],
      presets: [
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
        '@babel/preset-react',
      ],
    });

    if (result && result.code) {
      transformedFile = path.join(tempDir, 'Counter.transformed.js');
      fs.writeFileSync(transformedFile, result.code);
    }
  });

  afterAll(() => {
    // Cleanup
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should transform Counter component to use DI', () => {
    expect(fs.existsSync(transformedFile)).toBe(true);

    const transformedContent = fs.readFileSync(transformedFile, 'utf-8');

    // Verify transformation happened
    expect(transformedContent).toContain('useService');
    expect(transformedContent).toContain('CounterServiceInterface');

    // Verify imports were added
    expect(transformedContent).toContain('@tdi2/di-core/context');
  });

  it('should generate interface resolution config', () => {
    const generatedDir = path.join(tempDir, 'src', 'generated');
    expect(fs.existsSync(generatedDir)).toBe(true);

    // Check for generated config files
    const files = fs.readdirSync(generatedDir);
    expect(files.length).toBeGreaterThan(0);
  });
});
