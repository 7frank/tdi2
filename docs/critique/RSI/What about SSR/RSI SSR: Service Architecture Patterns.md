# RSI SSR: Service Architecture Patterns

## Architectural Patterns for Server/Client Services

Different patterns for organizing services across server and client environments, each with distinct trade-offs for complexity, performance, and maintainability.

## Pattern 1: Isomorphic Services (Shared Implementation)

### Single Service, Environment-Aware Implementation

```typescript
// services/UserService.ts
export interface UserServiceInterface {
  state: { currentUser: User | null; loading: boolean }
  loadUser(id: string): Promise<void>
  updateUser(id: string, updates: Partial<User>): Promise<void>
}

@Service()
export class UserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false
  }
  
  constructor(
    @Inject() private dataProvider: UserDataProvider // Different per environment
  ) {}
  
  async loadUser(id: string): Promise<void> {
    this.state.loading = true
    try {
      this.state.currentUser = await this.dataProvider.getUser(id)
    } finally {
      this.state.loading = false
    }
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const updated = await this.dataProvider.updateUser(id, updates)
    this.state.currentUser = updated
  }
}

// Different data providers per environment
interface UserDataProvider {
  getUser(id: string): Promise<User>
  updateUser(id: string, updates: Partial<User>): Promise<User>
}

// Server implementation - direct database access
@Service()
@Profile('server')
export class ServerUserDataProvider implements UserDataProvider {
  constructor(@Inject() private database: Database) {}
  
  async getUser(id: string): Promise<User> {
    return this.database.users.findById(id)
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.database.users.update(id, updates)
  }
}

// Client implementation - API calls
@Service()
@Profile('client')
export class ClientUserDataProvider implements UserDataProvider {
  async getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    return response.json()
  }
}
```

### Benefits
- ✅ **Single service interface** across environments
- ✅ **Consistent business logic** everywhere
- ✅ **Easy testing** with mock data providers
- ✅ **Type safety** maintained across server/client

### Drawbacks
- ❌ **Complex dependency management** for different environments
- ❌ **Bundle bloat** if server-specific code leaks to client
- ❌ **Runtime environment detection** adds complexity

## Pattern 2: Separate Server/Client Services

### Dedicated Service Implementations per Environment

```typescript
// Shared interface
export interface UserServiceInterface {
  state: { currentUser: User | null; loading: boolean }
  loadUser(id: string): Promise<void>
  updateUser(id: string, updates: Partial<User>): Promise<void>
}

// Server-side service with direct data access
@Service()
@Profile('server')
export class ServerUserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false
  }
  
  constructor(
    @Inject() private database: Database,
    @Inject() private cache: CacheService
  ) {}
  
  async loadUser(id: string): Promise<void> {
    // Server optimizations: caching, batching, etc.
    const cached = await this.cache.get(`user:${id}`)
    if (cached) {
      this.state.currentUser = cached
      return
    }
    
    this.state.loading = true
    try {
      const user = await this.database.users.findById(id)
      await this.cache.set(`user:${id}`, user, { ttl: 300 })
      this.state.currentUser = user
    } finally {
      this.state.loading = false
    }
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const updated = await this.database.users.update(id, updates)
    await this.cache.del(`user:${id}`) // Invalidate cache
    this.state.currentUser = updated
  }
  
  // Server-specific methods
  async preloadUser(id: string): Promise<User> {
    // Direct return for SSR, no state mutation
    return this.database.users.findById(id)
  }
}

// Client-side service with API integration
@Service()
@Profile('client')
export class ClientUserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false
  }
  
  constructor(
    @Inject() private apiClient: ApiClient,
    @Inject() private localStorage: LocalStorageService
  ) {}
  
  async loadUser(id: string): Promise<void> {
    // Check local storage first
    const cached = this.localStorage.get(`user:${id}`)
    if (cached && !this.isStale(cached)) {
      this.state.currentUser = cached.data
      return
    }
    
    this.state.loading = true
    try {
      const user = await this.apiClient.get(`/users/${id}`)
      this.localStorage.set(`user:${id}`, { 
        data: user, 
        timestamp: Date.now() 
      })
      this.state.currentUser = user
    } finally {
      this.state.loading = false
    }
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const updated = await this.apiClient.patch(`/users/${id}`, updates)
    this.localStorage.del(`user:${id}`) // Invalidate local cache
    this.state.currentUser = updated
  }
  
  // Client-specific methods
  setupAutoRefresh(): void {
    setInterval(() => {
      if (this.state.currentUser) {
        this.loadUser(this.state.currentUser.id)
      }
    }, 30000)
  }
  
  private isStale(cached: any): boolean {
    return Date.now() - cached.timestamp > 60000 // 1 minute
  }
}
```

### Hydration Bridge Service

```typescript
// Special service for SSR -> Client transition
@Service()
@Profile('client')
export class HydrationBridgeService {
  hydrateUserService(
    clientService: ClientUserService,
    serverState: any
  ): void {
    // Transfer server state to client service
    if (serverState.currentUser) {
      clientService.state.currentUser = serverState.currentUser
      
      // Cache the data locally
      const localStorage = clientService['localStorage']
      localStorage.set(`user:${serverState.currentUser.id}`, {
        data: serverState.currentUser,
        timestamp: Date.now()
      })
    }
    
    // Set up client-side behaviors
    clientService.setupAutoRefresh()
  }
}
```

### Benefits
- ✅ **Environment-optimized implementations** (caching, performance)
- ✅ **Clean separation** of server vs client concerns
- ✅ **Bundle optimization** - client doesn't include server code
- ✅ **Specialized features** per environment

### Drawbacks
- ❌ **Code duplication** between implementations
- ❌ **Complex hydration logic** to bridge server -> client
- ❌ **Interface maintenance** across multiple implementations

## Pattern 3: Layered Service Architecture

### Separation of Data, Business Logic, and Presentation

```typescript
// Layer 1: Data Access Layer (Environment-specific)
interface UserRepository {
  getUser(id: string): Promise<User>
  updateUser(id: string, updates: Partial<User>): Promise<User>
  searchUsers(query: string): Promise<User[]>
}

@Service()
@Profile('server')
class DatabaseUserRepository implements UserRepository {
  constructor(@Inject() private db: Database) {}
  
  async getUser(id: string): Promise<User> {
    return this.db.users.findById(id)
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.db.users.update(id, updates)
  }
  
  async searchUsers(query: string): Promise<User[]> {
    return this.db.users.search(query)
  }
}

@Service()
@Profile('client')
class ApiUserRepository implements UserRepository {
  constructor(@Inject() private api: ApiClient) {}
  
  async getUser(id: string): Promise<User> {
    return this.api.get(`/users/${id}`)
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.api.patch(`/users/${id}`, updates)
  }
  
  async searchUsers(query: string): Promise<User[]> {
    return this.api.get(`/users/search?q=${query}`)
  }
}

// Layer 2: Business Logic Layer (Isomorphic)
@Service()
export class UserBusinessService {
  constructor(
    @Inject() private userRepository: UserRepository,
    @Inject() private validationService: ValidationService,
    @Inject() private permissionService: PermissionService
  ) {}
  
  async loadUser(id: string): Promise<User> {
    // Business logic that works on both server and client
    if (!this.permissionService.canViewUser(id)) {
      throw new Error('Insufficient permissions')
    }
    
    return this.userRepository.getUser(id)
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Validation and business rules
    const validation = await this.validationService.validateUserUpdates(updates)
    if (!validation.isValid) {
      throw new Error('Validation failed')
    }
    
    if (!this.permissionService.canEditUser(id)) {
      throw new Error('Insufficient permissions')
    }
    
    return this.userRepository.updateUser(id, updates)
  }
}

// Layer 3: Presentation Layer (Isomorphic)
@Service()
export class UserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false,
    error: null as string | null
  }
  
  constructor(
    @Inject() private userBusiness: UserBusinessService,
    @Inject() private notificationService: NotificationService
  ) {}
  
  async loadUser(id: string): Promise<void> {
    this.state.loading = true
    this.state.error = null
    
    try {
      this.state.currentUser = await this.userBusiness.loadUser(id)
    } catch (error) {
      this.state.error = error.message
      this.notificationService.showError('Failed to load user')
    } finally {
      this.state.loading = false
    }
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    try {
      this.state.currentUser = await this.userBusiness.updateUser(id, updates)
      this.notificationService.showSuccess('User updated successfully')
    } catch (error) {
      this.state.error = error.message
      this.notificationService.showError('Failed to update user')
    }
  }
}
```

### Benefits
- ✅ **Clear separation of concerns** across layers
- ✅ **Reusable business logic** regardless of environment
- ✅ **Easy testing** at each layer independently
- ✅ **Flexible data sources** can be swapped without affecting business logic

### Drawbacks
- ❌ **More complex architecture** with multiple layers
- ❌ **Potential over-engineering** for simple use cases
- ❌ **Interface maintenance overhead** across layers

## Pattern 4: Hybrid Services with SSR Context

### Services Aware of Rendering Context

```typescript
// Context-aware service that adapts behavior
export interface SSRContext {
  isServer: boolean
  isClient: boolean
  isHydrating: boolean
  request?: Request
  initialData?: any
}

@Service()
export class ContextAwareUserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false
  }
  
  constructor(
    @Inject() private ssrContext: SSRContext,
    @Inject() private serverRepo: UserRepository, // Conditional injection
    @Inject() private clientRepo: UserRepository  // Conditional injection
  ) {}
  
  private get repository(): UserRepository {
    return this.ssrContext.isServer ? this.serverRepo : this.clientRepo
  }
  
  async loadUser(id: string): Promise<void> {
    if (this.ssrContext.isServer) {
      // Server: Load immediately, no loading state
      this.state.currentUser = await this.repository.getUser(id)
      return
    }
    
    if (this.ssrContext.isHydrating && this.ssrContext.initialData) {
      // Hydration: Use initial data
      this.state.currentUser = this.ssrContext.initialData.currentUser
      return
    }
    
    // Client: Full loading experience
    this.state.loading = true
    try {
      this.state.currentUser = await this.repository.getUser(id)
    } finally {
      this.state.loading = false
    }
  }
}

// SSR Context Provider
@Service()
export class SSRContextProvider {
  createServerContext(request: Request): SSRContext {
    return {
      isServer: true,
      isClient: false,
      isHydrating: false,
      request
    }
  }
  
  createClientContext(initialData?: any): SSRContext {
    return {
      isServer: false,
      isClient: true,
      isHydrating: !!initialData,
      initialData
    }
  }
}
```

## Recommendation: Layered Architecture for Enterprise

For enterprise React applications, **Pattern 3 (Layered Architecture)** provides the best balance of:

- **Maintainability**: Clear separation of concerns
- **Testability**: Each layer can be tested independently  
- **Scalability**: Easy to add new data sources or business rules
- **Team collaboration**: Different teams can own different layers

### Implementation Strategy

```typescript
// 1. Data Layer - Environment specific
interface UserRepository { /* ... */ }
@Service() @Profile('server') class DatabaseUserRepository { /* ... */ }
@Service() @Profile('client') class ApiUserRepository { /* ... */ }

// 2. Business Layer - Isomorphic
@Service() class UserBusinessService { /* validation, permissions, business rules */ }

// 3. Presentation Layer - Reactive state management
@Service() class UserService implements UserServiceInterface { /* reactive state + UI operations */ }
```

### Container Configuration per Environment

```typescript
// server/container.ts
export function createServerContainer(): DIContainer {
  const container = new CompileTimeDIContainer()
  container.loadConfiguration(DI_CONFIG)
  
  // Override with server-specific implementations
  container.register('UserRepository', DatabaseUserRepository)
  container.register('AuthRepository', DatabaseAuthRepository)
  container.register('CacheService', RedisCache)
  
  return container
}

// client/container.ts
export function createClientContainer(initialState?: any): DIContainer {
  const container = new CompileTimeDIContainer()
  container.loadConfiguration(DI_CONFIG)
  
  // Override with client-specific implementations
  container.register('UserRepository', ApiUserRepository)
  container.register('AuthRepository', ApiAuthRepository)
  container.register('CacheService', LocalStorageCache)
  
  // Hydrate with initial state if provided
  if (initialState) {
    hydrateServiceStates(container, initialState)
  }
  
  return container
}
```

## Performance Considerations

### Service Instantiation Optimization

```typescript
// Lazy service loading for better performance
@Service()
export class LazyUserService implements UserServiceInterface {
  private _state: any = null
  private _businessService: UserBusinessService | null = null
  
  get state() {
    if (!this._state) {
      this._state = { currentUser: null, loading: false }
    }
    return this._state
  }
  
  get businessService(): UserBusinessService {
    if (!this._businessService) {
      this._businessService = this.container.get('UserBusinessService')
    }
    return this._businessService
  }
  
  async loadUser(id: string): Promise<void> {
    // Business service is only instantiated when needed
    this.state.loading = true
    try {
      this.state.currentUser = await this.businessService.loadUser(id)
    } finally {
      this.state.loading = false
    }
  }
}
```

### Memory Management

```typescript
// Service cleanup for server-side rendering
export class ServiceCleanupManager {
  private activeServices = new Set<string>()
  
  registerService(serviceName: string): void {
    this.activeServices.add(serviceName)
  }
  
  cleanupAfterRender(): void {
    // Clear service states after SSR to prevent memory leaks
    for (const serviceName of this.activeServices) {
      const service = container.get(serviceName)
      if (service.cleanup) {
        service.cleanup()
      }
    }
    this.activeServices.clear()
  }
}
```

## Best Practices Summary

### ✅ DO
- Use layered architecture for clear separation of concerns
- Implement environment-specific repositories/data providers
- Keep business logic isomorphic between server and client
- Use interfaces for all service contracts
- Implement proper cleanup for server-side services

### ❌ DON'T
- Mix server-specific code in client bundles
- Couple business logic to specific data sources
- Ignore memory cleanup on server-side
- Create deep service dependency chains
- Skip interface definitions for services