# @tdi2/logging

🪵 **Professional logging system for TDI2 applications** with OpenTelemetry integration, console monkey-patching, and dependency injection support.

## ✨ Features

- 🔧 **OpenTelemetry Integration** - Industry-standard observability
- 🐒 **Console Monkey-Patching** - Intercept and route console.log calls
- 💉 **DI Integration** - Works seamlessly with @tdi2/di-core
- 🎯 **Fine-Grained Control** - Route different log levels to different outputs
- 🌍 **Environment-Aware** - Auto-configuration for dev/prod/test
- 📊 **Performance Tracking** - Built-in timing and memory monitoring
- 🎨 **Development-Friendly** - Rich debugging and development helpers

## 🚀 Installation

```bash
npm install @tdi2/logging
```

## 📖 Quick Start

### Basic Usage

```typescript
import { Logger } from '@tdi2/logging';

// Auto-detect environment and initialize
const logger = Logger.auto();

// Use convenient logging methods
Logger.info('Application started', { version: '1.0.0' });
Logger.error('Something went wrong', error);
Logger.debug('Debug information', { userId: '123' });
```

### With Console Monkey-Patching

```typescript
import { initLogging, consolePresets } from '@tdi2/logging';

// Initialize with fine-grained console control
initLogging({
  consoleMonkeyPatch: {
    log: 'otel',     // console.log() → OpenTelemetry only
    debug: 'otel',   // console.debug() → OpenTelemetry only  
    info: 'otel',    // console.info() → OpenTelemetry only
    warn: 'both',    // console.warn() → Both OpenTelemetry and console
    error: 'both',   // console.error() → Both OpenTelemetry and console
    table: 'console' // console.table() → Console only
  }
});

// Or use presets for quick setup
initLogging({
  consoleMonkeyPatch: consolePresets.development() // Warnings/errors in console
});
```

### With Dependency Injection

```typescript
import { Service, Inject } from '@tdi2/di-core';
import { LoggerInterface } from '@tdi2/logging';

@Service()
export class UserService {
  constructor(@Inject() private logger: LoggerInterface) {}
  
  async createUser(userData: any) {
    this.logger.info('Creating user', { email: userData.email });
    
    try {
      const user = await this.repository.save(userData);
      this.logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error, { 
        userData: userData.email 
      });
      throw error;
    }
  }
}
```

## 🔧 Configuration

### Environment-Specific Setup

```typescript
import { logging } from '@tdi2/logging';

// Development - verbose logging with console warnings/errors
const devLogger = logging.forDevelopment();

// Production - minimal logging, errors only to console  
const prodLogger = logging.forProduction();

// Testing - silent logging, everything to OpenTelemetry
const testLogger = logging.forTesting();
```

### Fine-Grained Console Control

```typescript
import { updateConsoleConfig, setConsoleRouting } from '@tdi2/logging';

// Update multiple methods at once
updateConsoleConfig({
  log: 'otel',      // Only to OpenTelemetry
  debug: 'both',    // Both OpenTelemetry and console
  warn: 'console',  // Only to console
  error: 'both'     // Both places
});

// Update individual methods
setConsoleRouting.log('both');    // Make logs visible in console
setConsoleRouting.table('otel');  // Tables only to OpenTelemetry
```

### Dynamic Runtime Changes

```typescript
import { consolePresets, updateConsoleConfig } from '@tdi2/logging';

// Switch to debug mode - everything visible
updateConsoleConfig(consolePresets.debug());

// Back to production mode - only errors visible
updateConsoleConfig(consolePresets.production());

// Silent mode - everything to OpenTelemetry only
updateConsoleConfig(consolePresets.silent());
```

## 🎯 Advanced Features

### Performance Logging

```typescript
import { Logger, devLog } from '@tdi2/logging';

// Automatic timing wrapper
const result = await devLog.withTiming('database-query', async () => {
  return await database.findUsers();
}, { 
  operation: 'user-lookup',
  complexity: 'O(n)'
});

// Manual performance logging
Logger.performance('api-response-time', 245, 'ms');
Logger.memory(); // Log current memory usage
```

### TDI2-Specific Logging

```typescript
import { Logger } from '@tdi2/logging';

// DI system events
Logger.diRegistration('UserService', 'UserServiceImpl', 'interface');
Logger.diResolution('UserService', 'UserServiceImpl', true, 15);
Logger.serviceCreation('UserService', ['DatabaseService', 'LoggerService'], 25);
Logger.componentTransformation('UserProfile', 'functional', ['UserService']);
```

### Development Helpers

```typescript
import { devLog } from '@tdi2/logging';

// Object diff logging
const oldUser = { name: 'John', age: 30 };
const newUser = { name: 'John', age: 31 };
devLog.diff('user-update', oldUser, newUser);

// Structured debug information
devLog.debugInfo('component-state', {
  componentName: 'UserProfile',
  propsCount: 5,
  stateKeys: ['user', 'loading', 'error'],
  renderCount: 3
});
```

### Context Management

```typescript
import { getLogger } from '@tdi2/logging';

const logger = getLogger();

// Set global context
logger.setGlobalContext({
  userId: 'user-123',
  sessionId: 'session-456',
  environment: 'production'
});

// Create child logger with additional context
const serviceLogger = logger.createChildLogger('UserService', {
  service: 'user-management',
  version: '2.1.0'
});

// Temporary context
const tempLogger = serviceLogger.withContext({
  operation: 'password-reset',
  requestId: 'req-789'
});
```

## 📊 Console Output Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `'otel'` | Only to OpenTelemetry | Production logging, silent console |
| `'console'` | Only to browser console | Local debugging, bypassing telemetry |
| `'both'` | Both destinations | Development, important messages |

## 🎨 Presets

```typescript
import { consolePresets } from '@tdi2/logging';

// Development: warnings and errors visible in console
consolePresets.development();

// Production: only errors visible in console
consolePresets.production(); 

// Debug: everything visible in console
consolePresets.debug();

// Silent: everything to OpenTelemetry only
consolePresets.silent();

// Console only: bypass OpenTelemetry completely
consolePresets.consoleOnly();
```

## 🧪 Testing

```typescript
import { logging } from '@tdi2/logging';

beforeEach(() => {
  // Silent logging for tests
  logging.forTesting();
});

afterEach(async () => {
  const logger = getLogger();
  await logger.forceFlush();
});
```

## 🔗 Integration with Other TDI2 Packages

Works seamlessly with:
- **@tdi2/di-core** - Automatic DI service registration
- **@tdi2/async-state** - Logging for reactive state changes
- **@tdi2/dev-tools** - Enhanced debugging information

## 📚 API Reference

### Core Functions

- `initLogging(options)` - Initialize logging system
- `getLogger()` - Get global logger instance
- `shutdownLogging()` - Gracefully shutdown logging

### Convenience Functions

- `Logger.info/warn/error/debug()` - Quick logging
- `Logger.performance()` - Performance metrics
- `Logger.userAction()` - User interaction logging
- `Logger.apiCall()` - API call logging

### Console Control

- `patchConsole(config)` - Apply console monkey patch
- `unpatchConsole()` - Remove console monkey patch
- `updateConsoleConfig(config)` - Update routing configuration

### Development

- `devLog.withTiming()` - Automatic timing
- `devLog.diff()` - Object difference logging
- `withOriginalConsole()` - Temporarily use original console

## 📄 License

MIT License - See LICENSE file for details

---

Part of the **TDI2** ecosystem - TypeScript Dependency Injection 2