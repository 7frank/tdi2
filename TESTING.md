# TDI2 Plugin Testing Guide

This document describes the end-to-end testing strategy for all TDI2 build tool plugins.

## Test Structure

Each plugin package contains an end-to-end test that verifies the complete transformation pipeline works correctly:

```
packages/
├── rollup-plugin-di/src/__tests__/e2e.test.ts
├── webpack-plugin-di/src/__tests__/e2e.test.ts
├── esbuild-plugin-di/src/__tests__/e2e.test.ts
├── babel-plugin-di/src/__tests__/e2e.test.ts
└── typescript-transformer/src/__tests__/e2e.test.ts
```

## Shared Test Fixtures

All tests use the same fixtures located in `@tdi2/plugin-core/src/__tests__/fixtures/`:

### CounterService.ts
```typescript
import { Service } from '@tdi2/di-core';

export interface CounterServiceInterface {
  state: { count: number };
  increment(): void;
  decrement(): void;
}

@Service()
export class CounterService implements CounterServiceInterface {
  state = { count: 0 };
  increment() { this.state.count++; }
  decrement() { this.state.count--; }
}
```

### Counter.tsx
```typescript
import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { CounterServiceInterface } from './CounterService';

export function Counter(props: {
  services: {
    counter: Inject<CounterServiceInterface>;
  };
}) {
  const { counter } = props.services;

  return (
    <div>
      <div data-testid="count">{counter.state.count}</div>
      <button data-testid="increment" onClick={() => counter.increment()}>
        Increment
      </button>
      <button data-testid="decrement" onClick={() => counter.decrement()}>
        Decrement
      </button>
    </div>
  );
}
```

## Test Strategy

Each test follows the same pattern:

1. **Setup**: Create temporary directory and copy fixtures
2. **Transform**: Run the build tool with TDI2 plugin
3. **Verify Transformation**: Check that output contains:
   - `useService` hook calls
   - `CounterServiceInterface` references
   - Imports from `@tdi2/di-core/context`
4. **Verify Config Generation**: Check that interface resolution config was created
5. **Cleanup**: Remove temporary files

## Running Tests

### Run All Plugin Tests
```bash
cd monorepo
bun run test
```

### Run Individual Plugin Tests
```bash
# Rollup
cd packages/rollup-plugin-di
bun test

# Webpack
cd packages/webpack-plugin-di
bun test

# esbuild
cd packages/esbuild-plugin-di
bun test

# Babel
cd packages/babel-plugin-di
bun test

# TypeScript
cd packages/typescript-transformer
bun test
```

## Test Details by Plugin

### Rollup Plugin Test
**File**: `packages/rollup-plugin-di/src/__tests__/e2e.test.ts`

**Approach**:
- Uses Rollup API to bundle test fixtures
- Outputs to temp directory
- Verifies bundle contains transformed code
- Checks for generated config files

**Key assertions**:
```typescript
expect(bundleContent).toContain('useService');
expect(bundleContent).toContain('CounterServiceInterface');
expect(bundleContent).toContain('@tdi2/di-core/context');
```

---

### Webpack Plugin Test
**File**: `packages/webpack-plugin-di/src/__tests__/e2e.test.ts`

**Approach**:
- Uses Webpack 5 API to compile fixtures
- Requires `ts-loader` for TypeScript support
- Outputs to temp directory
- 30-second timeout for webpack compilation

**Dependencies**:
- `webpack`: ^5.0.0
- `ts-loader`: ^9.5.0

**Key assertions**:
```typescript
expect(bundleContent).toContain('useService');
expect(bundleContent).toContain('CounterServiceInterface');
```

---

### esbuild Plugin Test
**File**: `packages/esbuild-plugin-di/src/__tests__/e2e.test.ts`

**Approach**:
- Uses esbuild API for ultra-fast bundling
- Native TypeScript support
- Simplest test (fastest execution)

**Key assertions**:
```typescript
expect(bundleContent).toContain('useService');
expect(bundleContent).toContain('CounterServiceInterface');
```

---

### Babel Plugin Test
**File**: `packages/babel-plugin-di/src/__tests__/e2e.test.ts`

**Approach**:
- Uses `@babel/core` `transformFileSync` API
- Transforms individual file (not bundling)
- Requires TypeScript and React presets

**Dependencies**:
- `@babel/core`: ^7.0.0
- `@babel/plugin-syntax-typescript`: ^7.24.0
- `@babel/preset-react`: ^7.24.0
- `@babel/preset-typescript`: ^7.24.0

**Key assertions**:
```typescript
expect(transformedContent).toContain('useService');
expect(transformedContent).toContain('CounterServiceInterface');
```

---

### TypeScript Transformer Test
**File**: `packages/typescript-transformer/src/__tests__/e2e.test.ts`

**Approach**:
- Uses native TypeScript compiler API
- Creates `ts.Program` and applies custom transformer
- Compiles to JavaScript
- 30-second timeout for compilation

**Key assertions**:
```typescript
expect(transformedContent).toContain('useService');
expect(transformedContent).toContain('CounterServiceInterface');
expect(compiledContent).toContain('CounterService');
```

## Expected Transformation

### Input (Counter.tsx)
```typescript
export function Counter(props: {
  services: {
    counter: Inject<CounterServiceInterface>;
  };
}) {
  const { counter } = props.services;
  return <div>{counter.state.count}</div>;
}
```

### Output (Transformed)
```typescript
import { useService } from '@tdi2/di-core/context';

export function Counter(props: {
  services: {
    counter: Inject<CounterServiceInterface>;
  };
}) {
  const counter = props.services?.counter ??
    (useService('CounterServiceInterface') as unknown as CounterServiceInterface);
  return <div>{counter.state.count}</div>;
}
```

## Generated Files

Each test verifies that the following files are generated:

```
src/generated/
├── di-config-[hash].ts          # Main DI configuration
├── interface-bridge-[hash].ts   # Interface-to-implementation mapping
└── .metadata.json               # Configuration metadata
```

## Troubleshooting

### Test Failures

**"Cannot find module '@tdi2/plugin-core'"**
- Run `bun install` in monorepo root
- Ensure workspace dependencies are linked

**"useService not found in bundle"**
- Check that `enableFunctionalDI: true` is set
- Verify fixtures contain `Inject<T>` type annotations
- Enable `verbose: true` to see transformation logs

**Webpack timeout errors**
- Increase timeout in test: `beforeAll(async () => {...}, 30000)`
- Check for TypeScript compilation errors
- Verify `ts-loader` is installed

**Babel preset errors**
- Ensure all Babel presets are installed
- Check `.babelrc` configuration in test
- Verify TypeScript syntax plugin is loaded

### Performance

Test execution times (approximate):

- **esbuild**: ~500ms (fastest)
- **Rollup**: ~1-2s
- **Babel**: ~1-2s
- **TypeScript**: ~3-5s
- **Webpack**: ~5-10s (slowest)

### Debugging

Enable verbose output in any test:

```typescript
tdi2Plugin({
  verbose: true,  // Enable debug logs
  generateDebugFiles: true,  // Write transformation snapshots
  // ...
})
```

Check generated debug files:
```
src/generated/debug/
├── Counter.transformed.tsx
└── transformation-log.json
```

## CI/CD Integration

All tests run automatically in CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run all tests
  run: |
    cd monorepo
    bun install
    bun run test
```

Expected coverage:
- ✅ All 5 plugins tested
- ✅ Interface resolution verified
- ✅ Functional DI transformation verified
- ✅ Generated config files checked

## Future Improvements

- [ ] Add React Testing Library tests to verify runtime behavior
- [ ] Test actual component rendering with DI container
- [ ] Add snapshot tests for transformed output
- [ ] Test error cases (missing services, circular dependencies)
- [ ] Performance benchmarks for each plugin
- [ ] Integration tests with real React apps
