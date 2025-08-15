// tools/functional-di-enhanced-transformer/transformation-pipeline.ts - FIXED COMPLETE VERSION

import {
  FunctionDeclaration,
  ArrowFunction,
  SourceFile,
  Node,
  SyntaxKind,
  VariableStatement
} from 'ts-morph';
import { PropertyAccessUpdater } from './property-access-updater';
import { ExtractedDependency } from '../shared/SharedDependencyExtractor';
import { LifecycleGenerator, LifecycleGenerationOptions } from './lifecycle-generator';

export interface TransformationPipelineOptions {
  verbose?: boolean;
  generateFallbacks?: boolean;
  preserveTypeAnnotations?: boolean;
  enableLifecycleGeneration?: boolean;
  lifecycleOptions?: LifecycleGenerationOptions;
}

export class TransformationPipeline {

  private propertyUpdater: PropertyAccessUpdater;
  private lifecycleGenerator: LifecycleGenerator;

  constructor(private options: TransformationPipelineOptions = {}) {

    this.propertyUpdater = new PropertyAccessUpdater({
      verbose: this.options.verbose
    });

    this.lifecycleGenerator = new LifecycleGenerator({
      verbose: this.options.verbose,
      generateAbortController: true,
      combineMultipleServices: true,
      ...this.options.lifecycleOptions
    });
  }

  /**
   * FIXED: Complete transformation pipeline that preserves non-DI destructuring
   */
  transformComponent(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[],
    sourceFile: SourceFile
  ): void {
    if (this.options.verbose) {
      console.log(`🚀 Starting FIXED transformation pipeline`);
    }

    // Step 1: Normalize parameters (remove destructuring from function signature)
    this.normalizeParameters(func);

    // Step 2: FIXED - Generate DI hook calls with proper optional chaining AND preserve non-DI destructuring
    this.generateDIHookCallsAndPreserveDestructuring(func, dependencies);

    // Step 3: Update property access expressions to use new variables
    this.propertyUpdater.updatePropertyAccessAdvanced(func, dependencies);

    // Step 4: FIXED - Only remove DI-related destructuring, preserve other destructuring
    this.removeOnlyDIDestructuring(func, dependencies);

    // Step 5: Generate lifecycle hooks (NEW)
    if (this.options.enableLifecycleGeneration) {
      this.lifecycleGenerator.generateLifecycleHooks(func, dependencies, sourceFile);
    }

    // Step 6: Validate the transformation
    if (this.options.verbose) {
      const validation = this.propertyUpdater.validateUpdates(func, dependencies);
      if (!validation.isValid) {
        console.warn('⚠️  Property access validation issues:', validation.issues);
      } else {
        console.log('✅ Property access validation passed');
      }
    }

    if (this.options.verbose) {
      console.log(`✅ FIXED transformation pipeline completed`);
    }
  }

  /**
   * Step 1: Normalize parameters to always use 'props' parameter
   */
  private normalizeParameters(func: FunctionDeclaration | ArrowFunction): void {
    const parameters = func.getParameters();
    if (parameters.length === 0) return;

    const firstParam = parameters[0];
    const nameNode = firstParam.getNameNode();

    // If already using simple parameter name, ensure it's 'props'
    if (Node.isIdentifier(nameNode)) {
      const currentName = nameNode.getText();
      if (currentName !== 'props') {
        // Rename parameter to 'props'
        nameNode.replaceWithText('props');
        this.updateReferencesInBody(func, currentName, 'props');
      }
      return;
    }

    // If using destructuring, convert to props parameter
    if (Node.isObjectBindingPattern(nameNode)) {
      const typeNode = firstParam.getTypeNode();
      const typeText = typeNode ? typeNode.getText() : 'any';
      
      // Replace destructured parameter with props parameter
      firstParam.replaceWithText(`props: ${typeText}`);
      
      if (this.options.verbose) {
        console.log(`🔄 Normalized destructured parameter to: props: ${typeText}`);
      }
    }
  }

  /**
   * FIXED: Step 2 - Generate DI hook calls AND preserve non-DI destructuring
   */
  private generateDIHookCallsAndPreserveDestructuring(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return;

    // Generate DI hook statements for each dependency
    const diStatements: string[] = [];

    for (const dep of dependencies) {
      const statement = this.generateDIHookStatementWithOptionalChaining(dep);
      if (statement) {
        diStatements.push(statement);
      }
    }

    // FIXED: Analyze existing destructuring to preserve non-DI parts
    const preservedDestructuring = this.extractNonDIDestructuring(func, dependencies);

    // Insert DI statements at the beginning of function body
    for (let i = diStatements.length - 1; i >= 0; i--) {
      body.insertStatements(0, diStatements[i]);
    }

    // FIXED: Re-add preserved destructuring after DI statements
    if (preservedDestructuring.length > 0) {
      for (let i = preservedDestructuring.length - 1; i >= 0; i--) {
        body.insertStatements(diStatements.length, preservedDestructuring[i]);
      }
    }

    if (this.options.verbose) {
      console.log(`✅ Generated ${diStatements.length} DI hook statements with optional chaining`);
      if (preservedDestructuring.length > 0) {
        console.log(`✅ Preserved ${preservedDestructuring.length} non-DI destructuring statements`);
      }
    }
  }

  /**
   * FIXED: Extract non-DI destructuring that should be preserved using actual dependency paths
   */
  private extractNonDIDestructuring(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): string[] {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return [];

    const statements = body.getStatements();
    const preservedStatements: string[] = [];
    
    // Build a set of all property paths that are DI-related
    const diPropertyPaths = new Set<string>();
    for (const dep of dependencies) {
      // Add the full property path (e.g., "services.api", "config.cache", etc.)
      if (dep.propertyPath && dep.propertyPath.length > 0) {
        diPropertyPaths.add(dep.propertyPath.join('.'));
      }
      // Also add just the service key for direct access
      diPropertyPaths.add(dep.serviceKey);
    }

    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          
          // Check for destructuring assignments from props
          if (Node.isObjectBindingPattern(nameNode)) {
            const initializer = declaration.getInitializer();
            if (initializer && Node.isIdentifier(initializer) && initializer.getText() === 'props') {
              
              // FIXED: Extract only non-DI properties from destructuring
              const nonDIProperties = this.extractNonDIPropertiesFromDestructuring(nameNode, diPropertyPaths);
              
              if (nonDIProperties.length > 0) {
                const preservedDestructuring = `const { ${nonDIProperties.join(', ')} } = props;`;
                preservedStatements.push(preservedDestructuring);
                
                if (this.options.verbose) {
                  console.log(`📝 Preserving non-DI destructuring: ${preservedDestructuring}`);
                }
              }
            }
          }
        }
      }
    }

    return preservedStatements;
  }

  /**
   * FIXED: Extract non-DI properties from object binding pattern using actual dependency paths
   */
  private extractNonDIPropertiesFromDestructuring(
    bindingPattern: any,
    diPropertyPaths: Set<string>
  ): string[] {
    const nonDIProperties: string[] = [];
    
    // Recursively analyze the destructuring pattern
    const analyzePattern = (pattern: any, currentPath: string[] = []): void => {
      const elements = pattern.getElements();

      for (const element of elements) {
        if (Node.isBindingElement(element)) {
          const nameNode = element.getNameNode();
          const propertyNameNode = element.getPropertyNameNode();
          
          let propertyName: string;
          let localName: string;

          if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
            // { propertyName: localName } pattern
            propertyName = propertyNameNode.getText();
            localName = Node.isIdentifier(nameNode) ? nameNode.getText() : nameNode.getText();
          } else if (Node.isIdentifier(nameNode)) {
            // { localName } shorthand pattern
            propertyName = nameNode.getText();
            localName = nameNode.getText();
          } else {
            // Complex destructuring - try to extract text
            const elementText = element.getText();
            const match = elementText.match(/^(\w+)(?:\s*:\s*(\w+))?/);
            if (match) {
              propertyName = match[1];
              localName = match[2] || match[1];
            } else {
              continue; // Skip complex patterns we can't parse
            }
          }

          const fullPath = [...currentPath, propertyName].join('.');
          
          // Check if this property path is DI-related
          const isDIRelated = this.isPathDIRelated(fullPath, propertyName, diPropertyPaths);
          
          if (!isDIRelated) {
            // Handle nested destructuring
            if (Node.isObjectBindingPattern(nameNode)) {
              // This is nested destructuring like: { config: { theme, language } }
              // We need to preserve the structure but exclude DI parts
              const nestedNonDI: string[] = [];
              this.extractNestedNonDIProperties(nameNode, [...currentPath, propertyName], diPropertyPaths, nestedNonDI);
              
              if (nestedNonDI.length > 0) {
                const nestedPattern = `${propertyName}: { ${nestedNonDI.join(', ')} }`;
                nonDIProperties.push(nestedPattern);
                
                if (this.options.verbose) {
                  console.log(`🔒 Preserving nested non-DI property: ${nestedPattern}`);
                }
              }
            } else {
              // Simple property - preserve it
              if (propertyNameNode && propertyName !== localName) {
                nonDIProperties.push(`${propertyName}: ${localName}`);
              } else {
                nonDIProperties.push(propertyName);
              }
              
              if (this.options.verbose) {
                console.log(`🔒 Preserving non-DI property: ${propertyName}${propertyName !== localName ? ` as ${localName}` : ''}`);
              }
            }
          } else {
            if (this.options.verbose) {
              console.log(`🎯 Skipping DI-related property: ${fullPath}`);
            }
          }
        }
      }
    };

    analyzePattern(bindingPattern);
    return nonDIProperties;
  }

  /**
   * Check if a property path is DI-related by comparing against actual dependency paths
   */
  private isPathDIRelated(fullPath: string, propertyName: string, diPropertyPaths: Set<string>): boolean {
    // Direct match
    if (diPropertyPaths.has(fullPath)) {
      return true;
    }
    
    // Check if this property is a service key
    if (diPropertyPaths.has(propertyName)) {
      return true;
    }
    
    // Check if this path is a parent of any DI path
    for (const diPath of diPropertyPaths) {
      if (diPath.startsWith(fullPath + '.')) {
        return true; // This is a parent container of DI properties
      }
    }
    
    // Check if this path is a child of any DI path  
    for (const diPath of diPropertyPaths) {
      if (fullPath.startsWith(diPath + '.')) {
        return true; // This is a child of a DI property
      }
    }
    
    return false;
  }

  /**
   * Helper method to extract nested non-DI properties recursively
   */
  private extractNestedNonDIProperties(
    pattern: any, 
    currentPath: string[], 
    diPropertyPaths: Set<string>, 
    result: string[]
  ): void {
    const elements = pattern.getElements();

    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const nameNode = element.getNameNode();
        const propertyNameNode = element.getPropertyNameNode();
        
        let propertyName: string;
        
        if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
          propertyName = propertyNameNode.getText();
        } else if (Node.isIdentifier(nameNode)) {
          propertyName = nameNode.getText();
        } else {
          continue;
        }

        const fullPath = [...currentPath, propertyName].join('.');
        
        if (!this.isPathDIRelated(fullPath, propertyName, diPropertyPaths)) {
          if (Node.isObjectBindingPattern(nameNode)) {
            // Further nested destructuring
            const nestedResult: string[] = [];
            this.extractNestedNonDIProperties(nameNode, [...currentPath, propertyName], diPropertyPaths, nestedResult);
            if (nestedResult.length > 0) {
              result.push(`${propertyName}: { ${nestedResult.join(', ')} }`);
            }
          } else {
            result.push(propertyName);
          }
        }
      }
    }
  }

  /**
   * Generate DI hook statement with proper optional chaining
   */
  private generateDIHookStatementWithOptionalChaining(dependency: ExtractedDependency): string | null {
    // Determine the property path with optional chaining
    const propertyPath = this.determineOptionalPropertyPath(dependency);
    
    if (!dependency.resolvedImplementation) {
      // if (dependency.isOptional) {
      //   // Optional dependency that couldn't be resolved - use optional chaining
      //   return `const ${dependency.serviceKey} = ${propertyPath} ?? undefined; // ${dependency.sanitizedKey}') as unknown as ${dependency.interfaceType}`;
      // } else {
      //   // Required dependency that couldn't be resolved - use optional chaining with useService fallback
      //   return `const ${dependency.serviceKey} = ${propertyPath} ?? (useService('${dependency.sanitizedKey}') as unknown as ${dependency.interfaceType});`;
      // }

   
      console.error(`❌❌❌ "Could not find implementation for '${dependency.interfaceType}'`,dependency)
     

      return `const ${dependency.serviceKey} = ${propertyPath}; if (!${dependency.serviceKey}) {throw new Error("Could not find implementation for '${dependency.interfaceType}'");}`;
    }

    const token = dependency.resolvedImplementation.sanitizedKey;
    const hookName = dependency.isOptional ? 'useOptionalService' : 'useService';
    
    // Generate the exact pattern from your expected output
    return `const ${dependency.serviceKey} = ${propertyPath} ?? (${hookName}('${token}') as unknown as ${dependency.interfaceType});`;
  }

  /**
   * Determine property path with proper optional chaining
   */
  private determineOptionalPropertyPath(dependency: ExtractedDependency): string {
    if (dependency.propertyPath && dependency.propertyPath.length > 0) {
      // Use optional chaining for nested properties: props.services?.api
      const path = dependency.propertyPath.join('?.');
      return `props.${path}`;
    } else {
      // Use optional chaining for direct property access: props.serviceKey
      return `props.${dependency.serviceKey}`;
    }
  }

  /**
   * FIXED: Step 4 - Remove ALL original destructuring that contains ANY DI properties
   */
  private removeOnlyDIDestructuring(func: FunctionDeclaration | ArrowFunction, dependencies: ExtractedDependency[]): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return;

    const statements = body.getStatements();
    const toRemove: VariableStatement[] = [];
    
    // Build a set of all property paths that are DI-related
    const diPropertyPaths = new Set<string>();
    for (const dep of dependencies) {
      if (dep.propertyPath && dep.propertyPath.length > 0) {
        diPropertyPaths.add(dep.propertyPath.join('.'));
      }
      diPropertyPaths.add(dep.serviceKey);
    }

    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          
          // FIXED: Remove ANY destructuring from props that contains DI properties
          if (Node.isObjectBindingPattern(nameNode)) {
            const initializer = declaration.getInitializer();
            if (initializer && Node.isIdentifier(initializer) && initializer.getText() === 'props') {
              
              // Check if this destructuring contains ANY DI-related properties
              if (this.containsAnyDIProperties(nameNode, diPropertyPaths)) {
                toRemove.push(statement);
                
                if (this.options.verbose) {
                  console.log(`🗑️  Removing original destructuring (contains DI): ${statement.getText()}`);
                }
              }
            }
          }
          
          // Remove simple assignments that are now redundant (like const api = props.services?.api)
          if (Node.isIdentifier(nameNode)) {
            const initializer = declaration.getInitializer();
            if (initializer && initializer.getText().includes('props.') && !initializer.getText().includes('??')) {
              const varName = nameNode.getText();
              // Check if this variable is used elsewhere in the function
              if (!this.isVariableUsedInFunction(func, varName, statement)) {
                toRemove.push(statement);
                
                if (this.options.verbose) {
                  console.log(`🗑️  Removing redundant assignment: ${statement.getText()}`);
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

    if (this.options.verbose && toRemove.length > 0) {
      console.log(`🗑️  Removed ${toRemove.length} original destructuring statements`);
    }
  }

  /**
   * FIXED: Check if destructuring contains ANY DI-related properties (not just only DI)
   */
  private containsAnyDIProperties(bindingPattern: any, diPropertyPaths: Set<string>): boolean {
    return this.findAnyDIInDestructuring(bindingPattern, [], diPropertyPaths);
  }

  /**
   * Recursively search for ANY DI-related properties in destructuring pattern
   */
  private findAnyDIInDestructuring(pattern: any, currentPath: string[], diPropertyPaths: Set<string>): boolean {
    const elements = pattern.getElements();
    
    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const nameNode = element.getNameNode();
        const propertyNameNode = element.getPropertyNameNode();
        
        let propertyName: string;
        
        if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
          propertyName = propertyNameNode.getText();
        } else if (Node.isIdentifier(nameNode)) {
          propertyName = nameNode.getText();
        } else {
          // For complex patterns, continue checking
          continue;
        }
        
        const fullPath = [...currentPath, propertyName].join('.');
        
        // Check if this property is DI-related
        if (this.isPathDIRelated(fullPath, propertyName, diPropertyPaths)) {
          return true; // Found a DI property
        }
        
        // If this has nested destructuring, check recursively
        if (Node.isObjectBindingPattern(nameNode)) {
          if (this.findAnyDIInDestructuring(nameNode, [...currentPath, propertyName], diPropertyPaths)) {
            return true; // Found DI properties in nested structure
          }
        }
      }
    }
    
    return false; // No DI properties found
  }

  /**
   * Update property access expressions to use the new direct variables
   */
  private updatePropertyAccessExpressions(func: FunctionDeclaration | ArrowFunction): void {
    const body = this.getFunctionBody(func);
    if (!body) return;

    // Find all property access expressions in the function body
    const propertyAccessExpressions = body.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
    
    for (const propAccess of propertyAccessExpressions) {
      const fullText = propAccess.getText();

      // Handle patterns like "services.api.getData()" -> "api.getData()"
      if (fullText.includes('.')) {
        const updated = this.simplifyPropertyAccess(fullText);
        if (updated !== fullText) {
          propAccess.replaceWithText(updated);
          
          if (this.options.verbose) {
            console.log(`🔄 Updated property access: ${fullText} -> ${updated}`);
          }
        }
      }
    }
  }

  /**
   * Simplify property access patterns
   */
  private simplifyPropertyAccess(propertyAccess: string): string {
    // Handle "services.api.getData()" -> "api.getData()"
    if (propertyAccess.startsWith('services.')) {
      const parts = propertyAccess.split('.');
      if (parts.length >= 3) {
        // services.api.getData() -> api.getData()
        return parts.slice(1).join('.');
      } else if (parts.length === 2) {
        // services.api -> api
        return parts[1];
      }
    }
    
    // Handle direct property access like "cache.get()" -> "cache.get()"
    // (no change needed if it's already simplified)
    
    return propertyAccess;
  }

  /**
   * Check if a variable is used in the function body (excluding the declaration statement)
   */
  private isVariableUsedInFunction(
    func: FunctionDeclaration | ArrowFunction,
    variableName: string,
    excludeStatement: any
  ): boolean {
    const body = this.getFunctionBody(func);
    if (!body) return false;

    const bodyText = body.getText();
    const excludeText = excludeStatement.getText();
    const bodyWithoutDeclaration = bodyText.replace(excludeText, '');
    
    // Simple check for variable usage (could be made more sophisticated)
    const variableRegex = new RegExp(`\\b${variableName}\\b`, 'g');
    const matches = bodyWithoutDeclaration.match(variableRegex);
    
    return matches && matches.length > 0;
  }

  /**
   * Update all references to a renamed variable in function body
   */
  private updateReferencesInBody(
    func: FunctionDeclaration | ArrowFunction,
    oldName: string,
    newName: string
  ): void {
    // This would require sophisticated AST traversal to safely rename variables
    // For now, we'll use a simple text replacement approach
    const body = this.getFunctionBody(func);
    if (!body) return;

    // Get all identifiers in the function body
    const identifiers = body.getDescendantsOfKind(SyntaxKind.Identifier);
    
    for (const identifier of identifiers) {
      if (identifier.getText() === oldName) {
        // Check if this is a variable reference (not a property name)
        const parent = identifier.getParent();
        if (!Node.isPropertyAccessExpression(parent) || parent.getNameNode() !== identifier) {
          identifier.replaceWithText(newName);
        }
      }
    }

    if (this.options.verbose) {
      console.log(`🔄 Updated references from '${oldName}' to '${newName}'`);
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
}

// Integration with the main transformer
export class IntegratedTransformer {
  private pipeline: TransformationPipeline;

  constructor(options: TransformationPipelineOptions = {}) {
    this.pipeline = new TransformationPipeline(options);
  }

  /**
   * Transform a component using the complete pipeline
   */
  async transformComponent(
    func: FunctionDeclaration | ArrowFunction,
    sourceFile: SourceFile,
    dependencies: ExtractedDependency[]
  ): Promise<void> {
    // Add necessary imports
    this.ensureImports(sourceFile);

    // Run the complete transformation pipeline
    this.pipeline.transformComponent(func, dependencies, sourceFile);
  }

  /**
   * Ensure required imports are present
   */
  private ensureImports(sourceFile: SourceFile): void {
    const existingImports = sourceFile.getImportDeclarations();
    
    // Check if DI context imports exist
    const hasDIImport = existingImports.some(imp =>
      imp.getModuleSpecifierValue().includes('@tdi2/di-core/context')
    );

    if (!hasDIImport) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: '@tdi2/di-core/context',
        namedImports: ['useService', 'useOptionalService']
      });
    }
  }

  /**
   * Check if component needs transformation
   */
  needsTransformation(func: FunctionDeclaration | ArrowFunction): boolean {
    const parameters = func.getParameters();
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const typeNode = firstParam.getTypeNode();
    if (!typeNode) return false;

    const typeText = typeNode.getText();
    return typeText.includes('Inject<') || typeText.includes('InjectOptional<');
  }
}