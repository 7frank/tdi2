// tools/shared/SharedServiceRegistry.ts

import type { ExtractedDependency } from './SharedDependencyExtractor';
import type {
  InterfaceImplementation,
  ServiceScope,
  RegistrationType,
  ServiceImplementationBase
} from '../interface-resolver/interface-resolver-types';
import type { ConfigManager } from '../config-manager';
import type { ComponentMetadata } from '../eslint-metadata';
import * as path from 'path';
import * as fs from 'fs';
import { KeySanitizer } from '../interface-resolver/key-sanitizer';
import { consoleFor } from '../logger';
import { ESLintMetadataGenerator } from '../eslint-metadata';

const keySanitizer = new KeySanitizer();
const console = consoleFor('di-core:shared-service-registry');
 

/**
 * Service registration information used by the registry.
 * Extends ServiceImplementationBase with registry-specific metadata.
 */
export interface ServiceRegistration extends ServiceImplementationBase {
  /** Unique token for DI lookup (same as sanitizedKey) */
  token: string;
  /** Full location-based path for resolution (legacy field, use sanitizedKey instead) */
  implementationClassPath: string;
  /** Service lifecycle scope */
  scope: ServiceScope;
  /** List of dependencies this service requires */
  dependencies: ExtractedDependency[];
  /** Factory function name for creating instances */
  factory: string;
  /** How this service is registered in the DI system */
  registrationType: RegistrationType;
  /** Additional metadata for the service */
  metadata: {
    isGeneric: boolean;
    typeParameters: string[];
    baseClass?: string;
    baseClassGeneric?: string;
    isAutoResolved: boolean;
  };
}

export interface RegistryConfiguration {
  services: Map<string, ServiceRegistration>;
  interfaceMapping: Map<string, string[]>;     // Interface -> Implementation classes
  classMapping: Map<string, string>;          // Class -> Token
  dependencyGraph: Map<string, ExtractedDependency[]>;     // Service -> Dependencies
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
  private dependencyGraph = new Map<string, ExtractedDependency[]>();
  private componentMetadata = new Map<string, ComponentMetadata>();

  constructor(
    private configManager: ConfigManager
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

    console.debug(`📝 Registered: ${registration.token} -> ${registration.implementationClass} (${registration.registrationType})`);
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
   * Register a bean implementation from @Configuration class
   */
  registerBeanImplementation(token: string, interfaceName: string, config: any): void {
    const registration: ServiceRegistration = {
      token,
      interfaceName,
      implementationClass: config.configurationClass || 'UnknownConfig',
      sanitizedKey: token,
      implementationClassPath: token, // Use token as the resolution path for beans
      scope: config.scope,
      dependencies: config.dependencies || [],
      factory: `bean_${config.beanMethodName}_factory`,
      filePath: config.filePath || 'unknown',
      registrationType: 'class', // Beans are essentially class-based
      metadata: {
        isGeneric: false,
        typeParameters: [],
        isAutoResolved: config.isAutoResolved || true,
      }
    };

    this.services.set(token, registration);

    // Update interface mapping
    const implementations = this.interfaceMapping.get(interfaceName) || [];
    if (!implementations.includes(config.configurationClass)) {
      implementations.push(config.configurationClass);
      this.interfaceMapping.set(interfaceName, implementations);
    }

    // Update class mapping
    this.classMapping.set(config.configurationClass, token);

    // Update dependency graph
    this.dependencyGraph.set(token, config.dependencies || []);
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
  getDependencies(serviceToken: string): ExtractedDependency[] {
    return this.dependencyGraph.get(serviceToken) || [];
  }

  /**
   * Generate DI configuration file
   */
  async generateDIConfiguration(): Promise<void> {
    const configContent = this.generateConfigContent();
    const configFilePath = path.join(this.configManager.getConfigDir(), 'di-config.ts');

    await fs.promises.writeFile(configFilePath, configContent, 'utf8');

    console.info(`📝 Generated DI configuration: ${configFilePath}`);

    // Generate ESLint metadata
    await this.generateESLintMetadata();
  }

  /**
   * Generate ESLint metadata for interface resolution context
   */
  private async generateESLintMetadata(): Promise<void> {
    try {
      const generator = new ESLintMetadataGenerator(
        this,
        this.configManager,
        this.componentMetadata
      );

      const metadata = await generator.generateMetadata();
      await generator.writeMetadataFile(metadata);

      console.info('✅ Generated ESLint metadata');
    } catch (error) {
      console.error('❌ Failed to generate ESLint metadata:', error);
      // Don't fail the build if ESLint metadata generation fails
    }
  }

  /**
   * Generate service registry file
   */
  async generateServiceRegistry(): Promise<void> {
    const registryContent = this.generateRegistryContent();
    const registryFilePath = path.join(this.configManager.getConfigDir(), 'service-registry.ts');
    
    await fs.promises.writeFile(registryFilePath, registryContent, 'utf8');

    console.info(`📝 Generated service registry: ${registryFilePath}`);
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
        if (!this.services.has(depToken.sanitizedKey)) {
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
    const filteredDependencies = dependencies
      
      .filter(it => !!it.sanitizedKey); // Remove empty tokens

    return {
      token: implementation.sanitizedKey,
      interfaceName: implementation.interfaceName,
      implementationClass: implementation.implementationClass,
      sanitizedKey: implementation.sanitizedKey,
      implementationClassPath: implementation.sanitizedKey, // Use sanitized key as the resolution path
      scope: implementation.scope || 'singleton', // Use scope from decorator or default to singleton
      dependencies: filteredDependencies,
      factory: this.generateFactoryName(implementation.implementationClass),
      filePath: implementation.filePath,
      registrationType: implementation.registrationType,
      metadata: {
        isGeneric: implementation.isGeneric,
        typeParameters: implementation.typeParameters,
        baseClass: implementation.baseClass,
        baseClassGeneric: implementation.baseClassGeneric,
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
      const { implementationClass,implementationClassPath } = registration;
      
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
    dependencies: [${registration.dependencies.map(function (dep)  {
        // Use the resolved implementation's sanitized key for consistent resolution
        const resolvedKey = dep.resolvedImplementation?.sanitizedKey || dep.sanitizedKey;
        return `'${resolvedKey}'`;
      }).join(', ')}],
    interfaceName: '${registration.interfaceName}',
    implementationClass: '${implementationClass}',
    implementationClassPath: '${registration.implementationClassPath}',
    isAutoResolved: ${registration.metadata.isAutoResolved},
    registrationType: '${registration.registrationType}',
    isClassBased: ${registration.registrationType === 'class'},
    isInheritanceBased: ${registration.registrationType === 'inheritance'},
    baseClass: ${registration.metadata.baseClass ? `'${registration.metadata.baseClass}'` : 'null'},
    baseClassGeneric: ${registration.metadata.baseClassGeneric ? `'${registration.metadata.baseClassGeneric}'` : 'null'},
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
    const { implementationClass, dependencies,implementationClassPath } = registration;
    
    if (dependencies.length === 0) {
      return `function ${registration.factory}(container: any) {
  return () => new ${implementationClass}();
}`;
    }


    const dependencyResolves = dependencies.map(function (depToken, index) {
      // Use the resolved implementation's sanitized key for consistent resolution
      const resolvedKey = depToken.resolvedImplementation?.sanitizedKey || depToken.sanitizedKey;
      return  `    const dep${index} = container.resolve('${resolvedKey}');`
    }).join('\n');

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
        if (detectCycle(depToken.sanitizedKey, [...path, token])) {
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
        usedTokens.add(token.sanitizedKey);
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

  /**
   * Set component metadata for ESLint generation
   */
  setComponentMetadata(metadata: Map<string, ComponentMetadata>): void {
    this.componentMetadata = metadata;
    console.debug(`📦 Set component metadata for ${metadata.size} components`);
  }

  /**
   * Get component metadata
   */
  getComponentMetadata(): Map<string, ComponentMetadata> {
    return this.componentMetadata;
  }
}