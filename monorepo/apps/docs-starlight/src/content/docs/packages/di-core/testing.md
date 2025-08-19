---
title: Testing Guide
description: Comprehensive testing strategies for TDI2 services and components. Learn unit testing, integration testing, and mocking patterns.
---

# Testing Guide
## Test Services and Components with Confidence

Master testing TDI2 applications with clear separation between service business logic testing and component rendering testing.

<div class="feature-highlight">
  <h3>🎯 Testing Philosophy</h3>
  <ul>
    <li><strong>Service Unit Tests</strong> - Test business logic in isolation</li>
    <li><strong>Component Tests</strong> - Test rendering with mocked services</li>
    <li><strong>Integration Tests</strong> - Test service interactions</li>
    <li><strong>E2E Tests</strong> - Test complete user workflows</li>
  </ul>
</div>

---

## Service Unit Testing

### Basic Service Testing

```typescript
// ProductService.test.ts
import { ProductService } from '../services/ProductService';
import { MockProductRepository } from '../__mocks__/MockProductRepository';
import { MockNotificationService } from '../__mocks__/MockNotificationService';

describe('ProductService', () => {
  let productService: ProductService;
  let mockRepository: MockProductRepository;
  let mockNotificationService: MockNotificationService;

  beforeEach(() => {
    mockRepository = new MockProductRepository();
    mockNotificationService = new MockNotificationService();
    productService = new ProductService(mockRepository, mockNotificationService);
  });

  it('should load products successfully', async () => {
    // Arrange
    const mockProducts = [
      { id: '1', name: 'iPhone', price: 999, category: 'phones' },
      { id: '2', name: 'MacBook', price: 1999, category: 'laptops' }
    ];
    mockRepository.setMockProducts(mockProducts);

    // Act
    await productService.loadProducts();

    // Assert
    expect(productService.state.products).toEqual(mockProducts);
    expect(productService.state.loading).toBe(false);
    expect(productService.state.error).toBe(null);
  });

  it('should handle loading errors gracefully', async () => {
    // Arrange
    const errorMessage = 'Failed to fetch products';
    mockRepository.setError(new Error(errorMessage));

    // Act
    await productService.loadProducts();

    // Assert
    expect(productService.state.products).toEqual([]);
    expect(productService.state.loading).toBe(false);
    expect(productService.state.error).toBe(errorMessage);
    expect(mockNotificationService.lastError).toBe('Failed to load products');
  });

  it('should filter products by search query', () => {
    // Arrange
    productService.state.products = [
      { id: '1', name: 'iPhone 13', price: 999 },
      { id: '2', name: 'Samsung Galaxy', price: 899 },
      { id: '3', name: 'iPhone 14', price: 1099 }
    ];

    // Act
    productService.setSearchQuery('iPhone');

    // Assert
    expect(productService.state.searchQuery).toBe('iPhone');
    expect(productService.state.filteredProducts).toHaveLength(2);
    expect(productService.state.filteredProducts.every(p => p.name.includes('iPhone'))).toBe(true);
  });
});
```

### Testing Reactive State Changes

```typescript
describe('CartService', () => {
  let cartService: CartService;

  beforeEach(() => {
    cartService = new CartService();
  });

  it('should update totals automatically when items change', () => {
    // Arrange
    const product = { id: '1', name: 'iPhone', price: 999 };

    // Act
    cartService.addItem(product, 2);

    // Assert - totals update automatically
    expect(cartService.state.items).toHaveLength(1);
    expect(cartService.state.items[0].quantity).toBe(2);
    expect(cartService.state.subtotal).toBe(1998);
    expect(cartService.state.total).toBeGreaterThan(1998); // includes tax
  });

  it('should merge quantities for same product', () => {
    // Arrange
    const product = { id: '1', name: 'iPhone', price: 999 };

    // Act
    cartService.addItem(product, 1);
    cartService.addItem(product, 2);

    // Assert
    expect(cartService.state.items).toHaveLength(1);
    expect(cartService.state.items[0].quantity).toBe(3);
  });
});
```

---

## Mock Implementation Patterns

### Repository Mocks

```typescript
// __mocks__/MockProductRepository.ts
export class MockProductRepository implements ProductRepository {
  private mockProducts: Product[] = [];
  private shouldError = false;
  private errorToThrow: Error | null = null;

  setMockProducts(products: Product[]): void {
    this.mockProducts = products;
  }

  setError(error: Error): void {
    this.shouldError = true;
    this.errorToThrow = error;
  }

  reset(): void {
    this.mockProducts = [];
    this.shouldError = false;
    this.errorToThrow = null;
  }

  async getProducts(): Promise<Product[]> {
    if (this.shouldError && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return [...this.mockProducts];
  }

  async getProduct(id: string): Promise<Product> {
    if (this.shouldError && this.errorToThrow) {
      throw this.errorToThrow;
    }
    
    const product = this.mockProducts.find(p => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }
}
```

### Service Mocks

```typescript
// __mocks__/MockNotificationService.ts
export class MockNotificationService implements NotificationService {
  public lastSuccess: string | null = null;
  public lastError: string | null = null;
  public notifications: Array<{ type: 'success' | 'error', message: string }> = [];

  showSuccess(message: string): void {
    this.lastSuccess = message;
    this.notifications.push({ type: 'success', message });
  }

  showError(message: string): void {
    this.lastError = message;
    this.notifications.push({ type: 'error', message });
  }

  reset(): void {
    this.lastSuccess = null;
    this.lastError = null;
    this.notifications = [];
  }

  hasShownSuccess(message: string): boolean {
    return this.notifications.some(n => n.type === 'success' && n.message === message);
  }

  hasShownError(message: string): boolean {
    return this.notifications.some(n => n.type === 'error' && n.message === message);
  }
}
```

---

## Component Testing

### Testing Components with Service Props

```typescript
// ProductList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductList } from '../components/ProductList';
import { MockProductService } from '../__mocks__/MockProductService';

describe('ProductList', () => {
  let mockProductService: MockProductService;

  beforeEach(() => {
    mockProductService = new MockProductService();
  });

  it('should render products correctly', () => {
    // Arrange
    mockProductService.setState({
      products: [
        { id: '1', name: 'iPhone', price: 999 },
        { id: '2', name: 'MacBook', price: 1999 }
      ],
      loading: false,
      error: null
    });

    // Act
    render(<ProductList productService={mockProductService} />);

    // Assert
    expect(screen.getByText('iPhone')).toBeInTheDocument();
    expect(screen.getByText('MacBook')).toBeInTheDocument();
    expect(screen.getByText('$999')).toBeInTheDocument();
    expect(screen.getByText('$1999')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    // Arrange
    mockProductService.setState({
      products: [],
      loading: true,
      error: null
    });

    // Act
    render(<ProductList productService={mockProductService} />);

    // Assert
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
    expect(screen.queryByText('iPhone')).not.toBeInTheDocument();
  });

  it('should show error state', () => {
    // Arrange
    mockProductService.setState({
      products: [],
      loading: false,
      error: 'Failed to load products'
    });

    // Act
    render(<ProductList productService={mockProductService} />);

    // Assert
    expect(screen.getByText('Error: Failed to load products')).toBeInTheDocument();
  });

  it('should handle search input changes', () => {
    // Arrange
    mockProductService.setState({
      products: [{ id: '1', name: 'iPhone', price: 999 }],
      loading: false,
      error: null,
      searchQuery: ''
    });

    render(<ProductList productService={mockProductService} />);
    const searchInput = screen.getByPlaceholderText('Search products...');

    // Act
    fireEvent.change(searchInput, { target: { value: 'iPhone' } });

    // Assert
    expect(mockProductService.setSearchQuery).toHaveBeenCalledWith('iPhone');
  });
});
```

### Mock Service for Components

```typescript
// __mocks__/MockProductService.ts
export class MockProductService implements ProductServiceInterface {
  public state: ProductServiceState = {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
    searchQuery: ''
  };

  // Mock method tracking
  public loadProducts = jest.fn();
  public loadProduct = jest.fn();
  public setSearchQuery = jest.fn();
  public clearSearch = jest.fn();

  setState(newState: Partial<ProductServiceState>): void {
    this.state = { ...this.state, ...newState };
  }

  reset(): void {
    this.state = {
      products: [],
      selectedProduct: null,
      loading: false,
      error: null,
      searchQuery: ''
    };
    
    this.loadProducts.mockReset();
    this.loadProduct.mockReset();
    this.setSearchQuery.mockReset();
    this.clearSearch.mockReset();
  }
}
```

---

## Integration Testing

### Testing Service Interactions

```typescript
// services.integration.test.ts
describe('Service Integration', () => {
  let userService: UserService;
  let cartService: CartService;
  let recommendationService: RecommendationService;

  beforeEach(() => {
    // Use real services with mock repositories
    userService = new UserService(new MockUserRepository());
    cartService = new CartService(new MockStorageService());
    recommendationService = new RecommendationService(
      userService,
      cartService,
      new MockRecommendationRepository()
    );
  });

  it('should update recommendations when user logs in', async () => {
    // Arrange
    const user = { id: '1', name: 'John', preferences: ['electronics'] };

    // Act
    await userService.login('john@example.com', 'password');
    userService.state.currentUser = user;

    // Wait for reactive updates
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert
    expect(recommendationService.state.recommendations).not.toHaveLength(0);
    expect(recommendationService.loadPersonalizedRecommendations).toHaveBeenCalledWith(user.id);
  });

  it('should update recommendations when cart changes', () => {
    // Arrange
    const product = { id: '1', name: 'iPhone', price: 999 };

    // Act
    cartService.addItem(product);

    // Wait for reactive updates
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert
    expect(recommendationService.updateBasedOnCart).toHaveBeenCalled();
  });
});
```

---

## Testing with DIProvider

### Component Integration Tests

```typescript
// ProductCatalog.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DIProvider } from '@tdi2/di-core';
import { ProductCatalog } from '../components/ProductCatalog';
import { setupTestContainer } from '../__tests__/test-utils';

describe('ProductCatalog Integration', () => {
  let container: TestDIContainer;

  beforeEach(() => {
    container = setupTestContainer();
  });

  it('should load and display products on mount', async () => {
    // Arrange
    const mockProducts = [
      { id: '1', name: 'iPhone', price: 999 },
      { id: '2', name: 'MacBook', price: 1999 }
    ];
    container.get<MockProductRepository>('ProductRepository').setMockProducts(mockProducts);

    // Act
    render(
      <DIProvider container={container}>
        <ProductCatalog />
      </DIProvider>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText('iPhone')).toBeInTheDocument();
      expect(screen.getByText('MacBook')).toBeInTheDocument();
    });
  });

  it('should add products to cart', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockProducts = [{ id: '1', name: 'iPhone', price: 999 }];
    container.get<MockProductRepository>('ProductRepository').setMockProducts(mockProducts);

    render(
      <DIProvider container={container}>
        <ProductCatalog />
      </DIProvider>
    );

    await waitFor(() => screen.getByText('iPhone'));

    // Act
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    await user.click(addToCartButton);

    // Assert
    const cartService = container.get<CartService>('CartService');
    expect(cartService.state.items).toHaveLength(1);
    expect(cartService.state.items[0].product.name).toBe('iPhone');
  });
});
```

### Test Container Setup

```typescript
// __tests__/test-utils.ts
import { DIContainer } from '@tdi2/di-core';
import { MockProductRepository } from '../__mocks__/MockProductRepository';
import { MockStorageService } from '../__mocks__/MockStorageService';
import { ProductService } from '../services/ProductService';
import { CartService } from '../services/CartService';

export function setupTestContainer(): DIContainer {
  const container = new DIContainer();

  // Register mock repositories
  container.register('ProductRepository', () => new MockProductRepository());
  container.register('StorageService', () => new MockStorageService());
  container.register('NotificationService', () => new MockNotificationService());

  // Register real services with mock dependencies
  container.register('ProductService', () => 
    new ProductService(
      container.get('ProductRepository'),
      container.get('NotificationService')
    )
  );

  container.register('CartService', () =>
    new CartService(container.get('StorageService'))
  );

  return container;
}
```

---

## Testing Best Practices

### ✅ **Test Business Logic in Services**
Focus service tests on business rules, validation, and state changes.

### ✅ **Test Rendering in Components**
Focus component tests on UI behavior, event handling, and conditional rendering.

### ✅ **Use Descriptive Test Names**
Test names should clearly describe the scenario and expected outcome.

### ✅ **Arrange-Act-Assert Pattern**
Structure tests clearly with setup, action, and verification phases.

### ✅ **Test Error Scenarios**
Include tests for error handling and edge cases.

### ❌ **Avoid Testing Implementation Details**
Test behavior, not internal method calls or state structure.

---

## Testing Tools Integration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(valtio)/)',
  ],
};
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';

// Mock valtio for consistent testing
jest.mock('valtio', () => ({
  proxy: (obj: any) => obj,
  useSnapshot: (obj: any) => obj,
  subscribe: jest.fn(),
}));

// Global test utilities
global.renderWithDI = (component: ReactElement, container?: DIContainer) => {
  const testContainer = container || setupTestContainer();
  return render(
    <DIProvider container={testContainer}>
      {component}
    </DIProvider>
  );
};
```

---

## Next Steps

### Essential Reading
- **[Service Patterns](../../patterns/service-patterns/)** - Testable service design
- **[Component Transformation](../../guides/component-transformation/)** - Testing transformed components
- **[Package Overview](./overview/)** - Core features and concepts

### Examples
- **[Complete Test Suite](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/__tests__)** - Working test examples
- **[Mock Implementations](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/__mocks__)** - Reusable mock patterns
- **[Integration Tests](https://github.com/7frank/tdi2/tree/main/monorepo/packages/di-core/__tests__)** - Service interaction tests

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>TDI2's clear separation between services and components makes testing straightforward. Test business logic in services and rendering behavior in components for maximum confidence and maintainability.</p>
</div>