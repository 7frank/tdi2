---
title: Context API vs TDI2
description: Why Context API falls short for dependency injection and how TDI2 provides true enterprise-grade DI
sidebar:
  order: 2
---

React's Context API is often suggested as a solution for dependency injection, but this reveals a fundamental misunderstanding of what true DI provides. While Context can pass objects down component trees, it lacks the architectural guarantees needed for scalable applications.

## The Critical Differences

### Dependency Resolution

**Context API: Manual Wiring Nightmare**
```typescript
// Context-based approach - manual dependency management
const ApiContext = createContext<ApiClient | null>(null);
const UserContext = createContext<UserService | null>(null);
const CartContext = createContext<CartService | null>(null);

function App() {
  // Manual dependency construction and wiring
  const apiClient = new ApiClient();
  const userService = new UserService(apiClient);        // Manual wiring
  const cartService = new CartService(apiClient, userService);  // More manual wiring
  const productService = new ProductService(apiClient);  // Even more...
  const checkoutService = new CheckoutService(cartService, userService, apiClient); // Nightmare!
  
  return (
    <ApiContext.Provider value={apiClient}>
      <UserContext.Provider value={userService}>
        <CartContext.Provider value={cartService}>
          <ProductContext.Provider value={productService}>
            <CheckoutContext.Provider value={checkoutService}>
              <ShoppingApp />
            </CheckoutContext.Provider>
          </ProductContext.Provider>
        </CartContext.Provider>
      </UserContext.Provider>
    </ApiContext.Provider>
  );
}
```

**TDI2: Automatic Resolution**
```typescript
// True dependency injection - automatic resolution
function App() {
  return <ShoppingApp />; // All dependencies resolved automatically
}

@Service()
export class CheckoutService {
  constructor(
    private cartService: Inject<CartServiceInterface>,
    private userService: Inject<UserServiceInterface>, 
    private paymentService: Inject<PaymentServiceInterface>
  ) {}
  // Dependencies automatically injected
}
```

### Component Implementation Complexity

**Context API: Verbose and Error-Prone**
```typescript
function ProductPage({ productId }: { productId: string }) {
  // Manual context consumption
  const apiClient = useContext(ApiContext);
  const userService = useContext(UserContext);
  const cartService = useContext(CartContext);
  
  // Null checks required everywhere
  if (!apiClient || !userService || !cartService) {
    throw new Error("Required services not provided");
  }
  
  // Manual dependency wiring in component
  useEffect(() => {
    // This is wrong! Business logic in UI component
    userService.setApiClient(apiClient);
    cartService.setUserService(userService);
    cartService.setApiClient(apiClient);
  }, [apiClient, userService, cartService]);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Manual API calls and state management
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productData = await apiClient.get(`/products/${productId}`);
        setProduct(productData);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [productId, apiClient]);
  
  const handleAddToCart = async () => {
    if (!product || !userService.isAuthenticated()) return;
    
    try {
      await cartService.addItem(product);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

**TDI2: Clean and Focused**
```typescript
function ProductPage({ 
  productService, cartService 
}: { 
  productService: Inject<ProductServiceInterface>,
  cartService: Inject<CartServiceInterface>
}) {
  const product = productService.state.currentProduct;
  const loading = productService.state.loading;
  
  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>${product.price}</p>
      <button onClick={() => cartService.addItem(product)}>
        Add to Cart
      </button>
    </div>
  );
}
```

## Architectural Problems with Context API

### 1. Provider Hell

Context API leads to deeply nested provider hierarchies:

```typescript
// Context API provider nightmare
<ThemeProvider>
  <AuthProvider>
    <ApiProvider>
      <UserProvider>
        <CartProvider>
          <ProductProvider>
            <NotificationProvider>
              <AnalyticsProvider>
                <App /> {/* Finally! */}
              </AnalyticsProvider>
            </NotificationProvider>
          </ProductProvider>
        </CartProvider>
      </UserProvider>
    </ApiProvider>
  </AuthProvider>
</ThemeProvider>
```

**TDI2 eliminates provider hell entirely:**
```typescript
// Single provider, all services auto-resolved
<DIProvider container={container}>
  <App />
</DIProvider>
```

### 2. No Lifecycle Management

**Context API** has no built-in service lifecycle:
```typescript
// Manual cleanup required
useEffect(() => {
  const cleanup = () => {
    userService.cleanup();
    cartService.cleanup();
    // Easy to forget cleanup
  };
  
  window.addEventListener('beforeunload', cleanup);
  return () => window.removeEventListener('beforeunload', cleanup);
}, []);
```

**TDI2** provides automatic lifecycle management:
```typescript
@Service()
export class ProductService {
  @OnMount
  initialize() {
    console.log('ProductService initialized');
  }
  
  @OnUnmount  
  cleanup() {
    console.log('ProductService cleaned up');
    // Automatic cleanup when no longer needed
  }
}
```

### 3. No Scope Management

Context API has no concept of service scopes:

```typescript
// Context: Same instance everywhere (or complex manual management)
const UserContext = createContext<UserService | null>(null);

// How do you get a fresh instance per route? 
// How do you ensure singletons vs transients?
// Manual implementation required
```

**TDI2** provides Spring Boot-style scopes:
```typescript
@Service()
@Scope("singleton")
export class ConfigService {} // Same instance everywhere

@Service() 
@Scope("transient")  
export class FormService {} // New instance each injection
```

### 4. Testing Complexity

**Context API Testing: Complex Mock Setup**
```typescript
// Testing requires complex provider mocking
const renderWithProviders = (component: React.ReactElement) => {
  const mockApiClient = jest.fn();
  const mockUserService = jest.fn(); 
  const mockCartService = jest.fn();
  
  return render(
    <ApiContext.Provider value={mockApiClient}>
      <UserContext.Provider value={mockUserService}>
        <CartContext.Provider value={mockCartService}>
          {component}
        </CartContext.Provider>
      </UserContext.Provider>
    </ApiContext.Provider>
  );
};

test('should add product to cart', () => {
  renderWithProviders(<ProductPage productId="123" />);
  // Complex test setup for each test
});
```

**TDI2 Testing: Simple Service Mocking**
```typescript
// Simple service mocking
test('should add product to cart', () => {
  const mockCartService = {
    addItem: jest.fn(),
    state: { items: [] }
  };
  
  render(<ProductPage cartService={mockCartService} />);
  // Clean, focused testing
});
```

## Performance Implications

### Context Re-render Issues

Context API causes unnecessary re-renders:
```typescript
const AppContext = createContext({
  user: null,
  cart: { items: [] },
  products: [],
  ui: { theme: 'light' }
});

// Any change to ANY context value re-renders ALL consumers
function ProductList() {
  const { products } = useContext(AppContext);
  // Re-renders when user, cart, OR ui changes!
  return <div>{products.map(renderProduct)}</div>;
}
```

**TDI2 Selective Reactivity:**
```typescript
function ProductList({ productService }: ServicesProps) {
  const products = productService.state.products;
  // Only re-renders when products change
  return <div>{products.map(renderProduct)}</div>;
}
```

### Bundle Size Impact

**Context API** requires additional boilerplate:
- Custom hooks for each context
- Provider components for each service  
- Manual dependency wiring code
- Error handling for missing contexts

**TDI2** eliminates boilerplate:
- Automatic dependency resolution
- Single provider pattern
- Build-time optimization
- Zero runtime dependency wiring

## Enterprise Scalability

### Context API: Breaks Down at Scale

```typescript
// 50+ contexts become unmaintainable
const UserContext = createContext(null);
const AuthContext = createContext(null);
const CartContext = createContext(null);
const ProductContext = createContext(null);
const OrderContext = createContext(null);
const PaymentContext = createContext(null);
const ShippingContext = createContext(null);
const InventoryContext = createContext(null);
const AnalyticsContext = createContext(null);
const NotificationContext = createContext(null);
// ... 40 more contexts
```

**TDI2: Scales Linearly**
```typescript
// Single container manages hundreds of services
const container = new DIContainer();
container.loadConfiguration(ENTERPRISE_DI_CONFIG);

// All services automatically discoverable and injectable
@Service()
export class ComplexEnterpriseService {
  constructor(
    // 50+ dependencies automatically resolved
    private userService: Inject<UserServiceInterface>,
    private paymentService: Inject<PaymentServiceInterface>,
    // ... no manual wiring needed
  ) {}
}
```

## Migration Strategy

### From Context API to TDI2

```typescript
// Before: Context API
const UserContext = createContext<UserService | null>(null);

export function useUserService() {
  const service = useContext(UserContext);
  if (!service) throw new Error('UserService not provided');
  return service;
}

function UserProfile() {
  const userService = useUserService();
  return <div>{userService.currentUser?.name}</div>;
}

// After: TDI2  
function UserProfile({ 
  userService 
}: { 
  userService: Inject<UserServiceInterface> 
}) {
  return <div>{userService.state.currentUser?.name}</div>;
}
```

## Code Comparison Summary

| Aspect | Context API | TDI2 |
|--------|-------------|------|
| **Dependency Wiring** | Manual, error-prone | Automatic resolution |
| **Provider Setup** | Complex nesting | Single provider |
| **Component Code** | Verbose, mixed concerns | Clean, focused |
| **Testing** | Complex mock setup | Simple service mocks |
| **Performance** | Context re-render issues | Selective reactivity |
| **Scalability** | Breaks down at scale | Linear scaling |
| **Type Safety** | Manual null checks | Automatic type resolution |
| **Lifecycle** | Manual management | Automatic cleanup |

## Conclusion

While Context API can technically pass objects through component trees, it lacks the architectural sophistication needed for enterprise applications. TDI2 provides true dependency injection with automatic resolution, lifecycle management, scoping, and enterprise-grade features.

**Context API is appropriate for**:
- Simple theme or locale data
- Small applications (< 10 contexts)
- React-specific state sharing

**TDI2 is essential for**:
- Complex business applications
- Enterprise-scale development
- Service-oriented architectures
- Teams familiar with backend DI patterns

The choice isn't just about passing data—it's about building maintainable, scalable, testable applications that can grow with your business needs.