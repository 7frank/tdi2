// TDI2 DI-Core - Main entry point

export const TDI2_VERSION = "0.1.0";

// Core DI exports (main public API)
export * from './core/index.js';

// React integration exports  
export * from './react/index.js';

// NOTE: Shared utilities and build tools are available via specific imports
// e.g. import { IntegratedInterfaceResolver } from '@tdi2/di-core/shared/interface-resolver'
// or via the backward-compatible /tools export

// Analytics module moved to @tdi2/di-debug package
