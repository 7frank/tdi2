import { Service } from '@tdi2/di-core';

export interface CounterServiceInterface {
  state: {
    count: number;
  };
  increment(): void;
  decrement(): void;
}

@Service()
export class CounterService implements CounterServiceInterface {
  state = {
    count: 0,
  };

  increment() {
    this.state.count++;
  }

  decrement() {
    this.state.count--;
  }
}
