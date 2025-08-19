---
title: '@tdi2/vite-plugin-di Overview'
description: Build-time dependency injection transformation with interface-based automatic resolution, hot reload support, and zero-config setup.
---

# @tdi2/vite-plugin-di Overview
## Build-Time DI Transformation

The Vite plugin that transforms your TDI2 code at build time, providing automatic interface resolution, component transformation, and development debugging tools.

<div class="feature-highlight">
  <h3>🎯 Plugin Features</h3>
  <ul>
    <li><strong>Interface Resolution</strong> - Automatic service discovery from TypeScript interfaces</li>
    <li><strong>Component Transformation</strong> - Convert service props to useService hooks</li>
    <li><strong>Hot Reload</strong> - Development-friendly automatic retransformation</li>
    <li><strong>Debug Tools</strong> - Development endpoints and verbose logging</li>
  </ul>
</div>

**🔧 Technical Background**: See [ADR-001: AST Transformation](/adr/001-ast-transformation) and [ADR-004: Build-Time DI](/adr/004-build-time-di) for the design rationale.

---

## Installation

```bash
# npm
npm install @tdi2/vite-plugin-di @tdi2/di-core

# bun  
bun add @tdi2/vite-plugin-di @tdi2/di-core

# pnpm
pnpm add @tdi2/vite-plugin-di @tdi2/di-core
```

---

## Basic Configuration

### Minimal Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin(), // Zero config setup!
    react(),
  ],
});
```

### Development Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      // Enable all features for development
      enableInterfaceResolution: true,
      enableFunctionalDI: true,
      verbose: true,
      generateDebugFiles: true,
    }),
    react(),
  ],
});
```

### Production Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      // Optimized for production
      enableInterfaceResolution: true,
      enableFunctionalDI: true,
      verbose: false,
      generateDebugFiles: false,
      reuseExistingConfig: true,
    }),
    react(),
  ],
});
```

---

## How It Works

### 1. Interface Resolution

The plugin scans your codebase and automatically maps interfaces to implementations:

```typescript
// Your code
export interface ProductServiceInterface {
  loadProducts(): Promise<void>;
}

@Service()
export class ProductService implements ProductServiceInterface {
  // Implementation...
}
```

**Generated mapping:**
```typescript
// .tdi2/di-config.ts (auto-generated)
export const DI_CONFIG = {
  services: [
    {
      interface: 'ProductServiceInterface',
      implementation: 'ProductService',
      token: 'ProductService'
    }
  ]
};
```

### 2. Component Transformation

Components with service props are automatically transformed:

**Your code:**
```typescript
function ProductList({ productService }: {
  productService: Inject<ProductServiceInterface>;
}) {
  const { products, loading } = productService.state;
  return <div>{/* JSX */}</div>;
}
```

**Generated code:**
```typescript
function ProductList() {
  // TDI2-GENERATED: Service injection
  const productService = useService<ProductServiceInterface>('ProductService');
  const productServiceSnap = useSnapshot(productService.state);
  const { products, loading } = productServiceSnap;
  
  return <div>{/* Your JSX unchanged */}</div>;
}
```

---

## Configuration Options

### Core Options

```typescript
interface DIPluginOptions {
  /** Source directory to scan */
  srcDir?: string; // default: './src'
  
  /** Output directory for generated files */
  outputDir?: string; // default: './src/.tdi2'
  
  /** Enable verbose logging */
  verbose?: boolean; // default: false
  
  /** Enable hot reload during development */
  watch?: boolean; // default: true
  
  /** Enable functional component transformation */
  enableFunctionalDI?: boolean; // default: true
  
  /** Enable interface-to-implementation resolution */
  enableInterfaceResolution?: boolean; // default: true
}
```

### Advanced Options

```typescript
interface DIPluginOptions {
  /** Generate debug files for inspection */
  generateDebugFiles?: boolean; // default: false
  
  /** Reuse existing configurations */
  reuseExistingConfig?: boolean; // default: true
  
  /** Clean old configuration files */
  cleanOldConfigs?: boolean; // default: true
  
  /** Number of configurations to keep */
  keepConfigCount?: number; // default: 3
}
```

---

## Development Features

### Debug Endpoints

During development, access these URLs for debugging:

```bash
# General debug information
http://localhost:5173/_di_debug

# Interface mappings
http://localhost:5173/_di_interfaces

# Configuration management
http://localhost:5173/_di_configs

# Performance statistics
http://localhost:5173/_di_performance
```

### Force Regeneration

```bash
# Via API
curl -X POST http://localhost:5173/_di_regenerate

# Via CLI (if available)
npm run di:regenerate
```

### Debug File Generation

Enable debug file generation to inspect transformations:

```typescript
diEnhancedPlugin({
  generateDebugFiles: true,
  verbose: true
})
```

This creates files in `.tdi2/debug/` showing:
- Original component code
- Transformed component code  
- Interface mappings
- Service registrations

---

## Presets

Use predefined configurations for common scenarios:

```typescript
import { diEnhancedPlugin, createDIPluginPresets } from '@tdi2/vite-plugin-di';

const presets = createDIPluginPresets();

export default defineConfig({
  plugins: [
    // Choose appropriate preset
    process.env.NODE_ENV === 'development'
      ? diEnhancedPlugin(presets.development.options)
      : diEnhancedPlugin(presets.production.options),
    
    react(),
  ],
});
```

**Available presets:**
- **`development`** - Verbose logging, hot reload, debug files
- **`production`** - Minimal logging, optimized builds  
- **`testing`** - Fast rebuilds, no debug output
- **`debugging`** - Maximum verbosity for troubleshooting

---

## Examples

### Interface-Based Resolution

```typescript
// No manual token mapping needed!
export interface CartServiceInterface {
  addItem(product: Product): void;
}

@Service()
export class CartService implements CartServiceInterface {
  constructor(
    @Inject() private storage: StorageService,  // Auto-resolved
    @Inject() private analytics?: AnalyticsService  // Optional
  ) {}
}
```

### Multiple Implementations

```typescript
// Primary implementation
@Service()
@Primary()
export class DatabaseUserRepository implements UserRepositoryInterface {}

// Alternative implementation
@Service()
@Qualifier('cache')
export class CacheUserRepository implements UserRepositoryInterface {}

@Service()
export class UserService {
  constructor(
    @Inject() private repo: UserRepositoryInterface,           // → DatabaseUserRepository
    @Inject() @Qualifier('cache') private cache: UserRepositoryInterface  // → CacheUserRepository
  ) {}
}
```

### Generic Interfaces

```typescript
export interface Repository<T> {
  findById(id: string): Promise<T>;
  save(entity: T): Promise<void>;
}

@Service()
export class ProductRepository implements Repository<Product> {
  // Implementation...
}

// Automatic resolution with generics!
@Service()
export class ProductService {
  constructor(@Inject() private repo: Repository<Product>) {}
  //           ↑ Automatically resolves to ProductRepository
}
```

---

## Performance

### Build-Time Benefits

- **Zero Runtime Overhead** - All DI resolution happens at build time
- **Tree Shaking** - Only used services included in bundles
- **Code Generation** - No runtime reflection or metadata
- **Parallel Processing** - Concurrent file processing for large codebases

### Development Performance

- **Intelligent Caching** - Avoid unnecessary regeneration
- **Hot Reload** - Automatic retransformation on changes
- **Incremental Updates** - Only rebuild changed components

---

## Troubleshooting

### Common Issues

#### Service Not Found
```bash
# Check interface mappings
curl http://localhost:5173/_di_interfaces

# Force regeneration
curl -X POST http://localhost:5173/_di_regenerate
```

#### Interface Resolution Failing
```typescript
// Ensure proper implementation
@Service()
export class MyService implements MyServiceInterface {
  // Must implement interface methods
}
```

#### Hot Reload Not Working
```typescript
diEnhancedPlugin({
  watch: true,      // Enable file watching
  verbose: true     // See what's happening
})
```

### Debug Mode

Enable maximum debugging for troubleshooting:

```typescript
diEnhancedPlugin({
  verbose: true,
  generateDebugFiles: true,
  // Force fresh start
  reuseExistingConfig: false,
  cleanOldConfigs: true
})
```

---

## Integration Examples

### With TypeScript

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

### With Testing

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [
    diEnhancedPlugin(presets.testing.options),
    react(),
  ],
  test: {
    environment: 'jsdom',
  },
});
```

### With Monorepos

```typescript
// apps/web/vite.config.ts
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      srcDir: './src',
      outputDir: './src/.tdi2',
      // Scan shared packages too
      advanced: {
        fileExtensions: ['.ts', '.tsx'],
        searchPaths: ['../../packages/*/src']
      }
    }),
    react(),
  ],
});
```

---

## Next Steps

### Essential Reading
- **[DI Core Package](../di-core/overview/)** - Core framework features
- **[Testing Guide](../di-core/testing/)** - Test with build-time DI

### Setup Guides
- **[Quick Start](../../getting-started/quick-start/)** - Complete setup tutorial
- **[Service Patterns](../../patterns/service-patterns/)** - Design robust services

### Examples
- **[Complete E-Commerce App](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app)** - Working implementation
- **[Build Configuration Examples](https://github.com/7frank/tdi2/tree/main/examples)** - Various setup configurations
- **[Debug Output Examples](https://github.com/7frank/tdi2/tree/main/monorepo/apps/di-test-harness)** - See transformations in action

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>The Vite plugin handles all the complexity of dependency injection transformation. Your code stays clean and readable while the plugin generates optimized production code.</p>
</div>