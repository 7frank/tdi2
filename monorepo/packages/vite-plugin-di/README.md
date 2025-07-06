# @tdi2/vite-plugin-di

[![npm version](https://badge.fury.io/js/%40tdi2%2Fvite-plugin-di.svg)](https://badge.fury.io/js/%40tdi2%2Fvite-plugin-di)
[![JSR](https://jsr.io/badges/@tdi2/vite-plugin-di)](https://jsr.io/@tdi2/vite-plugin-di)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Vite plugin for [TDI2 (TypeScript Dependency Injection)](https://github.com/7frank/tdi2) that provides build-time dependency injection transformation with interface-based automatic resolution.

## Features

- 🎯 **Interface-Based DI**: Automatic resolution from TypeScript interfaces
- ⚡ **Zero Configuration**: Works out of the box with sensible defaults
- 🔄 **Hot Reload**: Development-friendly with automatic retransformation
- 🧩 **Functional Component DI**: Support for React functional components
- 📊 **Debug Endpoints**: Development debugging and visualization
- 🏗️ **Build Optimization**: Efficient production builds
- 🔧 **TypeScript First**: Full TypeScript support with type safety

## Installation

### npm
```bash
npm install @tdi2/vite-plugin-di @tdi2/di-core
```

### pnpm
```bash
pnpm add @tdi2/vite-plugin-di @tdi2/di-core
```

### yarn
```bash
yarn add @tdi2/vite-plugin-di @tdi2/di-core
```

### JSR (Deno/Bun)
```bash
# Deno
deno add @tdi2/vite-plugin-di

# Bun
bunx jsr add @tdi2/vite-plugin-di
```

## Quick Start

### 1. Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      // Enable interface-based automatic resolution
      enableInterfaceResolution: true,
      // Enable functional component DI
      enableFunctionalDI: true,
      // Verbose logging for development
      verbose: true,
    }),
    react(),
  ],
});
```

### 2. Define Services

```typescript
// services/UserService.ts
import { Service, Inject } from '@tdi2/di-core/decorators';

export interface UserServiceInterface {
  getUser(id: string): Promise<User>;
}

export interface LoggerInterface {
  log(message: string): void;
}

@Service()
export class UserService implements UserServiceInterface {
  constructor(
    @Inject() private logger: LoggerInterface // Auto-resolved!
  ) {}

  async getUser(id: string): Promise<User> {
    this.logger.log(`Fetching user ${id}`);
    // Implementation...
  }
}

@Service()
export class ConsoleLogger implements LoggerInterface {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}
```

### 3. Use in React Components

```tsx
// components/UserProfile.tsx
import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { UserServiceInterface } from '../services/UserService';

interface UserProfileProps {
  userId: string;
  services: {
    userService: Inject<UserServiceInterface>; // Auto-injected!
  };
}

export function UserProfile({ userId, services }: UserProfileProps) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    services.userService.getUser(userId).then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

### 4. Bootstrap Your App

```tsx
// main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CompileTimeDIContainer } from '@tdi2/di-core/container';
import { DIProvider } from '@tdi2/di-core/context';
import { DI_CONFIG } from './.tdi2/di-config'; // Auto-generated
import App from './App';

const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

createRoot(document.getElementById('root')!).render(
  <DIProvider container={container}>
    <App />
  </DIProvider>
);
```

## Configuration

### Basic Options

```typescript
interface DIPluginOptions {
  /** Source directory to scan for DI decorators and interfaces */
  srcDir?: string; // default: './src'
  
  /** Output directory for generated DI configuration files */
  outputDir?: string; // default: './src/generated'
  
  /** Enable verbose logging for debugging */
  verbose?: boolean; // default: false
  
  /** Enable file watching for hot reload during development */
  watch?: boolean; // default: true
  
  /** Enable functional component dependency injection transformation */
  enableFunctionalDI?: boolean; // default: true
  
  /** Enable automatic interface-to-implementation resolution */
  enableInterfaceResolution?: boolean; // default: true
  
  /** Generate debug files for transformation inspection */
  generateDebugFiles?: boolean; // default: false
  
  /** Reuse existing valid configurations instead of regenerating */
  reuseExistingConfig?: boolean; // default: true
  
  /** Automatically clean old configuration files */
  cleanOldConfigs?: boolean; // default: true
  
  /** Number of recent configurations to keep when cleaning */
  keepConfigCount?: number; // default: 3
}
```

### Advanced Options

```typescript
interface DIPluginOptions {
  advanced?: {
    /** Custom file extensions to scan for DI patterns */
    fileExtensions?: string[]; // default: ['.ts', '.tsx']
    
    /** Custom patterns to detect DI usage */
    diPatterns?: {
      serviceDecorator?: RegExp;
      injectDecorator?: RegExp;
      interfaceMarker?: RegExp;
    };
    
    /** Performance optimization settings */
    performance?: {
      /** Enable parallel processing for large codebases */
      parallel?: boolean; // default: true
      
      /** Maximum number of files to process concurrently */
      maxConcurrency?: number; // default: 10
      
      /** Enable caching of transformation results */
      enableCache?: boolean; // default: true
    };
  };
}
```

## Presets

Use predefined configurations for common scenarios:

```typescript
import { diEnhancedPlugin, createDIPluginPresets } from '@tdi2/vite-plugin-di';

const presets = createDIPluginPresets();

export default defineConfig({
  plugins: [
    // Development preset
    diEnhancedPlugin(presets.development.options),
    
    // Production preset
    diEnhancedPlugin(presets.production.options),
    
    // Testing preset
    diEnhancedPlugin(presets.testing.options),
    
    // Debugging preset
    diEnhancedPlugin(presets.debugging.options),
    
    react(),
  ],
});
```

Available presets:
- **`development`**: Verbose logging, hot reload, debug files
- **`production`**: Minimal logging, optimized builds
- **`testing`**: Fast rebuilds, no debug output
- **`minimal`**: Basic DI without functional components
- **`debugging`**: Maximum verbosity for troubleshooting

## Development Debugging

The plugin provides several debug endpoints during development:

### Debug URLs

- `http://localhost:5173/_di_debug` - General debug information
- `http://localhost:5173/_di_interfaces` - Interface mappings
- `http://localhost:5173/_di_configs` - Configuration management
- `http://localhost:5173/_di_performance` - Performance statistics

### Force Regeneration

```bash
# Force regeneration via API
curl -X POST http://localhost:5173/_di_regenerate
```

### CLI Commands

```bash
# Generate DI configuration
npm run di:enhanced

# Validate current configuration
npm run di:validate

# Clean old configurations
npm run di:clean

# List all configurations
npm run di:list
```

## Examples

### Interface-Based Resolution

```typescript
// No manual token mapping needed!
export interface ApiServiceInterface {
  getData(): Promise<Data[]>;
}

@Service()
export class ApiService implements ApiServiceInterface {
  constructor(
    @Inject() private logger: LoggerInterface, // Auto-resolved to ConsoleLogger
    @Inject() private cache?: CacheInterface   // Optional dependency
  ) {}
}
```

### Generic Interfaces

```typescript
export interface Repository<T> {
  findById(id: string): Promise<T>;
  save(entity: T): Promise<void>;
}

@Service()
export class UserRepository implements Repository<User> {
  // Implementation...
}

// Automatic resolution works with generics!
@Service()
export class UserController {
  constructor(@Inject() private userRepo: Repository<User>) {}
  //                    ↑ Automatically resolves to UserRepository!
}
```

### Multiple Implementations

```typescript
@Service()
@Primary() // Mark as default
export class DatabaseLogger implements LoggerInterface {}

@Service()
@Qualifier('console')
export class ConsoleLogger implements LoggerInterface {}

@Service()
export class UserService {
  constructor(
    @Inject() private defaultLogger: LoggerInterface, // → DatabaseLogger
    @Inject() @Qualifier('console') private consoleLogger: LoggerInterface // → ConsoleLogger
  ) {}
}
```

## Migration Guide

### From Manual Token-Based DI

**Before:**
```typescript
export const USER_SERVICE_TOKEN = 'USER_SERVICE_TOKEN';

@Service({ token: USER_SERVICE_TOKEN })
export class UserService {
  constructor(@Inject(LOGGER_TOKEN) private logger: LoggerInterface) {}
}
```

**After:**
```typescript
@Service() // Token automatically resolved from interface
export class UserService {
  constructor(@Inject() private logger: LoggerInterface) {} // Auto-resolved!
}
```

### From Context API

Replace Provider hell with clean DI:

**Before:**
```tsx
<UserContext.Provider>
  <LoggerContext.Provider>
    <CacheContext.Provider>
      <UserProfile />
    </CacheContext.Provider>
  </LoggerContext.Provider>
</UserContext.Provider>
```

**After:**
```tsx
<DIProvider container={container}>
  <UserProfile /> <!-- Services auto-injected -->
</DIProvider>
```

## Best Practices

### 1. Interface-First Design

```typescript
// ✅ Define interfaces first
export interface UserServiceInterface {
  getUser(id: string): Promise<User>;
}

// ✅ Implement interfaces
@Service()
export class UserService implements UserServiceInterface {
  // Implementation...
}
```

### 2. Use Descriptive Interface Names

```typescript
// ✅ Good
export interface UserRepositoryInterface {}
export interface EmailServiceInterface {}

// ❌ Avoid generic names
export interface Service {}
export interface Handler {}
```

### 3. Leverage Optional Dependencies

```typescript
@Service()
export class UserService {
  constructor(
    @Inject() private repository: UserRepositoryInterface,
    @Inject() private logger?: LoggerInterface, // Optional
    @Inject() private cache?: CacheInterface   // Optional
  ) {}
}
```

### 4. Use Qualifiers for Multiple Implementations

```typescript
@Service()
@Qualifier('file')
export class FileLogger implements LoggerInterface {}

@Service()
@Qualifier('console')
export class ConsoleLogger implements LoggerInterface {}
```

## Performance

### Build-Time Optimization

- **Tree Shaking**: Only used services are included in bundles
- **Code Generation**: No runtime reflection or metadata
- **Caching**: Intelligent reuse of existing configurations
- **Parallel Processing**: Concurrent file processing for large codebases

### Development Performance

- **Hot Reload**: Automatic retransformation on file changes
- **Config Reuse**: Avoid unnecessary regeneration
- **Incremental Updates**: Only rebuild changed components

## Troubleshooting

### Common Issues

#### 1. "Service not registered" errors
```bash
# Reset and regenerate configuration
npm run di:reset
```

#### 2. Interface resolution not working
```typescript
// Ensure proper interface implementation
@Service()
export class MyService implements MyServiceInterface {
  // Must implement interface
}
```

#### 3. Hot reload not working
```typescript
// Check Vite plugin configuration
diEnhancedPlugin({
  watch: true,  // Enable hot reload
  verbose: true // See what's happening
})
```

### Debug Information

Enable verbose logging to see what's happening:

```typescript
diEnhancedPlugin({
  verbose: true,
  generateDebugFiles: true,
})
```

Visit debug endpoints for detailed information:
- `/_di_debug` - Full debug information
- `/_di_interfaces` - Interface mappings
- `/_di_performance` - Performance metrics

## Contributing

Contributions are welcome! Please check out the [TDI2 repository](https://github.com/7frank/tdi2) for development guidelines.

## License

MIT © [7frank](https://github.com/7frank)

## Related Packages

- [@tdi2/di-core](https://www.npmjs.com/package/@tdi2/di-core) - Core dependency injection framework
- [TDI2 Monorepo](https://github.com/7frank/tdi2) - Main repository with examples and documentation