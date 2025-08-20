---
title: 'TDI2 Testing Utilities'
description: Simple, focused testing utilities for TDI2 services and components. Learn the three core testing patterns and utility methods.
---

TDI2 testing is built around three core patterns: **DI-focused tests** (pure service testing), **Service Component-focused tests** (components with service props), and **Behavior Component-focused tests** (full integration testing).

## Core Testing Patterns

### 1. DI-Focused Tests (Service Unit Testing)

Test services in complete isolation with simple mocking.

```typescript
// ProductService.test.ts
import { ProductService } from '../services/ProductService';

describe('ProductService', () => {
  let productService: ProductService;
  let mockRepository: jest.Mocked<ProductRepositoryInterface>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn(),
      getById: jest.fn(),
      search: jest.fn(),
    };
    
    productService = new ProductService(mockRepository);
  });

  it('should load products successfully', async () => {
    // Arrange
    const mockProducts = [
      { id: '1', name: 'iPhone', price: 999, category: 'phones' },
      { id: '2', name: 'MacBook', price: 1999, category: 'laptops' }
    ];
    mockRepository.getAll.mockResolvedValue(mockProducts);

    // Act
    await productService.loadProducts();

    // Assert
    expect(productService.state.products).toEqual(mockProducts);
    expect(productService.state.loading).toBe(false);
    expect(productService.state.error).toBe(null);
  });
});
```

### 2. Service Component-Focused Tests

Test components with service props using simple mock objects.

```typescript
// ProductList.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductList } from '../components/ProductList';

describe('ProductList', () => {
  it('should render products correctly', () => {
    // Arrange - Simple mock object
    const mockProductService = {
      state: {
        products: [
          { id: '1', name: 'iPhone', price: 999 },
          { id: '2', name: 'MacBook', price: 1999 }
        ],
        loading: false,
        error: null
      },
      loadProducts: jest.fn(),
      setSearchQuery: jest.fn(),
    };

    // Act
    render(<ProductList productService={mockProductService} />);

    // Assert
    expect(screen.getByText('iPhone')).toBeInTheDocument();
    expect(screen.getByText('MacBook')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    // Arrange
    const mockProductService = {
      state: { products: [], loading: true, error: null },
      loadProducts: jest.fn(),
      setSearchQuery: jest.fn(),
    };

    // Act
    render(<ProductList productService={mockProductService} />);

    // Assert
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### 3. Behavior Component-Focused Tests

Test complete component behavior with full DI integration.

```typescript
// ProductCatalog.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { DIProvider } from '@tdi2/di-core';
import { ProductCatalog } from '../components/ProductCatalog';
import { createTestContainer } from '@tdi2/di-testing';

describe('ProductCatalog Integration', () => {
  it('should load and display products', async () => {
    // Arrange - Real DI container with test setup
    const container = createTestContainer({
      productRepository: {
        getAll: () => Promise.resolve([
          { id: '1', name: 'iPhone', price: 999 }
        ])
      }
    });

    // Act
    render(
      <DIProvider container={container}>
        <ProductCatalog />
      </DIProvider>
    );

    // Assert - Full behavior testing
    await waitFor(() => {
      expect(screen.getByText('iPhone')).toBeInTheDocument();
    });
  });
});
```

## Testing Utility Methods

### `createTestContainer(mocks?)`

Creates a DI container pre-configured for testing.

```typescript
import { createTestContainer } from '@tdi2/di-testing';

// Basic test container
const container = createTestContainer();

// Container with specific mocks
const container = createTestContainer({
  productRepository: {
    getAll: () => Promise.resolve([]),
    getById: (id) => Promise.resolve(null),
  },
  userService: {
    state: { currentUser: null },
    login: jest.fn(),
    logout: jest.fn(),
  }
});
```

### `mockService<T>(partial?)`

Creates a mock service with Jest functions and default state.

```typescript
import { mockService } from '@tdi2/di-testing';

// Full service mock with Jest functions
const mockProductService = mockService<ProductServiceInterface>({
  state: {
    products: [],
    loading: false,
    error: null
  }
});

// Mock automatically includes jest.fn() for all methods
expect(mockProductService.loadProducts).toHaveBeenCalled();
```

### `createMockRepository<T>(data?)`

Creates repository mocks with data fixtures.

```typescript
import { createMockRepository } from '@tdi2/di-testing';

// Repository with test data
const mockRepo = createMockRepository<Product>([
  { id: '1', name: 'iPhone', price: 999 },
  { id: '2', name: 'MacBook', price: 1999 }
]);

// Supports standard repository methods
const product = await mockRepo.getById('1');
const allProducts = await mockRepo.getAll();

// Error simulation
mockRepo.simulateError('getById', new Error('Not found'));
```

### `renderWithDI(component, mocks?)`

Renders components wrapped with test DI container.

```typescript
import { renderWithDI } from '@tdi2/di-testing';

// Render with default test container
const { getByText } = renderWithDI(<ProductList />);

// Render with specific mocks
const { getByText } = renderWithDI(<ProductList />, {
  productService: {
    state: { products: [], loading: true }
  }
});
```

## Quick Setup

### Installation

TDI2 testing utilities are included with the core package:

```bash
npm install @tdi2/di-core
# Testing utilities included
```

### Basic Test Setup

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { configureTDI2Testing } from '@tdi2/di-testing';

configureTDI2Testing({
  // Global test configuration
  defaultMocks: {
    // Services that should always be mocked
    analyticsService: { track: jest.fn() },
    loggerService: { log: jest.fn(), error: jest.fn() }
  },
  
  // Automatic cleanup
  autoCleanup: true,
});
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  }
};
```

## Testing Examples by Pattern

### DI-Focused: Pure Service Testing

```typescript
describe('CartService', () => {
  it('should calculate totals correctly', () => {
    // Test pure business logic
    const cartService = new CartService();
    const product = { id: '1', name: 'iPhone', price: 999 };
    
    cartService.addItem(product, 2);
    
    expect(cartService.state.subtotal).toBe(1998);
    expect(cartService.state.itemCount).toBe(2);
  });
});
```

### Service Component-Focused: Component with Service Props

```typescript
import { mockService } from '@tdi2/di-testing';

describe('CartSummary', () => {
  it('should display cart totals', () => {
    const mockCartService = mockService<CartServiceInterface>({
      state: {
        items: [{ productId: '1', quantity: 2, price: 999 }],
        subtotal: 1998,
        tax: 199.8,
        total: 2197.8
      }
    });

    render(<CartSummary cartService={mockCartService} />);

    expect(screen.getByText('$1,998.00')).toBeInTheDocument();
    expect(screen.getByText('$2,197.80')).toBeInTheDocument();
  });
});
```

### Behavior Component-Focused: Full Integration

```typescript
import { renderWithDI } from '@tdi2/di-testing';

describe('CheckoutFlow', () => {
  it('should complete purchase flow', async () => {
    const { getByText, getByRole } = renderWithDI(<CheckoutFlow />, {
      cartService: {
        state: { items: [{ productId: '1', quantity: 1 }] }
      },
      paymentService: {
        processPayment: jest.fn().mockResolvedValue({ success: true })
      }
    });

    fireEvent.click(getByRole('button', { name: /complete purchase/i }));

    await waitFor(() => {
      expect(getByText('Order completed!')).toBeInTheDocument();
    });
  });
});
```

## Advanced Testing Patterns

### Testing Service Interactions

```typescript
import { createTestContainer } from '@tdi2/di-testing';

describe('Service Interactions', () => {
  it('should update recommendations when cart changes', async () => {
    const container = createTestContainer();
    const cartService = container.get('CartService');
    const recommendationService = container.get('RecommendationService');
    
    const product = { id: '1', name: 'iPhone', price: 999 };
    
    cartService.addItem(product);
    
    // Wait for reactive updates
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(recommendationService.state.recommendations).toBeDefined();
  });
});
```

### Testing Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should handle repository errors gracefully', async () => {
    const container = createTestContainer({
      productRepository: {
        getAll: () => Promise.reject(new Error('Network error'))
      }
    });
    
    const productService = container.get('ProductService');
    
    await productService.loadProducts();
    
    expect(productService.state.error).toBe('Network error');
    expect(productService.state.loading).toBe(false);
  });
});
```

## Best Practices

### ✅ **Use the Right Pattern for the Test**

- **DI-Focused**: Pure service business logic
- **Service Component-Focused**: UI rendering with service props
- **Behavior Component-Focused**: Full integration testing

### ✅ **Keep Tests Simple**

```typescript
// ✅ Good - Simple mock
const mockService = { state: { data: [] }, loadData: jest.fn() };

// ❌ Complex - Overengineered mock
class ComplexMockService extends RealService {
  constructor() { /* complex setup */ }
  // ... lots of mock implementation
}
```

### ✅ **Test Behavior, Not Implementation**

```typescript
// ✅ Good - Test the outcome
expect(cartService.state.total).toBe(1998);

// ❌ Bad - Test implementation details
expect(cartService.calculateTotal).toHaveBeenCalled();
```

### ✅ **Use Descriptive Test Names**

```typescript
// ✅ Good
it('should show error message when product loading fails')

// ❌ Bad  
it('should handle error')
```

## Framework Integration

### React Testing Library

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithDI } from '@tdi2/di-testing';

// Perfect integration with RTL
const user = userEvent.setup();
const { getByRole } = renderWithDI(<MyComponent />);
await user.click(getByRole('button'));
```

### Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  }
});
```

TDI2's testing approach focuses on simplicity: choose the right pattern for your test, use simple mocks, and test behavior rather than implementation details.