---
title: 'Features & Implementation Roadmap'
description: Complete feature matrix, implementation status, and production readiness assessment for TDI2's Spring Boot-style decorators and advanced patterns.
---

TDI2 follows Spring Boot conventions for familiar enterprise patterns. This guide covers implemented features, roadmap items, and production readiness assessment.

## Current Implementation Status

### ✅ **Core Features** (Production Ready)

| Feature | Description | Implementation Status | Spring Boot Equivalent |
|---------|-------------|----------------------|------------------------|
| **@Service** | Service registration decorator | ✅ Complete | `@Service`, `@Component` |
| **@Inject** | Dependency injection decorator | ✅ Complete | `@Autowired` |
| **@Scope** | Scope management (singleton/transient) | ✅ Complete | `@Scope("singleton")` |
| **Interface Resolution** | Automatic interface → implementation mapping | ✅ Complete | Type-based autowiring |
| **Container** | DI container with lifecycle management | ✅ Complete | `ApplicationContext` |
| **React Integration** | `useService` hook and component transformation | ✅ Complete | N/A (React-specific) |

### 🚧 **In Development** (Next Release)

| Feature | Description | Implementation Status | Priority | ETA |
|---------|-------------|----------------------|----------|-----|
| **@PostConstruct** | Post-construction lifecycle hook | 🟡 Decorator exists, runtime needed | High | Q2 2024 |
| **@PreDestroy** | Pre-destruction lifecycle hook | 🟡 Decorator exists, runtime needed | High | Q2 2024 |
| **@Profile** | Profile-based service activation | 🟡 Decorator exists, runtime needed | Medium | Q3 2024 |

### 📋 **Planned Features** (Future Releases)

| Feature | Description | Complexity | Priority | ETA |
|---------|-------------|------------|----------|-----|
| **@Configuration** | Configuration class decorator | Medium | Medium | Q3 2024 |
| **@Bean** | Bean definition decorator | Medium | Medium | Q3 2024 |
| **@Qualifier** | Service disambiguation | Low | Low | Q4 2024 |
| **@Value** | Environment value injection | Low | Low | Q4 2024 |

## Feature Deep Dive

### Core Features (Available Now)

#### @Service Decorator

```typescript
// Basic service registration
@Service()
export class ProductService implements ProductServiceInterface {
  state = { products: [] as Product[] };
}

// With explicit scope
@Service()
@Scope("singleton")  // Default behavior
export class ConfigService {
  // Single instance across application
}

@Service()
@Scope("transient")  // New instance each injection
export class RequestLogger {
  // Fresh instance for each component
}
```

#### Advanced @Inject Patterns

```typescript
// Interface-based injection (recommended)
@Service()
export class OrderService {
  constructor(
    @Inject() private paymentService: PaymentServiceInterface,
    @Inject() private emailService: EmailServiceInterface,
    @Inject() private logger?: LoggerServiceInterface  // Optional dependency
  ) {}
}

// Functional component injection
function CheckoutFlow({
  orderService,
  paymentService
}: {
  orderService: Inject<OrderServiceInterface>;
  paymentService: Inject<PaymentServiceInterface>;
}) {
  // Services automatically injected via build-time transformation
}
```

### Lifecycle Features (Next Release)

#### @PostConstruct Implementation

**Current Status**: Decorator exists, runtime implementation in progress

```typescript
@Service()
export class DatabaseService {
  private connection: Connection | null = null;
  
  @PostConstruct
  async initialize(): Promise<void> {
    // Called after all dependencies injected
    this.connection = await createConnection(this.config);
    console.log('Database connection established');
  }
  
  constructor(
    @Inject() private config: DatabaseConfig
  ) {}
}
```

**Implementation Plan**:
- **Phase 1**: Container calls `@PostConstruct` methods after instantiation
- **Phase 2**: Support async initialization with dependency ordering
- **Phase 3**: Error handling and initialization retry logic

#### @PreDestroy Implementation

**Current Status**: Decorator exists, runtime implementation in progress

```typescript
@Service()
export class CacheService {
  private cache = new Map();
  
  @PreDestroy
  async cleanup(): Promise<void> {
    // Called before service destruction
    this.cache.clear();
    await this.flushPendingWrites();
    console.log('Cache service cleaned up');
  }
}
```

**Implementation Plan**:
- **Phase 1**: Container calls `@PreDestroy` on application shutdown
- **Phase 2**: React component unmount cleanup integration
- **Phase 3**: Graceful shutdown with timeout handling

#### @Profile Implementation

**Current Status**: Decorator exists, runtime profile filtering needed

```typescript
@Service()
@Profile("development")
export class MockEmailService implements EmailServiceInterface {
  sendEmail(to: string, message: string): Promise<void> {
    console.log(`Mock email to ${to}: ${message}`);
    return Promise.resolve();
  }
}

@Service()
@Profile("production")
export class SmtpEmailService implements EmailServiceInterface {
  sendEmail(to: string, message: string): Promise<void> {
    return this.smtpClient.send({ to, body: message });
  }
}

// Multiple profile support
@Service()
@Profile(["staging", "production"])
export class RedisCache implements CacheServiceInterface {
  // Only active in staging or production
}
```

**Implementation Plan**:
- **Phase 1**: Environment-based profile activation (NODE_ENV)
- **Phase 2**: Custom profile configuration and runtime switching
- **Phase 3**: Conditional profiles with expressions

### Configuration Features (Q3 2024)

#### @Configuration Classes

**Planned Implementation**:

```typescript
@Configuration()
export class DatabaseConfiguration {
  
  @Bean()
  @Profile("development")
  createDevDatabase(): DatabaseConnection {
    return new SqliteConnection('dev.db');
  }
  
  @Bean()
  @Profile("production")
  createProdDatabase(
    @Inject() config: EnvironmentConfig
  ): DatabaseConnection {
    return new PostgresConnection({
      host: config.DB_HOST,
      port: config.DB_PORT,
      database: config.DB_NAME
    });
  }
  
  @Bean()
  createConnectionPool(
    @Inject() database: DatabaseConnection
  ): ConnectionPool {
    return new ConnectionPool(database, { maxConnections: 20 });
  }
}
```

**Benefits**:
- External library integration without wrapping
- Environment-specific bean creation
- Method-level dependency injection
- Factory pattern support

## Production Readiness Assessment

### ✅ **Production Ready** (Can Use Today)

**Core DI Functionality**:
- Service registration and dependency injection
- Interface-based resolution
- Singleton and transient scopes
- Type-safe container operations
- React component transformation
- Testing framework integration

**Code Reduction Impact**:
- **90-95% reduction** in AST transformation boilerplate
- **80-85% reduction** in manual dependency wiring
- **70-75% reduction** in prop drilling code

**Performance Characteristics**:
- **O(1) service lookup** via compile-time resolution
- **Zero runtime reflection** overhead
- **Tree-shakable** service registration
- **Memory efficient** singleton management

### 🚧 **Production Blockers** (Address Before Enterprise Use)

**Critical Missing Features** (4-6 days development):

1. **Lifecycle Management** (@PostConstruct/@PreDestroy)
   - **Impact**: Services can't properly initialize/cleanup
   - **Effort**: Medium (3-5 days)
   - **Workaround**: Manual initialization in constructors

2. **State Ownership Guidelines**
   - **Impact**: Teams need clear service vs component state patterns
   - **Effort**: Easy (1 day documentation)
   - **Workaround**: Follow existing documentation patterns

### 🔬 **Advanced Features** (Post-MVP)

**Nice-to-Have Enhancements**:
- Enhanced debugging and introspection tools
- React DevTools integration
- Advanced scoping models (request, tree, component)
- Server-side rendering support
- Automatic code-splitting integration

## Implementation Priority Roadmap

### **Sprint 1** (Production MVP - 4-6 days)
1. **@PostConstruct runtime support** (3 days)
   - Container calls lifecycle methods after instantiation
   - Async initialization support
   - Error handling for initialization failures

2. **@PreDestroy runtime support** (2 days)
   - Application shutdown lifecycle
   - Component unmount cleanup integration
   - Graceful shutdown with timeout

3. **State ownership documentation** (1 day)
   - Service vs component state guidelines
   - Best practices for state placement
   - Anti-patterns to avoid

### **Sprint 2** (Developer Experience - 1-2 weeks)
1. **@Profile runtime implementation**
   - Environment-based activation
   - Multi-profile support
   - Runtime profile switching

2. **Enhanced debugging tools**
   - Dependency graph visualization
   - Service lifecycle monitoring
   - Performance metrics collection

3. **Testing framework enhancements**
   - Improved mocking utilities
   - Integration test helpers
   - Migration guides for existing tests

### **Sprint 3** (Advanced Features - 2-3 weeks)
1. **@Configuration and @Bean support**
   - Configuration class processing
   - Method-level dependency injection
   - Factory pattern support

2. **Tree-scoped providers**
   - React tree integration
   - Provider boundary management
   - Multi-tenant service isolation

3. **SSR preparation**
   - Request-scoped containers
   - Server/client state synchronization
   - Hydration safety measures

## Technical Implementation Notes

### AST Transformation Pipeline
Current codebase uses sophisticated TypeScript AST manipulation:
- **800+ lines** reduced to **50-100 lines** with optimized libraries
- **ts-query + ts-morph** recommended for 90% code reduction
- **jscodeshift** as fallback for complex transformations

### Container Architecture
- **Singleton management** with lazy instantiation
- **Circular dependency detection** with clear error messages
- **Interface-based tokens** prevent naming collisions
- **Compile-time validation** catches configuration errors

### React Integration
- **Functional component transformation** at build time
- **useSnapshot integration** for reactive state updates
- **StrictMode compatibility** with idempotent factories
- **Hot reload support** with development mode optimization

## Migration Strategy

### For Existing React Applications

**Phase 1**: Start with new features using TDI2 patterns
```typescript
// New feature uses TDI2
@Service()
export class NewFeatureService {
  // Implementation with DI patterns
}

// Existing components unchanged
function ExistingComponent() {
  // Keep current patterns during transition
}
```

**Phase 2**: Gradually refactor complex components
```typescript
// Before: Complex component with multiple concerns
function ComplexComponent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  // ... 50+ lines of state management
}

// After: Simple template with service injection
function ComplexComponent({ userService }: { userService: Inject<UserServiceInterface> }) {
  const { users, loading } = userService.state;
  return <UserList users={users} loading={loading} />;
}
```

**Phase 3**: Enterprise-wide adoption with team training and guidelines

### Best Practices for Production Deployment

1. **Start Small**: Begin with isolated features or new components
2. **Team Training**: Ensure developers understand DI patterns and service design
3. **Testing Strategy**: Implement comprehensive service and integration testing
4. **Performance Monitoring**: Track bundle size and runtime performance impacts
5. **Gradual Rollout**: Phase adoption across team and application areas
6. **Documentation**: Maintain clear service interfaces and usage examples

The current implementation provides a solid foundation for enterprise React applications, with the lifecycle management features completing the production readiness requirements.