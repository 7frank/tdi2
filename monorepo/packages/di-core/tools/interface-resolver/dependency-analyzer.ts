// tools/dependency-analyzer.ts - Handles analysis of service dependencies

import {
  ClassDeclaration,
  SourceFile,
  Node,
} from "ts-morph";
import { ServiceDependency, ConstructorParam } from "./interface-resolver-types";
import { KeySanitizer } from "./key-sanitizer";
import { EnhancedServiceValidator } from "./enhanced-service-validator";

import { consoleFor } from '../logger';

const console = consoleFor('di-core:shared-type-resolver');



export class DependencyAnalyzer {
  constructor(
    private keySanitizer: KeySanitizer
  ) {}

  async processClassForDependencies(
    classDecl: ClassDeclaration,
    sourceFile: SourceFile,
    dependencies: Map<string, ServiceDependency>,
    serviceValidator: EnhancedServiceValidator
  ): Promise<void> {
    const className = classDecl.getName();
    if (!className) return;

    try {
      // Check if class has any DI decorator
      const hasServiceDecorator = serviceValidator.hasServiceDecorator(classDecl);
      if (!hasServiceDecorator) return;

      const constructors = classDecl.getConstructors();
      if (constructors.length === 0) return;

      const constructor = constructors[0];
      const parameters = constructor.getParameters();

      const constructorParams: ConstructorParam[] = [];
      const interfaceDependencies: string[] = [];

      for (const param of parameters) {
        try {
          // Check if parameter has any inject decorator
          const hasInjectDecorator = serviceValidator.hasInjectDecorator(param);
          if (!hasInjectDecorator) continue;

          const paramType = param.getTypeNode()?.getText();
          if (!paramType) continue;

          const sanitizedKey = this.keySanitizer.sanitizeKey(paramType);
          const paramName = param.getName();
          const isOptional = param.hasQuestionToken();

          constructorParams.push({
            paramName,
            interfaceType: paramType,
            isOptional,
            sanitizedKey,
          });

          interfaceDependencies.push(sanitizedKey);

          console.log(
            `🔗 ${className} depends on ${paramType} (key: ${sanitizedKey})`
          );
        } catch (error) {
          // Skip malformed parameters
          console.warn(
            `⚠️  Failed to process parameter in ${className}:`,
            error
          );
        }
      }

      if (constructorParams.length > 0) {
        dependencies.set(className, {
          serviceClass: className,
          interfaceDependencies,
          filePath: sourceFile.getFilePath(),
          constructorParams,
        });
      }
    } catch (error) {
      // Handle malformed class gracefully
      console.warn(
        `⚠️  Failed to process dependencies for ${className}:`,
        error
      );
    }
  }

  /**
   * Extract dependency information from a single parameter
   */
  extractParameterDependency(param: any): ConstructorParam | null {
    try {
      const paramType = param.getTypeNode()?.getText();
      if (!paramType) return null;

      const sanitizedKey = this.keySanitizer.sanitizeKey(paramType);
      const paramName = param.getName();
      const isOptional = param.hasQuestionToken();

      return {
        paramName,
        interfaceType: paramType,
        isOptional,
        sanitizedKey,
      };
    } catch (error) {
      console.warn('⚠️  Failed to extract parameter dependency:', error);
      return null;
    }
  }

  /**
   * Check if a parameter type is a valid dependency
   */
  isValidDependencyType(paramType: string): boolean {
    // Skip primitive types
    const primitiveTypes = ['string', 'number', 'boolean', 'any', 'unknown', 'void'];
    if (primitiveTypes.includes(paramType.toLowerCase())) {
      return false;
    }

    // Skip built-in objects
    const builtInTypes = ['Date', 'RegExp', 'Error', 'Array', 'Object', 'Function'];
    if (builtInTypes.includes(paramType)) {
      return false;
    }

    // Skip array of primitives
    if (primitiveTypes.some(primitive => paramType === `${primitive}[]`)) {
      return false;
    }

    return true;
  }

  /**
   * Extract dependency metadata (optional, qualifier, etc.)
   */
  extractDependencyMetadata(param: any): {
    isOptional: boolean;
    qualifier?: string;
    isArray: boolean;
  } {
    const isOptional = param.hasQuestionToken();
    const paramType = param.getTypeNode()?.getText() || '';
    const isArray = paramType.endsWith('[]') || paramType.includes('Array<');

    // Extract qualifier from decorators if present
    let qualifier: string | undefined;
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
                qualifier = qualifierArg.getLiteralValue();
              }
            }
          }
        }
      } catch (error) {
        // Ignore malformed decorators
      }
    }

    return {
      isOptional,
      qualifier,
      isArray
    };
  }

  /**
   * Resolve circular dependencies in dependency chain
   */
  findCircularDependencies(dependencies: Map<string, ServiceDependency>): string[] {
    const circular: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string, path: string[] = []): boolean => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart >= 0) {
          const cycle = path.slice(cycleStart).concat([node]);
          circular.push(cycle.join(" -> "));
        }
        return true;
      }

      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const dependency = dependencies.get(node);
      if (dependency) {
        for (const depKey of dependency.interfaceDependencies) {
          // Note: This is simplified - in real implementation, 
          // we'd need to resolve depKey to actual service class
          if (hasCycle(depKey, [...path, node])) {
            recursionStack.delete(node);
            return true;
          }
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const serviceClass of dependencies.keys()) {
      if (!visited.has(serviceClass)) {
        hasCycle(serviceClass);
      }
    }

    return circular;
  }

  /**
   * Get dependency statistics
   */
  getDependencyStats(dependencies: Map<string, ServiceDependency>): {
    totalServices: number;
    servicesWithDependencies: number;
    totalDependencies: number;
    averageDependenciesPerService: number;
    optionalDependencies: number;
    requiredDependencies: number;
  } {
    const totalServices = dependencies.size;
    const servicesWithDependencies = dependencies.size;
    
    let totalDependencies = 0;
    let optionalDependencies = 0;
    let requiredDependencies = 0;

    for (const [, dependency] of dependencies) {
      totalDependencies += dependency.constructorParams.length;
      
      for (const param of dependency.constructorParams) {
        if (param.isOptional) {
          optionalDependencies++;
        } else {
          requiredDependencies++;
        }
      }
    }

    const averageDependenciesPerService = totalServices > 0 ? totalDependencies / totalServices : 0;

    return {
      totalServices,
      servicesWithDependencies,
      totalDependencies,
      averageDependenciesPerService,
      optionalDependencies,
      requiredDependencies
    };
  }

  /**
   * Find services with no dependencies (leaf services)
   */
  findLeafServices(dependencies: Map<string, ServiceDependency>): string[] {
    const leafServices: string[] = [];
    
    for (const [serviceClass, dependency] of dependencies) {
      if (dependency.constructorParams.length === 0) {
        leafServices.push(serviceClass);
      }
    }
    
    return leafServices;
  }

  /**
   * Find services with the most dependencies
   */
  findServicesWithMostDependencies(
    dependencies: Map<string, ServiceDependency>, 
    limit: number = 5
  ): Array<{serviceClass: string; dependencyCount: number}> {
    const serviceDependencyCounts: Array<{serviceClass: string; dependencyCount: number}> = [];
    
    for (const [serviceClass, dependency] of dependencies) {
      serviceDependencyCounts.push({
        serviceClass,
        dependencyCount: dependency.constructorParams.length
      });
    }
    
    return serviceDependencyCounts
      .sort((a, b) => b.dependencyCount - a.dependencyCount)
      .slice(0, limit);
  }
}