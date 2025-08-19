---
title: 'ADR-002: Valtio for Service State Management'
description: Why TDI2 uses Valtio proxy-based reactivity for service state instead of manual subscriptions.
---

# ADR-002: Valtio for Service State Management

**Status**: Active  
**Date**: 2024

## Context

Services in TDI2 needed a way to manage state that would:
- Automatically trigger React re-renders when state changes
- Work seamlessly with React's rendering model
- Eliminate manual subscription management
- Provide surgical re-renders (only affected components update)

Traditional approaches require manual useState management or complex subscription patterns that create boilerplate and potential memory leaks.

## Decision

Use **Valtio proxy-based reactivity** for service state management.

Services contain reactive state objects that automatically trigger React re-renders when mutated, without requiring manual subscriptions or useState calls.

## Implementation

```typescript
@Service()
export class ProductService implements ProductServiceInterface {
  // Valtio proxy state - automatically reactive
  state = {
    products: [] as Product[],
    loading: false,
    selectedProduct: null as Product | null
  };

  async loadProducts() {
    this.state.loading = true; // Triggers re-render of loading components
    try {
      this.state.products = await this.api.getProducts(); // Updates product lists
    } finally {
      this.state.loading = false; // Removes loading state
    }
  }

  selectProduct(product: Product) {
    this.state.selectedProduct = product; // Updates product detail components
  }
}

// Component automatically re-renders when service state changes
function ProductList({ productService }: { productService: Inject<ProductServiceInterface> }) {
  return (
    <div>
      {productService.state.loading && <Spinner />}
      {productService.state.products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Consequences

### Benefits
- **Zero subscription boilerplate** - no manual useEffect or subscription management
- **Surgical re-renders** - only components using changed state re-render
- **Natural mutations** - state updates feel like normal object property assignment
- **Automatic cleanup** - no memory leaks from forgotten unsubscriptions
- **Cross-component sync** - state changes automatically propagate everywhere

### Trade-offs
- **Proxy dependency** - adds Valtio as a required dependency
- **Mutation-based** - requires understanding that direct mutation triggers updates
- **Debug complexity** - proxy objects can be harder to inspect in debugger

## Alternatives Considered

1. **Manual useState + subscriptions** - Rejected due to boilerplate and leak potential
2. **RxJS observables** - Rejected due to learning curve and bundle size
3. **Zustand** - Rejected due to manual subscription requirements
4. **Redux Toolkit** - Rejected due to action/reducer boilerplate

Valtio provides the cleanest integration between service-based architecture and React's rendering model.