# @tdi2/plugin-core

Shared utilities and orchestration logic for TDI2 build tool plugins.

## Overview

This package provides common functionality used by all TDI2 build tool plugins:
- **Configuration management** - Validation, defaults, normalization
- **Pattern detection** - Detect DI patterns in source code
- **Performance tracking** - Monitor transformation performance
- **Logging utilities** - Consistent logging across plugins
- **Transform orchestration** - Coordinate DI transformations

## Installation

```bash
npm install @tdi2/plugin-core
```

## Usage

This package is primarily intended for use by other TDI2 plugin packages. If you're implementing a custom build tool plugin, you can use these utilities:

```typescript
import {
  getDefaultConfig,
  validateConfig,
  detectDIPatterns,
  TransformOrchestrator,
  createPerformanceTracker,
  createLogger,
} from '@tdi2/plugin-core';

// Get default configuration
const config = getDefaultConfig(userOptions);

// Validate configuration
validateConfig(config);

// Create orchestrator
const orchestrator = new TransformOrchestrator({
  ...config,
  pluginName: 'my-custom-plugin',
});

// Initialize transformers
await orchestrator.initialize();

// Transform files
const result = orchestrator.transformFile(filePath, sourceCode);

if (result.wasTransformed) {
  console.log('File was transformed!');
  return result.code;
}
```

## API

### Configuration

#### `getDefaultConfig(userConfig?: PluginConfig): Required<PluginConfig>`

Merges user configuration with defaults.

#### `validateConfig(config: Required<PluginConfig>): void`

Validates configuration and throws errors for invalid settings.

#### `shouldProcessFile(filePath: string, extensions: string[]): boolean`

Checks if a file should be processed based on path and extension.

### Pattern Detection

#### `detectDIPatterns(content: string, config: Required<PluginConfig>): DIPatternDetection`

Analyzes source code for DI patterns.

#### `quickDICheck(content: string): boolean`

Fast heuristic check for DI patterns.

### Performance Tracking

#### `createPerformanceTracker(): PerformanceTracker`

Creates a performance tracker instance.

```typescript
const tracker = createPerformanceTracker();

tracker.startTransformation();
// ... do work ...
tracker.endTransformation();

console.log(tracker.formatStats());
```

### Logging

#### `createLogger(verbose: boolean, prefix?: string): PluginLogger`

Creates a logger that respects verbose settings.

### Transform Orchestration

#### `TransformOrchestrator`

Orchestrates DI transformations:

```typescript
const orchestrator = new TransformOrchestrator({
  srcDir: './src',
  outputDir: './src/generated',
  verbose: true,
  enableFunctionalDI: true,
  enableInterfaceResolution: true,
  pluginName: 'my-plugin',
  // ... other config
});

await orchestrator.initialize();

const result = orchestrator.transformFile(filePath, code);
```

## Related Packages

- [@tdi2/di-core](../di-core) - Core DI runtime
- [@tdi2/vite-plugin-di](../vite-plugin-di) - Vite plugin
- [@tdi2/webpack-plugin-di](../webpack-plugin-di) - Webpack plugin
- [@tdi2/rollup-plugin-di](../rollup-plugin-di) - Rollup plugin
- [@tdi2/esbuild-plugin-di](../esbuild-plugin-di) - esbuild plugin
- [@tdi2/babel-plugin-di](../babel-plugin-di) - Babel plugin
- [@tdi2/typescript-transformer](../typescript-transformer) - TypeScript transformer

## License

MIT
