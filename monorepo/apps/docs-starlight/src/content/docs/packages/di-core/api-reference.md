---
title: '@tdi2/di-core API Reference'
description: Complete API documentation for TDI2's core dependency injection system
sidebar:
  order: 3
---

The `@tdi2/di-core` package provides the foundational dependency injection system for TDI2, including decorators, container management, and React integration.

## Installation

```bash
npm install @tdi2/di-core
# or
bun add @tdi2/di-core
```

## Core Decorators

### @Service()

Marks a class as injectable and available for dependency injection.

```typescript
import { Service } from '@tdi2/di-core';

@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    products: [] as Product[],
    loading: false
  };
  
  async loadProducts(): Promise<void> {
    this.state.loading = true;
    // Implementation
  }
}
```

**Options:**
```typescript
interface ServiceOptions {
  token?: string | symbol;  // Optional explicit token
  scope?: 'singleton' | 'transient' | 'scoped';  // Lifecycle scope
  profiles?: string[];      // Environment profiles
}
```

**Usage with Options:**
```typescript
@Service({ 
  token: 'CUSTOM_TOKEN',
  scope: 'transient'
})
export class TransientService {}
```

### @Inject()

Marks constructor parameters for dependency injection.

```typescript
@Service()
export class OrderService {
  constructor(
    @Inject() private productService: ProductServiceInterface,
    @Inject() private userService: UserServiceInterface,
    @Inject('PAYMENT_CONFIG') private config: PaymentConfig
  ) {}
}
```

**Automatic Interface Resolution:**
```typescript
// Token automatically resolved from interface type
@Service()
export class CartService {
  constructor(
    private productService: Inject<ProductServiceInterface>,
    private inventoryService: Inject<InventoryServiceInterface>
  ) {}
}
```

### @Scope()

Defines the lifecycle scope for a service (follows Spring Boot convention).

```typescript
import { Service, Scope } from '@tdi2/di-core';

@Service()
@Scope('singleton')
export class ConfigService {} // Same instance everywhere

@Service()
@Scope('transient')
export class FormService {} // New instance each injection

@Service()
@Scope('scoped')
export class RequestService {} // Scoped to DI container context
```

**Available Scopes:**
- `singleton` - One instance per container (default)
- `transient` - New instance for each injection
- `scoped` - Scoped to container lifecycle

### @Profile()

Marks services for specific environments or configurations.

```typescript
import { Service, Profile } from '@tdi2/di-core';

@Service()
@Profile('development', 'test')
export class MockPaymentService implements PaymentServiceInterface {}

@Service()
@Profile('production')
export class StripePaymentService implements PaymentServiceInterface {}
```

**Environment Activation:**
```typescript
// Via environment variables
// TDI2_PROFILES=production,logging
// ACTIVE_PROFILES=dev,test

// Via container options
const container = new CompileTimeDIContainer(undefined, {
  activeProfiles: ['development', 'external-services']
});

// Programmatically
container.setActiveProfiles(['production', 'monitoring']);
```

**Profile Negation:**
```typescript
@Service()
@Profile('!production') // Load everywhere except production
export class DebugService {}
```

### @Configuration()

Marks a class as a configuration provider that contains @Bean methods for external library integration.

```typescript
import { Configuration, Bean, Profile } from '@tdi2/di-core';

@Configuration
export class ExternalLibraryConfig {
  // Configuration methods with @Bean decorators
}

@Configuration
@Profile('external-services') // Only load when profile is active
export class ExternalServicesConfig {
  // External service configurations
}
```

**Options:**
```typescript
interface ConfigurationOptions {
  profiles?: string[];  // Environment profiles for this configuration
  priority?: number;    // Loading priority (higher loads first)
}
```

### @Bean()

Marks methods within @Configuration classes as factory functions for external services. Bean methods automatically integrate with the DI system and support all existing decorators.

```typescript
import { Configuration, Bean, Primary, Scope, Qualifier } from '@tdi2/di-core';

@Configuration
export class DatabaseConfig {
  @Bean
  @Primary
  database(): DatabaseInterface {
    return new PostgresDatabase({
      host: 'localhost',
      port: 5432
    });
  }

  @Bean
  @Qualifier('readOnlyDatabase')
  @Scope('singleton')
  readOnlyDatabase(): DatabaseInterface {
    return new PostgresDatabase({
      host: 'localhost',
      port: 5432,
      readOnly: true
    });
  }

  @Bean
  @Profile('production')
  prodDatabase(@Inject httpClient: HttpClientInterface): DatabaseInterface {
    // Dependencies are automatically injected into @Bean methods
    return new CloudDatabase({
      client: httpClient,
      region: 'us-east-1'
    });
  }
}
```

**Key Features:**
- **Automatic Interface Resolution**: Return type determines the service interface
- **Dependency Injection**: Parameters are automatically injected using @Inject
- **Decorator Support**: Works with @Primary, @Scope, @Qualifier, @Profile
- **Profile Inheritance**: Inherits configuration profiles unless overridden
- **Clean Architecture**: No string tokens needed, uses existing decorator system

**Usage with Qualifiers:**
```typescript
@Configuration
export class LoggingConfig {
  @Bean
  @Primary
  consoleLogger(): LoggerInterface {
    return new ConsoleLogger();
  }

  @Bean
  @Qualifier('fileLogger')
  fileLogger(): LoggerInterface {
    return new FileLogger('/var/log/app.log');
  }

  @Bean
  @Qualifier('remoteLogger')
  @Profile('production')
  remoteLogger(@Inject emailService: EmailServiceInterface): LoggerInterface {
    return new RemoteLogger({ emailService });
  }
}

// In services, inject specific implementations
@Service()
export class UserService {
  constructor(
    @Inject logger: LoggerInterface, // Gets primary (console)
    @Inject @Qualifier('fileLogger') fileLogger: LoggerInterface // Gets file logger
  ) {}
}
```

### @Optional()

Marks an injection as optional (won't throw if dependency is missing).

```typescript
@Service()
export class EmailService {
  constructor(
    @Inject() private smtpConfig: SMTPConfig,
    @Inject() @Optional() private logger?: LoggerService
  ) {}
}
```

### @Autowired

Alias for `@Inject()` providing Spring Boot familiarity.

```typescript
import { Service, Autowired } from '@tdi2/di-core';

@Service()
export class UserService {
  constructor(
    @Autowired private httpClient: HttpClient,
    @Autowired private cacheService: CacheService
  ) {}
}
```

## Container API

### CompileTimeDIContainer

The main dependency injection container that manages service registration and resolution.

```typescript
import { CompileTimeDIContainer } from '@tdi2/di-core';

// Basic container
const container = new CompileTimeDIContainer();

// Container with options
const container = new CompileTimeDIContainer(undefined, {
  verbose: true,
  activeProfiles: ['development', 'external-services']
});
```

#### Methods

**register<T>(token, implementation, scope?)**

Registers a service with the container.

```typescript
// Register with explicit token
container.register('USER_SERVICE', UserService);

// Register with scope
container.register('FORM_SERVICE', FormService, 'transient');

// Register factory function
container.register('CONFIG', () => ({
  apiUrl: process.env.API_URL,
  timeout: 5000
}));
```

**get<T>(token)**

Retrieves a service instance from the container.

```typescript
const userService = container.get<UserServiceInterface>('USER_SERVICE');
const config = container.get<AppConfig>('CONFIG');
```

**has(token)**

Checks if a service is registered.

```typescript
if (container.has('OPTIONAL_SERVICE')) {
  const service = container.get('OPTIONAL_SERVICE');
}
```

**createScope()**

Creates a new scoped container for managing scoped services.

```typescript
const requestScope = container.createScope();
// Services with @Scope('scoped') will be bound to this scope
```

**loadConfiguration(config)**

Loads service configuration from DI configuration object.

```typescript
import { DI_CONFIG } from './di-config';

container.loadConfiguration(DI_CONFIG);
```

**loadContainerConfiguration(config)**

Loads full container configuration including profiles and configuration classes.

```typescript
const config = {
  diMap: DI_CONFIG,
  interfaceMapping: INTERFACE_MAPPING,
  configurations: CONFIGURATION_CLASSES,
  profiles: ['production', 'external-services']
};

container.loadContainerConfiguration(config);
```

**setActiveProfiles(profiles)**

Sets the active profiles for the container.

```typescript
container.setActiveProfiles(['development', 'testing']);
// Only services with matching profiles will be loaded
```

**addActiveProfiles(profiles)**

Adds additional profiles to the active set.

```typescript
container.addActiveProfiles(['debugging']);
// Adds to existing active profiles
```

**getActiveProfiles()**

Gets the currently active profiles.

```typescript
const profiles = container.getActiveProfiles();
console.log('Active profiles:', profiles);
```

**isProfileActive(profile)**

Checks if a specific profile is active.

```typescript
if (container.isProfileActive('production')) {
  // Production-specific logic
}
```

## React Integration

### DIProvider

React context provider that makes the DI container available to components.

```typescript
import { DIProvider, CompileTimeDIContainer } from '@tdi2/di-core';
import { DI_CONFIG } from './di-config';

function App() {
  const container = new CompileTimeDIContainer();
  container.loadConfiguration(DI_CONFIG);
  
  return (
    <DIProvider container={container}>
      <MainComponent />
    </DIProvider>
  );
}
```

**Props:**
- `container: DIContainer` - The DI container instance
- `children: ReactNode` - Child components

### useService Hook

React hook for accessing services in functional components.

```typescript
import { useService } from '@tdi2/di-core';

function ProductList() {
  const productService = useService<ProductServiceInterface>('PRODUCT_SERVICE');
  
  return (
    <div>
      {productService.state.products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Lifecycle Interfaces

Services can implement lifecycle interfaces for automatic lifecycle management.

### OnMount / OnUnmount

For React component-like lifecycle (when service is first used/released).

```typescript
import { Service, OnMount, OnUnmount } from '@tdi2/di-core';

@Service()
export class WebSocketService implements OnMount, OnUnmount {
  private socket: WebSocket;
  
  onMount(): void {
    this.socket = new WebSocket('ws://localhost:8080');
    console.log('WebSocket service mounted');
  }
  
  onUnmount(): void {
    this.socket?.close();
    console.log('WebSocket service unmounted');
  }
}
```

### OnInit / OnDestroy

For service initialization and cleanup.

```typescript
@Service()
export class DatabaseService implements OnInit, OnDestroy {
  private connection: DatabaseConnection;
  
  onInit(): void {
    this.connection = new DatabaseConnection();
    console.log('Database service initialized');
  }
  
  onDestroy(): void {
    this.connection?.close();
    console.log('Database service destroyed');
  }
}
```

## Type Definitions

### Core Types

```typescript
// Service factory function type
type ServiceFactory<T> = (container: DIContainer) => T;

// DI container interface
interface DIContainer {
  register<T>(token: string | symbol, implementation: any, scope?: string): void;
  resolve<T>(token: string | symbol): T;
  has(token: string | symbol): boolean;
  createScope(): DIContainer;
  loadConfiguration(config: DIMap): void;
  loadContainerConfiguration(config: ContainerConfiguration): void;
  setActiveProfiles(profiles: string[]): void;
  addActiveProfiles(profiles: string[]): void;
  getActiveProfiles(): string[];
  isProfileActive(profile: string): boolean;
}

// Container options
interface DIContainerOptions {
  verbose?: boolean;
  activeProfiles?: string[];
}

// Service options for @Service decorator
interface ServiceOptions {
  token?: string | symbol;
  scope?: 'singleton' | 'transient' | 'scoped';
  profiles?: string[];
  primary?: boolean;
  qualifier?: string;
}

// Configuration options for @Configuration decorator
interface ConfigurationOptions {
  profiles?: string[];
  priority?: number;
}

// Full container configuration
interface ContainerConfiguration {
  diMap: DIMap;
  interfaceMapping: InterfaceMapping;
  configurations: ConfigurationMetadata[];
  profiles?: string[];
  environment?: string;
}

// Configuration class metadata
interface ConfigurationMetadata {
  className: string;
  filePath: string;
  profiles: string[];
  priority: number;
  beans: BeanMetadata[];
}

// Bean method metadata
interface BeanMetadata {
  methodName: string | symbol;
  returnType: string;
  parameters: BeanParameterMetadata[];
  scope: 'singleton' | 'transient' | 'scoped';
  primary: boolean;
  qualifier?: string;
  autoResolve: boolean;
  profiles?: string[];
}

// Bean parameter metadata
interface BeanParameterMetadata {
  parameterName: string;
  parameterType: string;
  isOptional: boolean;
  qualifier?: string;
}
```

### Marker Types

For functional component injection:

```typescript
// Inject marker for functional components
type Inject<T> = T;

// Service props pattern
interface ServicesProps {
  productService: Inject<ProductServiceInterface>;
  cartService: Inject<CartServiceInterface>;
}

// Component with service injection
function ShoppingCart({ productService, cartService }: ServicesProps) {
  // Implementation
}
```

## Advanced Usage

### Configuration-Based External Libraries

Use @Configuration and @Bean to wrap external libraries:

```typescript
@Configuration
@Profile('external-services')
export class ExternalLibraryConfig {
  @Bean
  @Primary
  httpClient(): HttpClientInterface {
    return new AxiosHttpClient({
      timeout: 5000,
      retries: 3
    });
  }

  @Bean
  @Qualifier('fileLogger')
  @Profile('production')
  prodLogger(): LoggerInterface {
    return new WinstonLogger({
      level: 'error',
      filename: '/var/log/app.log'
    });
  }

  @Bean
  redisCache(@Inject config: ConfigServiceInterface): CacheInterface {
    return new RedisCache({
      host: config.redis.host,
      port: config.redis.port
    });
  }
}

// Usage in services
@Service()
export class UserService {
  constructor(
    @Inject private httpClient: HttpClientInterface, // Gets AxiosHttpClient
    @Inject @Qualifier('fileLogger') private logger: LoggerInterface // Gets WinstonLogger in prod
  ) {}
}
```

### Custom Service Factories

Register complex service creation logic:

```typescript
container.register('DATABASE', (container) => {
  const config = container.get<DatabaseConfig>('DATABASE_CONFIG');
  return new DatabaseService({
    host: config.host,
    port: config.port,
    credentials: container.get<Credentials>('DB_CREDENTIALS')
  });
});
```

### Conditional Registration

Register different implementations based on environment:

```typescript
if (process.env.NODE_ENV === 'production') {
  container.register('PAYMENT_SERVICE', StripePaymentService);
} else {
  container.register('PAYMENT_SERVICE', MockPaymentService);
}
```

### Service Hierarchies

Create child containers with inherited services:

```typescript
const globalContainer = new CompileTimeDIContainer();
globalContainer.register('GLOBAL_CONFIG', GlobalConfig);

const moduleContainer = new CompileTimeDIContainer(globalContainer);
moduleContainer.register('MODULE_SERVICE', ModuleService);

// ModuleService can access GLOBAL_CONFIG through parent container
```

## Error Handling

### Common Errors

**ServiceNotFoundError**
```typescript
try {
  const service = container.get('NONEXISTENT_SERVICE');
} catch (error) {
  if (error.name === 'ServiceNotFoundError') {
    console.error('Service not registered:', error.token);
  }
}
```

**CircularDependencyError**
```typescript
// TDI2 detects circular dependencies at compile time
// Error: Circular dependency detected: A -> B -> A
```

**ScopeError**
```typescript
// Error: Cannot inject transient service into singleton
// Solution: Use factory pattern or adjust scopes
```

## Best Practices

### 1. Use Interface-Based Injection
```typescript
// Good: Interface-based
@Service()
export class EmailService implements EmailServiceInterface {
  async sendEmail(to: string, subject: string): Promise<void> {}
}

// Usage
constructor(private emailService: Inject<EmailServiceInterface>) {}
```

### 2. Explicit Service Boundaries
```typescript
// Good: Clear service responsibility
@Service()
export class OrderService {
  constructor(
    private paymentService: Inject<PaymentServiceInterface>,
    private inventoryService: Inject<InventoryServiceInterface>,
    private notificationService: Inject<NotificationServiceInterface>
  ) {}
}
```

### 3. Proper Scope Management
```typescript
// Stateless services: singleton (default)
@Service()
export class UtilityService {}

// Stateful per-request services: transient  
@Service()
@Scope('transient')
export class FormService {}
```

### 4. Profile-Based Configuration
```typescript
@Service()
@Profile('test')
export class MockEmailService implements EmailServiceInterface {
  async sendEmail(): Promise<void> {
    console.log('Mock email sent');
  }
}

@Service()
@Profile('production')
export class SMTPEmailService implements EmailServiceInterface {
  async sendEmail(): Promise<void> {
    // Real SMTP implementation
  }
}
```

### 5. Configuration Classes for External Libraries
```typescript
// Good: Clean separation of external library configuration
@Configuration
@Profile('external-services')
export class ExternalLibConfig {
  @Bean
  @Primary
  httpClient(): HttpClientInterface {
    return new AxiosHttpClient({ timeout: 5000 });
  }

  @Bean
  @Qualifier('authClient')
  authHttpClient(@Inject config: AuthConfigInterface): HttpClientInterface {
    return new AxiosHttpClient({
      baseURL: config.authUrl,
      headers: { 'Authorization': `Bearer ${config.token}` }
    });
  }
}

// Usage: Clean dependency injection
@Service()
export class UserService {
  constructor(
    @Inject private httpClient: HttpClientInterface,
    @Inject @Qualifier('authClient') private authClient: HttpClientInterface
  ) {}
}
```

### 6. Environment-Aware Services
```typescript
// Good: Environment-specific implementations
@Configuration
export class DatabaseConfig {
  @Bean
  @Profile('development', 'test')
  devDatabase(): DatabaseInterface {
    return new SQLiteDatabase(':memory:');
  }

  @Bean
  @Profile('production')
  prodDatabase(@Inject config: ConfigServiceInterface): DatabaseInterface {
    return new PostgresDatabase({
      host: config.database.host,
      credentials: config.database.credentials
    });
  }
}
```

## Migration from Other DI Systems

### From Manual Dependency Management
```typescript
// Before: Manual instantiation
const apiClient = new ApiClient();
const userService = new UserService(apiClient);
const cartService = new CartService(apiClient, userService);

// After: DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);
// All dependencies resolved automatically
```

### From React Context
```typescript
// Before: Context providers
<ApiProvider>
  <UserProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </UserProvider>
</ApiProvider>

// After: Single DI provider
<DIProvider container={container}>
  <App />
</DIProvider>
```

This API reference covers all major features of `@tdi2/di-core`. For complete examples and integration patterns, see the [Quick Start Guide](/getting-started/quick-start) and [E-Commerce Case Study](/examples/ecommerce-case-study).