import { Project, SourceFile, SyntaxKind } from 'ts-morph';

export interface TransformationResult {
  success: boolean;
  transformedCode?: string;
  error?: string;
  warnings?: string[];
}

/**
 * Simplified browser-compatible transformer for the playground.
 * This demonstrates the core transformation concepts without the full
 * complexity of the production transformer.
 */
export class BrowserTransformer {
  private project: Project;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // ESNext
        module: 99, // ESNext
        jsx: 2, // React
        experimentalDecorators: true,
        lib: ['es2020', 'dom'],
      },
    });
  }

  async transform(inputCode: string, fileName: string = 'example.tsx'): Promise<TransformationResult> {
    try {
      // Clear previous files
      this.project.getSourceFiles().forEach(sf => sf.delete());

      // Create a new source file with the input code
      const sourceFile = this.project.createSourceFile(fileName, inputCode, { overwrite: true });

      // Find function components with @di-inject marker
      const functions = sourceFile.getFunctions();
      const variables = sourceFile.getVariableDeclarations();

      let hasTransformations = false;

      // Transform function declarations
      for (const func of functions) {
        if (this.hasDIMarker(func.getFullText())) {
          this.transformFunction(func);
          hasTransformations = true;
        }
      }

      // Transform arrow function components
      for (const varDecl of variables) {
        const initializer = varDecl.getInitializer();
        if (initializer && this.hasDIMarker(varDecl.getParent().getFullText())) {
          if (initializer.getKind() === SyntaxKind.ArrowFunction) {
            hasTransformations = true;
          }
        }
      }

      // Get the transformed code
      const transformedCode = sourceFile.getFullText();

      const warnings: string[] = [];
      if (!hasTransformations) {
        warnings.push('No @di-inject markers found. Add // @di-inject above your component.');
      }

      return {
        success: true,
        transformedCode,
        warnings,
      };
    } catch (error) {
      console.error('Transformation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
      };
    }
  }

  private hasDIMarker(text: string): boolean {
    return text.includes('@di-inject');
  }

  private transformFunction(func: any): void {
    // Get the function parameters
    const params = func.getParameters();

    if (params.length === 0) return;

    const firstParam = params[0];
    const paramType = firstParam.getTypeNode();

    // Simple transformation: add comment showing what would be injected
    const leadingComment = func.getLeadingCommentRanges();

    // Add a comment to show the transformation
    func.insertText(0, `/* TDI2 TRANSFORMED - Services would be injected here */\n`);
  }

  /**
   * Demo transformation that shows the expected output for common patterns
   */
  async transformWithDemo(inputCode: string): Promise<TransformationResult> {
    try {
      // For demo purposes, we'll do simple string replacements to show the transformation
      let transformedCode = inputCode;

      // Pattern 1: Transform @di-inject marker
      if (inputCode.includes('// @di-inject')) {
        transformedCode = transformedCode.replace(
          /\/\/ @di-inject\s*\nfunction (\w+)\(\) {/g,
          (match, funcName) => {
            return `// TDI2 Enhanced Component
function ${funcName}({
  /* Services injected via TDI2 */
}) {`;
          }
        );

        // Pattern 2: Transform useInject calls to show service usage
        transformedCode = transformedCode.replace(
          /const (\w+) = useInject<(\w+)>\(\);?/g,
          (match, varName, interfaceName) => {
            return `const ${varName}: Inject<${interfaceName}> = /* Injected by TDI2 */;`;
          }
        );

        return {
          success: true,
          transformedCode,
          warnings: ['This is a simplified demo transformation for visualization purposes'],
        };
      }

      // If no @di-inject marker, return with warning
      return {
        success: true,
        transformedCode: `/*
 * Add // @di-inject above your component to see transformation
 *
 * Example:
 * // @di-inject
 * function MyComponent() {
 *   const service = useInject<MyServiceInterface>();
 *   return <div>{service.state.value}</div>;
 * }
 */

${inputCode}`,
        warnings: ['Add // @di-inject marker to see transformation'],
      };
    } catch (error) {
      console.error('Demo transformation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
      };
    }
  }
}
