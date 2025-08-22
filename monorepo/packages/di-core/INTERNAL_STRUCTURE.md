# TDI2 DI-Core Internal Structure

## Overview
This document describes the internal organization of the `@tdi2/di-core` package after the restructuring to separate concerns within a single package.

## Directory Structure

```
src/
├── core/                    # Pure DI functionality
│   ├── container.ts         # DI container implementation
│   ├── decorators.ts        # @Service, @Inject decorators  
│   ├── markers.ts           # Inject<T>, InjectOptional<T> type markers
│   ├── types.ts             # Core DI types and interfaces
│   ├── profile-manager.ts   # Environment profile management
│   ├── services/            # Example/default services
│   └── index.ts             # Core exports
│
├── react/                   # React integration
│   ├── context.tsx          # DIProvider, useDI, useService hooks
│   └── index.ts             # React exports
│
├── shared/                  # Shared DI utilities (framework-agnostic)
│   ├── interface-resolver/  # Interface → implementation resolution
│   ├── dependency-extractor/ # Dependency analysis utilities
│   ├── service-registry/    # Service registration utilities
│   ├── type-resolver/       # TypeScript type resolution
│   ├── utils/               # Shared types and utilities
│   └── index.ts             # Shared exports
│
├── build-tools/             # Build-time tools
│   ├── transformers/        # Code transformation tools
│   ├── config-manager.ts    # Configuration management
│   ├── enhanced-di-transformer.ts # Class-based DI transformer
│   ├── dependency-tree-builder.ts # Dependency analysis
│   └── index.ts             # Build tools exports
│
└── index.ts                 # Main package exports
```

## Export Structure

### Main Package Exports (`@tdi2/di-core`)
```typescript
import { Service, Inject, CompileTimeDIContainer } from '@tdi2/di-core';
import { DIProvider, useService, useDI } from '@tdi2/di-core';
```

### Specific Module Exports
```typescript
// Core DI only
import { Service, Inject } from '@tdi2/di-core/core';

// React integration only
import { DIProvider, useService } from '@tdi2/di-core/react';

// Shared utilities (for framework extension)
import { IntegratedInterfaceResolver } from '@tdi2/di-core/shared';

// Build tools (for build-time transformation)
import { FunctionalDIEnhancedTransformer } from '@tdi2/di-core/build-tools';
```

### Backward Compatibility
The `/tools` export maintains backward compatibility:
```typescript
// Still works for existing vite-plugin-di
import { FunctionalDIEnhancedTransformer } from '@tdi2/di-core/tools';
```

## Benefits of This Structure

### 🎯 **Clear Separation of Concerns**
- Core DI logic is isolated from React-specific code
- Shared utilities are framework-agnostic
- Build tools are separated from runtime code

### ⚛️ **Framework Boundaries**
- React code is cleanly separated in `/react` folder
- Makes future package extraction straightforward
- Clear boundaries for what belongs where

### 🔧 **Extension Ready**
- Shared utilities in `/shared` can be used by any framework
- Build tools in `/build-tools` are framework-agnostic
- Foundation for future Vue/Angular/Svelte packages

### 📦 **Flexible Imports**
- Developers can import only what they need
- Tree-shaking works more effectively
- Clear import paths indicate dependencies

### 🔄 **Migration Path**
- Backward compatibility maintained via `/tools` re-exports
- Step-by-step approach allows validation at each stage
- Foundation for future package extraction

## Next Steps

This internal structure provides the foundation for:
1. **Package extraction**: Moving `/react` to `@tdi2/di-react`
2. **Framework expansion**: Creating `@tdi2/di-vue`, `@tdi2/di-angular`
3. **Build tool separation**: Moving `/build-tools` to `@tdi2/vite-plugin-di`

The clean internal boundaries make these future changes much easier and safer.