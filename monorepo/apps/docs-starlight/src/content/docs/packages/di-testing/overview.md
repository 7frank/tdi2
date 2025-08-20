---
title: '@tdi2/di-testing Overview'
description: Complete testing framework for TDI2 with @DiTest, @MockBean equivalents, and advanced testing utilities. Production-ready testing infrastructure.
---

# @tdi2/di-testing Overview
## Complete Testing Framework for TDI2

Production-ready testing framework that provides Spring Boot-style testing decorators, advanced mocking utilities, and seamless integration with popular testing frameworks.

<div class="feature-highlight">
  <h3>🧪 Testing Features</h3>
  <ul>
    <li><strong>@DiTest Equivalent</strong> - Spring Boot-style test configuration</li>
    <li><strong>@MockBean Implementation</strong> - Advanced service mocking</li>
    <li><strong>Test Containers</strong> - Isolated DI containers for testing</li>
    <li><strong>Mock Utilities</strong> - Comprehensive mocking and stubbing</li>
    <li><strong>Integration Testing</strong> - Full component and service testing</li>
  </ul>
</div>

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

## Spring Boot-Style Testing

### @DiTest Class Decorator

```typescript
import { DiTest, MockBean, TestInject } from '@tdi2/di-testing';

@DiTest({
  profiles: ['test'],
  mockServices: ['EmailService', 'PaymentService']
})
class ProductServiceTest {
  @TestInject()
  private productService: ProductServiceInterface;
  
  @MockBean()
  private emailService: EmailServiceInterface;
  
  @MockBean()
  private paymentService: PaymentServiceInterface;
  
  @Test()
  async shouldProcessOrderSuccessfully() {
    // Arrange
    const order = { id: '123', total: 100 };
    this.paymentService.processPayment.mockResolvedValue({ success: true });
    
    // Act
    const result = await this.productService.processOrder(order);
    
    // Assert
    expect(result.success).toBe(true);
    expect(this.emailService.sendConfirmation).toHaveBeenCalled();
  }
}
```

### @MockBean Advanced Features

```typescript
@DiTest()
class AdvancedMockingTest {
  @MockBean({ 
    scope: 'singleton',
    reset: true,
    spy: true // Create spy instead of mock
  })
  private userService: UserServiceInterface;
  
  @MockBean({ 
    autoMock: false // Manual mock setup
  })
  private paymentService: PaymentServiceInterface;
  
  beforeEach() {
    // MockBean automatically resets if reset: true
    this.setupPaymentServiceMock();
  }
  
  private setupPaymentServiceMock() {
    this.paymentService.processPayment = jest.fn().mockImplementation(
      async (amount) => ({ success: amount > 0 })
    );
  }
}
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

```bash
# Core testing framework
npm install @tdi2/di-testing

# Or with bun
bun add @tdi2/di-testing

# Testing utilities also included with di-core
npm install @tdi2/di-core
```

### Basic Test Setup

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { configureTDI2Testing, DiTest, MockBean } from '@tdi2/di-testing';

// Configure global test settings
configureTDI2Testing({
  // Global test configuration
  defaultMocks: {
    // Services that should always be mocked
    analyticsService: { track: jest.fn() },
    loggerService: { log: jest.fn(), error: jest.fn() }
  },
  
  // Automatic cleanup
  autoCleanup: true,
  
  // Profile for testing
  activeProfiles: ['test'],
  
  // Mock configuration
  mockDefaults: {
    autoMock: true,
    resetBetweenTests: true
  }
});
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': '@tdi2/jest-transformer',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  }
};
```

## Advanced Testing Patterns

### Profile-Specific Testing

```typescript
import { DiTest, withProfiles } from '@tdi2/di-testing';

@DiTest({ profiles: ['test', 'integration'] })
class IntegrationTest {
  @Test()
  async shouldUseTestDatabase() {
    // This test runs with test profile
    // Automatically uses test-specific services
  }
}

// Test different profile configurations
describe('Profile Testing', () => {
  it('should use development services', 
    withProfiles(['development'], async () => {
      const container = createTestContainer();
      const emailService = container.get('EmailService');
      expect(emailService.constructor.name).toBe('MockEmailService');
    })
  );
  
  it('should use production services',
    withProfiles(['production'], async () => {
      const container = createTestContainer();
      const emailService = container.get('EmailService');
      expect(emailService.constructor.name).toBe('SmtpEmailService');
    })
  );
});
```

### Configuration Testing

```typescript
import { DiTest, TestConfiguration, Bean } from '@tdi2/di-testing';

@TestConfiguration()
class TestDatabaseConfig {
  @Bean()
  createTestDatabase(): DatabaseConnection {
    return new InMemoryDatabase();
  }
  
  @Bean()
  createTestEmailService(): EmailServiceInterface {
    return new MockEmailService();
  }
}

@DiTest({ configuration: [TestDatabaseConfig] })
class ConfigurationTest {
  @TestInject()
  private database: DatabaseConnection;
  
  @Test()
  async shouldUseTestConfiguration() {
    expect(this.database).toBeInstanceOf(InMemoryDatabase);
  }
}
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
import { renderWithDI, DiTest, MockBean } from '@tdi2/di-testing';

@DiTest()
class ComponentIntegrationTest {
  @MockBean()
  private productService: ProductServiceInterface;
  
  @Test()
  async shouldRenderProductList() {
    // Setup mock data
    this.productService.state = {
      products: [{ id: '1', name: 'iPhone' }],
      loading: false
    };
    
    // Render with DI
    const user = userEvent.setup();
    const { getByRole } = renderWithDI(<ProductList />);
    
    // Test interactions
    await user.click(getByRole('button', { name: /load products/i }));
    expect(this.productService.loadProducts).toHaveBeenCalled();
  }
}
```

### Vitest Integration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { diTestingPlugin } from '@tdi2/di-testing/vite';

export default defineConfig({
  plugins: [diTestingPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
  }
});

// Use decorators in Vitest
import { DiTest, MockBean } from '@tdi2/di-testing';

@DiTest()
class VitestExample {
  @MockBean()
  private service: MyServiceInterface;
  
  @Test()
  async shouldWork() {
    expect(this.service).toBeDefined();
  }
}
```

## Package Structure

```
@tdi2/di-testing/
├── decorators/          # @DiTest, @MockBean, @TestInject
├── containers/          # Test container implementations
├── mocking/            # Advanced mocking utilities
├── configuration/      # Test configuration classes
├── profiles/           # Profile management for tests
├── utilities/          # Helper functions and test utilities
├── integrations/       # Framework integrations (Jest, Vitest, RTL)
└── types/              # TypeScript type definitions
```

## Next Steps

### Essential Reading
- **[Testing Patterns Guide](../../patterns/testing-patterns/)** - Advanced testing strategies
- **[Service Testing](../../guides/testing/service-testing/)** - Service-specific testing approaches

### Integration
- **[Vite Plugin Testing](../vite-plugin-di/testing/)** - Build-time test optimization
- **[Component Testing](../../guides/testing/component-testing/)** - Component testing strategies

### Examples
- **[Complete Test Suite](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/__tests__)** - Real testing examples
- **[Testing Patterns](https://github.com/7frank/tdi2/tree/main/monorepo/packages/di-testing/__tests__)** - Framework test examples

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>@tdi2/di-testing provides enterprise-grade testing infrastructure with Spring Boot familiarity. Start with @DiTest and @MockBean for immediate productivity gains.</p>
</div>

---

TDI2's testing approach focuses on simplicity: choose the right pattern for your test, use simple mocks, and test behavior rather than implementation details.