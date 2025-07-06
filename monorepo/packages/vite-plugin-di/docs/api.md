# API Documentation

Complete API reference for @tdi2/vite-plugin-di.

## Table of Contents

- [Plugin Function](#plugin-function)
- [Configuration Options](#configuration-options)
- [Type Definitions](#type-definitions)
- [Utility Functions](#utility-functions)
- [Debug Endpoints](#debug-endpoints)
- [Presets](#presets)

## Plugin Function

### `diEnhancedPlugin(options?)`

Creates a Vite plugin for TDI2 dependency injection with interface-based automatic resolution.

```typescript
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      verbose: true,
      enableInterfaceResolution: true,
    }),
  ],
});
```

**Parameters:**
- `options` (optional): [`DIPluginOptions`](#dipluginoptions) - Plugin configuration

**Returns:** `Plugin` - Vite plugin object

## Configuration Options

### `DIPluginOptions`

Main configuration interface for the plugin.

```typescript
interface DIPluginOptions {
  srcDir?: string;
  outputDir?: string;
  verbose?: boolean;
  watch?: boolean;
  enableFunctionalDI?: boolean;
  enableInterfaceResolution?: boolean;
  generateDebugFiles?: boolean;
  customSuffix?: string;
  cleanOldConfigs?: boolean;
  keepConfigCount?: number;
  reuseExistingConfig?: boolean;
  advanced?: AdvancedOptions;
}
```

#### Basic Options

##### `srcDir`
- **Type:** `string`
- **Default:** `'./src'`
- **Description:** Source directory to scan for DI decorators and interfaces

```typescript
diEnhancedPlugin({
  srcDir: './app/src'
})
```

##### `outputDir`
- **Type:** `string`
- **Default:** `'./src/generated'`
- **Description:** Output directory for generated DI configuration files

```typescript
diEnhancedPlugin({
  outputDir: './generated'
})
```

##### `verbose`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enable verbose logging for debugging

```typescript
diEnhancedPlugin({
  verbose: process.env.NODE_ENV === 'development'
})
```

##### `watch`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enable file watching for hot reload during development

```typescript
diEnhancedPlugin({
  watch: process.env.NODE_ENV !== 'production'
})
```

##### `enableFunctionalDI`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enable functional component dependency injection transformation

```typescript
diEnhancedPlugin({
  enableFunctionalDI: true
})
```

##### `enableInterfaceResolution`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enable automatic interface-to-implementation resolution

```typescript
diEnhancedPlugin({
  enableInterfaceResolution: true
})
```

##### `generateDebugFiles`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Generate debug files for transformation inspection

```typescript
diEnhancedPlugin({
  generateDebugFiles: process.env.DEBUG === 'true'
})
```

##### `reuseExistingConfig`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Reuse existing valid configurations instead of regenerating

```typescript
diEnhancedPlugin({
  reuseExistingConfig: true
})
```

##### `cleanOldConfigs`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Automatically clean old configuration files

```typescript
diEnhancedPlugin({
  cleanOldConfigs: true,
  keepConfigCount: 5
})
```

#### Advanced Options

##### `advanced.fileExtensions`
- **Type:** `string[]`
- **Default:** `['.ts', '.tsx']`
- **Description:** Custom file extensions to scan for DI patterns

```typescript
diEnhancedPlugin({
  advanced: {
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx']
  }
})
```

##### `advanced.diPatterns`
- **Type:** `DIPatterns`
- **Description:** Custom patterns to detect DI usage

```typescript
interface DIPatterns {
  serviceDecorator?: RegExp;
  injectDecorator?: RegExp;
  interfaceMarker?: RegExp;
}

diEnhancedPlugin({
  advanced: {
    diPatterns: {
      serviceDecorator: /@(Service|Component)\s*\(/,
      injectDecorator: /@(Inject|Autowired)\s*\(/,
      interfaceMarker: /(Inject|InjectOptional)<.*>/,
    }
  }
})
```

##### `advanced.performance`
- **Type:** `PerformanceOptions`
- **Description:** Performance optimization settings

```typescript
interface PerformanceOptions {
  parallel?: boolean;
  maxConcurrency?: number;
  enableCache?: boolean;
}

diEnhancedPlugin({
  advanced: {
    performance: {
      parallel: true,
      maxConcurrency: 8,
      enableCache: true,
    }
  }
})
```

## Type Definitions

### Core Types

#### `TransformationSummary`

Information about the transformation process.

```typescript
interface TransformationSummary {
  count: number;
  functions: string[];
  transformedFiles: string[];
  resolvedDependencies: number;
  errors: Array<{
    file: string;
    error: string;
  }>;
}
```

#### `ConfigInfo`

Information about the DI configuration.

```typescript
interface ConfigInfo {
  hash: string;
  configDir: string;
  bridgeDir: string;
  isValid: boolean;
  timestamp: string;
  metadata?: {
    enableFunctionalDI: boolean;
    enableInterfaceResolution: boolean;
    packageName: string;
    environment: string;
  };
}
```

#### `InterfaceImplementation`

Details about interface-to-implementation mappings.

```typescript
interface InterfaceImplementation {
  sanitizedKey: string;
  interfaceName: string;
  implementationClass: string;
  filePath: string;
  isGeneric: boolean;
  typeParameters: string[];
  registrationType: 'interface' | 'class' | 'inheritance' | 'state';
}
```

#### `ServiceDependency`

Information about service dependencies.

```typescript
interface ServiceDependency {
  serviceClass: string;
  filePath: string;
  constructorParams: Array<{
    paramName: string;
    interfaceType: string;
    isOptional: boolean;
    sanitizedKey: string;
  }>;
}
```

#### `DIDebugInfo`

Complete debug information structure.

```typescript
interface DIDebugInfo {
  config: ConfigInfo;
  transformedFiles: string[];
  functionalSummary: TransformationSummary;
  interfaceResolution: InterfaceResolutionInfo | null;
  options: DIPluginOptions;
  timestamp: string;
  performance?: {
    transformationTime: number;
    scanTime: number;
    cacheHits: number;
    cacheMisses: number;
  };
}
```

## Utility Functions

### `getDIPluginDefaults(userOptions)`

Get default plugin options merged with user options.

```typescript
import { getDIPluginDefaults } from '@tdi2/vite-plugin-di';

const options = getDIPluginDefaults({
  verbose: true,
  srcDir: './custom-src'
});
```

### `validateDIPluginOptions(options)`

Validate plugin options and throw errors for invalid configurations.

```typescript
import { validateDIPluginOptions, getDIPluginDefaults } from '@tdi2/vite-plugin-di';

const options = getDIPluginDefaults({ srcDir: '' });
validateDIPluginOptions(options); // Throws: "srcDir must be a non-empty string"
```

### `createDIPluginPresets()`

Create preset configurations for common use cases.

```typescript
import { createDIPluginPresets } from '@tdi2/vite-plugin-di';

const presets = createDIPluginPresets();

// Available presets:
// - presets.development
// - presets.production
// - presets.testing
// - presets.minimal
// - presets.debugging
```

### `detectDIPatterns(content, options)`

Detect DI patterns in source code.

```typescript
import { detectDIPatterns, getDIPluginDefaults } from '@tdi2/vite-plugin-di';

const content = `
  @Service()
  export class MyService {}
`;

const options = getDIPluginDefaults({});
const result = detectDIPatterns(content, options);

console.log(result.hasDI); // true
console.log(result.patterns); // ['@Service']
```

## Debug Endpoints

During development, the plugin provides several debug endpoints:

### `/_di_debug`

Complete debug information including configuration, transformations, and performance metrics.

```bash
curl http://localhost:5173/_di_debug | jq
```

**Response:**
```json
{
  "config": {
    "hash": "tdi2-abc123",
    "configDir": "./node_modules/.tdi2/configs/tdi2-abc123",
    "bridgeDir": "./src/.tdi2",
    "isValid": true
  },
  "transformedFiles": ["./src/components/UserProfile.tsx"],
  "functionalSummary": {
    "count": 5,
    "resolvedDependencies": 12
  },
  "performance": {
    "transformationTime": 245,
    "cacheHits": 3,
    "cacheMisses": 1
  }
}
```

### `/_di_interfaces`

Interface-to-implementation mappings and dependency information.

```bash
curl http://localhost:5173/_di_interfaces | jq
```

**Response:**
```json
{
  "implementations": [
    {
      "sanitizedKey": "LoggerInterface",
      "interfaceName": "LoggerInterface", 
      "implementationClass": "ConsoleLogger",
      "registrationType": "interface"
    }
  ],
  "dependencies": [
    {
      "serviceClass": "UserService",
      "constructorParams": [
        {
          "paramName": "logger",
          "interfaceType": "LoggerInterface",
          "isOptional": false
        }
      ]
    }
  ]
}
```

### `/_di_configs`

List of all available configurations.

```bash
curl http://localhost:5173/_di_configs | jq
```

### `/_di_performance`

Performance statistics and build context.

```bash
curl http://localhost:5173/_di_performance | jq
```

### `/_di_regenerate`

Force regeneration of DI configuration.

```bash
curl -X POST http://localhost:5173/_di_regenerate
```

## Presets

### Available Presets

#### `development`
Optimized for development with verbose logging and hot reload.

```typescript
{
  verbose: true,
  watch: true,
  enableFunctionalDI: true,
  enableInterfaceResolution: true,
  generateDebugFiles: true,
  reuseExistingConfig: true,
  cleanOldConfigs: false,
}
```

#### `production`
Optimized for production builds with minimal logging.

```typescript
{
  verbose: false,
  watch: false,
  enableFunctionalDI: true,
  enableInterfaceResolution: true,
  generateDebugFiles: false,
  reuseExistingConfig: false,
  cleanOldConfigs: true,
  keepConfigCount: 1,
}
```

#### `testing`
Optimized for test environments with fast rebuilds.

```typescript
{
  verbose: false,
  watch: false,
  enableFunctionalDI: true,
  enableInterfaceResolution: true,
  generateDebugFiles: false,
  reuseExistingConfig: true,
  cleanOldConfigs: false,
}
```

#### `minimal`
Basic DI without functional components or interface resolution.

```typescript
{
  verbose: false,
  watch: true,
  enableFunctionalDI: false,
  enableInterfaceResolution: false,
  generateDebugFiles: false,
  reuseExistingConfig: true,
}
```

#### `debugging`
Maximum verbosity and debug information for troubleshooting.

```typescript
{
  verbose: true,
  watch: true,
  enableFunctionalDI: true,
  enableInterfaceResolution: true,
  generateDebugFiles: true,
  reuseExistingConfig: false,
  cleanOldConfigs: false,
  advanced: {
    performance: {
      parallel: false,
      maxConcurrency: 1,
      enableCache: false,
    },
  },
}
```

## Error Handling

### Common Errors

#### Configuration Errors
```typescript
// Invalid srcDir
DIPlugin: srcDir must be a non-empty string

// Invalid keepConfigCount
DIPlugin: keepConfigCount must be at least 1
```

#### Transformation Errors
```typescript
// Missing @tdi2/di-core dependency
Cannot resolve '@tdi2/di-core/tools'

// Interface resolution failed
Interface 'UserServiceInterface' could not be resolved
```

#### Runtime Errors
```typescript
// Service not registered
Service 'UserService' is not registered in the DI container

// Circular dependency detected
Circular dependency detected: UserService -> LoggerService -> UserService
```

### Error Recovery

The plugin includes automatic error recovery mechanisms:

1. **Configuration validation** - Early detection of invalid options
2. **Graceful degradation** - Continue with reduced functionality on errors
3. **Hot reload recovery** - Automatic retransformation on file changes
4. **Cache invalidation** - Clear corrupted cache automatically

## Advanced Usage

### Custom DI Patterns

```typescript
diEnhancedPlugin({
  advanced: {
    diPatterns: {
      // Custom service decorator
      serviceDecorator: /@(Service|Component|Injectable)\s*\(/,
      
      // Custom inject decorator  
      injectDecorator: /@(Inject|Autowired|Wire)\s*\(/,
      
      // Custom interface markers
      interfaceMarker: /(Inject|InjectOptional|Dependency)<.*>/,
    }
  }
})
```

### Performance Optimization

```typescript
diEnhancedPlugin({
  advanced: {
    performance: {
      // Enable parallel processing for large codebases
      parallel: true,
      
      // Limit concurrent file processing
      maxConcurrency: require('os').cpus().length,
      
      // Enable transformation caching
      enableCache: true,
    }
  }
})
```

### Custom File Extensions

```typescript
diEnhancedPlugin({
  advanced: {
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.vue']
  }
})
```

## Integration Examples

### Next.js Integration

```typescript
// next.config.js
const { diEnhancedPlugin } = require('@tdi2/vite-plugin-di');

module.exports = {
  experimental: {
    vitePlugins: [
      diEnhancedPlugin({
        srcDir: './src',
        enableInterfaceResolution: true,
      }),
    ],
  },
};
```

### Nuxt Integration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    plugins: [
      diEnhancedPlugin({
        srcDir: './components',
        enableFunctionalDI: true,
      }),
    ],
  },
});
```

### SvelteKit Integration

```typescript
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin(),
    sveltekit(),
  ],
});
```