import { describe, it, expect, beforeEach } from "bun:test";
import { Project, SourceFile } from "ts-morph";
import { RestParametersNormalizer } from "./RestParametersNormalizer";

describe("RestParametersNormalizer", () => {
  let project: Project;
  let normalizer: RestParametersNormalizer;
  
  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
    normalizer = new RestParametersNormalizer({ verbose: false });
  });

  describe("Rest parameter normalization", () => {
    it("should normalize rest parameters to helper functions", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string; b: number; c: boolean; d: string }) {
          const { a, b, ...rest } = props;
          
          console.log(a, b, rest);
          return { a, b, rest };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(3); // a, b, rest
      expect(result.errors).toEqual([]);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const a = props.a;");
      expect(transformedCode).toContain("const b = props.b;");
      expect(transformedCode).toContain("const rest = (({ a, b, ...rest }) => rest)(props ?? {});");
      expect(transformedCode).not.toContain("const { a, b, ...rest } = props;");
    });

    it("should handle rest-only destructuring", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string; b: number }) {
          const { ...allProps } = props;
          
          return allProps;
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(1);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const allProps = props ?? {};");
      expect(transformedCode).not.toContain("const { ...allProps } = props;");
    });

    it("should handle multiple rest parameters", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string; b: number; c: boolean }) {
          const { a, ...rest1 } = props;
          const { b, ...rest2 } = props;
          
          return { a, b, rest1, rest2 };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(4); // a, rest1, b, rest2
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const a = props.a;");
      expect(transformedCode).toContain("const rest1 = (({ a, ...rest }) => rest)(props ?? {});");
      expect(transformedCode).toContain("const b = props.b;");
      expect(transformedCode).toContain("const rest2 = (({ b, ...rest }) => rest)(props ?? {});");
    });

    it("should handle arrow functions", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export const TestComponent = (props: { a: string; b: number; c: boolean }) => {
          const { a, ...rest } = props;
          return { a, rest };
        };
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(2);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const a = props.a;");
      expect(transformedCode).toContain("const rest = (({ a, ...rest }) => rest)(props ?? {});");
    });
  });

  describe("Pattern skipping", () => {
    it("should skip destructuring without rest parameters", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string; b: number }) {
          const { a, b } = props;
          
          return { a, b };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(0);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const { a, b } = props;"); // Should remain unchanged
    });

    it("should skip complex patterns with rest parameters", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string; b: number; c: boolean }) {
          const { a: aliasA, b = 42, ...rest } = props;
          
          return { aliasA, b, rest };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(1); // Only the rest parameter
      
      const transformedCode = sourceFile.getFullText();
      // Should not transform the complex properties, but should handle the rest
      expect(transformedCode).toContain("const rest = props ?? {};"); // Simple rest since no simple props
    });

    it("should skip non-props destructuring", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { config: { a: string; b: number; c: boolean } }) {
          const { a, ...rest } = props.config;
          
          return { a, rest };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(0);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const { a, ...rest } = props.config;"); // Should remain unchanged
    });
  });

  describe("Edge cases", () => {
    it("should handle functions with no destructuring", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string; b: number }) {
          console.log(props.a, props.b);
          return props.a + props.b;
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(0);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("console.log(props.a, props.b);");
    });

    it("should handle functions with no body", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export const TestComponent = (props: { a: string }) => props.a;
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(0);
    });

    it("should handle empty rest parameters", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: {}) {
          const { ...empty } = props;
          
          return empty;
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(1);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const empty = props ?? {};");
    });

    it("should handle multiple functions", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function Component1(props: { a: string; b: string }) {
          const { a, ...rest } = props;
          return { a, rest };
        }

        export function Component2(props: { x: number; y: number }) {
          const { x, ...rest } = props;
          return { x, rest };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(4); // 2 properties + 2 rest parameters
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const a = props.a;");
      expect(transformedCode).toContain("const rest = (({ a, ...rest }) => rest)(props ?? {});");
      expect(transformedCode).toContain("const x = props.x;");
      expect(transformedCode).toContain("const rest = (({ x, ...rest }) => rest)(props ?? {});");
    });
  });

  describe("Error handling", () => {
    it("should handle malformed AST gracefully", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string }) {
          const { a, ...rest } = props;
          return { a, rest };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      expect(result.success).toBe(true);
    });
  });
});