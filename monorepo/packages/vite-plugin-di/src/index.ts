/**
 * @tdi2/vite-plugin-di
 * 
 * Vite plugin for TDI2 (TypeScript Dependency Injection) with interface-based automatic resolution.
 * Provides hot reload, build-time transformation, and development debugging capabilities.
 */

export { diEnhancedPlugin } from './plugin';
export { diEnhancedPlugin as default } from './plugin';

export type {
  DIPluginOptions,
  DIDebugInfo,
  TransformationSummary,
  ConfigInfo,
  InterfaceResolutionInfo,
} from './types';

// Re-export useful utilities
export {
  createDIPluginPresets,
  getDIPluginDefaults,
  validateDIPluginOptions,
} from './utils';

// Version info
export const version = '1.0.0';