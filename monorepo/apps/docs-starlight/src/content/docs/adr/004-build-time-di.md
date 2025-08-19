---
title: 'ADR-004: Build-Time vs Runtime DI'
description: Why TDI2 transforms React components at build time instead of using runtime DI containers.
---

# ADR-004: Build-Time vs Runtime DI

**Status**: Active  
**Date**: 2024

## Context

React has strict requirements for component purity and render stability:
- **Render functions must be pure** - no side effects during render
- **Service references must be stable** - same reference across re-renders
- **StrictMode compatibility** - must handle double-invocation correctly
- **Concurrent rendering** - React can pause, resume, and replay renders

Traditional runtime DI containers perform service resolution during render, which violates React's purity requirements and creates performance issues.

## Decision

Transform React components at **build time** to resolve services outside the render cycle, rather than using runtime DI containers during render.

Services are resolved at the container boundary and injected as stable props, ensuring render purity and compatibility with React's concurrency features.

## Implementation

### Build-Time Transformation

```typescript
// Source code (what developer writes)
function UserProfile({ userService }: { userService: Inject<UserServiceInterface> }) {
  const { user, loading } = userService.state;
  
  if (loading) return <Spinner />;
  return <div>{user?.name}</div>;
}

// Generated code (after transformation)
function UserProfile() {
  const userService = container.resolve<UserServiceInterface>("UserServiceInterface");
  const { user, loading } = userService.state;
  
  if (loading) return <Spinner />;
  return <div>{user?.name}</div>;
}
```

### Container Boundary

```typescript
// Services resolved once at application boundary
const container = new DIContainer();
container.loadConfiguration(DI_CONFIG);

// Component gets stable service references
function App() {
  return (
    <DIProvider container={container}>
      <UserProfile /> {/* No prop drilling needed */}
    </DIProvider>
  );
}
```

## Consequences

### Benefits
- **Render purity maintained** - no side effects during component render
- **StrictMode compatible** - services created outside render cycle
- **Stable references** - same service instance across re-renders
- **Zero render overhead** - no DI lookup cost during render
- **Concurrent rendering safe** - services exist independently of render lifecycle

### Trade-offs
- **Build-time dependency** - requires Vite plugin for transformation
- **Generated code complexity** - source code differs from runtime code
- **Container setup required** - must configure DI container at application root

## Alternatives Considered

1. **Runtime DI during render** - Rejected due to React purity violations
   ```typescript
   function Component() {
     const service = container.resolve("Service"); // ❌ Side effect during render
   }
   ```

2. **Manual useRef caching** - Rejected due to boilerplate and complexity
   ```typescript
   function Component() {
     const serviceRef = useRef<Service>();
     if (!serviceRef.current) {
       serviceRef.current = container.resolve("Service"); // ❌ Still side effect
     }
   }
   ```

3. **Context-based DI** - Rejected due to provider hell and performance issues
   ```typescript
   <ServiceAProvider>
     <ServiceBProvider>
       <ServiceCProvider> {/* ❌ Provider pyramid */}
   ```

The build-time approach ensures TDI2 works seamlessly with React's architecture while providing enterprise-grade dependency injection capabilities.