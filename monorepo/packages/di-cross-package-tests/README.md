# @tdi2/di-integration-tests

Integration tests for cross-package dependency injection functionality in TDI2.

## Purpose

This package validates that the DI system works correctly when:
- Services in one package depend on services/interfaces from another package
- Components import and use services from multiple packages
- The DIContainer properly resolves cross-package dependencies

## Structure

```
fixtures/
  package-a/          # Base package with LoggerService
    LoggerService.ts  # Logger interface and implementation
    Logger.tsx        # Logger component

  package-b/          # Dependent package with UserService
    UserService.ts    # User service that depends on LoggerInterface
    UserList.tsx      # Component using both packages
```

## Test Scenarios

### 1. Service Dependencies (`__tests__/cross-package-di.test.tsx`)
- ✅ UserService (Package B) depends on LoggerInterface (Package A)
- ✅ DIContainer properly initializes services with cross-package dependencies
- ✅ Services can call methods on dependencies from other packages
- ✅ State changes propagate correctly across packages

### 2. Component Integration
- ✅ Components from Package A render with their services
- ✅ Components from Package B render with dependencies from both packages
- ✅ User interactions trigger cross-package service calls
- ✅ DIProvider correctly provides services to nested components

### 3. Module Resolution (`__tests__/module-resolution.test.ts`)
- 🔴 Documents current limitation: Only resolves from `scanDirs[0]`
- 📝 Tests relative imports (current workaround)
- 📝 Documents desired behavior for non-relative imports

## Current Known Issues

### RecursiveInjectExtractor Module Resolution
**Status**: ❌ NOT WORKING

**Problem**:
```typescript
// RecursiveInjectExtractor.ts:314
const srcDir = this.options.srcDir || './src';
resolvedPath = path.resolve(srcDir, moduleSpecifier);
```

Only resolves non-relative imports from `scanDirs[0]`.

**Impact**:
- Services cannot use absolute imports across packages
- Must use relative imports: `import { X } from '../package-a/X'`
- Breaks if packages are restructured

**Workaround**:
Use relative imports for cross-package dependencies.

**Desired Fix**:
```typescript
// Try all scanDirs for resolution
for (const scanDir of this.options.scanDirs) {
  resolvedPath = path.resolve(scanDir, moduleSpecifier);
  // Try to resolve...
}
```

## Running Tests

```bash
# Run all integration tests
bun test

# Run with watch mode
bun test:watch

# Run with UI
bun test:ui

# Run specific test
bun test cross-package-di.test.tsx
```

## Development

This package uses:
- **Vitest** for testing
- **@testing-library/react** for component testing
- **Vite** with TDI2 plugin for transformation
- **Multiple scanDirs** to simulate monorepo packages

## Related Issues

- See [Backlog.md](../../Backlog.md) for scanDirs[0] tracking
- [RecursiveInjectExtractor.ts:314](../di-core/tools/shared/RecursiveInjectExtractor.ts#L314)
