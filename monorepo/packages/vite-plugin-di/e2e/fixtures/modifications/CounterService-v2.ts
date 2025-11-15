import { Service } from '@tdi2/di-core';
import type { CounterServiceInterface } from '../types/interfaces';

@Service()
export class CounterService implements CounterServiceInterface {
  state = {
    count: 0,
    message: 'Counter initialized',
  };

  increment() {
    this.state.count += 2; // Changed: increment by 2
    this.state.message = `Count increased by 2 to ${this.state.count}`;
  }

  decrement() {
    this.state.count -= 2; // Changed: decrement by 2
    this.state.message = `Count decreased by 2 to ${this.state.count}`;
  }

  reset() {
    this.state.count = 0;
    this.state.message = 'Counter reset to zero';
  }
}
