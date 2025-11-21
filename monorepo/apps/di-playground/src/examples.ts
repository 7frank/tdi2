export interface ProjectFile {
  path: string;
  content: string;
  language: 'typescript' | 'tsx';
}

export interface ProjectExample {
  name: string;
  description: string;
  files: ProjectFile[];
}

export const examples: ProjectExample[] = [
  {
    name: 'Basic Counter',
    description: 'Simple counter with service injection',
    files: [
      {
        path: 'src/services/CounterService.ts',
        language: 'typescript',
        content: `import { Service } from '@tdi2/di-core';

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
`,
      },
      {
        path: 'src/components/Counter.tsx',
        language: 'tsx',
        content: `import React from 'react';
import { Inject } from '@tdi2/di-core';
import type { CounterServiceInterface } from '../services/CounterService';

function Counter({counterService}:{counterService:Inject<CounterServiceInterface>}) {
  return (
    <div className="counter">
      <h1>Count: {counterService.state.count}</h1>
      <button onClick={() => counterService.increment()}>
        Increment
      </button>
      <button onClick={() => counterService.decrement()}>
        Decrement
      </button>
    </div>
  );
}

export default Counter;
`,
      },
    ],
  },
  {
    name: 'Todo List',
    description: 'Todo list with CRUD operations',
    files: [
      {
        path: 'src/types/Todo.ts',
        language: 'typescript',
        content: `export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}
`,
      },
      {
        path: 'src/services/TodoService.ts',
        language: 'typescript',
        content: `import { Service } from '@tdi2/di-core';
import type { Todo } from '../types/Todo';

export interface TodoServiceInterface {
  state: {
    todos: Todo[];
    filter: 'all' | 'active' | 'completed';
  };
  addTodo(text: string): void;
  removeTodo(id: string): void;
  toggleTodo(id: string): void;
  setFilter(filter: 'all' | 'active' | 'completed'): void;
  getFilteredTodos(): Todo[];
}

@Service()
export class TodoService implements TodoServiceInterface {
  state = {
    todos: [] as Todo[],
    filter: 'all' as 'all' | 'active' | 'completed'
  };

  addTodo(text: string) {
    this.state.todos.push({
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      createdAt: new Date(),
    });
  }

  removeTodo(id: string) {
    this.state.todos = this.state.todos.filter(t => t.id !== id);
  }

  toggleTodo(id: string) {
    const todo = this.state.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  setFilter(filter: 'all' | 'active' | 'completed') {
    this.state.filter = filter;
  }

  getFilteredTodos(): Todo[] {
    const { todos, filter } = this.state;
    if (filter === 'active') return todos.filter(t => !t.completed);
    if (filter === 'completed') return todos.filter(t => t.completed);
    return todos;
  }
}
`,
      },
      {
        path: 'src/components/TodoList.tsx',
        language: 'tsx',
        content: `import React from 'react';
import { Inject } from '@tdi2/di-core';
import type { TodoServiceInterface } from '../services/TodoService';

function TodoList({todoService}:{todoService:Inject<TodoServiceInterface>}) {
  const [newTodo, setNewTodo] = React.useState('');

  const handleAdd = () => {
    if (newTodo.trim()) {
      todoService.addTodo(newTodo);
      setNewTodo('');
    }
  };

  const filteredTodos = todoService.getFilteredTodos();

  return (
    <div className="todo-list">
      <h1>Todo List</h1>

      <div className="add-todo">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="What needs to be done?"
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      <div className="filters">
        <button onClick={() => todoService.setFilter('all')}>
          All ({todoService.state.todos.length})
        </button>
        <button onClick={() => todoService.setFilter('active')}>
          Active ({todoService.state.todos.filter(t => !t.completed).length})
        </button>
        <button onClick={() => todoService.setFilter('completed')}>
          Completed ({todoService.state.todos.filter(t => t.completed).length})
        </button>
      </div>

      <ul className="todos">
        {filteredTodos.map((todo) => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => todoService.toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => todoService.removeTodo(todo.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;
`,
      },
    ],
  },
  {
    name: 'Shopping Cart',
    description: 'E-commerce cart with product catalog',
    files: [
      {
        path: 'src/types/Product.ts',
        language: 'typescript',
        content: `export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
`,
      },
      {
        path: 'src/services/ProductService.ts',
        language: 'typescript',
        content: `import { Service } from '@tdi2/di-core';
import type { Product } from '../types/Product';

export interface ProductServiceInterface {
  state: {
    products: Product[];
    loading: boolean;
  };
  loadProducts(): void;
  getProduct(id: string): Product | undefined;
}

@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    products: [
      { id: '1', name: 'React T-Shirt', price: 24.99 },
      { id: '2', name: 'TypeScript Mug', price: 14.99 },
      { id: '3', name: 'DI Core Book', price: 34.99 },
      { id: '4', name: 'Vite Stickers', price: 4.99 },
    ] as Product[],
    loading: false,
  };

  loadProducts() {
    this.state.loading = true;
    // Simulate API call
    setTimeout(() => {
      this.state.loading = false;
    }, 1000);
  }

  getProduct(id: string) {
    return this.state.products.find(p => p.id === id);
  }
}
`,
      },
      {
        path: 'src/services/CartService.ts',
        language: 'typescript',
        content: `import { Service } from '@tdi2/di-core';
import type { Product, CartItem } from '../types/Product';

export interface CartServiceInterface {
  state: {
    items: CartItem[];
    isOpen: boolean;
  };
  addItem(product: Product): void;
  removeItem(id: string): void;
  updateQuantity(id: string, quantity: number): void;
  clearCart(): void;
  getTotal(): number;
  toggleCart(): void;
}

@Service()
export class CartService implements CartServiceInterface {
  state = {
    items: [] as CartItem[],
    isOpen: false
  };

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

  updateQuantity(id: string, quantity: number) {
    const item = this.state.items.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        this.removeItem(id);
      }
    }
  }

  clearCart() {
    this.state.items = [];
  }

  getTotal() {
    return this.state.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  toggleCart() {
    this.state.isOpen = !this.state.isOpen;
  }
}
`,
      },
      {
        path: 'src/components/ShoppingCart.tsx',
        language: 'tsx',
        content: `import React from 'react';
import { Inject } from '@tdi2/di-core';
import type { ProductServiceInterface } from '../services/ProductService';
import type { CartServiceInterface } from '../services/CartService';

function ShoppingCart({productService, cartService}:{productService:Inject<ProductServiceInterface>, cartService:Inject<CartServiceInterface>}) {
  React.useEffect(() => {
    productService.loadProducts();
  }, []);

  const total = cartService.getTotal();

  return (
    <div className="shopping-cart">
      <header>
        <h1>Shop</h1>
        <button onClick={() => cartService.toggleCart()}>
          Cart ({cartService.state.items.length})
        </button>
      </header>

      <div className="products">
        <h2>Products</h2>
        {productService.state.loading ? (
          <div>Loading...</div>
        ) : (
          <div className="product-grid">
            {productService.state.products.map((product) => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p className="price">\${product.price.toFixed(2)}</p>
                <button onClick={() => cartService.addItem(product)}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartService.state.isOpen && (
        <div className="cart-sidebar">
          <h2>Your Cart</h2>
          {cartService.state.items.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              <ul>
                {cartService.state.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <div className="quantity">
                      <button
                        onClick={() => cartService.updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => cartService.updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span>\${(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => cartService.removeItem(item.id)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="cart-total">
                <strong>Total: \${total.toFixed(2)}</strong>
                <button onClick={() => cartService.clearCart()}>
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ShoppingCart;
`,
      },
    ],
  },
];

export const defaultExample = examples[0];
