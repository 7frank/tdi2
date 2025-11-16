// tools/config-processor/index.ts - Configuration class processor for TDI2

import { Project, SourceFile, ClassDeclaration, MethodDeclaration, Decorator } from 'ts-morph';
import type { ConfigurationMetadata, BeanMetadata, BeanParameterMetadata } from '../../src/types';
import { consoleFor } from '../logger';

const console = consoleFor('di-core:config-processor');

export interface ConfigProcessorOptions {
  scanDirs: string[];
  verbose?: boolean;
}

/**
 * Configuration Processor - Analyzes @Configuration classes at compile-time
 * Extracts @Bean methods and their dependencies for DI system integration
 */
export class ConfigurationProcessor {
  private project: Project;
  private options: ConfigProcessorOptions;

  constructor(options: ConfigProcessorOptions) {
    this.options = options;
    this.project = new Project({
      tsConfigFilePath: './tsconfig.json',
      useInMemoryFileSystem: false
    });

    // Add source files from ALL scan directories
    for (const dir of options.scanDirs) {
      this.project.addSourceFilesAtPaths(`${dir}/**/*.{ts,tsx}`);
      console.log(`📂 ConfigurationProcessor: Added source files from ${dir}`);
    }
  }

  /**
   * Process all configuration classes in the project
   */
  async processConfigurations(): Promise<ConfigurationMetadata[]> {
    const sourceFiles = this.project.getSourceFiles();
    const configurations: ConfigurationMetadata[] = [];

    for (const sourceFile of sourceFiles) {
      const configsInFile = await this.processSourceFile(sourceFile);
      configurations.push(...configsInFile);
    }

    console.log(`🔍 Found ${configurations.length} configuration classes`);

    return configurations;
  }

  /**
   * Process a single source file for @Configuration classes
   */
  private async processSourceFile(sourceFile: SourceFile): Promise<ConfigurationMetadata[]> {
    const configurations: ConfigurationMetadata[] = [];
    const classes = sourceFile.getClasses();

    for (const classDeclaration of classes) {
      const configMetadata = await this.processConfigurationClass(classDeclaration, sourceFile);
      if (configMetadata) {
        configurations.push(configMetadata);
      }
    }

    return configurations;
  }

  /**
   * Process a single class declaration for @Configuration decorator
   */
  private async processConfigurationClass(
    classDeclaration: ClassDeclaration,
    sourceFile: SourceFile
  ): Promise<ConfigurationMetadata | null> {
    const configDecorator = this.findConfigurationDecorator(classDeclaration);
    if (!configDecorator) {
      return null;
    }

    const className = classDeclaration.getName();
    if (!className) {
      console.warn('⚠️  Configuration class without name found');
      return null;
    }

    // Extract configuration options from decorator
    const configOptions = this.extractConfigurationOptions(configDecorator);

    // Process all @Bean methods in this configuration
    const beanMethods = await this.processBeanMethods(classDeclaration);

    const configMetadata: ConfigurationMetadata = {
      className,
      filePath: sourceFile.getFilePath(),
      profiles: configOptions.profiles || [],
      priority: configOptions.priority || 0,
      beans: beanMethods,
    };

    console.log(`📦 Processed configuration: ${className} with ${beanMethods.length} beans`);

    return configMetadata;
  }

  /**
   * Find @Configuration decorator on a class
   */
  private findConfigurationDecorator(classDeclaration: ClassDeclaration): Decorator | undefined {
    return classDeclaration.getDecorators().find(decorator => {
      const decoratorName = decorator.getName();
      return decoratorName === 'Configuration';
    });
  }

  /**
   * Extract options from @Configuration decorator
   */
  private extractConfigurationOptions(decorator: Decorator): { profiles?: string[]; priority?: number } {
    const args = decorator.getArguments();
    if (args.length === 0) {
      return {};
    }

    // For now, return empty options - in a real implementation,
    // we would parse the decorator arguments to extract profiles and priority
    // This would require more complex AST parsing
    return {};
  }

  /**
   * Process all @Bean methods in a configuration class
   */
  private async processBeanMethods(classDeclaration: ClassDeclaration): Promise<BeanMetadata[]> {
    const beans: BeanMetadata[] = [];
    const methods = classDeclaration.getMethods();

    for (const method of methods) {
      const beanMetadata = await this.processBeanMethod(method);
      if (beanMetadata) {
        beans.push(beanMetadata);
      }
    }

    return beans;
  }

  /**
   * Process a single method for @Bean decorator
   */
  private async processBeanMethod(method: MethodDeclaration): Promise<BeanMetadata | null> {
    const beanDecorator = this.findBeanDecorator(method);
    if (!beanDecorator) {
      return null;
    }

    const methodName = method.getName();
    const returnType = this.extractReturnType(method);
    const parameters = this.extractMethodParameters(method);

    // Extract decorator metadata (@Primary, @Scope, @Qualifier)
    const decoratorMetadata = this.extractDecoratorMetadata(method);

    const beanMetadata: BeanMetadata = {
      methodName,
      returnType,
      parameters,
      scope: decoratorMetadata.scope || "singleton",
      primary: decoratorMetadata.primary || false,
      qualifier: decoratorMetadata.qualifier,
      autoResolve: true, // Always true for beans
      profiles: decoratorMetadata.profiles,
    };

    console.log(`🫘 Processed bean method: ${methodName} -> ${returnType}`);

    return beanMetadata;
  }

  /**
   * Find @Bean decorator on a method
   */
  private findBeanDecorator(method: MethodDeclaration): Decorator | undefined {
    return method.getDecorators().find(decorator => {
      const decoratorName = decorator.getName();
      return decoratorName === 'Bean';
    });
  }

  /**
   * Extract return type interface from method
   */
  private extractReturnType(method: MethodDeclaration): string {
    const returnTypeNode = method.getReturnTypeNode();
    if (returnTypeNode) {
      return returnTypeNode.getText();
    }

    // Fallback to inferred return type
    const signature = method.getSignature();
    return signature.getReturnType().getText();
  }

  /**
   * Extract parameter dependencies from bean method
   */
  private extractMethodParameters(method: MethodDeclaration): BeanParameterMetadata[] {
    const parameters: BeanParameterMetadata[] = [];
    const methodParams = method.getParameters();

    for (const param of methodParams) {
      const paramName = param.getName();
      const paramType = param.getType().getText();
      const isOptional = param.hasQuestionToken();

      // Check for @Inject and @Qualifier decorators on parameters
      const injectDecorator = param.getDecorators().find(d => d.getName() === 'Inject');
      const qualifierDecorator = param.getDecorators().find(d => d.getName() === 'Qualifier');

      const paramMetadata: BeanParameterMetadata = {
        parameterName: paramName,
        parameterType: paramType,
        isOptional,
        qualifier: qualifierDecorator ? this.extractQualifierValue(qualifierDecorator) : undefined,
      };

      parameters.push(paramMetadata);
    }

    return parameters;
  }

  /**
   * Extract decorator metadata (@Primary, @Scope, @Qualifier, @Profile) from method
   */
  private extractDecoratorMetadata(method: MethodDeclaration): {
    scope?: "singleton" | "transient" | "scoped";
    primary?: boolean;
    qualifier?: string;
    profiles?: string[];
  } {
    const decorators = method.getDecorators();
    const metadata: any = {};

    // Check for @Scope decorator
    const scopeDecorator = decorators.find(d => d.getName() === 'Scope');
    if (scopeDecorator) {
      metadata.scope = this.extractScopeValue(scopeDecorator);
    }

    // Check for @Primary decorator
    const primaryDecorator = decorators.find(d => d.getName() === 'Primary');
    if (primaryDecorator) {
      metadata.primary = true;
    }

    // Check for @Qualifier decorator
    const qualifierDecorator = decorators.find(d => d.getName() === 'Qualifier');
    if (qualifierDecorator) {
      metadata.qualifier = this.extractQualifierValue(qualifierDecorator);
    }

    // Check for @Profile decorator
    const profileDecorator = decorators.find(d => d.getName() === 'Profile');
    if (profileDecorator) {
      metadata.profiles = this.extractProfileValues(profileDecorator);
    }

    return metadata;
  }

  /**
   * Extract scope value from @Scope decorator
   */
  private extractScopeValue(decorator: Decorator): "singleton" | "transient" | "scoped" {
    const args = decorator.getArguments();
    if (args.length > 0) {
      const scopeValue = args[0].getText().replace(/['"]/g, '');
      return scopeValue as "singleton" | "transient" | "scoped";
    }
    return "singleton";
  }

  /**
   * Extract qualifier value from @Qualifier decorator
   */
  private extractQualifierValue(decorator: Decorator): string | undefined {
    const args = decorator.getArguments();
    if (args.length > 0) {
      return args[0].getText().replace(/['"]/g, '');
    }
    return undefined;
  }

  /**
   * Extract profile values from @Profile decorator
   */
  private extractProfileValues(decorator: Decorator): string[] | undefined {
    const args = decorator.getArguments();
    if (args.length === 0) {
      return undefined;
    }

    // Handle multiple profile arguments: @Profile("dev", "test")
    const profiles: string[] = [];
    for (const arg of args) {
      const profileValue = arg.getText().replace(/['"]/g, '');
      if (profileValue && profileValue.trim()) {
        profiles.push(profileValue.trim());
      }
    }

    return profiles.length > 0 ? profiles : undefined;
  }
}