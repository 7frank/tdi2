---
title: Architecture Principles
description: The foundational design principles that make TDI2's service-oriented architecture successful
sidebar:
  order: 3
---

TDI2's architecture is built on proven enterprise software design principles adapted for React. These principles address the fundamental issues that create complexity in traditional React applications.

## Core Architectural Principles

### 1. Separation of Concerns (Single Responsibility)

**Principle:** Each service has one clear responsibility, components handle only rendering.

**Traditional React Problem:**
```typescript
function ShoppingCart() {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  
  // Business State  
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(null);
  
  // Business Logic
  const addItem = (product) => { /* complex logic */ };
  const removeItem = (id) => { /* complex logic */ };
  const applyDiscount = (code) => { /* complex logic */ };
  
  // Side Effects
  useEffect(() => { /* persist to localStorage */ }, [items]);
  useEffect(() => { /* analytics tracking */ }, [total]);
  useEffect(() => { /* inventory updates */ }, [items]);
  
  // API Integration
  const submitOrder = async () => { /* API calls */ };
  
  // Rendering (mixed with everything above)
  return <div>{/* Complex UI */}</div>;
}
```

**TDI2 Solution:**
```typescript
// Service: Pure business logic
@Service()
export class CartService implements CartServiceInterface {
  state = {
    items: [] as CartItem[],
    total: 0,
    discount: null as Discount | null
  };
  
  addItem(product: Product, quantity = 1): void {
    // Pure business logic
    const existingItem = this.state.items.find(item => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.state.items.push({ productId: product.id, product, quantity, price: product.price });
    }
    this.calculateTotal();
  }
}

// Component: Pure presentation
function ShoppingCart({ cartService, uiService }: ServicesProps) {
  const { items, total } = cartService.state;
  const { isCartOpen, animating } = uiService.state;
  
  return (
    <div className={isCartOpen ? 'cart-open' : 'cart-closed'}>
      {items.map(item => (
        <CartItem 
          key={item.productId} 
          item={item} 
          onRemove={() => cartService.removeItem(item.productId)} 
        />
      ))}
      <div className="total">Total: ${total}</div>
    </div>
  );
}
```

**Benefits:**
- Components focus solely on rendering
- Services contain testable business logic
- Clear boundaries between concerns
- Easier debugging and maintenance

### 2. Dependency Inversion Principle

**Principle:** High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Traditional React Problem:**
```typescript
function ProductCatalog() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    // Direct dependency on specific API implementation
    fetch('/api/products')
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => console.error(error));
  }, []);
  
  // Component is tightly coupled to:
  // - Specific API endpoint
  // - Fetch API implementation  
  // - Response format
  // - Error handling approach
}
```

**TDI2 Solution:**
```typescript
// Abstraction (Interface)
interface ProductRepositoryInterface {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product>;
  search(query: string): Promise<Product[]>;
}

// Low-level implementation
@Service()
export class ApiProductRepository implements ProductRepositoryInterface {
  async getAll(): Promise<Product[]> {
    const response = await this.httpClient.get('/api/products');
    return response.data;
  }
}

// High-level service depends on abstraction
@Service()
export class ProductService implements ProductServiceInterface {
  constructor(
    private productRepository: Inject<ProductRepositoryInterface>
  ) {}
  
  state = { products: [] as Product[] };
  
  async loadProducts(): Promise<void> {
    this.state.products = await this.productRepository.getAll();
  }
}

// Component depends on service abstraction
function ProductCatalog({ productService }: ServicesProps) {
  const { products } = productService.state;
  
  useEffect(() => { productService.loadProducts(); }, []);
  
  return <ProductGrid products={products} />;
}
```

**Benefits:**
- Easy to swap implementations (API → GraphQL → Mock)
- Services are testable in isolation
- Components are decoupled from data sources
- Clear contracts through interfaces

### 3. Interface Segregation Principle

**Principle:** Clients should not be forced to depend on interfaces they don't use.

**Traditional React Problem:**
```typescript
// Massive context with everything
const AppContext = createContext({
  // User stuff
  user: null,
  login: () => {},
  logout: () => {},
  updateProfile: () => {},
  
  // Cart stuff  
  cart: { items: [] },
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  
  // Product stuff
  products: [],
  searchProducts: () => {},
  filterProducts: () => {},
  
  // Settings stuff
  theme: 'light',
  language: 'en',
  updateSettings: () => {},
  
  // ... 50 more properties
});

function ProductCard() {
  // Forced to consume entire context even though only needs addToCart
  const { addToCart } = useContext(AppContext);
  
  // Component re-renders when ANY context value changes
}
```

**TDI2 Solution:**
```typescript
// Focused service interfaces
interface CartServiceInterface {
  readonly state: { items: CartItem[], total: number };
  addItem(product: Product, quantity?: number): void;
  removeItem(productId: string): void;
  clear(): void;
}

interface ProductServiceInterface {
  readonly state: { products: Product[], loading: boolean };
  loadProducts(): Promise<void>;
  searchProducts(query: string): Promise<void>;
}

// Component only receives services it needs
function ProductCard({ 
  product, 
  cartService 
}: { 
  product: Product;
  cartService: Inject<CartServiceInterface>;
}) {
  // Only re-renders when cart state changes, not other services
  const { items } = cartService.state;
  const isInCart = items.some(item => item.productId === product.id);
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <button 
        onClick={() => cartService.addItem(product)}
        disabled={isInCart}
      >
        {isInCart ? 'In Cart' : 'Add to Cart'}
      </button>
    </div>
  );
}
```

**Benefits:**
- Components only depend on what they actually use
- Precise re-rendering based on specific dependencies
- Clear, focused interfaces
- Better testability and maintainability

### 4. Open/Closed Principle

**Principle:** Software entities should be open for extension, closed for modification.

**Traditional React Problem:**
```typescript
function PaymentForm() {
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [processing, setProcessing] = useState(false);
  
  const processPayment = async (paymentData) => {
    setProcessing(true);
    
    // Adding new payment method requires modifying this function
    try {
      if (paymentMethod === 'creditCard') {
        await processCreditCard(paymentData);
      } else if (paymentMethod === 'paypal') {
        await processPayPal(paymentData);
      } else if (paymentMethod === 'applePay') {
        // New requirement - must modify existing code
        await processApplePay(paymentData);
      } else if (paymentMethod === 'crypto') {
        // Another new requirement - more modifications
        await processCrypto(paymentData);
      }
      // Success handling
    } catch (error) {
      // Error handling
    } finally {
      setProcessing(false);
    }
  };
}
```

**TDI2 Solution:**
```typescript
// Base abstraction
interface PaymentProcessorInterface {
  process(amount: number, paymentData: any): Promise<PaymentResult>;
  validate(paymentData: any): ValidationResult;
}

// Concrete implementations
@Service()
export class CreditCardProcessor implements PaymentProcessorInterface {
  async process(amount: number, paymentData: CreditCardData): Promise<PaymentResult> {
    // Credit card processing logic
  }
}

@Service()
export class PayPalProcessor implements PaymentProcessorInterface {
  async process(amount: number, paymentData: PayPalData): Promise<PaymentResult> {
    // PayPal processing logic
  }
}

// New implementations don't modify existing code
@Service()
export class CryptoProcessor implements PaymentProcessorInterface {
  async process(amount: number, paymentData: CryptoData): Promise<PaymentResult> {
    // Crypto processing logic
  }
}

// Payment service coordinates but doesn't need modification
@Service()
export class PaymentService implements PaymentServiceInterface {
  constructor(
    private processors: Map<string, PaymentProcessorInterface> = new Map([
      ['creditCard', inject(CreditCardProcessor)],
      ['paypal', inject(PayPalProcessor)],
      ['crypto', inject(CryptoProcessor)], // Extension, not modification
    ])
  ) {}
  
  async processPayment(method: string, amount: number, data: any): Promise<void> {
    const processor = this.processors.get(method);
    if (!processor) throw new Error(`Unsupported payment method: ${method}`);
    
    const result = await processor.process(amount, data);
    // Handle result
  }
}
```

**Benefits:**
- New payment methods added without changing existing code
- Each processor is independently testable
- No risk of breaking existing payment methods
- Clean, extensible architecture

### 5. Reactive State Management

**Principle:** State changes should automatically propagate to all interested parties.

**Traditional React Problem:**
```typescript
function EcommerceApp() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [wishlist, setWishlist] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  // Manual synchronization nightmare
  const login = async (credentials) => {
    const userData = await api.login(credentials);
    setUser(userData);
    
    // Must manually update all dependent state
    const userCart = await api.getCart(userData.id);
    setCart(userCart);
    
    const userWishlist = await api.getWishlist(userData.id);
    setWishlist(userWishlist);
    
    const userRecommendations = await api.getRecommendations(userData.id);
    setRecommendations(userRecommendations);
  };
  
  const addToCart = (product) => {
    setCart(prev => ({
      items: [...prev.items, product],
      total: prev.total + product.price
    }));
    
    // Must manually trigger recommendation updates
    updateRecommendations();
    
    // Must manually update wishlist if item was there
    if (wishlist.includes(product.id)) {
      setWishlist(prev => prev.filter(id => id !== product.id));
    }
  };
}
```

**TDI2 Solution:**
```typescript
@Service()
export class UserService implements UserServiceInterface {
  state = { currentUser: null as User | null };
  
  async login(credentials: LoginCredentials): Promise<void> {
    this.state.currentUser = await this.userRepository.authenticate(credentials);
    // State change automatically triggers dependent services
  }
}

@Service()
export class CartService implements CartServiceInterface {
  constructor(private userService: Inject<UserServiceInterface>) {
    // Automatically react to user changes
    subscribe(this.userService.state, () => {
      if (this.userService.state.currentUser) {
        this.loadUserCart();
      } else {
        this.clearCart();
      }
    });
  }
  
  state = { items: [] as CartItem[], total: 0 };
  
  addItem(product: Product): void {
    this.state.items.push({ product, quantity: 1 });
    this.state.total += product.price;
    // State change automatically triggers other reactive services
  }
}

@Service()
export class RecommendationService implements RecommendationServiceInterface {
  constructor(
    private userService: Inject<UserServiceInterface>,
    private cartService: Inject<CartServiceInterface>
  ) {
    // Automatically update recommendations when user or cart changes
    subscribe(this.userService.state, () => this.updateRecommendations());
    subscribe(this.cartService.state, () => this.updateRecommendations());
  }
  
  state = { recommendations: [] as Product[] };
  
  private async updateRecommendations(): Promise<void> {
    // Automatically called when dependencies change
    const user = this.userService.state.currentUser;
    const cartItems = this.cartService.state.items;
    
    if (user && cartItems.length) {
      this.state.recommendations = await this.recommendationRepository.getPersonalized(
        user.id, 
        cartItems.map(item => item.product.id)
      );
    }
  }
}
```

**Benefits:**
- Automatic state synchronization across services
- No manual coordination required
- Reactive updates cascade appropriately
- Reduced bugs from forgot state updates

### 6. Lifecycle Separation

**Principle:** Component lifecycle should be separate from business logic lifecycle.

**Traditional React Problem:**
```typescript
function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  useEffect(() => {
    // Business logic mixed with component lifecycle
    if (searchTerm) {
      if (debounceTimer) clearTimeout(debounceTimer);
      
      const timer = setTimeout(async () => {
        const searchResults = await api.searchProducts(searchTerm);
        setResults(searchResults);
        
        // Analytics tracking
        analytics.track('product_search', { term: searchTerm, count: searchResults.length });
        
        // Cache results
        localStorage.setItem(`search_${searchTerm}`, JSON.stringify(searchResults));
      }, 300);
      
      setDebounceTimer(timer);
    } else {
      setResults([]);
    }
    
    // Cleanup mixed with business logic
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [searchTerm]);
}
```

**TDI2 Solution:**
```typescript
@Service()
export class ProductSearchService implements ProductSearchServiceInterface, OnDestroy {
  private debounceTimer: NodeJS.Timeout | null = null;
  
  state = {
    searchTerm: '',
    results: [] as Product[],
    searching: false
  };
  
  search(term: string): void {
    this.state.searchTerm = term;
    this.state.searching = true;
    
    // Business logic lifecycle independent of component
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(async () => {
      if (term) {
        this.state.results = await this.productRepository.search(term);
        await this.analyticsService.trackSearch(term, this.state.results.length);
        await this.cacheService.store(`search_${term}`, this.state.results);
      } else {
        this.state.results = [];
      }
      this.state.searching = false;
    }, 300);
  }
  
  // Service lifecycle managed by container
  onDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}

function ProductSearch({ productSearchService }: ServicesProps) {
  const { searchTerm, results, searching } = productSearchService.state;
  
  // Pure component lifecycle
  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => productSearchService.search(e.target.value)}
      />
      {searching && <Spinner />}
      <ProductList products={results} />
    </div>
  );
}
```

**Benefits:**
- Business logic lifecycle independent of component mounting/unmounting
- Services can exist longer than components
- Cleaner component code focused on UI
- Better resource management through service lifecycle

## Architectural Impact

These principles work together to create:

### 1. **Predictable Architecture**
- Clear boundaries between layers
- Consistent patterns across the application
- Reduced cognitive overhead for developers

### 2. **Testable Design**
- Services are isolated and mockable
- Components become pure and predictable
- Clear interfaces enable focused testing

### 3. **Scalable Structure**
- New features extend existing patterns
- Team members can work independently
- Architecture scales with application complexity

### 4. **Maintainable Codebase**
- Changes have limited blast radius
- Debugging follows clear boundaries
- Refactoring is safer with interfaces

## Enterprise Benefits

For enterprise teams, these principles deliver:

- **Onboarding Speed**: Developers understand familiar patterns
- **Code Quality**: Architecture enforces good practices
- **Team Velocity**: Parallel development with clear boundaries
- **Risk Reduction**: Interfaces limit impact of changes
- **Technical Debt**: Proactive architecture prevents accumulation

These architectural principles aren't theoretical - they're proven patterns adapted for React that deliver measurable improvements in development productivity and code quality.