---
title: 'Svelte vs TDI2'
description: How TDI2's service-oriented reactivity compares to Svelte 5's rune system - two different approaches to eliminating React's complexity.
---

TDI2 and Svelte 5 both solve the same fundamental problem: **eliminating component state hell through automatic reactivity**. While Svelte requires a new framework, TDI2 brings similar benefits to existing React applications.

## Core Philosophy Comparison

Both eliminate the complexity of manual state management, but through different architectural approaches:

| Aspect | Svelte 5 Runes | TDI2 + Valtio |
|--------|----------------|---------------|
| **Architecture** | Framework-level reactivity | Library-level reactivity within React |
| **State Location** | `$state()` objects | Service `state` objects (Valtio proxies) |
| **Components** | Pure templates | Pure templates with service injection |
| **Reactivity** | Built-in proxy reactivity | Valtio proxy reactivity via `useSnapshot` |
| **Migration** | Full rewrite required | Gradual adoption in existing React apps |
| **TypeScript** | Good support | Full TypeScript integration with interfaces |
| **Ecosystem** | Svelte ecosystem | React ecosystem compatibility |

## Side-by-Side Code Comparison

### Simple Counter Example

**Svelte 5:**
```svelte
<script>
  let counter = $state({
    count: 0,
    message: "Click to count!"
  });

  function increment() {
    counter.count++;
    counter.message = `Count is now ${counter.count}`;
  }

  // Derived state
  let isEven = $derived(counter.count % 2 === 0);
</script>

<div>
  <h2>{counter.count}</h2>
  <p>{counter.message}</p>
  <p>Number is {isEven ? 'even' : 'odd'}</p>
  <button onclick={increment}>+</button>
</div>
```

**TDI2:**
```typescript
// Service with Valtio reactive state
@Service()
export class CounterService implements CounterServiceInterface {
  state = {
    count: 0,
    message: "Click to count!"
  };

  increment(): void {
    this.state.count++;
    this.state.message = `Count is now ${this.state.count}`;
  }

  get isEven(): boolean {
    return this.state.count % 2 === 0;
  }
}

// Pure React component template
function Counter({ counterService }: { counterService: Inject<CounterServiceInterface> }) {
  const { count, message } = counterService.state;
  const { isEven } = counterService;
  
  return (
    <div>
      <h2>{count}</h2>
      <p>{message}</p>
      <p>Number is {isEven ? 'even' : 'odd'}</p>
      <button onClick={() => counterService.increment()}>+</button>
    </div>
  );
}
```

**Key Similarity**: Both eliminate the need for `useState`, `useEffect`, and manual state synchronization.

## Complex E-Commerce Example

### Shopping Cart with Cross-Component State

**Svelte 5:**
```svelte
<!-- CartStore.svelte.js -->
<script>
  let cartState = $state({
    items: [],
    total: 0
  });

  export function addItem(product) {
    cartState.items = [...cartState.items, product];
    cartState.total = cartState.items.reduce((sum, item) => sum + item.price, 0);
  }

  export function removeItem(productId) {
    cartState.items = cartState.items.filter(item => item.id !== productId);
    cartState.total = cartState.items.reduce((sum, item) => sum + item.price, 0);
  }

  export { cartState };
</script>

<!-- ProductList.svelte -->
<script>
  import { cartState, addItem } from './CartStore.svelte.js';
  
  let products = [
    { id: 1, name: 'iPhone', price: 999 },
    { id: 2, name: 'MacBook', price: 1999 }
  ];
</script>

<div>
  {#each products as product}
    <div>
      <h3>{product.name} - ${product.price}</h3>
      <button onclick={() => addItem(product)}>Add to Cart</button>
    </div>
  {/each}
  <p>Cart Total: ${cartState.total}</p>
</div>
```

**TDI2:**
```typescript
// Business Logic Service
@Service()
export class CartService implements CartServiceInterface {
  state = {
    items: [] as CartItem[],
    total: 0
  };

  addItem(product: Product): void {
    this.state.items.push({ ...product, quantity: 1 });
    this.calculateTotal();
  }

  removeItem(productId: string): void {
    this.state.items = this.state.items.filter(item => item.id !== productId);
    this.calculateTotal();
  }

  private calculateTotal(): void {
    this.state.total = this.state.items.reduce((sum, item) => sum + item.price, 0);
  }
}

// Pure Template Component
function ProductList({ 
  productService,
  cartService 
}: {
  productService: Inject<ProductServiceInterface>;
  cartService: Inject<CartServiceInterface>;
}) {
  const { products } = productService.state;
  const { total } = cartService.state;
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name} - ${product.price}</h3>
          <button onClick={() => cartService.addItem(product)}>
            Add to Cart
          </button>
        </div>
      ))}
      <p>Cart Total: ${total}</p>
    </div>
  );
}
```

## Key Differences

### 1. **Migration Strategy**

**Svelte 5:**
- Requires complete rewrite from React
- Cannot coexist with existing React components
- All-or-nothing adoption decision

**TDI2:**
- Gradual migration from existing React
- Can coexist with traditional React patterns
- Component-by-component adoption possible

### 2. **Ecosystem Integration**

**Svelte 5:**
```svelte
<!-- Limited to Svelte ecosystem -->
<script>
  import { onMount } from 'svelte';
  // Svelte-specific libraries and patterns
</script>
```

**TDI2:**
```typescript
// Full React ecosystem compatibility
@Service()
export class DataService {
  constructor(
    @Inject() private apiClient: AxiosInstance, // Any React library
    @Inject() private router: NextRouter,        // Next.js integration
    @Inject() private analytics: GTM            // Google Analytics
  ) {}
}
```

### 3. **Testing Approach**

**Svelte 5:**
```javascript
// Svelte Testing Library
import { render, fireEvent } from '@testing-library/svelte';
import Counter from './Counter.svelte';

test('increments counter', async () => {
  const { getByRole, getByText } = render(Counter);
  const button = getByRole('button');
  
  await fireEvent.click(button);
  expect(getByText('1')).toBeInTheDocument();
});
```

**TDI2:**
```typescript
// Standard React Testing Library + Service Mocking
describe('Counter', () => {
  it('increments counter', () => {
    const mockCounterService = {
      state: { count: 0 },
      increment: jest.fn()
    };

    render(<Counter counterService={mockCounterService} />);
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockCounterService.increment).toHaveBeenCalled();
  });
});
```

### 4. **Performance Characteristics**

**Svelte 5:**
- Compile-time optimization
- No virtual DOM overhead
- Smaller runtime bundle

**TDI2:**
- React's virtual DOM (with optimizations)
- Service-level memoization
- Larger runtime (React + TDI2 + Valtio)

## When to Choose Each

### Choose **Svelte 5** When:

✅ **Starting new projects** from scratch
✅ **Performance is critical** (mobile, embedded)  
✅ **Team is open to new framework** adoption
✅ **Bundle size matters** more than ecosystem
✅ **Simple to moderate complexity** applications

### Choose **TDI2** When:

✅ **Existing large React codebase** needs gradual improvement
✅ **React ecosystem dependencies** are essential
✅ **Team expertise in React** is significant investment
✅ **Enterprise requirements** need mature ecosystem
✅ **Complex state management** across many components
✅ **TypeScript-first development** with full interface support

## Hybrid Approach Consideration

For teams evaluating both, consider this migration path:

1. **Phase 1**: Introduce TDI2 to existing React app for complex state management
2. **Phase 2**: Evaluate TDI2's impact on development velocity and code quality  
3. **Phase 3**: Consider Svelte 5 for new microservices or standalone applications
4. **Phase 4**: Gradual migration to Svelte 5 if performance requirements demand it

## Conclusion

**Svelte 5 and TDI2 validate the same architectural insight**: Manual component state management is the primary source of complexity in modern UI frameworks.

- **Svelte 5** solves this with a new framework and compile-time magic
- **TDI2** solves this by bringing service-oriented architecture to React

Both eliminate `useState` hell, both provide automatic reactivity, both create pure template components. The choice depends on your migration constraints and ecosystem requirements.

**For existing React teams**: TDI2 provides 80% of Svelte's reactivity benefits without the migration cost.

**For new projects**: Both are excellent choices - Svelte for maximum performance, TDI2 for React ecosystem compatibility.