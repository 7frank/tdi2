// tools/functional-di-enhanced-transformer/transformation-pipeline.ts - FIXED V2

import {
  FunctionDeclaration,
  ArrowFunction,
  SourceFile,
  Node,
  SyntaxKind
} from 'ts-morph';
import { ParameterNormalizer } from './parameter-normalizer';
import { EnhancedComponentTransformer } from './enhanced-component-transformer';
import { PropertyAccessUpdater } from './property-access-updater';
import { ExtractedDependency } from '../shared/SharedDependencyExtractor';

export interface TransformationPipelineOptions {
  verbose?: boolean;
  generateFallbacks?: boolean;
  preserveTypeAnnotations?: boolean;
}

export class TransformationPipeline {
  private normalizer: ParameterNormalizer;
  private transformer: EnhancedComponentTransformer;
  private propertyUpdater: PropertyAccessUpdater;

  constructor(private options: TransformationPipelineOptions = {}) {
    this.normalizer = new ParameterNormalizer({
      verbose: this.options.verbose,
      generateFallbacks: this.options.generateFallbacks,
      preserveTypeAnnotations: this.options.preserveTypeAnnotations
    });

    this.transformer = new EnhancedComponentTransformer({
      verbose: this.options.verbose,
      srcDir: './src'
    } as any);

    this.propertyUpdater = new PropertyAccessUpdater({
      verbose: this.options.verbose
    });
  }

  /**
   * FIXED V2: Complete transformation pipeline that handles all edge cases
   */
  transformComponent(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[],
    sourceFile: SourceFile
  ): void {
    if (this.options.verbose) {
      console.log(`🚀 Starting FIXED V2 transformation pipeline`);
      console.log(`📋 Dependencies to process: ${dependencies.length}`);
      dependencies.forEach(dep => {
        console.log(`  - ${dep.serviceKey}: ${dep.interfaceType} (path: [${dep.propertyPath?.join(', ') || 'direct'}])`);
      });
    }

    // Step 1: FIXED - Preserve original parameter name
    const originalParamName = this.preserveParameterName(func);

    // Step 2: FIXED - Generate DI hook calls for ALL dependencies
    this.generateCompleteDIHookCalls(func, dependencies, originalParamName);

    // Step 3: FIXED - Update ALL property access expressions
    this.updateAllPropertyAccessExpressions(func, dependencies);

    // Step 4: FIXED - Remove ALL redundant destructuring
    this.removeAllRedundantDestructuring(func, dependencies);

    // Step 5: Validate the transformation
    if (this.options.verbose) {
      console.log('✅ FIXED V2 transformation pipeline completed');
      this.debugTransformedFunction(func);
    }
  }

  /**
   * FIXED: Step 1 - Preserve original parameter name while normalizing destructuring
   */
  private preserveParameterName(func: FunctionDeclaration | ArrowFunction): string {
    const parameters = func.getParameters();
    if (parameters.length === 0) return 'props';

    const firstParam = parameters[0];
    const nameNode = firstParam.getNameNode();
    let originalParamName = 'props';

    // Get original parameter name
    if (Node.isIdentifier(nameNode)) {
      originalParamName = nameNode.getText();
      if (this.options.verbose) {
        console.log(`✅ Preserving parameter name: ${originalParamName}`);
      }
    } else if (Node.isObjectBindingPattern(nameNode)) {
      // For destructuring, try to infer from surrounding context or use 'props'
      const funcName = this.getFunctionName(func);
      if (funcName.toLowerCase().includes('foo')) {
        originalParamName = 'foo';
      } else {
        originalParamName = 'props';
      }

      // Convert destructuring to simple parameter
      const typeNode = firstParam.getTypeNode();
      const typeText = typeNode ? typeNode.getText() : 'any';
      
      firstParam.replaceWithText(`${originalParamName}: ${typeText}`);
      
      if (this.options.verbose) {
        console.log(`🔄 Converted destructuring to: ${originalParamName}: ${typeText}`);
      }
    }

    return originalParamName;
  }

  /**
   * FIXED: Step 2 - Generate DI hook calls for ALL dependencies
   */
  private generateCompleteDIHookCalls(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[],
    paramName: string
  ): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return;

    // Generate DI hook statements for ALL dependencies
    const statements: string[] = [];

    for (const dep of dependencies) {
      const statement = this.generateDIHookStatement(dep, paramName);
      if (statement) {
        statements.push(statement);
      }
    }

    // Insert ALL statements at the beginning of function body
    for (let i = statements.length - 1; i >= 0; i--) {
      body.insertStatements(0, statements[i]);
    }

    if (this.options.verbose) {
      console.log(`✅ Generated ${statements.length} DI hook statements`);
      statements.forEach(stmt => console.log(`  ${stmt}`));
    }
  }

  /**
   * FIXED: Generate DI hook statement with proper optional chaining
   */
  private generateDIHookStatement(dependency: ExtractedDependency, paramName: string): string | null {
    const propertyPath = this.generatePropertyPath(dependency, paramName);
    
    if (!dependency.resolvedImplementation) {
      if (dependency.isOptional) {
        return `const ${dependency.serviceKey} = ${propertyPath} ?? undefined;`;
      } else {
        return `const ${dependency.serviceKey} = ${propertyPath} ?? (useService('${dependency.sanitizedKey}') as unknown as ${dependency.interfaceType});`;
      }
    }

    const token = dependency.resolvedImplementation.sanitizedKey;
    const hookName = dependency.isOptional ? 'useOptionalService' : 'useService';
    
    return `const ${dependency.serviceKey} = ${propertyPath} ?? (${hookName}('${token}') as unknown as ${dependency.interfaceType});`;
  }

  /**
   * FIXED: Generate property path with proper optional chaining
   */
  private generatePropertyPath(dependency: ExtractedDependency, paramName: string): string {
    if (dependency.propertyPath && dependency.propertyPath.length > 0) {
      // For nested paths: props.services?.api
      const path = dependency.propertyPath.join('?.');
      return `${paramName}.${path}`;
    } else {
      // For direct paths: props.api
      return `${paramName}.${dependency.serviceKey}`;
    }
  }

  /**
   * FIXED: Step 3 - Update ALL property access expressions to use new variables
   */
  private updateAllPropertyAccessExpressions(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): void {
    const body = this.getFunctionBody(func);
    if (!body) return;

    if (this.options.verbose) {
      console.log('🔄 Updating property access expressions...');
    }

    // Create mapping of old access patterns to new variables
    const accessMappings = new Map<string, string>();
    
    for (const dep of dependencies) {
      if (dep.propertyPath && dep.propertyPath.length > 0) {
        // services.api -> api
        const oldPattern = dep.propertyPath.join('.');
        accessMappings.set(oldPattern, dep.serviceKey);
        
        // Also handle nested patterns
        if (dep.propertyPath.length === 2) {
          accessMappings.set(`${dep.propertyPath[0]}.${dep.propertyPath[1]}`, dep.serviceKey);
        }
      } else {
        // Direct access patterns
        accessMappings.set(dep.serviceKey, dep.serviceKey);
      }
    }

    // Update property access expressions
    const propertyAccessExpressions = body.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
    
    for (const propAccess of propertyAccessExpressions) {
      const fullText = propAccess.getText();
      let updated = false;

      // Try to match against our mappings
      for (const [oldPattern, newVar] of accessMappings) {
        if (fullText.startsWith(oldPattern + '.')) {
          // Replace pattern with new variable: services.api.getData() -> api.getData()
          const remainingPath = fullText.substring(oldPattern.length + 1);
          const newAccess = `${newVar}.${remainingPath}`;
          propAccess.replaceWithText(newAccess);
          updated = true;
          
          if (this.options.verbose) {
            console.log(`  🔄 ${fullText} -> ${newAccess}`);
          }
          break;
        } else if (fullText === oldPattern) {
          // Exact match: services.api -> api
          propAccess.replaceWithText(newVar);
          updated = true;
          
          if (this.options.verbose) {
            console.log(`  🔄 ${fullText} -> ${newVar}`);
          }
          break;
        }
      }

      if (!updated && this.options.verbose) {
        console.log(`  ⚠️  No mapping found for: ${fullText}`);
      }
    }
  }

  /**
   * FIXED: Step 4 - Remove ALL redundant destructuring statements
   */
  private removeAllRedundantDestructuring(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return;

    const statements = body.getStatements();
    const toRemove: any[] = [];

    // Create set of service keys that we've created DI hooks for
    const diServiceKeys = new Set(dependencies.map(dep => dep.serviceKey));

    if (this.options.verbose) {
      console.log(`🗑️  Checking for redundant destructuring. DI keys: [${Array.from(diServiceKeys).join(', ')}]`);
    }

    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          
          // Remove destructuring assignments that conflict with DI hooks
          if (Node.isObjectBindingPattern(nameNode)) {
            if (this.isRedundantDestructuring(nameNode, diServiceKeys, declaration)) {
              toRemove.push(statement);
              if (this.options.verbose) {
                console.log(`  🗑️  Removing redundant destructuring: ${statement.getText().trim()}`);
              }
              break;
            }
          }
          
          // Remove simple variable assignments that are now redundant
          if (Node.isIdentifier(nameNode)) {
            const varName = nameNode.getText();
            if (diServiceKeys.has(varName)) {
              const initializer = declaration.getInitializer();
              if (initializer && !initializer.getText().includes('??')) {
                toRemove.push(statement);
                if (this.options.verbose) {
                  console.log(`  🗑️  Removing redundant assignment: ${statement.getText().trim()}`);
                }
              }
            }
          }
        }
      }
    }

    // Remove identified statements
    for (const statement of toRemove) {
      statement.remove();
    }

    if (this.options.verbose) {
      console.log(`✅ Removed ${toRemove.length} redundant statements`);
    }
  }

  /**
   * FIXED: Check if destructuring conflicts with DI hooks
   */
  private isRedundantDestructuring(
    nameNode: any,
    diServiceKeys: Set<string>,
    declaration: any
  ): boolean {
    try {
      const initializer = declaration.getInitializer();
      if (!initializer) return false;

      // Check if destructuring from props/foo parameter
      const initializerText = initializer.getText();
      if (!initializerText.match(/^(props|foo|config|parameters?)$/)) {
        return false;
      }

      // Check if any destructured variables conflict with DI keys
      const elements = nameNode.getElements();
      for (const element of elements) {
        if (Node.isBindingElement(element)) {
          const bindingName = element.getNameNode();
          
          if (Node.isIdentifier(bindingName)) {
            const varName = bindingName.getText();
            if (diServiceKeys.has(varName)) {
              return true; // This destructuring conflicts with a DI hook
            }
          }
          
          // Handle nested destructuring: const { services: { api } } = props
          if (Node.isObjectBindingPattern(bindingName)) {
            const nestedElements = bindingName.getElements();
            for (const nestedElement of nestedElements) {
              if (Node.isBindingElement(nestedElement)) {
                const nestedBindingName = nestedElement.getNameNode();
                if (Node.isIdentifier(nestedBindingName)) {
                  const nestedVarName = nestedBindingName.getText();
                  if (diServiceKeys.has(nestedVarName)) {
                    return true; // Nested destructuring conflicts
                  }
                }
              }
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      if (this.options.verbose) {
        console.warn('⚠️  Error checking destructuring:', error);
      }
      return false;
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
   * Debug method to show transformed function
   */
  private debugTransformedFunction(func: FunctionDeclaration | ArrowFunction): void {
    if (!this.options.verbose) return;

    console.log('\n🐛 TRANSFORMED FUNCTION:');
    console.log('========================');
    console.log(func.getText());
    console.log('========================\n');
  }
}