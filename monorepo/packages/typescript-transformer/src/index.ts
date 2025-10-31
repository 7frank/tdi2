/**
 * @tdi2/typescript-transformer
 *
 * TypeScript custom transformer for TDI2 dependency injection via ts-patch
 *
 * @example
 * ```json
 * // tsconfig.json
 * {
 *   "compilerOptions": {
 *     "plugins": [
 *       {
 *         "transform": "@tdi2/typescript-transformer",
 *         "srcDir": "./src",
 *         "enableFunctionalDI": true,
 *         "enableInterfaceResolution": true,
 *         "verbose": false
 *       }
 *     ]
 *   }
 * }
 * ```
 */

// Export main transformer (default export for ts-patch)
export { default } from './transformer';
export { default as tdi2Transformer } from './transformer';
export { cleanup } from './transformer';

// Export types for configuration
export type {
  TDI2TransformerConfig,
  PluginConfig,
  TransformerExtras,
  TransformResult,
  TransformStats,
  TransformOrchestratorOptions,
} from './types';

// Export orchestrator for advanced usage
export { TransformOrchestrator } from './transform-orchestrator';
