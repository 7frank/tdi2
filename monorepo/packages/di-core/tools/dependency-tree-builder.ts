// tools/dependency-tree-builder.ts - REFACTORED to use shared logic

import { ConfigManager } from "./config-manager";
import * as path from "path";
import * as fs from "fs";

// Use shared components instead of local interface resolver
import { SharedDependencyExtractor } from "./shared/SharedDependencyExtractor";
import { SharedServiceRegistry } from "./shared/SharedServiceRegistry";
import { SharedTypeResolver } from "./shared/SharedTypeResolver";
import type { 
  TransformationCandidate,
  ServiceClassMetadata 
} from "./shared/shared-types";

import { IntegratedInterfaceResolver } from "./interface-resolver/integrated-interface-resolver";
import type { InterfaceImplementation, ServiceDependency } from "./interface-resolver/interface-resolver-types";

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
  private configManager: ConfigManager;
  private configurations: Map<string, DIConfiguration> = new Map();
  private serviceClasses: Map<string, ServiceClass> = new Map();
  private options: {
    verbose: boolean;
    scanDirs: string[];
    enableInheritanceDI: boolean;
  };

  // Use shared components instead of local interface resolver
  private interfaceResolver: IntegratedInterfaceResolver;
  private dependencyExtractor: SharedDependencyExtractor;
  private serviceRegistry: SharedServiceRegistry;
  private typeResolver: SharedTypeResolver;

  constructor(
    configManager: ConfigManager,
    options: {
      verbose?: boolean;
      scanDirs?: string[];
      enableInheritanceDI?: boolean;
    } = {}
  ) {
    this.configManager = configManager;
    this.options = {
      verbose: false,
      scanDirs: options.scanDirs || ["./src"],
      enableInheritanceDI: true,
      ...options,
    };

    // Initialize interface resolver
    this.interfaceResolver = new IntegratedInterfaceResolver({
      verbose: this.options.verbose,
      scanDirs: this.options.scanDirs,
      enableInheritanceDI: this.options.enableInheritanceDI,
    });

    // Initialize shared components
    this.typeResolver = new SharedTypeResolver(this.interfaceResolver, {
      verbose: this.options.verbose
    });

    this.dependencyExtractor = new SharedDependencyExtractor(this.typeResolver, {
      verbose: this.options.verbose
    });

    this.serviceRegistry = new SharedServiceRegistry(this.configManager, {
      verbose: this.options.verbose
    });
  }

  async buildDependencyTree(): Promise<void> {
    if (this.options.verbose) {
      console.log("🌳 Building dependency tree with shared logic and inheritance support...");
    }

    // Scan project for interfaces, implementations, and inheritance using shared logic
    await this.interfaceResolver.scanProject();

    // Validate dependencies using shared logic
    const validation = this.interfaceResolver.validateDependencies();
    if (!validation.isValid) {
      console.error("❌ Dependency validation failed:");

      // Show detailed information for debugging
      const implementations = this.interfaceResolver.getInterfaceImplementations();
      console.log("Available implementations:", implementations);

      if (validation.missingImplementations.length > 0) {
        console.error("Missing implementations:", validation.missingImplementations);
      }
      if (validation.circularDependencies.length > 0) {
        console.error("Circular dependencies:", validation.circularDependencies);
      }
      throw new Error(
        "Invalid dependency configuration. Fix the issues above before proceeding."
      );
    }

    // Build configurations with deduplication using shared logic
    await this.buildConfigurationsWithSharedLogic();

    // Generate DI configuration file
    await this.generateDIConfiguration();

    // Generate import file
    await this.generateImportFile();

    if (this.options.verbose) {
      console.log(
        `✅ Built dependency tree with ${this.configurations.size} services`
      );
      console.log(`📦 Unique service classes: ${this.serviceClasses.size}`);
    }
  }

  private async buildConfigurationsWithSharedLogic(): Promise<void> {
    const implementations = this.interfaceResolver.getInterfaceImplementations();
    const dependencies = this.interfaceResolver.getServiceDependencies();

    // Step 1: Group all implementations by service class using shared logic
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

    // Step 2: Create service class entries and register with shared registry
    const allImplementations: InterfaceImplementation[] = [];
    const dependencyMap = new Map<string, any[]>();

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
        let type: "interface" | "class" | "inheritance";

        if (impl.isInheritanceBased) {
          token = impl.sanitizedKey;
          type = "inheritance";
        } else if (impl.isClassBased) {
          token = impl.implementationClass;
          type = "class";
        } else {
          token = impl.interfaceName;
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
              isInheritanceBased: impl.isInheritanceBased,
              isClassBased: impl.isClassBased,
            },
          });
        }

        allImplementations.push(impl);
      }

      this.serviceClasses.set(className, serviceClass);

      // Create DI configurations for each token
      for (const registration of serviceClass.registrations) {
        const primaryImpl = serviceInfo.implementations[0];

        const config: DIConfiguration = {
          token: registration.token,
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

      // Extract dependencies for this service class using shared extractor
      const extractedDeps: any[] = []; // Would be populated by shared dependency extractor if needed
      dependencyMap.set(className, extractedDeps);
    }

    // Register all services with shared registry
    this.serviceRegistry.registerServices(allImplementations, dependencyMap);

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
    if (this.options.verbose) {
      console.log("📄 Generating DI configuration using shared registry...");
    }

    // Use shared registry to generate DI configuration
    await this.serviceRegistry.generateDIConfiguration();

    if (this.options.verbose) {
      console.log("✅ DI configuration generated successfully");
    }
  }

  private async generateImportFile(): Promise<void> {
    // Generate import file - use unique service classes only
    const uniqueFiles = new Set<string>();

    for (const [className, serviceClass] of this.serviceClasses) {
      const servicePath = serviceClass.filePath;

      // Find which scanDir this file belongs to for correct relative path
      const absolutePath = path.resolve(servicePath);
      const matchingScanDir = this.options.scanDirs.find((dir: string) =>
        absolutePath.startsWith(path.resolve(dir))
      );
      const baseDir = matchingScanDir ? path.resolve(matchingScanDir) : path.resolve(this.options.scanDirs[0]);

      const relativePath = path
        .relative(baseDir, servicePath)
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
        if (this.configurations.has(depToken)) {
          visit(depToken);
        } else {
          console.warn(`⚠️  Dependency ${depToken} not found for ${token}`);
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

  // Debug methods - delegate to shared components
  getDependencyTree(): any[] {
    return this.interfaceResolver.getDependencyTree();
  }

  getConfigurations(): Map<string, DIConfiguration> {
    return this.configurations;
  }

  getInterfaceResolver(): IntegratedInterfaceResolver {
    return this.interfaceResolver;
  }

  getServiceClasses(): Map<string, ServiceClass> {
    return this.serviceClasses;
  }

  getServiceRegistry(): SharedServiceRegistry {
    return this.serviceRegistry;
  }

  getTypeResolver(): SharedTypeResolver {
    return this.typeResolver;
  }

  getDependencyExtractor(): SharedDependencyExtractor {
    return this.dependencyExtractor;
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

  // Enhanced validation using shared logic
  async validateDependencyTree(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    stats: any;
  }> {
    const interfaceValidation = this.interfaceResolver.validateDependencies();
    const registryValidation = this.serviceRegistry.validateRegistry();

    const errors: string[] = [];
    const warnings: string[] = [];

    // Combine validation results
    if (!interfaceValidation.isValid) {
      errors.push(...interfaceValidation.missingImplementations.map(m => `Missing implementation: ${m}`));
      errors.push(...interfaceValidation.circularDependencies.map(c => `Circular dependency: ${c}`));
    }

    if (!registryValidation.isValid) {
      errors.push(...registryValidation.errors);
    }

    warnings.push(...registryValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: registryValidation.stats
    };
  }
}