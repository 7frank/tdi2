---
title: 'Configuration Guide'
description: Complete configuration reference for @tdi2/vite-plugin-di with all options, presets, and environment-specific setups.
---

Complete configuration options and presets for the TDI2 Vite plugin. Use this reference to customize the plugin for your specific needs.

## Quick Configuration

### Zero Config (Recommended)
```typescript
// vite.config.ts
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    diEnhancedPlugin(), // Uses sensible defaults
    react(),
  ],
});
```

### Basic Customization
```typescript
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      enableInterfaceResolution: true,  // Auto-resolve interfaces
      enableFunctionalDI: true,         // Transform components
      verbose: process.env.NODE_ENV === 'development',
    }),
    react(),
  ],
});
```

## Configuration Reference

### Core Options

```typescript
interface DIPluginOptions {
  /** Source directory to scan for DI decorators and interfaces */
  srcDir?: string; // default: './src'
  
  /** Output directory for generated DI configuration files */
  outputDir?: string; // default: './src/.tdi2'
  
  /** Enable verbose logging for debugging */
  verbose?: boolean; // default: false
  
  /** Enable file watching for hot reload during development */
  watch?: boolean; // default: true
  
  /** Enable functional component dependency injection transformation */
  enableFunctionalDI?: boolean; // default: true
  
  /** Enable automatic interface-to-implementation resolution */
  enableInterfaceResolution?: boolean; // default: true
  
  /** Generate debug files for transformation inspection */
  generateDebugFiles?: boolean; // default: false
  
  /** Reuse existing valid configurations instead of regenerating */
  reuseExistingConfig?: boolean; // default: true
  
  /** Automatically clean old configuration files */
  cleanOldConfigs?: boolean; // default: true
  
  /** Number of recent configurations to keep when cleaning */
  keepConfigCount?: number; // default: 3
}
```

### Advanced Options

```typescript
interface DIPluginOptions {
  advanced?: {
    /** Custom file extensions to scan for DI patterns */
    fileExtensions?: string[]; // default: ['.ts', '.tsx']
    
    /** Additional search paths for monorepos */
    searchPaths?: string[]; // default: []
    
    /** Custom patterns to detect DI usage */
    diPatterns?: {
      serviceDecorator?: RegExp;     // default: /@Service\s*\(/
      injectDecorator?: RegExp;      // default: /@Inject\s*\(/
      interfaceMarker?: RegExp;      // default: /Inject<(.+?)>/
    };
    
    /** Performance optimization settings */
    performance?: {
      /** Enable parallel processing for large codebases */
      parallel?: boolean; // default: true
      
      /** Maximum number of files to process concurrently */
      maxConcurrency?: number; // default: 10
      
      /** Enable caching of transformation results */
      enableCache?: boolean; // default: true
      
      /** Cache directory for transformation results */
      cacheDir?: string; // default: './node_modules/.cache/tdi2'
    };
    
    /** Transformation behavior */
    transformation?: {
      /** Preserve original component signatures in debug output */
      preserveSignatures?: boolean; // default: false
      
      /** Generate TypeScript declarations for transformed components */
      generateDeclarations?: boolean; // default: false
      
      /** Custom transformation hooks */
      customTransformers?: TransformHook[];
    };
  };
}
```

## Environment Configurations

### Development Configuration

```typescript
// vite.config.ts
const developmentConfig = {
  // Enable all debugging features
  verbose: true,
  generateDebugFiles: true,
  watch: true,
  
  // Fast rebuilds
  reuseExistingConfig: true,
  cleanOldConfigs: false,
  
  // Interface and component transformation
  enableInterfaceResolution: true,
  enableFunctionalDI: true,
  
  // Development directories
  srcDir: './src',
  outputDir: './src/.tdi2',
  
  advanced: {
    performance: {
      parallel: true,
      maxConcurrency: 10,
      enableCache: true,
    },
  },
};

export default defineConfig({
  plugins: [
    diEnhancedPlugin(developmentConfig),
    react(),
  ],
});
```

### Production Configuration

```typescript
// vite.config.ts
const productionConfig = {
  // Minimal logging
  verbose: false,
  generateDebugFiles: false,
  
  // Optimization enabled
  reuseExistingConfig: true,
  cleanOldConfigs: true,
  keepConfigCount: 1,
  
  // Core features enabled
  enableInterfaceResolution: true,
  enableFunctionalDI: true,
  
  advanced: {
    performance: {
      parallel: true,
      maxConcurrency: 15,
      enableCache: true,
    },
  },
};

export default defineConfig({
  plugins: [
    diEnhancedPlugin(productionConfig),
    react(),
  ],
});
```

### Testing Configuration

```typescript
// vitest.config.ts
const testingConfig = {
  // Fast builds, minimal output
  verbose: false,
  generateDebugFiles: false,
  watch: false,
  
  // Disable caching for consistent test runs
  reuseExistingConfig: false,
  cleanOldConfigs: true,
  
  // Enable transformations for testing
  enableInterfaceResolution: true,
  enableFunctionalDI: true,
  
  // Test-specific output
  outputDir: './src/.tdi2-test',
  
  advanced: {
    performance: {
      parallel: false,     // Consistent ordering
      enableCache: false,  // Fresh builds
    },
  },
};

export default defineConfig({
  plugins: [
    diEnhancedPlugin(testingConfig),
    react(),
  ],
  test: {
    environment: 'jsdom',
  },
});
```

## Predefined Presets

Use presets for common configurations:

```typescript
import { diEnhancedPlugin, createDIPluginPresets } from '@tdi2/vite-plugin-di';

const presets = createDIPluginPresets();

export default defineConfig({
  plugins: [
    // Environment-based preset selection
    process.env.NODE_ENV === 'development'
      ? diEnhancedPlugin(presets.development.options)
      : diEnhancedPlugin(presets.production.options),
    
    react(),
  ],
});
```

### Available Presets

```typescript
const presets = createDIPluginPresets();

// Development: Verbose logging, hot reload, debug files
presets.development.options

// Production: Minimal logging, optimized builds
presets.production.options

// Testing: Fast rebuilds, no debug output
presets.testing.options

// Minimal: Basic DI without functional components
presets.minimal.options

// Debugging: Maximum verbosity for troubleshooting
presets.debugging.options
```

### Custom Preset

```typescript
const customPreset = {
  name: 'custom',
  description: 'Custom configuration for my app',
  options: {
    verbose: true,
    enableInterfaceResolution: true,
    enableFunctionalDI: false, // Disable component transformation
    generateDebugFiles: true,
    
    advanced: {
      fileExtensions: ['.ts', '.tsx', '.vue'], // Include Vue files
      performance: {
        maxConcurrency: 20,
      },
    },
  },
};

export default defineConfig({
  plugins: [
    diEnhancedPlugin(customPreset.options),
    react(),
  ],
});
```

## Monorepo Configuration

### Basic Monorepo Setup

```typescript
// apps/web/vite.config.ts
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      srcDir: './src',
      outputDir: './src/.tdi2',
      
      advanced: {
        // Scan shared packages for services
        searchPaths: [
          '../../packages/shared/src',
          '../../packages/services/src',
        ],
        fileExtensions: ['.ts', '.tsx'],
      },
    }),
    react(),
  ],
});
```

### Advanced Monorepo Configuration

```typescript
// apps/web/vite.config.ts
const monorepoConfig = {
  srcDir: './src',
  outputDir: './src/.tdi2',
  verbose: process.env.DEBUG_DI === 'true',
  
  advanced: {
    // Comprehensive package scanning
    searchPaths: [
      '../../packages/*/src',        // All package src directories
      '../../libs/*/src',           // Library directories
      '../shared/src',              // Shared app code
    ],
    
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    
    // Custom patterns for enterprise code
    diPatterns: {
      serviceDecorator: /@(Service|Component|Repository|Controller)\s*\(/,
      injectDecorator: /@(Inject|Autowired)\s*\(/,
      interfaceMarker: /Inject<(.+?)>|@Autowired\s+(.+?):/,
    },
    
    performance: {
      parallel: true,
      maxConcurrency: 20,
      enableCache: true,
      cacheDir: '../../node_modules/.cache/tdi2',
    },
  },
};

export default defineConfig({
  plugins: [
    diEnhancedPlugin(monorepoConfig),
    react(),
  ],
});
```

## IDE Integration

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": false,
    "target": "ES2020",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": [
    "src/**/*",
    "src/.tdi2/**/*"  // Include generated files
  ]
}
```

### VSCode Settings

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  
  // File associations for generated files
  "files.associations": {
    "**/.tdi2/**/*.ts": "typescript"
  },
  
  // Hide generated files from explorer
  "files.exclude": {
    "**/.tdi2/debug/**": true
  },
  
  // TypeScript validation for generated files
  "typescript.validate.enable": true
}
```

## Debug Configuration

### Maximum Debug Output

```typescript
const debugConfig = {
  verbose: true,
  generateDebugFiles: true,
  reuseExistingConfig: false,
  cleanOldConfigs: false,  // Keep all debug files
  
  advanced: {
    transformation: {
      preserveSignatures: true,
      generateDeclarations: true,
    },
    performance: {
      enableCache: false,  // Always fresh generation
    },
  },
};

export default defineConfig({
  plugins: [
    diEnhancedPlugin(debugConfig),
    react(),
  ],
});
```

### Debug File Locations

When `generateDebugFiles: true`:
```
src/.tdi2/
├── di-config.ts          # Generated configuration
├── debug/
│   ├── interfaces.json   # Interface mappings
│   ├── services.json     # Service registrations
│   ├── transformations/  # Component transformations
│   │   ├── ProductList.original.tsx
│   │   ├── ProductList.transformed.tsx
│   │   └── ProductList.debug.json
│   └── statistics.json   # Performance metrics
└── cache/                # Transformation cache
```

## Migration Configuration

### From v1.x to v2.x

```typescript
// Legacy v1.x configuration
const legacyConfig = {
  generateMethods: 'enhanced',
  interfaceResolution: 'automatic',
  outputPath: './src/generated',
};

// New v2.x equivalent
const newConfig = {
  enableFunctionalDI: true,
  enableInterfaceResolution: true,
  outputDir: './src/.tdi2',
  
  // Legacy options no longer needed
  // generateMethods and interfaceResolution are now automatic
};
```

### Migration Helper

```typescript
import { migrateLegacyConfig } from '@tdi2/vite-plugin-di/migrate';

const legacyConfig = {
  // Your old configuration
};

const migratedConfig = migrateLegacyConfig(legacyConfig);

export default defineConfig({
  plugins: [
    diEnhancedPlugin(migratedConfig),
    react(),
  ],
});
```

## Configuration Validation

### Runtime Validation

```typescript
import { validateDIConfig } from '@tdi2/vite-plugin-di';

const config = {
  enableInterfaceResolution: true,
  enableFunctionalDI: true,
  outputDir: './invalid-path',  // This will be caught
};

// Validate before using
const validatedConfig = validateDIConfig(config);
// Throws descriptive error if invalid

export default defineConfig({
  plugins: [
    diEnhancedPlugin(validatedConfig),
    react(),
  ],
});
```

### Configuration Schema

```typescript
import { DIPluginConfigSchema } from '@tdi2/vite-plugin-di/schema';
import { z } from 'zod';

// Type-safe configuration with Zod validation
const config: z.infer<typeof DIPluginConfigSchema> = {
  enableInterfaceResolution: true,
  enableFunctionalDI: true,
  verbose: process.env.NODE_ENV === 'development',
  
  advanced: {
    performance: {
      parallel: true,
      maxConcurrency: 10,
    },
  },
};

export default defineConfig({
  plugins: [
    diEnhancedPlugin(config),
    react(),
  ],
});
```

## Performance Tuning

### Large Codebase Optimization

```typescript
const performanceConfig = {
  // Core features
  enableInterfaceResolution: true,
  enableFunctionalDI: true,
  
  // Caching strategy
  reuseExistingConfig: true,
  cleanOldConfigs: true,
  keepConfigCount: 5,
  
  advanced: {
    performance: {
      parallel: true,
      maxConcurrency: Math.max(4, Math.floor(require('os').cpus().length * 0.8)),
      enableCache: true,
    },
    
    // Selective scanning
    fileExtensions: ['.ts', '.tsx'],
    diPatterns: {
      // More specific patterns = faster scanning
      serviceDecorator: /@Service\s*\(\s*\)/,
      injectDecorator: /@Inject\s*\(\s*\)/,
    },
  },
};
```

### Memory Optimization

```typescript
const memoryOptimizedConfig = {
  enableInterfaceResolution: true,
  enableFunctionalDI: true,
  
  // Reduce memory usage
  generateDebugFiles: false,
  verbose: false,
  
  advanced: {
    performance: {
      parallel: false,        // Sequential processing
      maxConcurrency: 1,      // One at a time
      enableCache: true,      # Disk cache instead of memory
    },
  },
};
```

This configuration guide provides comprehensive options for customizing the TDI2 Vite plugin for any project size or architecture.