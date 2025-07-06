# TDI2 Basic Example

A small working example demonstrating the TDI2 dependency injection framework with React, TypeScript, and Vite.

## Features

- **Zero Configuration DI**: No manual token management or container configuration
- **Automatic Interface Resolution**: `LoggerInterface` → `ConsoleLogger`, `UserServiceInterface` → `UserService`
- **Type Safety**: Full TypeScript support with compile-time type checking
- **Hot Reload**: Development-friendly with automatic regeneration

## Project Structure

```
├── src/
│   ├── services/
│   │   ├── interfaces.ts         # Interface definitions
│   │   ├── LoggerService.ts      # Logger implementation
│   │   └── UserService.ts        # User service with DI
│   ├── components/
│   │   └── UserProfile.tsx       # React component with DI
│   ├── main.tsx                  # App bootstrap with DI setup
│   └── App.tsx                   # Main app component
├── vite.config.ts                # Vite config with DI plugin
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config with decorators
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

## How It Works

1. **Service Definition**: Services are marked with `@Service()` decorator and implement interfaces
2. **Dependency Injection**: Constructor parameters use `@Inject()` for automatic resolution
3. **Build-time Scanning**: Vite plugin scans for services and generates configuration
4. **Runtime Resolution**: DI container resolves dependencies based on interface names

## Key Components

- `ConsoleLogger` implements `LoggerInterface`
- `UserService` implements `UserServiceInterface` and depends on `LoggerInterface`
- `UserProfile` component receives injected services via props
- DI container automatically wires everything together

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
npm run di:clean # Clean generated DI files
```