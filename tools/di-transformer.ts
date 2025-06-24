// tools/di-transformer.ts - Updated with ConfigManager support

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

interface ServiceInfo {
  className: string;
  token: string;
  scope: string;
  filePath: string;
  dependencies: DependencyInfo[];
  properties: PropertyInfo[];
}

interface DependencyInfo {
  token: string;
  parameterIndex: number;
  type: string;
}

interface PropertyInfo {
  name: string;
  token: string;
  type: string;
}

interface TransformerOptions {
  srcDir?: string;
  outputDir?: string;
  verbose?: boolean;
  generateRegistry?: boolean;
  enableFunctionalDI?: boolean;
  customSuffix?: string;
}

export class DITransformer {
  private project: Project;
  private options: TransformerOptions;
  private services: Map<string, ServiceInfo> = new Map();
  private tokenMap: Map<string, string> = new Map(); // identifier -> actual token
  private configManager: ConfigManager;

  constructor(options: TransformerOptions = {}) {
    this.options = {
      srcDir: './src',
      outputDir: './src/generated', // This will be overridden by ConfigManager
      verbose: false,
      generateRegistry: true,
      enableFunctionalDI: false, // Disable functional DI in main transformer
      ...options
    };

    this.project = new Project({
      tsConfigFilePath: './tsconfig.json'
    });

    // Initialize ConfigManager
    this.configManager = new ConfigManager({
      srcDir: this.options.srcDir!,
      outputDir: this.options.outputDir!,
      enableFunctionalDI: this.options.enableFunctionalDI!,
      verbose: this.options.verbose!,
      customSuffix: this.options.customSuffix
    });
  }

  async transform(): Promise<void> {
    // Ensure config directory exists (handled by ConfigManager)
    
    // Add source files
    this.project.addSourceFilesAtPaths(`${this.options.srcDir}/**/*.{ts,tsx}`);

    // First pass: collect token exports
    await this.collectTokenExports();

    // Second pass: collect all service information
    await this.collectServices();

    // Third pass: generate DI configuration
    await this.generateDIConfiguration();

    if (this.options.generateRegistry) {
      await this.generateServiceRegistry();
    }

    // Generate bridge files
    this.configManager.generateBridgeFiles();

    if (this.options.verbose) {
      console.log(`✅ Processed ${this.services.size} class-based services`);
      console.log('📋 Registered tokens:', Array.from(this.services.keys()));
      console.log(`🏗️  Config directory: ${this.configManager.getConfigDir()}`);
    }
  }

  private async collectTokenExports(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      // Look for exported token constants
      const variableStatements = sourceFile.getVariableStatements();
      
      for (const varStatement of variableStatements) {
        if (varStatement.isExported()) {
          const declarations = varStatement.getDeclarations();
          for (const declaration of declarations) {
            const name = declaration.getName();
            const initializer = declaration.getInitializer();
            
            if (initializer && Node.isStringLiteral(initializer)) {
              this.tokenMap.set(name, initializer.getLiteralValue());
            } else if (initializer && Node.isNoSubstitutionTemplateLiteral(initializer)) {
              this.tokenMap.set(name, initializer.getLiteralValue());
            } else if (name.endsWith('_TOKEN')) {
              // Fallback: use the variable name as token
              this.tokenMap.set(name, name);
            }
          }
        }
      }
    }

    if (this.options.verbose) {
      console.log('🏷️  Discovered tokens:', Object.fromEntries(this.tokenMap));
    }
  }

  private async collectServices(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();
      
      for (const classDecl of classes) {
        const serviceInfo = this.extractServiceInfo(classDecl, sourceFile);
        if (serviceInfo) {
          this.services.set(serviceInfo.token, serviceInfo);
        }
      }
    }
  }

  private extractServiceInfo(classDecl: ClassDeclaration, sourceFile: SourceFile): ServiceInfo | null {
    const serviceDecorator = classDecl.getDecorator('Service');
    if (!serviceDecorator) {
      return null;
    }

    const className = classDecl.getName();
    if (!className) {
      return null;
    }

    // Extract service options from decorator
    let token = className;
    let scope = 'singleton';
    
    const decoratorArgs = serviceDecorator.getArguments();
    if (decoratorArgs.length > 0) {
      const optionsArg = decoratorArgs[0];
      if (Node.isObjectLiteralExpression(optionsArg)) {
        const tokenProp = optionsArg.getProperty('token');
        const scopeProp = optionsArg.getProperty('scope');
        
        if (tokenProp && Node.isPropertyAssignment(tokenProp)) {
          const tokenValue = tokenProp.getInitializer();
          if (Node.isStringLiteral(tokenValue)) {
            token = tokenValue.getLiteralValue();
          } else if (Node.isIdentifier(tokenValue)) {
            const tokenName = tokenValue.getText();
            token = this.tokenMap.get(tokenName) || tokenName;
          }
        }
        
        if (scopeProp && Node.isPropertyAssignment(scopeProp)) {
          const scopeValue = scopeProp.getInitializer();
          if (Node.isStringLiteral(scopeValue)) {
            scope = scopeValue.getLiteralValue();
          }
        }
      }
    }

    // Extract constructor dependencies
    const dependencies: DependencyInfo[] = [];
    const constructors = classDecl.getConstructors();
    
    if (constructors.length > 0) {
      const constructor = constructors[0];
      const parameters = constructor.getParameters();
      
      parameters.forEach((param, index) => {
        const dependency = this.extractDependencyInfo(param, index);
        if (dependency) {
          dependencies.push(dependency);
        }
      });
    }

    // Extract property injections
    const properties: PropertyInfo[] = [];
    const classProperties = classDecl.getProperties();
    
    for (const prop of classProperties) {
      const propInfo = this.extractPropertyInfo(prop);
      if (propInfo) {
        properties.push(propInfo);
      }
    }

    return {
      className,
      token,
      scope,
      filePath: sourceFile.getFilePath(),
      dependencies,
      properties
    };
  }

  private extractDependencyInfo(param: ParameterDeclaration, index: number): DependencyInfo | null {
    const injectDecorator = param.getDecorator('Inject') || param.getDecorator('Autowired');
    
    if (!injectDecorator) {
      return null; // Only process explicitly marked dependencies
    }

    let token: string;
    const paramType = param.getType().getText();
    
    // Extract token from decorator
    const decoratorArgs = injectDecorator.getArguments();
    if (decoratorArgs.length > 0) {
      const tokenArg = decoratorArgs[0];
      if (Node.isStringLiteral(tokenArg)) {
        token = tokenArg.getLiteralValue();
      } else if (Node.isIdentifier(tokenArg)) {
        const tokenName = tokenArg.getText();
        token = this.tokenMap.get(tokenName) || tokenName;
      } else {
        token = tokenArg.getText();
      }
    } else {
      token = paramType;
    }

    return {
      token,
      parameterIndex: index,
      type: paramType
    };
  }

  private extractPropertyInfo(prop: PropertyDeclaration): PropertyInfo | null {
    const injectDecorator = prop.getDecorator('Inject') || prop.getDecorator('Autowired');
    if (!injectDecorator) {
      return null;
    }

    const propName = prop.getName();
    const propType = prop.getType().getText();
    
    let token: string;
    const decoratorArgs = injectDecorator.getArguments();
    if (decoratorArgs.length > 0) {
      const tokenArg = decoratorArgs[0];
      if (Node.isStringLiteral(tokenArg)) {
        token = tokenArg.getLiteralValue();
      } else if (Node.isIdentifier(tokenArg)) {
        const tokenName = tokenArg.getText();
        token = this.tokenMap.get(tokenName) || tokenName;
      } else {
        token = tokenArg.getText();
      }
    } else {
      token = propType;
    }

    return {
      name: propName,
      token,
      type: propType
    };
  }

  private async generateDIConfiguration(): Promise<void> {
    const imports: string[] = [];
    const factories: string[] = [];
    const diMapEntries: string[] = [];

    for (const [token, serviceInfo] of this.services) {
      // Generate import - use ConfigManager's config directory
      const configDir = this.configManager.getConfigDir();
      const servicePath = path.resolve(serviceInfo.filePath);
      const relativePath = path.relative(configDir, servicePath)
        .replace(/\.(ts|tsx)$/, '')
        .replace(/\\/g, '/');
      
      // Make sure relative path starts with ./ or ../
      const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      
      imports.push(`import { ${serviceInfo.className} } from '${importPath}';`);

      // Generate factory function
      const factoryName = `create${serviceInfo.className}`;
      const factoryCode = this.generateFactoryFunction(serviceInfo, factoryName);
      factories.push(factoryCode);

      // Generate DI map entry
      const dependencyTokens = serviceInfo.dependencies.map(dep => `'${dep.token}'`);
      diMapEntries.push(`  '${token}': {
    factory: ${factoryName},
    scope: '${serviceInfo.scope}',
    dependencies: [${dependencyTokens.join(', ')}]
  }`);
    }

    // Generate the complete DI configuration file
    const configContent = `// Auto-generated DI configuration
// Do not edit this file manually
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}

${imports.join('\n')}

// Factory functions
${factories.join('\n\n')}

// DI Configuration Map
export const DI_CONFIG = {
${diMapEntries.join(',\n')}
};

// Container setup function (deprecated - use loadConfiguration instead)
export function setupDIContainer(container: any) {
  for (const [token, config] of Object.entries(DI_CONFIG)) {
    container.register(token, config.factory, config.scope);
  }
}`;

    // Write the configuration file to ConfigManager's directory
    const configFile = this.project.createSourceFile(
      path.join(this.configManager.getConfigDir(), 'di-config.ts'),
      configContent,
      { overwrite: true }
    );

    await configFile.save();
  }

  private generateFactoryFunction(serviceInfo: ServiceInfo, factoryName: string): string {
    const dependencyResolves = serviceInfo.dependencies.map((dep, index) => 
      `    const dep${index} = container.resolve('${dep.token}');`
    ).join('\n');

    const constructorArgs = serviceInfo.dependencies.map((_, index) => `dep${index}`).join(', ');

    const propertyInjections = serviceInfo.properties.map(prop => 
      `    instance.${prop.name} = container.resolve('${prop.token}');`
    ).join('\n');

    return `function ${factoryName}(container: any) {
  return () => {
${dependencyResolves}
    const instance = new ${serviceInfo.className}(${constructorArgs});
${propertyInjections}
    return instance;
  };
}`;
  }

  private async generateServiceRegistry(): Promise<void> {
    const serviceNames = Array.from(this.services.values()).map(s => s.className);
    const imports = Array.from(this.services.values()).map(serviceInfo => {
      const configDir = this.configManager.getConfigDir();
      const servicePath = path.resolve(serviceInfo.filePath);
      const relativePath = path.relative(configDir, servicePath)
        .replace(/\.(ts|tsx)$/, '')
        .replace(/\\/g, '/');
      
      const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      return `import { ${serviceInfo.className} } from '${importPath}';`;
    });

    const registryContent = `// Auto-generated service registry
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}
${imports.join('\n')}

export const SERVICE_CLASSES = [
  ${serviceNames.join(',\n  ')}
];

export const SERVICE_TOKENS = {
  ${Array.from(this.services.entries()).map(([token, info]) => 
    `${info.className}: '${token}'`
  ).join(',\n  ')}
};`;

    const registryFile = this.project.createSourceFile(
      path.join(this.configManager.getConfigDir(), 'AutoGeneratedRegistry.ts'),
      registryContent,
      { overwrite: true }
    );

    await registryFile.save();
  }

  async save(): Promise<void> {
    await this.project.save();
  }

  // Expose ConfigManager for external use
  getConfigManager(): ConfigManager {
    return this.configManager;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const transformer = new DITransformer({ 
    verbose: true,
    srcDir: './src',
    enableFunctionalDI: false // Only class-based DI
  });
  
  transformer.transform()
    .then(() => transformer.save())
    .then(() => console.log('✅ DI transformation completed successfully'))
    .catch(error => {
      console.error('❌ DI transformation failed:', error);
      process.exit(1);
    });
}