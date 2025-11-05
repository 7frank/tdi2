import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { CounterServiceInterface } from './CounterService';

export function Counter(props: {
  services: {
    counter: Inject<CounterServiceInterface>;
  };
}) {
  const { counter } = props.services;

  return (
    <div>
      <div data-testid="count">{counter.state.count}</div>
      <button data-testid="increment" onClick={() => counter.increment()}>
        Increment
      </button>
      <button data-testid="decrement" onClick={() => counter.decrement()}>
        Decrement
      </button>
    </div>
  );
}
