// tools/shared/SharedDependencyExtractor.ts

import {
  ClassDeclaration,
  FunctionDeclaration,
  ArrowFunction,
  ParameterDeclaration,
  TypeNode,
  Node,
  SourceFile
} from 'ts-morph';
import type { SharedTypeResolver, TypeResolutionRequest } from './SharedTypeResolver';
import type { 
  InterfaceImplementation,
  InterfaceResolverInterface
} from '../interface-resolver/interface-resolver-types';

export interface ExtractedDependency {
  serviceKey: string;           // Parameter/property name
  interfaceType: string;        // Original interface type string
  sanitizedKey: string;         // Sanitized key for DI lookup
  isOptional: boolean;
  resolvedImplementation?: InterfaceImplementation;
  extractionSource: 'decorator' | 'marker-type' | 'parameter-type';
  sourceLocation: string;       // For debugging
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

export class SharedDependencyExtractor {
  constructor(
    private typeResolver: SharedTypeResolver,
    private options: { verbose?: boolean } = {}
  ) {}

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
   * Extract dependencies from Inject<T> marker types in function parameters
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

    // Handle inline type literal: props: { services: { api: Inject<ApiInterface> } }
    if (Node.isTypeLiteral(typeNode)) {
      const serviceDeps = this.extractFromServicesTypeLiteral(typeNode, sourceFile, context);
      dependencies.push(...serviceDeps);
    }

    // Handle type reference: props: ComponentProps (where ComponentProps has services property)
    if (Node.isTypeReference(typeNode)) {
      const serviceDeps = this.extractFromTypeReference(typeNode, sourceFile, context);
      dependencies.push(...serviceDeps);
    }

    return dependencies;
  }

  /**
   * Extract from services property in type literal
   */
  private extractFromServicesTypeLiteral(
    typeNode: TypeNode,
    sourceFile: SourceFile,
    context: string
  ): ExtractedDependency[] {
    const dependencies: ExtractedDependency[] = [];
    
    if (!Node.isTypeLiteral(typeNode)) return dependencies;

    const members = typeNode.getMembers();
    const servicesProperty = members.find(member => 
      Node.isPropertySignature(member) && member.getName() === 'services'
    );

    if (!servicesProperty || !Node.isPropertySignature(servicesProperty)) {
      return dependencies;
    }

    const serviceTypeNode = servicesProperty.getTypeNode();
    if (!serviceTypeNode || !Node.isTypeLiteral(serviceTypeNode)) {
      return dependencies;
    }

    // Extract each service dependency
    const serviceMembers = serviceTypeNode.getMembers();
    for (const serviceMember of serviceMembers) {
      if (Node.isPropertySignature(serviceMember)) {
        const dependency = this.extractServiceDependency(serviceMember, sourceFile, context);
        if (dependency) {
          dependencies.push(dependency);
        }
      }
    }

    return dependencies;
  }

  /**
   * Extract service dependency from property signature
   */
  private extractServiceDependency(
    propertySignature: any,
    sourceFile: SourceFile,
    context: string
  ): ExtractedDependency | null {
    const propName = propertySignature.getName();
    const propTypeNode = propertySignature.getTypeNode();
    if (!propTypeNode) return null;

    const typeText = propTypeNode.getText();
    
    // Check for Inject<T> or InjectOptional<T> markers
    const injectMatch = typeText.match(/^Inject<(.+)>$/);
    const optionalMatch = typeText.match(/^InjectOptional<(.+)>$/);
    
    let interfaceType: string;
    let isOptional: boolean;

    if (injectMatch) {
      interfaceType = injectMatch[1];
      isOptional = false;
    } else if (optionalMatch) {
      interfaceType = optionalMatch[1];
      isOptional = true;
    } else {
      // Not a DI marker type
      return null;
    }

    // Resolve the interface type
    const resolutionRequest: TypeResolutionRequest = {
      interfaceType,
      context: context === 'function-parameter' ? 'function-parameter' : 'function-parameter',
      isOptional,
      sourceLocation: `${sourceFile.getBaseName()}:${propertySignature.getStartLineNumber()}`,
      sourceFile: sourceFile.getFilePath()
    };

    const resolution = this.typeResolver.resolveType(resolutionRequest);

    return {
      serviceKey: propName,
      interfaceType,
      sanitizedKey: resolution.sanitizedKey,
      isOptional,
      resolvedImplementation: resolution.implementation,
      extractionSource: 'marker-type',
      sourceLocation: resolutionRequest.sourceLocation,
      metadata: {
        propertyName: propName
      }
    };
  }

  /**
   * Extract from type reference (external interface)
   */
  private extractFromTypeReference(
    typeNode: TypeNode,
    sourceFile: SourceFile,
    context: string
  ): ExtractedDependency[] {
    // TODO: Implement type reference resolution
    // This would involve finding the interface/type alias definition
    // and extracting services property from it
    if (this.options.verbose) {
      console.log(`🔍 Type reference extraction not yet implemented: ${typeNode.getText()}`);
    }
    return [];
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