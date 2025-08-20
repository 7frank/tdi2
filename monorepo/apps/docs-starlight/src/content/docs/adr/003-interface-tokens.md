---
title: 'ADR-003: Interface-Based DI Tokens'
description: Why TDI2 uses TypeScript interfaces as DI tokens with compile-time resolution instead of string tokens or symbols.
---

# ADR-003: Interface-Based DI Tokens

**Status**: Active  
**Date**: 2024

## Context

Dependency injection systems need a way to identify and resolve services. The token system must provide:
- **Type safety** - prevent injecting wrong service types
- **Tree-shaking compatibility** - unused services should be eliminated from bundles
- **Developer experience** - perfect IntelliSense and auto-completion
- **Runtime safety** - no token collision possibilities

Traditional DI systems use string tokens or symbols, but these lack type safety and can collide at runtime.

## Decision

Use **TypeScript interfaces as DI tokens** with compile-time resolution to service implementations.

The system resolves `interface → implementation` mappings at build time, generating type-safe service access without runtime token lookups.

## Implementation

```typescript
// 1. Define service interface
export interface UserServiceInterface {
  state: { user: User | null; loading: boolean };
  loadUser(id: string): Promise<void>;
  updateUser(updates: Partial<User>): Promise<void>;
}

// 2. Implement service
@Service()
export class UserService implements UserServiceInterface {
  state = { user: null as User | null, loading: false };
  
  async loadUser(id: string) {
    this.state.loading = true;
    this.state.user = await this.api.getUser(id);
    this.state.loading = false;
  }
  
  async updateUser(updates: Partial<User>) {
    Object.assign(this.state.user, updates);
    await this.api.updateUser(this.state.user.id, updates);
  }
}

// 3. Inject with perfect type safety
function UserProfile({ userService }: { userService: Inject<UserServiceInterface> }) {
  // userService is fully typed as UserServiceInterface
  // IntelliSense shows all methods and properties
  return <div>{userService.state.user?.name}</div>;
}
```

## Compile-Time Resolution

```typescript
// Build transforms this...
const userService: Inject<UserServiceInterface>;

// Into this...
const userService = container.resolve<UserServiceInterface>("UserServiceInterface");
```

## Consequences

### Benefits
- **Perfect type safety** - impossible to inject wrong service type
- **Excellent DX** - full IntelliSense, auto-completion, and refactoring support
- **Zero runtime collisions** - interface names are resolved at compile-time
- **Tree-shakable** - unused interfaces and implementations are eliminated
- **Refactor-safe** - interface renames automatically update all injection points

### Trade-offs
- **Compile-time requirement** - must use build-time transformation
- **Interface naming convention** - services must implement interfaces with consistent naming
- **Single implementation** - each interface can only have one active implementation per container

## Alternatives Considered

1. **String tokens** - Rejected due to lack of type safety and collision risk
   ```typescript
   @Inject("UserService") // No type safety, possible typos/collisions
   ```

2. **Symbol tokens** - Rejected due to poor developer experience
   ```typescript
   @Inject(USER_SERVICE_TOKEN) // Extra token definitions, no IntelliSense
   ```

3. **Class tokens** - Rejected due to circular dependency issues
   ```typescript
   @Inject(UserService) // Creates circular imports in large applications
   ```

The interface-based approach provides the best combination of type safety, developer experience, and runtime performance.