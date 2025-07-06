# TDI2 Basic Example

A small working example demonstrating the TDI2 dependency injection framework with React, TypeScript, and Vite using reactive state management.

## Features

- **Zero Configuration DI**: No manual token management or container configuration
- **Automatic Interface Resolution**: `CounterServiceInterface` → `CounterService`
- **Type Safety**: Full TypeScript support with compile-time type checking
- **Hot Reload**: Development-friendly with automatic regeneration
- **Reactive State**: Services with reactive state that automatically updates components

## Project Structure

```
├── src/
│   ├── services/
│   │   └── CounterService.ts      # Counter service with reactive state
│   ├── components/
│   │   └── App.tsx                # React components with DI
│   ├── main.tsx                   # App bootstrap with DI setup
│   └── .tdi2/
│       └── di-config.ts           # Auto-generated DI configuration
├── vite.config.ts                 # Vite config with DI plugin
├── package.json                   # Dependencies
└── tsconfig.json                  # TypeScript config with decorators
```

## Setup

0. degit or clone the repo by using one of these:

   ```bash
   npx degit 7frank/tdi2/examples/tdi2-basic-example di-react-example
   cd di-react-example
   ```

   **or**

   ```bash
   git clone https://github.com/7frank/tdi2.git
   cd  tdi2/examples/tdi2-basic-example
   ```

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start development server**

   ```bash
   npm run clean && npm run dev
   ```

3. **View the app**
   Open http://localhost:5173

## How It Works

1. **Service Definition**: Services are marked with `@Service()` decorator and implement interfaces
2. **Dependency Injection**: Services are injected into components via props with `Inject<ServiceInterface>` type
3. **Build-time Scanning**: Vite plugin scans for services and generates configuration
4. **Runtime Resolution**: DI container resolves dependencies based on interface names
5. **Reactive State**: Services contain reactive state that automatically updates all consuming components

## Key Components

### CounterService
The example features a reactive counter service that manages state without requiring React hooks in components:

```typescript
@Service()
export class CounterService implements CounterServiceInterface {
  state = {
    count: 0,
    message: "Click buttons to count!",
  };

  increment(): void {
    this.state.count++;
    this.state.message = `Count is now ${this.state.count}`;
  }
  
  // ... other methods
}
```

### Components with DI
Components receive services via props and remain pure:

```typescript
interface CounterProps {
  services: { counterService: Inject<CounterServiceInterface> };
}

export function Counter(props: CounterProps) {
  const { services: { counterService } } = props;
  
  // No useState, no useEffect - everything comes from service!
  const count = counterService.state.count;
  const message = counterService.state.message;
  
  return (
    <div>
      <h2>{count}</h2>
      <p>{message}</p>
      <button onClick={() => counterService.increment()}>+</button>
    </div>
  );
}
```

## Debug Information

While running, visit these URLs for debug info:

- `http://localhost:5173/_di_debug` - Complete debug information
- `http://localhost:5173/_di_interfaces` - Interface mappings
- `http://localhost:5173/_di_configs` - Configuration management

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run clean    # Clean generated DI files and cache
npm run di:clean # Clean generated DI files only
```

## Current Limitations

```typescript
// ✅ Works: Wrap your injected interfaces in a "services" property
interface AppProps {
  services: {
    counterService: Inject<CounterServiceInterface>;
    // ... other services
  };
}

// ✅ Works: Non-destructured key and destructuring in the function body
export function Counter(props: AppProps) {
  const {
    services: { counterService },
  } = props;
}

// ❌ Does not work: Destructuring in the function arguments list directly
export function Counter({ services: { counterService } }: AppProps) {}
```

## Dependencies

- `@tdi2/di-core` - Core dependency injection functionality
- `@tdi2/vite-plugin-di` - Vite plugin for build-time DI configuration
- `react` & `react-dom` - React framework
- `typescript` - TypeScript support
- `vite` - Build tool

## Vite Plugin Configuration

The example uses the enhanced DI plugin with the following options:

```typescript
diEnhancedPlugin({
  verbose: true,                    // Enable detailed logging
  watch: true,                      // Watch for file changes
  enableFunctionalDI: true,         // Enable functional DI patterns
  enableInterfaceResolution: true,  // Auto-resolve interfaces
  generateDebugFiles: true,         // Generate debug information
  cleanOldConfigs: true,            // Clean old configurations
  keepConfigCount: 3,               // Keep last 3 configs
})
```

## Key Benefits

- **No React Hooks in Components**: All state management is handled by services
- **Automatic Reactivity**: Components update automatically when service state changes
- **Type Safety**: Full TypeScript support with compile-time checking
- **Clean Architecture**: Clear separation between business logic (services) and presentation (components)
- **Hot Reload Friendly**: Development server updates automatically when services change

## Scripts

- `rm -rf node_modules package-lock.json && npm install` - Clean reinstall
- `npm list @tdi2/di-core` - Check TDI2 version