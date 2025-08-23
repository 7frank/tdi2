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
import type { IntegratedInterfaceResolver } from '../interface-resolver/integrated-interface-resolver';

export interface TransformationPipelineOptions {
  verbose?: boolean;
  generateFallbacks?: boolean;
  preserveTypeAnnotations?: boolean;
  interfaceResolver?: IntegratedInterfaceResolver;
}

export class TransformationPipeline {

  private propertyUpdater: PropertyAccessUpdater;

  constructor(private options: TransformationPipelineOptions = {}) {
    this.propertyUpdater = new PropertyAccessUpdater({
      verbose: this.options.verbose
    });
  }

  /**
   * Step 0: Enhance dependencies with resolved implementations
   */
  private enhanceDependenciesWithResolution(dependencies: ExtractedDependency[]): ExtractedDependency[] {
    if (this.options.verbose) {
      console.log(`🔍 Enhancing ${dependencies.length} dependencies with resolution...`);
      dependencies.forEach(dep => {
        console.log(`  - ${dep.serviceKey}: ${dep.interfaceType} (resolvedImplementation: ${dep.resolvedImplementation ? 'already set' : 'not set'})`);
      });
    }

    if (!this.options.interfaceResolver) {
      if (this.options.verbose) {
        console.log('⚠️  No interface resolver available for dependency resolution');
      }
      return dependencies;
    }

    return dependencies.map(dep => {
      // If already resolved, keep the existing resolution
      if (dep.resolvedImplementation) {
        if (this.options.verbose) {
          console.log(`✅ Keeping existing resolution: ${dep.interfaceType} → ${dep.resolvedImplementation.implementationClass}`);
        }
        return dep;
      }

      // Try to resolve if not already resolved
      const resolvedImplementation = this.options.interfaceResolver!.resolveImplementation(dep.interfaceType);
      
      if (resolvedImplementation) {
        if (this.options.verbose) {
          console.log(`✅ Newly resolved ${dep.interfaceType} → ${resolvedImplementation.implementationClass}`);
        }
        return {
          ...dep,
          resolvedImplementation
        };
      } else {
        if (this.options.verbose) {
          console.log(`❌ Could not resolve implementation for ${dep.interfaceType}`);
        }
        return dep;
      }
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

    // Step 0: Enhance dependencies with resolved implementations
    const enhancedDependencies = this.enhanceDependenciesWithResolution(dependencies);

    // Step 1: Extract ALL parameter variables BEFORE any transformation
    const parameterVariables = this.extractAllParameterVariables(func);

    // Step 2: Normalize parameters (remove destructuring from function signature)
    this.normalizeParameters(func);

    // Step 3: FIXED - Generate DI hook calls with proper optional chaining AND preserve non-DI destructuring
    this.generateDIHookCallsAndPreserveDestructuring(func, enhancedDependencies);

    // Step 4: Update property access expressions to use new variables
    this.propertyUpdater.updatePropertyAccessAdvanced(func, enhancedDependencies);

    // Step 5: Normalize ALL parameter variable references to props.* access
    this.normalizeParameterVariableReferences(func, parameterVariables);

    // Step 5.5: Remove ALL parameter-derived destructuring statements
    this.removeParameterDerivedDestructuring(func, parameterVariables);

    // Step 6: FIXED - Only remove DI-related destructuring, preserve other destructuring
    this.removeOnlyDIDestructuring(func, enhancedDependencies);

    // Step 7: Lifecycle hooks are now handled automatically in useService() hooks
    // No code generation needed - lifecycle management is built into the DI system

    // Step 8: Validate the transformation
    if (this.options.verbose) {
      const validation = this.propertyUpdater.validateUpdates(func, enhancedDependencies);
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
      const statements = this.generateDIHookStatementsWithOptionalChaining(dep);
      if (statements) {
        diStatements.push(...statements);
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
  private generateDIHookStatementsWithOptionalChaining(dependency: ExtractedDependency): string[] | null {
    // Determine the property path with optional chaining
    const propertyPath = this.determineOptionalPropertyPath(dependency);
    
    if (!dependency.resolvedImplementation) {
      // Log for debugging - this helps track which services couldn't be resolved
      console.error(`❌❌❌ "Could not find implementation for '${dependency.interfaceType}'`, dependency);
      
      if (dependency.isOptional) {
        // Optional dependency that couldn't be resolved - use optional chaining with useOptionalService fallback
        return [
          `const ${dependency.serviceKey} = ${propertyPath} ?? (useOptionalService('${dependency.sanitizedKey}') as unknown as ${dependency.interfaceType});`
        ];
      } else {
        // Required dependency that couldn't be resolved - use optional chaining with useService fallback
        return [
          `const ${dependency.serviceKey} = ${propertyPath} ?? (useService('${dependency.sanitizedKey}') as unknown as ${dependency.interfaceType});`
        ];
      }
    }

    const token = dependency.resolvedImplementation.sanitizedKey;
    const hookName = dependency.isOptional ? 'useOptionalService' : 'useService';
    
    // Generate the exact pattern from your expected output
    return [
      `const ${dependency.serviceKey} = ${propertyPath} ?? (${hookName}('${token}') as unknown as ${dependency.interfaceType});`
    ];
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
   * Extract ALL parameter variables with their original destructuring paths
   */
  private extractAllParameterVariables(func: FunctionDeclaration | ArrowFunction): Map<string, string> {
    const parameterVariables = new Map<string, string>();
    const parameters = func.getParameters();
    
    if (parameters.length === 0) return parameterVariables;

    const firstParam = parameters[0];
    const nameNode = firstParam.getNameNode();

    // If the parameter is destructured in signature, extract all variables with their paths
    if (Node.isObjectBindingPattern(nameNode)) {
      this.extractVariablesFromDestructuring(nameNode, [], parameterVariables);
    } else if (Node.isIdentifier(nameNode)) {
      // FIXED: Handle case where parameter is not destructured in signature (e.g., props: PropsType)
      // But destructuring happens in function body: const { ... } = props;
      const paramName = nameNode.getText();
      this.extractDirectPropsDestructuring(func, paramName, parameterVariables);
    }

    // ENHANCED: Also extract parameter-derived variables from function body
    this.extractParameterDerivedVariables(func, parameterVariables);

    if (this.options.verbose) {
      console.log(`🔍 Extracted ${parameterVariables.size} parameter variables (including derived):`, 
        Array.from(parameterVariables.entries()));
    }

    return parameterVariables;
  }

  /**
   * Recursively extract variables from destructuring patterns with their paths
   */
  private extractVariablesFromDestructuring(
    pattern: any, 
    currentPath: string[], 
    result: Map<string, string>
  ): void {
    const elements = pattern.getElements();

    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const nameNode = element.getNameNode();
        const propertyNameNode = element.getPropertyNameNode();

        if (Node.isIdentifier(nameNode)) {
          // Simple case: { todo } or { propertyName: localName }
          let propertyName: string;
          let localName: string;

          if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
            // { propertyName: localName } pattern
            propertyName = propertyNameNode.getText();
            localName = nameNode.getText();
          } else {
            // { localName } shorthand pattern
            propertyName = nameNode.getText();
            localName = nameNode.getText();
          }

          // Build the props access path
          const fullPath = [...currentPath, propertyName];
          const propsAccess = fullPath.length > 0 ? 
            `props.${fullPath.join('?.')}` : 
            `props.${propertyName}`;
          
          result.set(localName, propsAccess);
          
          if (this.options.verbose) {
            console.log(`📝 Variable mapping: ${localName} -> ${propsAccess}`);
          }

        } else if (Node.isObjectBindingPattern(nameNode)) {
          // Nested destructuring: { services: { api } }
          let propertyName: string;
          
          if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
            propertyName = propertyNameNode.getText();
          } else {
            continue; // Skip complex patterns we can't parse
          }
          
          // Recurse into nested destructuring
          this.extractVariablesFromDestructuring(nameNode, [...currentPath, propertyName], result);
        }
      }
    }
  }

  /**
   * Normalize parameter variable references to use props.* access
   */
  private normalizeParameterVariableReferences(
    func: FunctionDeclaration | ArrowFunction,
    parameterVariables: Map<string, string>
  ): void {
    if (parameterVariables.size === 0) {
      if (this.options.verbose) {
        console.log(`📝 No parameter variables to normalize - skipping`);
      }
      return;
    }

    const body = this.getFunctionBody(func);
    if (!body) return;

    if (this.options.verbose) {
      console.log(`🔄 Normalizing ${parameterVariables.size} parameter variable references`);
    }

    // Get all identifiers in the function body
    const identifiers = body.getDescendantsOfKind(SyntaxKind.Identifier);
    
    // Set of known local variables (DI services and other local declarations)
    const knownLocalVariables = new Set<string>();
    
    // Add DI service variables that were injected
    const existingStatements = body.getStatements();
    for (const statement of existingStatements) {
      const statementText = statement.getText();
      if (statementText.includes('useService') || statementText.includes('useOptionalService')) {
        // Extract variable name from "const variableName = ..."
        const match = statementText.match(/^\s*const\s+(\w+)\s*=/);
        if (match) {
          knownLocalVariables.add(match[1]);
        }
      }
    }
    
    // Add other local variables (like 'data' in function body)
    for (const statement of existingStatements) {
      const statementText = statement.getText();
      const localVarMatch = statementText.match(/^\s*const\s+(\w+)\s*=/);
      if (localVarMatch && !statementText.includes('useService')) {
        knownLocalVariables.add(localVarMatch[1]);
      }
    }

    if (this.options.verbose) {
      console.log(`🔍 Known local variables:`, Array.from(knownLocalVariables));
    }
    
    // Normalize only parameter variables
    for (const identifier of identifiers) {
      const varName = identifier.getText();
      const parent = identifier.getParent();
      
      // Only normalize if this is a parameter variable
      if (!parameterVariables.has(varName)) {
        continue;
      }

      // Skip if this is a known local variable (already declared in function)
      if (knownLocalVariables.has(varName)) {
        continue;
      }
      
      // Skip if this identifier is already part of a property access (like props.something)
      if (Node.isPropertyAccessExpression(parent) && parent.getExpression() === identifier) {
        continue;
      }
      
      // Skip if this is a property name (like in obj.propertyName)
      if (Node.isPropertyAccessExpression(parent) && parent.getName() === varName) {
        continue;
      }
      
      // Convert to props.* access using the original path
      const propsAccess = parameterVariables.get(varName)!;
      identifier.replaceWithText(propsAccess);
      
      if (this.options.verbose) {
        console.log(`🔄 Normalized parameter variable: ${varName} -> ${propsAccess}`);
      }
    }
  }

  /**
   * Extract variables from direct props destructuring in function body
   * e.g., const { services, onComplete } = props;
   */
  private extractDirectPropsDestructuring(
    func: FunctionDeclaration | ArrowFunction,
    propsParamName: string,
    result: Map<string, string>
  ): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return;

    const statements = body.getStatements();

    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          const initializer = declaration.getInitializer();
          
          // Look for: const { ... } = props
          if (Node.isObjectBindingPattern(nameNode) && 
              initializer && 
              Node.isIdentifier(initializer) && 
              initializer.getText() === propsParamName) {
            
            // Extract variables from this destructuring
            this.extractVariablesFromDestructuring(nameNode, [], result);
            
            if (this.options.verbose) {
              console.log(`📝 Found direct props destructuring: const { ... } = ${propsParamName}`);
            }
          }
        }
      }
    }
  }

  /**
   * Extract parameter-derived variables from destructuring in function body
   */
  private extractParameterDerivedVariables(
    func: FunctionDeclaration | ArrowFunction,
    knownParameterVars: Map<string, string>
  ): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return;

    const statements = body.getStatements();
    let foundNewVars = true;

    // Keep scanning until no new parameter-derived variables are found
    while (foundNewVars) {
      foundNewVars = false;
      
      for (const statement of statements) {
        if (Node.isVariableStatement(statement)) {
          const declarations = statement.getDeclarationList().getDeclarations();
          
          for (const declaration of declarations) {
            const nameNode = declaration.getNameNode();
            const initializer = declaration.getInitializer();
            
            // Check for destructuring assignment: const { ... } = someVar
            if (Node.isObjectBindingPattern(nameNode) && initializer && Node.isIdentifier(initializer)) {
              const sourceVarName = initializer.getText();
              
              // If source variable is parameter-derived, extract its destructured variables
              if (knownParameterVars.has(sourceVarName)) {
                const sourcePath = knownParameterVars.get(sourceVarName)!;
                const newVars = this.extractDestructuredVariablesWithSource(nameNode, sourcePath);
                
                // Add newly found variables
                for (const [varName, varPath] of newVars.entries()) {
                  if (!knownParameterVars.has(varName)) {
                    knownParameterVars.set(varName, varPath);
                    foundNewVars = true;
                    
                    if (this.options.verbose) {
                      console.log(`📝 Found parameter-derived variable: ${varName} -> ${varPath}`);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Extract destructured variables with their full source path
   */
  private extractDestructuredVariablesWithSource(
    pattern: any,
    sourcePath: string
  ): Map<string, string> {
    const result = new Map<string, string>();
    const elements = pattern.getElements();

    for (const element of elements) {
      if (Node.isBindingElement(element)) {
        const nameNode = element.getNameNode();
        const propertyNameNode = element.getPropertyNameNode();

        if (Node.isIdentifier(nameNode)) {
          let propertyName: string;
          let localName: string;

          if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
            // { propertyName: localName } pattern
            propertyName = propertyNameNode.getText();
            localName = nameNode.getText();
          } else {
            // { localName } shorthand pattern
            propertyName = nameNode.getText();
            localName = nameNode.getText();
          }

          // Build full path: sourcePath.propertyName
          const fullPath = sourcePath.includes('?.') || sourcePath.includes('.') ? 
            `${sourcePath}?.${propertyName}` : 
            `${sourcePath}.${propertyName}`;
          
          result.set(localName, fullPath);

        } else if (Node.isObjectBindingPattern(nameNode)) {
          // Nested destructuring: { services: { api } }
          let propertyName: string;
          
          if (propertyNameNode && Node.isIdentifier(propertyNameNode)) {
            propertyName = propertyNameNode.getText();
          } else {
            continue;
          }
          
          const nestedPath = sourcePath.includes('?.') || sourcePath.includes('.') ? 
            `${sourcePath}?.${propertyName}` : 
            `${sourcePath}.${propertyName}`;
          
          // Recurse into nested destructuring
          const nestedVars = this.extractDestructuredVariablesWithSource(nameNode, nestedPath);
          for (const [varName, varPath] of nestedVars.entries()) {
            result.set(varName, varPath);
          }
        }
      }
    }

    return result;
  }

  /**
   * Remove ALL destructuring statements that reference parameter-derived variables
   */
  private removeParameterDerivedDestructuring(
    func: FunctionDeclaration | ArrowFunction,
    parameterVariables: Map<string, string>
  ): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return;

    const statements = body.getStatements();
    const statementsToRemove: any[] = [];

    if (this.options.verbose) {
      console.log(`🗑️  Scanning for parameter-derived destructuring to remove...`);
    }

    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        let shouldRemoveStatement = false;
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          const initializer = declaration.getInitializer();
          
          // Check for destructuring assignment: const { ... } = someVar
          if (Node.isObjectBindingPattern(nameNode) && initializer && Node.isIdentifier(initializer)) {
            const sourceVarName = initializer.getText();
            
            // If source variable is parameter-derived, mark statement for removal
            if (parameterVariables.has(sourceVarName)) {
              shouldRemoveStatement = true;
              
              if (this.options.verbose) {
                console.log(`🗑️  Marked for removal - destructuring from parameter-derived variable: ${sourceVarName}`);
              }
              break;
            }
          }
        }

        if (shouldRemoveStatement) {
          statementsToRemove.push(statement);
        }
      }
    }

    // Remove the identified statements
    for (const statement of statementsToRemove) {
      statement.remove();
      
      if (this.options.verbose) {
        console.log(`🗑️  Removed parameter-derived destructuring statement`);
      }
    }

    if (this.options.verbose) {
      console.log(`🗑️  Removed ${statementsToRemove.length} parameter-derived destructuring statements`);
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