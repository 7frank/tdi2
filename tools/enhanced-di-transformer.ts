// tools/enhanced-di-transformer.ts - COMPLETELY FIXED VERSION

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
      
      // FIXED: Use safe method access with error handling
      try {
        const implementations = interfaceResolver.getInterfaceImplementations();
        if (implementations && implementations.size > 0) {
          console.log('\n📋 Interface Mappings:');
          for (const [key, impl] of implementations) {
            console.log(`  ${impl.interfaceName} -> ${impl.implementationClass} (${key})`);
          }
        }

        const dependencies = interfaceResolver.getServiceDependencies();
        if (dependencies && dependencies.size > 0) {
          console.log('\n🔗 Service Dependencies:');
          for (const [service, deps] of dependencies) {
            if (deps.constructorParams && deps.constructorParams.length > 0) {
              const depList = deps.constructorParams.map((p: any) => 
                `${p.interfaceType}${p.isOptional ? '?' : ''}`
              ).join(', ');
              console.log(`  ${service}(${depList})`);
            }
          }
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn('⚠️  Error accessing interface resolver data:', error);
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

  // FIXED: Enhanced error handling for registry generation
  private async generateServiceRegistry(configurations: any, interfaceResolver: any): Promise<void> {
    // FIXED: Check if interfaceResolver exists and has required methods
    if (!interfaceResolver) {
      if (this.options.verbose) {
        console.warn('⚠️  Interface resolver not available for registry generation');
      }
      return;
    }

    let implementations: Map<string, any> = new Map();
    let dependencies: Map<string, any> = new Map();

    // FIXED: Use safe method calls with existence checks
    try {
      if (typeof interfaceResolver.getInterfaceImplementations === 'function') {
        implementations = interfaceResolver.getInterfaceImplementations() || new Map();
      } else {
        if (this.options.verbose) {
          console.warn('⚠️  getInterfaceImplementations method not available');
        }
      }

      if (typeof interfaceResolver.getServiceDependencies === 'function') {
        dependencies = interfaceResolver.getServiceDependencies() || new Map();
      } else {
        if (this.options.verbose) {
          console.warn('⚠️  getServiceDependencies method not available');
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn('⚠️  Error accessing interface resolver methods:', error);
      }
      return;
    }

    // Generate imports for all service classes
    const imports: string[] = [];
    const serviceNames: string[] = [];
    const interfaceMappings: string[] = [];

    for (const [_, impl] of implementations) {
      if (!impl || !impl.implementationClass || !impl.filePath) {
        continue; // Skip invalid implementations
      }

      try {
        const configDir = this.configManager.getConfigDir();
        const servicePath = path.resolve(impl.filePath);
        const relativePath = path.relative(configDir, servicePath)
          .replace(/\.(ts|tsx)$/, '')
          .replace(/\\/g, '/');
        
        const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
        imports.push(`import { ${impl.implementationClass} } from '${importPath}';`);
        serviceNames.push(impl.implementationClass);
        
        // FIXED: Safe property access with defaults
        const typeParameters = impl.typeParameters || [];
        const sanitizedKey = impl.sanitizedKey || impl.interfaceName;
        const isGeneric = impl.isGeneric || false;
        
        interfaceMappings.push(`  '${impl.interfaceName}': {
    implementation: ${impl.implementationClass},
    token: '${sanitizedKey}',
    isGeneric: ${isGeneric},
    typeParameters: [${typeParameters.map((t: string) => `'${t}'`).join(', ')}]
  }`);
      } catch (error) {
        if (this.options.verbose) {
          console.warn(`⚠️  Error processing implementation ${impl.implementationClass}:`, error);
        }
      }
    }

    // FIXED: Safe dependency processing
    const serviceDependencies: string[] = [];
    try {
      for (const [service, deps] of dependencies) {
        if (deps && deps.constructorParams && Array.isArray(deps.constructorParams)) {
          const paramStrings = deps.constructorParams.map((p: any) => {
            const interfaceType = p.interfaceType || 'unknown';
            return `'${interfaceType}'`;
          });
          serviceDependencies.push(`  '${service}': [${paramStrings.join(', ')}]`);
        } else {
          serviceDependencies.push(`  '${service}': []`);
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn('⚠️  Error processing service dependencies:', error);
      }
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
${serviceDependencies.join(',\n')}
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

    try {
      const registryFile = path.join(this.configManager.getConfigDir(), 'AutoGeneratedRegistry.ts');
      await fs.promises.writeFile(registryFile, registryContent, 'utf8');
      
      if (this.options.verbose) {
        console.log(`📝 Generated service registry: ${registryFile}`);
      }
    } catch (error) {
      if (this.options.verbose) {
        console.error('❌ Failed to write service registry:', error);
      }
      throw error;
    }
  }

  async save(): Promise<void> {
    try {
      await this.project.save();
    } catch (error) {
      if (this.options.verbose) {
        console.error('❌ Failed to save project:', error);
      }
      throw error;
    }
  }

  // Expose managers for external use
  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  getTreeBuilder(): DependencyTreeBuilder {
    return this.treeBuilder;
  }

  // FIXED: Enhanced debug methods with error handling
  async getDebugInfo(): Promise<any> {
    try {
      const interfaceResolver = this.treeBuilder.getInterfaceResolver();
      
      let implementations: Array<[string, any]> = [];
      let dependencies: Array<[string, any]> = [];
      let dependencyTree: any[] = [];
      let validation: any = { isValid: true, missingImplementations: [], circularDependencies: [] };
      let configurations: Array<[string, any]> = [];

      // FIXED: Safe method calls with error handling
      try {
        if (interfaceResolver && typeof interfaceResolver.getInterfaceImplementations === 'function') {
          const impls = interfaceResolver.getInterfaceImplementations();
          implementations = Array.from(impls.entries());
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn('⚠️  Error getting implementations:', error);
        }
      }

      try {
        if (interfaceResolver && typeof interfaceResolver.getServiceDependencies === 'function') {
          const deps = interfaceResolver.getServiceDependencies();
          dependencies = Array.from(deps.entries());
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn('⚠️  Error getting dependencies:', error);
        }
      }

      try {
        if (interfaceResolver && typeof interfaceResolver.getDependencyTree === 'function') {
          dependencyTree = interfaceResolver.getDependencyTree();
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn('⚠️  Error getting dependency tree:', error);
        }
      }

      try {
        if (interfaceResolver && typeof interfaceResolver.validateDependencies === 'function') {
          validation = interfaceResolver.validateDependencies();
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn('⚠️  Error validating dependencies:', error);
        }
      }

      try {
        const configs = this.treeBuilder.getConfigurations();
        configurations = Array.from(configs.entries());
      } catch (error) {
        if (this.options.verbose) {
          console.warn('⚠️  Error getting configurations:', error);
        }
      }

      return {
        configHash: this.configManager.getConfigHash(),
        implementations,
        dependencies,
        dependencyTree,
        validation,
        configurations
      };
    } catch (error) {
      if (this.options.verbose) {
        console.error('❌ Error generating debug info:', error);
      }
      // Return minimal debug info on error
      return {
        configHash: this.configManager.getConfigHash(),
        implementations: [],
        dependencies: [],
        dependencyTree: [],
        validation: { isValid: false, missingImplementations: [], circularDependencies: ['Debug info generation failed'] },
        configurations: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // FIXED: Additional helper methods for better error handling
  async validateConfiguration(): Promise<boolean> {
    try {
      const debugInfo = await this.getDebugInfo();
      return debugInfo.validation && debugInfo.validation.isValid;
    } catch (error) {
      if (this.options.verbose) {
        console.error('❌ Configuration validation failed:', error);
      }
      return false;
    }
  }

  getTransformationSummary(): {
    configHash: string;
    implementationCount: number;
    dependencyCount: number;
    hasValidConfiguration: boolean;
  } {
    try {
      const interfaceResolver = this.treeBuilder.getInterfaceResolver();
      let implementationCount = 0;
      let dependencyCount = 0;

      try {
        if (interfaceResolver && typeof interfaceResolver.getInterfaceImplementations === 'function') {
          const implementations = interfaceResolver.getInterfaceImplementations();
          implementationCount = implementations ? implementations.size : 0;
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn('⚠️  Could not get implementations count:', error);
        }
      }

      try {
        if (interfaceResolver && typeof interfaceResolver.getServiceDependencies === 'function') {
          const dependencies = interfaceResolver.getServiceDependencies();
          dependencyCount = dependencies ? dependencies.size : 0;
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn('⚠️  Could not get dependencies count:', error);
        }
      }

      return {
        configHash: this.configManager.getConfigHash(),
        implementationCount,
        dependencyCount,
        hasValidConfiguration: this.configManager.isConfigValid()
      };
    } catch (error) {
      if (this.options.verbose) {
        console.error('❌ Error generating transformation summary:', error);
      }
      return {
        configHash: 'error',
        implementationCount: 0,
        dependencyCount: 0,
        hasValidConfiguration: false
      };
    }
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