// tools/functional-di-enhanced-transformer/functional-di-enhanced-transformer.ts - REFACTORED to use shared logic

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

// Use shared components instead of local ones
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

// Keep only functional-specific components
import { ComponentTransformer } from './component-transformer';
import { ImportManager } from './import-manager';
import { DebugFileGenerator } from './debug-file-generator';
import { DestructuringProcessor } from './destructuring-processor';

interface TransformerOptions {
  srcDir?: string;
  outputDir?: string;
  generateDebugFiles?: boolean;
  verbose?: boolean;
  customSuffix?: string;
}

export class FunctionalDIEnhancedTransformer {
  private project: Project;
  private options: SharedTransformationOptions;
  private configManager: ConfigManager;
  private interfaceResolver: IntegratedInterfaceResolver;
  
  // Shared components (replacing local dependency extraction and type resolution)
  private dependencyExtractor: SharedDependencyExtractor;
  private serviceRegistry: SharedServiceRegistry;
  private typeResolver: SharedTypeResolver;
  
  // Functional-specific components
  private componentTransformer: ComponentTransformer;
  private importManager: ImportManager;
  private debugFileGenerator: DebugFileGenerator;
  
  // Transformation state
  private transformationCandidates: TransformationCandidate[] = [];
  private transformedFiles: Map<string, string> = new Map();
  private transformationCount = 0;
  private errors: TransformationError[] = [];
  private warnings: TransformationWarning[] = [];

  constructor(options: TransformerOptions = {}) {
    this.options = {
      srcDir: options.srcDir || './src',
      outputDir: options.outputDir || './src/generated',
      verbose: options.verbose || false,
      enableInterfaceResolution: true,
      enableInheritanceDI: true,
      enableStateDI: true,
      customSuffix: options.customSuffix
    };

    this.project = new Project({
      tsConfigFilePath: './tsconfig.json',
      useInMemoryFileSystem: false
    });

    // Initialize ConfigManager
    this.configManager = new ConfigManager({
      srcDir: this.options.srcDir,
      outputDir: this.options.outputDir,
      enableFunctionalDI: true,
      verbose: this.options.verbose,
      customSuffix: this.options.customSuffix
    });

    // Initialize InterfaceResolver
    this.interfaceResolver = new IntegratedInterfaceResolver({
      verbose: this.options.verbose,
      srcDir: this.options.srcDir,
      enableInheritanceDI: this.options.enableInheritanceDI,
      enableStateDI: this.options.enableStateDI
    });

    // Initialize shared components (replacing local implementations)
    this.typeResolver = new SharedTypeResolver(this.interfaceResolver, {
      verbose: this.options.verbose
    });

    this.dependencyExtractor = new SharedDependencyExtractor(this.typeResolver, {
      verbose: this.options.verbose
    });

    this.serviceRegistry = new SharedServiceRegistry(this.configManager, {
      verbose: this.options.verbose
    });

    // Initialize functional-specific components
    const functionalOptions = {
      srcDir: this.options.srcDir,
      outputDir: this.options.outputDir,
      generateDebugFiles: options.generateDebugFiles,
      verbose: this.options.verbose
    };

    this.componentTransformer = new ComponentTransformer(functionalOptions);
    this.importManager = new ImportManager(functionalOptions);
    this.debugFileGenerator = new DebugFileGenerator(this.configManager, functionalOptions);
  }

  async transformForBuild(): Promise<Map<string, string>> {
    const result = await this.transform();
    return result.transformedFiles;
  }

  async transform(): Promise<TransformationResult> {
    const startTime = Date.now();

    if (this.options.verbose) {
      console.log('🎯 Starting functional DI transformation with shared logic...');
    }

    try {
      // Phase 1: Scan and resolve interfaces using shared logic
      await this.scanAndResolveInterfaces();

      // Phase 2: Find React functional components
      await this.findFunctionalComponents();

      // Phase 3: Transform components using shared dependency extraction
      await this.transformComponents();

      // Phase 4: Register discovered services
      await this.registerDiscoveredServices();

      // Phase 5: Generate debug files if requested
      if ((this.options as any).generateDebugFiles) {
        await this.debugFileGenerator.generateDebugFiles(this.transformedFiles);
      }

      const endTime = Date.now();

      if (this.options.verbose) {
        console.log(`✅ Transformed ${this.transformationCount} functions in ${this.transformedFiles.size} files`);
        console.log(`🏗️  Config directory: ${this.configManager.getConfigDir()}`);
        console.log(`⏱️  Duration: ${endTime - startTime}ms`);
        
        // Log interface information using shared resolver
        this.logInterfaceInformation();
      }

      return this.createTransformationResult(startTime, endTime);

    } catch (error) {
      this.errors.push({
        type: 'configuration-error',
        message: error instanceof Error ? error.message : 'Unknown transformation error',
        details: error
      });

      throw error;
    }
  }

  private async scanAndResolveInterfaces(): Promise<void> {
    if (this.options.verbose) {
      console.log('🔍 Scanning project for interfaces using shared resolver...');
    }

    // Use shared interface resolution
    await this.interfaceResolver.scanProject();

    const validation = this.interfaceResolver.validateDependencies();
    if (!validation.isValid) {
      if (this.options.verbose) {
        console.warn('⚠️  Some dependencies may not be resolvable:');
        validation.missingImplementations.forEach(missing => {
          console.warn(`  - Missing: ${missing}`);
        });
      }

      // Add warnings for missing implementations
      validation.missingImplementations.forEach(missing => {
        this.warnings.push({
          type: 'optional-missing',
          message: `Missing implementation: ${missing}`,
          suggestion: 'Ensure all required services are implemented and decorated with @Service'
        });
      });
    }
  }

  private async findFunctionalComponents(): Promise<void> {
    if (this.options.verbose) {
      console.log('🔍 Finding React functional components...');
    }

    // Add source files
    this.project.addSourceFilesAtPaths(`${this.options.srcDir}/**/*.{ts,tsx}`);

    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      if (this.shouldSkipFile(sourceFile)) continue;

      // Find function declarations
      for (const func of sourceFile.getFunctions()) {
        const candidate = this.createFunctionCandidate(func, sourceFile);
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

    if (this.options.verbose) {
      console.log(`📋 Found ${this.transformationCandidates.length} functional component candidates`);
    }
  }

  private createFunctionCandidate(
    func: FunctionDeclaration, 
    sourceFile: SourceFile
  ): TransformationCandidate | null {
    const funcName = func.getName();
    if (!funcName) return null;

    // Check if function has DI markers in parameters
    if (!this.hasInjectMarkers(func.getParameters())) {
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

    // Check if arrow function has DI markers in parameters
    if (!this.hasInjectMarkers(arrowFunc.getParameters())) {
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

  private async transformComponents(): Promise<void> {
    if (this.options.verbose) {
      console.log('🔄 Transforming components using shared dependency extraction...');
    }

    for (const candidate of this.transformationCandidates) {
      try {
        await this.transformSingleComponent(candidate);
      } catch (error) {
        this.errors.push({
          type: 'generation-error',
          message: `Failed to transform ${candidate.metadata?.componentName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          candidate
        });
      }
    }
  }

  private async transformSingleComponent(candidate: TransformationCandidate): Promise<void> {
    const componentName = candidate.metadata?.componentName || 'unknown';

    // Extract dependencies using shared logic
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
      if (this.options.verbose) {
        console.log(`⚠️  No dependencies found for ${componentName}`);
      }
      return;
    }

    // Add DI imports using import manager
    this.importManager.ensureDIImports(candidate.sourceFile);

    // Transform the component using component transformer
    if (candidate.type === 'function' && Node.isFunctionDeclaration(candidate.node)) {
      this.componentTransformer.transformFunction(candidate.node, dependencies);
    } else if (candidate.type === 'arrow-function' && Node.isArrowFunction(candidate.node)) {
      this.componentTransformer.transformArrowFunction(candidate.node, dependencies);
    }

    // Mark as transformed
    this.transformedFiles.set(candidate.filePath, candidate.sourceFile.getFullText());
    this.transformationCount++;

    if (this.options.verbose) {
      console.log(`✅ Transformed ${componentName} with ${dependencies.length} dependencies`);
      dependencies.forEach(dep => {
        const status = dep.resolvedImplementation ? '✅' : (dep.isOptional ? '⚠️' : '❌');
        console.log(`    ${status} ${dep.serviceKey}: ${dep.interfaceType}`);
      });
    }
  }

  private async registerDiscoveredServices(): Promise<void> {
    if (this.options.verbose) {
      console.log('📝 Registering discovered services...');
    }

    // Get all implementations from interface resolver
    const implementations = this.interfaceResolver.getInterfaceImplementations();
    
    // Register services using shared registry
    this.serviceRegistry.registerServices(Array.from(implementations.values()), new Map());

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
  }

  private shouldSkipFile(sourceFile: SourceFile): boolean {
    const filePath = sourceFile.getFilePath();
    return filePath.includes('generated') || 
           filePath.includes('node_modules') ||
           filePath.includes('.d.ts') ||
           filePath.includes('.tdi2');
  }

  private hasInjectMarkers(parameters: ParameterDeclaration[]): boolean {
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const typeNode = firstParam.getTypeNode();
    if (!typeNode) return false;

    const typeText = typeNode.getText();
    return typeText.includes('Inject<') || typeText.includes('InjectOptional<');
  }

  private isReactComponent(node: FunctionDeclaration | ArrowFunction): boolean {
    // Check if function returns JSX
    const body = Node.isFunctionDeclaration(node) ? node.getBody() : node.getBody();
    if (!body) return false;

    const bodyText = body.getText();
    return bodyText.includes('return') && (
      bodyText.includes('<') || 
      bodyText.includes('React.createElement') ||
      bodyText.includes('jsx')
    );
  }

  private logInterfaceInformation(): void {
    try {
      if (this.interfaceResolver && typeof this.interfaceResolver.getInterfaceImplementations === 'function') {
        const implementations = this.interfaceResolver.getInterfaceImplementations();
        if (implementations instanceof Map && implementations.size > 0) {
          console.log('\n📋 Available Interface Implementations:');
          let count = 0;
          for (const [key, impl] of implementations) {
            if (count < 10) { // Limit output
              console.log(`  ${impl.interfaceName} -> ${impl.implementationClass}`);
              count++;
            }
          }
          if (implementations.size > 10) {
            console.log(`  ... and ${implementations.size - 10} more`);
          }
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn('⚠️  Error accessing interface implementations:', error);
      }
    }
  }

  private createTransformationResult(startTime: number, endTime: number): TransformationResult {
    const successful = this.transformedFiles.size;
    const failed = this.errors.filter(e => e.candidate).length;

    // Get resolution statistics using shared type resolver
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
      transformedFiles: this.transformedFiles,
      summary,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  private getResolutionStatistics(): any {
    // Get statistics from the shared interface resolver
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
      if (impl.isStateBased) byStrategy.state++;
      else if (impl.isInheritanceBased) byStrategy.inheritance++;
      else if (impl.isClassBased) byStrategy.class++;
      else byStrategy.interface++;
    }

    // Count unresolved dependencies from transformation candidates
    for (const candidate of this.transformationCandidates) {
      // This would require extracting dependencies again, but for stats we'll estimate
      // based on the warnings we've collected
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

  // Public API methods

  getTransformationSummary(): { 
    count: number; 
    functions: string[]; 
    transformedFiles: string[];
    resolvedDependencies: number;
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
      if (this.options.verbose) {
        console.warn('⚠️  Error getting resolved dependencies count:', error);
      }
    }
    
    return {
      count: this.transformationCount,
      functions: this.transformationCandidates.map(c => c.metadata?.componentName || 'unknown'),
      transformedFiles: Array.from(this.transformedFiles.keys()),
      resolvedDependencies
    };
  }

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
      if (this.options.verbose) {
        console.error('❌ Configuration validation failed:', error);
      }
      return false;
    }
  }
}