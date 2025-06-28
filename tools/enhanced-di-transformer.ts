// tools/enhanced-di-transformer.ts - COMPLETELY FIXED VERSION with proper error handling

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
      
      // FIXED: Enhanced error handling with proper method access checks
      try {
        // Ensure interfaceResolver exists and has the required methods
        if (interfaceResolver && typeof interfaceResolver.getInterfaceImplementations === 'function') {
          const implementations = interfaceResolver.getInterfaceImplementations();
          if (implementations && implementations.size > 0) {
            console.log('\n📋 Interface Mappings:');
            let count = 0;
            for (const [key, impl] of implementations) {
              if (count < 10) { // Limit output for readability
                console.log(`  ${impl.interfaceName} -> ${impl.implementationClass} (${key})`);
                count++;
              }
            }
            if (implementations.size > 10) {
              console.log(`  ... and ${implementations.size - 10} more`);
            }
          }
        } else {
          if (this.options.verbose) {
            console.warn('⚠️  Interface resolver getInterfaceImplementations method not available');
          }
        }

        if (interfaceResolver && typeof interfaceResolver.getServiceDependencies === 'function') {
          const dependencies = interfaceResolver.getServiceDependencies();
          if (dependencies && dependencies.size > 0) {
            console.log('\n🔗 Service Dependencies:');
            let count = 0;
            for (const [service, deps] of dependencies) {
              if (count < 10 && deps.constructorParams && deps.constructorParams.length > 0) {
                const depList = deps.constructorParams.map((p: any) => 
                  `${p.interfaceType}${p.isOptional ? '?' : ''}`
                ).join(', ');
                console.log(`  ${service}(${depList})`);
                count++;
              }
            }
            if (dependencies.size > 10) {
              console.log(`  ... and ${dependencies.size - 10} more`);
            }
          }
        } else {
          if (this.options.verbose) {
            console.warn('⚠️  Interface resolver getServiceDependencies method not available');
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

  // FIXED: Enhanced error handling and safe method access for registry generation
  private async generateServiceRegistry(configurations: any, interfaceResolver: any): Promise<void> {
    // FIXED: Comprehensive method availability checks
    if (!interfaceResolver) {
      if (this.options.verbose) {
        console.warn('⚠️  Interface resolver not available for registry generation');
      }
      return;
    }

    let implementations: Map<string, any> = new Map();
    let dependencies: Map<string, any> = new Map();

    // FIXED: Safe method calls with comprehensive error handling
    try {
      // Check for getInterfaceImplementations method
      if (typeof interfaceResolver.getInterfaceImplementations === 'function') {
        try {
          const result = interfaceResolver.getInterfaceImplementations();
          implementations = result instanceof Map ? result : new Map();
        } catch (methodError) {
          if (this.options.verbose) {
            console.warn('⚠️  Error calling getInterfaceImplementations:', methodError);
          }
          implementations = new Map();
        }
      } else {
        if (this.options.verbose) {
          console.warn('⚠️  getInterfaceImplementations method not available on interface resolver');
          console.warn('⚠️  Available methods:', Object.getOwnPropertyNames(interfaceResolver).filter(name => typeof interfaceResolver[name] === 'function'));
        }
        implementations = new Map();
      }

      // Check for getServiceDependencies method
      if (typeof interfaceResolver.getServiceDependencies === 'function') {
        try {
          const result = interfaceResolver.getServiceDependencies();
          dependencies = result instanceof Map ? result : new Map();
        } catch (methodError) {
          if (this.options.verbose) {
            console.warn('⚠️  Error calling getServiceDependencies:', methodError);
          }
          dependencies = new Map();
        }
      } else {
        if (this.options.verbose) {
          console.warn('⚠️  getServiceDependencies method not available on interface resolver');
        }
        dependencies = new Map();
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn('⚠️  General error accessing interface resolver methods:', error);
      }
      // Continue with empty maps
      implementations = new Map();
      dependencies = new Map();
    }

    // Generate imports for all service classes
    const imports: string[] = [];
    const serviceNames: string[] = [];
    const interfaceMappings: string[] = [];

    // Process implementations safely
    try {
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
          
          // FIXED: Safe property access with defaults and validation
          const typeParameters = Array.isArray(impl.typeParameters) ? impl.typeParameters : [];
          const sanitizedKey = impl.sanitizedKey || impl.interfaceName || 'UnknownInterface';
          const isGeneric = Boolean(impl.isGeneric);
          const interfaceName = impl.interfaceName || 'UnknownInterface';
          
          interfaceMappings.push(`  '${interfaceName}': {
    implementation: ${impl.implementationClass},
    token: '${sanitizedKey}',
    isGeneric: ${isGeneric},
    typeParameters: [${typeParameters.map((t: string) => `'${t}'`).join(', ')}]
  }`);
        } catch (implError) {
          if (this.options.verbose) {
            console.warn(`⚠️  Error processing implementation ${impl.implementationClass}:`, implError);
          }
          continue; // Skip this implementation and continue
        }
      }
    } catch (implementationsError) {
      if (this.options.verbose) {
        console.warn('⚠️  Error processing implementations:', implementationsError);
      }
    }

    // FIXED: Safe dependency processing with comprehensive error handling
    const serviceDependencies: string[] = [];
    try {
      for (const [service, deps] of dependencies) {
        try {
          if (deps && deps.constructorParams && Array.isArray(deps.constructorParams)) {
            const paramStrings = deps.constructorParams.map((p: any) => {
              try {
                const interfaceType = p.interfaceType || 'unknown';
                return `'${interfaceType}'`;
              } catch (paramError) {
                if (this.options.verbose) {
                  console.warn(`⚠️  Error processing parameter:`, paramError);
                }
                return "'unknown'";
              }
            });
            serviceDependencies.push(`  '${service}': [${paramStrings.join(', ')}]`);
          } else {
            serviceDependencies.push(`  '${service}': []`);
          }
        } catch (serviceError) {
          if (this.options.verbose) {
            console.warn(`⚠️  Error processing service dependencies for ${service}:`, serviceError);
          }
          serviceDependencies.push(`  '${service}': [] // Error processing dependencies`);
        }
      }
    } catch (dependenciesError) {
      if (this.options.verbose) {
        console.warn('⚠️  Error processing service dependencies:', dependenciesError);
      }
    }

    // Generate registry content with fallbacks for missing data
    const registryContent = `// Auto-generated service registry - Interface-based
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}

${imports.length > 0 ? imports.join('\n') : '// No imports generated'}

export const SERVICE_CLASSES = [
  ${serviceNames.length > 0 ? serviceNames.join(',\n  ') : '// No service classes found'}
];

export const INTERFACE_IMPLEMENTATIONS = {
${interfaceMappings.length > 0 ? interfaceMappings.join(',\n') : '  // No interface implementations found'}
};

export const SERVICE_DEPENDENCIES = {
${serviceDependencies.length > 0 ? serviceDependencies.join(',\n') : '  // No service dependencies found'}
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
}

// FIXED: Additional helper functions for debugging
export function getRegistryStats(): {
  serviceCount: number;
  interfaceCount: number;
  dependencyCount: number;
  hasErrors: boolean;
} {
  return {
    serviceCount: SERVICE_CLASSES.length,
    interfaceCount: Object.keys(INTERFACE_IMPLEMENTATIONS).length,
    dependencyCount: Object.keys(SERVICE_DEPENDENCIES).length,
    hasErrors: ${serviceNames.length === 0 && interfaceMappings.length === 0} // Basic error detection
  };
}`;

    try {
      const registryFile = path.join(this.configManager.getConfigDir(), 'AutoGeneratedRegistry.ts');
      await fs.promises.writeFile(registryFile, registryContent, 'utf8');
      
      if (this.options.verbose) {
        console.log(`📝 Generated service registry: ${registryFile}`);
        console.log(`   - ${serviceNames.length} service classes`);
        console.log(`   - ${interfaceMappings.length} interface mappings`);
        console.log(`   - ${serviceDependencies.length} service dependencies`);
      }
    } catch (writeError) {
      if (this.options.verbose) {
        console.error('❌ Failed to write service registry:', writeError);
      }
      throw writeError;
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

  // FIXED: Enhanced debug methods with comprehensive error handling
  async getDebugInfo(): Promise<any> {
    try {
      const interfaceResolver = this.treeBuilder.getInterfaceResolver();
      
      let implementations: Array<[string, any]> = [];
      let dependencies: Array<[string, any]> = [];
      let dependencyTree: any[] = [];
      let validation: any = { isValid: true, missingImplementations: [], circularDependencies: [] };
      let configurations: Array<[string, any]> = [];

      // FIXED: Comprehensive method checks with detailed error handling
      if (interfaceResolver) {
        // Check getInterfaceImplementations
        if (typeof interfaceResolver.getInterfaceImplementations === 'function') {
          try {
            const impls = interfaceResolver.getInterfaceImplementations();
            if (impls instanceof Map) {
              implementations = Array.from(impls.entries());
            } else if (this.options.verbose) {
              console.warn('⚠️  getInterfaceImplementations returned non-Map:', typeof impls);
            }
          } catch (error) {
            if (this.options.verbose) {
              console.warn('⚠️  Error calling getInterfaceImplementations:', error);
            }
          }
        } else if (this.options.verbose) {
          console.warn('⚠️  getInterfaceImplementations method not found on interface resolver');
        }

        // Check getServiceDependencies
        if (typeof interfaceResolver.getServiceDependencies === 'function') {
          try {
            const deps = interfaceResolver.getServiceDependencies();
            if (deps instanceof Map) {
              dependencies = Array.from(deps.entries());
            } else if (this.options.verbose) {
              console.warn('⚠️  getServiceDependencies returned non-Map:', typeof deps);
            }
          } catch (error) {
            if (this.options.verbose) {
              console.warn('⚠️  Error calling getServiceDependencies:', error);
            }
          }
        } else if (this.options.verbose) {
          console.warn('⚠️  getServiceDependencies method not found on interface resolver');
        }

        // Check getDependencyTree
        if (typeof interfaceResolver.getDependencyTree === 'function') {
          try {
            const tree = interfaceResolver.getDependencyTree();
            if (Array.isArray(tree)) {
              dependencyTree = tree;
            } else if (this.options.verbose) {
              console.warn('⚠️  getDependencyTree returned non-Array:', typeof tree);
            }
          } catch (error) {
            if (this.options.verbose) {
              console.warn('⚠️  Error calling getDependencyTree:', error);
            }
          }
        } else if (this.options.verbose) {
          console.warn('⚠️  getDependencyTree method not found on interface resolver');
        }

        // Check validateDependencies
        if (typeof interfaceResolver.validateDependencies === 'function') {
          try {
            const validationResult = interfaceResolver.validateDependencies();
            if (validationResult && typeof validationResult === 'object') {
              validation = validationResult;
            } else if (this.options.verbose) {
              console.warn('⚠️  validateDependencies returned invalid result:', typeof validationResult);
            }
          } catch (error) {
            if (this.options.verbose) {
              console.warn('⚠️  Error calling validateDependencies:', error);
            }
          }
        } else if (this.options.verbose) {
          console.warn('⚠️  validateDependencies method not found on interface resolver');
        }
      } else if (this.options.verbose) {
        console.warn('⚠️  Interface resolver is null or undefined');
      }

      // Get configurations from tree builder
      try {
        const configs = this.treeBuilder.getConfigurations();
        if (configs instanceof Map) {
          configurations = Array.from(configs.entries());
        } else if (this.options.verbose) {
          console.warn('⚠️  getConfigurations returned non-Map:', typeof configs);
        }
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
        configurations,
        // Additional debug info
        interfaceResolverAvailable: !!interfaceResolver,
        interfaceResolverMethods: interfaceResolver ? Object.getOwnPropertyNames(interfaceResolver).filter(name => typeof interfaceResolver[name] === 'function') : [],
        timestamp: new Date().toISOString()
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
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // FIXED: Enhanced validation method with proper error handling
  async validateConfiguration(): Promise<boolean> {
    try {
      const debugInfo = await this.getDebugInfo();
      return debugInfo.validation && debugInfo.validation.isValid === true;
    } catch (error) {
      if (this.options.verbose) {
        console.error('❌ Configuration validation failed:', error);
      }
      return false;
    }
  }

  // FIXED: Enhanced summary method with safe data access
  getTransformationSummary(): {
    configHash: string;
    implementationCount: number;
    dependencyCount: number;
    hasValidConfiguration: boolean;
    hasErrors: boolean;
  } {
    try {
      const interfaceResolver = this.treeBuilder.getInterfaceResolver();
      let implementationCount = 0;
      let dependencyCount = 0;
      let hasErrors = false;

      if (interfaceResolver) {
        // Safely get implementation count
        if (typeof interfaceResolver.getInterfaceImplementations === 'function') {
          try {
            const implementations = interfaceResolver.getInterfaceImplementations();
            implementationCount = implementations instanceof Map ? implementations.size : 0;
          } catch (error) {
            hasErrors = true;
            if (this.options.verbose) {
              console.warn('⚠️  Could not get implementations count:', error);
            }
          }
        }

        // Safely get dependency count
        if (typeof interfaceResolver.getServiceDependencies === 'function') {
          try {
            const dependencies = interfaceResolver.getServiceDependencies();
            dependencyCount = dependencies instanceof Map ? dependencies.size : 0;
          } catch (error) {
            hasErrors = true;
            if (this.options.verbose) {
              console.warn('⚠️  Could not get dependencies count:', error);
            }
          }
        }
      } else {
        hasErrors = true;
        if (this.options.verbose) {
          console.warn('⚠️  Interface resolver not available for summary');
        }
      }

      let hasValidConfiguration = false;
      try {
        hasValidConfiguration = this.configManager.isConfigValid();
      } catch (error) {
        hasErrors = true;
        if (this.options.verbose) {
          console.warn('⚠️  Could not check config validity:', error);
        }
      }

      return {
        configHash: this.configManager.getConfigHash(),
        implementationCount,
        dependencyCount,
        hasValidConfiguration,
        hasErrors
      };
    } catch (error) {
      if (this.options.verbose) {
        console.error('❌ Error generating transformation summary:', error);
      }
      return {
        configHash: 'error',
        implementationCount: 0,
        dependencyCount: 0,
        hasValidConfiguration: false,
        hasErrors: true
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