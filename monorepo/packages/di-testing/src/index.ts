// Core testing exports
export { TestContainer } from "./test-container";
export type { TestOverride } from "./test-container";

// Testing decorators
export { 
  MockService,
  TestInject,
  TestConfig,
  TestBean,
  SpyService,
  MockBean,
  TestContext
} from "./decorators";
export type { MockServiceOptions, MockBeanOptions } from "./decorators";

// Enhanced mock API
export {
  MockedService,
  mockBean,
  verify,
  verifyNoInteractions,
  reset
} from "./mock-api";
export type { CallRecord, MockSetup, MockedServiceType } from "./mock-api";

// Enhanced test framework
export {
  setupEnhancedTest,
  runTestWithContext,
  withMocks,
  createTestInstance
} from "./enhanced-test-framework";
export type { EnhancedTestContext, TestClassSetupOptions } from "./enhanced-test-framework";

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
} from "./test-utils";
export type { 
  TestSetupOptions,
  TestContext,
  ComponentTestOptions
} from "./test-utils";