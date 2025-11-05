import { TestContainer, type TestOverride } from "./test-container";
import type { DIMap } from "@tdi2/di-core/types";

export interface TestSetupOptions {
  /** Service overrides for this test */
  mocks?: TestOverride[];
  /** DI configuration to load */
  diMap?: DIMap;
  /** Whether to create a fresh container (default: true) */
  isolateTest?: boolean;
  /** Parent container to extend from */
  parent?: TestContainer;
}

export interface TestContext {
  container: TestContainer;
  mockServiceByInterface: <T>(interfaceName: string, implementation: T, scope?: "singleton" | "transient" | "scoped") => void;
  restoreServiceByInterface: (interfaceName: string) => void;
  restoreAllServices: () => void;
  reset: () => void;
}

let globalTestContainer: TestContainer | null = null;
let currentTestContext: TestContext | null = null;

/**
 * Setup a test with dependency injection mocking capabilities
 */
export function setupTest(options: TestSetupOptions = {}): TestContext {
  const { 
    mocks = [], 
    diMap,
    isolateTest = true,
    parent
  } = options;

  // Create container
  let container: TestContainer;
  
  if (isolateTest) {
    container = new TestContainer(parent);
  } else {
    // Reuse global test container
    if (!globalTestContainer) {
      globalTestContainer = new TestContainer(parent);
    }
    container = globalTestContainer;
  }

  // Load DI configuration if provided
  if (diMap) {
    container.loadConfiguration(diMap);
  }

  // Apply mock overrides using interface-based approach
  for (const mock of mocks) {
    container.mockServiceByInterface(mock.token as string, mock.implementation, mock.scope);
  }

  // Create test context
  const context: TestContext = {
    container,
    mockServiceByInterface: (interfaceName, implementation, scope) => 
      container.mockServiceByInterface(interfaceName, implementation, scope),
    restoreServiceByInterface: (interfaceName) => 
      container.restoreServiceByInterface(interfaceName),
    restoreAllServices: () => 
      container.restoreAllServices(),
    reset: () => 
      container.reset(),
  };

  currentTestContext = context;
  return context;
}

/**
 * Clean up after a test - restore all services and clear context
 */
export function teardownTest(context?: TestContext): void {
  const ctx = context || currentTestContext;
  
  if (ctx) {
    ctx.restoreAllServices();
    ctx.reset();
  }

  currentTestContext = null;
}

/**
 * Get the current test context (useful for test utilities)
 */
export function getCurrentTestContext(): TestContext | null {
  return currentTestContext;
}

/**
 * Create a service mock helper
 */
export function createMock<T>(_token: string | symbol, partial: Partial<T> = {}): T {
  // Simple mock implementation - you can enhance this with a proper mocking library
  const mock = { ...partial } as T;
  
  // Add spy-like functionality if needed
  if (typeof mock === 'object' && mock !== null) {
    // You could integrate with sinon, jest, or vitest mocking here
  }
  
  return mock;
}

/**
 * Create a spy that preserves original behavior while allowing overrides
 */
export function createSpy<T>(original: T, overrides: Partial<T> = {}): T {
  if (typeof original !== 'object' || original === null) {
    return { ...original, ...overrides } as T;
  }

  // Create a proxy that intercepts method calls
  return new Proxy(original, {
    get(target, prop) {
      if (prop in overrides) {
        return (overrides as any)[prop];
      }
      return (target as any)[prop];
    }
  }) as T;
}

/**
 * Utility for testing React components with DI
 */
export interface ComponentTestOptions extends TestSetupOptions {
  /** Whether to wrap component with DI context */
  withDI?: boolean;
}

/**
 * Helper to setup component testing with DI context
 */
export function setupComponentTest(options: ComponentTestOptions = {}) {
  const { withDI = true, ...testOptions } = options;
  
  const context = setupTest(testOptions);
  
  return {
    ...context,
    // Add React-specific testing utilities here if needed
    // For example, a wrapper component that provides the DI context
  };
}

/**
 * Utility to verify service registration
 */
export function expectServiceRegistered(container: TestContainer, token: string | symbol): void {
  if (!container.has(token)) {
    throw new Error(`Service not registered: ${String(token)}`);
  }
}

/**
 * Utility to verify service mock using interface-based resolution
 */
export function expectServiceMocked(container: TestContainer, interfaceName: string): void {
  const overrides = container.getTestOverrides();
  const isMocked = overrides.some((override: any) => override.interfaceName === interfaceName);
  
  if (!isMocked) {
    throw new Error(`Service not mocked: ${interfaceName}`);
  }
}