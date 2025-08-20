# TDI2 E-Commerce Example

A complete e-commerce application demonstrating TDI2's service-oriented architecture, reactive state management, and dependency injection patterns.

## Features

- **Zero Prop Drilling**: Components receive services through dependency injection
- **Reactive State**: Valtio-powered services with automatic UI updates
- **Clean Architecture**: Clear separation between services, repositories, and components
- **Real Business Logic**: Product search, cart management, inventory tracking, user authentication
- **Type Safety**: Full TypeScript support with interface-based DI

## Quick Start

```bash
# Clone the example
npx degit 7frank/tdi2/examples/tdi2-ecommerce-example my-ecommerce-app
cd my-ecommerce-app

# Install and run
npm install
npm run dev
```

Open `http://localhost:5173` → **Working e-commerce app with zero prop drilling!**

## Architecture Overview

```
src/
├── services/           # Business logic with reactive state
│   ├── ProductService.ts    # Product catalog & search
│   ├── CartService.ts       # Shopping cart management  
│   ├── UserService.ts       # Authentication & profile
│   └── InventoryService.ts  # Stock management
├── repositories/       # Data access layer
│   ├── ProductRepository.ts
│   └── UserRepository.ts
├── components/         # Pure UI components
│   ├── ProductList.tsx
│   ├── ShoppingCart.tsx
│   └── UserProfile.tsx
├── types/             # TypeScript interfaces
└── data/              # Mock data
```

## Key DI Patterns Demonstrated

### 1. Service-to-Service Injection
```typescript
@Service()
export class CartService {
  constructor(
    @Inject() private inventoryService: InventoryServiceInterface
  ) {}
  
  async addItem(product: Product) {
    // Services can depend on other services
    const isAvailable = await this.inventoryService.isAvailable(product.id, 1);
    if (!isAvailable) {
      throw new InsufficientStockError(product.id, 1);
    }
  }
}
```

### 2. Repository Pattern with DI
```typescript
@Service()
export class ProductService {
  constructor(
    @Inject() private productRepository: ProductRepositoryInterface
  ) {}
  
  async loadProducts() {
    // Service uses repository abstraction
    const products = await this.productRepository.findAll();
    this.state.products = products;
  }
}
```

### 3. Component Service Injection
```typescript
interface ProductListProps {
  services: {
    productService: Inject<ProductServiceInterface>;
    cartService: Inject<CartServiceInterface>;
  };
}

export function ProductList({ services }: ProductListProps) {
  // No useState, no useEffect - everything from services!
  const { products, loading } = services.productService.state;
  
  return (
    <div>
      {products.map(product => (
        <ProductCard 
          key={product.id}
          product={product}
          onAddToCart={() => services.cartService.addItem(product)}
        />
      ))}
    </div>
  );
}
```

## Debug DI System

While running, visit these URLs:
- `http://localhost:5173/_di_debug` - Complete DI container info
- `http://localhost:5173/_di_interfaces` - Interface mappings
- `http://localhost:5173/_di_configs` - Generated configurations

## Testing

The example includes focused DI tests demonstrating:

```bash
npm test
```

**Service Unit Tests** - Test business logic in isolation:
```typescript
// Test pure service logic without React
const cartService = new CartService(mockInventoryService);
await cartService.addItem(mockProduct);
expect(cartService.state.items).toHaveLength(1);
```

**Component Behavior Tests** - Test component behavior with mocked services:
```typescript
// Test how components interact with services
const mockCartService = { addItem: vi.fn() };
render(<ProductCard product={product} cartService={mockCartService} />);
fireEvent.click(screen.getByText('Add to Cart'));
expect(mockCartService.addItem).toHaveBeenCalledWith(product);
```

**Integration Tests** - Test service interactions:
```typescript
// Test how services work together
const cartService = container.resolve<CartServiceInterface>('CartServiceInterface');
const inventoryService = container.resolve<InventoryServiceInterface>('InventoryServiceInterface');
// Test real service interactions
```

## Demo Login

- **Email**: `demo@example.com`
- **Password**: `password` (or any password)

## Available Discount Codes

- `SAVE10` - 10% off orders over $50
- `WELCOME20` - $20 off orders over $30

## What This Demonstrates

| Traditional React | TDI2 E-Commerce Example |
|------------------|--------------------------|
| **Props**: Cart state passed through 5+ components | **Props**: CartService injected directly where needed |
| **State Sync**: Manual prop drilling and lifting | **State Sync**: Change cart → all components update automatically |
| **Testing**: Mock dozens of props and context | **Testing**: Mock clean service interfaces |
| **Business Logic**: Scattered across components | **Business Logic**: Centralized in testable services |
| **Maintenance**: Change breaks multiple files | **Maintenance**: Change service, components follow |

## Real Impact

This e-commerce app demonstrates how TDI2 transforms React development:

1. **Zero Prop Drilling** - Product data flows directly to components that need it
2. **Automatic State Sync** - Add item to cart → header badge updates instantly
3. **Service Boundaries** - Clear separation between cart logic, inventory logic, user logic
4. **Easy Testing** - Test business logic separate from UI rendering
5. **Clean Components** - Components focus purely on presentation

## Next Steps

- **Extend the app** - Add checkout process, order history, product reviews
- **Explore the code** - See how services communicate with each other
- **Run the tests** - Understand DI-focused testing patterns
- **Read the docs** - [TDI2 Documentation](https://7frank.github.io/tdi2/) for advanced patterns

---

**The Result**: React that scales. E-commerce complexity managed through clean service architecture instead of prop drilling chaos.