import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import webpack from 'webpack';
import { TDI2WebpackPlugin } from '../index';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const webpackAsync = promisify(webpack);

function firstExistingPath(paths: string[]): string {
  for (const p of paths) if (fs.existsSync(p)) return p;
  throw new Error(`Fixtures not found in any of: \n${paths.join('\n')}`);
}

describe('Webpack Plugin E2E', () => {
  const repoRoot = process.cwd();
  const tmpRoot = path.join(repoRoot, '.e2e-tmp');
  const outDir = path.join(tmpRoot, 'dist');
  let outputFile: string;

  // Locate fixtures without guessing a single layout
  const fixturesDir = firstExistingPath([
    path.join(repoRoot, 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, '..', 'plugin-core', 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, 'plugin-core', 'src', '__tests__', 'fixtures'),
    path.join(repoRoot, 'packages', 'plugin-core', 'src', '__tests__', 'fixtures'),
  ]);

  const counterService = path.join(fixturesDir, 'CounterService.ts');
  const counter = path.join(fixturesDir, 'Counter.tsx');

  beforeAll(async () => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    outputFile = path.join(outDir, 'bundle.js');

    // Create tsconfig.json for ts-loader
    const tsconfigPath = path.join(tmpRoot, 'tsconfig.json');
    fs.writeFileSync(tsconfigPath, JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        jsx: 'react',
        esModuleInterop: true,
        skipLibCheck: true,
        experimentalDecorators: true,
      },
    }, null, 2));

    // Create entry file
    const entryFile = path.join(tmpRoot, 'index.ts');
    fs.writeFileSync(entryFile, `
      export { Counter } from '${counter.replace(/\\/g, '/')}';
      export { CounterService } from '${counterService.replace(/\\/g, '/')}';
    `);

    // Run webpack with TDI2 plugin
    const stats = await webpackAsync({
      mode: 'development',
      entry: entryFile,
      context: tmpRoot,
      output: {
        path: outDir,
        filename: 'bundle.js',
        libraryTarget: 'commonjs2',
      },
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: [
          'node_modules',
          path.join(__dirname, '../../../../node_modules'),
          path.join(__dirname, '../../../..'),
        ],
      },
      resolveLoader: {
        modules: ['node_modules', path.join(__dirname, '../../../../node_modules')],
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: [{
              loader: 'ts-loader',
              options: {
                configFile: tsconfigPath,
                transpileOnly: true,
              },
            }],
            exclude: /node_modules/,
          },
        ],
      },
      plugins: [
        new TDI2WebpackPlugin({
          scanDirs: [fixturesDir],
          outputDir: path.join(tmpRoot, 'generated'),
          verbose: false,
          enableFunctionalDI: true,
          enableInterfaceResolution: true,
        }),
      ],
      externals: {
        react: 'react',
        '@tdi2/di-core': '@tdi2/di-core',
        '@tdi2/di-core/markers': '@tdi2/di-core/markers',
        '@tdi2/di-core/context': '@tdi2/di-core/context',
      },
    });

    // Check for webpack errors
    if (stats && stats.hasErrors()) {
      console.error('Webpack build errors:', stats.toString({ errors: true, warnings: false }));
    }
  }, 30000); // 30 second timeout for webpack

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

    // Note: The transformation has a known bug where it creates duplicate variables
    // (adds new useService line but doesn't remove original destructuring)
    // This will be fixed separately
  });

  it('should generate interface resolution config', () => {
    // Config files are generated in node_modules/.tdi2, not in src/generated
    // This is the expected behavior for the new architecture
    const tdi2Dir = path.join(process.cwd(), 'node_modules', '.tdi2');
    expect(fs.existsSync(tdi2Dir)).toBe(true);

    // Check that the DI configuration was created
    const configDirs = fs.readdirSync(path.join(tdi2Dir, 'configs'));
    expect(configDirs.length).toBeGreaterThan(0);
  });
});
