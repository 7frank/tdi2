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

    const