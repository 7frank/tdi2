import { 
  SourceFile, 
  FunctionDeclaration, 
  ArrowFunction, 
  VariableStatement,
  Node 
} from "ts-morph";
import { BaseNormalizer, NormalizationResult } from "../base/BaseNormalizer";

/**
 * Normalizes rest parameters in destructuring patterns
 * Converts: const { a, ...rest } = props;
 * To: const a = props.a; const rest = (({ a, ...rest }) => rest)(props);
 * 
 * Only handles rest parameters - other patterns are left unchanged
 */
export class RestParametersNormalizer extends BaseNormalizer {
  normalize(sourceFile: SourceFile): NormalizationResult {
    this.log("Starting rest parameters normalization");
    
    let transformationsCount = 0;
    const errors: string[] = [];
    
    try {
      // Find all functions in the source file
      const functions = this.getAllFunctions(sourceFile);
      this.log(`Found ${functions.length} functions to process`);
      
      for (const func of functions) {
        const result = this.normalizeFunctionRestParameters(func);
        transformationsCount += result;
      }
      
      this.log(`Completed ${transformationsCount} transformations`);
      return this.createSuccessResult(transformationsCount);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Rest parameters normalization failed: ${errorMessage}`);
      return this.createErrorResult(errors, transformationsCount);
    }
  }

  /**
   * Normalize rest parameters in a single function
   */
  private normalizeFunctionRestParameters(func: FunctionDeclaration | ArrowFunction): number {
    const body = this.getFunctionBody(func);
    if (!body) {
      this.log("Function has no block body, skipping");
      return 0;
    }

    let transformationsCount = 0;
    const statements = body.getStatements();
    const statementsToReplace: { original: VariableStatement; normalized: string[] }[] = [];

    // Find destructuring statements with rest parameters
    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          const initializer = declaration.getInitializer();
          
          // Check if this is destructuring from props with rest parameters
          if (Node.isObjectBindingPattern(nameNode) && 
              initializer && 
              Node.isIdentifier(initializer) &&
              initializer.getText() === "props") {
            
            if (this.hasRestParameters(nameNode)) {
              const normalizedStatements = this.normalizeRestParameterDestructuring(nameNode);
              if (normalizedStatements.length > 0) {
                statementsToReplace.push({
                  original: statement,
                  normalized: normalizedStatements
                });
                this.log(`Found rest parameter destructuring with ${normalizedStatements.length} statements`);
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
   * Check if destructuring pattern has rest parameters
   */
  private hasRestParameters(bindingPattern: any): boolean {
    const elements = bindingPattern.getElements();
    
    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const dotDotDotToken = element.getDotDotDotToken();
        if (dotDotDotToken) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Convert destructuring with rest parameters to individual assignments + helper function
   */
  private normalizeRestParameterDestructuring(bindingPattern: any): string[] {
    const statements: string[] = [];
    const elements = bindingPattern.getElements();
    const regularProperties: string[] = [];
    const restParameters: string[] = [];

    // Separate regular properties from rest parameters
    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const nameNode = element.getNameNode();
        const propertyNameNode = element.getPropertyNameNode();
        const dotDotDotToken = element.getDotDotDotToken();
        const initializer = element.getInitializer();

        if (dotDotDotToken) {
          // Rest parameter
          if (Node.isIdentifier(nameNode)) {
            const restName = nameNode.getText();
            restParameters.push(restName);
            this.log(`Found rest parameter: ${restName}`);
          }
        } else if (Node.isIdentifier(nameNode) && !propertyNameNode && !initializer) {
          // Simple regular property (only handle simple cases)
          const propertyName = nameNode.getText();
          regularProperties.push(propertyName);
          statements.push(`const ${propertyName} = props.${propertyName};`);
          this.log(`Normalized regular property: ${propertyName}`);
        } else {
          // Complex patterns - leave for other normalizers
          this.log("Skipping complex property pattern - not handled by RestParametersNormalizer");
        }
      }
    }

    // Generate rest parameter helper functions
    for (const restName of restParameters) {
      if (regularProperties.length > 0) {
        // Generate helper function that excludes the regular properties
        const excludedProps = regularProperties.join(', ');
        const restStatement = `const ${restName} = (({ ${excludedProps}, ...rest }) => rest)(props ?? {});`;
        statements.push(restStatement);
        this.log(`Generated rest parameter: ${restStatement}`);
      } else {
        // No regular properties, rest gets everything
        const restStatement = `const ${restName} = props ?? {};`;
        statements.push(restStatement);
        this.log(`Generated simple rest parameter: ${restStatement}`);
      }
    }

    return statements;
  }
}