# @tdi2/di-core

TypeScript Dependency Injection 2 - Core DI framework with interface-based resolution.

## Status

🚧 Under active development - being refactored from monolithic structure.

## Installation

```bash
npm install @tdi2/di-core
```

## Usage

```typescript
import { TDI2_VERSION } from "@tdi2/di-core";
console.log(TDI2_VERSION);
```

run `bun .cli.ts`

## Testing

- run all tests `bun test`
- `UPDATE_SNAPSHOTS=1 bun test --update-snapshots`
- run primary integration and code generation tests `b test ./tools/functional-di-enhanced-transformer/__tests__/code-transformation.test.ts`
- update snapshots of primary integration and code generation tests `UPDATE_SNAPSHOTS=1 b test ./tools/functional-di-enhanced-transformer/__tests__/code-transformation.test.ts`

- work on individual test in test suite e.g.
  - `                   bun test --test-name-pattern "should transform destructured keys and types in parameters"`
  - `UPDATE_SNAPSHOTS=1 bun test --test-name-pattern "should transform destructured keys and types in parameters"`


## Debug
- see [Debug.md](Debug.md)
