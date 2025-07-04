# Component Transformation Guide
## From Props Hell to Pure Templates

---

## The Transformation Pattern

### Before: Traditional React Component
```typescript
// ❌ Props hell + complex state management
function UserDashboard({ 
  userId, 
  userRole, 
  permissions, 
  theme, 
  sidebarOpen, 
  currentRoute,
  onUpdateUser, 
  onNavigate, 
  onThemeChange,
  loading,
  error,
  notifications 
}: ComplexProps) {
  const [localState, setLocalState] = useState();
  
  useEffect(() => {
    // Complex coordination logic
  }, [userId, userRole, permissions]);
  
  // 100+ lines of state management
  
  return <div>{/* complex JSX */}</div>;
}
```

### After: RSI Component
```typescript
// ✅ Pure template with service injection
function UserDashboard({ userService, appState }: {
  userService: Inject<UserServiceInterface>;
  appState: Inject<AppStateServiceInterface>;
}) {
  const user = userService.state.currentUser;
  const theme = appState.state.theme;
  
  return (
    <div className={`dashboard theme-${theme}`}>
      <h1>{user?.name}</h1>
      <UserProfile />    {/* No props needed */}
      <UserSettings />   {/* Automatic sync */}
    </div>
  );
}
```

---

## Step-by-Step Transformation

### Step 1: Identify State and Logic

**Look for:**
- `useState` calls
- `useEffect` side effects  
- Business logic in components
- Props being passed down

```typescript
// Before: Mixed concerns
function ProductList({ category, onAddToCart, loading, products }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    // Filtering logic
    const filtered = products.filter(p => 
      p.category === category && 
      p.name.includes(searchQuery)
    );
    setFilteredProducts(filtered);
  }, [products, category, searchQuery]);
  
  const handleAddToCart = (product) => {
    // Business logic
    onAddToCart(product);
  };
  
  return (
    <div>
      <SearchInput value={searchQuery} onChange={setSearchQuery} />
      {filteredProducts.map(p => 
        <ProductCard 
          key={p.id} 
          product={p} 
          onAddToCart={handleAddToCart} 
        />
      )}
    </div>
  );
}
```

### Step 2: Extract Business Logic to Service

```typescript
interface ProductCatalogServiceInterface {
  state: {
    products: Product[];
    filteredProducts: Product[];
    currentCategory: string | null;
    searchQuery: string;
    loading: boolean;
  };
  setCategory(category: string): void;
  setSearchQuery(query: string): void;
  addToCart(product: Product): void;
}

@Service()
class ProductCatalogService implements ProductCatalogServiceInterface {
  state = {
    products: [] as Product[],
    filteredProducts: [] as Product[],
    currentCategory: null as string | null,
    searchQuery: '',
    loading: false
  };

  constructor(
    @Inject() private productRepository: ProductRepository,
    @Inject() private cartService: CartService
  ) {
    this.loadProducts();
  }

  setCategory(category: string): void {
    this.state.currentCategory = category;
    this.filterProducts();
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.filterProducts();
  }

  addToCart(product: Product): void {
    this.cartService.addProduct(product);
  }

  private filterProducts(): void {
    this.state.filteredProducts = this.state.products.filter(p => {
      const matchesCategory = !this.state.currentCategory || 
                             p.category === this.state.currentCategory;
      const matchesSearch = p.name.toLowerCase()
                             .includes(this.state.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  private async loadProducts(): Promise<void> {
    this.state.loading = true;
    try {
      this.state.products = await this.productRepository.getProducts();
      this.filterProducts();
    } finally {
      this.state.loading = false;
    }
  }
}
```

### Step 3: Transform Component to Use Services

```typescript
// After: Pure template
function ProductList({ productCatalog }: {
  productCatalog: Inject<ProductCatalogServiceInterface>;
}) {
  const products = productCatalog.state.filteredProducts;
  const searchQuery = productCatalog.state.searchQuery;
  const loading = productCatalog.state.loading;

  if (loading) return <ProductListSkeleton />;

  return (
    <div className="product-list">
      <SearchInput 
        value={searchQuery} 
        onChange={(query) => productCatalog.setSearchQuery(query)} 
      />
      
      <div className="products-grid">
        {products.map(product => 
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={() => productCatalog.addToCart(product)} 
          />
        )}
      </div>
    </div>
  );
}
```

---

## Common Transformation Patterns

### Pattern 1: Form Components

**Before: Form state + validation**
```typescript
function UserForm({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState(user);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  
  const validate = () => {
    // Validation logic
  };
  
  const handleSubmit = async () => {
    // Submit logic
  };
  
  return <form>/* complex form */</form>;
}
```

**After: Service handles all form logic**
```typescript
function UserForm({ userFormService }: {
  userFormService: Inject<UserFormServiceInterface>;
}) {
  const formData = userFormService.state.formData;
  const errors = userFormService.state.errors;
  const saving = userFormService.state.saving;

  return (
    <form onSubmit={userFormService.handleSubmit}>
      <input 
        value={formData.name}
        onChange={(e) => userFormService.updateField('name', e.target.value)}
      />
      {errors.name && <span className="error">{errors.name}</span>}
      
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### Pattern 2: Data Tables

**Before: Sorting, filtering, pagination in component**
```typescript
function UserTable({ users, onSort, onFilter, onPageChange }) {
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const sortedUsers = useMemo(() => {
    return users.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc' ? 
        aValue.localeCompare(bValue) : 
        bValue.localeCompare(aValue);
    });
  }, [users, sortBy, sortOrder]);
  
  const filteredUsers = useMemo(() => {
    return sortedUsers.filter(user => 
      user.name.toLowerCase().includes(filterText.toLowerCase()) ||
      user.email.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [sortedUsers, filterText]);
  
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);
  
  return (
    <div>
      <input 
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder="Filter users..."
      />
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>Name</th>
            <th onClick={() => handleSort('email')}>Email</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        totalItems={filteredUsers.length}
      />
    </div>
  );
}
```

**After: Service handles all table logic**
```typescript
function UserTable({ userTableService }: {
  userTableService: Inject<UserTableServiceInterface>;
}) {
  const displayedUsers = userTableService.state.displayedUsers;
  const sortBy = userTableService.state.sortBy;
  const sortOrder = userTableService.state.sortOrder;
  const filterText = userTableService.state.filterText;
  const currentPage = userTableService.state.currentPage;
  const totalPages = userTableService.state.totalPages;

  return (
    <div className="user-table">
      <input 
        value={filterText}
        onChange={(e) => userTableService.setFilter(e.target.value)}
        placeholder="Filter users..."
      />
      
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
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages}
        onPageChange={(page) => userTableService.setPage(page)}
      />
    </div>
  );
}
```

### Pattern 3: Modal/Dialog Components

**Before: Modal state management**
```typescript
function UserModal({ isOpen, onClose, userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  
  useEffect(() => {
    if (isOpen && userId) {
      loadUser();
    }
  }, [isOpen, userId]);
  
  const loadUser = async () => {
    setLoading(true);
    try {
      const userData = await fetchUser(userId);
      setUser(userData);
      setFormData(userData);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Complex modal content */}
    </Modal>
  );
}
```

**After: Service manages modal state**
```typescript
function UserModal({ userModalService }: {
  userModalService: Inject<UserModalServiceInterface>;
}) {
  const isOpen = userModalService.state.isOpen;
  const user = userModalService.state.currentUser;
  const loading = userModalService.state.loading;
  const editing = userModalService.state.editing;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => userModalService.close()}
    >
      {loading && <Spinner />}
      {user && !editing && (
        <UserDisplay 
          user={user} 
          onEdit={() => userModalService.startEditing()} 
        />
      )}
      {user && editing && (
        <UserEditForm 
          user={user}
          onSave={(data) => userModalService.saveUser(data)}
          onCancel={() => userModalService.cancelEditing()}
        />
      )}
    </Modal>
  );
}
```

---

## Advanced Transformation Techniques

### Technique 1: Computed Properties in Services

```typescript
@Service()
class ShoppingCartService {
  state = {
    items: [] as CartItem[],
    discountCode: null as string | null,
    discountAmount: 0
  };

  // Computed properties - automatically reactive
  get subtotal(): number {
    return this.state.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
  }

  get tax(): number {
    return (this.subtotal - this.state.discountAmount) * 0.08;
  }

  get total(): number {
    return this.subtotal - this.state.discountAmount + this.tax;
  }

  get itemCount(): number {
    return this.state.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
```

**Component uses computed properties:**
```typescript
function CartSummary({ cartService }: {
  cartService: Inject<ShoppingCartServiceInterface>;
}) {
  return (
    <div className="cart-summary">
      <div>Subtotal: ${cartService.subtotal.toFixed(2)}</div>
      <div>Tax: ${cartService.tax.toFixed(2)}</div>
      <div>Total: ${cartService.total.toFixed(2)}</div>
      <div>Items: {cartService.itemCount}</div>
    </div>
  );
}
```

### Technique 2: Conditional Rendering Based on Service State

```typescript
function Dashboard({ dashboardService, authService }: {
  dashboardService: Inject<DashboardServiceInterface>;
  authService: Inject<AuthServiceInterface>;
}) {
  const user = authService.state.currentUser;
  const widgets = dashboardService.state.widgets;
  const loading = dashboardService.state.loading;
  const hasPermission = authService.hasPermission;

  return (
    <div className="dashboard">
      {loading && <DashboardSkeleton />}
      
      {!loading && (
        <>
          <WelcomeHeader user={user} />
          
          <div className="widgets-grid">
            {widgets.map(widget => {
              // Conditional rendering based on permissions
              if (widget.requiresPermission && !hasPermission(widget.requiresPermission)) {
                return null;
              }
              
              return <Widget key={widget.id} config={widget} />;
            })}
          </div>
          
          {hasPermission('admin') && <AdminPanel />}
        </>
      )}
    </div>
  );
}
```

### Technique 3: Event Handling Through Services

```typescript
function ProductCard({ product, cartService, wishlistService }: {
  product: Product;
  cartService: Inject<CartServiceInterface>;
  wishlistService: Inject<WishlistServiceInterface>;
}) {
  const isInCart = cartService.hasProduct(product.id);
  const isInWishlist = wishlistService.hasProduct(product.id);

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      
      <div className="actions">
        <button
          onClick={() => cartService.addProduct(product)}
          disabled={isInCart}
        >
          {isInCart ? 'In Cart' : 'Add to Cart'}
        </button>
        
        <button
          onClick={() => wishlistService.toggleProduct(product)}
          className={isInWishlist ? 'active' : ''}
        >
          ♥ {isInWishlist ? 'Remove' : 'Add'}
        </button>
      </div>
    </div>
  );
}
```

---

## Testing Transformed Components

### Service Testing (Business Logic)
```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      getUser: jest.fn(),
      updateUser: jest.fn()
    };
    userService = new UserService(mockRepository);
  });

  it('should load user correctly', async () => {
    const mockUser = { id: '1', name: 'John' };
    mockRepository.getUser.mockResolvedValue(mockUser);

    await userService.loadUser('1');

    expect(userService.state.currentUser).toBe(mockUser);
    expect(userService.state.loading).toBe(false);
  });
});
```

### Component Testing (Pure Templates)
```typescript
describe('UserProfile', () => {
  let mockUserService: jest.Mocked<UserServiceInterface>;

  beforeEach(() => {
    mockUserService = {
      state: {
        currentUser: { id: '1', name: 'John', email: 'john@example.com' },
        loading: false
      },
      loadUser: jest.fn(),
      updateUser: jest.fn()
    };
  });

  it('should render user information', () => {
    render(
      <DIProvider>
        <UserProfile userService={mockUserService} />
      </DIProvider>
    );

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUserService.state.loading = true;
    mockUserService.state.currentUser = null;

    render(
      <DIProvider>
        <UserProfile userService={mockUserService} />
      </DIProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

---

## Migration Checklist

### ✅ Before Transformation
- [ ] Identify all state management in component
- [ ] List all props being passed to component  
- [ ] Note all useEffect side effects
- [ ] Document business logic within component

### ✅ During Transformation
- [ ] Create service interface defining all operations
- [ ] Move all state to service
- [ ] Move all business logic to service methods
- [ ] Replace props with service injection
- [ ] Remove useState and useEffect from component

### ✅ After Transformation
- [ ] Component only contains JSX and event handlers
- [ ] All data comes from service state
- [ ] All actions call service methods
- [ ] Component tests focus on rendering
- [ ] Service tests focus on business logic

---

## Common Pitfalls and Solutions

### Pitfall 1: Trying to Keep Some Component State
**Problem**: Mixing service state with local useState
**Solution**: Move ALL state to services, even UI-specific state

### Pitfall 2: Direct Service Method Calls in JSX
**Problem**: `onClick={userService.deleteUser()}`
**Solution**: Use arrow functions: `onClick={() => userService.deleteUser(id)}`

### Pitfall 3: Not Using Service Interfaces
**Problem**: Depending on concrete service classes
**Solution**: Always inject interfaces, implement with concrete classes

### Pitfall 4: Over-Complicated Services
**Problem**: One service trying to handle too many concerns
**Solution**: Split into focused, single-purpose services

---

## Next Steps

- **[Enterprise Implementation](./Enterprise-Implementation.md)** - Scale component patterns to large teams
- **[Migration Strategy](./Migration-Strategy.md)** - Plan your transformation rollout
- **[Service Patterns](./Service-Patterns.md)** - Advanced service architecture patterns