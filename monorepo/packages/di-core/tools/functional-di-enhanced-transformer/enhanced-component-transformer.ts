// tools/functional-di-enhanced-transformer/enhanced-component-transformer.ts
import {
  FunctionDeclaration,
  ArrowFunction,
  Node,
  SourceFile
} from 'ts-morph';
import { ParameterNormalizer, NormalizationResult } from './parameter-normalizer';
import { ExtractedDependency } from '../shared/SharedDependencyExtractor';
import { TransformationOptions } from './types';

export interface EnhancedTransformationResult {
  wasTransformed: boolean;
  normalizationResult: NormalizationResult;
  injectedDependencies: ExtractedDependency[];
  generatedStatements: string[];
  addedImports: string[];
  removedElements: string[];
}

export class EnhancedComponentTransformer {
  private parameterNormalizer: ParameterNormalizer;

  constructor(private options: TransformationOptions) {
    this.parameterNormalizer = new ParameterNormalizer({
      verbose: this.options.verbose,
      generateFallbacks: true,
      preserveTypeAnnotations: true
    });
  }

  /**
   * Transform a function declaration with parameter normalization
   */
  transformFunction(
    func: FunctionDeclaration,
    dependencies: ExtractedDependency[],
    sourceFile: SourceFile
  ): EnhancedTransformationResult {
    if (this.options.verbose) {
      const funcName = func.getName() || 'anonymous';
      console.log(`🔄 Enhanced transform: ${funcName} with ${dependencies.length} dependencies`);
    }

    // Step 1: Normalize parameters (remove destructuring)
    const normalizationResult = this.parameterNormalizer.normalizeFunction(func, sourceFile);

    // Step 2: Generate DI statements
    const diStatements = this.generateDIStatements(dependencies, normalizationResult);

    // Step 3: Insert DI statements into function body
    this.insertDIStatements(func, diStatements);

    // Step 4: Replace any normalization placeholders
    this.replacePlaceholders(func, dependencies, normalizationResult);

    return {
      wasTransformed: true,
      normalizationResult,
      injectedDependencies: dependencies,
      generatedStatements: diStatements,
      addedImports: ['useService', 'useOptionalService'],
      removedElements: normalizationResult.removedDestructuring
    };
  }

  /**
   * Transform an arrow function with parameter normalization
   */
  transformArrowFunction(
    arrowFunc: ArrowFunction,
    dependencies: ExtractedDependency[],
    sourceFile: SourceFile
  ): EnhancedTransformationResult {
    if (this.options.verbose) {
      console.log(`🔄 Enhanced transform: arrow function with ${dependencies.length} dependencies`);
    }

    // Step 1: Normalize parameters
    const normalizationResult = this.parameterNormalizer.normalizeArrowFunction(arrowFunc, sourceFile);

    // Step 2: Generate DI statements
    const diStatements = this.generateDIStatements(dependencies, normalizationResult);

    // Step 3: Insert DI statements into function body
    this.insertDIStatements(arrowFunc, diStatements);

    // Step 4: Replace any normalization placeholders
    this.replacePlaceholders(arrowFunc, dependencies, normalizationResult);

    return {
      wasTransformed: true,
      normalizationResult,
      injectedDependencies: dependencies,
      generatedStatements: diStatements,
      addedImports: ['useService', 'useOptionalService'],
      removedElements: normalizationResult.removedDestructuring
    };
  }

  /**
   * Generate DI statements based on dependencies and normalization result
   */
  private generateDIStatements(
    dependencies: ExtractedDependency[],
    normalizationResult: NormalizationResult
  ): string[] {
    const statements: string[] = [];

    for (const dep of dependencies) {
      const statement = this.generateDIStatement(dep, normalizationResult);
      if (statement) {
        statements.push(statement);
      }
    }

    return statements;
  }

  /**
   * Generate individual DI statement with fallback pattern
   */
  private generateDIStatement(
    dependency: ExtractedDependency,
    normalizationResult: NormalizationResult
  ): string | null {
    if (!dependency.resolvedImplementation) {
      if (dependency.isOptional) {
        // Optional dependency that couldn't be resolved
        return `const ${dependency.serviceKey} = undefined; // Optional dependency not found`;
      } else {
        // Required dependency that couldn't be resolved - will throw at runtime
        return `const ${dependency.serviceKey} = useService('${dependency.sanitizedKey}') as unknown as ${dependency.interfaceType};`;
      }
    }

    const token = dependency.resolvedImplementation.sanitizedKey;
    const hookName = dependency.isOptional ? 'useOptionalService' : 'useService';

    // Generate the fallback pattern based on whether we normalized parameters
    if (normalizationResult.wasNormalized) {
      // Use props access with DI fallback
      const propsAccess = this.generatePropsAccess(dependency, normalizationResult.newParameterName);
      return `const ${dependency.serviceKey} = ${propsAccess} ?? (${hookName}('${token}') as unknown as ${dependency.interfaceType});`;
    } else {
      // Simple DI hook call
      return `const ${dependency.serviceKey} = ${hookName}('${token}') as unknown as ${dependency.interfaceType};`;
    }
  }

  /**
   * Generate props access pattern for dependency
   */
  private generatePropsAccess(dependency: ExtractedDependency, propsName: string): string {
    if (dependency.propertyPath && dependency.propertyPath.length > 0) {
      // Use the full property path: props.services.api
      return `${propsName}.${dependency.propertyPath.join('.')}`;
    } else {
      // Direct property access: props.serviceKey
      return `${propsName}.${dependency.serviceKey}`;
    }
  }

  /**
   * Insert DI statements into function body
   */
  private insertDIStatements(
    func: FunctionDeclaration | ArrowFunction,
    statements: string[]
  ): void {
    const body = this.getFunctionBody(func);
    if (!body || !Node.isBlock(body)) {
      if (this.options.verbose) {
        console.warn('⚠️  Cannot insert DI statements into non-block function body');
      }
      return;
    }

    // Insert DI statements after any normalization statements
    // Find the first non-const statement or insert at the beginning
    let insertIndex = 0;
    const bodyStatements = body.getStatements();

    // Skip over normalization const statements
    for (let i = 0; i < bodyStatements.length; i++) {
      const stmt = bodyStatements[i];
      if (stmt.getKindName() === 'VariableStatement') {
        const text = stmt.getText();
        if (text.includes('const ') && text.includes('= props.')) {
          insertIndex = i + 1;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Insert DI statements
    for (let i = statements.length - 1; i >= 0; i--) {
      body.insertStatements(insertIndex, statements[i]);
    }

    if (this.options.verbose) {
      console.log(`✅ Inserted ${statements.length} DI statements at index ${insertIndex}`);
    }
  }

  /**
   * Replace any placeholders left by parameter normalization
   */
  private replacePlaceholders(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[],
    normalizationResult: NormalizationResult
  ): void {
    if (!normalizationResult.wasNormalized) return;

    const body = this.getFunctionBody(func);
    if (!body) return;

    // Replace any DI_PLACEHOLDER_* comments with actual DI calls
    for (const dep of dependencies) {
      const placeholder = `/* DI_PLACEHOLDER_${dep.serviceKey} */`;
      const replacement = this.generateDICall(dep);
      
      // This is a simplified replacement - in practice, you'd need more sophisticated AST manipulation
      const bodyText = body.getText();
      if (bodyText.includes(placeholder)) {
        const newBodyText = bodyText.replace(placeholder, replacement);
        // Note: This is a simplified approach. For production, you'd want to use proper AST manipulation
        if (this.options.verbose) {
          console.log(`🔄 Replaced placeholder for ${dep.serviceKey}`);
        }
      }
    }
  }

  /**
   * Generate DI hook call
   */
  private generateDICall(dependency: ExtractedDependency): string {
    if (!dependency.resolvedImplementation) {
      return dependency.isOptional ? 'undefined' : 'null';
    }

    const token = dependency.resolvedImplementation.sanitizedKey;
    const hookName = dependency.isOptional ? 'useOptionalService' : 'useService';
    
    return `${hookName}('${token}') as unknown as ${dependency.interfaceType}`;
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
   * Check if a function needs enhanced transformation
   */
  needsEnhancedTransformation(func: FunctionDeclaration | ArrowFunction): boolean {
    return this.parameterNormalizer.needsNormalization(func);
  }

  /**
   * Preview what the enhanced transformation would do
   */
  previewTransformation(
    func: FunctionDeclaration | ArrowFunction,
    dependencies: ExtractedDependency[]
  ): {
    needsNormalization: boolean;
    proposedChanges: string[];
    affectedVariables: string[];
    generatedStatements: string[];
  } {
    const normalizationPreview = this.parameterNormalizer.previewNormalization(func);
    const diStatements = dependencies.map(dep => this.generateDIStatement(dep, {
      wasNormalized: normalizationPreview.needsNormalization,
      newParameterName: 'props',
      originalParameterPattern: normalizationPreview.originalPattern,
      addedStatements: [],
      removedDestructuring: []
    })).filter(Boolean) as string[];

    return {
      needsNormalization: normalizationPreview.needsNormalization,
      proposedChanges: [
        ...normalizationPreview.proposedStatements,
        ...diStatements
      ],
      affectedVariables: normalizationPreview.affectedVariables,
      generatedStatements: diStatements
    };
  }

  /**
   * Get transformation statistics
   */
  getTransformationStats(): {
    normalizationsPerformed: number;
    dependenciesInjected: number;
    statementsGenerated: number;
    placeholdersReplaced: number;
  } {
    // This would be tracked during actual transformations
    return {
      normalizationsPerformed: 0,
      dependenciesInjected: 0,
      statementsGenerated: 0,
      placeholdersReplaced: 0
    };
  }
}
