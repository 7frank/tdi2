/**
 * Integration tests for TDI2 TypeScript transformer
 */

import { describe, it, expect, beforeEach,vi } from 'vitest';
import * as ts from 'typescript';
import tdi2Transformer from '../src/transformer';
import type { PluginConfig, TransformerExtras } from '../src/types';

describe('TDI2 TypeScript Transformer', () => {
  let program: ts.Program;
  let config: PluginConfig;
  let extras: TransformerExtras;

  beforeEach(() => {
    // Create a minimal TypeScript program for testing
    const files = new Map<string, string>();
    const host: ts.CompilerHost = {
      getSourceFile: (fileName) => {
        const content = files.get(fileName);
        if (content !== undefined) {
          return ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
        }
        return undefined;
      },
      getDefaultLibFileName: () => 'lib.d.ts',
      writeFile: () => {},
      getCurrentDirectory: () => '.',
      getDirectories: () => [],
      fileExists: (fileName) => files.has(fileName),
      readFile: (fileName) => files.get(fileName),
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
    };

    program = ts.createProgram(['test.tsx'], {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      experimentalDecorators: true,
    }, host);

    config = {
      srcDir: './src',
      outputDir: './src/generated',
      verbose: false,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
    };

    extras = {
      ts,
    };
  });

  it('should create transformer factory', () => {
    const factory = tdi2Transformer(program, config, extras);
    expect(factory).toBeDefined();
    expect(typeof factory).toBe('function');
  });

  it('should return transformer from factory', () => {
    const factory = tdi2Transformer(program, config, extras);
    const context = createTransformationContext();
    const transformer = factory(context);
    expect(transformer).toBeDefined();
    expect(typeof transformer).toBe('function');
  });

  it('should skip declaration files', () => {
    const sourceCode = `
      export interface TestInterface {
        value: string;
      }
    `;

    const sourceFile = ts.createSourceFile(
      'test.d.ts',
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const factory = tdi2Transformer(program, config, extras);
    const context = createTransformationContext();
    const transformer = factory(context);
    const result = transformer(sourceFile);

    expect(result).toBe(sourceFile);
  });

  it('should handle files without DI patterns', () => {
    const sourceCode = `
      export function regularFunction() {
        return "Hello World";
      }
    `;

    const sourceFile = ts.createSourceFile(
      'regular.ts',
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const factory = tdi2Transformer(program, config, extras);
    const context = createTransformationContext();
    const transformer = factory(context);
    const result = transformer(sourceFile);

    // Should return original file since no DI patterns detected
    expect(result.fileName).toBe(sourceFile.fileName);
  });

  it('should detect @Service decorator pattern', () => {
    const sourceCode = `
      import { Service } from '@tdi2/di-core';

      @Service()
      export class TestService {
        getValue() {
          return "test";
        }
      }
    `;

    const sourceFile = ts.createSourceFile(
      'test-service.ts',
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const factory = tdi2Transformer(program, config, extras);
    const context = createTransformationContext();
    const transformer = factory(context);

    // Should not throw
    expect(() => transformer(sourceFile)).not.toThrow();
  });

  it('should detect Inject<> type pattern', () => {
    const sourceCode = `
      import { Inject } from '@tdi2/di-core';
      import { TestService } from './test-service';

      export function TestComponent({ service }: { service: Inject<TestService> }) {
        return <div>{service.getValue()}</div>;
      }
    `;

    const sourceFile = ts.createSourceFile(
      'test-component.tsx',
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const factory = tdi2Transformer(program, config, extras);
    const context = createTransformationContext();
    const transformer = factory(context);

    // Should not throw
    expect(() => transformer(sourceFile)).not.toThrow();
  });

  it('should respect verbose configuration', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const verboseConfig = { ...config, verbose: true };
    const factory = tdi2Transformer(program, verboseConfig, extras);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('TDI2 TypeScript Transformer loaded')
    );

    consoleLogSpy.mockRestore();
  });

  it('should handle errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create invalid TypeScript code
    const sourceCode = `
      this is not valid typescript!!!
    `;

    const sourceFile = ts.createSourceFile(
      'invalid.ts',
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const factory = tdi2Transformer(program, config, extras);
    const context = createTransformationContext();
    const transformer = factory(context);

    // Should not throw even with invalid code
    expect(() => transformer(sourceFile)).not.toThrow();

    consoleErrorSpy.mockRestore();
  });
});

/**
 * Helper to create a minimal transformation context
 */
function createTransformationContext(): ts.TransformationContext {
  const context: Partial<ts.TransformationContext> = {
    factory: ts.factory,
    getCompilerOptions: () => ({
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
    }),
    startLexicalEnvironment: () => {},
    suspendLexicalEnvironment: () => {},
    resumeLexicalEnvironment: () => {},
    endLexicalEnvironment: () => [],
    hoistFunctionDeclaration: () => {},
    hoistVariableDeclaration: () => {},
    requestEmitHelper: () => {},
    readEmitHelpers: () => undefined,
    enableSubstitution: () => {},
    isSubstitutionEnabled: () => false,
    onSubstituteNode: (hint, node) => node,
    enableEmitNotification: () => {},
    isEmitNotificationEnabled: () => false,
    onEmitNode: () => {},
  };

  return context as ts.TransformationContext;
}
