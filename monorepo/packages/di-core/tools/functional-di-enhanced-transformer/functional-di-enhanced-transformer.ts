// tools/functional-di-enhanced-transformer/functional-di-enhanced-transformer.ts - UPDATED to use TransformationPipeline

import {
  Project,
  SourceFile,
  FunctionDeclaration,
  VariableDeclaration,
  ArrowFunction,
  ParameterDeclaration,
  Node,
} from 'ts-morph';
import * as path from 'path';
import { ConfigManager } from '../config-manager';
import { consoleFor } from '../logger';

const console = consoleFor('di-core:functional-transformer');
import type { TransformedContent } from '../shared/shared-types';

// Use shared components
import { SharedDependencyExtractor } from '../shared/SharedDependencyExtractor';
import { SharedServiceRegistry } from '../shared/SharedServiceRegistry';
import { SharedTypeResolver } from '../shared/SharedTypeResolver';
import type { 
  SharedTransformationOptions,
  TransformationCandidate,
  TransformationResult,
  TransformationSummary,
  TransformationError,
  TransformationWarning,
  FunctionComponentMetadata
} from '../shared/shared-types';

import { IntegratedInterfaceResolver } from "../interface-resolver/integrated-interface-resolver";

// Use the new transformation pipeline
import { TransformationPipeline, TransformationPipelineOptions } from './transformation-pipeline';
import { ImportManager } from './import-manager';
import { DebugFileGenerator } from './debug-file-generator';
import { DiInjectMarkers } from './di-inject-markers';
import { shouldSkipFile as shouldSkipFileUtil } from './utils';

// Import configuration processing capabilities
import { ConfigurationProcessor } from '../config-processor/index';
import { BeanFactoryGenerator } from '../config-processor/bean-factory-generator';
import type { ConfigurationMetadata } from '../../src/types';
import type { ComponentMetadata, ComponentInjection } from '../eslint-metadata/metadata-types';

interface TransformerOptions {
  scanDirs?: string[];
  outputDir?: string;
  generateDebugFiles?: boolean;
  customSuffix?: string;
  enableParameterNormalization?: boolean;
  generateFallbacks?: boolean;
  excludePatterns?: string[];
}

export class FunctionalDIEnhancedTransformer {
  private project: Project;
  private options: SharedTransformationOptions;
  private configManager: ConfigManager;
  private interfaceResolver: IntegratedInterfaceResolver;
  
  // Shared components
  private dependencyExtractor: SharedDependencyExtractor;
  private serviceRegistry: SharedServiceRegistry;
  private typeResolver: SharedTypeResolver;
  
  // NEW: Transformation pipeline for normalization and DI transformation
  private transformationPipeline: TransformationPipeline;
  
  // Keep existing functional-specific components
  private importManager: ImportManager;
  private debugFileGenerator: DebugFileGenerator;
  
  // NEW: Configuration processing components
  private configurationProcessor: ConfigurationProcessor;
  private beanFactoryGenerator: BeanFactoryGenerator;
  
  // Transformation state
  private transformationCandidates: TransformationCandidate[] = [];
  private transformedFiles: Map<string, string> = new Map();
  private transformationCount = 0;
  private errors: TransformationError[] = [];
  private warnings: TransformationWarning[] = [];
  private configurations: ConfigurationMetadata[] = [];
  private componentMetadataMap: Map<string, ComponentMetadata> = new Map();

  constructor(options: TransformerOptions = {}) {
    if (!options.scanDirs || options.scanDirs.length === 0) {
      throw new Error('FunctionalDIEnhancedTransformer requires scanDirs option with at least one directory');
    }

    this.options = {
      outputDir: './src/.tdi2',
      enableInterfaceResolution: true,
      enableInheritanceDI: true,
      enableStateDI: true,
      customSuffix: undefined,
      generateDebugFiles: false,
      ...options,
      scanDirs: options.scanDirs
    } as any;

    this.project = new Project({
      tsConfigFilePath: './tsconfig.json',
      useInMemoryFileSystem: false
    });

    // Initialize ConfigManager
    this.configManager = new ConfigManager({
      scanDirs: this.options.scanDirs,
      outputDir: this.options.outputDir,
      enableFunctionalDI: true,
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

    // Initialize transformation pipeline with enhanced options
    const pipelineOptions: TransformationPipelineOptions = {
      generateFallbacks: options.generateFallbacks !== false, // Default to true
      preserveTypeAnnotations: true,
      interfaceResolver: this.interfaceResolver // Pass interface resolver for dependency resolution
    };
    this.transformationPipeline = new TransformationPipeline(pipelineOptions);

    // Initialize functional-specific components
    const functionalOptions = {
      scanDirs: this.options.scanDirs,
      outputDir: this.options.outputDir,
      generateDebugFiles: options.generateDebugFiles
    };

    this.importManager = new ImportManager(functionalOptions);
    this.debugFileGenerator = new DebugFileGenerator(this.configManager, functionalOptions);
    
    // Initialize configuration processing components
    this.configurationProcessor = new ConfigurationProcessor({
      scanDirs: this.options.scanDirs
    });

    this.beanFactoryGenerator = new BeanFactoryGenerator();
  }

  async transformForBuild(): Promise<Map<string, string>> {
    const result = await this.transform();
    return result.transformedFiles as any;
  }

  async transform(): Promise<TransformationResult> {
    const startTime = Date.now();

    console.log('🎯 Starting enhanced functional DI transformation with parameter normalization...');

    try {
      // Phase 1: Scan and resolve interfaces using shared logic
      await this.scanAndResolveInterfaces();

      // Phase 2: Process configuration classes with @Bean methods
      await this.processConfigurationClasses();

      // Phase 3: Find React functional components
      await this.findFunctionalComponents();

      // Phase 4: Transform components using the new pipeline
      await this.transformComponentsWithPipeline();

      // Phase 5: Register discovered services (including beans)
      await this.registerDiscoveredServices();

      // Phase 5.5: Generate DI configuration (including ESLint metadata with component data)
      await this.serviceRegistry.generateDIConfiguration();

      // Phase 6: Generate debug files if requested
      if ((this.options as any).generateDebugFiles) {
        await this.debugFileGenerator.generateDebugFiles(this.transformedFiles);
      }

      const endTime = Date.now();

      console.log(`✅ Enhanced transformation completed: ${this.transformationCount} functions in ${this.transformedFiles.size} files`);
      console.log(`🏗️  Config directory: ${this.configManager.getConfigDir()}`);
      console.log(`⏱️  Duration: ${endTime - startTime}ms`);
        
      this.logTransformationStatistics();

      return this.createTransformationResult(startTime, endTime);

    } catch (error) {
      this.errors.push({
        type: 'configuration-error' as any,
        message: error instanceof Error ? error.message : 'Unknown transformation error',
        details: error
      });

      throw error;
    }
  }

  private async scanAndResolveInterfaces(): Promise<void> {
    console.log('🔍 Scanning project for interfaces using shared resolver...');

    await this.interfaceResolver.scanProject();

    const validation = this.interfaceResolver.validateDependencies();
    if (!validation.isValid) {
      console.warn('⚠️  Some dependencies may not be resolvable:');
      validation.missingImplementations.forEach(missing => {
        console.warn(`  - Missing: ${missing}`);
      });

      validation.missingImplementations.forEach(missing => {
        this.warnings.push({
          type: 'optional-missing',
          message: `Missing implementation: ${missing}`,
          suggestion: 'Ensure all required services are implemented and decorated with @Service'
        });
      });
    }
  }

  private async processConfigurationClasses(): Promise<void> {
    console.log('🏗️  Phase 2: Processing @Configuration classes and @Bean methods...');

    try {
      // Process all configuration classes
      this.configurations = await this.configurationProcessor.processConfigurations();

      if (this.configurations.length > 0) {
        // Generate DI configuration entries for beans
        const beanDIMap = this.beanFactoryGenerator.generateDIConfiguration(this.configurations);

        // Add bean entries to the service registry
        for (const [token, config] of Object.entries(beanDIMap)) {
          if (config?.interfaceName) {
            // Register the bean as an implementation of its interface
            this.serviceRegistry.registerBeanImplementation(token, config.interfaceName, config);
          }
        }

        console.log(`✅ Processed ${this.configurations.length} configuration classes`);
        console.log(`🫘 Generated ${Object.keys(beanDIMap).length} bean factories`);
          
        // Log configuration details
        for (const config of this.configurations) {
          console.log(`  📦 ${config.className}: ${config.beans.length} beans`);
        }
      } else {
        console.log('ℹ️  No @Configuration classes found');
      }
    } catch (error) {
      this.errors.push({
        type: 'configuration-error' as any,
        message: error instanceof Error ? error.message : 'Failed to process configuration classes',
        details: error
      });

      console.error('❌ Configuration processing failed:', error);
    }
  }

  private async findFunctionalComponents(): Promise<void> {
    console.log('🔍 Finding React functional components with DI markers...');

    const pattern = "/**/*.{ts,tsx}";

    // Add source files from all scan directories
    const scanDirs = this.options.scanDirs
    for (const dir of scanDirs) {
      this.project.addSourceFilesAtPaths(`${dir}${pattern}`);
    }

    console.log(`📂 Scanned source files in ${scanDirs.join(', ')} with pattern: ${pattern}`);
    console.log(`🔍 Total source files: ${this.project.getSourceFiles().length}`);

    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      if (this.shouldSkipFile(sourceFile)) continue;
      
      console.log(`🔍 Processing source file: ${sourceFile.getFilePath()}`);

      // Find function declarations
      for (const func of sourceFile.getFunctions()) {
        const candidate = this.createFunctionCandidate(func, sourceFile);
        console.log("Function", func.getName(), "isCandidate", !!candidate);

        if (candidate) {
          this.transformationCandidates.push(candidate);
        }
      }

      // Find arrow functions in variable declarations
      for (const varStatement of sourceFile.getVariableStatements()) {
        for (const declaration of varStatement.getDeclarations()) {
          const initializer = declaration.getInitializer();
          if (initializer && Node.isArrowFunction(initializer)) {
            const candidate = this.createArrowFunctionCandidate(declaration, initializer, sourceFile);
            if (candidate) {
              this.transformationCandidates.push(candidate);
            }
          }
        }
      }
    }

    console.log(`📋 Found ${this.transformationCandidates.length} functional component candidates:`, 
      this.transformationCandidates.map(it => it.metadata?.componentName));
  }

  private createFunctionCandidate(
    func: FunctionDeclaration, 
    sourceFile: SourceFile
  ): TransformationCandidate | null {
    const funcName = func.getName();
    if (!funcName) {
      console.warn(`⚠️  Skipping unnamed function in ${sourceFile.getFilePath()}`);
      return null;
    }

    if (!this.hasInjectMarkers(func.getParameters(), sourceFile)) {
      return null;
    }

    return {
      type: 'function',
      node: func,
      filePath: sourceFile.getFilePath(),
      sourceFile,
      metadata: {
        hasInjectMarkers: true,
        componentName: funcName,
        isReactComponent: this.isReactComponent(func)
      }
    };
  }

  private createArrowFunctionCandidate(
    declaration: VariableDeclaration,
    arrowFunc: ArrowFunction,
    sourceFile: SourceFile
  ): TransformationCandidate | null {
    const varName = declaration.getName();

    if (!this.hasInjectMarkers(arrowFunc.getParameters(), sourceFile)) {
      return null;
    }

    return {
      type: 'arrow-function',
      node: arrowFunc,
      filePath: sourceFile.getFilePath(),
      sourceFile,
      metadata: {
        hasInjectMarkers: true,
        componentName: varName,
        isReactComponent: this.isReactComponent(arrowFunc)
      }
    };
  }

  // NEW: Transform components using the transformation pipeline
  private async transformComponentsWithPipeline(): Promise<void> {
    console.log('🔄 Transforming components using enhanced pipeline with parameter normalization...');

    for (const candidate of this.transformationCandidates) {
      try {
        await this.transformSingleComponentWithPipeline(candidate);
      } catch (error) {
        this.errors.push({
          type: 'generation-error',
          message: `Failed to transform ${candidate.metadata?.componentName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          candidate
        });
      }
    }
  }

  // NEW: Enhanced single component transformation using pipeline
  private async transformSingleComponentWithPipeline(candidate: TransformationCandidate): Promise<void> {
    const componentName = candidate.metadata?.componentName || 'unknown';

    console.log(`🔄 Pipeline transform: ${componentName} (${candidate.type})`);

    // Step 1: Extract dependencies using shared logic
    let dependencies: any[] = [];

    if (candidate.type === 'function' && Node.isFunctionDeclaration(candidate.node)) {
      dependencies = this.dependencyExtractor.extractFromFunctionParameter(
        candidate.node,
        candidate.sourceFile
      );
    } else if (candidate.type === 'arrow-function' && Node.isArrowFunction(candidate.node)) {
      dependencies = this.dependencyExtractor.extractFromArrowFunction(
        candidate.node,
        candidate.sourceFile
      );
    }

    if (dependencies.length === 0) {
      console.log(`⚠️  No dependencies found for ${componentName}`);
      return;
    }

    // Step 1.5: Collect component metadata for ESLint
    this.collectComponentMetadata(candidate.filePath, componentName, dependencies);

    // Step 2: Add DI imports using import manager
    this.importManager.ensureDIImports(candidate.sourceFile);

    // Step 3: NEW - Use the transformation pipeline for complete transformation
    if (candidate.type === 'function' && Node.isFunctionDeclaration(candidate.node)) {
      await this.transformationPipeline.transformComponent(
        candidate.node,
        dependencies,
        candidate.sourceFile
      );
    } else if (candidate.type === 'arrow-function' && Node.isArrowFunction(candidate.node)) {
      await this.transformationPipeline.transformComponent(
        candidate.node,
        dependencies,
        candidate.sourceFile
      );
    }

    // Step 4: Mark as transformed
    this.transformedFiles.set(candidate.filePath, candidate.sourceFile.getFullText());
    this.transformationCount++;

    console.log(`✅ Pipeline transformed ${componentName} with ${dependencies.length} dependencies`);
    dependencies.forEach(dep => {
      const status = dep.resolvedImplementation ? '✅' : (dep.isOptional ? '⚠️' : '❌');
      console.log(`    ${status} ${dep.serviceKey}: ${dep.interfaceType}`);
    });
  }

  /**
   * Collect component metadata for ESLint rule context
   * Note: When multiple components exist in the same file, we store the component
   * that was transformed LAST. The ESLint rule will search by component name.
   */
  private collectComponentMetadata(filePath: string, componentName: string, dependencies: any[]): void {
    const injections: ComponentInjection[] = dependencies.map(dep => {
      const resolved = dep.resolvedImplementation;
      const interfaceMapping = this.interfaceResolver.getInterfaceImplementations();
      const allImpls = Array.from(interfaceMapping.values())
        .filter(impl => impl.interfaceName === dep.interfaceType)
        .map(impl => impl.implementationClass);

      return {
        paramName: dep.serviceKey,
        interfaceType: dep.interfaceType,
        isOptional: dep.isOptional || false,
        resolvedClass: resolved?.implementationClass || '',
        resolvedPath: resolved?.filePath || '',
        token: resolved?.sanitizedKey || '',
        allPossibleImplementations: allImpls,
        hasAmbiguity: allImpls.length > 1,
      };
    });

    const metadata: ComponentMetadata = {
      componentName,
      injections,
    };

    // Use filePath:componentName as key to support multiple components per file
    const key = `${filePath}:${componentName}`;
    this.componentMetadataMap.set(key, metadata);
    console.debug(`📦 Collected metadata for ${componentName} at ${filePath} with ${injections.length} injections`);
  }

  private async registerDiscoveredServices(): Promise<void> {
    console.log('📝 Registering discovered services...');

    const implementations = this.interfaceResolver.getInterfaceImplementations();
    this.serviceRegistry.registerServices(Array.from(implementations.values()), new Map());

    // Pass component metadata to the registry for ESLint metadata generation
    this.serviceRegistry.setComponentMetadata(this.componentMetadataMap);
    console.log(`📦 Registered component metadata for ${this.componentMetadataMap.size} components`);

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
  }

  private shouldSkipFile(sourceFile: SourceFile): boolean {
    const filePath = sourceFile.getFilePath();

    // Use centralized skip logic with configuration
    const shouldSkip = shouldSkipFileUtil(filePath, {
      excludePatterns: this.options.excludePatterns,
      outputDir: this.options.outputDir,
    });

    if (shouldSkip) {
      console.log(`🔍 Skipping file due to ignore pattern: ${filePath}`);
    }
    return shouldSkip;
  }

  private hasInjectMarkers(parameters: ParameterDeclaration[], sourceFile: SourceFile): boolean {
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const typeNode = firstParam.getTypeNode();
    if (!typeNode) return false;

    return new DiInjectMarkers().hasInjectMarkersRecursive(typeNode, sourceFile);
  }
 
  private isReactComponent(node: FunctionDeclaration | ArrowFunction): boolean {
    const body = Node.isFunctionDeclaration(node) ? node.getBody() : node.getBody();
    if (!body) return false;

    const bodyText = body.getText();
    return bodyText.includes('return') && (
      bodyText.includes('<') || 
      bodyText.includes('React.createElement') ||
      bodyText.includes('jsx')
    );
  }

  // NEW: Enhanced logging with pipeline statistics
  private logTransformationStatistics(): void {
    try {
      if (this.interfaceResolver && typeof this.interfaceResolver.getInterfaceImplementations === 'function') {
        const implementations = this.interfaceResolver.getInterfaceImplementations();
        if (implementations instanceof Map && implementations.size > 0) {
          console.log('\n📋 Available Interface Implementations:');
          let count = 0;
          for (const [key, impl] of implementations) {
            if (count < 10) {
              console.log(`  ${impl.interfaceName} -> ${impl.implementationClass}`);
              count++;
            }
          }
          if (implementations.size > 10) {
            console.log(`  ... and ${implementations.size - 10} more`);
          }
        }
      }

      // Log pipeline-specific statistics
      console.log('\n🔧 Transformation Pipeline Statistics:');
      console.log(`  📝 Functions normalized: ${this.transformationCount}`);
      console.log(`  📁 Files transformed: ${this.transformedFiles.size}`);
      console.log(`  ⚠️  Warnings: ${this.warnings.length}`);
      console.log(`  ❌ Errors: ${this.errors.length}`);

    } catch (error) {
      console.warn('⚠️  Error accessing transformation statistics:', error);
    }
  }

  private createTransformationResult(startTime: number, endTime: number): TransformationResult {
    const successful = this.transformedFiles.size;
    const failed = this.errors.filter(e => e.candidate).length;
    const resolutionStats = this.getResolutionStatistics();

    const summary: TransformationSummary = {
      totalCandidates: this.transformationCandidates.length,
      successfulTransformations: successful,
      failedTransformations: failed,
      skippedTransformations: this.transformationCandidates.length - successful - failed,
      dependenciesResolved: resolutionStats.successfulResolutions,
      dependenciesUnresolved: resolutionStats.failedResolutions,
      byType: {
        class: 0,
        function: this.transformationCandidates.filter(c => c.type === 'function').length,
        arrowFunction: this.transformationCandidates.filter(c => c.type === 'arrow-function').length
      },
      byResolutionStrategy: resolutionStats.byStrategy as any,
      performance: {
        startTime,
        endTime,
        duration: endTime - startTime
      }
    };

    return {
      transformedFiles: this.transformedFiles as any,
      summary,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  private getResolutionStatistics(): any {
    const implementations = this.interfaceResolver.getInterfaceImplementations();
    const dependencies = this.interfaceResolver.getServiceDependencies();

    let successfulResolutions = 0;
    let failedResolutions = 0;
    const byStrategy: Record<string, number> = {
      interface: 0,
      inheritance: 0,
      class: 0,
      notFound: 0
    };

    for (const [, impl] of implementations) {
      successfulResolutions++;
      if (impl.isInheritanceBased) byStrategy.inheritance++;
      else if (impl.isClassBased) byStrategy.class++;
      else byStrategy.interface++;
    }

    for (const candidate of this.transformationCandidates) {
      failedResolutions += this.warnings.filter(w => 
        w.type === 'optional-missing' && w.message.includes('implementation')
      ).length;
    }

    return {
      successfulResolutions,
      failedResolutions,
      byStrategy
    };
  }

  // Public API methods - enhanced with pipeline information

  getTransformationSummary(): { 
    count: number; 
    functions: string[]; 
    transformedFiles: string[];
    resolvedDependencies: number;
    pipelineEnabled: boolean;
    normalizationPerformed: boolean;
  } {
    let resolvedDependencies = 0;
    
    try {
      if (this.interfaceResolver && typeof this.interfaceResolver.getInterfaceImplementations === 'function') {
        const implementations = this.interfaceResolver.getInterfaceImplementations();
        if (implementations instanceof Map) {
          resolvedDependencies = implementations.size;
        }
      }
    } catch (error) {
      console.warn('⚠️  Error getting resolved dependencies count:', error);
    }
    
    return {
      count: this.transformationCount,
      functions: this.transformationCandidates.map(c => c.metadata?.componentName || 'unknown'),
      transformedFiles: Array.from(this.transformedFiles.keys()),
      resolvedDependencies,
      pipelineEnabled: true, // NEW: Indicates pipeline is being used
      normalizationPerformed: this.transformationCount > 0 // NEW: Indicates if normalization happened
    };
  }

  // Enhanced debug methods using shared logic and pipeline information
  async getDebugInfo(): Promise<any> {
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
        transformedFiles: this.transformedFiles.size,
        errors: this.errors,
        warnings: this.warnings,
        // NEW: Pipeline-specific debug info
        pipelineInfo: {
          enabled: true,
          normalizationEnabled: true,
          fallbacksEnabled: true,
          transformationCount: this.transformationCount
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        configHash: this.configManager.getConfigHash(),
        error: error instanceof Error ? error.message : 'Unknown error',
        pipelineInfo: { enabled: true, error: true },
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

  // Expose additional configuration options
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

  // NEW: Access to transformation pipeline
  getTransformationPipeline(): TransformationPipeline {
    return this.transformationPipeline;
  }
}