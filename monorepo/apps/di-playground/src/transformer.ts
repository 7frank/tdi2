import { Project, SyntaxKind } from 'ts-morph';

// Import browser-compatible components directly from source
// @ts-ignore - importing from source files
import { TransformationPipeline } from '../../packages/di-core/tools/functional-di-enhanced-transformer/transformation-pipeline';
// @ts-ignore
import { IntegratedInterfaceResolver } from '../../packages/di-core/tools/interface-resolver/integrated-interface-resolver';
// @ts-ignore
import { SharedDependencyExtractor } from '../../packages/di-core/tools/shared/SharedDependencyExtractor';
// @ts-ignore
import { SharedTypeResolver } from '../../packages/di-core/tools/shared/SharedTypeResolver';
// @ts-ignore
import { DiInjectMarkers } from '../../packages/di-core/tools/functional-di-enhanced-transformer/di-inject-markers';

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

    // Initialize the transformation components
    this.interfaceResolver = new IntegratedInterfaceResolver({
      scanDirs: [this.virtualRoot],
      enableInheritanceDI: true,
      enableStateDI: true,
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

  private async scanInterfaces(): Promise<void> {
    try {
      // Set the project for the interface resolver
      (this.interfaceResolver as any).project = this.project;

      // Scan all service files
      await this.interfaceResolver.scanProject();
    } catch (error) {
      console.error('Error scanning interfaces:', error);
    }
  }

  async transform(inputCode: string, fileName: string = 'Component.tsx'): Promise<TransformationResult> {
    try {
      // Create the component file in virtual filesystem
      const componentPath = `${this.virtualRoot}/components/${fileName}`;
      const sourceFile = this.project.createSourceFile(componentPath, inputCode, { overwrite: true });

      // Find components with @di-inject marker
      const functions = sourceFile.getFunctions();
      const variables = sourceFile.getVariableDeclarations();

      let transformedCount = 0;
      const warnings: string[] = [];
      const errors: string[] = [];

      // Transform function declarations
      for (const func of functions) {
        const fullText = func.getFullText();
        if (DiInjectMarkers.hasDIMarker(fullText)) {
          try {
            // Extract dependencies
            const dependencies = this.dependencyExtractor.extractDependencies(func, sourceFile);

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
        if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
          const varStatement = varDecl.getVariableStatement();
          if (varStatement && DiInjectMarkers.hasDIMarker(varStatement.getFullText())) {
            try {
              // Extract dependencies
              const dependencies = this.dependencyExtractor.extractDependencies(initializer as any, sourceFile);

              // Run transformation pipeline
              this.transformationPipeline.transformComponent(initializer as any, dependencies, sourceFile);
              transformedCount++;
            } catch (err) {
              errors.push(`Error transforming ${varDecl.getName()}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }
        }
      }

      // Get the transformed code
      const transformedCode = sourceFile.getFullText();

      // Add warnings if no transformations occurred
      if (transformedCount === 0) {
        warnings.push('No @di-inject markers found. Add // @di-inject comment above your component.');
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
