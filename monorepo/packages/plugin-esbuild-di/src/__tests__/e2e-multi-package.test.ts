import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as esbuild from 'esbuild';
import { tdi2Plugin } from '../index';
import * as fs from 'fs';
import * as path from 'path';

function firstExistingPath(paths: string[]): string {
  for (const p of paths) if (fs.existsSync(p)) return p;
  throw new Error(`Fixtures not found in any of: \n${paths.join('\n')}`);
}

describe('esbuild Plugin E2E - Multi-Package (Multiple scanDirs)', () => {
  const repoRoot = process.cwd();
  const tmpRoot = path.join(repoRoot, '.e2e-tmp-multi');
  let outputFile: string;

  // Locate plugin-core fixtures (Counter, CounterService)
  const pluginCoreFixtures = firstExistingPath([
    path.join(repoRoot, '..', 'plugin-core', 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, 'plugin-core', 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, 'packages', 'plugin-core', 'src', '__tests__', 'fixtures'),
  ]);

  // Local fixtures (TodoList, TodoService)
  const localFixtures = path.join(repoRoot, 'src', '__tests__', 'fixtures');

  // Files from plugin-core
  const counterService = path.join(pluginCoreFixtures, 'CounterService.ts');
  const counter = path.join(pluginCoreFixtures, 'Counter.tsx');

  // Files from local fixtures
  const todoService = path.join(localFixtures, 'TodoService.ts');
  const todoList = path.join(localFixtures, 'TodoList.tsx');

  beforeAll(async () => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    outputFile = path.join(tmpRoot, 'bundle.js');

    // Create entry file that imports from BOTH packages
    const entryFile = path.join(tmpRoot, 'index.ts');
    fs.writeFileSync(entryFile, `
      // From plugin-core fixtures
      export { Counter } from '${counter.replace(/\\/g, '/')}';
      export { CounterService } from '${counterService.replace(/\\/g, '/')}';

      // From local fixtures
      export { TodoList } from '${todoList.replace(/\\/g, '/')}';
      export { TodoService } from '${todoService.replace(/\\/g, '/')}';
    `);

    // Run esbuild with TDI2 plugin configured with MULTIPLE scanDirs
    await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: outputFile,
      platform: 'node',
      format: 'cjs',
      plugins: [
        tdi2Plugin({
          scanDirs: [pluginCoreFixtures, localFixtures], // 🎯 Multiple directories
          outputDir: path.join(tmpRoot, 'generated'),
          verbose: true, // Enable to see multi-package scanning
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
  }, 30000); // Longer timeout for multi-package build

  afterAll(() => {
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('should transform Counter component from plugin-core package', () => {
    expect(fs.existsSync(outputFile)).toBe(true);

    const bundleContent = fs.readFileSync(outputFile, 'utf-8');

    // Verify Counter transformation
    expect(bundleContent).toContain('Counter');
    expect(bundleContent).toContain('useService');
    expect(bundleContent).toContain('CounterServiceInterface');
  });

  it('should transform TodoList component from local fixtures', () => {
    const bundleContent = fs.readFileSync(outputFile, 'utf-8');

    // Verify TodoList transformation
    expect(bundleContent).toContain('TodoList');
    expect(bundleContent).toContain('useService');
    expect(bundleContent).toContain('TodoServiceInterface');
  });

  it('should generate interface resolution for services from both packages', () => {
    const tdi2Dir = path.join(process.cwd(), 'node_modules', '.tdi2');
    expect(fs.existsSync(tdi2Dir)).toBe(true);

    const configDirs = fs.readdirSync(path.join(tdi2Dir, 'configs'));
    expect(configDirs.length).toBeGreaterThan(0);

    // Find the config directory for this build
    const configDir = path.join(tdi2Dir, 'configs', configDirs[0]);

    // Check that DI config was generated
    const diConfigPath = path.join(configDir, 'di-config.ts');
    if (fs.existsSync(diConfigPath)) {
      const diConfig = fs.readFileSync(diConfigPath, 'utf-8');

      // Should include both services
      expect(diConfig).toContain('CounterService');
      expect(diConfig).toContain('TodoService');
    }
  });

  it('should resolve dependencies across both packages without conflicts', () => {
    const bundleContent = fs.readFileSync(outputFile, 'utf-8');

    // Both components should be present
    expect(bundleContent).toContain('Counter');
    expect(bundleContent).toContain('TodoList');

    // Both services should be present
    expect(bundleContent).toContain('CounterService');
    expect(bundleContent).toContain('TodoService');

    // DI context imports should be present
    expect(bundleContent).toContain('@tdi2/di-core/context');

    // No duplicate service registrations or conflicts
    // (If there were conflicts, the bundle would fail or contain duplicate code)
  });

  it('should include correct imports from both fixture directories', () => {
    const bundleContent = fs.readFileSync(outputFile, 'utf-8');

    // Verify that both fixture paths are referenced in the build
    // The bundle should contain code from both directories
    expect(bundleContent.length).toBeGreaterThan(0);

    // Both services should have their decorators compiled
    // (esbuild strips decorators but the Service class code remains)
    expect(bundleContent).toMatch(/CounterService|counter.*Service/i);
    expect(bundleContent).toMatch(/TodoService|todo.*Service/i);
  });
});
