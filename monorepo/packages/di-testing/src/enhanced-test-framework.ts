import { TestContainer } from "./test-container";
import { MockedService, mockBean, mockBeanRegistry } from "./mock-api";
import { TestInterfaceExtractor } from "./interface-extractor";
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

  // Process @MockBean decorators using interface resolution
  const mockBeans = testClass.constructor.__di_mock_beans__ || [];
  const mockMap = new Map<string | symbol, MockedService<any>>();

  for (const mockBean of mockBeans) {
    const { propertyKey, scope } = mockBean;
    
    // Use property name as service key for interface-based DI
    // In interface-based DI, the property name corresponds to the service identity
    const serviceKey = propertyKey as string;
    
    // Create mock - try to get original service first using interface-based resolution
    let originalService = null;
    try {
      if (container.hasInterface(serviceKey)) {
        originalService = container.resolveByInterface(serviceKey);
      }
    } catch {
      // Service doesn't exist yet - that's ok for mocking
    }

    const mock = new MockedService(originalService, serviceKey);
    
    // Register mock in container using interface-based approach
    container.mockServiceByInterface(serviceKey, mock, scope);
    
    // Store in local registry
    mockMap.set(serviceKey, mock);
    mockBeanRegistry.registerMock(serviceKey, mock);
    
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
  
  // The setupEnhancedTest already injects mocks into the instance
  // Just add the test context for access to container utilities
  (instance as any).__testContext = testContext;
  
  return instance as T & { __testContext: EnhancedTestContext };
}