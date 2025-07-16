// tools/functional-di-enhanced-transformer/transformation-pipeline.ts
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
   * Complete transformation pipeline that matches your expected output
   */
  transformComponent(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[],
    sourceFile: SourceFile
  ): void {
    if (this.options.verbose) {
      console.log(`🚀 Starting complete transformation pipeline`);
    }

    // Step 1: Normalize parameters (remove destructuring from function signature)
    this.normalizeParameters(func);

    // Step 2: Generate direct property access with DI fallbacks
    this.generateDirectPropertyAccess(func, dependencies);

    // Step 3: Update property access expressions to use new variables
    this.propertyUpdater.updatePropertyAccessAdvanced(func, dependencies);

    // Step 4: Remove any unused destructuring statements
    this.removeUnusedDestructuring(func);

    // Step 5: Validate the transformation
    if (this.options.verbose) {
      const validation = this.propertyUpdater.validateUpdates(func, dependencies);
      if (!validation.isValid) {
        console.warn('⚠️  Property access validation issues:', validation.issues);
      } else {
        console.log('✅ Property access validation passed');
      }
    }

    if (this.options.verbose) {
      console.log(`✅ Transformation pipeline completed`);
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
   * Step 2: Generate direct property access with DI fallbacks
   */
  private generateDirectPropertyAccess(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return;

    // Generate direct access statements for each dependency
    const statements: string[] = [];

    for (const dep of dependencies) {
      const statement = this.generateDirectAccessStatement(dep);
      if (statement) {
        statements.push(statement);
      }
    }

    // Insert statements at the beginning of function body
    for (let i = statements.length - 1; i >= 0; i--) {
      body.insertStatements(0, statements[i]);
    }

    if (this.options.verbose) {
      console.log(`✅ Generated ${statements.length} direct access statements`);
    }
  }

  /**
   * Generate direct property access statement with DI fallback
   */
  private generateDirectAccessStatement(dependency: ExtractedDependency): string | null {
    // Determine the property path based on dependency metadata
    const propertyPath = this.determinePropertyPath(dependency);
    
    if (!dependency.resolvedImplementation) {
      if (dependency.isOptional) {
        return `const ${dependency.serviceKey} = ${propertyPath} ?? undefined;`;
      } else {
        return `const ${dependency.serviceKey} = ${propertyPath} ?? (useService('${dependency.sanitizedKey}') as unknown as ${dependency.interfaceType});`;
      }
    }

    const token = dependency.resolvedImplementation.sanitizedKey;
    const hookName = dependency.isOptional ? 'useOptionalService' : 'useService';
    
    // Generate the exact pattern from your expected output
    return `const ${dependency.serviceKey} = ${propertyPath} ?? (${hookName}('${token}') as unknown as ${dependency.interfaceType});`;
  }

  /**
   * Determine property path for dependency access
   */
  private determinePropertyPath(dependency: ExtractedDependency): string {
    if (dependency.propertyPath && dependency.propertyPath.length > 0) {
      // Use full property path: props.services.api
      return `props.${dependency.propertyPath.join('.')}`;
    } else {
      // Direct property access: props.serviceKey
      return `props.${dependency.serviceKey}`;
    }
  }

  /**
   * Step 3: Update variable references and remove unused destructuring
   */
  private removeUnusedDestructuring(func: FunctionDeclaration | ArrowFunction): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) return;

    // First, update all property access expressions to use the new variables
    this.updatePropertyAccessExpressions(func);

    // Then remove any unused destructuring statements
    const statements = body.getStatements();
    const toRemove: any[] = [];

    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          
          // Remove destructuring assignments from props
          if (Node.isObjectBindingPattern(nameNode)) {
            const initializer = declaration.getInitializer();
            if (initializer && Node.isIdentifier(initializer) && initializer.getText() === 'props') {
              toRemove.push(statement);
              break;
            }
          }
          
          // Remove simple assignments that are now redundant
          if (Node.isIdentifier(nameNode)) {
            const initializer = declaration.getInitializer();
            if (initializer && initializer.getText().includes('props.') && !initializer.getText().includes('??')) {
              const varName = nameNode.getText();
              // Check if this variable is used elsewhere in the function
              if (!this.isVariableUsedInFunction(func, varName, statement)) {
                toRemove.push(statement);
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
      console.log(`🗑️  Removed ${toRemove.length} unused destructuring statements`);
    }
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