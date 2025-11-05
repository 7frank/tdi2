---
title: Component Transformation Guide
description: Transform React components from props hell to pure templates with TDI2 service injection. Learn the essential patterns for clean, testable components.
---

# Component Transformation Guide
## From Props Hell to Pure Templates

Master the art of transforming complex React components into clean, testable templates using TDI2 service injection.

<div class="feature-highlight">
  <h3>🎯 Transformation Goals</h3>
  <ul>
    <li><strong>Zero Data Props</strong> - Components receive only services</li>
    <li><strong>Pure Templates</strong> - Components focus solely on rendering</li>
    <li><strong>Automatic Reactivity</strong> - State updates trigger re-renders</li>
    <li><strong>Easy Testing</strong> - Simple service mocking</li>
  </ul>
</div>

---

## The Transformation Pattern

### Before: Traditional React
```typescript
// ❌ Props hell + complex state management
function ProductList({ 
  products, 
  loading, 
  category,
  onCategoryChange,
  onAddToCart,
  cartItems,
  user,
  /* ...15+ more props */ 
}) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    // Complex filtering logic
    const filtered = products.filter(p => 
      p.category === category && 
      p.name.includes(searchQuery)
    );
    setFilteredProducts(filtered);
  }, [products, category, searchQuery]);
  
  // 50+ lines of state management logic
  
  return <div>{/* Complex JSX */}</div>;
}
```

### After: TDI2 Pure Template
```typescript
// ✅ Clean service injection
function ProductList({ 
  productService,
  cartService 
}: {
  productService: Inject<ProductServiceInterface>;
  cartService: Inject<CartServiceInterface>;
}) {
  const { filteredProducts, searchQuery, loading } = productService.state;
  
  return (
    <div className="product-list">
      <SearchInput 
        value={searchQuery}
        onChange={(query) => productService.setSearchQuery(query)}
      />
      
      {loading ? (
        <ProductListSkeleton />
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id}
              product={product}
              onAddToCart={() => cartService.addProduct(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Essential Transformation Steps

### Step 1: Extract Business Logic
Move all state management and business logic into services:

```typescript
// Extract this logic from components
interface ProductCatalogServiceInterface {
  state: {
    products: Product[];
    filteredProducts: Product[];
    searchQuery: string;
    loading: boolean;
  };
  setSearchQuery(query: string): void;
  setCategory(category: string): void;
  addToCart(product: Product): void;
}

@Service()
export class ProductCatalogService implements ProductCatalogServiceInterface {
  state = {
    products: [] as Product[],
    filteredProducts: [] as Product[],
    searchQuery: '',
    loading: false
  };

  constructor(@Inject() private cartService: CartService) {}

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.filterProducts();
  }

  private filterProducts(): void {
    this.state.filteredProducts = this.state.products.filter(product =>
      product.name.toLowerCase().includes(this.state.searchQuery.toLowerCase())
    );
  }
}
```

### Step 2: Transform Component Interface
Replace props with service injection:

```typescript
// Before: Multiple data props
interface ProductListProps {
  products: Product[];
  loading: boolean;
  onAddToCart: (product: Product) => void;
  // ... many more props
}

// After: Service injection only
interface ProductListProps {
  productService: Inject<ProductCatalogServiceInterface>;
  cartService: Inject<CartServiceInterface>;
}
```

### Step 3: Simplify Component Logic
Remove all useState, useEffect, and business logic:

```typescript
function ProductList({ productService, cartService }: ProductListProps) {
  // No useState or useEffect needed!
  const { filteredProducts, searchQuery, loading } = productService.state;
  
  return (
    <div>
      {/* Pure template - only rendering and event handlers */}
    </div>
  );
}
```

---

## Common Component Patterns

### Pattern 1: Form Components

```typescript
interface UserFormProps {
  userFormService: Inject<UserFormServiceInterface>;
}

function UserForm({ userFormService }: UserFormProps) {
  const { formData, errors, saving } = userFormService.state;

  return (
    <form onSubmit={userFormService.handleSubmit}>
      <input 
        value={formData.name}
        onChange={(e) => userFormService.updateField('name', e.target.value)}
        error={errors.name}
      />
      
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

**Key Features:**
- All form state in service
- Validation handled by service
- Component only renders and handles events

### Pattern 2: Data Tables

```typescript
function UserTable({ userTableService }: {
  userTableService: Inject<UserTableServiceInterface>;
}) {
  const { displayedUsers, sortBy, sortOrder } = userTableService.state;

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => userTableService.setSorting('name')}>
            Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </th>
          <th onClick={() => userTableService.setSorting('email')}>
            Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
          </th>
        </tr>
      </thead>
      <tbody>
        {displayedUsers.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Key Features:**
- Sorting, filtering, pagination in service
- Reactive table updates
- Clean separation of concerns

### Pattern 3: Modal Components

```typescript
function UserModal({ userModalService }: {
  userModalService: Inject<UserModalServiceInterface>;
}) {
  const { isOpen, currentUser, editing } = userModalService.state;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => userModalService.close()}
    >
      {editing ? (
        <UserEditForm 
          user={currentUser}
          onSave={(data) => userModalService.saveUser(data)}
          onCancel={() => userModalService.cancelEditing()}
        />
      ) : (
        <UserDisplay 
          user={currentUser}
          onEdit={() => userModalService.startEditing()}
        />
      )}
    </Modal>
  );
}
```

**Key Features:**
- Modal state managed by service
- Conditional rendering based on service state
- Clean modal lifecycle management

---

## Testing Transformed Components

### Service Testing (Business Logic)
```typescript
describe('ProductCatalogService', () => {
  it('should filter products by search query', () => {
    const service = new ProductCatalogService();
    service.state.products = [
      { id: '1', name: 'iPhone', category: 'phones' },
      { id: '2', name: 'MacBook', category: 'laptops' }
    ];

    service.setSearchQuery('iPhone');

    expect(service.state.filteredProducts).toHaveLength(1);
    expect(service.state.filteredProducts[0].name).toBe('iPhone');
  });
});
```

### Component Testing (Rendering)
```typescript
describe('ProductList', () => {
  it('should render filtered products', () => {
    const mockService = {
      state: { 
        filteredProducts: [{ id: '1', name: 'iPhone' }],
        loading: false 
      },
      setSearchQuery: jest.fn()
    };

    render(<ProductList productService={mockService} />);
    
    expect(screen.getByText('iPhone')).toBeInTheDocument();
  });
});
```

---

## Migration Checklist

### ✅ Component Analysis
- [ ] Identify all `useState` calls
- [ ] List all `useEffect` dependencies  
- [ ] Note business logic mixed in component
- [ ] Count props being passed down

### ✅ Service Extraction  
- [ ] Create service interface
- [ ] Move all state to service
- [ ] Move business logic to service methods
- [ ] Add service dependencies via `@Inject()`

### ✅ Component Transformation
- [ ] Replace props with service injection
- [ ] Remove all `useState` and `useEffect`
- [ ] Update event handlers to call service methods
- [ ] Verify component only contains JSX and handlers

### ✅ Testing
- [ ] Write service unit tests for business logic
- [ ] Write component tests for rendering behavior
- [ ] Mock services for component tests
- [ ] Verify separation of concerns

---

## Best Practices

### ✅ **Single Responsibility**
Each component should have one clear rendering purpose.

### ✅ **Service Interfaces**
Always inject interfaces, never concrete classes.

### ✅ **Event Handling**
Use arrow functions for service method calls in event handlers.

### ✅ **Conditional Rendering**
Base conditions on service state, not props.

### ❌ **Avoid Mixed Concerns**
Don't mix service state with local useState.

---

## Next Steps

### Learn More
- **[Service Patterns](../patterns/service-patterns/)** - Design robust services
- **[Testing Guide](../packages/di-core/testing/)** - Test transformed components
- **[Quick Start Guide](../getting-started/quick-start/)** - Build your first service

### Examples
- **[Complete E-Commerce App](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app)** - Full component transformations
- **[Interactive Demos](https://github.com/7frank/tdi2/tree/main/monorepo/apps/di-test-harness)** - Live transformation examples
- **[Component Gallery](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app/src/components)** - Common patterns

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>Transform components incrementally. Start with the most complex components first - the ones with the most props and state management. The benefits become immediately apparent.</p>
</div>