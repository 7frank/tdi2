import { describe, it, expect, beforeEach } from "vitest";
import { Project, SourceFile } from "ts-morph";
import { BaseNormalizer, NormalizationOptions, NormalizationResult } from "./BaseNormalizer";

// Concrete implementation for testing
class TestNormalizer extends BaseNormalizer {
  normalize(sourceFile: SourceFile): NormalizationResult {
    const functions = this.getAllFunctions(sourceFile);
    this.log(`Found ${functions.length} functions`);
    return this.createSuccessResult(functions.length);
  }
}

describe("BaseNormalizer", () => {
  let project: Project;
  let sourceFile: SourceFile;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
  });

  describe("constructor", () => {
    it("should set default options", () => {
      const normalizer = new TestNormalizer();
      expect(normalizer["options"].verbose).toBe(false);
      expect(normalizer["options"].preserveComments).toBe(true);
    });

    it("should override options", () => {
      const normalizer = new TestNormalizer({ verbose: true, preserveComments: false });
      expect(normalizer["options"].verbose).toBe(true);
      expect(normalizer["options"].preserveComments).toBe(false);
    });
  });

  describe("getFunctionBody", () => {
    it("should return body for function declaration", () => {
      sourceFile = project.createSourceFile("test.ts", `
        function test() {
          return 1;
        }
      `);
      
      const normalizer = new TestNormalizer();
      const func = sourceFile.getFunctions()[0];
      const body = normalizer["getFunctionBody"](func);
      
      expect(body).toBeDefined();
      expect(body?.getStatements().length).toBe(1);
    });

    it("should return body for arrow function", () => {
      sourceFile = project.createSourceFile("test.ts", `
        const test = () => {
          return 1;
        };
      `);
      
      const normalizer = new TestNormalizer();
      const arrowFunc = sourceFile.getVariableStatements()[0]
        .getDeclarationList()
        .getDeclarations()[0]
        .getInitializer()!;
      
      const body = normalizer["getFunctionBody"](arrowFunc as any);
      expect(body).toBeDefined();
    });

    it("should return undefined for expression arrow function", () => {
      sourceFile = project.createSourceFile("test.ts", `
        const test = () => 1;
      `);
      
      const normalizer = new TestNormalizer();
      const arrowFunc = sourceFile.getVariableStatements()[0]
        .getDeclarationList()
        .getDeclarations()[0]
        .getInitializer()!;
      
      const body = normalizer["getFunctionBody"](arrowFunc as any);
      expect(body).toBeUndefined();
    });
  });

  describe("hasDestructuringParameters", () => {
    it("should detect destructuring parameters", () => {
      sourceFile = project.createSourceFile("test.ts", `
        function test({ a, b }: { a: number; b: string }) {
          return a + b;
        }
      `);
      
      const normalizer = new TestNormalizer();
      const func = sourceFile.getFunctions()[0];
      
      expect(normalizer["hasDestructuringParameters"](func)).toBe(true);
    });

    it("should detect no destructuring parameters", () => {
      sourceFile = project.createSourceFile("test.ts", `
        function test(props: { a: number; b: string }) {
          return props.a + props.b;
        }
      `);
      
      const normalizer = new TestNormalizer();
      const func = sourceFile.getFunctions()[0];
      
      expect(normalizer["hasDestructuringParameters"](func)).toBe(false);
    });

    it("should handle functions with no parameters", () => {
      sourceFile = project.createSourceFile("test.ts", `
        function test() {
          return 1;
        }
      `);
      
      const normalizer = new TestNormalizer();
      const func = sourceFile.getFunctions()[0];
      
      expect(normalizer["hasDestructuringParameters"](func)).toBe(false);
    });
  });

  describe("getAllFunctions", () => {
    it("should find function declarations", () => {
      sourceFile = project.createSourceFile("test.ts", `
        function test1() {}
        function test2() {}
      `);
      
      const normalizer = new TestNormalizer();
      const functions = normalizer["getAllFunctions"](sourceFile);
      
      expect(functions.length).toBe(2);
    });

    it("should find arrow functions", () => {
      sourceFile = project.createSourceFile("test.ts", `
        const test1 = () => {};
        const test2 = () => 1;
      `);
      
      const normalizer = new TestNormalizer();
      const functions = normalizer["getAllFunctions"](sourceFile);
      
      expect(functions.length).toBe(2);
    });

    it("should find mixed function types", () => {
      sourceFile = project.createSourceFile("test.ts", `
        function test1() {}
        const test2 = () => {};
        export function test3() {}
      `);
      
      const normalizer = new TestNormalizer();
      const functions = normalizer["getAllFunctions"](sourceFile);
      
      expect(functions.length).toBe(3);
    });
  });

  describe("result creation methods", () => {
    it("should create success result", () => {
      const normalizer = new TestNormalizer();
      const result = normalizer["createSuccessResult"](5);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(5);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it("should create error result", () => {
      const normalizer = new TestNormalizer();
      const errors = ["Error 1", "Error 2"];
      const result = normalizer["createErrorResult"](errors, 3);
      
      expect(result.success).toBe(false);
      expect(result.transformationsCount).toBe(3);
      expect(result.errors).toEqual(errors);
      expect(result.warnings).toEqual([]);
    });

    it("should add warnings to result", () => {
      const normalizer = new TestNormalizer();
      const result = normalizer["createSuccessResult"](1);
      
      normalizer["addWarning"](result, "Warning message");
      
      expect(result.warnings).toEqual(["Warning message"]);
    });
  });

  describe("logging", () => {
    it("should log when verbose is enabled", () => {
      const normalizer = new TestNormalizer({ verbose: true });
      sourceFile = project.createSourceFile("test.ts", `function test() {}`);
      
      // Capture console output
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (message: string) => logs.push(message);
      
      normalizer.normalize(sourceFile);
      
      console.log = originalLog;
      
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain("[TestNormalizer]");
      expect(logs[0]).toContain("Found 1 functions");
    });

    it("should not log when verbose is disabled", () => {
      const normalizer = new TestNormalizer({ verbose: false });
      sourceFile = project.createSourceFile("test.ts", `function test() {}`);
      
      // Capture console output
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (message: string) => logs.push(message);
      
      normalizer.normalize(sourceFile);
      
      console.log = originalLog;
      
      expect(logs.length).toBe(0);
    });
  });
});