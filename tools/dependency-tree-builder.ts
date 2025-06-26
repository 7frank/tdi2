// tools/dependency-tree-builder.ts - Fixed version with proper key handling

import {
  InterfaceResolver,
  InterfaceImplementation,
  ServiceDependency,
} from "./interface-resolver";
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

export class DependencyTreeBuilder {
  private interfaceResolver: InterfaceResolver;
  private configManager: ConfigManager;
  private configurations: Map<string, DIConfiguration> = new Map();
  private options: { verbose: boolean; srcDir: string };

  constructor(
    configManager: ConfigManager,
    options: { verbose?: boolean; srcDir?: string } = {}
  ) {
    this.configManager = configManager;
    this.options = {
      verbose: false,
      srcDir: "./src",
      ...options,
    };

    this.interfaceResolver = new InterfaceResolver({
      verbose: this.options.verbose,
      srcDir: this.options.srcDir,
    });
  }

  async buildDependencyTree(): Promise<void> {
    if (this.options.verbose) {
      console.log("🌳 Building dependency tree...");
    }

    // Scan project for interfaces and implementations
    await this.interfaceResolver.scanProject();

    // Validate dependencies
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

    // Build configurations
    await this.buildConfigurations();

    // Generate DI configuration file
    await this.generateDIConfiguration();

    // Generate import file (like di.generated.ts)
    await this.generateImportFile();

    if (this.options.verbose) {
      console.log(
        `✅ Built dependency tree with ${this.configurations.size} services`
      );
    }
  }

  private async buildConfigurations(): Promise<void> {
    const implementations = this.interfaceResolver.getInterfaceImplementations();
    const dependencies = this.interfaceResolver.getServiceDependencies();

    // FIXED: Group implementations by interface name to handle multiple implementations
    const implementationsByInterface = new Map<string, InterfaceImplementation[]>();
    
    for (const [uniqueKey, implementation] of implementations) {
      const interfaceKey = implementation.sanitizedKey;
      if (!implementationsByInterface.has(interfaceKey)) {
        implementationsByInterface.set(interfaceKey, []);
      }
      implementationsByInterface.get(interfaceKey)!.push(implementation);
    }

    // FIXED: Create configurations using interface names as tokens
    for (const [interfaceKey, impls] of implementationsByInterface) {
      // For multiple implementations, choose the first one (or implement @Primary logic later)
      const chosenImpl = impls[0];
      
      if (impls.length > 1 && this.options.verbose) {
        console.log(`⚠️  Multiple implementations for ${interfaceKey}:`);
        impls.forEach(impl => 
          console.log(`   - ${impl.implementationClass}${impl === chosenImpl ? ' (chosen)' : ''}`)
        );
      }

      const dependency = dependencies.get(chosenImpl.implementationClass);
      const dependencyTokens = dependency ? dependency.interfaceDependencies : [];

      const config: DIConfiguration = {
        token: interfaceKey, // FIXED: Use interface name as token for lookups
        implementation: chosenImpl,
        dependencies: dependencyTokens,
        factory: this.generateFactoryName(chosenImpl.implementationClass),
        scope: "singleton", // Default scope
      };

      // FIXED: Store by interface name (token) for easy lookup during topological sort
      this.configurations.set(interfaceKey, config);

      if (this.options.verbose) {
        console.log(`🔧 Config: ${interfaceKey} -> ${chosenImpl.implementationClass}`);
        if (dependencyTokens.length > 0) {
          console.log(`   Dependencies: ${dependencyTokens.join(", ")}`);
        }
      }
    }
  }

  private async generateDIConfiguration(): Promise<void> {
    const imports: string[] = [];
    const factories: string[] = [];
    const diMapEntries: string[] = [];

    // Sort configurations to handle dependency order
    const sortedConfigs = this.topologicalSort();

    for (const config of sortedConfigs) {
      // Generate import
      const configDir = this.configManager.getConfigDir();
      const servicePath = path.resolve(config.implementation.filePath);
      const relativePath = path
        .relative(configDir, servicePath)
        .replace(/\.(ts|tsx)$/, "")
        .replace(/\\/g, "/");

      const importPath = relativePath.startsWith(".")
        ? relativePath
        : `./${relativePath}`;
      imports.push(
        `import { ${config.implementation.implementationClass} } from '${importPath}';`
      );

      // Generate factory function
      const factoryCode = this.generateFactoryFunction(config);
      factories.push(factoryCode);

      // Generate DI map entry
      diMapEntries.push(`  '${config.token}': {
    factory: ${config.factory},
    scope: '${config.scope}',
    dependencies: [${config.dependencies.map((dep) => `'${dep}'`).join(", ")}],
    interfaceName: '${config.implementation.interfaceName}',
    implementationClass: '${config.implementation.implementationClass}',
    isAutoResolved: true
  }`);
    }

    // Generate the complete DI configuration file
    const configContent = `// Auto-generated DI configuration - Interface-based resolution
// Do not edit this file manually
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}

${imports.join("\n")}

// Factory functions
${factories.join("\n\n")}

// DI Configuration Map
export const DI_CONFIG = {
${diMapEntries.join(",\n")}
};

// Interface to Implementation mapping (for debugging)
export const INTERFACE_MAPPING = {
${Array.from(this.configurations.values())
  .map(
    (config) =>
      `  '${config.implementation.interfaceName}': '${config.implementation.implementationClass}'`
  )
  .join(",\n")}
};

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

  private async generateImportFile(): Promise<void> {
    // Generate import file similar to di.generated.ts
    const sortedConfigs = this.topologicalSort();
    const uniqueFiles = new Set<string>();

    for (const config of sortedConfigs) {
      const servicePath = config.implementation.filePath;
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

  private generateFactoryFunction(config: DIConfiguration): string {
    const dependencies = this.interfaceResolver.getServiceDependencies();
    const dependency = dependencies.get(
      config.implementation.implementationClass
    );

    if (!dependency || dependency.constructorParams.length === 0) {
      // No constructor dependencies
      return `function ${config.factory}(container: any) {
  return () => {
    return new ${config.implementation.implementationClass}();
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

    return `function ${config.factory}(container: any) {
  return () => {
${dependencyResolves}
    return new ${config.implementation.implementationClass}(${constructorArgs});
  };
}`;
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
        // FIXED: Better error message showing available configurations
        const availableTokens = Array.from(this.configurations.keys());
        console.error(`❌ Available configurations: ${availableTokens.join(', ')}`);
        throw new Error(`Configuration not found for token: ${token}. Available: ${availableTokens.slice(0, 3).join(', ')}...`);
      }

      visiting.add(token);

      // Visit dependencies first
      for (const depToken of config.dependencies) {
        // FIXED: Ensure dependency exists before visiting
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
}