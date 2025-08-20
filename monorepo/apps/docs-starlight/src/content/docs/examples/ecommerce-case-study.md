---
title: Complete E-Commerce Case Study
description: Full implementation of an e-commerce application using TDI2 service architecture
sidebar:
  order: 1
---

This case study demonstrates a complete e-commerce application built with TDI2, showcasing service-oriented architecture, reactive state management, and clean separation of concerns.

## Architecture Overview

The application follows clean architecture principles with distinct layers:
- **Services**: Business logic and state management
- **Repositories**: Data access abstraction
- **Components**: Pure UI presentation
- **Interfaces**: Contract definitions for dependency injection

## Core Services Implementation

### Product Service
Handles product catalog, search, and filtering logic.

```typescript
@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    products: [] as Product[],
    currentProduct: null as Product | null,
    searchQuery: '',
    filters: { category: '', priceRange: { min: 0, max: 1000 } },
    loading: false,
    error: null as string | null
  };

  constructor(
    private productRepository: Inject<ProductRepositoryInterface>
  ) {}

  async loadProducts(): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    
    try {
      const products = await this.productRepository.findAll();
      this.state.products = products;
    } catch (error) {
      this.state.error = 'Failed to load products';
    } finally {
      this.state.loading = false;
    }
  }

  async loadProduct(id: string): Promise<void> {
    this.state.loading = true;
    
    try {
      const product = await this.productRepository.findById(id);
      this.state.currentProduct = product;
    } catch (error) {
      this.state.error = `Product not found: ${id}`;
    } finally {
      this.state.loading = false;
    }
  }

  searchProducts(query: string): void {
    this.state.searchQuery = query;
    // Reactive filtering happens automatically through computed properties
  }

  get filteredProducts(): Product[] {
    return this.state.products.filter(product => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(this.state.searchQuery.toLowerCase());
      
      const matchesCategory = !this.state.filters.category || 
        product.category === this.state.filters.category;
      
      const matchesPrice = product.price >= this.state.filters.priceRange.min &&
        product.price <= this.state.filters.priceRange.max;
      
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }
}
```

### Cart Service
Manages shopping cart state and business rules.

```typescript
@Service()
export class CartService implements CartServiceInterface {
  state = {
    items: [] as CartItem[],
    totalItems: 0,
    totalPrice: 0,
    discounts: [] as Discount[],
    shippingCost: 0
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
      this.state.items.push({
        ...product,
        quantity
      });
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
    this.state.totalItems = this.state.items.reduce(
      (total, item) => total + item.quantity, 0
    );
    
    const subtotal = this.state.items.reduce(
      (total, item) => total + (item.price * item.quantity), 0
    );
    
    const discountAmount = this.discountService.calculateDiscount(
      this.state.items, this.state.discounts
    );
    
    this.state.totalPrice = subtotal - discountAmount + this.state.shippingCost;
  }

  async applyDiscountCode(code: string): Promise<boolean> {
    try {
      const discount = await this.discountService.validateCode(code);
      this.state.discounts.push(discount);
      this.recalculateTotal();
      return true;
    } catch {
      return false;
    }
  }
}
```

### User Service
Handles authentication and user profile management.

```typescript
@Service()
export class UserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    isAuthenticated: false,
    profile: null as UserProfile | null,
    addresses: [] as Address[],
    orders: [] as Order[]
  };

  constructor(
    private authRepository: Inject<AuthRepositoryInterface>,
    private userRepository: Inject<UserRepositoryInterface>
  ) {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const user = await this.authRepository.validateToken(token);
        this.setAuthenticatedUser(user);
      } catch {
        this.logout();
      }
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const { user, token } = await this.authRepository.login(email, password);
      localStorage.setItem('auth_token', token);
      this.setAuthenticatedUser(user);
    } catch (error) {
      throw new AuthenticationError('Invalid credentials');
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    this.state.currentUser = null;
    this.state.isAuthenticated = false;
    this.state.profile = null;
    this.state.addresses = [];
    this.state.orders = [];
  }

  private setAuthenticatedUser(user: User): void {
    this.state.currentUser = user;
    this.state.isAuthenticated = true;
    this.loadUserProfile(user.id);
  }

  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const [profile, addresses, orders] = await Promise.all([
        this.userRepository.getProfile(userId),
        this.userRepository.getAddresses(userId),
        this.userRepository.getOrders(userId)
      ]);
      
      this.state.profile = profile;
      this.state.addresses = addresses;
      this.state.orders = orders;
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }
}
```

### Checkout Service
Orchestrates the complete checkout process.

```typescript
@Service()
export class CheckoutService implements CheckoutServiceInterface {
  state = {
    currentStep: 'shipping' as CheckoutStep,
    shippingAddress: null as Address | null,
    billingAddress: null as Address | null,
    paymentMethod: null as PaymentMethod | null,
    orderSummary: null as OrderSummary | null,
    processing: false,
    error: null as string | null
  };

  constructor(
    private cartService: Inject<CartServiceInterface>,
    private userService: Inject<UserServiceInterface>,
    private paymentService: Inject<PaymentServiceInterface>,
    private orderService: Inject<OrderServiceInterface>,
    private shippingService: Inject<ShippingServiceInterface>
  ) {}

  async proceedToPayment(shippingAddress: Address): Promise<void> {
    this.state.shippingAddress = shippingAddress;
    
    // Calculate shipping cost
    const shippingCost = await this.shippingService.calculateCost(
      this.cartService.state.items,
      shippingAddress
    );
    
    this.cartService.state.shippingCost = shippingCost;
    this.state.currentStep = 'payment';
  }

  async processPayment(paymentMethod: PaymentMethod): Promise<Order> {
    this.state.processing = true;
    this.state.error = null;
    
    try {
      // Validate inventory before processing payment
      await this.validateInventory();
      
      // Process payment
      const paymentResult = await this.paymentService.processPayment({
        amount: this.cartService.state.totalPrice,
        method: paymentMethod,
        billingAddress: this.state.billingAddress
      });
      
      // Create order
      const order = await this.orderService.createOrder({
        userId: this.userService.state.currentUser!.id,
        items: this.cartService.state.items,
        shippingAddress: this.state.shippingAddress!,
        billingAddress: this.state.billingAddress!,
        paymentResult,
        totalAmount: this.cartService.state.totalPrice
      });
      
      // Clear cart and reset checkout state
      this.cartService.state.items = [];
      this.cartService.recalculateTotal();
      this.resetCheckoutState();
      
      return order;
      
    } catch (error) {
      this.state.error = error.message;
      throw error;
    } finally {
      this.state.processing = false;
    }
  }

  private async validateInventory(): Promise<void> {
    for (const item of this.cartService.state.items) {
      const available = await this.shippingService.checkAvailability(
        item.id, 
        item.quantity
      );
      
      if (!available) {
        throw new InsufficientStockError(item.id, item.quantity);
      }
    }
  }

  private resetCheckoutState(): void {
    this.state.currentStep = 'shipping';
    this.state.shippingAddress = null;
    this.state.billingAddress = null;
    this.state.paymentMethod = null;
    this.state.orderSummary = null;
  }
}
```

## Repository Layer

### Product Repository
Abstracts product data access with caching and error handling.

```typescript
@Service()
export class ProductRepository implements ProductRepositoryInterface {
  private cache = new Map<string, Product>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async findAll(): Promise<Product[]> {
    const cacheKey = 'all_products';
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey) as Product[];
    }
    
    const products = await this.fetchProducts('/api/products');
    this.setCache(cacheKey, products);
    return products;
  }

  async findById(id: string): Promise<Product> {
    if (this.isValidCache(id)) {
      return this.cache.get(id) as Product;
    }
    
    const product = await this.fetchProduct(`/api/products/${id}`);
    this.setCache(id, product);
    return product;
  }

  async findByCategory(category: string): Promise<Product[]> {
    const cacheKey = `category_${category}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey) as Product[];
    }
    
    const products = await this.fetchProducts(`/api/products?category=${category}`);
    this.setCache(cacheKey, products);
    return products;
  }

  private async fetchProducts(url: string): Promise<Product[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ProductFetchError(`Failed to fetch products: ${response.statusText}`);
    }
    return response.json();
  }

  private async fetchProduct(url: string): Promise<Product> {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new ProductNotFoundError(url.split('/').pop() || '');
      }
      throw new ProductFetchError(`Failed to fetch product: ${response.statusText}`);
    }
    return response.json();
  }

  private isValidCache(key: string): boolean {
    return this.cache.has(key) && 
           this.cacheExpiry.has(key) && 
           Date.now() < this.cacheExpiry.get(key)!;
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }
}
```

## Component Layer

### Product List Component
Pure UI component focused on presentation.

```typescript
export default function ProductList({ 
  productService 
}: { 
  productService: Inject<ProductServiceInterface> 
}) {
  const products = productService.filteredProducts;
  const loading = productService.state.loading;
  const error = productService.state.error;

  useEffect(() => {
    productService.loadProducts();
  }, []);

  if (loading) {
    return <ProductListSkeleton />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => productService.loadProducts()} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          onAddToCart={(product) => cartService.addItem(product)}
        />
      ))}
    </div>
  );
}
```

### Shopping Cart Component
Reactive cart display with real-time updates.

```typescript
export default function ShoppingCart({ 
  cartService 
}: { 
  cartService: Inject<CartServiceInterface> 
}) {
  const { items, totalPrice, totalItems } = cartService.state;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        Shopping Cart ({totalItems} items)
      </h2>
      
      {items.length === 0 ? (
        <EmptyCartMessage />
      ) : (
        <>
          <div className="space-y-4">
            {items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={(quantity) => 
                  cartService.updateQuantity(item.id, quantity)
                }
                onRemove={() => cartService.removeItem(item.id)}
              />
            ))}
          </div>
          
          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total: ${totalPrice.toFixed(2)}</span>
            </div>
            
            <button
              onClick={() => router.push('/checkout')}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

## Testing Strategy

### Service Unit Testing
Test business logic in isolation without UI dependencies.

```typescript
describe('CartService', () => {
  let cartService: CartService;
  let mockInventoryService: jest.Mocked<InventoryServiceInterface>;
  
  beforeEach(() => {
    mockInventoryService = {
      isAvailable: jest.fn().mockReturnValue(true)
    };
    
    cartService = new CartService(mockInventoryService, mockDiscountService);
  });

  test('should add product to cart', () => {
    const product = createMockProduct({ id: '1', price: 10 });
    
    cartService.addItem(product, 2);
    
    expect(cartService.state.items).toHaveLength(1);
    expect(cartService.state.items[0].quantity).toBe(2);
    expect(cartService.state.totalPrice).toBe(20);
  });

  test('should handle insufficient stock', () => {
    mockInventoryService.isAvailable.mockReturnValue(false);
    const product = createMockProduct({ id: '1' });
    
    expect(() => cartService.addItem(product, 5)).toThrow(InsufficientStockError);
  });
});
```

### Integration Testing
Test service interactions and data flow.

```typescript
describe('Checkout Flow Integration', () => {
  let checkoutService: CheckoutService;
  let cartService: CartService;
  
  beforeEach(async () => {
    const container = new DIContainer();
    container.loadConfiguration(TEST_DI_CONFIG);
    
    checkoutService = container.get<CheckoutServiceInterface>('CheckoutService');
    cartService = container.get<CartServiceInterface>('CartService');
    
    // Setup test data
    cartService.addItem(createMockProduct({ id: '1', price: 100 }), 1);
  });

  test('should complete full checkout process', async () => {
    const shippingAddress = createMockAddress();
    const paymentMethod = createMockPaymentMethod();
    
    await checkoutService.proceedToPayment(shippingAddress);
    expect(checkoutService.state.currentStep).toBe('payment');
    
    const order = await checkoutService.processPayment(paymentMethod);
    expect(order.id).toBeDefined();
    expect(cartService.state.items).toHaveLength(0);
  });
});
```

## Performance Optimizations

### Reactive State Management
Valtio's proxy-based reactivity ensures components only re-render when their specific data changes.

### Caching Strategy
Repository layer implements intelligent caching to reduce API calls and improve performance.

### Code Splitting
Services and components are lazy-loaded based on user navigation patterns.

## Deployment Configuration

### Environment Configuration
```typescript
// config/production.ts
export const PRODUCTION_CONFIG: DIConfiguration = {
  services: [
    { token: 'ProductRepository', implementation: ProductRepository },
    { token: 'PaymentService', implementation: StripePaymentService },
    { token: 'NotificationService', implementation: EmailNotificationService }
  ]
};

// config/development.ts  
export const DEVELOPMENT_CONFIG: DIConfiguration = {
  services: [
    { token: 'ProductRepository', implementation: MockProductRepository },
    { token: 'PaymentService', implementation: MockPaymentService },
    { token: 'NotificationService', implementation: ConsoleNotificationService }
  ]
};
```

This complete e-commerce implementation demonstrates how TDI2 enables scalable, testable, and maintainable React applications through service-oriented architecture and clean separation of concerns.