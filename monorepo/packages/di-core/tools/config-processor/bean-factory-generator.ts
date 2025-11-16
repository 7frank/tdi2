// tools/config-processor/bean-factory-generator.ts - Generate DI factories for @Bean methods

import type { ConfigurationMetadata, BeanMetadata, DIMap } from '../../src/types';
import { consoleFor } from '../logger';

const console = consoleFor('di-core:bean-factory-generator');

export interface BeanFactoryGeneratorOptions {
}

/**
 * Bean Factory Generator - Creates factory functions for @Bean methods
 * Integrates with existing DI container and interface resolution system
 */
export class BeanFactoryGenerator {
  constructor() {
  }

  /**
   * Generate DI configuration entries for all configurations
   */
  generateDIConfiguration(configurations: ConfigurationMetadata[]): Partial<DIMap> {
    const diMap: Partial<DIMap> = {};

    for (const config of configurations) {
      const configEntries = this.generateConfigurationEntries(config);
      Object.assign(diMap, configEntries);
    }

    console.info(`🏭 Generated ${Object.keys(diMap).length} bean factory entries`);

    return diMap;
  }

  /**
   * Generate DI entries for a single configuration class
   */
  private generateConfigurationEntries(config: ConfigurationMetadata): Partial<DIMap> {
    const diMap: Partial<DIMap> = {};

    for (const bean of config.beans) {
      const token = this.generateBeanToken(bean, config);
      const entry = this.generateBeanEntry(bean, config);
      diMap[token] = entry;

      console.debug(`🫘 Generated factory for bean: ${token}`);
    }

    return diMap;
  }

  /**
   * Generate unique token for a bean
   */
  private generateBeanToken(bean: BeanMetadata, config: ConfigurationMetadata): string {
    // Use interface name as primary token
    let token = bean.returnType;

    // Add qualifier if present for disambiguation
    if (bean.qualifier) {
      token = `${token}:${bean.qualifier}`;
    }

    return token;
  }

  /**
   * Generate DI entry for a single bean
   */
  private generateBeanEntry(bean: BeanMetadata, config: ConfigurationMetadata): DIMap[string] {
    // Generate the factory function code
    const factoryCode = this.generateFactoryCode(bean, config);

    // Determine effective profiles (bean profiles override config profiles)
    const effectiveProfiles = this.getEffectiveProfiles(bean, config);

    return {
      factory: factoryCode,
      scope: bean.scope,
      dependencies: this.extractBeanDependencies(bean),
      interfaceName: bean.returnType,
      implementationClass: config.className,
      isAutoResolved: true,
      qualifier: bean.qualifier,
      isBean: true,
      beanMethodName: String(bean.methodName),
      configurationClass: config.className,
      profiles: effectiveProfiles,
    };
  }

  /**
   * Generate the actual factory function code for a bean
   */
  private generateFactoryCode(bean: BeanMetadata, config: ConfigurationMetadata): Function {
    // This generates a factory function that will:
    // 1. Get or create the configuration instance
    // 2. Resolve all dependencies for the bean method
    // 3. Call the bean method with resolved dependencies
    // 4. Return the created instance
    
    return (container: any) => {
      return () => {
        // Get configuration instance
        let configInstance = container.configurationInstances?.get?.(config.className);
        if (!configInstance) {
          // Create configuration instance (this would be done by transformer in real implementation)
          throw new Error(`Configuration instance not available: ${config.className}`);
        }

        // Resolve dependencies
        const dependencies = [];
        for (const param of bean.parameters) {
          let dependency;
          
          if (param.qualifier) {
            // Resolve with qualifier
            const qualifiedToken = `${param.parameterType}:${param.qualifier}`;
            dependency = container.resolve(qualifiedToken);
          } else {
            // Resolve by interface
            dependency = container.resolveByInterface(param.parameterType);
          }

          if (!dependency && !param.isOptional) {
            throw new Error(`Failed to resolve dependency: ${param.parameterType} for bean ${String(bean.methodName)}`);
          }

          dependencies.push(dependency);
        }

        // Call bean method
        const beanMethod = configInstance[bean.methodName];
        if (typeof beanMethod !== 'function') {
          throw new Error(`Bean method not found: ${String(bean.methodName)} in ${config.className}`);
        }

        return beanMethod.apply(configInstance, dependencies);
      };
    };
  }

  /**
   * Extract dependency tokens from bean parameters
   */
  private extractBeanDependencies(bean: BeanMetadata): string[] {
    return bean.parameters.map(param => {
      if (param.qualifier) {
        return `${param.parameterType}:${param.qualifier}`;
      }
      return param.parameterType;
    });
  }

  /**
   * Generate TypeScript code for configuration registration
   * This would be used by the transformer to generate the actual registration code
   */
  generateConfigurationRegistrationCode(configurations: ConfigurationMetadata[]): string {
    const lines: string[] = [];
    
    lines.push('// Generated configuration registration code');
    lines.push('import { CompileTimeDIContainer } from "@tdi2/di-core";');
    lines.push('');

    // Import configuration classes
    for (const config of configurations) {
      const importPath = this.generateImportPath(config.filePath);
      lines.push(`import { ${config.className} } from "${importPath}";`);
    }

    lines.push('');
    lines.push('export function registerConfigurations(container: CompileTimeDIContainer): void {');

    // Register configuration instances
    for (const config of configurations) {
      lines.push(`  // Register ${config.className}`);
      lines.push(`  const ${config.className.toLowerCase()}Instance = new ${config.className}();`);
      lines.push(`  container.registerConfigurationInstance("${config.className}", ${config.className.toLowerCase()}Instance);`);
      lines.push('');
    }

    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Generate import path from file path
   */
  private generateImportPath(filePath: string): string {
    // This is a simplified version - in reality, this would need to handle
    // relative path resolution, file extensions, etc.
    return filePath.replace(/\.ts$/, '');
  }

  /**
   * Get effective profiles for a bean (bean profiles override configuration profiles)
   */
  private getEffectiveProfiles(bean: BeanMetadata, config: ConfigurationMetadata): string[] | undefined {
    // Bean-specific profiles take precedence over configuration profiles
    if (bean.profiles && bean.profiles.length > 0) {
      return bean.profiles;
    }

    // If bean has no specific profiles, inherit from configuration
    return config.profiles?.length ? config.profiles : undefined;
  }
}