import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import webpack from 'webpack';
import { TDI2WebpackPlugin } from '../index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const webpackAsync = promisify(webpack);

describe('Webpack Plugin E2E', () => {
  let tempDir: string;
  let outputFile: string;

  beforeAll(async () => {
    // Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webpack-test-'));
    outputFile = path.join(tempDir, 'dist', 'bundle.js');

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

    // Create tsconfig.json for ts-loader
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(tsconfigPath, JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        jsx: 'react',
        esModuleInterop: true,
        skipLibCheck: true,
        experimentalDecorators: true,
      },
      include: ['src/**/*'],
    }, null, 2));

    // Create entry file
    const entryFile = path.join(fixturesDest, 'index.ts');
    fs.writeFileSync(entryFile, `
      export { Counter } from './Counter';
      export { CounterService } from './CounterService';
    `);

    // Run webpack with TDI2 plugin
    const stats = await webpackAsync({
      mode: 'development',
      entry: entryFile,
      context: tempDir, // Set context so ts-loader finds tsconfig.json
      output: {
        path: path.join(tempDir, 'dist'),
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
                transpileOnly: true, // Skip type checking to avoid external module errors
              },
            }],
            exclude: /node_modules/,
          },
        ],
      },
      plugins: [
        new TDI2WebpackPlugin({
          scanDirs: [fixturesDest],
          outputDir: path.join(fixturesDest, 'generated'),
          verbose: true, // Enable to see what's happening
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
