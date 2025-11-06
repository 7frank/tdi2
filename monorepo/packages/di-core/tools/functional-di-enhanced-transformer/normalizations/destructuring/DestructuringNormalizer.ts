import { 
  SourceFile, 
  FunctionDeclaration, 
  ArrowFunction, 
  VariableStatement,
  Node 
} from "ts-morph";
import { BaseNormalizer, NormalizationResult } from "../base/BaseNormalizer";

/**
 * Normalizes simple destructuring patterns to property access
 * Converts: const { a, b } = props;
 * To: const a = props.a; const b = props.b;
 * 
 * Does NOT handle:
 * - Rest parameters ({ a, ...rest })
 * - Aliases ({ a: b })
 * - Nested destructuring ({ a: { b } })
 * - Default values ({ a = 1 })
 */
export class DestructuringNormalizer extends BaseNormalizer {
  normalize(sourceFile: SourceFile): NormalizationResult {
    this.log("Starting destructuring normalization");
    
    let transformationsCount = 0;
    const errors: string[] = [];
    
    try {
      // Find all functions in the source file
      const functions = this.getAllFunctions(sourceFile);
      this.log(`Found ${functions.length} functions to process`);
      
      for (const func of functions) {
        const result = this.normalizeFunctionDestructuring(func);
        transformationsCount += result;
      }
      
      this.log(`Completed ${transformationsCount} transformations`);
      return this.createSuccessResult(transformationsCount);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Destructuring normalization failed: ${errorMessage}`);
      return this.createErrorResult(errors, transformationsCount);
    }
  }

  /**
   * Normalize destructuring in a single function
   */
  private normalizeFunctionDestructuring(func: FunctionDeclaration | ArrowFunction): number {
    const body = this.getFunctionBody(func);
    if (!body) {
      this.log("Function has no block body, skipping");
      return 0;
    }

    let transformationsCount = 0;
    const statements = body.getStatements();
    const statementsToReplace: { original: VariableStatement; normalized: string[] }[] = [];

    // Find destructuring statements
    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          const initializer = declaration.getInitializer();
          
          // Check if this is simple destructuring from props
          if (Node.isObjectBindingPattern(nameNode) && 
              initializer && 
              Node.isIdentifier(initializer) &&
              initializer.getText() === "props") {
            
            // First check if this pattern is supported (no rest, aliases, defaults)
            if (this.isSimpleDestructuringPattern(nameNode)) {
              const normalizedStatements = this.normalizeSimpleDestructuring(nameNode);
              if (normalizedStatements.length > 0) {
                statementsToReplace.push({
                  original: statement,
                  normalized: normalizedStatements
                });
                this.log(`Found destructuring with ${normalizedStatements.length} properties`);
              }
            } else {
              this.log("Skipping complex destructuring pattern - not supported by DestructuringNormalizer");
            }
          }
        }
      }
    }

    // Replace statements
    for (const { original, normalized } of statementsToReplace) {
      const index = body.getStatements().indexOf(original);
      if (index !== -1) {
        original.remove();
        // Insert normalized statements in reverse order to maintain correct positioning
        for (let i = normalized.length - 1; i >= 0; i--) {
          body.insertStatements(index, normalized[i]);
        }
        transformationsCount += normalized.length;
      }
    }

    return transformationsCount;
  }

  /**
   * Check if this is a simple destructuring pattern (no rest, aliases, defaults, or nesting)
   */
  private isSimpleDestructuringPattern(bindingPattern: any): boolean {
    const elements = bindingPattern.getElements();
    
    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const nameNode = element.getNameNode();
        const propertyNameNode = element.getPropertyNameNode();
        const dotDotDotToken = element.getDotDotDotToken();
        const initializer = element.getInitializer();

        // Check for patterns we don't support
        if (dotDotDotToken) {
          return false; // Rest parameters
        }
        
        if (propertyNameNode) {
          return false; // Aliases
        }

        if (initializer) {
          return false; // Default values
        }

        if (!Node.isIdentifier(nameNode)) {
          return false; // Nested destructuring or other complex patterns
        }
      }
    }

    return true;
  }

  /**
   * Convert simple destructuring pattern to individual assignments
   * Only handles: { a, b, c } patterns (no rest, aliases, or defaults)
   */
  private normalizeSimpleDestructuring(bindingPattern: any): string[] {
    const statements: string[] = [];
    const elements = bindingPattern.getElements();

    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const nameNode = element.getNameNode();
        const propertyNameNode = element.getPropertyNameNode();
        const dotDotDotToken = element.getDotDotDotToken();
        const initializer = element.getInitializer();

        // Skip patterns we don't handle
        if (dotDotDotToken) {
          this.log("Skipping rest parameter - not handled by DestructuringNormalizer");
          continue;
        }
        
        if (propertyNameNode) {
          this.log("Skipping aliased property - not handled by DestructuringNormalizer");
          continue;
        }

        if (initializer) {
          this.log("Skipping property with default value - not handled by DestructuringNormalizer");
          continue;
        }

        if (!Node.isIdentifier(nameNode)) {
          this.log("Skipping non-identifier property - not handled by DestructuringNormalizer");
          continue;
        }

        // Simple property: { a } -> const a = props.a;
        const propertyName = nameNode.getText();
        statements.push(`const ${propertyName} = props.${propertyName};`);
        this.log(`Normalized: ${propertyName} -> props.${propertyName}`);
      }
    }

    return statements;
  }
}