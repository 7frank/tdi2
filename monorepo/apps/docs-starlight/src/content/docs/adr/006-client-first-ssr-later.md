---
title: 'ADR-006: Client-First, SSR Later'
description: Why TDI2 focuses on client-side React first and defers SSR implementation.
---

# ADR-006: Client-First, SSR Later

**Status**: Active  
**Date**: 2024

## Context

TDI2 could support both client-side React applications and server-side rendering (SSR), but each has different architectural requirements:

**Client-side requirements:**
- App-scoped singleton services
- Browser-based state persistence
- Simple container lifecycle

**SSR requirements:**
- Request-scoped service isolation 
- Server/client state synchronization
- Request-specific container creation
- Serialization boundaries

Adding SSR support significantly increases complexity and could delay the core client-side functionality.

## Decision

Focus on **client-side React applications first**, with SSR as a future enhancement.

TDI2's initial release targets client-rendered React applications, with clear documentation that SSR is not yet supported. SSR will be added in a later version with proper request-scoped containers.

## Implementation

### Current Client-Side Support

```typescript
// Single container for entire application
const container = new DIContainer();
container.loadConfiguration(DI_CONFIG);

// App-scoped services work perfectly
@Service()
export class UserService {
  state = { user: null }; // Singleton state across app
}

function App() {
  return (
    <DIProvider container={container}>
      <Router>
        <Routes>
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </Router>
    </DIProvider>
  );
}
```

### Future SSR Architecture

```typescript
// Request-scoped containers (future implementation)
export async function getServerSideProps(context) {
  const requestContainer = createRequestScopedContainer(context.req);
  
  const userService = requestContainer.resolve<UserServiceInterface>("UserServiceInterface");
  await userService.loadUser(context.params.userId);
  
  return {
    props: {
      initialState: serializeServiceState(requestContainer)
    }
  };
}
```

## Consequences

### Benefits
- **Faster initial development** - can focus on core DI functionality
- **Simpler architecture** - avoids premature SSR complexity
- **Clear scope** - client-side patterns are well-defined
- **Better testing** - easier to validate core features first
- **Market validation** - can validate TDI2 concept without SSR complexity

### Trade-offs
- **Limited SSR support** - cannot be used in SSR applications initially
- **Future breaking changes** - SSR may require API changes
- **Enterprise limitation** - some enterprise apps require SSR
- **Next.js limitation** - popular React SSR framework not fully supported

## Current Workarounds

For teams that need SSR today:

1. **Use TDI2 for client-only parts** - hydrated portions of SSR apps
2. **Wait for SSR support** - planned for future release
3. **Traditional patterns for SSR** - use Context/Redux for server-rendered parts

## Implementation Timeline

**Phase 1 (Current)**: Client-side React applications
- ✅ App-scoped services
- ✅ Browser state management
- ✅ Single container lifecycle

**Phase 2 (Future)**: Server-side rendering support
- 🔄 Request-scoped containers
- 🔄 Server/client state synchronization  
- 🔄 SSR framework integration (Next.js, Remix)

## Alternatives Considered

1. **SSR from day one** - Rejected due to complexity and delayed release
2. **Basic SSR with shared state** - Rejected due to data leakage risks
3. **Client-only forever** - Rejected due to enterprise SSR requirements

This decision allows TDI2 to establish itself in the client-side React ecosystem while planning for future SSR expansion.