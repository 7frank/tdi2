# Basic Usage Example

This example demonstrates the basic setup and usage of @tdi2/vite-plugin-di.

## Project Structure

```
examples/basic/
├── src/
│   ├── services/
│   │   ├── UserService.ts        # Service implementation
│   │   ├── LoggerService.ts      # Logger implementation
│   │   └── interfaces.ts         # Interface definitions
│   ├── components/
│   │   └── UserProfile.tsx       # React component with DI
│   ├── main.tsx                  # App bootstrap
│   └── App.tsx                   # Main app component
├── vite.config.ts                # Vite configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **View the app**
   Open http://localhost:5173

## Code Walkthrough

### 1. Interface Definitions

```typescript
// src/services/interfaces.ts
export interface UserServiceInterface {
  getUser(id: string): Promise<User>;
  createUser(userData: CreateUserData): Promise<User>;
}

export interface LoggerInterface {
  log(message: string): void;
  error(message: string, error?: Error): void;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserData {
  name: string;
  email: string;
}
```

### 2. Service Implementations

```typescript
// src/services/LoggerService.ts
import { Service } from '@tdi2/di-core/decorators';
import type { LoggerInterface } from './interfaces';

@Service()
export class ConsoleLogger implements LoggerInterface {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  }
}
```

```typescript
// src/services/UserService.ts
import { Service, Inject } from '@tdi2/di-core/decorators';
import type { UserServiceInterface, LoggerInterface, User, CreateUserData } from './interfaces';

@Service()
export class UserService implements UserServiceInterface {
  constructor(
    @Inject() private logger: LoggerInterface // Auto-resolved to ConsoleLogger!
  ) {}

  async getUser(id: string): Promise<User> {
    this.logger.log(`Fetching user with id: ${id}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
    };

    this.logger.log(`Successfully fetched user: ${user.name}`);
    return user;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    this.logger.log(`Creating user: ${userData.name}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData,
    };

    this.logger.log(`Successfully created user: ${user.name}`);
    return user;
  }
}
```

### 3. React Component with DI

```typescript
// src/components/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { UserServiceInterface, User } from '../services/interfaces';

interface UserProfileProps {
  userId: string;
  services: {
    userService: Inject<UserServiceInterface>; // Auto-injected!
  };
}

export function UserProfile({ userId, services }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await services.userService.getUser(userId);
      setUser(userData);
    } catch (err) {
      setError('Failed to load user');
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading user...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={loadUser}>Retry</button>
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      margin: '20px 0'
    }}>
      <h2>User Profile</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <button onClick={loadUser} style={{ marginTop: '10px' }}>
        Reload User
      </button>
    </div>
  );
}
```

### 4. App Bootstrap

```typescript
// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CompileTimeDIContainer } from '@tdi2/di-core/container';
import { DIProvider } from '@tdi2/di-core/context';
import { DI_CONFIG } from './.tdi2/di-config'; // Auto-generated by plugin
import App from './App';

// Create and configure DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

console.log('🔧 DI Container initialized');
console.log('📋 Registered services:', container.getRegisteredTokens());

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DIProvider container={container}>
      <App />
    </DIProvider>
  </React.StrictMode>
);
```

```typescript
// src/App.tsx
import React from 'react';
import { UserProfile } from './components/UserProfile';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>TDI2 Basic Example</h1>
      <p>This example demonstrates basic dependency injection with automatic interface resolution.</p>
      
      <UserProfile userId="123" />
      <UserProfile userId="456" />
    </div>
  );
}

export default App;
```

### 5. Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      // Enable automatic interface resolution
      enableInterfaceResolution: true,
      
      // Enable functional component DI
      enableFunctionalDI: true,
      
      // Enable verbose logging for development
      verbose: true,
      
      // Source directory to scan
      srcDir: './src',
    }),
    react(),
  ],
});
```

## Key Features Demonstrated

### 1. Zero Configuration DI
- No manual token management
- No container configuration
- Automatic interface-to-implementation resolution

### 2. Type Safety
- Full TypeScript support
- Interface-based contracts
- Compile-time type checking

### 3. Hot Reload
- Changes to services automatically trigger regeneration
- Development-friendly workflow
- Fast iteration cycles

### 4. Debug Information
While the development server is running, visit:
- `http://localhost:5173/_di_debug` - Complete debug information
- `http://localhost:5173/_di_interfaces` - Interface mappings
- `http://localhost:5173/_di_configs` - Configuration management

## How It Works

1. **Build-time Scanning**: The Vite plugin scans your source code for `@Service` decorators and interface implementations

2. **Automatic Resolution**: Interface names are automatically mapped to implementation classes:
   - `LoggerInterface` → `ConsoleLogger`
   - `UserServiceInterface` → `UserService`

3. **Dependency Injection**: Constructor parameters with `@Inject()` are automatically resolved:
   - `UserService` needs `LoggerInterface`
   - Plugin automatically provides `ConsoleLogger` instance

4. **Configuration Generation**: A DI configuration file is automatically generated at `./.tdi2/di-config.ts`

5. **Runtime Resolution**: The DI container uses the generated configuration to resolve dependencies at runtime

## Next Steps

- Check out the [Advanced Example](../advanced/) for more complex scenarios
- Read the [API Documentation](../../docs/api.md) for all available options
- See the [Migration Guide](../../docs/migration.md) for migrating from other DI solutions

## Troubleshooting

### Common Issues

1. **"Service not registered" error**
   - Ensure your service has the `@Service()` decorator
   - Check that it implements an interface
   - Verify the plugin is configured correctly

2. **Hot reload not working**
   - Make sure `watch: true` in plugin options
   - Check that you're editing files in the `srcDir`

3. **Interface not resolved**
   - Ensure interface name ends with "Interface"
   - Check that implementation class is decorated with `@Service()`
   - Verify there's only one implementation per interface

### Debug Commands

```bash
# Clean and regenerate DI configuration
npm run di:clean && npm run dev

# Check what interfaces were found
curl http://localhost:5173/_di_interfaces | jq

# View complete debug information
curl http://localhost:5173/_di_debug | jq
```