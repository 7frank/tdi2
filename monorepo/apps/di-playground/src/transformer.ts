import { Project, SourceFile } from 'ts-morph';
import { FunctionalDIEnhancedTransformer } from '@tdi2/di-core/tools';

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
 * Browser-compatible wrapper for the actual TDI2 transformer.
 * Uses the real FunctionalDIEnhancedTransformer with in-memory file system.
 */
export class BrowserTransformer {
  private project: Project;
  private virtualRoot = '/virtual';

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

    // Create common service interfaces that examples might use
    this.createCommonServices();
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

    // Create tsconfig for the virtual project
    this.project.createSourceFile(`${this.virtualRoot}/tsconfig.json`, JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        jsx: "react-jsx",
        experimentalDecorators: true,
        lib: ["ES2020", "DOM"]
      }
    }, null, 2));
  }

  async transform(inputCode: string, fileName: string = 'Component.tsx'): Promise<TransformationResult> {
    try {
      // Create the component file in virtual filesystem
      const componentPath = `${this.virtualRoot}/components/${fileName}`;
      const sourceFile = this.project.createSourceFile(componentPath, inputCode, { overwrite: true });

      // Initialize the actual TDI2 transformer with in-memory project
      const transformer = new FunctionalDIEnhancedTransformer({
        scanDirs: [this.virtualRoot],
        outputDir: `${this.virtualRoot}/.tdi2`,
        generateDebugFiles: false,
      });

      // HACK: Replace the transformer's project with our in-memory one
      // This is needed because the transformer creates its own project
      (transformer as any).project = this.project;

      // Run the actual transformation
      const summary = await transformer.transform();

      // Get the transformed code from the source file
      const transformedCode = sourceFile.getFullText();

      // Check if there were actual transformations
      const hasChanges = transformedCode !== inputCode;

      return {
        success: true,
        transformedCode,
        warnings: hasChanges ? [] : ['No @di-inject markers found or no transformations applied'],
        stats: {
          transformedComponents: summary.transformedComponents || 0,
          errors: summary.errors?.length || 0,
          warnings: summary.warnings?.length || 0,
        },
      };
    } catch (error) {
      console.error('Transformation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
        transformedCode: inputCode, // Return original code on error
      };
    }
  }
}
