---
title: '@tdi2/di-core Overview'
description: Core dependency injection framework with reactive services, decorators, and automatic interface resolution for enterprise React applications.
---

# @tdi2/di-core Overview
## Enterprise Dependency Injection for React

The core TDI2 framework that transforms React development through dependency injection, reactive services, and automatic interface resolution.

<div class="feature-highlight">
  <h3>🎯 Core Features</h3>
  <ul>
    <li><strong>Service Decorators</strong> - @Service() and @Inject() for clean DI</li>
    <li><strong>Reactive State</strong> - Valtio-powered automatic reactivity</li>
    <li><strong>Interface Resolution</strong> - Automatic service discovery</li>
    <li><strong>Container Management</strong> - Service lifecycle and scoping</li>
  </ul>
</div>

---

## Installation

```bash
# npm
npm install @tdi2/di-core valtio

# bun
bun add @tdi2/di-core valtio

# pnpm  
pnpm add @tdi2/di-core valtio
```

---

## Core Components

### Service Decorators

```typescript
import { Service, Inject } from '@tdi2/di-core';

// Define service interface
interface ProductServiceInterface {
  state: {
    products: Product[];
    loading: boolean;
  };
  loadProducts(): Promise<void>;
}

// Implement with @Service decorator
@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    products: [] as Product[],
    loading: false
  };

  constructor(
    @Inject() private productRepository: ProductRepository,
    @Inject() private notificationService: NotificationService
  ) {}

  async loadProducts(): Promise<void> {
    this.state.loading = true;
    try {
      this.state.products = await this.productRepository.getProducts();
    } finally {
      this.state.loading = false;
    }
  }
}
```

### DI Container

```typescript
import { DIContainer, DIProvider } from '@tdi2/di-core';
import { DI_CONFIG } from './.tdi2/di-config'; // Auto-generated

const container = new DIContainer();
container.loadConfiguration(DI_CONFIG);

function App() {
  return (
    <DIProvider container={container}>
      <ProductCatalog />  {/* Services auto-injected */}
    </DIProvider>
  );
}
```

### Component Integration

```typescript
import { Inject } from '@tdi2/di-core';

interface ProductListProps {
  productService: Inject<ProductServiceInterface>;
}

function ProductList({ productService }: ProductListProps) {
  const { products, loading } = productService.state;
  
  return (
    <div>
      {loading ? (
        <Spinner />
      ) : (
        products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))
      )}
    </div>
  );
}
```

---

## Service Lifecycle

### Lifecycle Hooks

```typescript
@Service()
export class CartService implements OnMount, OnUnmount {
  state = {
    items: [] as CartItem[],
    total: 0
  };

  onMount(): void {
    // Called when service is first created
    this.loadPersistedCart();
    this.setupAutoSave();
  }

  onUnmount(): void {
    // Called when service is destroyed
    this.saveCartToStorage();
    this.cleanupTimers();
  }

  private setupAutoSave(): void {
    // Auto-save cart every 30 seconds
    setInterval(() => this.saveCartToStorage(), 30000);
  }
}
```

### Service Scoping

```typescript
// Singleton (default) - one instance per container
@Service()
export class UserService {}

// Transient - new instance each time
@Service({ scope: 'transient' })
export class ApiClient {}

// Scoped - one instance per scope
@Service({ scope: 'request' })
export class RequestLogger {}
```

---

## Testing Support

### Service Unit Testing

```typescript
describe('ProductService', () => {
  let productService: ProductService;
  let mockRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepository = {
      getProducts: jest.fn(),
      getProduct: jest.fn()
    };
    
    productService = new ProductService(
      mockRepository,
      new MockNotificationService()
    );
  });

  it('should load products correctly', async () => {
    const mockProducts = [
      { id: '1', name: 'iPhone', price: 999 }
    ];
    mockRepository.getProducts.mockResolvedValue(mockProducts);

    await productService.loadProducts();

    expect(productService.state.products).toEqual(mockProducts);
    expect(productService.state.loading).toBe(false);
  });
});
```

### Component Testing with Mocks

```typescript
import { render, screen } from '@testing-library/react';
import { DIContainer, DIProvider } from '@tdi2/di-core';

describe('ProductList', () => {
  it('should render products', () => {
    const mockProductService = {
      state: {
        products: [{ id: '1', name: 'iPhone', price: 999 }],
        loading: false
      },
      loadProducts: jest.fn()
    };

    const testContainer = new DIContainer();
    // Register mock service in container
    testContainer.register('ProductService', () => mockProductService);

    render(
      <DIProvider container={testContainer}>
        <ProductList productService={mockProductService} />
      </DIProvider>
    );

    expect(screen.getByText('iPhone')).toBeInTheDocument();
  });
});
```

---

## Performance Features

### Automatic Reactivity

```typescript
@Service()
export class CartService {
  state = {
    items: [] as CartItem[],
    // Computed properties are automatically reactive
    get total(): number {
      return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    get itemCount(): number {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  };

  addItem(product: Product, quantity = 1): void {
    // State changes automatically trigger component re-renders
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
    // No manual state synchronization needed!
  }
}
```

### Selective Re-rendering

```typescript
function CartSummary({ cartService }: { cartService: Inject<CartServiceInterface> }) {
  // Component only re-renders when total or itemCount changes
  const { total, itemCount } = cartService.state;
  
  return (
    <div>
      <div>Items: {itemCount}</div>
      <div>Total: ${total.toFixed(2)}</div>
    </div>
  );
}
```

---

## Advanced Features

### Cross-Service Communication

```typescript
@Service()
export class RecommendationService {
  constructor(
    @Inject() private userService: UserServiceInterface,
    @Inject() private cartService: CartServiceInterface
  ) {
    // React to user changes
    subscribe(this.userService.state, () => {
      if (this.userService.state.isAuthenticated) {
        this.loadPersonalizedRecommendations();
      }
    });

    // React to cart changes
    subscribe(this.cartService.state, () => {
      this.updateRecommendationsBasedOnCart();
    });
  }
}
```

### Optional Dependencies

```typescript
@Service()
export class UserService {
  constructor(
    @Inject() private userRepository: UserRepository,
    @Inject() private logger?: LoggerInterface,        // Optional
    @Inject() private analytics?: AnalyticsService     // Optional
  ) {}

  async createUser(userData: CreateUserRequest): Promise<User> {
    this.logger?.log('Creating user');
    const user = await this.userRepository.createUser(userData);
    this.analytics?.track('user_created', { userId: user.id });
    return user;
  }
}
```

---

## Best Practices

### ✅ **Interface-First Design**
Always define interfaces before implementations for better testability and flexibility.

### ✅ **Flat State Structure**
Keep service state flat and easily consumable by components.

### ✅ **Single Responsibility**
Each service should have one clear business purpose.

### ✅ **Reactive Patterns**
Leverage automatic reactivity instead of manual state synchronization.

### ❌ **Avoid Circular Dependencies**
Design service dependencies as a directed acyclic graph.

---

## Package Structure

```
@tdi2/di-core/
├── decorators/          # @Service, @Inject decorators
├── container/          # DI container implementation
├── context/            # React context providers
├── hooks/              # React hooks for service access
├── lifecycle/          # Service lifecycle management
├── testing/            # Testing utilities and mocks
└── types/              # TypeScript type definitions
```

---

## Next Steps

### Essential Reading
- **[Testing Guide](./testing/)** - Test services and components
- **[Service Patterns](../../patterns/service-patterns/)** - Design robust services

### Configuration
- **[Vite Plugin](../vite-plugin-di/overview/)** - Build-time transformation
- **[Quick Start](../../getting-started/quick-start/)** - Complete setup tutorial

### Examples
- **[Complete E-Commerce App](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app)** - Working implementation
- **[Service Examples](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/services)** - Real service implementations
- **[Interactive Demos](https://github.com/7frank/tdi2/tree/main/monorepo/apps/di-test-harness)** - Live examples

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>@tdi2/di-core provides the foundation for service-oriented React architecture. Start with simple services and gradually adopt advanced patterns as your application grows.</p>
</div>