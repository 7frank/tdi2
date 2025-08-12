// Mock API for fluent testing similar to Mockito/Spring Boot

export interface CallRecord {
  methodName: string;
  args: any[];
  returnValue?: any;
  timestamp: number;
}

export interface MockSetup<T> {
  thenReturn(value: any): T;
  thenThrow(error: Error | string): T;
  thenCall(callback: (...args: any[]) => any): T;
}

export class MockedService<T> {
  private callHistory: CallRecord[] = [];
  private methodMocks = new Map<string, { 
    returnValue?: any; 
    throwError?: Error; 
    callback?: (...args: any[]) => any;
    callCount: number;
  }>();

  constructor(private originalService: T, private serviceName: string) {
    // Create proxy to intercept method calls
    return new Proxy(this, {
      get: (target, prop: string | symbol) => {
        // Always return MockedService's own methods first
        if (typeof prop === 'string') {
          if (prop === 'when' || prop === 'verify' || prop === 'verifyNoInteractions' || 
              prop === 'reset' || prop === 'getCallHistory') {
            return (target as any)[prop].bind(target);
          }

          // Handle service method calls
          return (...args: any[]) => {
            const mockConfig = target.methodMocks.get(prop);
            const timestamp = Date.now();

            if (mockConfig) {
              mockConfig.callCount++;
              
              // Record the call
              target.callHistory.push({
                methodName: prop,
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
            if (originalService && (originalService as any)[prop]) {
              const originalMethod = (originalService as any)[prop];
              if (typeof originalMethod === 'function') {
                const result = originalMethod.apply(originalService, args);
                target.callHistory.push({
                  methodName: prop,
                  args: [...args],
                  returnValue: result,
                  timestamp
                });
                return result;
              }
            }

            // No mock and no original - provide default behavior
            target.callHistory.push({
              methodName: prop,
              args: [...args],
              returnValue: undefined,
              timestamp
            });
            return undefined;
          };
        }

        return undefined;
      }
    }) as any;
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

// Factory function for creating mocks
export function mockBean<T>(originalService: T, serviceName: string = 'UnknownService'): MockedService<T> {
  return new MockedService(originalService, serviceName);
}

// Shorthand for common verification patterns
export function verify<T>(mockedService: MockedService<T>, methodName: keyof T): VerifyAPI {
  return mockedService.verify(methodName);
}

export function verifyNoInteractions<T>(mockedService: MockedService<T>): void {
  mockedService.verifyNoInteractions();
}

export function reset<T>(mockedService: MockedService<T>): void {
  mockedService.reset();
}