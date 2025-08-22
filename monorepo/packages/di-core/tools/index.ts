// Backward compatibility re-exports from new structure
// These re-exports allow existing vite-plugin-di imports to continue working

// Build tools exports (from src/build-tools/)
export * from "../src/build-tools/config-manager.js";
export * from "../src/build-tools/dependency-tree-builder.js";
export * from "../src/build-tools/enhanced-di-transformer.js";
export * from "../src/build-tools/transformers/functional-di-enhanced-transformer.js";

// Interface resolver exports (from src/shared/interface-resolver/)
export * from "../src/shared/interface-resolver/integrated-interface-resolver.js";

// Additional shared utilities for external packages
export * from "../src/shared/index.js";
