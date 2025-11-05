import { 
  SourceFile, 
  FunctionDeclaration, 
  ArrowFunction, 
  VariableStatement,
  Node 
} from "ts-morph";
import { BaseNormalizer, NormalizationResult } from "../base/BaseNormalizer";

/**
 * Normalizes aliased properties in destructuring patterns
 * Converts: const { a: aliasA, b: aliasB } = props;
 * To: const aliasA = props.a; const aliasB = props.b;
 * 
 * Only handles aliases - other patterns are left unchanged
 */
export class AliasNormalizer extends BaseNormalizer {
  normalize(sourceFile: SourceFile): NormalizationResult {
    this.log("Starting alias normalization");
    
    let transformationsCount = 0;
    const errors: string[] = [];
    
    try {
      // Find all functions in the source file
      const functions = this.getAllFunctions(sourceFile);
      this.log(`Found ${functions.length} functions to process`);
      
      for (const func of functions) {
        const result = this.normalizeFunctionAliases(func);
        transformationsCount += result;
      }
      
      this.log(`Completed ${transformationsCount} transformations`);
      return this.createSuccessResult(transformationsCount);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Alias normalization failed: ${errorMessage}`);
      return this.createErrorResult(errors, transformationsCount);
    }
  }

  /**
   * Normalize aliases in a single function
   */
  private normalizeFunctionAliases(func: FunctionDeclaration | ArrowFunction): number {
    const body = this.getFunctionBody(func);
    if (!body) {
      this.log("Function has no block body, skipping");
      return 0;
    }

    let transformationsCount = 0;
    const statements = body.getStatements();
    const statementsToReplace: { original: VariableStatement; normalized: string[] }[] = [];

    // Find destructuring statements with aliases
    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          const initializer = declaration.getInitializer();
          
          // Check if this is destructuring from props with aliases
          if (Node.isObjectBindingPattern(nameNode) && 
              initializer && 
              Node.isIdentifier(initializer) &&
              initializer.getText() === "props") {
            
            if (this.hasAliases(nameNode)) {
              const normalizedStatements = this.normalizeAliasDestructuring(nameNode);
              if (normalizedStatements.length > 0) {
                statementsToReplace.push({
                  original: statement,
                  normalized: normalizedStatements
                });
                this.log(`Found alias destructuring with ${normalizedStatements.length} statements`);
              }
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
   * Check if destructuring pattern has aliases
   */
  private hasAliases(bindingPattern: any): boolean {
    const elements = bindingPattern.getElements();
    
    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const propertyNameNode = element.getPropertyNameNode();
        if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Convert destructuring with aliases to individual assignments
   */
  private normalizeAliasDestructuring(bindingPattern: any): string[] {
    const statements: string[] = [];
    const elements = bindingPattern.getElements();

    // Only process elements with aliases (simple cases)
    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const nameNode = element.getNameNode();
        const propertyNameNode = element.getPropertyNameNode();
        const dotDotDotToken = element.getDotDotDotToken();
        const initializer = element.getInitializer();

        // Skip complex patterns
        if (dotDotDotToken) {
          this.log("Skipping rest parameter - not handled by AliasNormalizer");
          continue;
        }

        if (initializer) {
          this.log("Skipping property with default value - not handled by AliasNormalizer");
          continue;
        }

        if (!Node.isIdentifier(nameNode)) {
          this.log("Skipping nested destructuring - not handled by AliasNormalizer");
          continue;
        }

        // Handle aliases: { propertyName: aliasName }
        if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
          const propertyName = propertyNameNode.getText();
          const aliasName = nameNode.getText();
          
          statements.push(`const ${aliasName} = props.${propertyName};`);
          this.log(`Normalized alias: ${propertyName} -> ${aliasName}`);
        } else {
          // Simple property without alias - skip (handled by other normalizers)
          this.log("Skipping simple property - not handled by AliasNormalizer");
        }
      }
    }

    return statements;
  }
}