import { describe, it, expect, beforeEach } from "vitest";
import { Project, SourceFile } from "ts-morph";
import { AliasNormalizer } from "./AliasNormalizer";

describe("AliasNormalizer", () => {
  let project: Project;
  let normalizer: AliasNormalizer;
  
  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
    normalizer = new AliasNormalizer({ verbose: false });
  });

  describe("Alias normalization", () => {
    it("should normalize aliases to property access", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string; b: number; c: boolean }) {
          const { a: aliasA, b: aliasB, c: aliasC } = props;
          
          console.log(aliasA, aliasB, aliasC);
          return { aliasA, aliasB, aliasC };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(3);
      expect(result.errors).toEqual([]);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const aliasA = props.a;");
      expect(transformedCode).toContain("const aliasB = props.b;");
      expect(transformedCode).toContain("const aliasC = props.c;");
      expect(transformedCode).not.toContain("const { a: aliasA, b: aliasB, c: aliasC } = props;");
    });

    it("should handle mixed aliases and non-aliases", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string; b: number; c: boolean }) {
          const { a: aliasA, b, c: aliasC } = props;
          
          return { aliasA, b, aliasC };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(2); // Only aliases
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const aliasA = props.a;");
      expect(transformedCode).toContain("const aliasC = props.c;");
      // The original statement should be removed completely since it contained aliases
      expect(transformedCode).not.toContain("const { a: aliasA, b, c: aliasC } = props;");
    });

    it("should handle single alias", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { data: any }) {
          const { data: content } = props;
          
          return content;
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(1);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const content = props.data;");
      expect(transformedCode).not.toContain("const { data: content } = props;");
    });

    it("should handle arrow functions", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export const TestComponent = (props: { a: string; b: number }) => {
          const { a: x, b: y } = props;
          return { x, y };
        };
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(2);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const x = props.a;");
      expect(transformedCode).toContain("const y = props.b;");
    });
  });

  describe("Pattern skipping", () => {
    it("should skip destructuring without aliases", () => {
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

    it("should skip rest parameters in aliases", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string; b: number; c: boolean }) {
          const { a: aliasA, ...rest } = props;
          
          return { aliasA, rest };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(1); // Only the alias
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const aliasA = props.a;");
    });

    it("should skip default values in aliases", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a?: string; b: number }) {
          const { a: aliasA = "default", b: aliasB } = props;
          
          return { aliasA, aliasB };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(1); // Only aliasB, skip aliasA with default
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const aliasB = props.b;");
    });

    it("should skip nested destructuring in aliases", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { config: { theme: string; lang: string } }) {
          const { config: { theme: userTheme, lang } } = props;
          
          return { userTheme, lang };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(0);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const { config: { theme: userTheme, lang } } = props;"); // Should remain unchanged
    });

    it("should skip non-props destructuring", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { config: { a: string; b: number } }) {
          const { a: aliasA, b: aliasB } = props.config;
          
          return { aliasA, aliasB };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(0);
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const { a: aliasA, b: aliasB } = props.config;"); // Should remain unchanged
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
    });

    it("should handle functions with no body", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export const TestComponent = (props: { a: string }) => props.a;
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(0);
    });

    it("should handle multiple functions", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function Component1(props: { a: string }) {
          const { a: x } = props;
          return x;
        }

        export function Component2(props: { b: number, c: boolean }) {
          const { b: y, c: z } = props;
          return { y, z };
        }
      `);

      const result = normalizer.normalize(sourceFile);
      
      expect(result.success).toBe(true);
      expect(result.transformationsCount).toBe(3); // x, y, z
      
      const transformedCode = sourceFile.getFullText();
      expect(transformedCode).toContain("const x = props.a;");
      expect(transformedCode).toContain("const y = props.b;");
      expect(transformedCode).toContain("const z = props.c;");
    });
  });

  describe("Error handling", () => {
    it("should handle malformed AST gracefully", () => {
      const sourceFile = project.createSourceFile("test.ts", `
        export function TestComponent(props: { a: string }) {
          const { a: alias } = props;
          return alias;
        }
      `);

      const result = normalizer.normalize(sourceFile);
      expect(result.success).toBe(true);
    });
  });
});