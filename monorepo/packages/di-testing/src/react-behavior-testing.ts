/**
 * @fileoverview React Behavior Testing Utilities
 * 
 * Utilities for behavior-first testing that combines React Testing Library's
 * user-centric approach with TDI2's deterministic service control. Tests focus
 * on user-observable behavior while maintaining precise service interaction control.
 */

import { render, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedService } from "./mock-api.js";
import type { Inject } from "./shared-testing.js";
import * as React from "react";

/**
 * Type placeholder for React Service Injection (RSI) pattern.
 * Used to indicate that a service will be injected by the DI framework.
 */
export type { Inject };

/**
 * Renders a React component with dependency injection for behavior testing.
 * Provides full DOM rendering with controlled service dependencies.
 * 
 * @example
 * ```typescript
 * renderWithDI(SearchBox, {
 *   searchService: mockSearchService,
 *   analytics: mockAnalytics
 * });
 * 
 * await userEvent.type(screen.getByLabelText('Search'), 'test query');
 * expect(screen.getByText('Results found')).toBeInTheDocument();
 * ```
 */
export function renderWithDI<P extends object>(
  Component: React.ComponentType<P>,
  props: P
): RenderResult {
  return render(React.createElement(Component, props));
}

/**
 * Fluent API for setting up service mock behavior.
 * Cleaner syntax than using __mock__.when() directly.
 * 
 * @example
 * ```typescript
 * given(mockSearchService, 'search')
 *   .thenReturn(Promise.resolve(['result1', 'result2']));
 * 
 * given(mockAnalytics, 'track').thenReturn(undefined);
 * ```
 */
export function given<T extends { __mock__: any }>(mock: T, method: string) {
  return mock.__mock__.when(method);
}

/**
 * Performs user interactions and waits for the expected result.
 * Encapsulates common user interaction patterns for behavior testing.
 * 
 * @example
 * ```typescript
 * await whenUserInteracts({
 *   action: async () => {
 *     await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
 *     await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
 *   },
 *   waitFor: () => screen.getByText('Success message')
 * });
 * ```
 */
export async function whenUserInteracts(options: {
  action: () => Promise<void> | void;
  waitFor?: () => HTMLElement | Promise<HTMLElement>;
  timeout?: number;
}): Promise<void> {
  await options.action();
  
  if (options.waitFor) {
    const { waitFor } = await import("@testing-library/react");
    await waitFor(async () => {
      const result = options.waitFor!();
      if (result instanceof Promise) {
        return await result;
      }
      return result;
    }, { timeout: options.timeout || 5000 });
  }
}

/**
 * Verifies service interactions after user behavior assertions.
 * Ensures service calls happened as expected during user interactions.
 * 
 * @example
 * ```typescript
 * andServiceWasCalled(mockSearchService, 'search', {
 *   times: 1,
 *   withArgs: ['user query'],
 *   afterUserAction: true
 * });
 * ```
 */
export function andServiceWasCalled<T>(
  mock: MockedService<T>,
  method: keyof T,
  options: {
    times?: number;
    withArgs?: any[];
    never?: boolean;
  } = {}
): void {
  const calls = mock.__mock__.getCalls(method as string);

  if (options.never) {
    if (calls.length > 0) {
      throw new Error(`Expected ${String(method)} to never be called, but was called ${calls.length} times`);
    }
    return;
  }

  const expectedTimes = options.times ?? 1;
  if (calls.length !== expectedTimes) {
    throw new Error(`Expected ${String(method)} to be called ${expectedTimes} times, but was called ${calls.length} times`);
  }

  if (options.withArgs && calls.length > 0) {
    const lastCall = calls[calls.length - 1];
    if (!arraysEqual(lastCall.args, options.withArgs)) {
      throw new Error(`Expected ${String(method)} to be called with ${JSON.stringify(options.withArgs)}, but was called with ${JSON.stringify(lastCall.args)}`);
    }
  }
}

/**
 * Creates a behavior test scenario with setup, action, and verification phases.
 * Provides structure for complex behavior testing workflows.
 * 
 * @example
 * ```typescript
 * await createBehaviorScenario({
 *   given: async () => {
 *     given(mockService, 'getData').thenReturn(Promise.resolve(testData));
 *   },
 *   when: async () => {
 *     await userEvent.click(screen.getByRole('button', { name: 'Load Data' }));
 *   },
 *   then: async () => {
 *     await waitFor(() => screen.getByText('Data loaded'));
 *     andServiceWasCalled(mockService, 'getData', { times: 1 });
 *   }
 * });
 * ```
 */
export async function createBehaviorScenario(scenario: {
  given?: () => Promise<void> | void;
  when: () => Promise<void> | void;
  then: () => Promise<void> | void;
  cleanup?: () => Promise<void> | void;
}): Promise<void> {
  try {
    if (scenario.given) {
      await scenario.given();
    }
    
    await scenario.when();
    await scenario.then();
  } finally {
    if (scenario.cleanup) {
      await scenario.cleanup();
    }
  }
}

/**
 * Common user interaction patterns for behavior testing.
 * Provides reusable interaction flows that match real user behavior.
 */
export const UserInteractions = {
  /**
   * Simulates form submission with validation.
   */
  async submitForm(formData: Record<string, string>, submitButtonName: string = 'Submit'): Promise<void> {
    const { screen } = await import("@testing-library/react");
    for (const [label, value] of Object.entries(formData)) {
      const field = screen.getByLabelText(new RegExp(label, 'i'));
      await userEvent.clear(field);
      await userEvent.type(field, value);
    }
    
    await userEvent.click(screen.getByRole('button', { name: new RegExp(submitButtonName, 'i') }));
  },

  /**
   * Simulates search workflow: type query and submit.
   */
  async performSearch(query: string, searchLabel: string = 'Search'): Promise<void> {
    const { screen } = await import("@testing-library/react");
    const searchInput = screen.getByLabelText(new RegExp(searchLabel, 'i'));
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, query);
    await userEvent.keyboard('{Enter}');
  },

  /**
   * Simulates navigation between pages/tabs.
   */
  async navigateTo(linkText: string): Promise<void> {
    const { screen } = await import("@testing-library/react");
    await userEvent.click(screen.getByRole('link', { name: new RegExp(linkText, 'i') }));
  },

  /**
   * Simulates selecting from dropdown/select.
   */
  async selectOption(selectLabel: string, optionValue: string): Promise<void> {
    const { screen } = await import("@testing-library/react");
    const select = screen.getByLabelText(new RegExp(selectLabel, 'i'));
    await userEvent.selectOptions(select, optionValue);
  }
};

// Helper function for array comparison
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}