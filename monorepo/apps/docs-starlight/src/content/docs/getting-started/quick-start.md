---
title: Quick Start Guide
description: Get TDI2 running in 15 minutes with a complete e-commerce ProductService example. Learn service injection, reactive state, and component transformation.
---

# Quick Start Guide
## Get TDI2 Running in 15 Minutes

Transform your React app from props hell to service-oriented architecture with this complete e-commerce example.

<div class="feature-highlight">
  <h3>🎯 What You'll Build</h3>
  <p>A complete ProductService with reactive state, automatic dependency injection, and zero-props components. By the end, you'll have a working product catalog with real-time updates.</p>
</div>

---

## Installation

```bash
# Core packages
npm install @tdi2/di-core @tdi2/vite-plugin-di valtio

# Or with bun
bun add @tdi2/di-core @tdi2/vite-plugin-di valtio
```

---

## 1. Configure Build Pipeline

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    react(),
    diEnhancedPlugin({
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      enableLifecycleHooks: true,
      verbose: true, // See transformation logs
    })
  ],
  
  // TypeScript configuration for decorators
  esbuild: {
    target: 'es2020'
  }
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": false,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node"
  }
}
```

---

## 2. Create Your First Service

Let's build a ProductService for an e-commerce application:

```typescript
// services/interfaces/ProductServiceInterface.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  stock: number;
}

export interface ProductServiceInterface {
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
  clearSearch(): void;
}
```

```typescript
// services/implementations/ProductService.ts
import { Service, Inject } from '@tdi2/di-core';
import type { ProductServiceInterface, Product } from '../interfaces/ProductServiceInterface';

@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    products: [] as Product[],
    selectedProduct: null as Product | null,
    loading: false,
    error: null as string | null,
    searchTerm: '',
  };

  constructor(
    @Inject() private productRepository: ProductRepository,
    @Inject() private notificationService: NotificationService
  ) {}

  async loadProducts(): Promise<void> {
    if (this.state.products.length > 0) return; // Smart caching

    this.state.loading = true;
    this.state.error = null;

    try {
      this.state.products = await this.productRepository.getProducts();
      this.notificationService.showSuccess(`Loaded ${this.state.products.length} products`);
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to load products');
    } finally {
      this.state.loading = false;
    }
  }

  async loadProduct(id: string): Promise<void> {
    if (this.state.selectedProduct?.id === id) return;

    this.state.loading = true;
    this.state.error = null;

    try {
      this.state.selectedProduct = await this.productRepository.getProduct(id);
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Product not found');
    } finally {
      this.state.loading = false;
    }
  }

  searchProducts(term: string): void {
    this.state.searchTerm = term;
    // Reactive filtering happens automatically in components
  }

  clearSearch(): void {
    this.state.searchTerm = '';
  }
}
```

---

## 3. Create Repository (Data Layer)

The repository pattern separates data fetching from business logic:

```typescript
// repositories/interfaces/ProductRepository.ts
export interface ProductRepository {
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product>;
  searchProducts(term: string): Promise<Product[]>;
}
```

```typescript
// repositories/implementations/ApiProductRepository.ts
import { Service } from '@tdi2/di-core';

@Service()
export class ApiProductRepository implements ProductRepository {
  private readonly baseUrl = '/api/products';

  async getProducts(): Promise<Product[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  }

  async getProduct(id: string): Promise<Product> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error('Product not found');
    return response.json();
  }

  async searchProducts(term: string): Promise<Product[]> {
    const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(term)}`);
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  }
}
```

```typescript
// services/implementations/NotificationService.ts
@Service()
export class NotificationService {
  showSuccess(message: string): void {
    // Integration with your notification system
    console.log('✅', message);
    // toast.success(message);
  }

  showError(message: string): void {
    console.error('❌', message);
    // toast.error(message);
  }
}
```

---

## 4. Transform Your Component

Here's where the magic happens - write components with service injection:

```typescript
// components/ProductList.tsx
import { Inject } from '@tdi2/di-core';
import type { ProductServiceInterface } from '../services/interfaces/ProductServiceInterface';

interface ProductListProps {
  productService: Inject<ProductServiceInterface>;
}

export function ProductList({ productService }: ProductListProps) {
  const { products, loading, error, searchTerm } = productService.state;

  // Filter products based on search term (reactive!)
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    productService.loadProducts();
  }, []);

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="product-list">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => productService.searchProducts(e.target.value)}
        />
        {searchTerm && (
          <button onClick={() => productService.clearSearch()}>
            Clear Search
          </button>
        )}
      </div>

      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            {searchTerm ? 'No products match your search' : 'No products available'}
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard 
              key={product.id}
              productId={product.id}
              onSelect={() => productService.loadProduct(product.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

```typescript
// components/ProductCard.tsx  
interface ProductCardProps {
  productId: string;
  onSelect: () => void;
  productService: Inject<ProductServiceInterface>;
}

export function ProductCard({ productId, onSelect, productService }: ProductCardProps) {
  const product = productService.state.products.find(p => p.id === productId);
  
  if (!product) return null;

  return (
    <div className="product-card" onClick={onSelect}>
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p className="price">${product.price}</p>
      <p className="description">{product.description}</p>
      <div className="stock">
        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
      </div>
    </div>
  );
}
```

---

## 5. Setup DI Provider

Configure the DI container and wrap your app with the provider:

```typescript
// main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DIContainer, DIProvider } from '@tdi2/di-core';
import { DI_CONFIG } from './.tdi2/di-config'; // Auto-generated by Vite plugin
import App from './App';

// Create and configure the DI container
const container = new DIContainer();
container.loadConfiguration(DI_CONFIG);

createRoot(document.getElementById('root')!).render(
  <DIProvider container={container}>
    <App />
  </DIProvider>
);
```

```typescript
// App.tsx
import { ProductList } from './components/ProductList';

function App() {
  return (
    <div className="app">
      <header>
        <h1>E-Commerce Product Catalog</h1>
      </header>
      
      <main>
        <ProductList />  {/* No props needed - DI handles it! */}
      </main>
    </div>
  );
}

export default App;
```

---

## What Happens During Transformation

When you build your app, TDI2's Vite plugin transforms your components:

### Your Code (Input)
```typescript
function ProductList({ productService }: { productService: Inject<ProductServiceInterface> }) {
  const { products, loading } = productService.state;
  // Component logic...
}
```

### Generated Code (Output)
```typescript
function ProductList() {
  // TDI2-GENERATED: Automatic service injection
  const productService = useService<ProductServiceInterface>('ProductService');
  
  // TDI2-GENERATED: Reactive state snapshots
  const productServiceSnap = useSnapshot(productService.state);
  const { products, loading } = productServiceSnap;
  
  // Your original component logic (unchanged)
  // Component logic...
}
```

<div class="example-container">
  <div class="example-title">⚡ The Magic</div>
  <p>TDI2 automatically converts service props into useService hooks and adds reactive snapshots for optimal performance. Your production code contains zero DI abstractions!</p>
</div>

---

## Verification

Test your setup by running the development server:

```bash
bun run dev
```

You should see:
1. **Build logs** showing TDI2 transformations (if verbose: true)
2. **Working product list** with search functionality  
3. **Reactive updates** when you type in the search box
4. **No props drilling** - components get data from services

---

## Benefits You Just Gained

| Traditional React | Your New TDI2 App |
|-------------------|-------------------|
| Props drilling through multiple levels | Direct service injection |
| Manual state synchronization | Automatic reactive updates |
| Complex component testing | Simple service unit tests |
| Tight coupling between components | Loose coupling via interfaces |
| Performance optimization required | Automatic surgical re-renders |

---

## Next Steps

### Essential Reading
- **[Service Patterns](../patterns/service-patterns/)** - Design robust, scalable services
- **[Component Guide](../guides/component-transformation/)** - Transform existing components
- **[Testing Guide](../packages/di-core/testing/)** - Test services and components

### Advanced Topics  
- **[Package Documentation](../packages/di-core/overview/)** - Complete feature reference
- **[Testing Guide](../packages/di-core/testing/)** - Test services and components

### Examples
- **[Complete E-Commerce App](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app)** - Working implementation
- **[Interactive Demos](https://github.com/7frank/tdi2/tree/main/monorepo/apps/di-test-harness)** - Live code transformations

---

## Troubleshooting

### Build Errors

**TypeScript decorator errors?**
```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": false
  }
}
```

**Services not injecting?**
- Ensure `@Service()` decorator on your service class
- Verify `Inject<InterfaceName>` type annotation on component props
- Check that interface name matches service class name pattern

**State not updating?**
- Confirm Valtio is installed: `bun add valtio`
- Enable Valtio integration in plugin config
- Check browser console for TDI2 transformation logs

**Missing dependencies?**
- Ensure all `@Inject()` dependencies have corresponding `@Service()` implementations
- Check the browser network tab for failed service registrations

### Getting Help

- **[Vite Plugin Documentation](../packages/vite-plugin-di/overview/)** - Plugin configuration and troubleshooting
- **[GitHub Issues](https://github.com/7frank/tdi2/issues)** - Report bugs or ask questions
- **[Examples Repository](https://github.com/7frank/tdi2/tree/main/examples)** - Working example applications

---

🎉 **Congratulations!** You've just built your first TDI2 application with reactive services, automatic dependency injection, and zero props drilling. Welcome to the future of React architecture!