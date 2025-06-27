// tools/dependency-tree-builder.ts - FIXED with enhanced registration

import {
  InterfaceResolver,
  type InterfaceImplementation,
  type ServiceDependency,
} from "./interface-resolver/interface-resolver";
import { ConfigManager } from "./config-manager";
import * as path from "path";
import * as fs from "fs";

interface TreeNode {
  id: string;
  parent: string | null;
  type: "service" | "inject";
  import: string;
  implementation?: InterfaceImplementation;
  dependency?: ServiceDependency;
}

interface DIConfiguration {
  token: string;
  implementation: InterfaceImplementation;
  dependencies: string[];
  factory: string;
  scope: string;
}

// Service class metadata to avoid duplicates
interface ServiceClass {
  className: string;
  filePath: string;
  dependencies: string[];
  factory: string;
  registrations: Array<{
    token: string;
    type: "interface" | "class" | "inheritance" | "state";
    interfaceName: string;
    metadata?: any;
  }>;
}

export class DependencyTreeBuilder {
  private interfaceResolver: InterfaceResolver;
  private configManager: ConfigManager;
  private configurations: Map<string, DIConfiguration> = new Map();
  private serviceClasses: Map<string, ServiceClass> = new Map();
  private options: {
    verbose: boolean;
    srcDir: string;
    enableInheritanceDI: boolean;
  };

  constructor(
    configManager: ConfigManager,
    options: {
      verbose?: boolean;
      srcDir?: string;
      enableInheritanceDI?: boolean;
    } = {}
  ) {
    this.configManager = configManager;
    this.options = {
      verbose: false,
      srcDir: "./src",
      enableInheritanceDI: true,
      ...options,
    };

    this.interfaceResolver = new InterfaceResolver({
      verbose: this.options.verbose,
      srcDir: this.options.srcDir,
      enableInheritanceDI: this.options.enableInheritanceDI,
    });
  }

  async buildDependencyTree(): Promise<void> {
    if (this.options.verbose) {
      console.log("🌳 Building dependency tree with inheritance support...");
    }

    // Scan project for interfaces, implementations, and inheritance
    await this.interfaceResolver.scanProject();

    // Validate dependencies
    const validation = this.interfaceResolver.validateDependencies();
    if (!validation.isValid) {
      console.error("❌ Dependency validation failed:");

      // Show detailed information for debugging
      const implementations =
        this.interfaceResolver.getInterfaceImplementations();
      console.log("Available implementations:", implementations);

      if (validation.missingImplementations.length > 0) {
        console.error(
          "Missing implementations:",
          validation.missingImplementations
        );
      }
      if (validation.circularDependencies.length > 0) {
        console.error(
          "Circular dependencies:",
          validation.circularDependencies
        );
      }
      throw new Error(
        "Invalid dependency configuration. Fix the issues above before proceeding."
      );
    }

    // Build configurations with deduplication
    await this.buildConfigurationsWithDeduplication();

    // Generate DI configuration file
    await this.generateDIConfiguration();

    // Generate import file (like di.generated.ts)
    await this.generateImportFile();

    if (this.options.verbose) {
      console.log(
        `✅ Built dependency tree with ${this.configurations.size} services`
      );
      console.log(`📦 Unique service classes: ${this.serviceClasses.size}`);
    }
  }

  // ENHANCED: Build configurations with proper AsyncState handling

  private async buildConfigurationsWithDeduplication(): Promise<void> {
    const implementations =
      this.interfaceResolver.getInterfaceImplementations();
    const dependencies = this.interfaceResolver.getServiceDependencies();

    // Step 1: Group all implementations by service class to avoid duplicates
    const serviceClassMap = new Map<
      string,
      {
        className: string;
        filePath: string;
        dependencies: string[];
        implementations: InterfaceImplementation[];
      }
    >();

    for (const [uniqueKey, implementation] of implementations) {
      const className = implementation.implementationClass;

      if (!serviceClassMap.has(className)) {
        const dependency = dependencies.get(className);
        const dependencyTokens = dependency
          ? dependency.interfaceDependencies
          : [];

        serviceClassMap.set(className, {
          className,
          filePath: implementation.filePath,
          dependencies: dependencyTokens,
          implementations: [],
        });
      }

      serviceClassMap.get(className)!.implementations.push(implementation);
    }

    // Step 2: Create service class entries and multiple token registrations
    for (const [className, serviceInfo] of serviceClassMap) {
      // Create the service class entry
      const serviceClass: ServiceClass = {
        className,
        filePath: serviceInfo.filePath,
        dependencies: serviceInfo.dependencies,
        factory: this.generateFactoryName(className),
        registrations: [],
      };

      // Add all the different ways this service can be accessed
      for (const impl of serviceInfo.implementations) {
        let token: string;
        let type: "interface" | "class" | "inheritance" | "state";

        if (impl.isStateBased) {
          // CRITICAL FIX: Use sanitized key instead of full service interface
          token = impl.sanitizedKey;
          type = "state";
        } else if (impl.isInheritanceBased) {
          // CRITICAL FIX: Use sanitized key instead of base class generic
          token = impl.sanitizedKey;
          type = "inheritance";
        } else if (impl.isClassBased) {
          token = impl.implementationClass; // Class name
          type = "class";
        } else {
          token = impl.interfaceName; // Interface name
          type = "interface";
        }

        // Add registration (avoid duplicate tokens)
        if (!serviceClass.registrations.some((reg) => reg.token === token)) {
          serviceClass.registrations.push({
            token,
            type,
            interfaceName: impl.interfaceName,
            metadata: {
              isGeneric: impl.isGeneric,
              typeParameters: impl.typeParameters,
              sanitizedKey: impl.sanitizedKey,
              baseClass: impl.baseClass,
              baseClassGeneric: impl.baseClassGeneric,
              inheritanceChain: impl.inheritanceChain,
              stateType: impl.stateType,
              serviceInterface: impl.serviceInterface,
              isStateBased: impl.isStateBased,
              isInheritanceBased: impl.isInheritanceBased,
              isClassBased: impl.isClassBased,
            },
          });
        }
      }

      this.serviceClasses.set(className, serviceClass);

      // Create DI configurations for each token
      for (const registration of serviceClass.registrations) {
        // Use the first implementation for the configuration (they all point to the same class)
        const primaryImpl = serviceInfo.implementations[0];

        const config: DIConfiguration = {
          token: registration.token, // This is now the sanitized key
          implementation: {
            ...primaryImpl,
            interfaceName: registration.interfaceName,
          },
          dependencies: serviceInfo.dependencies,
          factory: serviceClass.factory,
          scope: "singleton",
        };

        this.configurations.set(registration.token, config);

        if (this.options.verbose) {
          const typeIndicator =
            registration.type === "state"
              ? "🎯"
              : registration.type === "inheritance"
              ? "🧬"
              : registration.type === "class"
              ? "📦"
              : "🔌";
          console.log(
            `${typeIndicator} Config: ${registration.token} -> ${className}`
          );
        }
      }
    }

    // Log summary
    if (this.options.verbose) {
      console.log("\n📋 Service Registration Summary:");
      for (const [className, serviceClass] of this.serviceClasses) {
        console.log(`  ${className}:`);
        serviceClass.registrations.forEach((reg) => {
          console.log(`    → ${reg.token} (${reg.type})`);
        });
      }
    }
  }

  private async generateDIConfiguration(): Promise<void> {
    const imports: string[] = [];
    const factories: string[] = [];
    const diMapEntries: string[] = [];

    // Use serviceClasses to avoid duplicate imports and factories
    const processedClasses = new Set<string>();

    // Generate unique imports and factories
    for (const [className, serviceClass] of this.serviceClasses) {
      if (processedClasses.has(className)) continue;
      processedClasses.add(className);

      // Generate import (only once per class)
      const configDir = this.configManager.getConfigDir();
      const servicePath = path.resolve(serviceClass.filePath);
      const relativePath = path
        .relative(configDir, servicePath)
        .replace(/\.(ts|tsx)$/, "")
        .replace(/\\/g, "/");

      const importPath = relativePath.startsWith(".")
        ? relativePath
        : `./${relativePath}`;
      imports.push(`import { ${className} } from '${importPath}';`);

      // Generate factory function (only once per class)
      const factoryCode = this.generateFactoryFunction(serviceClass);
      factories.push(factoryCode);
    }

    // Generate DI map entries for all configurations
    const sortedConfigs = this.topologicalSort();
    for (const config of sortedConfigs) {
      const serviceClass = this.serviceClasses.get(
        config.implementation.implementationClass
      )!;
      const registration = serviceClass.registrations.find(
        (reg) => reg.token === config.token
      )!;

      diMapEntries.push(`  '${config.token}': {
    factory: ${config.factory},
    scope: '${config.scope}',
    dependencies: [${config.dependencies.map((dep) => `'${dep}'`).join(", ")}],
    interfaceName: '${registration.interfaceName}',
    implementationClass: '${config.implementation.implementationClass}',
    isAutoResolved: true,
    registrationType: '${registration.type}',
    isClassBased: ${registration.type === "class"},
    isInheritanceBased: ${registration.type === "inheritance"},
    isStateBased: ${registration.type === "state"},
    baseClass: ${
      registration.metadata?.baseClass
        ? `'${registration.metadata.baseClass}'`
        : "null"
    },
    baseClassGeneric: ${
      registration.metadata?.baseClassGeneric
        ? `'${registration.metadata.baseClassGeneric}'`
        : "null"
    },
    stateType: ${
      registration.metadata?.stateType
        ? `'${registration.metadata.stateType}'`
        : "null"
    },
    serviceInterface: ${
      registration.metadata?.serviceInterface
        ? `'${registration.metadata.serviceInterface}'`
        : "null"
    },
    inheritanceChain: [${(registration.metadata?.inheritanceChain || [])
      .map((c: string) => `'${c}'`)
      .join(", ")}]
  }`);
    }

    // Generate the complete DI configuration file
    const configContent = `// Auto-generated DI configuration - Enhanced with inheritance support
// Do not edit this file manually
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}

${imports.join("\n")}

// Factory functions (one per service class)
${factories.join("\n\n")}

// DI Configuration Map
export const DI_CONFIG = {
${diMapEntries.join(",\n")}
};

// Service class to registrations mapping
export const SERVICE_REGISTRATIONS = {
${Array.from(this.serviceClasses.entries())
  .map(
    ([className, serviceClass]) =>
      `  '${className}': [${serviceClass.registrations
        .map((reg) => `'${reg.token}'`)
        .join(", ")}]`
  )
  .join(",\n")}
};

// Registration type mappings (for debugging)
export const INTERFACE_MAPPING = {
${Array.from(this.configurations.values())
  .filter((config) => {
    const serviceClass = this.serviceClasses.get(
      config.implementation.implementationClass
    )!;
    const registration = serviceClass.registrations.find(
      (reg) => reg.token === config.token
    )!;
    return registration.type === "interface";
  })
  .map(
    (config) =>
      `  '${config.token}': '${config.implementation.implementationClass}'`
  )
  .join(",\n")}
};

export const CLASS_MAPPING = {
${Array.from(this.configurations.values())
  .filter((config) => {
    const serviceClass = this.serviceClasses.get(
      config.implementation.implementationClass
    )!;
    const registration = serviceClass.registrations.find(
      (reg) => reg.token === config.token
    )!;
    return registration.type === "class";
  })
  .map(
    (config) =>
      `  '${config.token}': '${config.implementation.implementationClass}'`
  )
  .join(",\n")}
};

export const INHERITANCE_MAPPING = {
${Array.from(this.configurations.values())
  .filter((config) => {
    const serviceClass = this.serviceClasses.get(
      config.implementation.implementationClass
    )!;
    const registration = serviceClass.registrations.find(
      (reg) => reg.token === config.token
    )!;
    return registration.type === "inheritance";
  })
  .map(
    (config) =>
      `  '${config.token}': '${config.implementation.implementationClass}'`
  )
  .join(",\n")}
};

export const STATE_MAPPING = {
${Array.from(this.configurations.values())
  .filter((config) => {
    const serviceClass = this.serviceClasses.get(
      config.implementation.implementationClass
    )!;
    const registration = serviceClass.registrations.find(
      (reg) => reg.token === config.token
    )!;
    return registration.type === "state";
  })
  .map(
    (config) =>
      `  '${config.token}': '${config.implementation.implementationClass}'`
  )
  .join(",\n")}
};

// Enhanced helper functions
export function getServicesByBaseClass(baseClass: string): string[] {
  return Object.values(DI_CONFIG)
    .filter(config => config.baseClass === baseClass)
    .map(config => config.implementationClass);
}

export function getServicesByStateType(stateType: string): string[] {
  return Object.values(DI_CONFIG)
    .filter(config => config.stateType === stateType)
    .map(config => config.implementationClass);
}

export function getTokensForService(serviceClass: string): string[] {
  return SERVICE_REGISTRATIONS[serviceClass] || [];
}

export function getRegistrationType(token: string): 'interface' | 'class' | 'inheritance' | 'state' | null {
  const config = DI_CONFIG[token];
  return config?.registrationType || null;
}

// Container setup function (deprecated - use loadConfiguration instead)
export function setupDIContainer(container: any) {
  for (const [token, config] of Object.entries(DI_CONFIG)) {
    container.register(token, config.factory, config.scope);
  }
}`;

    // Write the configuration file
    const configFilePath = path.join(
      this.configManager.getConfigDir(),
      "di-config.ts"
    );
    await fs.promises.writeFile(configFilePath, configContent, "utf8");
  }

  private generateFactoryFunction(serviceClass: ServiceClass): string {
    const dependencies = this.interfaceResolver.getServiceDependencies();
    const dependency = dependencies.get(serviceClass.className);

    if (!dependency || dependency.constructorParams.length === 0) {
      // No constructor dependencies
      return `function ${serviceClass.factory}(container: any) {
  return () => {
    return new ${serviceClass.className}();
  };
}`;
    }

    // Generate dependency resolution code
    const dependencyResolves = dependency.constructorParams
      .map((param, index) => {
        if (param.isOptional) {
          return `    const dep${index} = container.has('${param.sanitizedKey}') ? container.resolve('${param.sanitizedKey}') : undefined;`;
        } else {
          return `    const dep${index} = container.resolve('${param.sanitizedKey}');`;
        }
      })
      .join("\n");

    const constructorArgs = dependency.constructorParams
      .map((_, index) => `dep${index}`)
      .join(", ");

    return `function ${serviceClass.factory}(container: any) {
  return () => {
${dependencyResolves}
    return new ${serviceClass.className}(${constructorArgs});
  };
}`;
  }

  private async generateImportFile(): Promise<void> {
    // Generate import file - use unique service classes only
    const uniqueFiles = new Set<string>();

    for (const [className, serviceClass] of this.serviceClasses) {
      const servicePath = serviceClass.filePath;
      const relativePath = path
        .relative(this.options.srcDir, servicePath)
        .replace(/\.(ts|tsx)$/, "")
        .replace(/\\/g, "/");

      const importPath = relativePath.startsWith(".")
        ? relativePath
        : `./${relativePath}`;
      uniqueFiles.add(importPath);
    }

    const importContent = `/**
* Generated file - do not edit
* 
* This file contains dependencies for DI auto wiring mechanism to work
* (generate anew by running DI transformation)
* 
* Supports: Interface-based, Class-based, Inheritance-based, and State-based DI
* Config: ${this.configManager.getConfigHash()}
* Generated: ${new Date().toISOString()}
*/
${Array.from(uniqueFiles)
  .map((importPath) => `import "${importPath}"`)
  .join("\n")}
`;

    // Write import file to config directory
    const importFilePath = path.join(
      this.configManager.getConfigDir(),
      "di.generated.ts"
    );
    await fs.promises.writeFile(importFilePath, importContent, "utf8");

    // Also create a bridge file for easier importing
    const bridgeContent = `// Auto-generated bridge file for imports
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}

export * from '${path
      .relative(this.configManager.getBridgeDir(), importFilePath)
      .replace(/\\/g, "/")}';
`;

    const bridgeImportPath = path.join(
      this.configManager.getBridgeDir(),
      "di-imports.ts"
    );
    await fs.promises.writeFile(bridgeImportPath, bridgeContent, "utf8");
  }

  private generateFactoryName(className: string): string {
    return `create${className}`;
  }

  private topologicalSort(): DIConfiguration[] {
    const sorted: DIConfiguration[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (token: string) => {
      if (visiting.has(token)) {
        throw new Error(`Circular dependency detected involving: ${token}`);
      }

      if (visited.has(token)) {
        return;
      }

      const config = this.configurations.get(token);
      if (!config) {
        // Better error message showing available configurations
        const availableTokens = Array.from(this.configurations.keys());
        console.error(
          `❌ Available configurations: ${availableTokens.join(", ")}`
        );
        throw new Error(
          `Configuration not found for token: ${token}. Available: ${availableTokens
            .slice(0, 3)
            .join(", ")}...`
        );
      }

      visiting.add(token);

      // Visit dependencies first
      for (const depToken of config.dependencies) {
        // Ensure dependency exists before visiting
        if (this.configurations.has(depToken)) {
          visit(depToken);
        } else {
          // This is a missing dependency - should have been caught in validation
          console.warn(`⚠️  Dependency ${depToken} not found for ${token}`);
          // For now, continue without this dependency (it might be optional)
        }
      }

      visiting.delete(token);
      visited.add(token);
      sorted.push(config);
    };

    // Visit all configurations
    for (const token of this.configurations.keys()) {
      if (!visited.has(token)) {
        try {
          visit(token);
        } catch (error) {
          console.error(`❌ Failed to sort configuration for ${token}:`, error);
          throw error;
        }
      }
    }

    return sorted;
  }

  // Debug methods
  getDependencyTree(): any[] {
    return this.interfaceResolver.getDependencyTree();
  }

  getConfigurations(): Map<string, DIConfiguration> {
    return this.configurations;
  }

  getInterfaceResolver(): InterfaceResolver {
    return this.interfaceResolver;
  }

  getServiceClasses(): Map<string, ServiceClass> {
    return this.serviceClasses;
  }

  getInheritanceInfo(): {
    baseClasses: string[];
    implementations: Map<string, string[]>;
    chains: Map<string, string[]>;
  } {
    const baseClasses = new Set<string>();
    const implementations = new Map<string, string[]>();
    const chains = new Map<string, string[]>();

    for (const [className, serviceClass] of this.serviceClasses) {
      for (const registration of serviceClass.registrations) {
        if (
          registration.type === "inheritance" &&
          registration.metadata?.baseClass
        ) {
          const baseClass = registration.metadata.baseClass;
          baseClasses.add(baseClass);

          if (!implementations.has(baseClass)) {
            implementations.set(baseClass, []);
          }
          if (!implementations.get(baseClass)!.includes(className)) {
            implementations.get(baseClass)!.push(className);
          }

          if (registration.metadata.inheritanceChain) {
            chains.set(className, registration.metadata.inheritanceChain);
          }
        }
      }
    }

    return {
      baseClasses: Array.from(baseClasses),
      implementations,
      chains,
    };
  }
}
