---
title: Migration Strategy
description: Systematic approach for transitioning existing React applications to TDI2. Minimize disruption while maximizing architectural benefits.
---

# Migration Strategy
## From Props Hell to Service-Oriented Architecture

Transform existing React applications to TDI2 with a proven, risk-minimized approach that maintains development velocity throughout the transition.

<div class="feature-highlight">
  <h3>🎯 Migration Benefits</h3>
  <ul>
    <li><strong>90% Reduction</strong> - Components with complex prop chains</li>
    <li><strong>50% Faster</strong> - Test setup and maintenance</li>
    <li><strong>25% Improvement</strong> - Development velocity after transition</li>
    <li><strong>Zero Downtime</strong> - Incremental migration approach</li>
  </ul>
</div>

---

## Pre-Migration Assessment

### Application Analysis Checklist

#### ✅ Props Hell Indicators
- [ ] Components with 10+ props
- [ ] Props passed through 3+ component levels
- [ ] Frequent prop threading changes during development
- [ ] Complex prop validation and default value management

#### ✅ State Management Complexity
- [ ] Multiple state management solutions (Redux + Context + useState)
- [ ] Manual state synchronization between components
- [ ] Complex useEffect dependency arrays
- [ ] Difficult state debugging needs

#### ✅ Testing Pain Points
- [ ] Component tests requiring complex mock setups
- [ ] Difficulty isolating business logic for testing
- [ ] High test maintenance overhead when props change
- [ ] Inconsistent testing patterns across teams

### Migration Readiness Score

| Criteria | Score (1-5) | Weight | 
|----------|-------------|---------|
| Props complexity | ___ | 25% |
| State management pain | ___ | 25% |
| Testing difficulty | ___ | 20% |
| Team scalability issues | ___ | 20% |
| Technical debt level | ___ | 10% |

**Migration Recommendation:**
- **4.0-5.0**: High priority - Immediate TDI2 adoption recommended
- **3.0-3.9**: Medium priority - Plan migration within 6 months
- **2.0-2.9**: Low priority - Monitor and reassess in 1 year
- **< 2.0**: Focus on other architectural improvements first

---

## 3-Phase Migration Strategy

### Phase 1: Foundation (Weeks 1-3)
**Goal**: Establish TDI2 infrastructure without disrupting development

#### Technical Setup

```bash
# Install TDI2 dependencies
npm install @tdi2/di-core @tdi2/vite-plugin-di valtio
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      enableInterfaceResolution: true,
      enableFunctionalDI: true,
      generateDebugFiles: process.env.NODE_ENV === 'development'
    }),
    react(),
  ],
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": false,
    "target": "ES2020"
  }
}
```

#### Project Structure Evolution

```
src/
├── services/             # NEW: Service layer
│   ├── interfaces/       # Service contracts
│   └── implementations/  # Service implementations
├── repositories/         # NEW: Data access layer
│   ├── interfaces/       # Repository contracts
│   └── implementations/  # API/Mock implementations
├── components/          # EXISTING: Gradually migrate
├── hooks/              # EXISTING: Gradually deprecate
├── store/              # EXISTING: Gradually replace
└── types/              # EXISTING: Expand with service types
```

#### Team Training (Week 3)
- **Architecture workshop** (4 hours) - Service-oriented principles
- **Hands-on coding** (4 hours) - Create first e-commerce service
- **Best practices** - Coding standards and testing requirements

### Phase 2: Pilot Implementation (Weeks 4-8)
**Goal**: Validate TDI2 with one complete high-value feature

#### Pilot Feature: E-Commerce Product Catalog

**Selection Criteria:**
- ✅ Self-contained with clear boundaries
- ✅ Currently experiencing props hell (8+ props)
- ✅ High business value for stakeholders
- ✅ Good existing test coverage

#### Migration Example

**Before: Traditional React**
```typescript
function ProductCatalog({ 
  products, categories, loading, error, user, cart,
  searchQuery, filters, sortBy, pagination, theme,
  onSearch, onFilter, onSort, onAddToCart,
  // ...12 more props
}: ProductCatalogProps) {
  // 150+ lines of state coordination
  // Complex useEffect chains
  // Manual prop drilling
}
```

**After: TDI2 Service-Oriented**
```typescript
function ProductCatalog({ 
  productService,
  cartService,
  userService
}: {
  productService: Inject<ProductServiceInterface>;
  cartService: Inject<CartServiceInterface>;
  userService: Inject<UserServiceInterface>;
}) {
  const { products, loading, searchQuery } = productService.state;
  const { user } = userService.state;
  
  return (
    <div className="product-catalog">
      <SearchBar 
        query={searchQuery}
        onSearch={(query) => productService.search(query)}
      />
      <ProductGrid 
        products={products}
        loading={loading}
        onAddToCart={(product) => cartService.addItem(product)}
      />
    </div>
  );
}
```

#### Service Implementation

```typescript
// Service interface
interface ProductServiceInterface {
  state: {
    products: Product[];
    categories: Category[];
    loading: boolean;
    searchQuery: string;
    selectedCategory: string | null;
  };
  loadProducts(): Promise<void>;
  search(query: string): void;
  filterByCategory(category: string): void;
}

// Service implementation
@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    products: [] as Product[],
    categories: [] as Category[],
    loading: false,
    searchQuery: '',
    selectedCategory: null as string | null
  };

  constructor(
    @Inject() private productRepository: ProductRepository,
    @Inject() private notificationService: NotificationService
  ) {}

  async loadProducts(): Promise<void> {
    this.state.loading = true;
    try {
      this.state.products = await this.productRepository.getProducts();
      this.state.categories = await this.productRepository.getCategories();
    } catch (error) {
      this.notificationService.showError('Failed to load products');
    } finally {
      this.state.loading = false;
    }
  }

  search(query: string): void {
    this.state.searchQuery = query;
    // Reactive filtering happens automatically
  }
}
```

### Phase 3: Incremental Expansion (Weeks 9-16)
**Goal**: Systematically migrate remaining application

#### Feature Prioritization Matrix

| Feature | Props Complexity | Business Value | Migration Effort | Priority |
|---------|------------------|----------------|------------------|----------|
| Shopping Cart | High (10+ props) | High | Medium | 🔥🔥🔥🔥🔥 |
| User Dashboard | High (8+ props) | High | Medium | 🔥🔥🔥🔥 |
| Product Search | Medium (6 props) | Medium | Low | 🔥🔥🔥 |
| User Settings | Medium (5 props) | Medium | Low | 🔥🔥 |
| Admin Panel | High (12+ props) | Low | High | 🔥 |

#### Migration Waves

**Wave 1 (Weeks 9-12): High-Impact Features**
- Shopping cart and checkout flow
- User dashboard and profile
- Product search and filtering

**Wave 2 (Weeks 13-16): Remaining Features**
- User settings and preferences
- Admin features
- Secondary workflows

---

## Common Migration Patterns

### Pattern 1: Redux to TDI2 Services

**Before: Redux Store**
```typescript
// Redux slice
const userSlice = createSlice({
  name: 'user',
  initialState: { currentUser: null, loading: false },
  reducers: {
    loadUserStart: (state) => { state.loading = true; },
    loadUserSuccess: (state, action) => { 
      state.currentUser = action.payload;
      state.loading = false;
    },
    loadUserError: (state) => { state.loading = false; }
  }
});

// Component with useSelector
function UserProfile() {
  const user = useSelector(state => state.user.currentUser);
  const loading = useSelector(state => state.user.loading);
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(loadUser());
  }, []);
}
```

**After: TDI2 Service**
```typescript
// Service with reactive state
@Service()
export class UserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false
  };

  async loadUser(): Promise<void> {
    this.state.loading = true;
    try {
      this.state.currentUser = await this.userRepository.getCurrentUser();
    } finally {
      this.state.loading = false;
    }
  }
}

// Component with service injection
function UserProfile({ userService }: {
  userService: Inject<UserServiceInterface>;
}) {
  const { currentUser, loading } = userService.state;
  
  useEffect(() => {
    userService.loadUser();
  }, []);
}
```

### Pattern 2: Context to TDI2 Services

**Before: Context Provider**
```typescript
const ThemeContext = createContext();
const CartContext = createContext();
const UserContext = createContext();

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <UserProvider>
          <ProductCatalog />
        </UserProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
```

**After: DI Provider**
```typescript
function App() {
  return (
    <DIProvider container={container}>
      <ProductCatalog />  {/* Services auto-injected */}
    </DIProvider>
  );
}
```

### Pattern 3: Custom Hooks to Services

**Before: Custom Hook**
```typescript
function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { products, loading, loadProducts };
}
```

**After: Service**
```typescript
@Service()
export class ProductService {
  state = {
    products: [] as Product[],
    loading: false
  };

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

---

## Testing Migration

### Service Testing Strategy

```typescript
describe('ProductService', () => {
  let productService: ProductService;
  let mockRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepository = {
      getProducts: jest.fn(),
      getCategories: jest.fn()
    };
    productService = new ProductService(mockRepository, new MockNotificationService());
  });

  it('should load products successfully', async () => {
    const mockProducts = [
      { id: '1', name: 'iPhone', price: 999 },
      { id: '2', name: 'MacBook', price: 1999 }
    ];
    mockRepository.getProducts.mockResolvedValue(mockProducts);

    await productService.loadProducts();

    expect(productService.state.products).toEqual(mockProducts);
    expect(productService.state.loading).toBe(false);
  });
});
```

### Component Testing Strategy

```typescript
describe('ProductCatalog', () => {
  it('should render products from service', () => {
    const mockProductService = {
      state: { 
        products: [{ id: '1', name: 'iPhone', price: 999 }],
        loading: false
      },
      search: jest.fn()
    };

    render(<ProductCatalog productService={mockProductService} />);
    
    expect(screen.getByText('iPhone')).toBeInTheDocument();
  });
});
```

---

## Risk Mitigation

### Technical Risks
- **Learning Curve** → Provide comprehensive training and pair programming
- **Performance Issues** → Monitor metrics and maintain rollback plan
- **Integration Problems** → Use adapter pattern for gradual transition

### Business Risks
- **Development Velocity** → Migrate high-value features first to show immediate benefit
- **Team Resistance** → Start with teams experiencing most pain from current approach
- **Coordination Overhead** → Clear migration timeline and regular checkpoints

---

## Success Metrics

### Technical Metrics
- [ ] 90% reduction in components with 5+ props
- [ ] 50% reduction in test setup complexity
- [ ] 30% improvement in bundle size
- [ ] Zero performance regressions

### Team Metrics
- [ ] 25% faster feature development velocity
- [ ] 60% reduction in merge conflicts
- [ ] 40% faster new developer onboarding
- [ ] 95% developer satisfaction with new architecture

---

## Next Steps

### Essential Reading
- **[Enterprise Implementation](../enterprise/implementation/)** - Large team adoption strategies
- **[Architectural Patterns](../architecture/controller-service-pattern/)** - Controller vs Service patterns
- **[Framework Comparisons](../../comparison/redux-vs-tdi2/)** - Detailed migration guides

### Migration Tools
- **[Migration Scripts](https://github.com/7frank/tdi2/tree/main/tools/migration)** - Automated transformation tools
- **[Codemod Collection](https://github.com/7frank/tdi2/tree/main/codemods)** - AST transformation utilities
- **[Examples Repository](https://github.com/7frank/tdi2/tree/main/examples/migration)** - Before/after migration examples

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>Start with your most painful feature, prove value quickly, then systematically expand. The incremental approach minimizes risk while maximizing team buy-in.</p>
</div>