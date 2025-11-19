// tools/enhanced-di-transformer.ts - REFACTORED to use shared logic

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
import { consoleFor } from './logger';

const console = consoleFor('di-core:enhanced-transformer');

// Use shared components
import { SharedDependencyExtractor } from './shared/SharedDependencyExtractor';
import { SharedServiceRegistry } from './shared/SharedServiceRegistry';
import { SharedTypeResolver } from './shared/SharedTypeResolver';
import type { 
  SharedTransformationOptions,
  TransformationCandidate,
  TransformationResult,
  TransformationSummary,
  TransformationError,
  TransformationWarning,
  ServiceClassMetadata
} from './shared/shared-types';

import { IntegratedInterfaceResolver } from './interface-resolver/integrated-interface-resolver';
import { shouldSkipFile as shouldSkipFileUtil } from './functional-di-enhanced-transformer/utils';

interface TransformerOptions {
  scanDirs?: string[];
  outputDir?: string;
  generateRegistry?: boolean;
  enableInterfaceResolution?: boolean;
  customSuffix?: string;
  excludePatterns?: string[];
}

export class EnhancedDITransformer {
  private project: Project;
  private options: SharedTransformationOptions;
  private configManager: ConfigManager;
  private interfaceResolver: IntegratedInterfaceResolver;
  
  // Shared components
  private dependencyExtractor: SharedDependencyExtractor;
  private serviceRegistry: SharedServiceRegistry;
  private typeResolver: SharedTypeResolver;
  
  // Transformation state
  private transformationCandidates: TransformationCandidate[] = [];
  private transformedFiles: Map<string, string> = new Map();
  private errors: TransformationError[] = [];
  private warnings: TransformationWarning[] = [];

  constructor(options: TransformerOptions = {}) {
    if (!options.scanDirs || options.scanDirs.length === 0) {
      throw new Error('EnhancedDITransformer requires scanDirs option with at least one directory');
    }

    this.options = {
      outputDir: options.outputDir || './src/.tdi2',
      enableInterfaceResolution: options.enableInterfaceResolution !== false,
      enableInheritanceDI: true,
      enableStateDI: true,
      customSuffix: options.customSuffix,
      scanDirs: options.scanDirs
    } as any;

    this.project = new Project({
      tsConfigFilePath: './tsconfig.json'
    });

    // Initialize ConfigManager
    this.configManager = new ConfigManager({
      scanDirs: this.options.scanDirs,
      outputDir: this.options.outputDir,
      enableFunctionalDI: false, // This transformer focuses on class-based DI
      customSuffix: this.options.customSuffix
    });

    // Initialize InterfaceResolver with all scan directories
    this.interfaceResolver = new IntegratedInterfaceResolver({
      scanDirs: this.options.scanDirs,
      enableInheritanceDI: this.options.enableInheritanceDI,
      enableStateDI: this.options.enableStateDI
    });

    // Initialize shared components
    this.typeResolver = new SharedTypeResolver(this.interfaceResolver);

    this.dependencyExtractor = new SharedDependencyExtractor(this.typeResolver, {
      scanDirs: this.options.scanDirs
    });

    this.serviceRegistry = new SharedServiceRegistry(this.configManager);
  }

  async transform(): Promise<TransformationResult> {
    const startTime = Date.now();

    console.log('🚀 Starting enhanced DI transformation with shared logic...');

    try {
      // Phase 1: Scan and resolve interfaces
      await this.scanAndResolveInterfaces();

      // Phase 2: Find transformation candidates
      await this.findTransformationCandidates();

      // Phase 3: Extract dependencies using shared logic
      await this.extractDependencies();

      // Phase 4: Register services using shared registry
      await this.registerServices();

      // Phase 5: Generate configuration files
      await this.generateConfiguration();

      // Phase 6: Generate bridge files
      this.configManager.generateBridgeFiles();

      const endTime = Date.now();

      console.log('✅ Enhanced DI transformation completed');
      console.log(`🏗️  Config: ${this.configManager.getConfigHash()}`);
      console.log(`📁 Config dir: ${this.configManager.getConfigDir()}`);
      console.log(`🌉 Bridge dir: ${this.configManager.getBridgeDir()}`);
      console.log(`⏱️  Duration: ${endTime - startTime}ms`);

      return this.createTransformationResult(startTime, endTime);

    } catch (error) {
      this.errors.push({
        type: 'configuration-error' as any, // FIXME: Type mismatch, should be fixed, it currenty breaks build
        message: error instanceof Error ? error.message : 'Unknown transformation error',
        details: error
      });

      throw error;
    }
  }

  private async scanAndResolveInterfaces(): Promise<void> {
    console.log('🔍 Scanning project for interfaces and implementations...');

    await this.interfaceResolver.scanProject();

    // Validate dependencies
    const validation = this.interfaceResolver.validateDependencies();
    if (!validation.isValid) {
      console.warn('⚠️  Some dependencies may not be resolvable:');
      validation.missingImplementations.forEach(missing => {
        console.warn(`  - Missing: ${missing}`);
      });
      validation.circularDependencies.forEach(circular => {
        console.warn(`  - Circular: ${circular}`);
      });

      // Add warnings for missing implementations
      validation.missingImplementations.forEach(missing => {
        this.warnings.push({
          type: 'optional-missing',
          message: `Missing implementation: ${missing}`,
          suggestion: 'Ensure all required services are implemented and decorated with @Service'
        });
      });

      // Add errors for circular dependencies
      validation.circularDependencies.forEach(circular => {
        this.errors.push({
          type: 'resolution-error',
          message: `Circular dependency detected: ${circular}`
        });
      });
    }
  }

  private async findTransformationCandidates(): Promise<void> {
    console.log('🔍 Finding transformation candidates...');

    // Add source files from all scan directories
    const scanDirs = this.options.scanDirs;
    for (const dir of scanDirs) {
      this.project.addSourceFilesAtPaths(`${dir}/**/*.{ts,tsx}`);
    }

    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      if (this.shouldSkipFile(sourceFile)) continue;

      const classes = sourceFile.getClasses();
      for (const classDecl of classes) {
        const candidate = this.createClassCandidate(classDecl, sourceFile);
        if (candidate) {
          this.transformationCandidates.push(candidate);
        }
      }
    }

    console.log(`📋 Found ${this.transformationCandidates.length} transformation candidates`);
  }

  private createClassCandidate(
    classDecl: ClassDeclaration, 
    sourceFile: SourceFile
  ): TransformationCandidate | null {
    const className = classDecl.getName();
    if (!className) return null;

    // Check if class has service decorator
    const hasServiceDecorator = this.hasServiceDecorator(classDecl);
    if (!hasServiceDecorator) return null;

    return {
      type: 'class',
      node: classDecl,
      filePath: sourceFile.getFilePath(),
      sourceFile,
      metadata: {
        hasServiceDecorator: true,
        componentName: className
      }
    };
  }

  private async extractDependencies(): Promise<void> {
    console.log('🔗 Extracting dependencies using shared logic...');

    const dependencyMap = new Map<string, any[]>();

    for (const candidate of this.transformationCandidates) {
      if (candidate.type === 'class' && Node.isClassDeclaration(candidate.node)) {
        try {
          const dependencies = this.dependencyExtractor.extractFromClassConstructor(
            candidate.node,
            candidate.sourceFile
          );

          if (dependencies.length > 0) {
            const className = candidate.node.getName()!;
            dependencyMap.set(className, dependencies);

            console.log(`🔗 ${className}: Found ${dependencies.length} dependencies`);
            dependencies.forEach(dep => {
              const status = dep.resolvedImplementation ? '✅' : (dep.isOptional ? '⚠️' : '❌');
              console.log(`    ${status} ${dep.serviceKey}: ${dep.interfaceType}`);
            });
          }
        } catch (error) {
          this.errors.push({
            type: 'resolution-error',
            message: `Failed to extract dependencies from ${candidate.metadata?.componentName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            candidate
          });
        }
      }
    }

    // Store dependency map for service registration
    (this as any).dependencyMap = dependencyMap;
  }

  private async registerServices(): Promise<void> {
    console.log('📝 Registering services using shared registry...');

    const implementations = this.interfaceResolver.getInterfaceImplementations();
    const dependencyMap = (this as any).dependencyMap || new Map();

    // Register all services with their dependencies
    this.serviceRegistry.registerServices(
      Array.from(implementations.values()),
      dependencyMap
    );

    // Validate registry
    const validation = this.serviceRegistry.validateRegistry();
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        this.errors.push({
          type: 'validation-error',
          message: error
        });
      });
    }

    validation.warnings.forEach(warning => {
      this.warnings.push({
        type: 'performance',
        message: warning
      });
    });

    console.log(`📊 Registry stats:`, validation.stats);
  }

  private async generateConfiguration(): Promise<void> {
    console.log('📄 Generating configuration files...');

    // Generate DI configuration using shared registry
    await this.serviceRegistry.generateDIConfiguration();

    // Generate service registry
    await this.serviceRegistry.generateServiceRegistry();
  }

  private shouldSkipFile(sourceFile: SourceFile): boolean {
    const filePath = sourceFile.getFilePath();
    return shouldSkipFileUtil(filePath, {
      excludePatterns: this.options.excludePatterns,
      outputDir: this.options.outputDir,
    });
  }

  private hasServiceDecorator(classDecl: ClassDeclaration): boolean {
    return classDecl.getDecorators().some((decorator) => {
      try {
        const expression = decorator.getExpression();
        if (Node.isCallExpression(expression)) {
          const expressionText = expression.getExpression().getText();
          return this.isServiceDecoratorName(expressionText);
        } else if (Node.isIdentifier(expression)) {
          const expressionText = expression.getText();
          return this.isServiceDecoratorName(expressionText);
        }
      } catch (error) {
        // Ignore malformed decorators
      }
      return false;
    });
  }

  private isServiceDecoratorName(decoratorName: string): boolean {
    const serviceDecorators = [
      'Service',
      'Component',
      'Injectable',
      'Repository',
      'Controller',
      'Provider'
    ];
    
    return serviceDecorators.some(name => 
      decoratorName === name || decoratorName.includes(name)
    );
  }

  private createTransformationResult(startTime: number, endTime: number): TransformationResult {
    const successful = this.transformationCandidates.length - this.errors.filter(e => e.candidate).length;
    const failed = this.errors.filter(e => e.candidate).length;

    // Get resolution statistics from type resolver
    const resolutionStats = this.getResolutionStatistics();

    const summary: TransformationSummary = {
      totalCandidates: this.transformationCandidates.length,
      successfulTransformations: successful,
      failedTransformations: failed,
      skippedTransformations: 0,
      dependenciesResolved: resolutionStats.successfulResolutions,
      dependenciesUnresolved: resolutionStats.failedResolutions,
      byType: {
        class: this.transformationCandidates.filter(c => c.type === 'class').length,
        function: 0,
        arrowFunction: 0
      },
      byResolutionStrategy: resolutionStats.byStrategy as any,
      performance: {
        startTime,
        endTime,
        duration: endTime - startTime
      }
    };

    return {
      transformedFiles: this.transformedFiles as any , // // FIXME: Type mismatch, should be fixed, it currenty breaks build
      summary,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  private getResolutionStatistics(): any {
    // Get statistics from the shared type resolver
    const implementations = this.interfaceResolver.getInterfaceImplementations();
    const dependencies = this.interfaceResolver.getServiceDependencies();

    let successfulResolutions = 0;
    let failedResolutions = 0;
    const byStrategy: Record<string, number> = {
      interface: 0,
      inheritance: 0,
      state: 0,
      class: 0,
      notFound: 0
    };

    for (const [, impl] of implementations) {
      successfulResolutions++;
      if (impl.isInheritanceBased) byStrategy.inheritance++;
      else if (impl.isClassBased) byStrategy.class++;
      else byStrategy.interface++;
    }

    // Count missing dependencies
    for (const [, dep] of dependencies) {
      for (const depKey of dep.interfaceDependencies) {
        let found = false;
        for (const [, impl] of implementations) {
          if (impl.sanitizedKey === depKey) {
            found = true;
            break;
          }
        }
        if (!found) {
          failedResolutions++;
          byStrategy.notFound++;
        }
      }
    }

    return {
      successfulResolutions,
      failedResolutions,
      byStrategy
    };
  }

  async save(): Promise<void> {
    try {
      await this.project.save();
    } catch (error) {
      console.error('❌ Failed to save project:', error);
      throw error;
    }
  }

  // Expose managers for external use
  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  getInterfaceResolver(): IntegratedInterfaceResolver {
    return this.interfaceResolver;
  }

  getServiceRegistry(): SharedServiceRegistry {
    return this.serviceRegistry;
  }

  getTypeResolver(): SharedTypeResolver {
    return this.typeResolver;
  }

  // Enhanced debug methods using shared logic
  async getDebugInfo() {
    try {
      const implementations = this.interfaceResolver.getInterfaceImplementations();
      const dependencies = this.interfaceResolver.getServiceDependencies();
      const validation = this.interfaceResolver.validateDependencies();
      const registryConfig = this.serviceRegistry.getConfiguration();

      return {
        configHash: this.configManager.getConfigHash(),
        implementations: Array.from(implementations.entries()),
        dependencies: Array.from(dependencies.entries()),
        validation,
        registryStats: this.serviceRegistry.validateRegistry().stats,
        registryConfig,
        transformationCandidates: this.transformationCandidates.length,
        errors: this.errors,
        warnings: this.warnings,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        configHash: this.configManager.getConfigHash(),
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async validateConfiguration(): Promise<boolean> {
    try {
      const interfaceValidation = this.interfaceResolver.validateDependencies();
      const registryValidation = this.serviceRegistry.validateRegistry();
      
      return interfaceValidation.isValid && registryValidation.isValid;
    } catch (error) {
      console.error('❌ Configuration validation failed:', error);
      return false;
    }
  }

  getTransformationSummary(): {
    configHash: string;
    implementationCount: number;
    dependencyCount: number;
    hasValidConfiguration: boolean;
    hasErrors: boolean;
  } {
    try {
      const implementations = this.interfaceResolver.getInterfaceImplementations();
      const dependencies = this.interfaceResolver.getServiceDependencies();
      const hasValidConfiguration = this.configManager.isConfigValid();

      return {
        configHash: this.configManager.getConfigHash(),
        implementationCount: implementations.size,
        dependencyCount: dependencies.size,
        hasValidConfiguration,
        hasErrors: this.errors.length > 0
      };
    } catch (error) {
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

// // CLI usage
// if (import.meta.url === `file://${process.argv[1]}`) {
//   const transformer = new EnhancedDITransformer({ 
//     scanDirs: ['./src'],
//     enableInterfaceResolution: true
//   });
  
//   transformer.transform()
//     .then(() => transformer.save())
//     .then(() => console.log('✅ Enhanced DI transformation completed successfully'))
//     .catch(error => {
//       console.error('❌ Enhanced DI transformation failed:', error);
//       process.exit(1);
//     });
// }