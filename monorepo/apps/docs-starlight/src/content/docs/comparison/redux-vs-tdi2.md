---
title: Redux vs TDI2 Comparison
description: Comprehensive comparison between Redux and TDI2 for enterprise React applications. Learn when to migrate and how the approaches differ.
---

# Redux vs TDI2 Comparison
## Traditional State Management vs Service-Oriented Architecture

Compare Redux's action-based state management with TDI2's service-oriented approach for enterprise React applications.

<div class="feature-highlight">
  <h3>🎯 Key Differences</h3>
  <ul>
    <li><strong>Redux</strong> - Global state + actions + reducers + selectors</li>
    <li><strong>TDI2</strong> - Services + reactive state + dependency injection</li>
    <li><strong>Complexity</strong> - Redux: 4 files per feature vs TDI2: 2 files per feature</li>
    <li><strong>Boilerplate</strong> - Redux: ~100 lines vs TDI2: ~40 lines</li>
  </ul>
</div>

---

## Architecture Comparison

### Redux Architecture
```
Components → useSelector/useDispatch → Store → Reducers → Actions → API
     ↓              ↓                    ↓        ↓         ↓        ↓
  Rendering → State Selection → Global State → State Updates → Side Effects → Data
```

**Characteristics:**
- Central global store
- Immutable state updates
- Action-based state changes
- Selector-based data access

### TDI2 Architecture
```
Components → Service Injection → Services → Repositories → API
     ↓              ↓             ↓           ↓            ↓
  Rendering → Direct Access → Business Logic → Data Access → Data
```

**Characteristics:**
- Distributed service layer
- Reactive state (mutable)
- Method-based operations
- Direct service access

---

## Side-by-Side Implementation

### E-Commerce Shopping Cart Example

#### Redux Implementation

**1. Action Types & Creators (40+ lines)**
```typescript
// actions/cartActions.ts
export const ADD_TO_CART = 'ADD_TO_CART';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
export const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
export const CALCULATE_TOTALS = 'CALCULATE_TOTALS';

export const addToCart = (product: Product, quantity: number) => ({
  type: ADD_TO_CART as const,
  payload: { product, quantity }
});

export const removeFromCart = (productId: string) => ({
  type: REMOVE_FROM_CART as const,
  payload: { productId }
});

export const updateQuantity = (productId: string, quantity: number) => ({
  type: UPDATE_QUANTITY as const,
  payload: { productId, quantity }
});

export const calculateTotals = () => ({
  type: CALCULATE_TOTALS as const
});

export type CartAction = 
  | ReturnType<typeof addToCart>
  | ReturnType<typeof removeFromCart>
  | ReturnType<typeof updateQuantity>
  | ReturnType<typeof calculateTotals>;
```

**2. Reducer (50+ lines)**
```typescript
// reducers/cartReducer.ts
interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0
};

export const cartReducer = (
  state = initialState, 
  action: CartAction
): CartState => {
  switch (action.type) {
    case ADD_TO_CART: {
      const { product, quantity } = action.payload;
      const existingItem = state.items.find(item => item.productId === product.id);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      }
      
      return {
        ...state,
        items: [...state.items, { productId: product.id, product, quantity, price: product.price }]
      };
    }
    
    case CALCULATE_TOTALS: {
      const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.08;
      const total = subtotal + tax;
      
      return { ...state, subtotal, tax, total };
    }
    
    // ... other cases
    default:
      return state;
  }
};
```

**3. Selectors (20+ lines)**
```typescript
// selectors/cartSelectors.ts
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = (state: RootState) => state.cart.total;
export const selectCartSubtotal = (state: RootState) => state.cart.subtotal;
export const selectCartTax = (state: RootState) => state.cart.tax;
export const selectCartItemCount = (state: RootState) => 
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
```

**4. Component Usage (30+ lines)**
```typescript
// components/CartSummary.tsx
function CartSummary() {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const subtotal = useSelector(selectCartSubtotal);
  const tax = useSelector(selectCartTax);
  const itemCount = useSelector(selectCartItemCount);

  useEffect(() => {
    dispatch(calculateTotals());
  }, [items, dispatch]);

  const handleAddToCart = (product: Product) => {
    dispatch(addToCart(product, 1));
  };

  const handleRemoveFromCart = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  return (
    <div>
      <div>Items: {itemCount}</div>
      <div>Subtotal: ${subtotal.toFixed(2)}</div>
      <div>Tax: ${tax.toFixed(2)}</div>
      <div>Total: ${total.toFixed(2)}</div>
    </div>
  );
}
```

**Total Redux Code: ~140 lines across 4 files**

#### TDI2 Implementation

**1. Service Interface (15 lines)**
```typescript
// services/interfaces/CartServiceInterface.ts
interface CartServiceInterface {
  state: {
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
  };
  addToCart(product: Product, quantity?: number): void;
  removeFromCart(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  getItemCount(): number;
}
```

**2. Service Implementation (25 lines)**
```typescript
// services/implementations/CartService.ts
@Service()
export class CartService implements CartServiceInterface {
  state = {
    items: [] as CartItem[],
    subtotal: 0,
    tax: 0,
    total: 0
  };

  addToCart(product: Product, quantity = 1): void {
    const existingItem = this.state.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.state.items.push({ productId: product.id, product, quantity, price: product.price });
    }
    
    this.calculateTotals();
  }

  removeFromCart(productId: string): void {
    this.state.items = this.state.items.filter(item => item.productId !== productId);
    this.calculateTotals();
  }

  private calculateTotals(): void {
    this.state.subtotal = this.state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.state.tax = this.state.subtotal * 0.08;
    this.state.total = this.state.subtotal + this.state.tax;
  }

  getItemCount(): number {
    return this.state.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
```

**3. Component Usage (15 lines)**
```typescript
// components/CartSummary.tsx
function CartSummary({ cartService }: {
  cartService: Inject<CartServiceInterface>;
}) {
  const { subtotal, tax, total } = cartService.state;
  const itemCount = cartService.getItemCount();

  return (
    <div>
      <div>Items: {itemCount}</div>
      <div>Subtotal: ${subtotal.toFixed(2)}</div>
      <div>Tax: ${tax.toFixed(2)}</div>
      <div>Total: ${total.toFixed(2)}</div>
    </div>
  );
}
```

**Total TDI2 Code: ~55 lines across 2 files**

---

## Feature Comparison

| Feature | Redux | TDI2 | Winner |
|---------|--------|------|---------|
| **Boilerplate** | High (actions, reducers, selectors) | Low (interface + implementation) | 🏆 TDI2 |
| **Type Safety** | Complex (union types, action creators) | Simple (TypeScript interfaces) | 🏆 TDI2 |
| **Testing** | Multiple layers (actions, reducers, selectors) | Single layer (service methods) | 🏆 TDI2 |
| **Performance** | Manual optimization (memoization) | Automatic (reactive snapshots) | 🏆 TDI2 |
| **DevTools** | Excellent time-travel debugging | Basic debugging | 🏆 Redux |
| **Learning Curve** | Steep (many concepts) | Moderate (familiar OOP patterns) | 🏆 TDI2 |
| **Component Coupling** | Tight (useSelector dependencies) | Loose (interface-based injection) | 🏆 TDI2 |
| **Async Operations** | Complex (thunks/sagas) | Simple (async/await in services) | 🏆 TDI2 |

---

## When to Choose Each

### Choose Redux When:
- **Time-travel debugging** is critical for your application
- **Existing Redux codebase** with significant investment
- **Team expertise** in Redux patterns is high
- **Global state sharing** across many unrelated components

### Choose TDI2 When:
- **Rapid development** is a priority
- **Testing simplicity** is important
- **Team scaling** requires clear architectural boundaries
- **Props drilling** is causing significant development pain
- **Enterprise patterns** (DI, services) are familiar to your team

---

## Migration Path from Redux

### Step 1: Gradual Service Introduction
```typescript
// Start with adapter pattern
@Service()
export class ReduxCartAdapter implements CartServiceInterface {
  constructor(@Inject() private store: Store) {}

  get state() {
    return this.store.getState().cart; // Bridge to Redux
  }

  addToCart(product: Product, quantity: number): void {
    this.store.dispatch(addToCart(product, quantity)); // Delegate to Redux
  }
}
```

### Step 2: Feature-by-Feature Migration
```typescript
// New features use TDI2 services
@Service()
export class ProductService {
  state = { products: [] };
  // Pure TDI2 implementation
}

// Legacy features keep Redux
// Gradually migrate based on development priorities
```

### Step 3: Complete Transition
```typescript
// Remove Redux store, actions, reducers
// All state management through TDI2 services
// Clean, service-oriented architecture
```

---

## Performance Comparison

### Bundle Size Impact
- **Redux**: +45kb (Redux Toolkit + React-Redux + DevTools)
- **TDI2**: +12kb (Core + Valtio)
- **Savings**: 33kb smaller bundles

### Runtime Performance
- **Redux**: Manual optimization with `useSelector` and `reselect`
- **TDI2**: Automatic optimization with Valtio snapshots
- **Developer Experience**: Less performance debugging needed

### Development Speed
- **Redux**: 3-4 files per feature, complex testing setup
- **TDI2**: 2 files per feature, simple testing
- **Time Savings**: 40-60% faster feature development

---

## Team Productivity Analysis

### Redux Team Challenges:
- New developers need 2-3 weeks to understand Redux patterns
- Complex testing requires mocking store, actions, and selectors
- Prop drilling still exists for component-specific state
- Merge conflicts in shared reducers and action files

### TDI2 Team Benefits:
- New developers productive in 3-5 days with familiar service patterns
- Simple service testing with direct method calls
- Zero prop drilling with service injection
- Clear service ownership prevents merge conflicts

---

## Next Steps

### Learn More About TDI2
- **[Migration Strategy](../guides/migration/strategy/)** - Step-by-step Redux migration
- **[Service Patterns](../patterns/service-patterns/)** - Advanced service design
- **[Enterprise Implementation](../guides/enterprise/implementation/)** - Large team adoption

### Compare with Other Solutions
- **[Context API vs TDI2](./context-vs-tdi2/)** - Provider pattern comparison
- **[Zustand vs TDI2](./zustand-vs-tdi2/)** - Modern state management comparison

### Examples
- **[Redux Migration Example](https://github.com/7frank/tdi2/tree/main/examples/redux-migration)** - Complete migration walkthrough
- **[Performance Benchmarks](https://github.com/7frank/tdi2/tree/main/benchmarks/redux-vs-tdi2)** - Detailed performance analysis

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>Redux excels at time-travel debugging and complex state coordination, but TDI2 provides significantly faster development with simpler testing and better architectural patterns for most enterprise applications.</p>
</div>