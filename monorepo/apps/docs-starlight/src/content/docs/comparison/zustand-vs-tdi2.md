---
title: Zustand vs TDI2  
description: Comparing modern Zustand state management with TDI2's service-oriented architecture
sidebar:
  order: 3
---

Zustand is a popular, lightweight state management solution for React that addresses many of Redux's complexity issues. However, when compared to TDI2's service-oriented architecture, key architectural differences emerge that impact enterprise scalability and code organization.

## Philosophy Comparison

### Zustand: Store-Based State Management
- **Approach**: Centralized stores with hook-based consumption
- **Paradigm**: Functional programming with closures
- **Architecture**: State + actions in store definitions

### TDI2: Service-Oriented Architecture  
- **Approach**: Distributed services with dependency injection
- **Paradigm**: Object-oriented programming with reactive services
- **Architecture**: Business logic in services, UI as pure templates

## Implementation Comparison: E-Commerce Cart

### Zustand Implementation

```typescript
// Zustand Store Definition
interface CartState {
  items: CartItem[];
  total: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  calculateTotal: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  
  addItem: (product: Product, quantity = 1) => {
    const state = get();
    const existingItem = state.items.find(item => item.id === product.id);
    
    if (existingItem) {
      set({
        items: state.items.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      });
    } else {
      set({
        items: [...state.items, { ...product, quantity }]
      });
    }
    
    get().calculateTotal();
  },
  
  removeItem: (productId: string) => {
    const state = get();
    set({
      items: state.items.filter(item => item.id !== productId)
    });
    get().calculateTotal();
  },
  
  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    set({
      items: get().items.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    });
    get().calculateTotal();
  },
  
  clearCart: () => set({ items: [], total: 0 }),
  
  calculateTotal: () => {
    const total = get().items.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    );
    set({ total });
  }
}));

// Component Using Zustand Store
function ShoppingCart() {
  const items = useCartStore(state => state.items);
  const total = useCartStore(state => state.total);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  
  return (
    <div>
      <h2>Shopping Cart</h2>
      {items.map(item => (
        <div key={item.id}>
          <span>{item.name} - ${item.price}</span>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
          />
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
      <div>Total: ${total.toFixed(2)}</div>
    </div>
  );
}
```

### TDI2 Implementation

```typescript
// Service Definition
@Service()
export class CartService implements CartServiceInterface {
  state = {
    items: [] as CartItem[],
    total: 0,
    discounts: [] as Discount[]
  };

  constructor(
    private inventoryService: Inject<InventoryServiceInterface>,
    private discountService: Inject<DiscountServiceInterface>
  ) {}

  addItem(product: Product, quantity: number = 1): void {
    if (!this.inventoryService.isAvailable(product.id, quantity)) {
      throw new InsufficientStockError(product.id, quantity);
    }

    const existingItem = this.state.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.state.items.push({ ...product, quantity });
    }
    
    this.recalculateTotal();
  }

  removeItem(productId: string): void {
    this.state.items = this.state.items.filter(item => item.id !== productId);
    this.recalculateTotal();
  }

  updateQuantity(productId: string, quantity: number): void {
    const item = this.state.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.recalculateTotal();
      }
    }
  }

  private recalculateTotal(): void {
    const subtotal = this.state.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    
    const discountAmount = this.discountService.calculateDiscount(
      this.state.items, this.state.discounts
    );
    
    this.state.total = subtotal - discountAmount;
  }
}

// Component Using TDI2 Service  
function ShoppingCart({ 
  cartService 
}: { 
  cartService: Inject<CartServiceInterface> 
}) {
  const { items, total } = cartService.state;
  
  return (
    <div>
      <h2>Shopping Cart</h2>
      {items.map(item => (
        <div key={item.id}>
          <span>{item.name} - ${item.price}</span>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => 
              cartService.updateQuantity(item.id, parseInt(e.target.value))
            }
          />
          <button onClick={() => cartService.removeItem(item.id)}>
            Remove
          </button>
        </div>
      ))}
      <div>Total: ${total.toFixed(2)}</div>
    </div>
  );
}
```

## Key Architectural Differences

### 1. Dependency Management

**Zustand: Manual Coordination**
```typescript
// Zustand requires manual coordination between stores
function CheckoutPage() {
  const cartItems = useCartStore(state => state.items);
  const user = useUserStore(state => state.currentUser);
  const createOrder = useOrderStore(state => state.createOrder);
  
  // Manual coordination logic
  const handleCheckout = () => {
    if (!user) {
      // Handle authentication
      return;
    }
    
    if (cartItems.length === 0) {
      // Handle empty cart
      return;
    }
    
    // Manual orchestration
    createOrder({ items: cartItems, userId: user.id });
  };
}
```

**TDI2: Automatic Dependency Resolution**
```typescript
@Service()
export class CheckoutService {
  constructor(
    private cartService: Inject<CartServiceInterface>,
    private userService: Inject<UserServiceInterface>,
    private orderService: Inject<OrderServiceInterface>
  ) {}
  
  async processCheckout(): Promise<Order> {
    // Dependencies automatically injected and coordinated
    const user = this.userService.getCurrentUser();
    const items = this.cartService.state.items;
    
    return this.orderService.createOrder({ items, userId: user.id });
  }
}
```

### 2. Business Logic Organization

**Zustand: Mixed Concerns**
```typescript
// Business logic mixed with UI concerns
function ProductPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const addToCart = useCartStore(state => state.addItem);
  
  // Business logic in component
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        const productData = await response.json();
        setProduct(productData);
      } catch (error) {
        console.error('Failed to load product:', error);
      }
    };
    
    loadProduct();
  }, [productId]);
  
  const handleAddToCart = () => {
    if (!product) return;
    
    // Business rule in component
    if (product.stock <= 0) {
      alert('Product out of stock');
      return;
    }
    
    addToCart(product);
  };
}
```

**TDI2: Clear Separation**
```typescript
// Business logic in service
@Service()
export class ProductService {
  async loadProduct(id: string): Promise<void> {
    this.state.loading = true;
    try {
      const product = await this.productRepository.findById(id);
      this.state.currentProduct = product;
    } catch (error) {
      this.state.error = 'Failed to load product';
    } finally {
      this.state.loading = false;
    }
  }
  
  canAddToCart(product: Product): boolean {
    return product.stock > 0;
  }
}

// Component focused on presentation
function ProductPage({ 
  productService, cartService 
}: ServicesProps) {
  const product = productService.state.currentProduct;
  
  const handleAddToCart = () => {
    if (productService.canAddToCart(product)) {
      cartService.addItem(product);
    } else {
      alert('Product out of stock');
    }
  };
}
```

### 3. Testing Approach

**Zustand Testing: Store Mocking**
```typescript
// Complex store testing setup
describe('CartStore', () => {
  let store: any;
  
  beforeEach(() => {
    store = useCartStore.getState();
    useCartStore.setState({ items: [], total: 0 });
  });
  
  test('should add item to cart', () => {
    const product = { id: '1', name: 'Test', price: 10 };
    
    act(() => {
      store.addItem(product);
    });
    
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});

// Component testing requires store integration
describe('ShoppingCart Component', () => {
  test('should display cart items', () => {
    useCartStore.setState({
      items: [{ id: '1', name: 'Test Product', price: 10, quantity: 1 }],
      total: 10
    });
    
    render(<ShoppingCart />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
```

**TDI2 Testing: Clean Service Mocking**
```typescript
// Simple service unit testing
describe('CartService', () => {
  let cartService: CartService;
  let mockInventoryService: jest.Mocked<InventoryServiceInterface>;
  
  beforeEach(() => {
    mockInventoryService = {
      isAvailable: jest.fn().mockReturnValue(true)
    };
    
    cartService = new CartService(mockInventoryService, mockDiscountService);
  });
  
  test('should add item to cart', () => {
    const product = { id: '1', name: 'Test', price: 10 };
    
    cartService.addItem(product);
    
    expect(cartService.state.items).toHaveLength(1);
    expect(cartService.state.total).toBe(10);
  });
});

// Component testing with service mocks
describe('ShoppingCart Component', () => {
  test('should display cart items', () => {
    const mockCartService = {
      state: {
        items: [{ id: '1', name: 'Test Product', price: 10, quantity: 1 }],
        total: 10
      }
    };
    
    render(<ShoppingCart cartService={mockCartService} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
```

## Scalability Analysis

### Store Proliferation (Zustand)

```typescript
// Multiple stores become hard to coordinate
export const useUserStore = create(/* user logic */);
export const useCartStore = create(/* cart logic */);  
export const useProductStore = create(/* product logic */);
export const useOrderStore = create(/* order logic */);
export const usePaymentStore = create(/* payment logic */);
export const useShippingStore = create(/* shipping logic */);
export const useInventoryStore = create(/* inventory logic */);

// Inter-store communication becomes complex
function CheckoutProcess() {
  // Must manually coordinate 7 different stores
  const cart = useCartStore();
  const user = useUserStore(); 
  const payment = usePaymentStore();
  const shipping = useShippingStore();
  const inventory = useInventoryStore();
  const order = useOrderStore();
  const product = useProductStore();
  
  // Complex manual orchestration required
}
```

### Service Orchestration (TDI2)

```typescript
// Services automatically coordinate through DI
@Service()
export class CheckoutService {
  constructor(
    private cartService: Inject<CartServiceInterface>,
    private userService: Inject<UserServiceInterface>,
    private paymentService: Inject<PaymentServiceInterface>,
    private orderService: Inject<OrderServiceInterface>
    // Dependencies automatically resolved
  ) {}
  
  async processCheckout(): Promise<Order> {
    // Clean orchestration with automatic error handling
    const validation = await this.validateCheckout();
    const payment = await this.paymentService.processPayment();
    return this.orderService.createOrder(payment);
  }
}
```

## Performance Characteristics

### Zustand Performance

**Strengths:**
- Lightweight runtime (< 2KB)
- Efficient selector-based updates
- No unnecessary re-renders with proper selectors

**Limitations:**
- Manual optimization required
- Potential for selector performance issues
- Store subscription overhead

### TDI2 Performance

**Strengths:**  
- Valtio's proxy-based reactivity  
- Automatic optimization
- Service-level caching

**Considerations:**
- Proxy overhead (minimal)
- Service initialization cost
- Build-time transformation overhead

## Enterprise Adoption

### Zustand: Store Management Complexity

```typescript
// Enterprise complexity with multiple stores
const StoreProvider = ({ children }) => (
  <UserProvider>
    <CartProvider>
      <ProductProvider>
        <OrderProvider>
          <PaymentProvider>
            <ShippingProvider>
              {children}
            </ShippingProvider>
          </PaymentProvider>
        </OrderProvider>
      </ProductProvider>
    </CartProvider>
  </UserProvider>
);
```

### TDI2: Single Container

```typescript
// Simple enterprise setup
<DIProvider container={enterpriseContainer}>
  <App />
</DIProvider>
```

## Migration Comparison

| Aspect | Zustand | TDI2 |
|--------|---------|------|
| **Learning Curve** | Medium - Hook patterns | Low - Familiar OOP patterns |
| **Boilerplate** | Low for simple stores | Very low with decorators |
| **Type Safety** | Good with TypeScript | Excellent with interfaces |
| **Testing** | Moderate complexity | Simple service mocking |
| **Scalability** | Manual coordination | Automatic dependency resolution |
| **Enterprise Features** | Limited | Full DI container features |
| **Code Organization** | Store-based | Service-oriented |

## When to Choose What

### Choose Zustand When:
- Building small to medium applications
- Team prefers functional programming
- Minimal learning curve desired
- Simple state management needs

### Choose TDI2 When:
- Building enterprise applications
- Team familiar with backend DI patterns
- Complex business logic coordination needed
- Strong type safety requirements
- Scalable architecture essential

## Conclusion

Both Zustand and TDI2 address React's state management challenges, but they represent different architectural philosophies:

**Zustand** excels at simple, lightweight state management with a functional programming approach. It's perfect for applications that need better state management than useState but don't require enterprise-grade architecture.

**TDI2** provides a complete service-oriented architecture with dependency injection, making it ideal for complex business applications that need scalable, testable, and maintainable code organization.

The choice depends on your application's complexity, team preferences, and long-term scalability requirements.