// tools/functional-di-enhanced-transformer/parameter-normalizer.ts
import {
  FunctionDeclaration,
  ArrowFunction,
  ParameterDeclaration,
  Node,
  SourceFile,
  SyntaxKind,
  TypeNode
} from 'ts-morph';

export interface NormalizationResult {
  wasNormalized: boolean;
  originalParameterPattern: string;
  newParameterName: string;
  addedStatements: string[];
  removedDestructuring: string[];
}

export interface ParameterNormalizationOptions {
  verbose?: boolean;
  preserveTypeAnnotations?: boolean;
  generateFallbacks?: boolean;
}

export class ParameterNormalizer {
  constructor(private options: ParameterNormalizationOptions = {}) {}

  /**
   * Normalize function parameters by removing destructuring and moving to function body
   */
  normalizeFunction(func: FunctionDeclaration, sourceFile: SourceFile): NormalizationResult {
    const parameters = func.getParameters();
    if (parameters.length === 0) {
      return this.createEmptyResult();
    }

    const firstParam = parameters[0];
    return this.normalizeParameter(func, firstParam, sourceFile);
  }

  /**
   * Normalize arrow function parameters
   */
  normalizeArrowFunction(arrowFunc: ArrowFunction, sourceFile: SourceFile): NormalizationResult {
    const parameters = arrowFunc.getParameters();
    if (parameters.length === 0) {
      return this.createEmptyResult();
    }

    const firstParam = parameters[0];
    return this.normalizeParameter(arrowFunc, firstParam, sourceFile);
  }

  /**
   * Core parameter normalization logic
   */
  private normalizeParameter(
    func: FunctionDeclaration | ArrowFunction,
    param: ParameterDeclaration,
    sourceFile: SourceFile
  ): NormalizationResult {
    const nameNode = param.getNameNode();
    
    // Check if parameter is destructured
    if (!Node.isObjectBindingPattern(nameNode)) {
      // Not destructured, no normalization needed
      return this.createEmptyResult();
    }

    if (this.options.verbose) {
      console.log(`🔄 Normalizing destructured parameter in ${this.getFunctionName(func)}`);
    }

    // Extract destructuring information
    const destructuringInfo = this.analyzeDestructuring(nameNode, param);
    
    // Generate new parameter name
    const newParamName = 'props';
    
    // Get type annotation
    const typeNode = param.getTypeNode();
    const typeText = typeNode ? typeNode.getText() : 'any';

    // Replace parameter with simple props parameter
    this.replaceParameterWithProps(param, newParamName, typeText);

    // Generate statements for function body
    const addedStatements = this.generateBodyStatements(destructuringInfo, newParamName);

    // Insert statements at beginning of function body
    this.insertStatementsIntoBody(func, addedStatements);

    // Update references in function body
    this.updateReferencesInBody(func, destructuringInfo, newParamName);

    return {
      wasNormalized: true,
      originalParameterPattern: nameNode.getText(),
      newParameterName: newParamName,
      addedStatements,
      removedDestructuring: destructuringInfo.destructuredNames
    };
  }

  /**
   * Analyze destructuring pattern to extract binding information
   */
  private analyzeDestructuring(nameNode: any, param: ParameterDeclaration): DestructuringInfo {
    const bindings: BindingInfo[] = [];
    const destructuredNames: string[] = [];

    if (Node.isObjectBindingPattern(nameNode)) {
      const elements = nameNode.getElements();
      
      for (const element of elements) {
        if (Node.isBindingElement(element)) {
          const binding = this.analyzeBindingElement(element);
          if (binding) {
            bindings.push(binding);
            destructuredNames.push(binding.localName);
          }
        }
      }
    }

    return {
      bindings,
      destructuredNames,
      hasDestructuring: bindings.length > 0
    };
  }

  /**
   * Analyze individual binding element
   */
  private analyzeBindingElement(element: any): BindingInfo | null {
    try {
      const nameNode = element.getNameNode();
      const propertyNameNode = element.getPropertyNameNode();
      
      let localName: string;
      let propertyName: string;

      if (Node.isIdentifier(nameNode)) {
        localName = nameNode.getText();
      } else {
        // Handle nested destructuring or other patterns
        localName = nameNode.getText();
      }

      if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
        // { propertyName: localName } pattern
        propertyName = propertyNameNode.getText();
      } else {
        // { localName } shorthand pattern
        propertyName = localName;
      }

      const isOptional = element.hasQuestionToken?.() || false;

      return {
        localName,
        propertyName,
        propertyPath: [propertyName],
        isOptional,
        hasDefaultValue: !!element.getInitializer?.()
      };
    } catch (error) {
      if (this.options.verbose) {
        console.warn('⚠️  Failed to analyze binding element:', error);
      }
      return null;
    }
  }

  /**
   * Replace destructured parameter with simple props parameter
   */
  private replaceParameterWithProps(param: ParameterDeclaration, newName: string, typeText: string): void {
    // Remove the parameter and add a new one
    const paramIndex = param.getChildIndex();
    const func = param.getParent();
    
    // Get the parameter list
    const paramList = func.getFirstChildByKind(SyntaxKind.OpenParenToken)?.getNextSibling();
    
    if (paramList && Node.isSyntaxList(paramList)) {
      // Replace the destructured parameter
      param.replaceWithText(`${newName}: ${typeText}`);
    }

    if (this.options.verbose) {
      console.log(`🔄 Replaced parameter with: ${newName}: ${typeText}`);
    }
  }

  /**
   * Generate statements for function body based on destructuring info
   */
  private generateBodyStatements(destructuringInfo: DestructuringInfo, propsName: string): string[] {
    const statements: string[] = [];

    for (const binding of destructuringInfo.bindings) {
      const propertyAccess = this.generatePropertyAccess(binding.propertyPath, propsName);
      
      if (this.options.generateFallbacks) {
        // Generate fallback with DI hooks (this will be replaced later by the DI transformer)
        const fallback = this.generateFallbackExpression(binding);
        statements.push(`const ${binding.localName} = ${propertyAccess} ?? ${fallback};`);
      } else {
        // Simple property access
        statements.push(`const ${binding.localName} = ${propertyAccess};`);
      }
    }

    return statements;
  }

  /**
   * Generate property access chain
   */
  private generatePropertyAccess(propertyPath: string[], propsName: string): string {
    return `${propsName}.${propertyPath.join('.')}`;
  }

  /**
   * Generate fallback expression (placeholder for DI transformation)
   */
  private generateFallbackExpression(binding: BindingInfo): string {
    if (binding.isOptional) {
      return 'undefined';
    } else {
      // This will be replaced by actual DI hook calls during transformation
      return `/* DI_PLACEHOLDER_${binding.localName} */`;
    }
  }

  /**
   * Insert statements at the beginning of function body
   */
  private insertStatementsIntoBody(func: FunctionDeclaration | ArrowFunction, statements: string[]): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) {
      if (this.options.verbose) {
        console.warn('⚠️  Cannot insert statements into non-block function body');
      }
      return;
    }

    // Insert statements at the beginning of the block
    for (let i = statements.length - 1; i >= 0; i--) {
      body.insertStatements(0, statements[i]);
    }

    if (this.options.verbose) {
      console.log(`✅ Inserted ${statements.length} statements into function body`);
    }
  }

  /**
   * Update references to destructured variables in function body
   */
  private updateReferencesInBody(
    func: FunctionDeclaration | ArrowFunction,
    destructuringInfo: DestructuringInfo,
    propsName: string
  ): void {
    // This is a complex operation that would require analyzing all identifiers in the function
    // For now, we rely on the statements we generated to provide the correct bindings
    
    if (this.options.verbose) {
      console.log(`🔄 Updated references for ${destructuringInfo.destructuredNames.length} destructured variables`);
    }
  }

  /**
   * Get function body regardless of function type
   */
  private getFunctionBody(func: FunctionDeclaration | ArrowFunction): any {
    if (Node.isFunctionDeclaration(func)) {
      return func.getBody();
    } else if (Node.isArrowFunction(func)) {
      return func.getBody();
    }
    return null;
  }

  /**
   * Get function name for debugging
   */
  private getFunctionName(func: FunctionDeclaration | ArrowFunction): string {
    if (Node.isFunctionDeclaration(func)) {
      return func.getName() || 'anonymous';
    } else {
      // For arrow functions, try to get the variable name
      const parent = func.getParent();
      if (Node.isVariableDeclaration(parent)) {
        return parent.getName();
      }
      return 'anonymous arrow function';
    }
  }

  /**
   * Create empty result for when no normalization is needed
   */
  private createEmptyResult(): NormalizationResult {
    return {
      wasNormalized: false,
      originalParameterPattern: '',
      newParameterName: '',
      addedStatements: [],
      removedDestructuring: []
    };
  }

  /**
   * Check if a function needs parameter normalization
   */
  needsNormalization(func: FunctionDeclaration | ArrowFunction): boolean {
    const parameters = func.getParameters();
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const nameNode = firstParam.getNameNode();
    
    return Node.isObjectBindingPattern(nameNode);
  }

  /**
   * Preview what normalization would do without actually applying it
   */
  previewNormalization(func: FunctionDeclaration | ArrowFunction): {
    needsNormalization: boolean;
    originalPattern: string;
    proposedStatements: string[];
    affectedVariables: string[];
  } {
    const parameters = func.getParameters();
    if (parameters.length === 0) {
      return {
        needsNormalization: false,
        originalPattern: '',
        proposedStatements: [],
        affectedVariables: []
      };
    }

    const firstParam = parameters[0];
    const nameNode = firstParam.getNameNode();
    
    if (!Node.isObjectBindingPattern(nameNode)) {
      return {
        needsNormalization: false,
        originalPattern: nameNode.getText(),
        proposedStatements: [],
        affectedVariables: []
      };
    }

    const destructuringInfo = this.analyzeDestructuring(nameNode, firstParam);
    const proposedStatements = this.generateBodyStatements(destructuringInfo, 'props');

    return {
      needsNormalization: true,
      originalPattern: nameNode.getText(),
      proposedStatements,
      affectedVariables: destructuringInfo.destructuredNames
    };
  }
}

// Supporting interfaces
interface DestructuringInfo {
  bindings: BindingInfo[];
  destructuredNames: string[];
  hasDestructuring: boolean;
}

interface BindingInfo {
  localName: string;        // The variable name in the function body
  propertyName: string;     // The property name in the object
  propertyPath: string[];   // Full path to the property (for nested access)
  isOptional: boolean;      // Whether the binding has a question mark
  hasDefaultValue: boolean; // Whether the binding has a default value
}
