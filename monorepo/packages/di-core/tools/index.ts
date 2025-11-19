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
// WARNING: These CANNOT be imported in browser code! Only use in Node.js environments.
// For browser code, use the browser-safe exports above or import directly from source files.
export { FunctionalDIEnhancedTransformer } from "./functional-di-enhanced-transformer/functional-di-enhanced-transformer"
export { EnhancedDITransformer } from "./enhanced-di-transformer"



