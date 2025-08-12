// Core testing exports
export { TestContainer } from "./test-container";
export type { TestOverride } from "./test-container";

// Testing decorators
export { 
  MockService,
  TestInject,
  TestConfig,
  TestBean,
  SpyService
} from "./decorators";
export type { MockServiceOptions } from "./decorators";

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