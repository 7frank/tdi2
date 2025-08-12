import { TestContainer } from "./test-container";
import { MockedService, mockBean, mockBeanRegistry } from "./mock-api";
import type { DIMap } from "@tdi2/di-core/types";

export interface EnhancedTestContext {
  container: TestContainer;
  getMock<T>(token: string | symbol): MockedService<T>;
  resetAllMocks(): void;
}

export interface TestClassSetupOptions {
  diMap?: DIMap;
  parent?: TestContainer;
}

/**
 * Enhanced test setup that automatically processes @MockBean decorators
 */
export function setupEnhancedTest(
  testClass: any,
  options: TestClassSetupOptions = {}
): EnhancedTestContext {
  const { diMap, parent } = options;
  
  // Create test container
  const container = new TestContainer(parent);
  
  // Load DI configuration if provided
  if (diMap) {
    container.loadConfiguration(diMap);
  }

  // Process @MockBean decorators
  const mockBeans = testClass.constructor.__di_mock_beans__ || [];
  const mockMap = new Map<string | symbol, MockedService<any>>();

  for (const mockBean of mockBeans) {
    const { propertyKey, token, scope } = mockBean;
    
    // Determine the service token (use property name if no token specified)
    const serviceToken = token || (propertyKey as string);
    
    // Create mock - try to get original service first
    let originalService = null;
    try {
      originalService = container.resolve(serviceToken);
    } catch {
      // Service doesn't exist yet - that's ok for mocking
    }

    const mock = new MockedService(originalService, String(serviceToken));
    
    // Register mock in container
    container.mockService(serviceToken, mock, scope);
    
    // Store in local registry
    mockMap.set(serviceToken, mock);
    mockBeanRegistry.registerMock(String(serviceToken), mock);
    
    // Inject into test class instance
    if (testClass[propertyKey] === undefined) {
      testClass[propertyKey] = mock;
    }
  }

  return {
    container,
    getMock: <T>(token: string | symbol): MockedService<T> => {
      const mock = mockMap.get(token);
      if (!mock) {
        throw new Error(`No mock found for token: ${String(token)}`);
      }
      return mock as MockedService<T>;
    },
    resetAllMocks: () => {
      for (const mock of mockMap.values()) {
        mock.reset();
      }
    }
  };
}

/**
 * Decorator-aware test runner that automatically sets up DI context
 */
export function runTestWithContext(
  testClass: any,
  testMethod: Function,
  options: TestClassSetupOptions = {}
): any {
  const testContext = setupEnhancedTest(testClass, options);
  
  try {
    // Run the test method with the context
    return testMethod.call(testClass, testContext);
  } finally {
    // Auto-reset mocks if configured
    const contextConfig = testClass.constructor.__di_test_context__;
    if (contextConfig?.autoReset) {
      testContext.resetAllMocks();
    }
  }
}

/**
 * Helper function for cleaner test setup
 */
export function withMocks(diMap?: DIMap) {
  return (testClass: any) => {
    return setupEnhancedTest(testClass, { diMap });
  };
}

/**
 * Utility to create a test class instance with auto-setup
 */
export function createTestInstance<T>(
  TestClass: new() => T,
  options: TestClassSetupOptions = {}
): T & { __testContext: EnhancedTestContext } {
  const instance = new TestClass();
  const testContext = setupEnhancedTest(instance, options);
  
  return Object.assign(instance, { __testContext: testContext });
}