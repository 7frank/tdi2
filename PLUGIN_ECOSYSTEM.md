# TDI2 Plugin Ecosystem

This document describes the complete TDI2 plugin ecosystem that enables dependency injection transformations across multiple build tools and compilers.

## Architecture Overview

The plugin ecosystem follows a shared-core architecture:

```
@tdi2/di-core (transformation logic)
     ↑
@tdi2/plugin-core (shared plugin utilities)
     ↑
     ├── @tdi2/vite-plugin-di (Vite integration)
     ├── @tdi2/typescript-transformer (TypeScript compiler via ts-patch)
     ├── @tdi2/rollup-plugin-di (Rollup integration)
     ├── @tdi2/webpack-plugin-di (Webpack 5 integration)
     ├── @tdi2/esbuild-plugin-di (esbuild integration)
     └── @tdi2/babel-plugin-di (Babel integration)
```

## Package Descriptions

### Core Packages

#### @tdi2/di-core
- Contains the actual transformation logic (`EnhancedDITransformer`, `FunctionalDIEnhancedTransformer`)
- Uses ts-morph for AST manipulation
- Handles interface resolution and dependency injection
- **No build-tool-specific code**

#### @tdi2/plugin-core
- Shared utilities for all build tool plugins
- Configuration management and validation
- Pattern detection (detecting DI decorators/interfaces in code)
- Performance tracking
- File filtering (`shouldProcessFile`)
- Transform orchestration
- **100% reusable across all plugins**

### Build Tool Plugins

#### @tdi2/vite-plugin-di
**Status**: ✅ Updated to use plugin-core

**Installation**:
```bash
npm install --save-dev @tdi2/vite-plugin-di
```

**Usage**:
```typescript
// vite.config.ts
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      srcDir: './src',
      verbose: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
    }),
    react(),
  ],
});
```

**Features**:
- Hot Module Replacement (HMR) support
- Debug endpoints (`/_di_debug`, `/_di_interfaces`, etc.)
- Development/production presets
- File watching
- Config management (reuse, cleanup)

---

#### @tdi2/typescript-transformer
**Status**: ✅ Updated to use plugin-core

**Installation**:
```bash
npm install --save-dev @tdi2/typescript-transformer ts-patch
npx ts-patch install
```

**Usage**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@tdi2/typescript-transformer",
        "srcDir": "./src",
        "verbose": true,
        "enableFunctionalDI": true,
        "enableInterfaceResolution": true
      }
    ]
  }
}
```

**Features**:
- Direct TypeScript compiler integration
- Works with `tsc`, `ts-node`, and other TypeScript tools
- Cache-based transformation (transform once, lookup synchronously)
- Transformation statistics

---

#### @tdi2/rollup-plugin-di
**Status**: ✅ Created and built

**Installation**:
```bash
npm install --save-dev @tdi2/rollup-plugin-di
```

**Usage**:
```javascript
// rollup.config.js
import { tdi2Plugin } from '@tdi2/rollup-plugin-di';

export default {
  plugins: [
    tdi2Plugin({
      srcDir: './src',
      verbose: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
    }),
  ],
};
```

**Features**:
- Integrates via Rollup's `transform` hook
- Full source map support
- Parallel transformation support

---

#### @tdi2/webpack-plugin-di
**Status**: ✅ Created and built

**Installation**:
```bash
npm install --save-dev @tdi2/webpack-plugin-di
```

**Usage**:
```javascript
// webpack.config.js
const { TDI2WebpackPlugin } = require('@tdi2/webpack-plugin-di');

module.exports = {
  plugins: [
    new TDI2WebpackPlugin({
      srcDir: './src',
      verbose: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
    }),
  ],
};
```

**Features**:
- Webpack 5 compatible
- Integrates via `compilation.hooks.buildModule`
- Supports watch mode
- Compatible with webpack-dev-server

---

#### @tdi2/esbuild-plugin-di
**Status**: ✅ Created and built

**Installation**:
```bash
npm install --save-dev @tdi2/esbuild-plugin-di
```

**Usage**:
```javascript
// esbuild.config.js
const { tdi2Plugin } = require('@tdi2/esbuild-plugin-di');

require('esbuild').build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  plugins: [
    tdi2Plugin({
      srcDir: './src',
      verbose: true,
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
    }),
  ],
});
```

**Features**:
- Ultra-fast transformation (esbuild's speed + cached transforms)
- Integrates via `onLoad` hook
- Watch mode support

---

#### @tdi2/babel-plugin-di
**Status**: ✅ Created and built

**Installation**:
```bash
npm install --save-dev @tdi2/babel-plugin-di
```

**Usage**:
```json
// .babelrc
{
  "plugins": [
    ["@tdi2/babel-plugin-di", {
      "srcDir": "./src",
      "verbose": true,
      "enableFunctionalDI": true,
      "enableInterfaceResolution": true
    }]
  ]
}
```

**Features**:
- Babel 7+ compatible
- Integrates via AST visitor pattern
- Works with `@babel/cli`, `babel-loader`, etc.

---

## Common Configuration

All plugins share the same configuration schema from `@tdi2/plugin-core`:

```typescript
interface PluginConfig {
  // Required
  srcDir?: string;              // Default: './src'
  outputDir?: string;           // Default: './src/generated'

  // Features
  verbose?: boolean;            // Default: false
  enableFunctionalDI?: boolean; // Default: true
  enableInterfaceResolution?: boolean; // Default: true
  generateDebugFiles?: boolean; // Default: false

  // Advanced
  advanced?: {
    fileExtensions?: string[];  // Default: ['.ts', '.tsx']
    diPatterns?: {
      serviceDecorator?: RegExp;
      injectDecorator?: RegExp;
      interfaceMarker?: RegExp;
    };
    performance?: {
      parallel?: boolean;       // Default: true
      maxConcurrency?: number;  // Default: 10
      enableCache?: boolean;    // Default: true
    };
  };
}
```

### Plugin-Specific Options

#### Vite Plugin Only
```typescript
interface DIPluginOptions extends PluginConfig {
  watch?: boolean;              // Default: true
  cleanOldConfigs?: boolean;    // Default: true
  keepConfigCount?: number;     // Default: 3
  reuseExistingConfig?: boolean; // Default: true
}
```

## Code Sharing Summary

### What's Shared (100% reuse)
✅ All transformation logic (`@tdi2/di-core`)
✅ Configuration management and validation
✅ Pattern detection
✅ Performance tracking
✅ File filtering
✅ Transform orchestration
✅ Type definitions

### What's Different (necessarily unique)
❌ Build tool API integration (each has different hooks/APIs)
❌ Plugin lifecycle management
❌ Module system integration
❌ Source map handling (varies by build tool)

## Implementation Strategy

Each plugin follows the same pattern:

1. **Initialization**: Create `TransformOrchestrator` from `@tdi2/plugin-core`
2. **One-time transformation**: Call `orchestrator.initialize()` to transform all files
3. **Cached lookup**: For each file request, use `orchestrator.transformFile()` to get cached result
4. **Build tool integration**: Return transformed code in build-tool-specific format

This ensures:
- ⚡ Fast builds (transform once, cache results)
- 🎯 Consistent behavior across all build tools
- 🔧 Easy maintenance (fix once, works everywhere)
- 📦 Minimal duplication

## Testing

TODO: Create example projects for each plugin:

- [ ] `examples/tdi2-vite-example` (already exists)
- [ ] `examples/tdi2-typescript-example`
- [ ] `examples/tdi2-rollup-example`
- [ ] `examples/tdi2-webpack-example`
- [ ] `examples/tdi2-esbuild-example`
- [ ] `examples/tdi2-babel-example`

## Performance Characteristics

| Plugin | Build Speed | Watch Mode | HMR Support | Recommended Use Case |
|--------|-------------|------------|-------------|---------------------|
| Vite | ⚡⚡⚡ Very Fast | ✅ Yes | ✅ Yes | Modern React development |
| esbuild | ⚡⚡⚡ Very Fast | ✅ Yes | ❌ No | Fast production builds |
| TypeScript | ⚡⚡ Fast | ✅ Yes | ❌ No | Type-checking builds, libraries |
| Rollup | ⚡⚡ Fast | ✅ Yes | ❌ No | Library builds, tree-shaking |
| Webpack | ⚡ Moderate | ✅ Yes | ⚡ Partial | Legacy projects, complex configs |
| Babel | ⚡ Moderate | ✅ Yes | ❌ No | Custom transpilation pipelines |

## Migration Guide

### From Vite to Another Build Tool

If you're currently using `@tdi2/vite-plugin-di` and want to switch:

1. **Switching to TypeScript Compiler**:
   ```bash
   npm install --save-dev @tdi2/typescript-transformer ts-patch
   npx ts-patch install
   ```

   Update `tsconfig.json` with plugin configuration (see above)

2. **Switching to Rollup**:
   ```bash
   npm install --save-dev @tdi2/rollup-plugin-di
   ```

   Update `rollup.config.js` with plugin (see above)

3. **Switching to Webpack**:
   ```bash
   npm install --save-dev @tdi2/webpack-plugin-di
   ```

   Update `webpack.config.js` with plugin (see above)

All plugins use the same configuration schema, so you can copy your config directly.

## Troubleshooting

### Build Issues

If you encounter build errors:

1. **Enable verbose mode**: Set `verbose: true` in plugin config
2. **Check file extensions**: Ensure `advanced.fileExtensions` includes your files
3. **Verify source directory**: Confirm `srcDir` points to correct location
4. **Check dependencies**: Ensure `@tdi2/di-core` is installed

### Transformation Issues

If transformations aren't being applied:

1. **Verify DI patterns**: Files must contain `@Service`, `Inject<T>`, or interface implementations
2. **Check file filtering**: Files might be filtered by `shouldProcessFile`
3. **Enable debug files**: Set `generateDebugFiles: true` to inspect transformations
4. **Review output**: Check generated files in `outputDir`

## Future Improvements

- [ ] Add SWC plugin for Rust-based transformation
- [ ] Add Parcel plugin support
- [ ] Performance benchmarks across all build tools
- [ ] Integration tests for each plugin
- [ ] Example projects demonstrating each plugin
- [ ] VSCode extension for debugging transformations
- [ ] CLI tool for standalone transformation

## Contributing

Each plugin follows the same architecture:

1. Extend `@tdi2/plugin-core` types
2. Use `TransformOrchestrator` for transformation
3. Integrate with build tool's specific hooks
4. Return transformed code in expected format
5. Add tests and examples

See individual package READMEs for development instructions.
