// tools/functional-di-enhanced-transformer/destructuring-processor.ts - Handles destructuring transformation

import { Node } from 'ts-morph';
import { TransformationOptions } from './types';

export class DestructuringProcessor {
  constructor(private options: TransformationOptions) {}

  /**
   * Remove services from destructuring patterns
   */
  removeServicesFromDestructuring(body: any): void {
    const statements = body.getStatements();
    
    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          
          if (Node.isObjectBindingPattern(nameNode)) {
            const initializer = declaration.getInitializer();
            
            if (initializer && Node.isIdentifier(initializer) && initializer.getText() === 'props') {
              this.processObjectBindingPattern(nameNode, statement);
            }
          }
        }
      }
    }
  }

  /**
   * Process object binding pattern and remove services
   */
  private processObjectBindingPattern(nameNode: any, statement: any): void {
    const elements = nameNode.getElements();
    const nonServicesElements: string[] = [];
    
    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const propertyName = element.getPropertyNameNode();
        const name = element.getNameNode();
        
        let elementName = '';
        if (propertyName && Node.isIdentifier(propertyName)) {
          elementName = propertyName.getText();
        } else if (Node.isIdentifier(name)) {
          elementName = name.getText();
        }
        
        if (elementName !== 'services') {
          nonServicesElements.push(element.getText());
        }
      }
    }
    
    this.updateDestructuringStatement(statement, nonServicesElements);
  }

  /**
   * Update destructuring statement with filtered elements
   */
  private updateDestructuringStatement(statement: any, nonServicesElements: string[]): void {
    if (nonServicesElements.length > 0) {
      const newDestructuring = `const { ${nonServicesElements.join(', ')} } = props;`;
      statement.replaceWithText(newDestructuring);
      
      if (this.options.verbose) {
        console.log(`🔄 Updated destructuring: ${newDestructuring}`);
      }
    } else {
      // Remove entire statement if no non-services elements remain
      statement.remove();
      
      if (this.options.verbose) {
        console.log(`🗑️  Removed empty destructuring statement`);
      }
    }
  }

  /**
   * Remove services from parameter type (for inline types)
   */
  removeServicesFromParameterType(param: any): void {
    const typeNode = param.getTypeNode();
    if (!typeNode) return;

    // Case 1: Inline type literal - can remove services property
    if (Node.isTypeLiteral(typeNode)) {
      this.removeServicesFromTypeLiteral(typeNode);
      return;
    }

    // Case 2: Type reference - need to create a new interface without services
    if (Node.isTypeReference(typeNode)) {
      const typeName = typeNode.getTypeName().getText();
      
      // For now, we'll comment out the services parameter rather than modifying the interface
      // This prevents breaking other components that use the same interface
      if (this.options.verbose) {
        console.log(`⚠️  Cannot remove services from interface ${typeName}, keeping parameter for compatibility`);
      }
      return;
    }
  }

  /**
   * Remove services property from type literal
   */
  private removeServicesFromTypeLiteral(typeNode: any): void {
    const members = typeNode.getMembers();
    for (const member of members) {
      if (Node.isPropertySignature(member) && member.getName() === 'services') {
        member.remove();
        
        if (this.options.verbose) {
          console.log(`🗑️  Removed services property from type literal`);
        }
        break;
      }
    }
  }

  /**
   * Analyze destructuring patterns in component
   */
  analyzeDestructuring(body: any): {
    hasDestructuring: boolean;
    hasServicesInDestructuring: boolean;
    otherDestructuredProps: string[];
  } {
    const statements = body.getStatements();
    let hasDestructuring = false;
    let hasServicesInDestructuring = false;
    const otherDestructuredProps: string[] = [];
    
    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          
          if (Node.isObjectBindingPattern(nameNode)) {
            hasDestructuring = true;
            const initializer = declaration.getInitializer();
            
            if (initializer && Node.isIdentifier(initializer) && initializer.getText() === 'props') {
              const elements = nameNode.getElements();
              
              for (const element of elements) {
                if (Node.isBindingElement(element)) {
                  const propertyName = element.getPropertyNameNode();
                  const name = element.getNameNode();
                  
                  let elementName = '';
                  if (propertyName && Node.isIdentifier(propertyName)) {
                    elementName = propertyName.getText();
                  } else if (Node.isIdentifier(name)) {
                    elementName = name.getText();
                  }
                  
                  if (elementName === 'services') {
                    hasServicesInDestructuring = true;
                  } else if (elementName) {
                    otherDestructuredProps.push(elementName);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return {
      hasDestructuring,
      hasServicesInDestructuring,
      otherDestructuredProps
    };
  }

  /**
   * Find and replace destructuring patterns
   */
  findAndReplaceDestructuring(body: any, replacements: Map<string, string>): void {
    const statements = body.getStatements();
    
    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        let statementText = statement.getText();
        let modified = false;
        
        for (const [original, replacement] of replacements) {
          if (statementText.includes(original)) {
            statementText = statementText.replace(original, replacement);
            modified = true;
          }
        }
        
        if (modified) {
          statement.replaceWithText(statementText);
          
          if (this.options.verbose) {
            console.log(`🔄 Replaced destructuring pattern: ${statementText}`);
          }
        }
      }
    }
  }

  /**
   * Generate new destructuring pattern without services
   */
  generateNewDestructuring(originalElements: string[]): string {
    const filteredElements = originalElements.filter(element => !element.includes('services'));
    
    if (filteredElements.length === 0) {
      return ''; // No destructuring needed
    }
    
    return `const { ${filteredElements.join(', ')} } = props;`;
  }

  /**
   * Validate destructuring transformation
   */
  validateDestructuring(body: any): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const analysis = this.analyzeDestructuring(body);
    
    if (analysis.hasServicesInDestructuring) {
      issues.push('Services still present in destructuring after transformation');
    }
    
    // Check for syntax errors in destructuring
    const statements = body.getStatements();
    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const statementText = statement.getText();
        
        // Check for common syntax issues
        if (statementText.includes('const {') && !statementText.includes('} = props')) {
          issues.push(`Malformed destructuring statement: ${statementText}`);
        }
        
        if (statementText.includes('const { }')) {
          issues.push(`Empty destructuring statement: ${statementText}`);
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Handle complex destructuring patterns
   */
  handleComplexDestructuring(nameNode: any): {
    processed: boolean;
    preservedElements: string[];
  } {
    const elements = nameNode.getElements();
    const preservedElements: string[] = [];
    let processed = false;
    
    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const elementText = element.getText();
        
        // Handle nested destructuring
        if (elementText.includes('{') && elementText.includes('}')) {
          // Complex nested pattern - preserve as-is but remove services
          if (!elementText.includes('services')) {
            preservedElements.push(elementText);
          } else {
            processed = true;
          }
        } else {
          // Simple property - check if it's services
          const propertyName = element.getPropertyNameNode();
          const name = element.getNameNode();
          
          let elementName = '';
          if (propertyName && Node.isIdentifier(propertyName)) {
            elementName = propertyName.getText();
          } else if (Node.isIdentifier(name)) {
            elementName = name.getText();
          }
          
          if (elementName !== 'services') {
            preservedElements.push(elementText);
          } else {
            processed = true;
          }
        }
      }
    }
    
    return {
      processed,
      preservedElements
    };
  }
}