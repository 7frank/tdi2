---
title: Controller vs Service Pattern
description: Master the architectural distinction between UI Controllers (with lifecycle hooks) and Business Services (pure logic) in TDI2 applications.
---

# Controller vs Service Pattern
## Clear Architectural Boundaries for Enterprise Applications

Learn the crucial distinction between Controllers (UI lifecycle management) and Services (business logic) that enables scalable, maintainable enterprise React applications.

<div class="feature-highlight">
  <h3>🎯 Key Architectural Concepts</h3>
  <ul>
    <li><strong>Controllers</strong> - Handle UI lifecycle, coordination, and component-specific state</li>
    <li><strong>Services</strong> - Pure business logic, data management, and cross-component operations</li>
    <li><strong>Clear Separation</strong> - Prevents mixing UI concerns with business logic</li>
    <li><strong>Enterprise Scale</strong> - Enables large teams to work independently</li>
  </ul>
</div>

---

## Architectural Overview

### The Two-Layer Pattern

```
┌─────────────────────────────────────────────────┐
│                  Components                     │
│               (Pure Templates)                  │
└─────────────────┬───────────────────────────────┘
                  │ Service Injection
┌─────────────────▼───────────────────────────────┐
│                Controllers                      │
│        (UI Lifecycle + Coordination)           │
│     OnMount, OnUnmount, Component State        │
└─────────────────┬───────────────────────────────┘
                  │ Service Dependencies
┌─────────────────▼───────────────────────────────┐
│                 Services                        │
│          (Pure Business Logic)                  │
│     Data Management, Business Rules, APIs      │
└─────────────────────────────────────────────────┘
```

### When to Use Each Pattern

#### Use Controllers For:
- 🎯 **UI Lifecycle Management** - Setup/cleanup when components mount/unmount
- 🎯 **Component Coordination** - Orchestrating multiple services for a single UI flow
- 🎯 **View-Specific State** - UI state that doesn't belong in business services
- 🎯 **Event Handling** - Complex user interaction flows

#### Use Services For:
- 🎯 **Business Logic** - Domain rules, calculations, workflows
- 🎯 **Data Management** - API calls, caching, state persistence
- 🎯 **Cross-Component Operations** - Shared functionality used by multiple UIs
- 🎯 **Pure Functions** - Stateless operations and transformations

---

## Implementation Examples

### E-Commerce Product Page Controller

```typescript
// ProductPageController - Handles UI lifecycle and coordination
interface ProductPageControllerInterface {
  state: {
    isLoading: boolean;
    currentTab: 'details' | 'reviews' | 'specs';
    showImageZoom: boolean;
    selectedVariant: ProductVariant | null;
  };
}

@Service()
export class ProductPageController implements ProductPageControllerInterface, OnMount, OnUnmount {
  state = {
    isLoading: true,
    currentTab: 'details' as const,
    showImageZoom: false,
    selectedVariant: null as ProductVariant | null
  };

  private refreshInterval?: NodeJS.Timeout;

  constructor(
    @Inject() private productService: ProductServiceInterface,
    @Inject() private analyticsService: AnalyticsServiceInterface,
    @Inject() private cartService: CartServiceInterface
  ) {}

  // UI Lifecycle Hooks
  onMount(): void {
    this.loadPageData();
    this.setupAnalyticsTracking();
    this.setupAutoRefresh();
  }

  onUnmount(): void {
    this.cleanup();
  }

  // UI Coordination Methods
  async loadPageData(): Promise<void> {
    this.state.isLoading = true;
    
    try {
      await this.productService.loadProduct(this.getProductId());
      await this.productService.loadReviews(this.getProductId());
      this.state.selectedVariant = this.productService.state.product?.variants[0] || null;
    } finally {
      this.state.isLoading = false;
    }
  }

  setActiveTab(tab: 'details' | 'reviews' | 'specs'): void {
    this.state.currentTab = tab;
    this.analyticsService.trackEvent('product_tab_viewed', { tab });
  }

  toggleImageZoom(): void {
    this.state.showImageZoom = !this.state.showImageZoom;
  }

  selectVariant(variant: ProductVariant): void {
    this.state.selectedVariant = variant;
    this.analyticsService.trackEvent('product_variant_selected', { 
      variantId: variant.id 
    });
  }

  addToCart(): void {
    if (this.state.selectedVariant) {
      this.cartService.addItem(this.state.selectedVariant, 1);
      this.analyticsService.trackEvent('add_to_cart', {
        productId: this.productService.state.product?.id,
        variantId: this.state.selectedVariant.id
      });
    }
  }

  // Private helper methods
  private getProductId(): string {
    return window.location.pathname.split('/').pop() || '';
  }

  private setupAnalyticsTracking(): void {
    this.analyticsService.trackPageView('product_page', {
      productId: this.getProductId()
    });
  }

  private setupAutoRefresh(): void {
    // Refresh product data every 5 minutes for inventory updates
    this.refreshInterval = setInterval(() => {
      this.productService.loadProduct(this.getProductId());
    }, 300000);
  }

  private cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
```

### E-Commerce Product Service (Pure Business Logic)

```typescript
// ProductService - Pure business logic, no lifecycle
interface ProductServiceInterface {
  state: {
    product: Product | null;
    reviews: Review[];
    relatedProducts: Product[];
    loading: boolean;
    error: string | null;
  };
  loadProduct(id: string): Promise<void>;
  loadReviews(productId: string): Promise<void>;
  loadRelatedProducts(productId: string): Promise<void>;
  calculateDiscountPrice(product: Product): number;
  isInStock(variant: ProductVariant): boolean;
}

@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    product: null as Product | null,
    reviews: [] as Review[],
    relatedProducts: [] as Product[],
    loading: false,
    error: null as string | null
  };

  constructor(
    @Inject() private productRepository: ProductRepositoryInterface,
    @Inject() private reviewRepository: ReviewRepositoryInterface,
    @Inject() private notificationService: NotificationServiceInterface
  ) {}

  // Pure business logic - no lifecycle concerns
  async loadProduct(id: string): Promise<void> {
    this.state.loading = true;
    this.state.error = null;

    try {
      this.state.product = await this.productRepository.getProduct(id);
      
      // Business rule: Auto-load related products
      if (this.state.product) {
        this.loadRelatedProducts(id);
      }
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to load product');
    } finally {
      this.state.loading = false;
    }
  }

  async loadReviews(productId: string): Promise<void> {
    try {
      this.state.reviews = await this.reviewRepository.getReviews(productId);
    } catch (error) {
      console.warn('Failed to load reviews:', error);
      // Don't show error for reviews - it's not critical
    }
  }

  async loadRelatedProducts(productId: string): Promise<void> {
    try {
      this.state.relatedProducts = await this.productRepository.getRelatedProducts(productId);
    } catch (error) {
      console.warn('Failed to load related products:', error);
    }
  }

  // Business logic calculations
  calculateDiscountPrice(product: Product): number {
    if (!product.discount) return product.price;
    
    return product.price * (1 - product.discount.percentage / 100);
  }

  isInStock(variant: ProductVariant): boolean {
    return variant.inventory > 0 && variant.status === 'active';
  }

  getAverageRating(): number {
    if (this.state.reviews.length === 0) return 0;
    
    const totalRating = this.state.reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / this.state.reviews.length;
  }

  // Business rule validation
  canPurchase(variant: ProductVariant, quantity: number): boolean {
    return this.isInStock(variant) && variant.inventory >= quantity;
  }
}
```

### Component Usage

```typescript
// Component uses both Controller and Service
function ProductPage({ 
  controller,
  productService 
}: {
  controller: Inject<ProductPageControllerInterface>;
  productService: Inject<ProductServiceInterface>;
}) {
  const { isLoading, currentTab, selectedVariant } = controller.state;
  const { product, reviews } = productService.state;

  if (isLoading) return <ProductPageSkeleton />;
  if (!product) return <ProductNotFound />;

  return (
    <div className="product-page">
      <ProductImages 
        product={product}
        selectedVariant={selectedVariant}
        onZoomToggle={() => controller.toggleImageZoom()}
      />
      
      <ProductInfo
        product={product}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => controller.selectVariant(variant)}
        onAddToCart={() => controller.addToCart()}
        canPurchase={productService.canPurchase(selectedVariant, 1)}
      />
      
      <ProductTabs
        activeTab={currentTab}
        onTabChange={(tab) => controller.setActiveTab(tab)}
        product={product}
        reviews={reviews}
      />
    </div>
  );
}
```

---

## Architectural Benefits

### Clear Separation of Concerns

#### Controllers Handle:
- **Component Lifecycle** - Mount/unmount setup and cleanup
- **UI State Management** - Tabs, modals, form states  
- **Event Coordination** - Orchestrating multiple services
- **View Logic** - UI-specific business rules

#### Services Handle:
- **Domain Logic** - Business rules and calculations
- **Data Management** - API calls and state persistence
- **Cross-Component Operations** - Shared functionality
- **Pure Computations** - Stateless transformations

### Testing Strategy

#### Controller Testing
```typescript
describe('ProductPageController', () => {
  let controller: ProductPageController;
  let mockProductService: jest.Mocked<ProductServiceInterface>;
  let mockAnalyticsService: jest.Mocked<AnalyticsServiceInterface>;

  beforeEach(() => {
    mockProductService = createMockProductService();
    mockAnalyticsService = createMockAnalyticsService();
    controller = new ProductPageController(mockProductService, mockAnalyticsService);
  });

  it('should load page data on mount', async () => {
    await controller.onMount();
    
    expect(mockProductService.loadProduct).toHaveBeenCalled();
    expect(mockAnalyticsService.trackPageView).toHaveBeenCalledWith('product_page');
  });

  it('should track tab changes', () => {
    controller.setActiveTab('reviews');
    
    expect(controller.state.currentTab).toBe('reviews');
    expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('product_tab_viewed', { tab: 'reviews' });
  });
});
```

#### Service Testing
```typescript
describe('ProductService', () => {
  let productService: ProductService;
  let mockRepository: jest.Mocked<ProductRepositoryInterface>;

  beforeEach(() => {
    mockRepository = createMockProductRepository();
    productService = new ProductService(mockRepository);
  });

  it('should calculate discount price correctly', () => {
    const product = { 
      price: 100, 
      discount: { percentage: 20 } 
    };
    
    const discountPrice = productService.calculateDiscountPrice(product);
    
    expect(discountPrice).toBe(80);
  });

  it('should validate purchase availability', () => {
    const variant = { inventory: 5, status: 'active' };
    
    expect(productService.canPurchase(variant, 3)).toBe(true);
    expect(productService.canPurchase(variant, 10)).toBe(false);
  });
});
```

---

## Enterprise Team Organization

### Team Ownership Patterns

#### Frontend Teams Own Controllers
```typescript
// Team A: Product Page Team
@Service()
export class ProductPageController implements OnMount, OnUnmount {
  // UI-specific logic for product page
}

@Service() 
export class ProductListController implements OnMount, OnUnmount {
  // UI-specific logic for product listing
}
```

#### Domain Teams Own Services
```typescript
// Team B: Product Domain Team
@Service()
export class ProductService {
  // Business logic for all product operations
}

@Service()
export class CategoryService {
  // Business logic for product categorization
}
```

#### Infrastructure Team Owns Shared Services
```typescript
// Team C: Infrastructure Team
@Service()
export class AnalyticsService {
  // Shared analytics across all teams
}

@Service()
export class NotificationService {
  // Shared notifications across all teams
}
```

### Cross-Team Communication

```typescript
// Controllers coordinate between domain services
@Service()
export class CheckoutController implements OnMount, OnUnmount {
  constructor(
    @Inject() private cartService: CartServiceInterface,        // Team A
    @Inject() private userService: UserServiceInterface,       // Team B  
    @Inject() private paymentService: PaymentServiceInterface, // Team C
    @Inject() private orderService: OrderServiceInterface      // Team D
  ) {}

  async processCheckout(): Promise<void> {
    // Coordinate between multiple domain services
    const user = this.userService.getCurrentUser();
    const cart = this.cartService.getItems();
    const payment = await this.paymentService.processPayment();
    const order = await this.orderService.createOrder(user, cart, payment);
  }
}
```

---

## Best Practices

### ✅ Controller Guidelines
- **Always implement lifecycle hooks** when you need setup/cleanup
- **Keep UI state local** to the controller
- **Coordinate services** but don't duplicate business logic
- **Handle UI events** and delegate to appropriate services

### ✅ Service Guidelines  
- **Never implement lifecycle hooks** - services should be stateless regarding UI
- **Focus on domain logic** and data management
- **Be reusable** across multiple UI contexts
- **Provide clear interfaces** for easy testing and mocking

### ❌ Common Anti-Patterns
- **Business logic in controllers** - Keep controllers focused on UI concerns
- **UI state in services** - Services shouldn't know about component lifecycle
- **Direct DOM manipulation** - Controllers coordinate, don't manipulate
- **Tight coupling** - Use interfaces for loose coupling between layers

---

## Migration Strategy

### From Mixed Concerns
```typescript
// Before: Mixed UI and business logic
function ProductPage() {
  const [product, setProduct] = useState();
  const [selectedVariant, setSelectedVariant] = useState();
  const [currentTab, setCurrentTab] = useState('details');
  
  useEffect(() => {
    // Mixed: UI lifecycle + business logic
    loadProduct();
    trackPageView();
    setupRefresh();
  }, []);
  
  const loadProduct = async () => {
    // Business logic mixed with UI concerns
  };
}

// After: Clear separation
function ProductPage({ controller, productService }) {
  // Controller handles UI lifecycle and coordination
  // Service handles pure business logic
  // Component is pure template
}
```

---

## Next Steps

### Essential Reading
- **[Service Patterns](../../patterns/service-patterns/)** - Advanced service design patterns
- **[Enterprise Implementation](../enterprise/implementation/)** - Large team organization
- **[Testing Guide](../../packages/di-core/testing/)** - Testing controllers and services

### Examples
- **[Complete E-Commerce App](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app)** - Controller/Service patterns in action
- **[Architecture Examples](https://github.com/7frank/tdi2/tree/main/examples/architecture-patterns)** - Various architectural patterns
- **[Team Organization](https://github.com/7frank/tdi2/tree/main/examples/team-boundaries)** - Multi-team coordination examples

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>Controllers manage UI lifecycle and coordinate services. Services contain pure business logic and data management. This separation enables large teams to work independently while maintaining architectural consistency.</p>
</div>