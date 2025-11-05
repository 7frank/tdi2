// src/utils/simpleLazy.tsx
import React from 'react';

/**
 * Simple utility to create lazy components with error fallbacks
 * 
 * @param importFn - Function that returns the import promise
 * @param componentName - Optional component name for better error messages
 * @returns Lazy component with error handling
 */
export function lazy<T = any>(
  importFn: () => Promise<any>, 
  componentName: string = 'Component'
): React.LazyExoticComponent<React.ComponentType<T>> {
  return React.lazy(async () => {
    try {
      const module = await importFn();
      const component = module.default || module[componentName] || Object.values(module)[0];
      
      if (!component) {
        throw new Error(`Component '${componentName}' not found in module. Available exports: ${Object.keys(module).join(', ')}`);
      }
      
      return { default: component as React.ComponentType<T> };
    } catch (error) {
      console.error(`Failed to load ${componentName}:`, error);
      
      return {
        default: () => (
          <div style={{
            padding: '16px',
            border: '2px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#ffe0e0'
          }}>
            <h4>⚠️ {componentName} Load Error</h4>
            <pre style={{ fontSize: '12px', backgroundColor: '#f8f9fa', padding: '8px' }}>
              {error instanceof Error ? error.message : String(error)}
            </pre>
          </div>
        )
      };
    }
  });
}

/**
 * Alternative approach using a component registry for better Vite compatibility
 */
export function createLazyRegistry() {
  const registry = new Map<string, () => Promise<any>>();
  
  return {
    register<T = any>(name: string, importFn: () => Promise<any>): React.LazyExoticComponent<React.ComponentType<T>> {
      registry.set(name, importFn);
      return lazy(importFn, name);
    },
    
    get(name: string) {
      const importFn = registry.get(name);
      if (!importFn) {
        throw new Error(`Component '${name}' not found in registry`);
      }
      return lazy(importFn, name);
    }
  };
}

// Usage examples:
// const LazyComponent = lazy(() => import("../components/MyComponent"), "MyComponent");
// const LazyComponent = lazy(() => import("../components/DestructuredKeysExample"), "DestructuredKeysExample");

// Or using the registry approach:
// const registry = createLazyRegistry();
// const LazyComponent = registry.register("DestructuredKeysExample", () => import("../components/DestructuredKeysExample"));