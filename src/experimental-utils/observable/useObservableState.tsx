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

// Async State Management
type AsyncData<T> = {
  data?: T;
  error?: Error;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
};

export abstract class AsyncState<T> extends ObservableState<AsyncData<T>> {
  constructor() {
    super({
      isLoading: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
    });
  }

  protected async execute<U>(asyncFn: () => Promise<U>): Promise<U> {
    this.setState({
      ...this.state,
      isLoading: true,
      isError: false,
      isSuccess: false,
      isIdle: false,
      error: undefined,
    });

    try {
      const result = await asyncFn();
      this.setState({
        data: result as any,
        isLoading: false,
        isSuccess: true,
        isError: false,
        isIdle: false,
      });
      return result;
    } catch (error) {
      this.setState({
        ...this.state,
        data: undefined,
        error: error as Error,
        isLoading: false,
        isSuccess: false,
        isError: true,
        isIdle: false,
      });
      throw error;
    }
  }
}

// React Hook for Observable State
export function useObservableState<T>(observable: ObservableState<T>): T {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = observable.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [observable]);

  return observable.state;
}
