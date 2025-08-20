# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is TDI2 (TypeScript Dependency Injection Attempt #2) - a React Service Injection (RSI) framework that enables enterprise-grade architecture for React applications. The project moves state and logic out of components into reactive services, eliminating prop drilling and providing automatic state synchronization.

## Repository Structure

This is a monorepo with the following structure:

- **`/monorepo/`** - Main monorepo containing packages and apps
- **`/examples/`** - Example applications demonstrating TDI2 usage
- **`/docs/`** - Comprehensive documentation and analysis
- **`/github-issue-sync/`** - Issue synchronization tooling

## Common Commands

### Development Commands (from monorepo root)
```bash
cd monorepo
bun install           # Install dependencies
bun run dev           # Start development mode for all apps
bun run build         # Build all packages and apps
bun run test          # Run all tests
bun run lint          # Run linting
bun run check-types   # Run TypeScript type checking
```

### Package-specific Commands
```bash
# Core DI package
cd monorepo/packages/di-core
bun test              # Run core DI tests
bun run build         # Build the core package

# Vite plugin
cd monorepo/packages/vite-plugin-di
bun test              # Run plugin tests
bun run build         # Build the plugin

# Examples
cd examples/tdi2-basic-example
npm run dev           # Start example app
npm run build         # Build example
```

### Testing Commands
```bash
# Run specific tests
bun test functional-di-enhanced-transformer.test.ts
bun test integrated-interface-resolver.test.ts

# Interactive test selection (from di-core)
bun run test:io
```

## Core Architecture

### TDI2 System Components

1. **DI Core (`@tdi2/di-core`)** - The dependency injection container and decorators
2. **Vite Plugin (`@tdi2/vite-plugin-di`)** - Compile-time code transformation
3. **Functional DI Transformer** - Converts components to use service injection
4. **Interface Resolution System** - Automatically resolves TypeScript interfaces to implementations

### Key Technologies

- **Valtio** - Reactive state management via proxies
- **ts-morph** - TypeScript AST manipulation for code transformation
- **Turbo** - Monorepo build system
- **React** - UI framework being enhanced with service injection

### Service Pattern

Services are the core abstraction - they contain:
- Reactive state (via Valtio proxies)
- Business logic methods
- Automatic dependency injection
- Interface-based resolution

Example service:
```typescript
@Service()
export class CounterService implements CounterServiceInterface {
  state = { count: 0, message: "Hello" };
  
  increment() {
    this.state.count++;
    this.state.message = `Count is now ${this.state.count}`;
  }
}
```

### Component Transformation

Components are transformed from traditional React patterns to service-injected templates:

**Before (traditional React):**
```typescript
function Counter({ userId, onUpdate, theme, ...15Props }) {
  const [count, setCount] = useState(0);
  // Complex useEffect chains, manual state sync
}
```

**After (RSI pattern):**
```typescript
function Counter({ counterService }: { counterService: Inject<CounterServiceInterface> }) {
  return <div>{counterService.state.count}</div>;
}
```

## Development Workflow

### Adding New Features

1. Create/modify services in `monorepo/packages/di-core/src/`
2. Update transformers in `monorepo/packages/di-core/tools/functional-di-enhanced-transformer/`
3. Write tests in `__tests__/` directories
4. Update examples in `examples/`
5. Run tests: `bun test`
6. Build: `bun run build`

### Working with Transformers

The transformation pipeline is located in:
- `monorepo/packages/di-core/tools/functional-di-enhanced-transformer/`
- Key files: `functional-di-enhanced-transformer.ts`, `transformation-pipeline.ts`
- Test fixtures: `__tests__/__fixtures__/`

To add new transformation patterns:
1. Add input/output fixtures in `__fixtures__/`
2. Update transformer logic
3. Run tests to verify snapshots

### Interface Resolution

The system automatically resolves TypeScript interfaces to service implementations:
- Interface definitions → Service tokens
- Automatic dependency injection
- Build-time validation

Located in: `monorepo/packages/di-core/tools/interface-resolver/`

## Testing

### Test Structure

- **Unit tests** - Individual component/service testing
- **Integration tests** - Full transformation pipeline testing
- **Snapshot tests** - Code transformation verification
- **Fixture-based tests** - Input/output verification

### Important Test Files
- `code-transformation.test.ts`
- `functional-di-enhanced-transformer.test.ts` - Main transformation tests
- `integrated-interface-resolver.test.ts` - Interface resolution tests
- `__fixtures__/` - Test input/output examples

### Running Tests

```bash
# All tests
bun test

# Specific test file
bun test enhanced-di-transformer.test.ts

# Update snapshots
bun test --update-snapshots
```

## Configuration

### Vite Plugin Configuration

```typescript
import { diEnhancedPlugin } from "@tdi2/vite-plugin-di";

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      verbose: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      generateDebugFiles: true,
    }),
    react(),
  ],
});
```

### TypeScript Configuration

Experimental decorators must be enabled:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## Package Management

- **Package Manager**: Bun (monorepo root), npm (examples)
- **Workspaces**: Defined in `monorepo/package.json`
- **Build System**: Turbo for coordinated builds
- **Publishing**: Changesets for version management

## Key Files to Understand

- `monorepo/packages/di-core/src/container.ts` - DI container implementation
- `monorepo/packages/di-core/src/decorators.ts` - Service/Inject decorators
- `monorepo/packages/di-core/tools/functional-di-enhanced-transformer/functional-di-enhanced-transformer.ts` - Core transformation logic
- `monorepo/packages/vite-plugin-di/src/plugin.ts` - Vite integration
- `examples/tdi2-basic-example/` - Working example implementation

## Documentation

**📖 [Live Documentation Site](https://7frank.github.io/tdi2/)** - Comprehensive Starlight-based documentation site

**🧪 [Interactive Examples](https://7frank.github.io/tdi2/test-harness/)** - Live Storybook demonstrations

**💻 [Local Development](./monorepo/apps/docs-starlight/)** - Documentation source and development

Key documentation resources:
- **[Quick Start Guide](./monorepo/apps/docs-starlight/src/content/docs/getting-started/quick-start.md)** - Get up and running in 5 minutes
- **[Enterprise Implementation](./monorepo/apps/docs-starlight/src/content/docs/guides/enterprise/implementation.md)** - 4-phase enterprise adoption strategy
- **[Architecture Patterns](./monorepo/apps/docs-starlight/src/content/docs/guides/architecture/controller-service-pattern.md)** - Controller vs Service pattern distinction
- **[E-Commerce Case Study](./monorepo/apps/docs-starlight/src/content/docs/examples/ecommerce-case-study.md)** - Complete working example
- **[Migration Strategy](./monorepo/apps/docs-starlight/src/content/docs/guides/migration/strategy.md)** - Systematic migration from Redux/Context
- **[Research & Analysis](./monorepo/apps/docs-starlight/src/content/docs/research/)** - Market analysis, SOLID principles compliance, evaluation plans

### Development Documentation
```bash
cd monorepo/apps/docs-starlight
bun run dev  # Start documentation development server
bun run build  # Build static documentation site
```

The project is experimental and actively seeking feedback from the React community, particularly enterprise teams dealing with prop drilling and state management complexity.