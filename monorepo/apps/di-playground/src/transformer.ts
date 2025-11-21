import { Project, Node } from 'ts-morph';

// Import browser-compatible components directly from source
// @ts-ignore - importing from source files
import { TransformationPipeline } from '../../packages/di-core/tools/functional-di-enhanced-transformer/transformation-pipeline.ts';
// @ts-ignore
import { IntegratedInterfaceResolver } from '../../packages/di-core/tools/interface-resolver/integrated-interface-resolver.ts';
// @ts-ignore
import { SharedDependencyExtractor } from '../../packages/di-core/tools/shared/SharedDependencyExtractor.ts';
// @ts-ignore
import { SharedTypeResolver } from '../../packages/di-core/tools/shared/SharedTypeResolver.ts';
// @ts-ignore
import { DiInjectMarkers } from '../../packages/di-core/tools/functional-di-enhanced-transformer/di-inject-markers.ts';
// @ts-ignore
import { ImportManager } from '../../packages/di-core/tools/functional-di-enhanced-transformer/import-manager.ts';

export interface TransformationResult {
  success: boolean;
  transformedCode?: string;
  error?: string;
  warnings?: string[];
  stats?: {
    transformedComponents: number;
    errors: number;
    warnings: number;
  };
}

/**
 * Browser-compatible transformer using the actual TDI2 transformation pipeline.
 * Runs entirely in-memory without Node.js dependencies.
 */
export class BrowserTransformer {
  private project: Project;
  private virtualRoot = '/virtual';
  private interfaceResolver: IntegratedInterfaceResolver;
  private typeResolver: SharedTypeResolver;
  private dependencyExtractor: SharedDependencyExtractor;
  private transformationPipeline: TransformationPipeline;
  private diInjectMarkers: DiInjectMarkers;
  private importManager: ImportManager;
  private cachedUsedServices: Set<string> = new Set(); // Cache services found before transformation

  constructor() {
    // Create in-memory project for browser use
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // ESNext
        module: 99, // ESNext
        jsx: 2, // React
        experimentalDecorators: true,
        lib: ['es2020', 'dom'],
        skipLibCheck: true,
      },
    });

    // Initialize DI inject markers detector
    this.diInjectMarkers = new DiInjectMarkers();

    // Initialize the transformation components - CRITICAL: Pass our project instance
    this.interfaceResolver = new IntegratedInterfaceResolver({
      scanDirs: [this.virtualRoot],
      enableInheritanceDI: true,
      enableStateDI: true,
      project: this.project, // Pass our project so it scans the right files
    });

    this.typeResolver = new SharedTypeResolver(this.interfaceResolver);
    this.dependencyExtractor = new SharedDependencyExtractor(this.typeResolver, {
      scanDirs: [this.virtualRoot],
    });

    this.transformationPipeline = new TransformationPipeline({
      generateFallbacks: true,
      preserveTypeAnnotations: true,
      interfaceResolver: this.interfaceResolver,
    });

    this.importManager = new ImportManager({
      scanDirs: [this.virtualRoot],
      outputDir: `${this.virtualRoot}/.tdi2`,
    });

    // Don't pre-create common services - they pollute the virtual filesystem
    // Services will be created dynamically when examples load their files
  }

  /**
   * Update a single virtual file's content (without re-scanning)
   */
  updateVirtualFile(filePath: string, content: string): void {
    const virtualPath = `${this.virtualRoot}/${filePath.replace(/^src\//, '')}`;

    // Check if file exists and update it, or create new one
    const existingFile = this.project.getSourceFile(virtualPath);
    if (existingFile) {
      existingFile.replaceWithText(content);
      console.log(`📝 Updated virtual file: ${virtualPath}`);
    } else {
      this.project.createSourceFile(virtualPath, content);
      console.log(`📄 Created new virtual file: ${virtualPath}`);
    }
  }

  /**
   * Update multiple virtual files and re-scan interfaces once
   * More efficient than updating one-by-one
   */
  async updateFilesAndRescan(files: Array<{ path: string; content: string }>): Promise<void> {
    // CRITICAL: Clear all existing files to prevent pollution from previous examples
    const allFiles = this.project.getSourceFiles();
    console.log(`🗑️  Clearing ${allFiles.length} existing files from virtual filesystem`);
    for (const file of allFiles) {
      this.project.removeSourceFile(file);
    }
    console.log(`✅ Virtual filesystem cleared`);

    // Update all files first
    for (const file of files) {
      this.updateVirtualFile(file.path, file.content);
    }

    // CRITICAL: Cache used services BEFORE transformation happens
    // After transformation, Inject<T> markers are replaced with useService() calls
    this.cachedUsedServices = this.findUsedServices();
    console.log(`📌 Cached ${this.cachedUsedServices.size} used services before transformation`);

    // Then re-scan interfaces once
    await this.scanInterfaces();
    console.log(`✅ Updated ${files.length} files and re-scanned interfaces`);
  }

  /**
   * Re-scan interfaces without updating files
   * Used after transformations that modify source files
   */
  async rescanInterfaces(): Promise<void> {
    await this.scanInterfaces();
  }

  private async scanInterfaces(): Promise<void> {
    try {
      // BROWSER FIX: Don't call scanProject() because it tries to read from disk
      // Instead, manually scan the source files we already created in memory

      // Clear any existing mappings
      const interfaces = (this.interfaceResolver as any).interfaces;
      if (interfaces) {
        interfaces.clear();
      }

      // Get all source files already in the project
      const sourceFiles = this.project.getSourceFiles();
      console.log(`📁 Scanning ${sourceFiles.length} source files already in project...`);

      // Manually trigger the interface collection process
      for (const sourceFile of sourceFiles) {
        const filePath = sourceFile.getFilePath();
        if (filePath.includes('node_modules') || filePath.includes('.tdi2')) continue;

        console.log(`  📄 Scanning ${filePath}...`);
        const classes = sourceFile.getClasses();

        for (const classDecl of classes) {
          const className = classDecl.getName();
          if (!className) continue;

          // Check for @Service decorator
          const decorators = classDecl.getDecorators();
          const hasServiceDecorator = decorators.some(d => {
            const name = d.getText();
            return name.includes('Service') || name.includes('@Service');
          });

          if (!hasServiceDecorator) continue;

          console.log(`    ✓ Found service: ${className}`);

          // Get implemented interfaces
          const implementsClause = classDecl.getImplements();
          for (const impl of implementsClause) {
            const interfaceName = impl.getText();
            console.log(`      → implements ${interfaceName}`);

            // Generate sanitized key (used as service token)
            const sanitizedKey = `${interfaceName}__${filePath.replace(/^\/virtual\//, '').replace(/\//g, '_').replace(/\.ts$/, '')}`;
            console.log(`      → sanitizedKey: ${sanitizedKey}`);

            // Register this interface->class mapping
            const mapping = {
              implementationClass: className,
              interfaceName: interfaceName,
              filePath: filePath,
              sanitizedKey: sanitizedKey,
              isGeneric: false,
              typeParameters: [],
              scope: 'singleton' as const,
              isAutoResolved: true,
              registrationType: 'interface',
              isClassBased: false,
              isInheritanceBased: false,
            };

            // Store in the resolver's internal map (correct property name is 'interfaces')
            const interfaceMap = (this.interfaceResolver as any).interfaces;
            if (interfaceMap) {
              interfaceMap.set(interfaceName, mapping);
            }
          }

          // Also register the class itself
          const classSanitizedKey = `${className}__${filePath.replace(/^\/virtual\//, '').replace(/\//g, '_').replace(/\.ts$/, '')}`;
          const classMapping = {
            implementationClass: className,
            interfaceName: className,
            filePath: filePath,
            sanitizedKey: classSanitizedKey,
            isGeneric: false,
            typeParameters: [],
            scope: 'singleton' as const,
            isAutoResolved: true,
            registrationType: 'class',
            isClassBased: true,
            isInheritanceBased: false,
          };
          const interfaceMap = (this.interfaceResolver as any).interfaces;
          if (interfaceMap) {
            interfaceMap.set(className, classMapping);
          }
        }
      }

      const interfaceMap = (this.interfaceResolver as any).interfaces;
      const mappingCount = interfaceMap ? interfaceMap.size : 0;
      console.log(`✅ Interface scan complete. Found ${mappingCount} mappings`);
    } catch (error) {
      console.error('Error scanning interfaces:', error);
    }
  }

  /**
   * Check if a component has Inject<T> markers in its parameters
   */
  private hasInjectMarkers(component: any, sourceFile: any): boolean {
    try {
      const parameters = component.getParameters();
      for (const param of parameters) {
        const typeNode = param.getTypeNode();
        if (typeNode && this.diInjectMarkers.hasInjectMarkersRecursive(typeNode, sourceFile)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.warn('Error checking for inject markers:', error);
      return false;
    }
  }

  /**
   * Find all service interfaces referenced in component files
   */
  private findUsedServices(): Set<string> {
    const usedServices = new Set<string>();

    // Get ALL source files to see what we have
    const allFiles = this.project.getSourceFiles();
    console.log(`📁 All files in project (${allFiles.length}):`, allFiles.map(f => f.getFilePath()));

    // Get all component files
    const componentFiles = allFiles.filter(f =>
      f.getFilePath().includes('/components/')
    );

    console.log(`🔍 Analyzing ${componentFiles.length} component files for service usage...`);
    if (componentFiles.length === 0) {
      console.warn(`⚠️  No component files found! Check if files contain '/components/' in path`);
    }

    for (const file of componentFiles) {
      const filePath = file.getFilePath();
      const fileText = file.getFullText();
      console.log(`  📄 Scanning ${filePath}...`);
      console.log(`  📝 File content preview:`, fileText.substring(0, 200));

      // Find all Inject<ServiceInterface> patterns
      const injectPattern = /Inject<(\w+)>/g;
      let match;
      let foundInFile = false;
      while ((match = injectPattern.exec(fileText)) !== null) {
        const serviceName = match[1];
        usedServices.add(serviceName);
        console.log(`  ✓ Found usage: ${serviceName} in ${file.getBaseName()}`);
        foundInFile = true;
      }

      // Also find InjectOptional<ServiceInterface> patterns
      const injectOptionalPattern = /InjectOptional<(\w+)>/g;
      while ((match = injectOptionalPattern.exec(fileText)) !== null) {
        const serviceName = match[1];
        usedServices.add(serviceName);
        console.log(`  ✓ Found optional usage: ${serviceName} in ${file.getBaseName()}`);
        foundInFile = true;
      }

      if (!foundInFile) {
        console.log(`  ⚠️  No Inject<> patterns found in ${file.getBaseName()}`);
      }
    }

    console.log(`📊 Total unique services used: ${usedServices.size}`, Array.from(usedServices));
    return usedServices;
  }

  /**
   * Generate the DI_CONFIG file content with the same structure as the real Vite plugin
   */
  generateDIConfig(): string {
    const mappings = (this.interfaceResolver as any).interfaces || new Map();

    console.log('Generating DI_CONFIG. Mappings size:', mappings.size);
    console.log('All files in project:', this.project.getSourceFiles().map(f => f.getFilePath()));

    if (mappings.size === 0) {
      return `// Auto-generated DI configuration
// No services found
// Project has ${this.project.getSourceFiles().length} files

export const DI_CONFIG = {};

export const SERVICE_TOKENS = {};

export const INTERFACE_IMPLEMENTATIONS = {};
`;
    }

    // Use cached services (found before transformation)
    // We can't call findUsedServices() here because components are already transformed
    const usedServices = this.cachedUsedServices;

    console.log(`📋 Cached used services (${usedServices.size}):`, Array.from(usedServices));
    console.log(`📋 Available mappings (${mappings.size}):`, Array.from(mappings.keys()));

    if (usedServices.size === 0) {
      return `// Auto-generated DI configuration
// No services used in this example
// Tip: Add Inject<ServiceInterface> types to component props to use dependency injection

export const DI_CONFIG = {};

export const SERVICE_TOKENS = {};

export const INTERFACE_IMPLEMENTATIONS = {};
`;
    }

    const factoryFunctions: string[] = [];
    const configEntries: string[] = [];
    const serviceTokens: Record<string, string> = {};
    const interfaceImplementations: Record<string, string[]> = {};
    const imports: Set<string> = new Set();
    const processedClasses = new Set<string>(); // Track which classes we've processed

    // Process all interface->implementation mappings
    mappings.forEach((implementation: any, interfaceName: string) => {
      // FILTER: Only include if this interface is used in components
      if (!usedServices.has(interfaceName)) {
        console.log(`  ⏭️  Skipping unused service: ${interfaceName}`);
        return;
      }
      console.log(`  ✅ Registering service: ${interfaceName}`);
      const className = implementation.implementationClass;
      const filePath = implementation.filePath.replace(/^\/virtual\//, '').replace(/\.ts$/, '');

      // Create unique token
      const token = `${interfaceName}__${filePath.replace(/\//g, '_')}`;

      // Add import (DI_CONFIG is in .tdi2 folder, so use ../ to go up to src/)
      imports.add(`import { ${className} } from '../${filePath}';`);

      // Create factory function (only once per class)
      if (!processedClasses.has(className)) {
        factoryFunctions.push(`function create${className}(container: any) {
  return () => new ${className}();
}`);
        processedClasses.add(className);
      }

      // Add config entry
      configEntries.push(`  '${token}': {
    factory: create${className},
    scope: 'singleton' as const,
    dependencies: [],
    interfaceName: '${interfaceName}',
    implementationClass: '${className}',
    implementationClassPath: '${token}',
    isAutoResolved: true,
    registrationType: 'interface',
    isClassBased: false,
    isInheritanceBased: false,
    baseClass: null,
    baseClassGeneric: null,
  }`);

      // Add service token mapping
      serviceTokens[className] = token;

      // Add interface implementation mapping
      if (!interfaceImplementations[interfaceName]) {
        interfaceImplementations[interfaceName] = [];
      }
      interfaceImplementations[interfaceName].push(className);
    });

    const timestamp = new Date().toISOString();
    const usedServicesList = Array.from(usedServices).join(', ');

    return `// Auto-generated DI configuration
// Generated: ${timestamp}
// Services used in this example: ${usedServicesList}

${Array.from(imports).join('\n')}

// Factory functions
${factoryFunctions.join('\n\n')}

// DI Configuration Map
export const DI_CONFIG = {
${configEntries.join(',\n')}
};

// Service mappings
export const SERVICE_TOKENS = ${JSON.stringify(serviceTokens, null, 2)};

export const INTERFACE_IMPLEMENTATIONS = ${JSON.stringify(interfaceImplementations, null, 2)};
`;
  }

  async transform(inputCode: string, fileName: string = 'Component.tsx'): Promise<TransformationResult> {
    try {
      // Create the component file in virtual filesystem (fileName already includes path like src/components/...)
      const componentPath = `${this.virtualRoot}/${fileName.replace(/^src\//, '')}`;

      // CRITICAL: Delete existing file first to prevent transformation stacking
      const existingFile = this.project.getSourceFile(componentPath);
      if (existingFile) {
        this.project.removeSourceFile(existingFile);
      }

      // Create fresh source file
      const sourceFile = this.project.createSourceFile(componentPath, inputCode, { overwrite: true });

      // Find components with @di-inject marker
      const functions = sourceFile.getFunctions();
      const variables = sourceFile.getVariableDeclarations();

      let transformedCount = 0;
      const warnings: string[] = [];
      const errors: string[] = [];

      // Transform function declarations
      for (const func of functions) {
        if (this.hasInjectMarkers(func, sourceFile)) {
          try {
            // Extract dependencies
            const dependencies = this.dependencyExtractor.extractFromFunctionParameter(func, sourceFile);

            // Run transformation pipeline
            this.transformationPipeline.transformComponent(func, dependencies, sourceFile);
            transformedCount++;
          } catch (err) {
            errors.push(`Error transforming ${func.getName()}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Transform arrow function components
      for (const varDecl of variables) {
        const initializer = varDecl.getInitializer();
        if (initializer && Node.isArrowFunction(initializer)) {
          if (this.hasInjectMarkers(initializer, sourceFile)) {
            try {
              // Extract dependencies
              const dependencies = this.dependencyExtractor.extractFromArrowFunction(initializer as any, sourceFile);

              // Run transformation pipeline
              this.transformationPipeline.transformComponent(initializer as any, dependencies, sourceFile);
              transformedCount++;
            } catch (err) {
              errors.push(`Error transforming ${varDecl.getName()}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }
        }
      }

      // Add useService imports if transformations were made
      if (transformedCount > 0) {
        this.importManager.ensureDIImports(sourceFile);
      }

      // Get the transformed code
      const transformedCode = sourceFile.getFullText();

      // Add warnings if no transformations occurred
      if (transformedCount === 0) {
        warnings.push('No Inject<T> type markers found in component props. Components need props with Inject<ServiceInterface> types to be transformed.');
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join('\n'),
          transformedCode: inputCode,
        };
      }

      return {
        success: true,
        transformedCode,
        warnings,
        stats: {
          transformedComponents: transformedCount,
          errors: errors.length,
          warnings: warnings.length,
        },
      };
    } catch (error) {
      console.error('Transformation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
        transformedCode: inputCode,
      };
    }
  }
}
