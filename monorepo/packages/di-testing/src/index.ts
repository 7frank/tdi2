// ============================================================================
// CORE DI TESTING EXPORTS (Backward Compatibility)
// ============================================================================

// Core testing exports
export { TestContainer } from "./test-container.js";
export type { TestOverride } from "./test-container.js";

// Testing decorators
export { 
  MockService,
  TestInject,
  TestConfig,
  TestBean,
  SpyService,
  MockBean,
  TestContext
} from "./decorators.js";
export type { MockServiceOptions, MockBeanOptions } from "./decorators.js";

// Enhanced mock API
export {
  createMockedService,
  mockBean,
  verify,
  verifyNoInteractions,
  reset
} from "./mock-api.js";
export type { MockedService, CallRecord, MockSetup } from "./mock-api.js";

// Enhanced test framework
export {
  setupEnhancedTest,
  runTestWithContext,
  withMocks,
  createTestInstance
} from "./enhanced-test-framework.js";
export type { EnhancedTestContext, TestClassSetupOptions } from "./enhanced-test-framework.js";

// Test utilities
export {
  setupTest,
  teardownTest,
  getCurrentTestContext,
  createMock,
  createSpy,
  setupComponentTest,
  expectServiceRegistered,
  expectServiceMocked
} from "./test-utils.js";
export type { 
  TestSetupOptions,
  ComponentTestOptions
} from "./test-utils.js";

// ============================================================================
// ORGANIZED TESTING NAMESPACES
// ============================================================================

// Shared utilities across all testing approaches
export * as SharedTesting from "./shared-testing.js";

// Pure service-to-service testing (no React/UI)
export * as ServiceTesting from "./service-testing.js";

// React component service orchestration testing
export * as ReactServiceTesting from "./react-service-testing.js";

// React behavior-first testing with DI control
export * as ReactBehaviorTesting from "./react-behavior-testing.js";

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

// Re-export commonly used types for convenience
export type { Inject } from "./shared-testing.js";