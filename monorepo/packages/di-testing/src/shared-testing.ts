/**
 * @fileoverview Shared Testing Utilities
 * 
 * Common utilities used across all testing approaches (service, react-service, react-behavior).
 * Provides DOM setup, type definitions, and shared helper functions.
 */

/**
 * Type placeholder for React Service Injection (RSI) pattern.
 * Used to indicate that a service will be injected by the DI framework.
 */
export type Inject<T> = T;

/**
 * Sets up DOM environment for React component testing.
 * Configures Happy DOM globals and jest-dom matchers.
 */
export function setupDOM(): void {
  // This would typically be done in test setup files like happydom.ts
  // But can be called programmatically if needed
  try {
    const { GlobalRegistrator } = require("@happy-dom/global-registrator");
    GlobalRegistrator.register();
    require("@testing-library/jest-dom");
  } catch (error) {
    console.warn("DOM setup failed:", error);
    console.warn("Make sure @happy-dom/global-registrator and @testing-library/jest-dom are installed");
  }
}

/**
 * Cleans up DOM environment after tests.
 * Unregisters Happy DOM globals.
 */
export function cleanupDOM(): void {
  try {
    const { GlobalRegistrator } = require("@happy-dom/global-registrator");
    GlobalRegistrator.unregister();
  } catch (error) {
    console.warn("DOM cleanup failed:", error);
  }
}

/**
 * Creates test data objects with optional defaults.
 * Useful for creating mock data across different test types.
 */
export function createTestData<T extends Record<string, any>>(
  defaults: Partial<T> = {},
  overrides: Partial<T> = {}
): T {
  return { ...defaults, ...overrides } as T;
}

/**
 * Creates a delayed promise for testing async behavior.
 * Useful for simulating slow service responses.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a controllable promise for testing async flows.
 * Returns both the promise and functions to resolve/reject it.
 */
export function createControllablePromise<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return {
    promise,
    resolve: resolve!,
    reject: reject!
  };
}

/**
 * Generates unique IDs for test data.
 * Useful for creating unique test entities.
 */
export function generateTestId(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a mock error for testing error scenarios.
 */
export function createTestError(message: string = "Test error", code?: string): Error {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
}