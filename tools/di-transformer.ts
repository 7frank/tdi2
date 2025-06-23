// tools/di-transformer.ts

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
}

export class DITransformer {
  private project: Project;
  private options: TransformerOptions;
  private services: Map<string, ServiceInfo> = new Map();

  constructor(options: TransformerOptions = {}) {
    this.options = {
      srcDir: './src',
      outputDir: './src/generated',
      verbose: false,
      generateRegistry: true,
      ...options
    };

    this.project = new Project({
      tsConfigFilePath: './tsconfig.json'
    });
  }

  async transform(): Promise<void> {
    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir!)) {
      fs.mkdirSync(this.options.outputDir!, { recursive: true });
    }

    // Add source files
    this.project.addSourceFilesAtPaths(`${this.options.srcDir}/**/*.{ts,tsx}`);

    // First pass: collect all service information
    await this.collectServices();

    // Second pass: generate DI configuration
    await this.generateDIConfiguration();

    if (this.options.generateRegistry) {
      await this.generateServiceRegistry();
    }

    if (this.options.verbose) {
      console.log(`Processed ${this.services.size} services`);
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
            token = tokenValue.getText();
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
    
    let token: string;
    const paramType = param.getType().getText();
    
    if (injectDecorator) {
      // Extract token from decorator
      const decoratorArgs = injectDecorator.getArguments();
      if (decoratorArgs.length > 0) {
        const tokenArg = decoratorArgs[0];
        if (Node.isStringLiteral(tokenArg)) {
          token = tokenArg.getLiteralValue();
        } else {
          token = tokenArg.getText();
        }
      } else {
        token = paramType;
      }
    } else {
      // Auto-inject based on parameter type
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
      // Generate import
      const relativePath = path.relative(
        this.options.outputDir!,
        serviceInfo.filePath
      ).replace(/\.(ts|tsx)$/, '').replace(/\\/g, '/');
      
      imports.push(`import { ${serviceInfo.className} } from '${relativePath}';`);

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

${imports.join('\n')}

// Factory functions
${factories.join('\n\n')}

// DI Configuration Map
export const DI_CONFIG = {
${diMapEntries.join(',\n')}
};

// Container setup function
export function setupDIContainer(container: any) {
  for (const [token, config] of Object.entries(DI_CONFIG)) {
    container.register(token, config.factory, config.scope);
  }
}`;

    // Write the configuration file
    const configFile = this.project.createSourceFile(
      path.join(this.options.outputDir!, 'di-config.ts'),
      configContent,
      { overwrite: true }
    );

    await configFile.save();
  }

  private generateFactoryFunction(serviceInfo: ServiceInfo, factoryName: string): string {
    const dependencyResolves = serviceInfo.dependencies.map((dep, index) => 
      `  const dep${index} = container.resolve('${dep.token}');`
    ).join('\n');

    const constructorArgs = serviceInfo.dependencies.map((_, index) => `dep${index}`).join(', ');

    const propertyInjections = serviceInfo.properties.map(prop => 
      `  instance.${prop.name} = container.resolve('${prop.token}');`
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
      const relativePath = path.relative(
        path.join(this.options.srcDir!, 'services'),
        serviceInfo.filePath
      ).replace(/\.(ts|tsx)$/, '').replace(/\\/g, '/');
      
      return `import { ${serviceInfo.className} } from '${relativePath}';`;
    });

    const registryContent = `// Auto-generated service registry
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
      path.join(this.options.srcDir!, 'services', 'AutoGeneratedRegistry.ts'),
      registryContent,
      { overwrite: true }
    );

    await registryFile.save();
  }

  async save(): Promise<void> {
    await this.project.save();
  }
}

// CLI usage
if (require.main === module) {
  const transformer = new DITransformer({ 
    verbose: true,
    srcDir: './src',
    outputDir: './src/generated'
  });
  
  transformer.transform()
    .then(() => transformer.save())
    .then(() => console.log('DI transformation completed successfully'))
    .catch(error => {
      console.error('DI transformation failed:', error);
      process.exit(1);
    });
}