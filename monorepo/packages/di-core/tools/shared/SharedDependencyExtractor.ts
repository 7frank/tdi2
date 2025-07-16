// tools/shared/SharedDependencyExtractor.ts

import {
  ClassDeclaration,
  FunctionDeclaration,
  ArrowFunction,
  ParameterDeclaration,
  TypeNode,
  Node,
  SourceFile,
  InterfaceDeclaration,
  TypeAliasDeclaration
} from 'ts-morph';
import type { SharedTypeResolver, TypeResolutionRequest } from './SharedTypeResolver';
import type { 
  InterfaceImplementation,
  InterfaceResolverInterface
} from '../interface-resolver/interface-resolver-types';
import { RecursiveInjectExtractor, ExtractedInjectMarker } from './RecursiveInjectExtractor';
import * as path from 'path';

export interface ExtractedDependency {
  serviceKey: string;           // Parameter/property name
  interfaceType: string;        // Original interface type string
  sanitizedKey: string;         // Sanitized key for DI lookup
  isOptional: boolean;
  resolvedImplementation?: InterfaceImplementation;
  extractionSource: 'decorator' | 'marker-type' | 'parameter-type';
  sourceLocation: string;       // For debugging
  propertyPath?: string[];      // Path to nested property (e.g., ['services', 'api'])
  metadata?: {
    parameterIndex?: number;
    propertyName?: string;
    hasQualifier?: boolean;
    qualifier?: string;
  };
}

export interface DependencyExtractionContext {
  sourceFile: SourceFile;
  targetType: 'class-constructor' | 'function-parameter' | 'arrow-function-parameter';
  node: ClassDeclaration | FunctionDeclaration | ArrowFunction;
  verbose?: boolean;
}

export interface SharedDependencyExtractorOptions {
  verbose?: boolean;
  srcDir?: string;
}

export class SharedDependencyExtractor {
  private recursiveExtractor: RecursiveInjectExtractor;

  constructor(
    private typeResolver: SharedTypeResolver,
    private options: SharedDependencyExtractorOptions = {}
  ) {
    this.recursiveExtractor = new RecursiveInjectExtractor({
      verbose: this.options.verbose,
      srcDir: this.options.srcDir
    });
  }

  /**
   * Extract dependencies from class constructor with @Inject decorators
   */
  extractFromClassConstructor(
    classDecl: ClassDeclaration,
    sourceFile: SourceFile
  ): ExtractedDependency[] {
    const dependencies: ExtractedDependency[] = [];
    const constructors = classDecl.getConstructors();
    
    if (constructors.length === 0) {
      return dependencies;
    }

    const constructor = constructors[0];
    const parameters = constructor.getParameters();

    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];
      const dependency = this.extractFromConstructorParameter(param, i, sourceFile);
      if (dependency) {
        dependencies.push(dependency);
      }
    }

    if (this.options.verbose && dependencies.length > 0) {
      console.log(`🔍 Found ${dependencies.length} constructor dependencies in ${classDecl.getName()}`);
    }

    return dependencies;
  }

  /**
   * Extract dependencies from function parameter with Inject<T> markers
   */
  extractFromFunctionParameter(
    func: FunctionDeclaration,
    sourceFile: SourceFile
  ): ExtractedDependency[] {
    const parameters = func.getParameters();
    if (parameters.length === 0) return [];

    const firstParam = parameters[0];
    return this.extractFromTypeMarkers(firstParam, sourceFile, 'function-parameter');
  }

  /**
   * Extract dependencies from arrow function parameter with Inject<T> markers
   */
  extractFromArrowFunction(
    arrowFunc: ArrowFunction,
    sourceFile: SourceFile
  ): ExtractedDependency[] {
    const parameters = arrowFunc.getParameters();
    if (parameters.length === 0) return [];

    const firstParam = parameters[0];
    return this.extractFromTypeMarkers(firstParam, sourceFile, 'arrow-function-parameter');
  }

  /**
   * Extract from constructor parameter with @Inject decorator
   */
  private extractFromConstructorParameter(
    param: ParameterDeclaration,
    parameterIndex: number,
    sourceFile: SourceFile
  ): ExtractedDependency | null {
    // Check if parameter has @Inject decorator
    const hasInjectDecorator = this.hasInjectDecorator(param);
    if (!hasInjectDecorator) {
      return null;
    }

    const paramName = param.getName();
    const paramType = param.getTypeNode()?.getText();
    if (!paramType) {
      if (this.options.verbose) {
        console.warn(`⚠️  Parameter ${paramName} missing type annotation`);
      }
      return null;
    }

    const isOptional = param.hasQuestionToken();
    const qualifier = this.extractQualifier(param);

    // Resolve the type
    const resolutionRequest: TypeResolutionRequest = {
      interfaceType: paramType,
      context: 'class-constructor',
      isOptional,
      sourceLocation: `${sourceFile.getBaseName()}:${param.getStartLineNumber()}`,
      sourceFile: sourceFile.getFilePath()
    };

    const resolution = this.typeResolver.resolveType(resolutionRequest);

    return {
      serviceKey: paramName,
      interfaceType: paramType,
      sanitizedKey: resolution.sanitizedKey,
      isOptional,
      resolvedImplementation: resolution.implementation,
      extractionSource: 'decorator',
      sourceLocation: resolutionRequest.sourceLocation,
      metadata: {
        parameterIndex,
        hasQualifier: !!qualifier,
        qualifier
      }
    };
  }

  /**
   * Extract dependencies from Inject<T> marker types in function parameters using recursive extraction
   */
  private extractFromTypeMarkers(
    param: ParameterDeclaration,
    sourceFile: SourceFile,
    context: 'function-parameter' | 'arrow-function-parameter'
  ): ExtractedDependency[] {
    const dependencies: ExtractedDependency[] = [];
    const typeNode = param.getTypeNode();
    
    if (!typeNode) {
      return dependencies;
    }

    if (this.options.verbose) {
      console.log(`🔍 Analyzing parameter type: ${typeNode.getKindName()}`);
    }

    // Use recursive extraction to find all Inject markers in the type structure
    const injectMarkers = this.recursiveExtractor.extractFromTypeNode(typeNode, sourceFile);
    
    if (this.options.verbose && injectMarkers.length > 0) {
      console.log(`🎯 Found ${injectMarkers.length} inject markers in parameter type`);
      injectMarkers.forEach(marker => {
        console.log(`  - ${marker.propertyPath.join('.')} -> ${marker.interfaceType} (${marker.isOptional ? 'optional' : 'required'})`);
      });
    }

    // Convert inject markers to extracted dependencies
    for (const marker of injectMarkers) {
      const dependency = this.convertInjectMarkerToDependency(marker, sourceFile, context);
      if (dependency) {
        dependencies.push(dependency);
      }
    }

    return dependencies;
  }

  /**
   * Convert an inject marker to an extracted dependency with proper property path handling
   */
  private convertInjectMarkerToDependency(
    marker: ExtractedInjectMarker,
    sourceFile: SourceFile,
    context: string
  ): ExtractedDependency | null {
    // Resolve the interface type
    const resolutionRequest: TypeResolutionRequest = {
      interfaceType: marker.interfaceType,
      context: context as any,
      isOptional: marker.isOptional,
      sourceLocation: marker.sourceLocation,
      sourceFile: sourceFile.getFilePath()
    };

    const resolution = this.typeResolver.resolveType(resolutionRequest);

    if (this.options.verbose) {
      console.log(`🔗 Converting marker: ${marker.propertyPath.join('.')} -> ${marker.interfaceType} (${marker.isOptional ? 'optional' : 'required'})`);
    }

    return {
      serviceKey: marker.serviceKey,
      interfaceType: marker.interfaceType,
      sanitizedKey: resolution.sanitizedKey,
      isOptional: marker.isOptional,
      resolvedImplementation: resolution.implementation,
      extractionSource: 'marker-type',
      sourceLocation: marker.sourceLocation,
      propertyPath: marker.propertyPath,
      metadata: {
        propertyName: marker.serviceKey
      }
    };
  }

  /**
   * Extract from type reference (external interface) using recursive extraction
   */
  private extractFromTypeReference(
    typeNode: TypeNode,
    sourceFile: SourceFile,
    context: string
  ): ExtractedDependency[] {
    if (!Node.isTypeReference(typeNode)) return [];

    const typeName = typeNode.getTypeName().getText();
    
    if (this.options.verbose) {
      console.log(`🔍 Resolving type reference: ${typeName}`);
    }

    // Use recursive extractor to find and extract all inject markers
    const injectMarkers = this.recursiveExtractor.extractFromTypeNode(typeNode, sourceFile);
    
    if (this.options.verbose) {
      console.log(`🎯 Found ${injectMarkers.length} inject markers in type reference ${typeName}`);
    }

    // Convert inject markers to extracted dependencies
    const dependencies: ExtractedDependency[] = [];
    for (const marker of injectMarkers) {
      const dependency = this.convertInjectMarkerToDependency(marker, sourceFile, context);
      if (dependency) {
        dependencies.push(dependency);
      }
    }

    return dependencies;
  }

  /**
   * Extract from interface declaration using recursive extraction
   */
  private extractFromInterfaceDeclaration(
    interfaceDecl: InterfaceDeclaration, 
    sourceFile: SourceFile, 
    context: string
  ): ExtractedDependency[] {
    if (this.options.verbose) {
      console.log(`✅ Recursively extracting dependencies from interface ${interfaceDecl.getName()}`);
    }

    // Use recursive extractor to find all inject markers
    const injectMarkers = this.recursiveExtractor.extractFromInterfaceDeclaration(interfaceDecl, sourceFile);
    
    if (this.options.verbose) {
      console.log(`🎯 Found ${injectMarkers.length} inject markers in interface ${interfaceDecl.getName()}`);
    }

    // Convert inject markers to extracted dependencies
    const dependencies: ExtractedDependency[] = [];
    for (const marker of injectMarkers) {
      const dependency = this.convertInjectMarkerToDependency(marker, sourceFile, context);
      if (dependency) {
        dependencies.push(dependency);
      }
    }

    return dependencies;
  }

  /**
   * Extract from type alias declaration using recursive extraction
   */
  private extractFromTypeAliasDeclaration(
    typeAlias: TypeAliasDeclaration, 
    sourceFile: SourceFile, 
    context: string
  ): ExtractedDependency[] {
    if (this.options.verbose) {
      console.log(`✅ Recursively extracting dependencies from type alias ${typeAlias.getName()}`);
    }

    // Use recursive extractor to find all inject markers
    const injectMarkers = this.recursiveExtractor.extractFromTypeAliasDeclaration(typeAlias, sourceFile);
    
    if (this.options.verbose) {
      console.log(`🎯 Found ${injectMarkers.length} inject markers in type alias ${typeAlias.getName()}`);
    }

    // Convert inject markers to extracted dependencies
    const dependencies: ExtractedDependency[] = [];
    for (const marker of injectMarkers) {
      const dependency = this.convertInjectMarkerToDependency(marker, sourceFile, context);
      if (dependency) {
        dependencies.push(dependency);
      }
    }

    return dependencies;
  }

/**
   * Check if parameter has @Inject decorator
   */
  private hasInjectDecorator(param: ParameterDeclaration): boolean {
    return param.getDecorators().some(decorator => {
      try {
        const expression = decorator.getExpression();
        if (Node.isCallExpression(expression)) {
          const expressionText = expression.getExpression().getText();
          return this.isInjectDecoratorName(expressionText);
        } else if (Node.isIdentifier(expression)) {
          const expressionText = expression.getText();
          return this.isInjectDecoratorName(expressionText);
        }
      } catch (error) {
        // Ignore malformed decorators
      }
      return false;
    });
  }

  /**
   * Check if decorator name indicates injection
   */
  private isInjectDecoratorName(decoratorName: string): boolean {
    const injectDecorators = [
      'Inject',
      'AutoWireInject', 
      'Autowired',
      'Dependency',
      'Resource',
      'Value'
    ];
    
    return injectDecorators.some(name => 
      decoratorName === name || decoratorName.includes(name)
    );
  }

  /**
   * Extract qualifier from parameter decorators
   */
  private extractQualifier(param: ParameterDeclaration): string | undefined {
    const decorators = param.getDecorators();
    
    for (const decorator of decorators) {
      try {
        const expression = decorator.getExpression();
        if (Node.isCallExpression(expression)) {
          const decoratorName = expression.getExpression().getText();
          if (decoratorName === 'Qualifier') {
            const args = expression.getArguments();
            if (args.length > 0) {
              const qualifierArg = args[0];
              if (Node.isStringLiteral(qualifierArg)) {
                return qualifierArg.getLiteralValue();
              }
            }
          }
        }
      } catch (error) {
        // Ignore malformed decorators
      }
    }
    
    return undefined;
  }

  /**
   * Validate extracted dependencies
   */
  validateDependencies(dependencies: ExtractedDependency[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const dep of dependencies) {
      // Check for missing required implementations
      if (!dep.resolvedImplementation && !dep.isOptional) {
        errors.push(`Required dependency '${dep.serviceKey}' (${dep.interfaceType}) has no implementation`);
      }

      // Check for missing optional implementations
      if (!dep.resolvedImplementation && dep.isOptional) {
        warnings.push(`Optional dependency '${dep.serviceKey}' (${dep.interfaceType}) has no implementation`);
      }

      // Check for duplicate service keys
      const duplicates = dependencies.filter(d => d.serviceKey === dep.serviceKey);
      if (duplicates.length > 1) {
        errors.push(`Duplicate service key '${dep.serviceKey}' found`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Group dependencies by resolution strategy
   */
  groupByResolutionStrategy(dependencies: ExtractedDependency[]): {
    interface: ExtractedDependency[];
    inheritance: ExtractedDependency[];
    state: ExtractedDependency[];
    class: ExtractedDependency[];
    notFound: ExtractedDependency[];
  } {
    const groups = {
      interface: [],
      inheritance: [],
      state: [],
      class: [],
      notFound: []
    } as any;

    for (const dep of dependencies) {
      if (!dep.resolvedImplementation) {
        groups.notFound.push(dep);
      } else if (dep.resolvedImplementation.isStateBased) {
        groups.state.push(dep);
      } else if (dep.resolvedImplementation.isInheritanceBased) {
        groups.inheritance.push(dep);
      } else if (dep.resolvedImplementation.isClassBased) {
        groups.class.push(dep);
      } else {
        groups.interface.push(dep);
      }
    }

    return groups;
  }

  /**
   * Get dependency statistics
   */
  getDependencyStats(dependencies: ExtractedDependency[]): {
    total: number;
    resolved: number;
    optional: number;
    missing: number;
    bySource: Record<string, number>;
  } {
    const stats = {
      total: dependencies.length,
      resolved: 0,
      optional: 0,
      missing: 0,
      bySource: {} as Record<string, number>
    };

    for (const dep of dependencies) {
      if (dep.resolvedImplementation) stats.resolved++;
      if (dep.isOptional) stats.optional++;
      if (!dep.resolvedImplementation) stats.missing++;
      
      stats.bySource[dep.extractionSource] = (stats.bySource[dep.extractionSource] || 0) + 1;
    }

    return stats;
  }
}