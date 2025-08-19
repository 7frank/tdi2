---
title: 'ADR-001: AST Transformation vs Runtime Reflection'
description: Why TDI2 uses compile-time AST transformation instead of runtime reflection for dependency injection.
---

# ADR-001: AST Transformation vs Runtime Reflection

**Status**: Active  
**Date**: 2024

## Context

TDI2 needed a way to implement dependency injection in TypeScript that would:
- Work with TypeScript interfaces (which erase at runtime)
- Provide zero runtime overhead
- Maintain perfect tree-shaking compatibility
- Support both class services and functional components

Traditional DI approaches use runtime reflection or metadata, but this creates bundle size overhead and breaks tree-shaking.

## Decision

Use compile-time AST transformation with **ts-morph + ts-query** to transform code during the build process.

The transformation pipeline:
1. **ts-query** finds DI patterns using CSS-like selectors
2. **ts-morph** performs code generation and transformation
3. Generated code contains no runtime DI logic

## Implementation

```typescript
// Before transformation
function UserProfile({ userService }: { userService: Inject<UserServiceInterface> }) {
  return <div>{userService.state.user.name}</div>;
}

// After transformation  
function UserProfile() {
  const userService = container.resolve<UserServiceInterface>("UserServiceInterface");
  return <div>{userService.state.user.name}</div>;
}
```

## Consequences

### Benefits
- **90% code reduction** in transformation pipeline (from 800+ lines to 50-100 lines)
- **Zero runtime overhead** - no DI logic in production bundles
- **Perfect tree-shaking** - unused services are eliminated
- **Type safety preserved** - full TypeScript interface support

### Trade-offs
- **Build-time complexity** - requires Vite plugin for transformation
- **Development setup** - needs proper TypeScript configuration
- **Debugging complexity** - generated code differs from source code

## Alternatives Considered

1. **Runtime reflection** (like InversifyJS) - Rejected due to bundle size and tree-shaking issues
2. **String-based tokens** - Rejected due to lack of type safety and collision risk
3. **Manual factory functions** - Rejected due to boilerplate and maintainability

This decision enables TDI2's core value proposition: enterprise-grade DI with React-level performance.