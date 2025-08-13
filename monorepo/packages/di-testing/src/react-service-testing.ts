/**
 * @fileoverview React Service Testing Utilities
 * 
 * Utilities for testing React components that use service injection, focusing on
 * service orchestration and business logic coordination rather than user behavior.
 * This approach is ideal for testing components that act as service coordinators.
 */

import { render, type RenderResult } from "@testing-library/react";
import type { MockedService } from "./mock-api.js";
import type { Inject } from "./shared-testing.js";
import * as React from "react";

/**
 * Type placeholder for React Service Injection (RSI) pattern.
 * Used to indicate that a service will be injected by the DI framework.
 */
export type { Inject };

/**
 * Renders a React component with injected services for testing.
 * Focuses on service integration rather than user interactions.
 * 
 * @example
 * ```typescript
 * const { container } = renderWithServices(UserProfile, {
 *   userService: mockUserService,
 *   notificationService: mockNotificationService
 * });
 * ```
 */
export function renderWithServices<P extends object>(
  Component: React.ComponentType<P>,
  props: P
): RenderResult {
  return render(React.createElement(Component, props));
}

/**
 * Verifies that a component called the expected services during rendering.
 * Useful for testing service orchestration during component lifecycle.
 * 
 * @example
 * ```typescript
 * verifyComponentServiceCalls([
 *   { service: mockUserService, method: 'getCurrentUser', expectedCalls: 1 },
 *   { service: mockNotificationService, method: 'markAsRead', expectedCalls: 0 }
 * ]);
 * ```
 */
export function verifyComponentServiceCalls(
  expectedCalls: Array<{
    service: MockedService<any>;
    method: string;
    expectedCalls: number;
    args?: any[];
  }>
): void {
  expectedCalls.forEach(({ service, method, expectedCalls, args }) => {
    const calls = service.__mock__.getCalls(method);
    
    if (expectedCalls === 0) {
      if (calls.length > 0) {
        throw new Error(`Expected ${method} to not be called, but was called ${calls.length} times`);
      }
    } else {
      if (calls.length !== expectedCalls) {
        throw new Error(`Expected ${method} to be called ${expectedCalls} times, but was called ${calls.length} times`);
      }
      
      if (args && calls.length > 0) {
        const lastCall = calls[calls.length - 1];
        if (!arraysEqual(lastCall.args, args)) {
          throw new Error(`Expected ${method} to be called with ${JSON.stringify(args)}, but was called with ${JSON.stringify(lastCall.args)}`);
        }
      }
    }
  });
}

/**
 * Creates a test wrapper for components that require service injection.
 * Provides a consistent way to inject services into components for testing.
 * 
 * @example
 * ```typescript
 * const TestWrapper = createServiceTestWrapper({
 *   userService: mockUserService,
 *   themeService: mockThemeService
 * });
 * 
 * const { getByText } = render(
 *   <TestWrapper>
 *     <UserDashboard />
 *   </TestWrapper>
 * );
 * ```
 */
export function createServiceTestWrapper<T extends Record<string, any>>(
  services: T
): React.ComponentType<{ children: React.ReactNode }> {
  return function ServiceTestWrapper({ children }: { children: React.ReactNode }) {
    // In a real implementation, this would use React Context or a DI provider
    // For now, this is a placeholder that passes services as props
    return React.cloneElement(
      children as React.ReactElement,
      services
    );
  };
}

/**
 * Waits for a service to be called during component rendering or updates.
 * Useful for testing async service calls triggered by component lifecycle.
 * 
 * @example
 * ```typescript
 * render(<AsyncUserProfile userService={mockUserService} />);
 * await waitForServiceCall(mockUserService, 'loadUserData');
 * verify(mockUserService, 'loadUserData').once();
 * ```
 */
export async function waitForServiceCall<T>(
  mockService: MockedService<T>,
  method: keyof T,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkForCall = () => {
      const calls = mockService.__mock__.getCalls(method as string);
      if (calls.length > 0) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Service method ${String(method)} was not called within ${timeout}ms`));
        return;
      }
      
      setTimeout(checkForCall, 50);
    };
    
    checkForCall();
  });
}

/**
 * Sets up service mocks with common behaviors for React component testing.
 * Provides defaults that work well with typical React service patterns.
 * 
 * @example
 * ```typescript
 * const { userService, apiService } = setupServiceMocks({
 *   userService: {
 *     getCurrentUser: () => Promise.resolve({ id: '1', name: 'Test User' }),
 *     isLoggedIn: () => true
 *   },
 *   apiService: {
 *     get: () => Promise.resolve({ data: [] }),
 *     post: () => Promise.resolve({ success: true })
 *   }
 * });
 * ```
 */
export function setupServiceMocks<T extends Record<string, any>>(
  serviceDefinitions: {
    [K in keyof T]: Record<string, (...args: any[]) => any>
  }
): { [K in keyof T]: MockedService<T[K]> } {
  const mocks: any = {};
  
  Object.keys(serviceDefinitions).forEach(serviceName => {
    const definition = serviceDefinitions[serviceName];
    const mock = {
      __mock__: {
        when: (method: string) => ({
          thenReturn: (value: any) => {
            (mock as any)[method] = () => value;
          },
          thenCall: (fn: (...args: any[]) => any) => {
            (mock as any)[method] = fn;
          },
          thenThrow: (error: Error) => {
            (mock as any)[method] = () => { throw error; };
          }
        }),
        getCalls: (method: string) => [],
        reset: () => {}
      }
    };
    
    // Set up default implementations
    Object.keys(definition).forEach(method => {
      (mock as any)[method] = definition[method];
    });
    
    mocks[serviceName] = mock;
  });
  
  return mocks;
}

// Helper function for array comparison
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}