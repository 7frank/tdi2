# @tdi2/typescript-transformer

TypeScript custom transformer for TDI2 (TypeScript Dependency Injection) that integrates with the TypeScript compiler via [ts-patch](https://github.com/nonara/ts-patch).

## Overview

This transformer enables TDI2's dependency injection features to work directly with the TypeScript compiler (`tsc`), allowing you to use TDI2 in projects that don't use Vite or other bundlers that support custom plugins.

**Features:**
- ✅ Automatic dependency injection transformation at compile time
- ✅ Interface-to-implementation resolution
- ✅ Functional component DI transformation
- ✅ Works with standard TypeScript compiler via ts-patch
- ✅ Compatible with all build tools that use `tsc`
- ✅ Zero runtime overhead - transformations happen during compilation

## Installation

```bash
npm install --save-dev @tdi2/typescript-transformer ts-patch
```

Or with other package managers:

```bash
yarn add -D @tdi2/typescript-transformer ts-patch
pnpm add -D @tdi2/typescript-transformer ts-patch
bun add -D @tdi2/typescript-transformer ts-patch
```

## Setup

### 1. Install ts-patch

After installing the packages, patch your TypeScript installation:

```bash
npx ts-patch install
```

This modifies your local TypeScript installation to support custom transformers.

### 2. Configure tsconfig.json

Add the transformer to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "plugins": [
      {
        "transform": "@tdi2/typescript-transformer",
        "srcDir": "./src",
        "outputDir": "./src/generated",
        "enableFunctionalDI": true,
        "enableInterfaceResolution": true,
        "verbose": false
      }
    ]
  }
}
```

### 3. Use tspc instead of tsc

When building, use `tspc` (TypeScript Patch Compiler) instead of `tsc`:

```bash
npx tspc
```

Update your `package.json` scripts:

```json
{
  "scripts": {
    "build": "tspc",
    "dev": "tspc --watch",
    "type-check": "tspc --noEmit"
  }
}
```

## Configuration Options

All options are specified in the `plugins` array of your `tsconfig.json`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `srcDir` | `string` | `'./src'` | Source directory to scan for DI patterns |
| `outputDir` | `string` | `'./src/generated'` | Output directory for generated DI configuration |
| `enableFunctionalDI` | `boolean` | `true` | Enable functional component DI transformation |
| `enableInterfaceResolution` | `boolean` | `true` | Enable automatic interface-to-implementation resolution |
| `verbose` | `boolean` | `false` | Enable verbose logging for debugging |
| `generateDebugFiles` | `boolean` | `false` | Generate debug files for transformation inspection |
| `customSuffix` | `string` | `undefined` | Custom suffix for configuration identification |
| `enableParameterNormalization` | `boolean` | `true` | Normalize component parameters during transformation |
| `generateFallbacks` | `boolean` | `false` | Generate fallback implementations for missing dependencies |

### Example Configurations

**Minimal configuration:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "plugins": [
      { "transform": "@tdi2/typescript-transformer" }
    ]
  }
}
```

**Development with verbose logging:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "plugins": [
      {
        "transform": "@tdi2/typescript-transformer",
        "verbose": true,
        "generateDebugFiles": true
      }
    ]
  }
}
```

**Production optimized:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "plugins": [
      {
        "transform": "@tdi2/typescript-transformer",
        "verbose": false,
        "generateDebugFiles": false,
        "enableParameterNormalization": true
      }
    ]
  }
}
```

## Usage Examples

### Basic Service Definition

```typescript
// services/counter.service.ts
import { Service } from '@tdi2/di-core';

interface CounterServiceInterface {
  state: { count: number };
  increment(): void;
}

@Service()
export class CounterService implements CounterServiceInterface {
  state = { count: 0 };

  increment() {
    this.state.count++;
  }
}
```

### Functional Component with DI

**Before transformation:**
```typescript
import { Inject } from '@tdi2/di-core';
import { CounterService } from './services/counter.service';

export function Counter({
  counterService
}: {
  counterService: Inject<CounterService>
}) {
  return (
    <div>
      <p>Count: {counterService.state.count}</p>
      <button onClick={() => counterService.increment()}>
        Increment
      </button>
    </div>
  );
}
```

**After transformation (automatic):**
```typescript
import { useService } from '@tdi2/di-core';
import { CounterService } from './services/counter.service';

export function Counter() {
  const counterService = useService(CounterService);

  return (
    <div>
      <p>Count: {counterService.state.count}</p>
      <button onClick={() => counterService.increment()}>
        Increment
      </button>
    </div>
  );
}
```

## How It Works

1. **Compilation Time:** When you run `tspc`, the transformer intercepts the compilation process
2. **AST Analysis:** It analyzes the TypeScript Abstract Syntax Tree (AST) for DI patterns
3. **Transformation:** Components and services are transformed to use the DI container
4. **Interface Resolution:** TypeScript interfaces are automatically mapped to their implementations
5. **Code Generation:** Transformed code is emitted as standard JavaScript/TypeScript

## Integration with Build Tools

### With Next.js

Next.js doesn't directly support ts-patch transformers, but you can use them in a pre-build step:

```json
{
  "scripts": {
    "prebuild": "tspc --noEmit",
    "build": "next build"
  }
}
```

### With Create React App

CRA requires ejecting to customize the TypeScript configuration. After ejecting:

1. Install ts-patch and the transformer
2. Patch TypeScript: `npx ts-patch install`
3. Configure `tsconfig.json` as shown above
4. Update build scripts to use `tspc`

### With Webpack

If using Webpack with ts-loader:

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          compiler: 'ts-patch/compiler',
        },
      },
    ],
  },
};
```

### With Rollup

Use `@rollup/plugin-typescript` with ts-patch:

```js
// rollup.config.js
import typescript from '@rollup/plugin-typescript';

export default {
  plugins: [
    typescript({
      typescript: require('ts-patch/compiler'),
    }),
  ],
};
```

## Troubleshooting

### Transformer not running

**Problem:** Changes to components aren't being transformed.

**Solutions:**
1. Ensure you're using `tspc` instead of `tsc`
2. Verify ts-patch is installed: `npx ts-patch install`
3. Check that `experimentalDecorators` is enabled in `tsconfig.json`
4. Enable `verbose: true` to see transformation logs

### TypeScript errors after patching

**Problem:** TypeScript shows errors after installing ts-patch.

**Solutions:**
1. Restart your IDE/editor
2. Clear TypeScript cache: `rm -rf node_modules/.cache`
3. Reinstall dependencies: `npm install`

### Transformations not persisting

**Problem:** Code transforms during compilation but reverts.

**Solution:** Ensure you're not editing generated files. The transformer creates files in `outputDir` which should not be manually edited.

### Performance issues

**Problem:** Compilation is slow with the transformer.

**Solutions:**
1. Reduce scope with `srcDir` to target specific directories
2. Disable `generateDebugFiles` in production
3. Use `verbose: false` to reduce logging overhead
4. Consider using the Vite plugin for development

## Comparison with Vite Plugin

| Feature | TypeScript Transformer | Vite Plugin |
|---------|----------------------|-------------|
| Build Tool | Any (tsc-based) | Vite only |
| Performance | Slower (full compilation) | Faster (HMR) |
| Setup | Requires ts-patch | Native Vite plugin |
| Dev Experience | Standard tsc workflow | Hot module replacement |
| Production Builds | Standard tsc output | Optimized bundles |
| Use Case | Libraries, non-Vite apps | Vite-based applications |

**Recommendation:** Use the Vite plugin for Vite-based projects, and this TypeScript transformer for libraries or projects using other build tools.

## API Reference

### Default Export

```typescript
export default function tdi2Transformer(
  program: ts.Program,
  config: PluginConfig,
  extras: TransformerExtras
): ts.TransformerFactory<ts.SourceFile>
```

The main transformer factory compatible with ts-patch.

### Types

```typescript
import type {
  TDI2TransformerConfig,
  PluginConfig,
  TransformStats
} from '@tdi2/typescript-transformer';
```

See [types.ts](./src/types.ts) for complete type definitions.

## Examples

Check out the [examples directory](../../examples) for complete working examples:

- [Basic Example](../../examples/tdi2-basic-example) - Simple counter app
- [E-commerce Example](../../examples/tdi2-ecommerce-example) - Full-featured shopping cart
- [Comparison Example](../../examples/comparison) - Before/after comparison

## Contributing

Contributions are welcome! Please see the [main TDI2 repository](https://github.com/7frank/tdi2) for contribution guidelines.

## License

MIT

## Related Packages

- [@tdi2/di-core](../di-core) - Core dependency injection runtime
- [@tdi2/vite-plugin-di](../vite-plugin-di) - Vite plugin for TDI2
- [ts-patch](https://github.com/nonara/ts-patch) - TypeScript transformer patcher

## Support

- [Documentation](https://7frank.github.io/tdi2/)
- [GitHub Issues](https://github.com/7frank/tdi2/issues)
- [Examples](https://7frank.github.io/tdi2/test-harness/)
