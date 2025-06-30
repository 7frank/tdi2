// src/experimental-utils/observable/useObservableState.tsx - Enhanced with Interface Support

import { useState, useEffect } from "react";

// Observable State Base Class
abstract class ObservableState<T> {
  private _state: T;
  private subscribers: Set<() => void> = new Set();

  constructor(initialState: T) {
    this._state = initialState;
  }

  get state(): T {
    return this._state;
  }

  protected setState(newState: T | ((prev: T) => T)): void {
    if (typeof newState === "function") {
      this._state = (newState as (prev: T) => T)(this._state);
    } else {
      this._state = newState;
    }
    this.notifySubscribers();
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback());
  }
}

// Enhanced Async State Management with interface support
type AsyncData<T> = {
  data?: T;
  error?: Error;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  lastUpdated?: Date;
  operationCount: number;
};

// Enhanced AsyncState class that can be used as a base for interface implementations
export abstract class AsyncState<TState> extends ObservableState<
  AsyncData<TState>
> {
  constructor() {
    super({
      isLoading: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
      operationCount: 0,
    });
  }

  protected async execute<U = TState>(asyncFn: () => Promise<U>): Promise<U> {
    this.setState((prev) => ({
      ...prev,
      isLoading: true,
      isError: false,
      isSuccess: false,
      isIdle: false,
      error: undefined,
      operationCount: prev.operationCount + 1,
    }));

    try {
      const result = await asyncFn();
      this.setState((prev) => ({
        ...prev,
        data: result as any, // Cast to TState for state updates
        isLoading: false,
        isSuccess: true,
        isError: false,
        isIdle: false,
        lastUpdated: new Date(),
      }));
      return result;
    } catch (error) {
      this.setState((prev) => ({
        ...prev,
        data: undefined,
        error: error as Error,
        isLoading: false,
        isSuccess: false,
        isError: true,
        isIdle: false,
        lastUpdated: new Date(),
      }));
      throw error;
    }
  }

  // Enhanced state management methods
  protected setData(data: TState): void {
    this.setState((prev) => ({
      ...prev,
      data,
      isSuccess: true,
      isError: false,
      isLoading: false,
      isIdle: false,
      lastUpdated: new Date(),
    }));
  }

  protected setError(error: Error): void {
    this.setState((prev) => ({
      ...prev,
      error,
      isError: true,
      isSuccess: false,
      isLoading: false,
      isIdle: false,
      lastUpdated: new Date(),
    }));
  }

  protected setLoading(isLoading: boolean): void {
    this.setState((prev) => ({
      ...prev,
      isLoading,
      isIdle: !isLoading,
    }));
  }

  // Reset the state to initial
  public reset(): void {
    this.setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
      operationCount: 0,
      data: undefined,
      error: undefined,
      lastUpdated: undefined,
    });
  }

  // Get the current data without subscribing to changes
  public getCurrentData(): TState | undefined {
    return this.state.data;
  }

  // Check if the service is in a specific state
  public isInState(state: "loading" | "success" | "error" | "idle"): boolean {
    switch (state) {
      case "loading":
        return this.state.isLoading;
      case "success":
        return this.state.isSuccess;
      case "error":
        return this.state.isError;
      case "idle":
        return this.state.isIdle;
      default:
        return false;
    }
  }
}

// Enhanced React Hook for Observable State with better type support
export function useObservableState<T>(observable: ObservableState<T>): T & {
  refresh: () => void;
  isStale: boolean;
} {
  const [, forceUpdate] = useState({});
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = observable.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [observable]);

  const refresh = () => {
    setLastRefresh(Date.now());
    forceUpdate({});
  };

  // Calculate if data is stale (older than 5 minutes)
  const isStale = (() => {
    const state = observable.state as any;
    if (state.lastUpdated) {
      return Date.now() - state.lastUpdated.getTime() > 5 * 60 * 1000;
    }
    return true;
  })();

  return {
    ...observable.state,
    refresh,
    isStale,
  } as T & { refresh: () => void; isStale: boolean };
}

// Enhanced hook specifically for AsyncState services with interface support
export function useAsyncState<TState>(
  service: AsyncState<TState>
): AsyncData<TState> & {
  refresh: () => void;
  isStale: boolean;
  reset: () => void;
  service: AsyncState<TState>;
} {
  const state = useObservableState(service);

  return {
    ...state,
    reset: () => service.reset(),
    service: service,
  };
}

// Enhanced hook for interface-based async services
export function useAsyncServiceInterface<TInterface extends AsyncState<any>>(
  service: TInterface
): AsyncData<ExtractAsyncStateType<TInterface>> & {
  refresh: () => void;
  isStale: boolean;
  reset: () => void;
  service: TInterface;
} {
  const state = useObservableState(service);

  return {
    ...state,
    reset: () => service.reset(),
    service: service,
  };
}

// Hook for managing multiple async states with interface support
export function useMultipleAsyncStates<
  T extends Record<string, AsyncState<any>>
>(
  services: T
): {
  [K in keyof T]: T[K] extends AsyncState<infer TState>
    ? AsyncData<TState> & { refresh: () => void; isStale: boolean }
    : never;
} & {
  isAnyLoading: boolean;
  hasAnyError: boolean;
  allSuccessful: boolean;
  resetAll: () => void;
} {
  const states = {} as any;
  let isAnyLoading = false;
  let hasAnyError = false;
  let allSuccessful = true;

  // Subscribe to all services
  for (const [key, service] of Object.entries(services)) {
    const state = useObservableState(service);
    states[key] = {
      ...state,
      reset: () => (service as any).reset(),
    };

    if (state.isLoading) isAnyLoading = true;
    if (state.isError) hasAnyError = true;
    if (!state.isSuccess) allSuccessful = false;
  }

  const resetAll = () => {
    Object.values(services).forEach((service) => (service as any).reset());
  };

  return {
    ...states,
    isAnyLoading,
    hasAnyError,
    allSuccessful,
    resetAll,
  };
}

// Utility type for extracting state type from AsyncState services
export type ExtractAsyncStateType<T> = T extends AsyncState<infer TState>
  ? TState
  : never;

// Utility type for extracting the complete interface from a service type
export type ExtractServiceInterface<T> = T extends AsyncState<any> ? T : never;

// Enhanced AsyncStateService for dependency injection with interface support
export abstract class AsyncStateService<TState> extends AsyncState<TState> {
  // This class can be used as a base for services that need DI
  // while still maintaining the AsyncState functionality and interface support
}

// Type helper for creating typed async state services with interfaces
export type TypedAsyncStateService<
  TState,
  TInterface = {}
> = AsyncState<TState> & TInterface;

// Interface-based service factory (for advanced use cases)
export interface AsyncServiceInterface<TState, TMethods = {}>
  extends AsyncState<TState> {
  // Base interface that all async services should extend
  // This provides a common contract for all async state services
}

// Generic async state interface that can be extended
export interface GenericAsyncStateInterface<TState> extends AsyncState<TState> {
  reset(): void;
  getCurrentData(): TState | undefined;
  isInState(state: "loading" | "success" | "error" | "idle"): boolean;
}
