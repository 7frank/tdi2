// tools/shared/SharedServiceRegistry.ts

import type { ExtractedDependency } from './SharedDependencyExtractor';
import type { InterfaceImplementation } from '../interface-resolver/interface-resolver-types';
import type { ConfigManager } from '../config-manager';
import * as path from 'path';
import * as fs from 'fs';

export interface ServiceRegistration {
  token: string;                    // Sanitized key for DI lookup
  interfaceName: string;           // Original interface name
  implementationClass: string;     // Implementation class name
  scope: 'singleton' | 'transient' | 'scoped';
  dependencies: string[];          // Dependency tokens
  factory: string;                 // Factory function name
  filePath: string;               // Source file path
  registrationType: 'interface' | 'inheritance' | 'state' | 'class';
  metadata: {
    isGeneric: boolean;
    typeParameters: string[];
    sanitizedKey: string;
    baseClass?: string;
    baseClassGeneric?: string;
    stateType?: string;
    serviceInterface?: string;
    isAutoResolved: boolean;
  };
}

export interface RegistryConfiguration {
  services: Map<string, ServiceRegistration>;
  interfaceMapping: Map<string, string[]>;     // Interface -> Implementation classes
  classMapping: Map<string, string>;          // Class -> Token
  dependencyGraph: Map<string, string[]>;     // Service -> Dependencies
}

export interface RegistryStats {
  totalServices: number;
  byType: Record<string, number>;
  byScope: Record<string, number>;
  withDependencies: number;
  orphanedServices: number;
}

export class SharedServiceRegistry {
  private services = new Map<string, ServiceRegistration>();
  private interfaceMapping = new Map<string, string[]>();
  private classMapping = new Map<string, string>();
  private dependencyGraph = new Map<string, string[]>();

  constructor(
    private configManager: ConfigManager,
    private options: { verbose?: boolean } = {}
  ) {}

  /**
   * Register a service implementation
   */
  registerService(implementation: InterfaceImplementation, dependencies: ExtractedDependency[]): void {
    const registration = this.createServiceRegistration(implementation, dependencies);
    
    // Store service registration
    this.services.set(registration.token, registration);
    
    // Update interface mapping
    this.updateInterfaceMapping(registration);
    
    // Update class mapping
    this.classMapping.set(registration.implementationClass, registration.token);
    
    // Update dependency graph
    this.updateDependencyGraph(registration);

    if (this.options.verbose) {
      console.log(`📝 Registered: ${registration.token} -> ${registration.implementationClass} (${registration.registrationType})`);
    }
  }

  /**
   * Register multiple services efficiently
   */
  registerServices(implementations: InterfaceImplementation[], dependencyMap: Map<string, ExtractedDependency[]>): void {
    for (const implementation of implementations) {
      const dependencies = dependencyMap.get(implementation.implementationClass) || [];
      this.registerService(implementation, dependencies);
    }
  }

  /**
   * Get service registration by token
   */
  getService(token: string): ServiceRegistration | undefined {
    return this.services.get(token);
  }

  /**
   * Get all services implementing an interface
   */
  getServicesByInterface(interfaceName: string): ServiceRegistration[] {
    const implementationClasses = this.interfaceMapping.get(interfaceName) || [];
    return implementationClasses
      .map(className => this.getServiceByClass(className))
      .filter((service): service is ServiceRegistration => !!service);
  }

  /**
   * Get service by implementation class name
   */
  getServiceByClass(className: string): ServiceRegistration | undefined {
    const token = this.classMapping.get(className);
    return token ? this.services.get(token) : undefined;
  }

  /**
   * Get all registered services
   */
  getAllServices(): ServiceRegistration[] {
    return Array.from(this.services.values());
  }

  /**
   * Get dependency graph for a service
   */
  getDependencies(serviceToken: string): string[] {
    return this.dependencyGraph.get(serviceToken) || [];
  }

  /**
   * Generate DI configuration file
   */
  async generateDIConfiguration(): Promise<void> {
    const configContent = this.generateConfigContent();
    const configFilePath = path.join(this.configManager.getConfigDir(), 'di-config.ts');
    
    await fs.promises.writeFile(configFilePath, configContent, 'utf8');
    
    if (this.options.verbose) {
      console.log(`📝 Generated DI configuration: ${configFilePath}`);
    }
  }

  /**
   * Generate service registry file
   */
  async generateServiceRegistry(): Promise<void> {
    const registryContent = this.generateRegistryContent();
    const registryFilePath = path.join(this.configManager.getConfigDir(), 'service-registry.ts');
    
    await fs.promises.writeFile(registryFilePath, registryContent, 'utf8');
    
    if (this.options.verbose) {
      console.log(`📝 Generated service registry: ${registryFilePath}`);
    }
  }

  /**
   * Validate registry configuration
   */
  validateRegistry(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    stats: RegistryStats;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies();
    if (circularDeps.length > 0) {
      errors.push(...circularDeps.map(cycle => `Circular dependency: ${cycle.join(' -> ')}`));
    }

    // Check for missing dependencies
    for (const [serviceToken, deps] of this.dependencyGraph) {
      for (const depToken of deps) {
        if (!this.services.has(depToken)) {
          errors.push(`Service ${serviceToken} depends on missing service ${depToken}`);
        }
      }
    }

    // Check for ambiguous registrations
    const ambiguous = this.findAmbiguousRegistrations();
    if (ambiguous.length > 0) {
      warnings.push(...ambiguous.map(iface => `Multiple implementations for interface: ${iface}`));
    }

    const stats = this.generateStats();

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  }

  /**
   * Create service registration from implementation and dependencies
   */
  private createServiceRegistration(
    implementation: InterfaceImplementation,
    dependencies: ExtractedDependency[]
  ): ServiceRegistration {
    const dependencyTokens = dependencies
      .map(dep => dep.sanitizedKey)
      .filter(token => token); // Remove empty tokens

    return {
      token: implementation.sanitizedKey,
      interfaceName: implementation.interfaceName,
      implementationClass: implementation.implementationClass,
      scope: 'singleton', // Default scope
      dependencies: dependencyTokens,
      factory: this.generateFactoryName(implementation.implementationClass),
      filePath: implementation.filePath,
      registrationType: this.determineRegistrationType(implementation),
      metadata: {
        isGeneric: implementation.isGeneric,
        typeParameters: implementation.typeParameters,
        sanitizedKey: implementation.sanitizedKey,
        baseClass: implementation.baseClass,
        baseClassGeneric: implementation.baseClassGeneric,
        stateType: implementation.stateType,
        serviceInterface: implementation.serviceInterface,
        isAutoResolved: true
      }
    };
  }

  /**
   * Update interface mapping
   */
  private updateInterfaceMapping(registration: ServiceRegistration): void {
    const { interfaceName, implementationClass } = registration;
    
    if (!this.interfaceMapping.has(interfaceName)) {
      this.interfaceMapping.set(interfaceName, []);
    }
    
    const implementations = this.interfaceMapping.get(interfaceName)!;
    if (!implementations.includes(implementationClass)) {
      implementations.push(implementationClass);
    }
  }

  /**
   * Update dependency graph
   */
  private updateDependencyGraph(registration: ServiceRegistration): void {
    this.dependencyGraph.set(registration.token, registration.dependencies);
  }

  /**
   * Determine registration type from implementation
   */
  private determineRegistrationType(implementation: InterfaceImplementation): 'interface' | 'inheritance' | 'state' | 'class' {
    if (implementation.isStateBased) return 'state';
    if (implementation.isInheritanceBased) return 'inheritance';
    if (implementation.isClassBased) return 'class';
    return 'interface';
  }

  /**
   * Generate factory function name
   */
  private generateFactoryName(implementationClass: string): string {
    return `create${implementationClass}`;
  }

  /**
   * Generate DI configuration content
   */
  private generateConfigContent(): string {
    const imports: string[] = [];
    const factories: string[] = [];
    const diMapEntries: string[] = [];

    // Process unique implementation classes to avoid duplicate imports
    const processedClasses = new Set<string>();

    for (const [token, registration] of this.services) {
      const { implementationClass } = registration;
      
      // Generate import (only once per class)
      if (!processedClasses.has(implementationClass)) {
        processedClasses.add(implementationClass);
        
        const configDir = this.configManager.getConfigDir();
        const servicePath = path.resolve(registration.filePath);
        const relativePath = path.relative(configDir, servicePath)
          .replace(/\.(ts|tsx)$/, '')
          .replace(/\\/g, '/');
        
        const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
        imports.push(`import { ${implementationClass} } from '${importPath}';`);
        
        // Generate factory function
        const factoryCode = this.generateFactoryFunction(registration);
        factories.push(factoryCode);
      }

      // Generate DI map entry
      diMapEntries.push(`  '${token}': {
    factory: ${registration.factory},
    scope: '${registration.scope}' as const,
    dependencies: [${registration.dependencies.map(dep => `'${dep}'`).join(', ')}],
    interfaceName: '${registration.interfaceName}',
    implementationClass: '${implementationClass}',
    isAutoResolved: ${registration.metadata.isAutoResolved},
    registrationType: '${registration.registrationType}',
    isClassBased: ${registration.registrationType === 'class'},
    isInheritanceBased: ${registration.registrationType === 'inheritance'},
    isStateBased: ${registration.registrationType === 'state'},
    baseClass: ${registration.metadata.baseClass ? `'${registration.metadata.baseClass}'` : 'null'},
    baseClassGeneric: ${registration.metadata.baseClassGeneric ? `'${registration.metadata.baseClassGeneric}'` : 'null'},
    stateType: ${registration.metadata.stateType ? `'${registration.metadata.stateType}'` : 'null'},
    serviceInterface: ${registration.metadata.serviceInterface ? `'${registration.metadata.serviceInterface}'` : 'null'}
  }`);
    }

    return `// Auto-generated DI configuration
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}

${imports.join('\n')}

// Factory functions
${factories.join('\n\n')}

// DI Configuration Map
export const DI_CONFIG = {
${diMapEntries.join(',\n')}
};

// Service mappings
export const SERVICE_TOKENS = {
${Array.from(this.classMapping.entries()).map(([className, token]) => 
  `  '${className}': '${token}'`
).join(',\n')}
};

export const INTERFACE_IMPLEMENTATIONS = {
${Array.from(this.interfaceMapping.entries()).map(([interfaceName, implementations]) => 
  `  '${interfaceName}': [${implementations.map(impl => `'${impl}'`).join(', ')}]`
).join(',\n')}
};`;
  }

  /**
   * Generate service registry content
   */
  private generateRegistryContent(): string {
    const servicesList = Array.from(this.services.values());
    
    return `// Auto-generated service registry
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}

export const REGISTRY_STATS = {
  totalServices: ${servicesList.length},
  byType: {
    interface: ${servicesList.filter(s => s.registrationType === 'interface').length},
    inheritance: ${servicesList.filter(s => s.registrationType === 'inheritance').length},
    state: ${servicesList.filter(s => s.registrationType === 'state').length},
    class: ${servicesList.filter(s => s.registrationType === 'class').length}
  },
  withDependencies: ${servicesList.filter(s => s.dependencies.length > 0).length}
};

export const ALL_SERVICES = ${JSON.stringify(servicesList, null, 2)};`;
  }

  /**
   * Generate factory function for service
   */
  private generateFactoryFunction(registration: ServiceRegistration): string {
    const { implementationClass, dependencies } = registration;
    
    if (dependencies.length === 0) {
      return `function ${registration.factory}(container: any) {
  return () => new ${implementationClass}();
}`;
    }

    const dependencyResolves = dependencies.map((depToken, index) => 
      `    const dep${index} = container.resolve('${depToken}');`
    ).join('\n');

    const constructorArgs = dependencies.map((_, index) => `dep${index}`).join(', ');

    return `function ${registration.factory}(container: any) {
  return () => {
${dependencyResolves}
    return new ${implementationClass}(${constructorArgs});
  };
}`;
  }

  /**
   * Find circular dependencies
   */
  private findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (token: string, path: string[]): boolean => {
      if (recursionStack.has(token)) {
        const cycleStart = path.indexOf(token);
        if (cycleStart >= 0) {
          cycles.push(path.slice(cycleStart).concat([token]));
        }
        return true;
      }

      if (visited.has(token)) return false;

      visited.add(token);
      recursionStack.add(token);

      const dependencies = this.dependencyGraph.get(token) || [];
      for (const depToken of dependencies) {
        if (detectCycle(depToken, [...path, token])) {
          recursionStack.delete(token);
          return true;
        }
      }

      recursionStack.delete(token);
      return false;
    };

    for (const token of this.services.keys()) {
      if (!visited.has(token)) {
        detectCycle(token, []);
      }
    }

    return cycles;
  }

  /**
   * Find interfaces with multiple implementations
   */
  private findAmbiguousRegistrations(): string[] {
    const ambiguous: string[] = [];
    
    for (const [interfaceName, implementations] of this.interfaceMapping) {
      if (implementations.length > 1) {
        ambiguous.push(interfaceName);
      }
    }
    
    return ambiguous;
  }

  /**
   * Generate registry statistics
   */
  private generateStats(): RegistryStats {
    const services = Array.from(this.services.values());
    
    const byType: Record<string, number> = {};
    const byScope: Record<string, number> = {};
    
    for (const service of services) {
      byType[service.registrationType] = (byType[service.registrationType] || 0) + 1;
      byScope[service.scope] = (byScope[service.scope] || 0) + 1;
    }

    return {
      totalServices: services.length,
      byType,
      byScope,
      withDependencies: services.filter(s => s.dependencies.length > 0).length,
      orphanedServices: this.findOrphanedServices().length
    };
  }

  /**
   * Find services that are never used as dependencies
   */
  private findOrphanedServices(): string[] {
    const usedTokens = new Set<string>();
    
    for (const dependencies of this.dependencyGraph.values()) {
      for (const token of dependencies) {
        usedTokens.add(token);
      }
    }
    
    const orphaned: string[] = [];
    for (const token of this.services.keys()) {
      if (!usedTokens.has(token)) {
        orphaned.push(token);
      }
    }
    
    return orphaned;
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear();
    this.interfaceMapping.clear();
    this.classMapping.clear();
    this.dependencyGraph.clear();
  }

  /**
   * Get registry configuration for external use
   */
  getConfiguration(): RegistryConfiguration {
    return {
      services: new Map(this.services),
      interfaceMapping: new Map(this.interfaceMapping),
      classMapping: new Map(this.classMapping),
      dependencyGraph: new Map(this.dependencyGraph)
    };
  }
}