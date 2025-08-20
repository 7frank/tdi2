---
title: Service Patterns Guide
description: Master TDI2 service patterns with focused e-commerce examples. Learn data management, business logic, cross-service communication, and repository patterns.
---

# Service Patterns Guide
## Essential Patterns for Scalable React Services

Learn the fundamental patterns for building maintainable, reactive services. Each pattern solves specific architectural challenges in modern React applications.

<div class="feature-highlight">
  <h3>🏗️ Core Patterns</h3>
  <ul>
    <li><strong>Data Management</strong> - API data, CRUD operations, caching</li>
    <li><strong>Business Logic</strong> - Complex calculations, workflows, validation</li>
    <li><strong>Application State</strong> - Global UI state, user preferences</li>
    <li><strong>Cross-Service Communication</strong> - Reactive service coordination</li>
    <li><strong>Repository Pattern</strong> - Data access abstraction</li>
  </ul>
</div>

---

## Core Service Structure

Every TDI2 service follows this proven structure:

```typescript
// 1. Define the interface contract
interface ServiceInterface {
  state: {
    // All reactive state properties
  };
  // Business methods
}

// 2. Implement with dependency injection
@Service()
class ConcreteService implements ServiceInterface {
  state = {
    // Initialize with sensible defaults
  };

  constructor(
    @Inject() private dependency1: Dependency1Interface,
    @Inject() private dependency2: Dependency2Interface
  ) {}

  // Business logic methods that mutate state
}
```

---

## Pattern 1: Data Management Service

**Perfect for:** Product catalogs, user management, content loading

### Basic Product Service

```typescript
interface ProductServiceInterface {
  state: {
    products: Product[];
    selectedProduct: Product | null;
    loading: boolean;
    error: string | null;
    searchTerm: string;
  };
  
  loadProducts(): Promise<void>;
  loadProduct(id: string): Promise<void>;
  searchProducts(term: string): void;
}

@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    products: [] as Product[],
    selectedProduct: null as Product | null,
    loading: false,
    error: null as string | null,
    searchTerm: ''
  };

  constructor(
    @Inject() private productRepository: ProductRepository,
    @Inject() private notificationService: NotificationService
  ) {}

  async loadProducts(): Promise<void> {
    this.state.loading = true;
    this.state.error = null;

    try {
      this.state.products = await this.productRepository.getProducts();
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to load products');
    } finally {
      this.state.loading = false;
    }
  }

  searchProducts(term: string): void {
    this.state.searchTerm = term;
    // Debounced search triggers reactive filtering in components
  }
}
```

**Key Features:**
- Centralized data loading and error handling
- Reactive search that updates components automatically
- Clean separation between data fetching and business logic

**[→ See Advanced ProductService Example](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/services/ProductService.ts)**

**[→ Try Interactive Demo](https://github.com/7frank/tdi2/tree/main/monorepo/apps/di-test-harness/src/stories/ProductServiceDemo.stories.tsx)**

---

## Pattern 2: Business Logic Service

**Perfect for:** Shopping carts, form validation, complex calculations

### Shopping Cart with Reactive Totals

```typescript
interface CartServiceInterface {
  state: {
    items: CartItem[];
    totals: {
      subtotal: number;
      tax: number;
      total: number;
    };
    loading: boolean;
  };
  
  addToCart(product: Product, quantity?: number): void;
  removeFromCart(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  calculateTotals(): void;
}

@Service()
export class CartService implements CartServiceInterface {
  state = {
    items: [] as CartItem[],
    totals: { subtotal: 0, tax: 0, total: 0 },
    loading: false
  };

  constructor(
    @Inject() private pricingService: PricingService,
    @Inject() private notificationService: NotificationService
  ) {}

  addToCart(product: Product, quantity = 1): void {
    const existingItem = this.state.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.state.items.push({
        productId: product.id,
        product,
        quantity,
        price: product.price
      });
    }

    this.calculateTotals();
    this.notificationService.showSuccess(`${product.name} added to cart`);
  }

  calculateTotals(): void {
    const subtotal = this.state.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    
    const tax = this.pricingService.calculateTax(subtotal);
    
    this.state.totals = {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round((subtotal + tax) * 100) / 100
    };
  }
}
```

**Key Features:**
- Encapsulates complex business rules
- Automatic total calculation on state changes
- User feedback through notifications

**[→ See Full CartService with Coupons & Shipping](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/services/CartService.ts)**

**[→ Try Cart Calculations Demo](https://github.com/7frank/tdi2/tree/main/monorepo/apps/di-test-harness/src/stories/CartCalculationsDemo.stories.tsx)**

---

## Pattern 3: Application State Service

**Perfect for:** Theme, navigation, global UI state, user preferences

### App State with Persistence

```typescript
interface AppStateServiceInterface {
  state: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    currency: 'USD' | 'EUR' | 'GBP';
    notifications: Notification[];
  };
  
  setTheme(theme: 'light' | 'dark'): void;
  toggleSidebar(): void;
  addNotification(notification: Notification): void;
  savePreferences(): void;
}

@Service()
export class AppStateService implements AppStateServiceInterface {
  state = {
    theme: 'light' as 'light' | 'dark',
    sidebarOpen: false,
    currency: 'USD' as 'USD' | 'EUR' | 'GBP',
    notifications: [] as Notification[]
  };

  constructor(@Inject() private storageService: StorageService) {
    this.loadPreferences();
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.state.theme = theme;
    document.body.className = `theme-${theme}`;
    this.savePreferences();
  }

  addNotification(notification: Notification): void {
    this.state.notifications.push({
      ...notification,
      id: Date.now().toString()
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.state.notifications = this.state.notifications.filter(
        n => n.id !== notification.id
      );
    }, 5000);
  }

  private savePreferences(): void {
    this.storageService.set('preferences', {
      theme: this.state.theme,
      currency: this.state.currency
    });
  }
}
```

**Key Features:**
- Global state accessible from any component
- Automatic persistence to localStorage
- Real-time theme switching across the app

**[→ See Complete AppStateService](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/services/AppStateService.ts)**

---

## Pattern 4: Cross-Service Communication

Services automatically react to changes in other services using Valtio's `subscribe`:

```typescript
@Service()
export class RecommendationService {
  state = {
    recommendations: [] as Product[],
    loading: false
  };

  constructor(
    @Inject() private userService: UserServiceInterface,
    @Inject() private cartService: CartServiceInterface,
    @Inject() private productService: ProductServiceInterface
  ) {
    this.setupReactiveUpdates();
  }

  private setupReactiveUpdates(): void {
    // React to user changes
    subscribe(this.userService.state, () => {
      if (this.userService.state.isAuthenticated) {
        this.loadPersonalizedRecommendations();
      }
    });

    // React to cart changes
    subscribe(this.cartService.state, () => {
      this.updateBasedOnCartItems();
    });
  }

  private async loadPersonalizedRecommendations(): Promise<void> {
    const user = this.userService.state.currentUser;
    const cartItems = this.cartService.state.items;
    
    // Load recommendations excluding cart items
    this.state.recommendations = await this.recommendationRepository.getPersonalized({
      userId: user.id,
      excludeProductIds: cartItems.map(item => item.productId)
    });
  }
}
```

**Key Features:**
- Services automatically coordinate without manual event handling
- Reactive updates keep data synchronized across the app
- Clean service boundaries with automatic dependency management

**[→ See Service Communication Examples](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/services/)**

---

## Pattern 5: Repository Pattern

**Perfect for:** API abstraction, testing, environment-specific data sources

```typescript
// Interface for data access
interface ProductRepository {
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product>;
  createProduct(data: CreateProductRequest): Promise<Product>;
}

// Production implementation
@Service()
export class ApiProductRepository implements ProductRepository {
  constructor(@Inject() private httpClient: HttpClient) {}

  async getProducts(): Promise<Product[]> {
    const response = await this.httpClient.get('/api/products');
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.httpClient.get(`/api/products/${id}`);
    return response.data;
  }
}

// Test implementation  
@Service()
export class MockProductRepository implements ProductRepository {
  private products: Product[] = [/* mock data */];

  async getProducts(): Promise<Product[]> {
    return [...this.products];
  }

  async getProduct(id: string): Promise<Product> {
    const product = this.products.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    return product;
  }
}
```

**Key Features:**
- Swap implementations for testing/development
- Clean separation between business logic and data access
- Easy to mock for unit testing

**[→ See Repository Implementations](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/repositories/)**

---

## Best Practices

### ✅ **State Design**
- Keep state flat and easily consumable
- Use computed properties for derived data
- Initialize with sensible defaults

```typescript
// Good: Flat, reactive state
state = {
  products: Product[],
  loading: boolean,
  error: string | null,
  filters: { category: string | null }
};

// Avoid: Deeply nested state
state = {
  ui: { products: { list: { items: Product[] } } }
};
```

### ✅ **Error Handling**
- Always handle async errors gracefully
- Provide user feedback through notifications
- Log errors for debugging

### ✅ **Performance**
- Use debouncing for search and API calls
- Implement smart caching where appropriate
- Leverage Valtio's automatic optimization

---

## Next Steps

### Learn More
- **[Quick Start Guide](../getting-started/quick-start/)** - Build your first service
- **[Testing Guide](../packages/di-core/testing/)** - Test services effectively
- **[Component Guide](../guides/component-transformation/)** - Use services in components

### Examples
- **[Complete E-Commerce App](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app)** - Working implementation
- **[Interactive Demos](https://github.com/7frank/tdi2/tree/main/monorepo/apps/di-test-harness)** - Try patterns live
- **[Package Documentation](../packages/di-core/overview/)** - Complete feature reference

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>Start with simple data management services and gradually adopt more complex patterns. Each pattern solves specific architectural challenges and scales with your application.</p>
</div>