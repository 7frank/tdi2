# Cross-Package DI Integration Tests

## Purpose

This test validates the **complete end-to-end DI workflow** for multi-package scenarios, mimicking exactly how production code works.

## Test Pattern

Based on the production pattern from `/examples/comparision/tdi2/src/main.tsx`:

```typescript
import { DI_CONFIG } from './.tdi2/di-config'; // Auto-generated
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);
```

## What We Test

✅ **Auto-generated configuration** - Imports from `.tdi2/di-config.ts` bridge files
✅ **Multi-package scanning** - Services discovered from both `package-a` and `package-b`
✅ **Dependency tree generation** - UserService automatically receives LoggerInterface
✅ **Container loadConfiguration** - DI_CONFIG properly registers all services
✅ **Cross-package dependencies** - Package B service depends on Package A interface
✅ **Component integration** - Components work with DIProvider (full stack)
✅ **Singleton scope** - Container returns same instances

## Test Setup

### Prerequisites

The DI plugin must run BEFORE tests to generate `di-config.ts` files:

```bash
# Option 1: Run dev server once (generates configs)
cd monorepo/packages/di-cross-package-tests
bun run dev
# Ctrl+C after configs generated

# Option 2: Run build (generates configs)
bun run build

# Then run tests
bun test
```

### Vite Configuration

The `vite.config.ts` currently **skips the DI plugin in test mode**:

```typescript
...(mode === 'test' ? [] : [diEnhancedPlugin({...})])
```

This is intentional - configs must be pre-generated, then tests import them.

## Fixture Structure

```
fixtures/
  package-a/
    LoggerService.ts       - Base logger interface + implementation
    Logger.tsx             - Component using logger
    .tdi2/di-config.ts     - Auto-generated bridge file

  package-b/
    UserService.ts         - Service depending on LoggerInterface
    UserList.tsx           - Component using both services
    .tdi2/di-config.ts     - Auto-generated bridge file
```

## What Makes This Different

### Old Tests (Deleted)
```typescript
// ❌ Manual instantiation - doesn't test DI
const logger = new LoggerService();
const userService = new UserService(logger);
```

### New Test (Current)
```typescript
// ✅ Auto-resolution via container - tests real DI workflow
import { DI_CONFIG } from '../fixtures/package-a/.tdi2/di-config';
container.loadConfiguration(DI_CONFIG);
const userService = container.get<UserServiceInterface>('UserServiceInterface__...');
// UserService constructor receives logger automatically!
```

## Critical Validations

1. **Dependency Injection Works**
   ```typescript
   userService.addUser('Test');
   expect(logger.state.logs).toContain('Test'); // Proves logger was injected
   ```

2. **Cross-Package Import Chain**
   - Package B imports interface from Package A
   - Generated config imports services from both packages
   - Container resolves dependencies across package boundaries

3. **Configuration Generation**
   - Factories must get dependencies from container
   - Singleton scope maintained
   - Interface-to-implementation mappings correct

## Known Issues

### Factory Generation Bug

The generated factory in `di-config.ts` may be missing dependency resolution:

```typescript
// ❌ Current (broken)
function createUserService(container: any) {
  return () => new UserService(); // Missing logger!
}

// ✅ Should be
function createUserService(container: any) {
  return () => {
    const logger = container.get('LoggerInterface__...');
    return new UserService(logger);
  };
}
```

**This test will catch this bug** by verifying that UserService operations log correctly.

## Running Tests

```bash
# From package root
bun test

# With UI
bun run test:ui

# Watch mode
bun run test:watch
```

## Success Criteria

All tests pass = Cross-package DI works end-to-end:
- ✅ Config files generated correctly
- ✅ Services registered from multiple packages
- ✅ Dependencies auto-resolved across packages
- ✅ Components work with DIProvider
- ✅ Dependency tree built automatically
