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

    // Create common service interfaces that examples might use
    this.createCommonServices();

    // Scan the project to populate the interface resolver
    this.scanInterfaces();
  }

  private createCommonServices(): void {
    // Counter Service
    this.project.createSourceFile(`${this.virtualRoot}/services/CounterService.ts`, `
import { Service } from '@tdi2/di-core';

export interface CounterServiceInterface {
  state: { count: number };
  increment(): void;
  decrement(): void;
}

@Service()
export class CounterService implements CounterServiceInterface {
  state = { count: 0 };

  increment() {
    this.state.count++;
  }

  decrement() {
    this.state.count--;
  }
}
    `);

    // Todo Service
    this.project.createSourceFile(`${this.virtualRoot}/services/TodoService.ts`, `
import { Service } from '@tdi2/di-core';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoServiceInterface {
  state: { todos: Todo[] };
  addTodo(text: string): void;
  removeTodo(id: string): void;
  toggleTodo(id: string): void;
}

@Service()
export class TodoService implements TodoServiceInterface {
  state = { todos: [] as Todo[] };

  addTodo(text: string) {
    this.state.todos.push({
      id: Math.random().toString(36),
      text,
      completed: false,
    });
  }

  removeTodo(id: string) {
    this.state.todos = this.state.todos.filter(t => t.id !== id);
  }

  toggleTodo(id: string) {
    const todo = this.state.todos.find(t => t.id === id);
    if (todo) todo.completed = !todo.completed;
  }
}
    `);

    // User Service
    this.project.createSourceFile(`${this.virtualRoot}/services/UserService.ts`, `
import { Service } from '@tdi2/di-core';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserServiceInterface {
  state: { user: User | null };
  setUser(user: User): void;
  clearUser(): void;
}

@Service()
export class UserService implements UserServiceInterface {
  state = { user: null as User | null };

  setUser(user: User) {
    this.state.user = user;
  }

  clearUser() {
    this.state.user = null;
  }
}
    `);

    // Auth Service
    this.project.createSourceFile(`${this.virtualRoot}/services/AuthService.ts`, `
import { Service } from '@tdi2/di-core';

export interface AuthServiceInterface {
  state: { isAuthenticated: boolean };
  login(): void;
  logout(): void;
}

@Service()
export class AuthService implements AuthServiceInterface {
  state = { isAuthenticated: false };

  login() {
    this.state.isAuthenticated = true;
  }

  logout() {
    this.state.isAuthenticated = false;
  }
}
    `);

    // Cart Service
    this.project.createSourceFile(`${this.virtualRoot}/services/CartService.ts`, `
import { Service } from '@tdi2/di-core';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartServiceInterface {
  state: { items: CartItem[] };
  addItem(product: Product): void;
  removeItem(id: string): void;
  incrementQuantity(id: string): void;
  decrementQuantity(id: string): void;
  checkout(): void;
}

@Service()
export class CartService implements CartServiceInterface {
  state = { items: [] as CartItem[] };

  addItem(product: Product) {
    const existing = this.state.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.state.items.push({ ...product, quantity: 1 });
    }
  }

  removeItem(id: string) {
    this.state.items = this.state.items.filter(i => i.id !== id);
  }

  incrementQuantity(id: string) {
    const item = this.state.items.find(i => i.id === id);
    if (item) item.quantity++;
  }

  decrementQuantity(id: string) {
    const item = this.state.items.find(i => i.id === id);
    if (item && item.quantity > 1) item.quantity--;
  }

  checkout() {
    this.state.items = [];
  }
}
    `);

    // Product Service
    this.project.createSourceFile(`${this.virtualRoot}/services/ProductService.ts`, `
import { Service } from '@tdi2/di-core';

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface ProductServiceInterface {
  state: { products: Product[] };
  loadProducts(): void;
}

@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    products: [
      { id: '1', name: 'Product 1', price: 10 },
      { id: '2', name: 'Product 2', price: 20 },
    ] as Product[]
  };

  loadProducts() {
    // Simulate loading
  }
}
    `);
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
    // Update all files first
    for (const file of files) {
      this.updateVirtualFile(file.path, file.content);
    }

    // Then re-scan interfaces once
    await this.scanInterfaces();
    console.log(`✅ Updated ${files.length} files and re-scanned interfaces`);
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

    // Get all component files
    const componentFiles = this.project.getSourceFiles().filter(f =>
      f.getFilePath().includes('/components/')
    );

    console.log(`🔍 Analyzing ${componentFiles.length} component files for service usage...`);

    for (const file of componentFiles) {
      const fileText = file.getFullText();

      // Find all Inject<ServiceInterface> patterns
      const injectPattern = /Inject<(\w+)>/g;
      let match;
      while ((match = injectPattern.exec(fileText)) !== null) {
        const serviceName = match[1];
        usedServices.add(serviceName);
        console.log(`  ✓ Found usage: ${serviceName} in ${file.getBaseName()}`);
      }

      // Also find InjectOptional<ServiceInterface> patterns
      const injectOptionalPattern = /InjectOptional<(\w+)>/g;
      while ((match = injectOptionalPattern.exec(fileText)) !== null) {
        const serviceName = match[1];
        usedServices.add(serviceName);
        console.log(`  ✓ Found optional usage: ${serviceName} in ${file.getBaseName()}`);
      }
    }

    console.log(`📊 Total unique services used: ${usedServices.size}`);
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

    // Find which services are actually used in components
    const usedServices = this.findUsedServices();

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
      // Create the component file in virtual filesystem
      const componentPath = `${this.virtualRoot}/components/${fileName}`;

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
