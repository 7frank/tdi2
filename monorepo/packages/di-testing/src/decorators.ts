export interface MockServiceOptions {
  scope?: "singleton" | "transient" | "scoped";
  token?: string | symbol;
}

/**
 * Decorator to mark a class as a mock service for testing
 * Can be used with or without explicit token
 */
export function MockService(options: MockServiceOptions = {}): ClassDecorator {
  return function (target: any) {
    // Store metadata for test framework processing
    target.__di_mock_service__ = {
      scope: options.scope || "singleton",
      token: options.token || null, // null means auto-resolve from interface
      isMock: true,
      originalTarget: target,
    };
  };
}

/**
 * Decorator to mark a property or parameter for test injection
 * Used in test classes to inject mocked services
 */
export function TestInject(token?: string | symbol): any {
  return function (
    target: any,
    propertyKey?: string | symbol,
    parameterIndex?: number
  ) {
    if (!target.__di_test_inject__) {
      target.__di_test_inject__ = [];
    }

    target.__di_test_inject__.push({
      token,
      propertyKey,
      parameterIndex,
      target: target.constructor?.name || target.name,
      autoResolve: token === undefined,
    });
  };
}

/**
 * Decorator for test configuration classes
 * Similar to Spring's @TestConfiguration
 */
export function TestConfig(): ClassDecorator {
  return function (target: any) {
    target.__di_test_config__ = {
      isTestConfig: true,
      target,
    };
  };
}

/**
 * Method decorator for test configuration methods that provide service overrides
 */
export function TestBean(token?: string | symbol): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    if (!target.constructor.__di_test_beans__) {
      target.constructor.__di_test_beans__ = [];
    }

    target.constructor.__di_test_beans__.push({
      token,
      methodName: propertyKey,
      method: descriptor.value,
      autoResolve: token === undefined,
    });
  };
}

/**
 * Class decorator to mark a service as a spy (partial mock)
 * Preserves original behavior while allowing override of specific methods
 */
export function SpyService(options: MockServiceOptions = {}): ClassDecorator {
  return function (target: any) {
    target.__di_spy_service__ = {
      scope: options.scope || "singleton",
      token: options.token || null,
      isSpy: true,
      originalTarget: target,
    };
  };
}