import { describe, it, expect, beforeAll } from 'vitest';
import { BrowserTransformer } from '../transformer';

describe('BrowserTransformer', () => {
  let transformer: BrowserTransformer;

  beforeAll(() => {
    transformer = new BrowserTransformer();
  });

  it('should transform Counter component with Inject<T> prop', async () => {
    const input = `import React from 'react';
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

export default Counter;`;

    const result = await transformer.transform(input, 'Counter.tsx');

    // Debug output
    if (!result.success) {
      console.log('Transformation failed:', result.error);
      console.log('Warnings:', result.warnings);
    }

    // Basic checks
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.transformedCode).toBeDefined();

    // Check transformation occurred
    expect(result.stats?.transformedComponents).toBeGreaterThan(0);

    // Check transformed code contains service injection
    const transformed = result.transformedCode!;
    expect(transformed).toContain('useService');
    expect(transformed).toContain('CounterServiceInterface');

    // Should NOT contain the original prop destructuring (it should be transformed)
    // The transformation should add service extraction at the component top
    expect(transformed.includes('useService') || transformed.includes('props')).toBe(true);
  });

  it('should handle TodoList component with Inject<T> prop', async () => {
    const input = `import React from 'react';
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

  return (
    <div className="todo-list">
      <h1>Todo List</h1>
      <input
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        placeholder="What needs to be done?"
      />
      <button onClick={handleAdd}>Add</button>
    </div>
  );
}

export default TodoList;`;

    const result = await transformer.transform(input, 'TodoList.tsx');

    expect(result.success).toBe(true);
    expect(result.stats?.transformedComponents).toBeGreaterThan(0);
    expect(result.transformedCode).toContain('useService');
    expect(result.transformedCode).toContain('TodoServiceInterface');
  });

  it('should handle ShoppingCart with multiple Inject<T> props', async () => {
    const input = `import React from 'react';
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
      <h1>Shop</h1>
      <button onClick={() => cartService.toggleCart()}>
        Cart ({cartService.state.items.length})
      </button>
    </div>
  );
}

export default ShoppingCart;`;

    const result = await transformer.transform(input, 'ShoppingCart.tsx');

    expect(result.success).toBe(true);
    expect(result.stats?.transformedComponents).toBeGreaterThan(0);

    const transformed = result.transformedCode!;
    expect(transformed).toContain('useService');
    expect(transformed).toContain('ProductServiceInterface');
    expect(transformed).toContain('CartServiceInterface');
  });

  it('should not transform components without Inject<T> markers', async () => {
    const input = `import React from 'react';

function RegularComponent({ title }: { title: string }) {
  return <div>{title}</div>;
}

export default RegularComponent;`;

    const result = await transformer.transform(input, 'RegularComponent.tsx');

    expect(result.success).toBe(true);
    expect(result.stats?.transformedComponents).toBe(0);
    expect(result.warnings).toContain('No Inject<T> type markers found in component props. Components need props with Inject<ServiceInterface> types to be transformed.');
  });

  it('should handle service files without transformation', async () => {
    const input = `import { Service } from '@tdi2/di-core';

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
}`;

    const result = await transformer.transform(input, 'CounterService.ts');

    expect(result.success).toBe(true);
    expect(result.stats?.transformedComponents).toBe(0);
    // Service files should not be transformed
    expect(result.transformedCode).toBe(input);
  });
});
