// tools/enhanced-di-transformer.ts - Interface-based DI transformer

import { 
  Project, 
  SourceFile, 
  ClassDeclaration, 
  PropertyDeclaration, 
  ParameterDeclaration,
  SyntaxKind,
  Node
} from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigManager } from './config-manager';
import { DependencyTreeBuilder } from './dependency-tree-builder';

interface TransformerOptions {
  srcDir?: string;
  outputDir?: string;
  verbose?: boolean;
  generateRegistry?: boolean;
  enableInterfaceResolution?: boolean;
  customSuffix?: string;
}

export class EnhancedDITransformer {
  private project: Project;
  private options: TransformerOptions;
  private configManager: ConfigManager;
  private treeBuilder: DependencyTreeBuilder;

  constructor(options: TransformerOptions = {}) {
    this.options = {
      srcDir: './src',
      outputDir: './src/generated', // Will be overridden by ConfigManager
      verbose: false,
      generateRegistry: true,
      enableInterfaceResolution: true,
      ...options
    };

    this.project = new Project({
      tsConfigFilePath: './tsconfig.json'
    });

    // Initialize ConfigManager
    this.configManager = new ConfigManager({
      srcDir: this.options.srcDir!,
      outputDir: this.options.outputDir!,
      enableFunctionalDI: false, // This transformer focuses on class-based DI
      verbose: this.options.verbose!,
      customSuffix: this.options.customSuffix
    });

    // Initialize DependencyTreeBuilder
    this.treeBuilder = new DependencyTreeBuilder(this.configManager, {
      verbose: this.options.verbose,
      srcDir: this.options.srcDir
    });
  }

  async transform(): Promise<void> {
    if (this.options.verbose) {
      console.log('🚀 Starting enhanced DI transformation with interface resolution...');
    }

    if (this.options.enableInterfaceResolution) {
      // Use interface-based resolution
      await this.transformWithInterfaceResolution();
    } else {
      // Fall back to token-based resolution
      await this.transformWithTokenResolution();
    }

    // Generate bridge files
    this.configManager.generateBridgeFiles();

    if (this.options.verbose) {
      console.log('✅ Enhanced DI transformation completed');
      console.log(`🏗️  Config: ${this.configManager.getConfigHash()}`);
      console.log(`📁 Config dir: ${this.configManager.getConfigDir()}`);
      console.log(`🌉 Bridge dir: ${this.configManager.getBridgeDir()}`);
    }
  }

  private async transformWithInterfaceResolution(): Promise<void> {
    if (this.options.verbose) {
      console.log('🔍 Using interface-based dependency resolution...');
    }

    // Build dependency tree and generate configuration
    await this.treeBuilder.buildDependencyTree();

    // Get resolved configurations
    const configurations = this.treeBuilder.getConfigurations();
    const interfaceResolver = this.treeBuilder.getInterfaceResolver();

    if (this.options.generateRegistry) {
      await this.generateServiceRegistry(configurations, interfaceResolver);
    }

    if (this.options.verbose) {
      console.log(`✅ Generated interface-based DI for ${configurations.size} services`);
      
      // Debug output
      const implementations = interfaceResolver.getInterfaceImplementations();
      console.log('\n📋 Interface Mappings:');
      for (const [key, impl] of implementations) {
        console.log(`  ${impl.interfaceName} -> ${impl.implementationClass} (${key})`);
      }

      const dependencies = interfaceResolver.getServiceDependencies();
      console.log('\n🔗 Service Dependencies:');
      for (const [service, deps] of dependencies) {
        if (deps.constructorParams.length > 0) {
          const depList = deps.constructorParams.map(p => 
            `${p.interfaceType}${p.isOptional ? '?' : ''}`
          ).join(', ');
          console.log(`  ${service}(${depList})`);
        }
      }
    }
  }

  private async transformWithTokenResolution(): Promise<void> {
    if (this.options.verbose) {
      console.log('🏷️  Using token-based dependency resolution...');
    }

    // This would be the fallback to the original token-based approach
    // For now, we'll throw an error to encourage interface-based usage
    throw new Error('Token-based resolution not implemented in enhanced transformer. Use enableInterfaceResolution: true');
  }

  private async generateServiceRegistry(configurations: any, interfaceResolver: any): Promise<void> {
    const implementations = interfaceResolver.getInterfaceImplementations();
    const dependencies = interfaceResolver.getServiceDependencies();

    // Generate imports for all service classes
    const imports: string[] = [];
    const serviceNames: string[] = [];
    const interfaceMappings: string[] = [];

    for (const [_, impl] of implementations) {
      const configDir = this.configManager.getConfigDir();
      const servicePath = path.resolve(impl.filePath);
      const relativePath = path.relative(configDir, servicePath)
        .replace(/\.(ts|tsx)$/, '')
        .replace(/\\/g, '/');
      
      const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      imports.push(`import { ${impl.implementationClass} } from '${importPath}';`);
      serviceNames.push(impl.implementationClass);
      
      interfaceMappings.push(`  '${impl.interfaceName}': {
    implementation: ${impl.implementationClass},
    token: '${impl.sanitizedKey}',
    isGeneric: ${impl.isGeneric},
    typeParameters: [${impl.typeParameters.map(t => `'${t}'`).join(', ')}]
  }`);
    }

    const registryContent = `// Auto-generated service registry - Interface-based
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}

${imports.join('\n')}

export const SERVICE_CLASSES = [
  ${serviceNames.join(',\n  ')}
];

export const INTERFACE_IMPLEMENTATIONS = {
${interfaceMappings.join(',\n')}
};

export const SERVICE_DEPENDENCIES = {
${Array.from(dependencies.entries()).map(([service, deps]) => 
  `  '${service}': [${deps.constructorParams.map(p => `'${p.interfaceType}'`).join(', ')}]`
).join(',\n')}
};

// Helper function to get implementation for interface
export function getImplementationForInterface(interfaceName: string): any {
  const mapping = INTERFACE_IMPLEMENTATIONS[interfaceName];
  return mapping ? mapping.implementation : null;
}

// Helper function to get all implementations
export function getAllImplementations(): { [key: string]: any } {
  const result: { [key: string]: any } = {};
  for (const [interfaceName, mapping] of Object.entries(INTERFACE_IMPLEMENTATIONS)) {
    result[interfaceName] = (mapping as any).implementation;
  }
  return result;
}`;

    const registryFile = path.join(this.configManager.getConfigDir(), 'AutoGeneratedRegistry.ts');
    await fs.promises.writeFile(registryFile, registryContent, 'utf8');
  }

  async save(): Promise<void> {
    await this.project.save();
  }

  // Expose managers for external use
  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  getTreeBuilder(): DependencyTreeBuilder {
    return this.treeBuilder;
  }

  // Debug methods
  async getDebugInfo(): Promise<any> {
    const interfaceResolver = this.treeBuilder.getInterfaceResolver();
    
    return {
      configHash: this.configManager.getConfigHash(),
      implementations: Array.from(interfaceResolver.getInterfaceImplementations().entries()),
      dependencies: Array.from(interfaceResolver.getServiceDependencies().entries()),
      dependencyTree: interfaceResolver.getDependencyTree(),
      validation: interfaceResolver.validateDependencies(),
      configurations: Array.from(this.treeBuilder.getConfigurations().entries())
    };
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const transformer = new EnhancedDITransformer({ 
    verbose: true,
    srcDir: './src',
    enableInterfaceResolution: true
  });
  
  transformer.transform()
    .then(() => transformer.save())
    .then(() => console.log('✅ Enhanced DI transformation completed successfully'))
    .catch(error => {
      console.error('❌ Enhanced DI transformation failed:', error);
      process.exit(1);
    });
}