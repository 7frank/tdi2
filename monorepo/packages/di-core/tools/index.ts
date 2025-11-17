// Browser-safe exports (no Node.js dependencies)
export { DiInjectMarkers } from "./functional-di-enhanced-transformer/di-inject-markers"
export { TransformationPipeline } from "./functional-di-enhanced-transformer/transformation-pipeline"
export { IntegratedInterfaceResolver } from "./interface-resolver/integrated-interface-resolver"
export { SharedDependencyExtractor } from "./shared/SharedDependencyExtractor"
export { SharedTypeResolver } from "./shared/SharedTypeResolver"
export { consoleFor, LogLevel } from "./logger"

// Re-export types from these modules for browser compatibility
export type {
  InterfaceImplementation,
  ServiceDependency,
  ServiceScope,
  RegistrationType,
  InheritanceInfo,
  InterfaceInfo,
  ValidationResult
} from "./interface-resolver/interface-resolver-types"

// Node.js-only exports (require fs, path, crypto, module)
// Only import these in Node.js environments (Vite plugin, CLI tools, etc.)
// DO NOT import in browser code
// These are NOT exported to prevent bundlers from trying to load them
// If you need these in Node.js, import directly from the source files:
// import { ConfigManager } from '@tdi2/di-core/tools/config-manager'
// import { EnhancedDITransformer } from '@tdi2/di-core/tools/enhanced-di-transformer'



