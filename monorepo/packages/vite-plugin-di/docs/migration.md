# Migration Guide

This guide helps you migrate to @tdi2/vite-plugin-di from other dependency injection solutions or upgrade from earlier versions.

## Table of Contents

- [From Manual Token-Based DI](#from-manual-token-based-di)
- [From React Context API](#from-react-context-api)
- [From InversifyJS](#from-inversifyjs)
- [From Angular DI](#from-angular-di)
- [From Other Vite DI Plugins](#from-other-vite-di-plugins)
- [Upgrading from Earlier Versions](#upgrading-from-earlier-versions)

## From Manual Token-Based DI

### Before: Manual Token Management

```typescript
// ❌ Old approach with manual tokens
export const USER_SERVICE_TOKEN = 'USER_SERVICE_TOKEN';
export const LOGGER_TOKEN = 'LOGGER_TOKEN';
export const CACHE_TOKEN = 'CACHE_TOKEN';

// Manual registration
container.register(USER_SERVICE_TOKEN, UserService);
container.register(LOGGER_TOKEN, ConsoleLogger);
container.register(CACHE_TOKEN, MemoryCache);

// Manual injection with tokens
@Service({ token: USER_SERVICE_TOKEN })
export class UserService {
  constructor(
    @Inject(LOGGER_TOKEN) private logger: LoggerInterface,
    @Inject(CACHE_TOKEN) private cache: CacheInterface
  ) {}
}

// Manual resolution
const userService = container.resolve<UserService>(USER_SERVICE_TOKEN);
```

### After: Interface-Based Automatic Resolution

```typescript
// ✅ New approach with interface-based resolution
// No tokens needed!

@Service()
export class UserService implements UserServiceInterface {
  constructor(
    @Inject() private logger: LoggerInterface,     // Auto-resolved!
    @Inject() private cache: CacheInterface       // Auto-resolved!
  ) {}
}

@Service()
export class ConsoleLogger implements LoggerInterface {
  log(message: string) { console.log(message); }
}

@Service() 
export class MemoryCache implements CacheInterface {
  // Implementation...
}

// Auto-generated DI configuration
import { DI_CONFIG } from './.tdi2/di-config';
container.loadConfiguration(DI_CONFIG);
```

### Migration Steps

1. **Remove token constants**
   ```bash
   # Delete token files
   rm src/tokens/service-tokens.ts
   rm src/constants/di-tokens.ts
   ```

2. **Update service decorators**
   ```typescript
   // Before
   @Service({ token: 'USER_SERVICE_TOKEN' })
   
   // After  
   @Service() // Token automatically resolved from interface
   ```

3. **Update inject decorators**
   ```typescript
   // Before
   constructor(@Inject('LOGGER_TOKEN') private logger: LoggerInterface)
   
   // After
   constructor(@Inject() private logger: LoggerInterface)
   ```

4. **Install and configure plugin**
   ```bash
   npm install @tdi2/vite-plugin-di @tdi2/di-core
   ```

   ```typescript
   // vite.config.ts
   import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';
   
   export default defineConfig({
     plugins: [
       diEnhancedPlugin({
         enableInterfaceResolution: true,
       }),
       react(),
     ],
   });
   ```

5. **Update bootstrap code**
   ```typescript
   // Before
   const container = new Container();
   container.register('USER_SERVICE_TOKEN', UserService);
   
   // After
   import { DI_CONFIG } from './.tdi2/di-config';
   const container = new CompileTimeDIContainer();
   container.loadConfiguration(DI_CONFIG);
   ```

## From React Context API

### Before: Provider Hell and Manual Wiring

```typescript
// ❌ Multiple providers and manual context management
const UserContext = createContext<UserService | null>(null);
const LoggerContext = createContext<LoggerService | null>(null);
const CacheContext = createContext<CacheService | null>(null);

function App() {
  const userService = new UserService();
  const loggerService = new ConsoleLogger();
  const cacheService = new MemoryCache();

  return (
    <UserContext.Provider value={userService}>
      <LoggerContext.Provider value={loggerService}>
        <CacheContext.Provider value={cacheService}>
          <UserProfile />
        </CacheContext.Provider>
      </LoggerContext.Provider>
    </UserContext.Provider>
  );
}

function UserProfile() {
  const userService = useContext(UserContext);
  const logger = useContext(LoggerContext);
  
  if (!userService || !logger) {
    throw new Error('Services not available');
  }
  
  // Component logic...
}
```

### After: Single DI Provider with Auto-Injection

```typescript
// ✅ Single DI provider with automatic injection
function App() {
  const container = new CompileTimeDIContainer();
  container.loadConfiguration(DI_CONFIG); // Auto-generated
  
  return (
    <DIProvider container={container}>
      <UserProfile userId="123" />
    </DIProvider>
  );
}

// Services automatically injected based on interface types
function UserProfile(props: {
  userId: string;
  services: {
    userService: Inject<UserServiceInterface>;
    logger: Inject<LoggerInterface>;
    cache?: InjectOptional<CacheInterface>;
  };
}) {
  const { userId, services } = props;
  
  // Services are guaranteed to be available
  const user = await services.userService.getUser(userId);
  services.logger.log(`Loaded user: ${user.name}`);
  
  // Component logic...
}
```

### Migration Steps

1. **Replace Context providers**
   ```typescript
   // Remove all individual context providers
   // Replace with single DIProvider
   <DIProvider container={container}>
     <App />
   </DIProvider>
   ```

2. **Update component props**
   ```typescript
   // Before: useContext hooks
   const userService = useContext(UserContext);
   
   // After: services prop
   function Component(props: {
     services: {
       userService: Inject<UserServiceInterface>;
     };
   }) {
     // Use props.services.userService
   }
   ```

3. **Remove context definitions**
   ```typescript
   // Delete these files:
   // src/contexts/UserContext.ts
   // src/contexts/LoggerContext.ts
   // src/hooks/useUserService.ts
   ```

## From InversifyJS

### Before: InversifyJS Container

```typescript
// ❌ InversifyJS with symbols and container binding
import { Container, injectable, inject } from 'inversify';
import 'reflect-metadata';

const TYPES = {
  UserService: Symbol.for('UserService'),
  LoggerService: Symbol.for('LoggerService'),
  CacheService: Symbol.for('CacheService'),
};

@injectable()
class UserService {
  constructor(
    @inject(TYPES.LoggerService) private logger: LoggerInterface,
    @inject(TYPES.CacheService) private cache: CacheInterface
  ) {}
}

const container = new Container();
container.bind<UserServiceInterface>(TYPES.UserService).to(UserService);
container.bind<LoggerInterface>(TYPES.LoggerService).to(ConsoleLogger);
container.bind<CacheInterface>(TYPES.CacheService).to(MemoryCache);
```

### After: TDI2 Interface Resolution

```typescript
// ✅ TDI2 with automatic interface resolution
// No symbols or manual binding needed!

@Service()
export class UserService implements UserServiceInterface {
  constructor(
    @Inject() private logger: LoggerInterface,     // Auto-resolved
    @Inject() private cache: CacheInterface       // Auto-resolved
  ) {}
}

@Service()
export class ConsoleLogger implements LoggerInterface {
  // Implementation...
}

@Service()
export class MemoryCache implements CacheInterface {
  // Implementation...
}

// Automatic container configuration
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG); // Auto-generated
```

### Migration Steps

1. **Remove InversifyJS dependencies**
   ```bash
   npm uninstall inversify reflect-metadata
   npm install @tdi2/di-core @tdi2/vite-plugin-di
   ```

2. **Replace decorators**
   ```typescript
   // Before
   import { injectable, inject } from 'inversify';
   @injectable()
   
   // After
   import { Service, Inject } from '@tdi2/di-core/decorators';
   @Service()
   ```

3. **Remove symbol definitions**
   ```typescript
   // Delete TYPES object and Symbol definitions
   // Interface names are used automatically
   ```

4. **Update container setup**
   ```typescript
   // Before
   const container = new Container();
   container.bind<UserService>(TYPES.UserService).to(UserService);
   
   // After
   const container = new CompileTimeDIContainer();
   container.loadConfiguration(DI_CONFIG);
   ```

## From Angular DI

### Before: Angular Dependency Injection

```typescript
// ❌ Angular-style DI with providers and injection tokens
import { Injectable, Inject, InjectionToken } from '@angular/core';

const LOGGER_TOKEN = new InjectionToken<LoggerInterface>('LoggerInterface');
const CACHE_TOKEN = new InjectionToken<CacheInterface>('CacheInterface');

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    @Inject(LOGGER_TOKEN) private logger: LoggerInterface,
    @Inject(CACHE_TOKEN) private cache: CacheInterface
  ) {}
}

// Module configuration
@NgModule({
  providers: [
    { provide: LOGGER_TOKEN, useClass: ConsoleLogger },
    { provide: CACHE_TOKEN, useClass: MemoryCache },
    UserService,
  ],
})
export class AppModule {}
```

### After: TDI2 Interface Resolution

```typescript
// ✅ TDI2 with React and automatic resolution
@Service()
export class UserService implements UserServiceInterface {
  constructor(
    @Inject() private logger: LoggerInterface,     // Auto-resolved
    @Inject() private cache: CacheInterface       // Auto-resolved
  ) {}
}

// No module configuration needed - automatic!
```

### Migration Steps

1. **Replace Angular decorators**
   ```typescript
   // Before
   import { Injectable, Inject } from '@angular/core';
   @Injectable({ providedIn: 'root' })
   
   // After
   import { Service, Inject } from '@tdi2/di-core/decorators';
   @Service()
   ```

2. **Remove injection tokens**
   ```typescript
   // Delete InjectionToken definitions
   // Use interface names directly
   ```

3. **Replace NgModule providers**
   ```typescript
   // Before: Manual provider configuration
   @NgModule({ providers: [...] })
   
   // After: Automatic configuration via Vite plugin
   ```

## From Other Vite DI Plugins

### From vite-plugin-dependency-injection

```typescript
// Before
import { dependencyInjection } from 'vite-plugin-dependency-injection';

export default defineConfig({
  plugins: [
    dependencyInjection({
      services: './src/services',
      containers: './src/containers',
    }),
  ],
});

// After
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      srcDir: './src',
      enableInterfaceResolution: true,
    }),
  ],
});
```

### From vite-plugin-inversify

```typescript
// Before
import { inversifyPlugin } from 'vite-plugin-inversify';

export default defineConfig({
  plugins: [
    inversifyPlugin({
      containerPath: './src/container.ts',
    }),
  ],
});

// After
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      enableInterfaceResolution: true,
      enableFunctionalDI: true,
    }),
  ],
});
```

## Upgrading from Earlier Versions

### From v0.x to v1.x

#### Breaking Changes

1. **Configuration structure changed**
   ```typescript
   // Before v1.0
   diPlugin({
     enable: true,
     interfaceMode: true,
   })
   
   // After v1.0
   diEnhancedPlugin({
     enableInterfaceResolution: true,
     enableFunctionalDI: true,
   })
   ```

2. **Debug endpoints moved**
   ```typescript
   // Before: /_tdi2_debug
   // After: /_di_debug
   ```

3. **Bridge files location changed**
   ```typescript
   // Before: ./generated/.tdi2/
   // After: ./src/.tdi2/
   ```

#### Migration Steps

1. **Update plugin import and configuration**
   ```bash
   npm update @tdi2/vite-plugin-di
   ```

2. **Update Vite configuration**
   ```typescript
   // Update plugin configuration
   diEnhancedPlugin({
     enableInterfaceResolution: true,
     enableFunctionalDI: true,
     verbose: true,
   })
   ```

3. **Update import paths**
   ```typescript
   // Before
   import { DI_CONFIG } from './generated/.tdi2/di-config';
   
   // After
   import { DI_CONFIG } from './.tdi2/di-config';
   ```

4. **Clean old generated files**
   ```bash
   rm -rf src/generated/.tdi2
   npm run di:clean
   ```

## Common Migration Issues

### Issue: "Service not registered" errors

**Cause:** Services not properly detected by the new interface resolution

**Solution:**
```typescript
// Ensure services implement interfaces
@Service()
export class UserService implements UserServiceInterface {
  // Must implement the interface
}

// Check plugin configuration
diEnhancedPlugin({
  enableInterfaceResolution: true,  // Must be enabled
  verbose: true,                    // See what's happening
})
```

### Issue: Hot reload not working

**Cause:** Watch mode disabled or incorrect file patterns

**Solution:**
```typescript
diEnhancedPlugin({
  watch: true,                      // Enable hot reload
  advanced: {
    fileExtensions: ['.ts', '.tsx'], // Include all relevant files
  }
})
```

### Issue: Interface resolution failures

**Cause:** Ambiguous interface implementations

**Solution:**
```typescript
// Use qualifiers for multiple implementations
@Service()
@Primary()
export class ProductionLogger implements LoggerInterface {}

@Service()
@Qualifier('development')
export class DevLogger implements LoggerInterface {}

// Or use specific interface names
export interface ProductionLoggerInterface extends LoggerInterface {}
export interface DevLoggerInterface extends LoggerInterface {}
```

### Issue: Performance degradation

**Cause:** Inefficient transformation settings

**Solution:**
```typescript
diEnhancedPlugin({
  reuseExistingConfig: true,        // Reuse valid configs
  cleanOldConfigs: true,            // Clean up periodically
  advanced: {
    performance: {
      parallel: true,               // Enable parallel processing
      enableCache: true,            // Enable caching
    }
  }
})
```

## Migration Checklist

### Pre-Migration
- [ ] Backup current project
- [ ] Document current DI setup
- [ ] Identify all services and dependencies
- [ ] Test current functionality

### During Migration
- [ ] Install @tdi2/vite-plugin-di and @tdi2/di-core
- [ ] Configure Vite plugin
- [ ] Update service decorators
- [ ] Remove old DI setup (tokens, contexts, etc.)
- [ ] Update imports and references

### Post-Migration
- [ ] Test all functionality
- [ ] Verify hot reload works
- [ ] Check debug endpoints
- [ ] Run performance tests
- [ ] Update documentation
- [ ] Train team on new patterns

## Getting Help

If you encounter issues during migration:

1. **Check debug endpoints**: `/_di_debug`, `/_di_interfaces`
2. **Enable verbose logging**: `verbose: true` in plugin options
3. **Check GitHub issues**: Search for similar problems
4. **Create minimal reproduction**: Isolate the issue
5. **Ask for help**: GitHub Discussions or Issues

## Benefits After Migration

### Developer Experience
- ✅ No manual token management
- ✅ Type-safe dependency injection
- ✅ Hot reload support
- ✅ Better error messages
- ✅ IDE autocomplete and IntelliSense

### Performance
- ✅ Build-time optimization
- ✅ Tree shaking support
- ✅ Smaller bundle sizes
- ✅ Faster development builds

### Maintainability
- ✅ Cleaner, more readable code
- ✅ Easier testing with interface mocking
- ✅ Better separation of concerns
- ✅ Consistent patterns across codebase

The migration effort is typically worth it for the improved developer experience and maintainability gains!