import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as ts from 'typescript';
import tdi2Transformer from '../transformer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('TypeScript Transformer E2E', () => {
  let tempDir: string;
  let outputDir: string;

  beforeAll(async () => {
    // Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-transformer-test-'));
    outputDir = path.join(tempDir, 'dist');

    // Copy test fixtures
    const fixturesSource = path.join(__dirname, '../../../plugin-core/src/__tests__/fixtures');
    const fixturesDest = path.join(tempDir, 'src');

    fs.mkdirSync(fixturesDest, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });

    fs.copyFileSync(
      path.join(fixturesSource, 'CounterService.ts'),
      path.join(fixturesDest, 'CounterService.ts')
    );
    fs.copyFileSync(
      path.join(fixturesSource, 'Counter.tsx'),
      path.join(fixturesDest, 'Counter.tsx')
    );

    // Create tsconfig.json
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(
      tsconfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs',
            jsx: 'react',
            outDir: './dist',
            rootDir: './src',
            esModuleInterop: true,
            skipLibCheck: true,
            experimentalDecorators: true,
          },
          include: ['src/**/*'],
        },
        null,
        2
      )
    );

    // Compile with custom transformer
    const program = ts.createProgram(
      [
        path.join(fixturesDest, 'CounterService.ts'),
        path.join(fixturesDest, 'Counter.tsx'),
      ],
      {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        outDir: outputDir,
        rootDir: fixturesDest,
        esModuleInterop: true,
        skipLibCheck: true,
        experimentalDecorators: true,
      }
    );

    // Create transformer factory
    const transformerFactory = tdi2Transformer(
      program,
      {
        srcDir: fixturesDest,
        outputDir: path.join(fixturesDest, 'generated'),
        verbose: false,
        enableFunctionalDI: true,
        enableInterfaceResolution: true,
      },
      { ts }
    );

    // Emit with transformer
    const emitResult = program.emit(
      undefined,
      undefined,
      undefined,
      undefined,
      {
        before: [transformerFactory],
      }
    );

    if (emitResult.emitSkipped) {
      const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
      diagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start!
          );
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
          console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        }
      });
    }
  }, 30000); // 30 second timeout for compilation

  afterAll(() => {
    // Cleanup
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should transform Counter component to use DI', () => {
    const counterOutput = path.join(outputDir, 'Counter.js');
    expect(fs.existsSync(counterOutput)).toBe(true);

    const transformedContent = fs.readFileSync(counterOutput, 'utf-8');

    // Verify transformation happened
    expect(transformedContent).toContain('useService');
    expect(transformedContent).toContain('CounterServiceInterface');

    // Verify imports were added
    expect(transformedContent).toContain('@tdi2/di-core/context');
  });

  it('should compile CounterService with decorators', () => {
    const serviceOutput = path.join(outputDir, 'CounterService.js');
    expect(fs.existsSync(serviceOutput)).toBe(true);

    const compiledContent = fs.readFileSync(serviceOutput, 'utf-8');

    // Verify service was compiled
    expect(compiledContent).toContain('CounterService');
  });

  it('should generate interface resolution config', () => {
    const generatedDir = path.join(tempDir, 'src', 'generated');
    expect(fs.existsSync(generatedDir)).toBe(true);

    // Check for generated config files
    const files = fs.readdirSync(generatedDir);
    expect(files.length).toBeGreaterThan(0);
  });
});
