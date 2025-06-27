// tools/service-validator.ts - Complete service validation logic

import {
  ClassDeclaration,
  Node,
} from "ts-morph";
import { ServiceDependency, InterfaceImplementation, ValidationResult } from "./interface-resolver-types";

export class ServiceValidator {
  constructor(private verbose: boolean = false) {}

  /**
   * Check if a class has a service decorator
   */
  hasServiceDecorator(classDecl: ClassDeclaration): boolean {
    return classDecl.getDecorators().some((decorator) => {
      try {
        const expression = decorator.getExpression();
        if (Node.isCallExpression(expression)) {
          const expressionText = expression.getExpression().getText();
          return this.isServiceDecoratorName(expressionText);
        } else if (Node.isIdentifier(expression)) {
          // Handle decorators without parentheses like @Service
          const expressionText = expression.getText();
          return this.isServiceDecoratorName(expressionText);
        }
      } catch (error) {
        // Ignore malformed decorators
      }
      return false;
    });
  }

  /**
   * Check if a parameter has an inject decorator
   */
  hasInjectDecorator(param: any): boolean {
    return param.getDecorators().some((decorator: any) => {
      try {
        const expression = decorator.getExpression();
        if (Node.isCallExpression(expression)) {
          const expressionText = expression.getExpression().getText();
          return this.isInjectDecoratorName(expressionText);
        } else if (Node.isIdentifier(expression)) {
          // Handle decorators without parentheses
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
   * Validate all dependencies in the system
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
   * Check if decorator name indicates a service
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
   * Check if decorator name indicates injection
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
   * Find circular dependencies in the dependency graph
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
   * Validate that a service class is properly decorated
   */
  validateServiceClass(classDecl: ClassDeclaration): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const className = classDecl.getName() || 'Unknown';

    // Check for service decorator
    if (!this.hasServiceDecorator(classDecl)) {
      issues.push(`${className} is missing @Service decorator`);
    }

    // Check for multiple service decorators
    const serviceDecorators = classDecl.getDecorators().filter(decorator => {
      try {
        const expression = decorator.getExpression();
        const expressionText = Node.isCallExpression(expression) 
          ? expression.getExpression().getText()
          : Node.isIdentifier(expression) 
            ? expression.getText() 
            : '';
        return this.isServiceDecoratorName(expressionText);
      } catch {
        return false;
      }
    });

    if (serviceDecorators.length > 1) {
      issues.push(`${className} has multiple service decorators`);
    }

    // Check constructor parameters
    const constructors = classDecl.getConstructors();
    if (constructors.length > 1) {
      issues.push(`${className} has multiple constructors (only one is supported)`);
    }

    if (constructors.length === 1) {
      const constructor = constructors[0];
      const parameters = constructor.getParameters();
      
      for (const param of parameters) {
        const paramName = param.getName();
        const paramType = param.getTypeNode()?.getText();
        
        // Check if parameter without @Inject might be intended for DI
        if (!this.hasInjectDecorator(param) && paramType && this.looksLikeServiceDependency(paramType)) {
          issues.push(`${className}.${paramName} might need @Inject decorator`);
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Check if a type looks like it should be injected
   */
  private looksLikeServiceDependency(paramType: string): boolean {
    const servicePatterns = [
      'Service',
      'Repository', 
      'Manager',
      'Provider',
      'Handler',
      'Controller',
      'Store',
      'Gateway',
      'Client',
      'Adapter',
      'Factory',
      'Builder',
      'Strategy',
      'Command',
      'Query'
    ];

    return servicePatterns.some(pattern => paramType.includes(pattern));
  }

  /**
   * Validate dependency injection parameter
   */
  validateInjectParameter(param: any): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const paramName = param.getName();
    const paramType = param.getTypeNode()?.getText();

    // Check for @Inject decorator
    if (!this.hasInjectDecorator(param)) {
      issues.push(`Parameter ${paramName} is missing @Inject decorator`);
    }

    // Check parameter type
    if (!paramType) {
      issues.push(`Parameter ${paramName} is missing type annotation`);
    } else {
      // Check for primitive types (usually not intended for DI)
      const primitiveTypes = ['string', 'number', 'boolean', 'any'];
      if (primitiveTypes.includes(paramType.toLowerCase())) {
        issues.push(`Parameter ${paramName} has primitive type ${paramType} - consider using a service interface`);
      }
    }

    // Check for multiple inject decorators
    const injectDecorators = param.getDecorators().filter((decorator: any) => {
      try {
        const expression = decorator.getExpression();
        const expressionText = Node.isCallExpression(expression) 
          ? expression.getExpression().getText()
          : Node.isIdentifier(expression) 
            ? expression.getText() 
            : '';
        return this.isInjectDecoratorName(expressionText);
      } catch {
        return false;
      }
    });

    if (injectDecorators.length > 1) {
      issues.push(`Parameter ${paramName} has multiple inject decorators`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate the entire DI configuration
   */
  validateDIConfiguration(
    dependencies: Map<string, ServiceDependency>,
    interfaces: Map<string, InterfaceImplementation>
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    stats: {
      totalServices: number;
      servicesWithDependencies: number;
      totalInterfaces: number;
      orphanedServices: number;
      circularDependencies: number;
      classBased: number;
      interfaceBased: number;
      inheritanceBased: number;
      stateBased: number;
    };
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Run basic validation
    const basicValidation = this.validateDependencies(dependencies, interfaces);
    errors.push(...basicValidation.missingImplementations.map(m => `Missing implementation: ${m}`));
    errors.push(...basicValidation.circularDependencies.map(c => `Circular dependency: ${c}`));

    // Check for orphaned services (services with no dependents)
    const orphanedServices = this.findOrphanedServices(dependencies, interfaces);
    if (orphanedServices.length > 0) {
      warnings.push(`Orphaned services (no dependents): ${orphanedServices.join(', ')}`);
    }

    // Check for unused interfaces
    const unusedInterfaces = this.findUnusedInterfaces(dependencies, interfaces);
    if (unusedInterfaces.length > 0) {
      warnings.push(`Unused interfaces: ${unusedInterfaces.join(', ')}`);
    }

    // Check for ambiguous registrations
    const ambiguousRegistrations = this.findAmbiguousRegistrations(interfaces);
    if (ambiguousRegistrations.length > 0) {
      warnings.push(`Ambiguous registrations: ${ambiguousRegistrations.join(', ')}`);
    }

    // Calculate registration type statistics
    const registrationStats = this.calculateRegistrationStats(interfaces);

    const stats = {
      totalServices: new Set([...dependencies.keys(), ...Array.from(interfaces.values()).map(i => i.implementationClass)]).size,
      servicesWithDependencies: dependencies.size,
      totalInterfaces: interfaces.size,
      orphanedServices: orphanedServices.length,
      circularDependencies: basicValidation.circularDependencies.length,
      ...registrationStats
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  }

  /**
   * Calculate statistics about registration types
   */
  private calculateRegistrationStats(interfaces: Map<string, InterfaceImplementation>): {
    classBased: number;
    interfaceBased: number;
    inheritanceBased: number;
    stateBased: number;
  } {
    let classBased = 0;
    let interfaceBased = 0;
    let inheritanceBased = 0;
    let stateBased = 0;

    for (const [, implementation] of interfaces) {
      if (implementation.isClassBased) classBased++;
      else if (implementation.isStateBased) stateBased++;
      else if (implementation.isInheritanceBased) inheritanceBased++;
      else interfaceBased++;
    }

    return {
      classBased,
      interfaceBased,
      inheritanceBased,
      stateBased
    };
  }

  /**
   * Find services that are never injected anywhere
   */
  private findOrphanedServices(
    dependencies: Map<string, ServiceDependency>,
    interfaces: Map<string, InterfaceImplementation>
  ): string[] {
    const allServices = new Set(Array.from(interfaces.values()).map(i => i.implementationClass));
    const usedServices = new Set<string>();

    // Mark services that are dependencies of other services
    for (const [, dependency] of dependencies) {
      for (const depKey of dependency.interfaceDependencies) {
        for (const [, implementation] of interfaces) {
          if (implementation.sanitizedKey === depKey) {
            usedServices.add(implementation.implementationClass);
          }
        }
      }
    }

    return Array.from(allServices).filter(service => !usedServices.has(service));
  }

  /**
   * Find interfaces that have implementations but are never used
   */
  private findUnusedInterfaces(
    dependencies: Map<string, ServiceDependency>,
    interfaces: Map<string, InterfaceImplementation>
  ): string[] {
    const allInterfaces = new Set(Array.from(interfaces.values()).map(i => i.interfaceName));
    const usedInterfaces = new Set<string>();

    // Mark interfaces that are used as dependencies
    for (const [, dependency] of dependencies) {
      for (const depKey of dependency.interfaceDependencies) {
        for (const [, implementation] of interfaces) {
          if (implementation.sanitizedKey === depKey) {
            usedInterfaces.add(implementation.interfaceName);
          }
        }
      }
    }

    return Array.from(allInterfaces).filter(interfaceName => !usedInterfaces.has(interfaceName));
  }

  /**
   * Find interfaces with multiple implementations (potential ambiguity)
   */
  private findAmbiguousRegistrations(interfaces: Map<string, InterfaceImplementation>): string[] {
    const interfaceCounts = new Map<string, number>();
    
    for (const [, implementation] of interfaces) {
      if (!implementation.isClassBased) { // Only check interface-based registrations
        const interfaceName = implementation.interfaceName;
        interfaceCounts.set(interfaceName, (interfaceCounts.get(interfaceName) || 0) + 1);
      }
    }
    
    return Array.from(interfaceCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([interfaceName]) => interfaceName);
  }

  /**
   * Check if a service follows naming conventions
   */
  validateNamingConventions(className: string): {
    isValid: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];

    // Check for service suffix
    const servicePatterns = ['Service', 'Repository', 'Manager', 'Provider', 'Handler', 'Controller'];
    const hasServiceSuffix = servicePatterns.some(pattern => className.endsWith(pattern));
    
    if (!hasServiceSuffix) {
      suggestions.push(`Consider adding a service suffix (e.g., ${className}Service)`);
    }

    // Check for PascalCase
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
      suggestions.push(`Use PascalCase for class names (${className})`);
    }

    // Check for meaningful names
    if (className.length < 3) {
      suggestions.push(`Use more descriptive names (${className} is too short)`);
    }

    const commonAntiPatterns = ['Manager', 'Helper', 'Utility', 'Common'];
    if (commonAntiPatterns.some(pattern => className.includes(pattern))) {
      suggestions.push(`Consider more specific naming instead of generic terms like Manager/Helper`);
    }

    return {
      isValid: suggestions.length === 0,
      suggestions
    };
  }

  /**
   * Validate scope consistency
   */
  validateScopeConsistency(
    dependencies: Map<string, ServiceDependency>,
    interfaces: Map<string, InterfaceImplementation>
  ): string[] {
    const warnings: string[] = [];

    // Check for potential scope issues
    // Note: This would require scope information from decorators
    // For now, we'll add basic checks that can be implemented

    // Check for services that might need singleton scope
    const heavyServices = this.findPotentiallyHeavyServices(interfaces);
    if (heavyServices.length > 0) {
      warnings.push(`Consider singleton scope for heavy services: ${heavyServices.join(', ')}`);
    }

    // Check for services that might need transient scope
    const statefulServices = this.findPotentiallyStatefulServices(interfaces);
    if (statefulServices.length > 0) {
      warnings.push(`Consider transient scope for stateful services: ${statefulServices.join(', ')}`);
    }
    
    return warnings;
  }

  /**
   * Find services that might be heavy to instantiate
   */
  private findPotentiallyHeavyServices(interfaces: Map<string, InterfaceImplementation>): string[] {
    const heavyServicePatterns = ['Client', 'Connection', 'Pool', 'Cache', 'Database', 'Http'];
    const heavyServices: string[] = [];

    for (const [, implementation] of interfaces) {
      const className = implementation.implementationClass;
      if (heavyServicePatterns.some(pattern => className.includes(pattern))) {
        heavyServices.push(className);
      }
    }

    return heavyServices;
  }

  /**
   * Find services that might maintain state
   */
  private findPotentiallyStatefulServices(interfaces: Map<string, InterfaceImplementation>): string[] {
    const statefulServicePatterns = ['State', 'Store', 'Session', 'Context', 'Registry'];
    const statefulServices: string[] = [];

    for (const [, implementation] of interfaces) {
      const className = implementation.implementationClass;
      if (statefulServicePatterns.some(pattern => className.includes(pattern))) {
        statefulServices.push(className);
      }
    }

    return statefulServices;
  }

  /**
   * Generate validation report
   */
  generateValidationReport(
    dependencies: Map<string, ServiceDependency>,
    interfaces: Map<string, InterfaceImplementation>
  ): string {
    const validation = this.validateDIConfiguration(dependencies, interfaces);
    
    let report = '# 🔍 DI Configuration Validation Report\n\n';
    
    // Summary
    report += '## 📊 Summary\n';
    report += `- **Status**: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}\n`;
    report += `- **Total Services**: ${validation.stats.totalServices}\n`;
    report += `- **Services with Dependencies**: ${validation.stats.servicesWithDependencies}\n`;
    report += `- **Total Interface Registrations**: ${validation.stats.totalInterfaces}\n`;
    report += `- **Orphaned Services**: ${validation.stats.orphanedServices}\n`;
    report += `- **Circular Dependencies**: ${validation.stats.circularDependencies}\n\n`;
    
    // Registration type breakdown
    report += '## 🏷️ Registration Types\n';
    report += `- **Class-based**: ${validation.stats.classBased}\n`;
    report += `- **Interface-based**: ${validation.stats.interfaceBased}\n`;
    report += `- **Inheritance-based**: ${validation.stats.inheritanceBased}\n`;
    report += `- **State-based**: ${validation.stats.stateBased}\n\n`;
    
    // Errors
    if (validation.errors.length > 0) {
      report += '## ❌ Errors\n';
      validation.errors.forEach(error => {
        report += `- ${error}\n`;
      });
      report += '\n';
    }
    
    // Warnings
    if (validation.warnings.length > 0) {
      report += '## ⚠️ Warnings\n';
      validation.warnings.forEach(warning => {
        report += `- ${warning}\n`;
      });
      report += '\n';
    }
    
    // Recommendations
    report += '## 💡 Recommendations\n';
    if (validation.stats.orphanedServices > 0) {
      report += '- Consider removing unused services or ensure they are being used\n';
    }
    if (validation.stats.circularDependencies > 0) {
      report += '- Break circular dependencies by introducing abstractions or refactoring\n';
    }
    if (validation.stats.stateBased > 0) {
      report += '- Review state-based services for proper scope configuration\n';
    }
    if (validation.errors.length === 0 && validation.warnings.length === 0) {
      report += '- Your DI configuration looks excellent! 🎉\n';
    }
    
    return report;
  }

  /**
   * Quick health check for DI configuration
   */
  quickHealthCheck(
    dependencies: Map<string, ServiceDependency>,
    interfaces: Map<string, InterfaceImplementation>
  ): 'healthy' | 'warning' | 'error' {
    const validation = this.validateDIConfiguration(dependencies, interfaces);
    
    if (validation.errors.length > 0) {
      return 'error';
    }
    
    if (validation.warnings.length > 0 || validation.stats.circularDependencies > 0) {
      return 'warning';
    }
    
    return 'healthy';
  }

  /**
   * Suggest improvements for DI configuration
   */
  suggestImprovements(
    dependencies: Map<string, ServiceDependency>,
    interfaces: Map<string, InterfaceImplementation>
  ): string[] {
    const suggestions: string[] = [];
    const validation = this.validateDIConfiguration(dependencies, interfaces);

    // Suggest interface extraction for class-based services
    if (validation.stats.classBased > validation.stats.interfaceBased) {
      suggestions.push('Consider extracting interfaces for better testability and decoupling');
    }

    // Suggest state-based DI for AsyncState patterns
    const asyncStateServices = Array.from(interfaces.values())
      .filter(impl => impl.isInheritanceBased && impl.baseClass === 'AsyncState');
    if (asyncStateServices.length > 0 && validation.stats.stateBased === 0) {
      suggestions.push('Consider using state-based DI for AsyncState services');
    }

    // Suggest dependency reduction for complex services
    const complexServices = this.findComplexServices(dependencies);
    if (complexServices.length > 0) {
      suggestions.push(`Consider breaking down complex services: ${complexServices.join(', ')}`);
    }

    return suggestions;
  }

  /**
   * Find services with many dependencies
   */
  private findComplexServices(dependencies: Map<string, ServiceDependency>): string[] {
    const complexServices: string[] = [];
    const maxDependencies = 5; // Threshold for complexity

    for (const [serviceClass, dependency] of dependencies) {
      if (dependency.constructorParams.length > maxDependencies) {
        complexServices.push(`${serviceClass} (${dependency.constructorParams.length} deps)`);
      }
    }

    return complexServices;
  }
}