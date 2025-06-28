// tools/functional-di-enhanced-transformer/functional-di-enhanced-transformer.ts - MAIN ENTRY POINT

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
import { InterfaceResolver } from "../interface-resolver/interface-resolver";
import { DependencyExtractor } from './dependency-extractor';
import { ComponentTransformer } from './component-transformer';
import { ImportManager } from './import-manager';
import { DebugFileGenerator } from './debug-file-generator';
import { TransformationOptions, FunctionalDependency } from './types';

export class FunctionalDIEnhancedTransformer {
  private project: Project;
  private interfaceResolver: InterfaceResolver;
  private dependencyExtractor: DependencyExtractor;
  private componentTransformer: ComponentTransformer;
  private importManager: ImportManager;
  private debugFileGenerator: DebugFileGenerator;
  private transformedFiles: Map<string, string> = new Map();
  private options: TransformationOptions;
  private transformationCount = 0;
  private configManager: ConfigManager;

  constructor(options: Partial<TransformationOptions> = {}) {
    this.options = {
      srcDir: './src',
      outputDir: './src/generated',
      generateDebugFiles: false,
      verbose: false,
      ...options
    };

    this.project = new Project({
      tsConfigFilePath: './tsconfig.json',
      useInMemoryFileSystem: false
    });

    // Initialize ConfigManager
    this.configManager = new ConfigManager({
      srcDir: this.options.srcDir!,
      outputDir: this.options.outputDir!,
      enableFunctionalDI: true,
      verbose: this.options.verbose!,
      customSuffix: this.options.customSuffix
    });

    // Initialize InterfaceResolver
    this.interfaceResolver = new InterfaceResolver({
      verbose: this.options.verbose,
      srcDir: this.options.srcDir
    });

    // Initialize functional components
    this.dependencyExtractor = new DependencyExtractor(this.options);
    this.componentTransformer = new ComponentTransformer(this.options);
    this.importManager = new ImportManager(this.options);
    this.debugFileGenerator = new DebugFileGenerator(this.configManager, this.options);
  }

  async transformForBuild(): Promise<Map<string, string>> {
    if (this.options.verbose) {
      console.log('🎯 Starting interface-based functional DI transformation...');
    }

    // First, scan for interface implementations
    await this.interfaceResolver.scanProject();

    // Validate dependencies
    const validation = this.interfaceResolver.validateDependencies();
    if (!validation.isValid) {
      console.warn('⚠️  Some dependencies may not be resolvable:');
      if (validation.missingImplementations.length > 0) {
        console.warn('Missing implementations:', validation.missingImplementations);
      }
      // Continue with transformation even if some dependencies are missing
    }

    // Add source files
    this.project.addSourceFilesAtPaths(`${this.options.srcDir}/**/*.{ts,tsx}`);

    // Transform each file
    for (const sourceFile of this.project.getSourceFiles()) {
      if (this.shouldSkipFile(sourceFile)) continue;

      if (this.transformSourceFile(sourceFile)) {
        // File was transformed, save the result
        this.transformedFiles.set(sourceFile.getFilePath(), sourceFile.getFullText());
      }
    }

    if (this.options.generateDebugFiles) {
      await this.debugFileGenerator.generateDebugFiles(this.transformedFiles);
    }

    if (this.options.verbose) {
      console.log(`✅ Transformed ${this.transformationCount} functions in ${this.transformedFiles.size} files`);
      console.log(`🏗️  Config directory: ${this.configManager.getConfigDir()}`);
      
      // Safe method access for interface information
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
        } else if (this.options.verbose) {
          console.warn('⚠️  getInterfaceImplementations method not available');
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn('⚠️  Error accessing interface implementations:', error);
        }
      }
    }

    return this.transformedFiles;
  }

  private shouldSkipFile(sourceFile: SourceFile): boolean {
    const filePath = sourceFile.getFilePath();
    return filePath.includes('generated') || 
           filePath.includes('node_modules') ||
           filePath.includes('.d.ts') ||
           filePath.includes('.tdi2');
  }

  private transformSourceFile(sourceFile: SourceFile): boolean {
    let hasTransformations = false;

    if (this.options.verbose) {
      console.log(`📂 Processing ${sourceFile.getBaseName()}...`);
    }

    // Transform function declarations
    for (const func of sourceFile.getFunctions()) {
      if (this.transformFunction(func, sourceFile)) {
        hasTransformations = true;
        this.transformationCount++;
        
        if (this.options.verbose) {
          console.log(`✅ Transformed function: ${func.getName()}`);
        }
      }
    }

    // Transform arrow functions in variable declarations
    for (const varStatement of sourceFile.getVariableStatements()) {
      for (const declaration of varStatement.getDeclarations()) {
        const initializer = declaration.getInitializer();
        if (initializer && Node.isArrowFunction(initializer)) {
          if (this.transformArrowFunction(declaration, initializer, sourceFile)) {
            hasTransformations = true;
            this.transformationCount++;
            
            if (this.options.verbose) {
              console.log(`✅ Transformed arrow function: ${declaration.getName()}`);
            }
          }
        }
      }
    }

    return hasTransformations;
  }

  private transformFunction(func: FunctionDeclaration, sourceFile: SourceFile): boolean {
    const parameters = func.getParameters();
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const dependencies = this.dependencyExtractor.extractDependenciesFromParameter(firstParam, sourceFile);
    if (dependencies.length === 0) return false;

    // Resolve implementations for dependencies
    const resolvedDependencies = this.resolveDependencies(dependencies, func.getName() || 'anonymous');

    // Add DI imports if needed
    this.importManager.ensureDIImports(sourceFile);

    // Transform the function
    this.componentTransformer.transformFunction(func, resolvedDependencies);

    return true;
  }

  private transformArrowFunction(
    declaration: VariableDeclaration, 
    arrowFunc: ArrowFunction, 
    sourceFile: SourceFile
  ): boolean {
    const parameters = arrowFunc.getParameters();
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const dependencies = this.dependencyExtractor.extractDependenciesFromParameter(firstParam, sourceFile);
    if (dependencies.length === 0) return false;

    // Resolve implementations for dependencies
    const resolvedDependencies = this.resolveDependencies(dependencies, declaration.getName());

    // Add DI imports if needed
    this.importManager.ensureDIImports(sourceFile);

    // Transform the arrow function
    this.componentTransformer.transformArrowFunction(arrowFunc, resolvedDependencies);

    return true;
  }

  private resolveDependencies(
    dependencies: FunctionalDependency[], 
    componentName: string
  ): FunctionalDependency[] {
    const resolved: FunctionalDependency[] = [];

    for (const dependency of dependencies) {
      // Safe method access for resolveImplementation
      let implementation: any | undefined;
      
      try {
        if (this.interfaceResolver && typeof this.interfaceResolver.resolveImplementation === 'function') {
          implementation = this.interfaceResolver.resolveImplementation(dependency.interfaceType);
        } else if (this.options.verbose) {
          console.warn(`⚠️  resolveImplementation method not available on interface resolver`);
        }
      } catch (error) {
        if (this.options.verbose) {
          console.warn(`⚠️  Error resolving implementation for ${dependency.interfaceType}:`, error);
        }
      }
      
      if (implementation) {
        dependency.resolvedImplementation = implementation;
        // Use the implementation's sanitized key
        dependency.sanitizedKey = implementation.sanitizedKey;
        resolved.push(dependency);
        
        if (this.options.verbose) {
          console.log(`🔗 ${componentName}: ${dependency.interfaceType} -> ${implementation.implementationClass}`);
        }
      } else {
        if (dependency.isOptional) {
          // Optional dependency, continue without implementation
          resolved.push(dependency);
          
          if (this.options.verbose) {
            console.log(`⚠️  ${componentName}: Optional dependency ${dependency.interfaceType} not found`);
          }
        } else {
          // Required dependency missing - warn but continue
          console.warn(`⚠️  ${componentName}: Required dependency ${dependency.interfaceType} not found`);
          resolved.push(dependency); // Include anyway for error handling at runtime
        }
      }
    }

    return resolved;
  }

  getTransformationSummary(): { 
    count: number; 
    functions: string[]; 
    transformedFiles: string[];
    resolvedDependencies: number;
  } {
    let resolvedDependencies = 0;
    
    // Safe method access for getting implementations count
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
      functions: [],
      transformedFiles: Array.from(this.transformedFiles.keys()),
      resolvedDependencies
    };
  }

  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  getInterfaceResolver(): InterfaceResolver {
    return this.interfaceResolver;
  }
}