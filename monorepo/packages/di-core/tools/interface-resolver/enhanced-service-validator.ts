// tools/interface-resolver/enhanced-service-validator.ts - AST-driven decorator validation

import {
  ClassDeclaration,
  ParameterDeclaration,
  Node,
  SourceFile,
  ImportDeclaration
} from "ts-morph";
import { ServiceDependency, InterfaceImplementation, ValidationResult } from "./interface-resolver-types";
import type { DISourceConfiguration } from "./enhanced-interface-extractor";

export class EnhancedServiceValidator {
  private sourceConfig: DISourceConfiguration;
  private validationCache = new Map<string, boolean>();

  constructor(
    private verbose: boolean = false,
    sourceConfig?: Partial<DISourceConfiguration>
  ) {
    this.sourceConfig = {
      decoratorSources: [
        "@tdi2/di-core/decorators",
        "@tdi2/di-core",
        "./decorators",
        "../decorators"
      ],
      markerSources: [
        "@tdi2/di-core/markers", 
        "@tdi2/di-core",
        "./markers",
        "../markers"
      ],
      validateSources: true,
      ...sourceConfig
    };
  }

  /**
   * Check if a class has a valid service decorator with source validation
   */
  hasServiceDecorator(classDecl: ClassDeclaration): boolean {
    const sourceFile = classDecl.getSourceFile();
    const decorators = classDecl.getDecorators();

    for (const decorator of decorators) {
      try {
        const decoratorName = this.getDecoratorName(decorator);
        if (!decoratorName) continue;

        // Check if it's a service decorator
        if (this.isServiceDecoratorName(decoratorName)) {
          // Validate source if required
          if (this.sourceConfig.validateSources) {
            if (this.validateDecoratorSource(decoratorName, sourceFile)) {
              if (this.verbose) {
                console.log(`✅ Valid service decorator: @${decoratorName} in ${classDecl.getName()}`);
              }
              return true;
            } else {
              if (this.verbose) {
                console.warn(`⚠️  Invalid source for @${decoratorName} in ${classDecl.getName()}`);
              }
            }
          } else {
            return true; // Source validation disabled
          }
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`⚠️  Error processing decorator in ${classDecl.getName()}:`, error);
        }
      }
    }

    return false;
  }

  /**
   * Check if a parameter has a valid inject decorator with source validation
   */
  hasInjectDecorator(param: ParameterDeclaration): boolean {
    const sourceFile = param.getSourceFile();
    const decorators = param.getDecorators();

    for (const decorator of decorators) {
      try {
        const decoratorName = this.getDecoratorName(decorator);
        if (!decoratorName) continue;

        // Check if it's an inject decorator
        if (this.isInjectDecoratorName(decoratorName)) {
          // Validate source if required
          if (this.sourceConfig.validateSources) {
            if (this.validateDecoratorSource(decoratorName, sourceFile)) {
              if (this.verbose) {
                console.log(`✅ Valid inject decorator: @${decoratorName} on parameter ${param.getName()}`);
              }
              return true;
            } else {
              if (this.verbose) {
                console.warn(`⚠️  Invalid source for @${decoratorName} on parameter ${param.getName()}`);
              }
            }
          } else {
            return true; // Source validation disabled
          }
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`⚠️  Error processing parameter decorator:`, error);
        }
      }
    }

    return false;
  }

  /**
   * Validate that a marker type comes from a valid DI source
   */
  validateMarkerTypeSource(markerType: string, sourceFile: SourceFile): boolean {
    if (!this.sourceConfig.validateSources) {
      return true;
    }

    try {
      // Extract marker name (Inject, InjectOptional)
      const markerMatch = markerType.match(/^(InjectOptional?)<.+>$/);
      if (!markerMatch) return false;
      
      const markerName = markerMatch[1];
      
      // Check cache
      const cacheKey = `${sourceFile.getFilePath()}:${markerName}:marker`;
      if (this.validationCache.has(cacheKey)) {
        return this.validationCache.get(cacheKey)!;
      }

      // Find import declaration
      const imports = sourceFile.getImportDeclarations();
      const isValid = this.isMarkerFromValidSource(markerName, imports);
      
      this.validationCache.set(cacheKey, isValid);
      
      if (this.verbose && !isValid) {
        console.warn(`⚠️  Marker ${markerName} not from valid source in ${sourceFile.getBaseName()}`);
      }
      
      return isValid;
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️  Failed to validate marker source:`, error);
      }
      return false;
    }
  }

  /**
   * Get decorator name from decorator node using AST
   */
  private getDecoratorName(decorator: any): string | null {
    try {
      const expression = decorator.getExpression();
      
      if (Node.isCallExpression(expression)) {
        // @Service() or @Inject('token')
        const expr = expression.getExpression();
        return Node.isIdentifier(expr) ? expr.getText() : null;
      } else if (Node.isIdentifier(expression)) {
        // @Service or @Inject
        return expression.getText();
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate decorator source using import analysis
   */
  private validateDecoratorSource(decoratorName: string, sourceFile: SourceFile): boolean {
    const cacheKey = `${sourceFile.getFilePath()}:${decoratorName}:decorator`;
    
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    const imports = sourceFile.getImportDeclarations();
    const isValid = this.isDecoratorFromValidSource(decoratorName, imports);
    
    this.validationCache.set(cacheKey, isValid);
    return isValid;
  }

  /**
   * Check if decorator is imported from valid source
   */
  private isDecoratorFromValidSource(
    decoratorName: string, 
    imports: ImportDeclaration[]
  ): boolean {
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Check if import is from valid decorator source
      if (!this.sourceConfig.decoratorSources.some(source => 
        this.moduleMatchesSource(moduleSpecifier, source)
      )) {
        continue;
      }

      // Check if decorator is in named imports
      const namedImports = importDecl.getNamedImports();
      if (namedImports.some(ni => ni.getName() === decoratorName)) {
        return true;
      }

      // Check default import
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport && defaultImport.getText() === decoratorName) {
        return true;
      }

      // Check namespace import (e.g., import * as DI from "@tdi2/di-core")
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        return true; // Assume valid if imported via namespace
      }
    }

    return false;
  }

  /**
   * Check if marker is imported from valid source
   */
  private isMarkerFromValidSource(
    markerName: string, 
    imports: ImportDeclaration[]
  ): boolean {
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Check if import is from valid marker source
      if (!this.sourceConfig.markerSources.some(source => 
        this.moduleMatchesSource(moduleSpecifier, source)
      )) {
        continue;
      }

      // Check if marker is in named imports
      const namedImports = importDecl.getNamedImports();
      if (namedImports.some(ni => ni.getName() === markerName)) {
        return true;
      }

      // Check if it's a type-only import
      if (importDecl.isTypeOnly()) {
        const typeImports = importDecl.getNamedImports();
        if (typeImports.some(ni => ni.getName() === markerName)) {
          return true;
        }
      }

      // Check namespace import for type markers
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if module specifier matches a source pattern
   */
  private moduleMatchesSource(moduleSpecifier: string, source: string): boolean {
    // Exact match
    if (moduleSpecifier === source) {
      return true;
    }

    // Starts with source (for sub-paths)
    if (moduleSpecifier.startsWith(source + '/')) {
      return true;
    }

    // Relative path matches
    if (source.startsWith('./') || source.startsWith('../')) {
      return moduleSpecifier === source;
    }

    return false;
  }

  /**
   * Check if decorator name indicates a service decorator
   */
  private isServiceDecoratorName(decoratorName: string): boolean {
    const serviceDecorators = [
      'Service',
      'AutoWireService', 
      'Component',
      'Injectable',
      'Repository',
      'Controller',
      'Provider',
      'Singleton',
      'Scoped',
      'Transient'
    ];
    
    return serviceDecorators.some(name => 
      decoratorName === name || decoratorName.includes(name)
    );
  }

  /**
   * Check if decorator name indicates an inject decorator
   */
  private isInjectDecoratorName(decoratorName: string): boolean {
    const injectDecorators = [
      'Inject',
      'AutoWireInject',
      'Autowired',
      'Dependency',
      'Resource',
      'Value',
      'Qualifier'
    ];
    
    return injectDecorators.some(name => 
      decoratorName === name || decoratorName.includes(name)
    );
  }

  /**
   * Validate all dependencies with enhanced checks
   */
  validateDependencies(
    dependencies: Map<string, ServiceDependency>,
    interfaces: Map<string, InterfaceImplementation>
  ): ValidationResult {
    const missing: string[] = [];
    const circular: string[] = [];

    // Check for missing implementations
    for (const [serviceClass, dependency] of dependencies) {
      for (const depKey of dependency.interfaceDependencies) {
        let found = false;
        for (const [key, implementation] of interfaces) {
          if (implementation.sanitizedKey === depKey) {
            found = true;
            break;
          }
        }
        if (!found) {
          missing.push(`${serviceClass} -> ${depKey}`);
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies(dependencies, interfaces);
    circular.push(...circularDeps);

    return {
      isValid: missing.length === 0 && circular.length === 0,
      missingImplementations: missing,
      circularDependencies: circular,
    };
  }

  /**
   * Find circular dependencies with enhanced detection
   */
  private findCircularDependencies(
    dependencies: Map<string, ServiceDependency>,
    interfaces: Map<string, InterfaceImplementation>
  ): string[] {
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
          // Find implementation for this dependency
          for (const [key, implementation] of interfaces) {
            if (implementation.sanitizedKey === depKey) {
              if (
                hasCycle(implementation.implementationClass, [...path, node])
              ) {
                recursionStack.delete(node);
                return true;
              }
              break;
            }
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
   * Update source configuration
   */
  updateSourceConfiguration(config: Partial<DISourceConfiguration>): void {
    this.sourceConfig = { ...this.sourceConfig, ...config };
    this.validationCache.clear(); // Clear cache when config changes
  }

  /**
   * Get current source configuration
   */
  getSourceConfiguration(): DISourceConfiguration {
    return { ...this.sourceConfig };
  }

  /**
   * Clear validation cache
   */
  clearValidationCache(): void {
    this.validationCache.clear();
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    cacheSize: number;
    validatedDecorators: number;
    validatedMarkers: number;
    sourceValidationEnabled: boolean;
  } {
    const decoratorCount = Array.from(this.validationCache.keys())
      .filter(key => key.includes(':decorator')).length;
    const markerCount = Array.from(this.validationCache.keys())
      .filter(key => key.includes(':marker')).length;

    return {
      cacheSize: this.validationCache.size,
      validatedDecorators: decoratorCount,
      validatedMarkers: markerCount,
      sourceValidationEnabled: this.sourceConfig.validateSources
    };
  }

  /**
   * Comprehensive service validation with source checking
   */
  validateServiceWithSources(classDecl: ClassDeclaration): {
    isValid: boolean;
    hasServiceDecorator: boolean;
    decoratorFromValidSource: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const className = classDecl.getName() || 'Unknown';
    const sourceFile = classDecl.getSourceFile();

    // Check for service decorator
    const hasServiceDecorator = this.hasServiceDecorator(classDecl);
    if (!hasServiceDecorator) {
      issues.push(`${className} is missing @Service decorator`);
      suggestions.push(`Add @Service() decorator to ${className}`);
    }

    // Check decorator source validity
    let decoratorFromValidSource = false;
    if (hasServiceDecorator) {
      const decorators = classDecl.getDecorators();
      for (const decorator of decorators) {
        const decoratorName = this.getDecoratorName(decorator);
        if (decoratorName && this.isServiceDecoratorName(decoratorName)) {
          decoratorFromValidSource = this.validateDecoratorSource(decoratorName, sourceFile);
          if (!decoratorFromValidSource) {
            issues.push(`@${decoratorName} decorator in ${className} not from valid source`);
            suggestions.push(`Import @${decoratorName} from one of: ${this.sourceConfig.decoratorSources.join(', ')}`);
          }
          break;
        }
      }
    }

    // Validate constructor parameters
    const constructors = classDecl.getConstructors();
    if (constructors.length > 1) {
      issues.push(`${className} has multiple constructors (only one is supported)`);
    }

    if (constructors.length === 1) {
      const constructor = constructors[0];
      const parameters = constructor.getParameters();
      
      for (const param of parameters) {
        const paramValidation = this.validateInjectParameterWithSources(param);
        if (!paramValidation.isValid) {
          issues.push(...paramValidation.issues);
          suggestions.push(...paramValidation.suggestions);
        }
      }
    }

    return {
      isValid: issues.length === 0,
      hasServiceDecorator,
      decoratorFromValidSource,
      issues,
      suggestions
    };
  }

  /**
   * Validate inject parameter with source checking
   */
  validateInjectParameterWithSources(param: ParameterDeclaration): {
    isValid: boolean;
    hasInjectDecorator: boolean;
    decoratorFromValidSource: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const paramName = param.getName();
    const paramType = param.getTypeNode()?.getText();
    const sourceFile = param.getSourceFile();

    // Check for @Inject decorator
    const hasInjectDecorator = this.hasInjectDecorator(param);
    if (!hasInjectDecorator) {
      issues.push(`Parameter ${paramName} is missing @Inject decorator`);
      suggestions.push(`Add @Inject() decorator to parameter ${paramName}`);
    }

    // Check decorator source validity
    let decoratorFromValidSource = false;
    if (hasInjectDecorator) {
      const decorators = param.getDecorators();
      for (const decorator of decorators) {
        const decoratorName = this.getDecoratorName(decorator);
        if (decoratorName && this.isInjectDecoratorName(decoratorName)) {
          decoratorFromValidSource = this.validateDecoratorSource(decoratorName, sourceFile);
          if (!decoratorFromValidSource) {
            issues.push(`@${decoratorName} decorator on ${paramName} not from valid source`);
            suggestions.push(`Import @${decoratorName} from one of: ${this.sourceConfig.decoratorSources.join(', ')}`);
          }
          break;
        }
      }
    }

    // Check parameter type
    if (!paramType) {
      issues.push(`Parameter ${paramName} is missing type annotation`);
      suggestions.push(`Add type annotation to parameter ${paramName}`);
    } else {
      // Check for primitive types (usually not intended for DI)
      const primitiveTypes = ['string', 'number', 'boolean', 'any'];
      if (primitiveTypes.includes(paramType.toLowerCase())) {
        issues.push(`Parameter ${paramName} has primitive type ${paramType} - consider using a service interface`);
        suggestions.push(`Create an interface for ${paramName} instead of using primitive type ${paramType}`);
      }
    }

    return {
      isValid: issues.length === 0,
      hasInjectDecorator,
      decoratorFromValidSource,
      issues,
      suggestions
    };
  }
}