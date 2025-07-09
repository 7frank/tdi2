# RSI SSR: Hydration Strategy

## The Hydration Challenge

Hydration mismatches are RSI's biggest SSR challenge. Server-rendered HTML must exactly match what the client renders on first pass, including all service state.

## Current Problem

```typescript
// Server renders with fresh service state
const serverUserService = new UserService() // state = { user: null }

// Client hydrates with different state  
const clientUserService = new UserService() // state = { user: null }
// But client might have cached data or different initialization
```

## Solution 1: State Serialization Pattern

### Server-Side State Extraction

```typescript
// server/ssr-utils.ts
export async function extractServiceStates(
  container: DIContainer,
  requiredServices: string[]
): Promise<SerializedServiceState> {
  const states: SerializedServiceState = {}
  
  for (const serviceName of requiredServices) {
    const service = container.get(serviceName)
    if (service.state) {
      // Extract serializable state
      states[serviceName] = JSON.parse(JSON.stringify(service.state))
    }
  }
  
  return states
}

// Example usage in server render
export async function renderPage(url: string) {
  const container = createServerContainer()
  
  // Pre-populate services with data
  const userService = container.get<UserServiceInterface>('UserService')
  await userService.loadUser('123') // Server-side data loading
  
  // Extract all service states
  const serviceStates = await extractServiceStates(container, [
    'UserService',
    'AppStateService', 
    'NotificationService'
  ])
  
  // Render with populated services
  const html = renderToString(
    <DIProvider container={container}>
      <App />
    </DIProvider>
  )
  
  return {
    html,
    serviceStates // Send to client
  }
}
```

### Client-Side State Hydration

```typescript
// client/hydration.ts
export function createHydratedContainer(
  serviceStates: SerializedServiceState
): DIContainer {
  const container = new CompileTimeDIContainer()
  container.loadConfiguration(DI_CONFIG)
  
  // Hydrate each service with server state
  for (const [serviceName, state] of Object.entries(serviceStates)) {
    const service = container.get(serviceName)
    if (service.state && state) {
      // Restore server state
      Object.assign(service.state, state)
    }
  }
  
  return container
}

// Usage in client hydration
const serviceStates = window.__INITIAL_SERVICE_STATES__
const container = createHydratedContainer(serviceStates)

hydrateRoot(
  document.getElementById('root')!,
  <DIProvider container={container}>
    <App />
  </DIProvider>
)
```

## Solution 2: Service State Snapshots

### Valtio-Compatible Serialization

```typescript
// utils/state-serialization.ts
import { snapshot } from 'valtio'

export function serializeServiceState(service: any): any {
  if (!service.state) return null
  
  // Use Valtio snapshot for clean serialization
  const snap = snapshot(service.state)
  
  // Handle special cases (Dates, complex objects)
  return JSON.parse(JSON.stringify(snap, (key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() }
    }
    return value
  }))
}

export function deserializeServiceState(serialized: any): any {
  if (!serialized) return null
  
  return JSON.parse(JSON.stringify(serialized), (key, value) => {
    if (value && value.__type === 'Date') {
      return new Date(value.value)
    }
    return value
  })
}
```

### Service State Manager

```typescript
// services/ServiceStateManager.ts
@Service()
export class ServiceStateManager {
  private serializedStates = new Map<string, any>()
  
  // Server-side: Extract states before rendering
  extractStates(container: DIContainer): SerializedServiceState {
    const states: SerializedServiceState = {}
    
    for (const token of container.getRegisteredTokens()) {
      const service = container.get(token)
      if (service.state) {
        states[token] = serializeServiceState(service)
      }
    }
    
    return states
  }
  
  // Client-side: Restore states during hydration
  restoreStates(
    container: DIContainer, 
    states: SerializedServiceState
  ): void {
    for (const [token, serializedState] of Object.entries(states)) {
      const service = container.get(token)
      if (service.state && serializedState) {
        const restoredState = deserializeServiceState(serializedState)
        Object.assign(service.state, restoredState)
      }
    }
  }
}
```

## Solution 3: Async Service Initialization

### Pre-hydration Data Loading

```typescript
// server/service-preloader.ts
export async function preloadServiceData(
  container: DIContainer,
  context: SSRContext
): Promise<void> {
  const promises: Promise<void>[] = []
  
  // Define service loading strategies
  const loadingStrategies = {
    UserService: async (service: UserServiceInterface) => {
      if (context.userId) {
        await service.loadUser(context.userId)
      }
    },
    ProductService: async (service: ProductServiceInterface) => {
      if (context.route.includes('/products')) {
        await service.loadProducts()
      }
    },
    CartService: async (service: CartServiceInterface) => {
      if (context.userId) {
        await service.loadCart(context.userId)
      }
    }
  }
  
  // Execute all relevant loading strategies
  for (const [serviceName, loadStrategy] of Object.entries(loadingStrategies)) {
    const service = container.get(serviceName)
    promises.push(loadStrategy(service))
  }
  
  // Wait for all data to load
  await Promise.all(promises)
}

// Usage in SSR
export async function renderApp(request: Request) {
  const container = createServerContainer()
  const context = extractSSRContext(request)
  
  // Pre-load all required data
  await preloadServiceData(container, context)
  
  // Now render with populated services
  const html = renderToString(
    <DIProvider container={container}>
      <App />
    </DIProvider>
  )
  
  return html
}
```

## Solution 4: Hydration-Safe Service Pattern

### Service Lifecycle Hooks

```typescript
// Base service with SSR lifecycle
export abstract class SSRService {
  abstract state: any
  
  // Called on server before rendering
  async onServerRender?(context: SSRContext): Promise<void> {}
  
  // Called on client before hydration
  async onClientHydrate?(initialState: any): Promise<void> {
    if (initialState && this.state) {
      Object.assign(this.state, initialState)
    }
  }
  
  // Called after successful hydration
  onHydrationComplete?(): void {}
}

// Example implementation
@Service()
export class UserService extends SSRService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false
  }
  
  async onServerRender(context: SSRContext): Promise<void> {
    if (context.userId) {
      await this.loadUser(context.userId)
    }
  }
  
  async onClientHydrate(initialState: any): Promise<void> {
    super.onClientHydrate(initialState)
    
    // Set up client-side specific logic
    this.setupAutoRefresh()
  }
  
  private setupAutoRefresh(): void {
    // Only run on client
    if (typeof window !== 'undefined') {
      setInterval(() => this.refreshUser(), 30000)
    }
  }
}
```

## Solution 5: Hydration Validation

### State Consistency Checker

```typescript
// dev-utils/hydration-validator.ts
export function validateHydration(
  serverStates: SerializedServiceState,
  clientContainer: DIContainer
): HydrationValidationResult {
  const issues: HydrationIssue[] = []
  
  for (const [serviceName, serverState] of Object.entries(serverStates)) {
    const clientService = clientContainer.get(serviceName)
    const clientState = serializeServiceState(clientService)
    
    if (!deepEqual(serverState, clientState)) {
      issues.push({
        service: serviceName,
        serverState,
        clientState,
        diff: calculateDiff(serverState, clientState)
      })
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

// Development middleware
if (process.env.NODE_ENV === 'development') {
  const validation = validateHydration(
    window.__INITIAL_SERVICE_STATES__,
    container
  )
  
  if (!validation.isValid) {
    console.warn('🚨 RSI Hydration Mismatch Detected:', validation.issues)
  }
}
```

## Implementation Strategy

### Phase 1: Basic State Serialization
- Implement `serializeServiceState` and `deserializeServiceState`
- Add state extraction to SSR rendering
- Test with simple services

### Phase 2: Service Lifecycle Hooks
- Add `SSRService` base class
- Implement pre-rendering data loading
- Add hydration lifecycle methods

### Phase 3: Advanced Validation
- Build hydration validation tools
- Add development-time mismatch detection
- Performance optimization for state transfer

### Phase 4: Framework Integration
- Integrate with Next.js patterns
- Support React Server Components
- Optimize bundle splitting

## Benefits

- ✅ **Eliminates hydration mismatches** through state synchronization
- ✅ **Maintains RSI patterns** across server and client
- ✅ **Enables server-side data pre-loading** with clear service boundaries
- ✅ **Provides development tools** for debugging SSR issues

## Challenges

- ❌ **Complex serialization** for non-trivial state objects
- ❌ **Bundle size increase** from state transfer
- ❌ **Performance overhead** from state extraction/restoration
- ❌ **Type safety** for serialized/deserialized state

## Next Steps

1. Prototype basic state serialization with simple services
2. Test Valtio proxy serialization/deserialization  
3. Build development tools for hydration validation
4. Integrate with existing RSI build pipeline