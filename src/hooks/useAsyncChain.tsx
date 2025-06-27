import React, { useState, useCallback, useRef, useEffect } from "react";

type AsyncState<T, E = Error> = {
  data?: T;
  error?: E;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
};

class AsyncChain<T, E = Error> {
  private successRenderer?: (data: T) => React.ReactNode;
  private errorRenderer?: (error: E) => React.ReactNode;
  private pendingRenderer?: () => React.ReactNode;
  private idleRenderer?: () => React.ReactNode;

  constructor(
    private _state: AsyncState<T, E>,
    private _setState: (state: AsyncState<T, E>) => void
  ) {}

  async trigger(asyncFn: () => Promise<T>): Promise<AsyncChain<T, E>> {
    this._setState({
      data: undefined,
      error: undefined,
      isLoading: true,
      isSuccess: false,
      isError: false,
      isIdle: false,
    });

    try {
      const data = await asyncFn();
      this._setState({
        data,
        isLoading: false,
        isSuccess: true,
        isError: false,
        isIdle: false,
      });
      return this;
    } catch (error) {
      this._setState({
        data: undefined,
        error: error as E,
        isLoading: false,
        isSuccess: false,
        isError: true,
        isIdle: false,
      });
      return this;
    }
  }

  success<U>(fn: (data: T) => U): SuccessChain<U, E> {
    return new SuccessChain(
      fn,
      this._state,
      this._setState,
      this.errorRenderer,
      this.pendingRenderer,
      this.idleRenderer
    );
  }

  error<U>(fn: (error: E) => U): ErrorChain<T, U> {
    return new ErrorChain(
      fn,
      this._state,
      this._setState,
      this.successRenderer,
      this.pendingRenderer,
      this.idleRenderer
    );
  }

  pending(fn: () => React.ReactNode): AsyncChain<T, E> {
    this.pendingRenderer = fn;
    return this;
  }

  idle(fn: () => React.ReactNode): AsyncChain<T, E> {
    this.idleRenderer = fn;
    return this;
  }

  get render(): React.ReactNode {
    if (this._state.isLoading && this.pendingRenderer) {
      return this.pendingRenderer();
    }
    if (this._state.isSuccess && this._state.data && this.successRenderer) {
      return this.successRenderer(this._state.data);
    }
    if (this._state.isError && this._state.error && this.errorRenderer) {
      return this.errorRenderer(this._state.error);
    }
    if (this._state.isIdle && this.idleRenderer) {
      return this.idleRenderer();
    }
    return null;
  }

  // Alternative method that forces React updates
  useRender(): React.ReactNode {
    return this.render;
  }

  get state() {
    return this._state;
  }
}

class SuccessChain<T, E = Error> {
  constructor(
    private transform: (data: any) => T,
    private _state: AsyncState<any, E>,
    private _setState: (state: AsyncState<any, E>) => void,
    private errorRenderer?: (error: E) => React.ReactNode,
    private pendingRenderer?: () => React.ReactNode,
    private idleRenderer?: () => React.ReactNode
  ) {}

  map(fn: (data: T) => React.ReactNode): AsyncChain<any, E> {
    const chain = new AsyncChain(this._state, this._setState);
    // @ts-ignore - complex typing, but works at runtime
    chain["successRenderer"] = (data: any) => fn(this.transform(data));
    chain["errorRenderer"] = this.errorRenderer;
    chain["pendingRenderer"] = this.pendingRenderer;
    chain["idleRenderer"] = this.idleRenderer;
    return chain;
  }

  error<U>(fn: (error: E) => U): SuccessErrorChain<T, U> {
    return new SuccessErrorChain(
      this.transform,
      fn,
      this._state,
      this._setState,
      this.pendingRenderer,
      this.idleRenderer
    );
  }

  pending(fn: () => React.ReactNode): SuccessChain<T, E> {
    this.pendingRenderer = fn;
    return this;
  }

  idle(fn: () => React.ReactNode): SuccessChain<T, E> {
    this.idleRenderer = fn;
    return this;
  }
}

class ErrorChain<T, E = Error> {
  constructor(
    private transform: (error: any) => E,
    private _state: AsyncState<T, any>,
    private _setState: (state: AsyncState<T, any>) => void,
    private successRenderer?: (data: T) => React.ReactNode,
    private pendingRenderer?: () => React.ReactNode,
    private idleRenderer?: () => React.ReactNode
  ) {}

  map(fn: (error: E) => React.ReactNode): AsyncChain<T, any> {
    const chain = new AsyncChain(this._state, this._setState);
    chain["successRenderer"] = this.successRenderer;
    // @ts-ignore - complex typing, but works at runtime
    chain["errorRenderer"] = (error: any) => fn(this.transform(error));
    chain["pendingRenderer"] = this.pendingRenderer;
    chain["idleRenderer"] = this.idleRenderer;
    return chain;
  }

  success<U>(fn: (data: T) => U): SuccessErrorChain<U, E> {
    return new SuccessErrorChain(
      fn,
      this.transform,
      this._state,
      this._setState,
      this.pendingRenderer,
      this.idleRenderer
    );
  }

  pending(fn: () => React.ReactNode): ErrorChain<T, E> {
    this.pendingRenderer = fn;
    return this;
  }

  idle(fn: () => React.ReactNode): ErrorChain<T, E> {
    this.idleRenderer = fn;
    return this;
  }
}

class SuccessErrorChain<T, E = Error> {
  constructor(
    private successTransform: (data: any) => T,
    private errorTransform: (error: any) => E,
    private _state: AsyncState<any, any>,
    private _setState: (state: AsyncState<any, any>) => void,
    private pendingRenderer?: () => React.ReactNode,
    private idleRenderer?: () => React.ReactNode
  ) {}

  map(handlers: {
    success: (data: T) => React.ReactNode;
    error: (error: E) => React.ReactNode;
  }): AsyncChain<any, any> {
    const chain = new AsyncChain(this._state, this._setState);
    // @ts-ignore
    chain["successRenderer"] = (data: any) =>
      handlers.success(this.successTransform(data));
    // @ts-ignore
    chain["errorRenderer"] = (error: any) =>
      handlers.error(this.errorTransform(error));
    chain["pendingRenderer"] = this.pendingRenderer;
    chain["idleRenderer"] = this.idleRenderer;
    return chain;
  }

  pending(fn: () => React.ReactNode): SuccessErrorChain<T, E> {
    this.pendingRenderer = fn;
    return this;
  }

  idle(fn: () => React.ReactNode): SuccessErrorChain<T, E> {
    this.idleRenderer = fn;
    return this;
  }
}

// React hook
function useAsyncChain<T, E = Error>() {
  const [state, setState] = useState<AsyncState<T, E>>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
  });

  // Force re-render when chain operations complete
  const [updateCount, setUpdateCount] = useState(0);

  const chainRef = useRef<AsyncChain<T, E> | null>(null);

  if (!chainRef.current) {
    chainRef.current = new AsyncChain(state, (newState) => {
      setState(newState);
      setUpdateCount((prev) => prev + 1); // Force re-render
    });
  }

  // Update the chain's internal state when React state changes
  useEffect(() => {
    if (chainRef.current) {
      chainRef.current["_state"] = state;
    }
  }, [state]);

  return chainRef.current;
}

export function ExampleUseAsyncChain() {
  const asyncState = useAsyncChain<string>();

  const handleClick = async () => {
    (
      await asyncState.trigger(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve("Hello World!"), 1000)
          )
      )
    )
      .success((data: string) => data.trim())
      .map((d) => <button key="success">{d}</button>)
      .error((error: Error) => error.message)
      .map((m) => (
        <div key="error" style={{ color: "red" }}>
          {m}
        </div>
      ))
      .pending(() => <div key="loading">Loading...</div>)
      .idle(() => <div key="idle">Click to start</div>);
  };

  return (
    <div>
      <button onClick={handleClick}>Trigger Success</button>

      <div style={{ marginTop: "10px" }}>{asyncState.render}</div>
      <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
        State: {JSON.stringify(asyncState.state)}
      </div>
    </div>
  );
}
