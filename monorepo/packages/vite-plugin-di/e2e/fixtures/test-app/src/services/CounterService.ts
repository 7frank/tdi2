import { Service } from '@tdi2/di-core';
import type { CounterServiceInterface } from '../types/interfaces';

@Service()
export class CounterService implements CounterServiceInterface {
  state = {
    count: 0,
    message: 'Counter initialized',
  };

  increment() {
    this.state.count++;
    this.state.message = `Count increased to ${this.state.count}`;
  }

  decrement() {
    this.state.count--;
    this.state.message = `Count decreased to ${this.state.count}`;
  }

  reset() {
    this.state.count = 0;
    this.state.message = 'Counter reset';
  }
}
