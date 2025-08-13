/**
 * @fileoverview Service Testing Utilities
 * 
 * Utilities for testing pure business services and their interactions without UI concerns.
 * Focuses on service-to-service orchestration, business logic validation, and domain workflows.
 */

import type { MockedService } from "./mock-api.js";

/**
 * Creates a business service instance with injected dependencies.
 * Useful for testing services that require other services as dependencies.
 * 
 * @example
 * ```typescript
 * const orderService = createBusinessService(
 *   OrderService,
 *   mockPaymentService,
 *   mockInventoryService,
 *   mockNotificationService
 * );
 * ```
 */
export function createBusinessService<T>(
  ServiceConstructor: new (...deps: any[]) => T,
  ...dependencies: any[]
): T {
  return new ServiceConstructor(...dependencies);
}

/**
 * Chains multiple service mocks together for complex workflow testing.
 * Useful for testing service orchestration patterns.
 * 
 * @example
 * ```typescript
 * const [userService, emailService, auditService] = mockServiceChain([
 *   { service: mockUserService, method: 'createUser', returns: newUser },
 *   { service: mockEmailService, method: 'sendWelcomeEmail', returns: Promise.resolve() },
 *   { service: mockAuditService, method: 'logUserCreation', returns: undefined }
 * ]);
 * ```
 */
export function mockServiceChain<T extends any[]>(
  serviceConfigs: Array<{
    service: MockedService<any>;
    method: string;
    returns?: any;
    throws?: Error;
    calls?: ((...args: any[]) => any);
  }>
): T {
  const services = serviceConfigs.map(config => {
    const { service, method, returns, throws, calls } = config;
    
    if (throws) {
      service.__mock__.when(method).thenThrow(throws);
    } else if (calls) {
      service.__mock__.when(method).thenCall(calls);
    } else {
      service.__mock__.when(method).thenReturn(returns);
    }
    
    return service;
  });

  return services as T;
}

/**
 * Verifies that services are called in the expected sequence.
 * Important for testing business workflows that have ordering requirements.
 * 
 * @example
 * ```typescript
 * verifyServiceSequence([
 *   { service: mockPaymentService, method: 'validatePayment' },
 *   { service: mockInventoryService, method: 'reserveItems' },
 *   { service: mockOrderService, method: 'createOrder' },
 *   { service: mockEmailService, method: 'sendConfirmation' }
 * ]);
 * ```
 */
export function verifyServiceSequence(
  expectedSequence: Array<{
    service: MockedService<any>;
    method: string;
    args?: any[];
  }>
): void {
  const allCalls: Array<{ service: MockedService<any>; method: string; timestamp: number; args: any[] }> = [];
  
  // Collect all calls with timestamps
  expectedSequence.forEach(({ service, method }) => {
    const calls = service.__mock__.getCalls(method);
    calls.forEach(call => {
      allCalls.push({
        service,
        method,
        timestamp: call.timestamp || 0,
        args: call.args || []
      });
    });
  });

  // Sort by timestamp to verify sequence
  allCalls.sort((a, b) => a.timestamp - b.timestamp);

  // Verify the sequence matches expected order
  expectedSequence.forEach((expected, index) => {
    if (index >= allCalls.length) {
      throw new Error(`Expected ${expected.method} to be called but it was not called`);
    }

    const actual = allCalls[index];
    if (actual.method !== expected.method) {
      throw new Error(`Expected ${expected.method} to be called at position ${index}, but ${actual.method} was called instead`);
    }

    if (expected.args) {
      if (!arraysEqual(actual.args, expected.args)) {
        throw new Error(`Expected ${expected.method} to be called with ${JSON.stringify(expected.args)}, but was called with ${JSON.stringify(actual.args)}`);
      }
    }
  });
}

/**
 * Creates a service test scenario for complex business workflows.
 * Provides structure for testing multi-step business processes.
 * 
 * @example
 * ```typescript
 * await createServiceScenario({
 *   name: 'User registration workflow',
 *   given: async () => {
 *     mockEmailService.__mock__.when('sendWelcomeEmail').thenReturn(Promise.resolve());
 *     mockUserService.__mock__.when('createUser').thenReturn(Promise.resolve(newUser));
 *   },
 *   when: async () => {
 *     const result = await userRegistrationService.registerUser(userData);
 *     return result;
 *   },
 *   then: async (result) => {
 *     expect(result.success).toBe(true);
 *     verify(mockUserService, 'createUser').once();
 *     verify(mockEmailService, 'sendWelcomeEmail').once();
 *   }
 * });
 * ```
 */
export async function createServiceScenario<T = any>(scenario: {
  name?: string;
  given?: () => Promise<void> | void;
  when: () => Promise<T> | T;
  then: (result: T) => Promise<void> | void;
  onError?: (error: Error) => Promise<void> | void;
  cleanup?: () => Promise<void> | void;
}): Promise<void> {
  let result: T;
  
  try {
    if (scenario.given) {
      await scenario.given();
    }
    
    result = await scenario.when();
    await scenario.then(result);
    
  } catch (error) {
    if (scenario.onError) {
      await scenario.onError(error as Error);
    } else {
      throw error;
    }
  } finally {
    if (scenario.cleanup) {
      await scenario.cleanup();
    }
  }
}

/**
 * Validates business rules and invariants during service testing.
 * Ensures domain logic maintains consistency across service operations.
 * 
 * @example
 * ```typescript
 * validateBusinessRules({
 *   'Order total must be positive': () => order.total > 0,
 *   'Order must have at least one item': () => order.items.length > 0,
 *   'Customer must be authenticated': () => order.customerId !== null
 * });
 * ```
 */
export function validateBusinessRules(rules: Record<string, () => boolean>): void {
  Object.entries(rules).forEach(([ruleName, ruleCheck]) => {
    if (!ruleCheck()) {
      throw new Error(`Business rule violation: ${ruleName}`);
    }
  });
}

/**
 * Creates test data for service testing with domain-specific defaults.
 * Useful for creating consistent test entities across service tests.
 * 
 * @example
 * ```typescript
 * const testUser = createServiceTestData('User', {
 *   id: 'test-user-1',
 *   email: 'test@example.com',
 *   role: 'customer'
 * }, {
 *   name: 'Custom Name',
 *   isActive: true
 * });
 * ```
 */
export function createServiceTestData<T extends Record<string, any>>(
  entityType: string,
  defaults: Partial<T> = {},
  overrides: Partial<T> = {}
): T {
  const baseDefaults = {
    id: `${entityType.toLowerCase()}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    ...baseDefaults,
    ...defaults,
    ...overrides
  } as T;
}

/**
 * Simulates service failures for error handling testing.
 * Provides realistic failure scenarios for robust service testing.
 * 
 * @example
 * ```typescript
 * const networkError = simulateServiceFailure('NETWORK_ERROR', 'Service unavailable', { retryAfter: 5000 });
 * const validationError = simulateServiceFailure('VALIDATION_ERROR', 'Invalid input data', { field: 'email' });
 * 
 * mockEmailService.__mock__.when('sendEmail').thenThrow(networkError);
 * ```
 */
export function simulateServiceFailure(
  errorType: 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'BUSINESS_ERROR' | 'TIMEOUT_ERROR' | 'AUTH_ERROR',
  message: string,
  metadata?: Record<string, any>
): Error {
  const error = new Error(message);
  (error as any).type = errorType;
  (error as any).metadata = metadata || {};
  (error as any).timestamp = Date.now();
  
  return error;
}

/**
 * Measures service performance during testing.
 * Useful for performance regression testing and SLA validation.
 * 
 * @example
 * ```typescript
 * const performance = await measureServicePerformance(async () => {
 *   return await userService.processLargeDataset(dataset);
 * });
 * 
 * expect(performance.duration).toBeLessThan(5000); // 5 second SLA
 * expect(performance.memoryUsed).toBeLessThan(100 * 1024 * 1024); // 100MB limit
 * ```
 */
export async function measureServicePerformance<T>(
  serviceOperation: () => Promise<T>
): Promise<{
  result: T;
  duration: number;
  memoryUsed?: number;
  startTime: number;
  endTime: number;
}> {
  const startTime = Date.now();
  const startMemory = typeof process !== 'undefined' ? process.memoryUsage().heapUsed : undefined;
  
  const result = await serviceOperation();
  
  const endTime = Date.now();
  const endMemory = typeof process !== 'undefined' ? process.memoryUsage().heapUsed : undefined;
  
  return {
    result,
    duration: endTime - startTime,
    memoryUsed: startMemory && endMemory ? endMemory - startMemory : undefined,
    startTime,
    endTime
  };
}

// Helper function for array comparison
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}