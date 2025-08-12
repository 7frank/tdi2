// Mock API for fluent testing similar to Mockito/Spring Boot

export interface CallRecord {
  methodName: string;
  args: any[];
  returnValue?: any;
  timestamp: number;
}

export interface MockSetup<T> {
  thenReturn(value: any): MockedService<T>;
  thenThrow(error: Error | string): MockedService<T>;
  thenCall(callback: (...args: any[]) => any): MockedService<T>;
}

// TypeScript-friendly mocked service type following the Inject<T> pattern
export type MockedService<T> = T & {
  readonly __mock__: {
    when(methodName: keyof T): MockSetup<T>;
    verify(methodName: keyof T): VerifyAPI;
    verifyNoInteractions(): void;
    reset(): void;
    getCallHistory(): CallRecord[];
  };
};

// Internal class for creating mock implementations
export class MockedServiceImpl<T> {
  private callHistory: CallRecord[] = [];
  private methodMocks = new Map<string, { 
    returnValue?: any; 
    throwError?: Error; 
    callback?: (...args: any[]) => any;
    callCount: number;
  }>();

  constructor(private originalService: T, private serviceName: string) {
    // Constructor is now only for initialization, factory function creates the mock
  }

  // Fluent API methods
  when(methodName: keyof T): MockSetup<T> {
    const setup: MockSetup<T> = {
      thenReturn: (value: any) => {
        this.methodMocks.set(methodName as string, { 
          returnValue: value,
          callCount: 0
        });
        return this as any;
      },
      thenThrow: (error: Error | string) => {
        const err = typeof error === 'string' ? new Error(error) : error;
        this.methodMocks.set(methodName as string, { 
          throwError: err,
          callCount: 0
        });
        return this as any;
      },
      thenCall: (callback: (...args: any[]) => any) => {
        this.methodMocks.set(methodName as string, { 
          callback,
          callCount: 0
        });
        return this as any;
      }
    };
    return setup;
  }

  // Verification methods
  verify(methodName: keyof T): VerifyAPI {
    const calls = this.callHistory.filter(call => call.methodName === methodName);
    return new VerifyAPI(calls, methodName as string, this.serviceName);
  }

  verifyNoInteractions(): void {
    if (this.callHistory.length > 0) {
      throw new Error(`Expected no interactions with ${this.serviceName}, but found ${this.callHistory.length} calls`);
    }
  }

  reset(): void {
    this.callHistory = [];
    this.methodMocks.clear();
  }

  // Get call history for debugging
  getCallHistory(): CallRecord[] {
    return [...this.callHistory];
  }

  // Handle service method calls with mocking logic
  callServiceMethod(methodName: string, ...args: any[]): any {
    const mockConfig = this.methodMocks.get(methodName);
    const timestamp = Date.now();

    if (mockConfig) {
      mockConfig.callCount++;
      
      // Record the call
      this.callHistory.push({
        methodName,
        args: [...args],
        returnValue: mockConfig.returnValue,
        timestamp
      });

      // Handle different mock behaviors
      if (mockConfig.throwError) {
        throw mockConfig.throwError;
      }
      if (mockConfig.callback) {
        return mockConfig.callback(...args);
      }
      return mockConfig.returnValue;
    }

    // No mock configured - call original if available
    if (this.originalService && (this.originalService as any)[methodName]) {
      const originalMethod = (this.originalService as any)[methodName];
      if (typeof originalMethod === 'function') {
        const result = originalMethod.apply(this.originalService, args);
        this.callHistory.push({
          methodName,
          args: [...args],
          returnValue: result,
          timestamp
        });
        return result;
      }
    }

    // No mock and no original - provide default behavior
    this.callHistory.push({
      methodName,
      args: [...args],
      returnValue: undefined,
      timestamp
    });
    return undefined;
  }
}

export class VerifyAPI {
  constructor(
    private calls: CallRecord[],
    private methodName: string,
    private serviceName: string
  ) {}

  times(expectedCount: number): void {
    if (this.calls.length !== expectedCount) {
      throw new Error(
        `Expected ${this.methodName} to be called ${expectedCount} times on ${this.serviceName}, but was called ${this.calls.length} times`
      );
    }
  }

  once(): void {
    this.times(1);
  }

  never(): void {
    this.times(0);
  }

  atLeast(minCount: number): void {
    if (this.calls.length < minCount) {
      throw new Error(
        `Expected ${this.methodName} to be called at least ${minCount} times on ${this.serviceName}, but was called ${this.calls.length} times`
      );
    }
  }

  atMost(maxCount: number): void {
    if (this.calls.length > maxCount) {
      throw new Error(
        `Expected ${this.methodName} to be called at most ${maxCount} times on ${this.serviceName}, but was called ${this.calls.length} times`
      );
    }
  }

  withArgs(...expectedArgs: any[]): void {
    const matchingCalls = this.calls.filter(call => 
      call.args.length === expectedArgs.length &&
      call.args.every((arg, index) => JSON.stringify(arg) === JSON.stringify(expectedArgs[index]))
    );

    if (matchingCalls.length === 0) {
      throw new Error(
        `Expected ${this.methodName} to be called with args [${expectedArgs.join(', ')}] on ${this.serviceName}, but no matching calls found`
      );
    }
  }
}

// Global mock registry for @MockBean decorator
class MockBeanRegistry {
  private mocks = new Map<string, MockedService<any>>();

  registerMock<T>(token: string, mock: MockedService<T>): void {
    this.mocks.set(token, mock);
  }

  getMock<T>(token: string): MockedService<T> | undefined {
    return this.mocks.get(token);
  }

  clear(): void {
    this.mocks.clear();
  }

  getAllMocks(): MockedService<any>[] {
    return Array.from(this.mocks.values());
  }
}

export const mockBeanRegistry = new MockBeanRegistry();

// Factory function for creating TypeScript-friendly mocks
export function createMockedService<T>(originalService: T, serviceName: string = 'UnknownService'): MockedService<T> {
  const mockImpl = new MockedServiceImpl(originalService, serviceName);
  
  // Create a proxy that provides both the service interface AND the __mock__ property
  const mockedService = new Proxy({} as MockedService<T>, {
    get: (target, prop: string | symbol) => {
      if (prop === '__mock__') {
        // Return the mock API object
        return {
          when: mockImpl.when.bind(mockImpl),
          verify: mockImpl.verify.bind(mockImpl),
          verifyNoInteractions: mockImpl.verifyNoInteractions.bind(mockImpl),
          reset: mockImpl.reset.bind(mockImpl),
          getCallHistory: mockImpl.getCallHistory.bind(mockImpl)
        };
      }

      // Handle service method calls
      if (typeof prop === 'string') {
        return (...args: any[]) => {
          return mockImpl.callServiceMethod(prop, ...args);
        };
      }

      return undefined;
    }
  });

  return mockedService;
}

// Legacy factory function for backward compatibility
export function mockBean<T>(originalService: T, serviceName: string = 'UnknownService'): MockedService<T> {
  return createMockedService(originalService, serviceName);
}

// Shorthand for common verification patterns
export function verify<T>(mockedService: MockedService<T>, methodName: keyof T): VerifyAPI {
  return mockedService.__mock__.verify(methodName);
}

export function verifyNoInteractions<T>(mockedService: MockedService<T>): void {
  mockedService.__mock__.verifyNoInteractions();
}

export function reset<T>(mockedService: MockedService<T>): void {
  mockedService.__mock__.reset();
}