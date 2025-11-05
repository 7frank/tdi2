// ===== SIMPLE TDI2 + VALTIO EXAMPLE =====
// No hooks in components, all state in reactive services

// 1. Service Interface
export interface CounterServiceInterface {
  state: {
    count: number;
    message: string;
  };
  increment(): void;
  decrement(): void;
  reset(): void;
  setMessage(msg: string): void;
}

// 2. Service Implementation (Valtio makes this reactive)
import { Service } from "@tdi2/di-core/decorators";

@Service()
export class CounterService implements CounterServiceInterface {
  state = {
    count: 0,
    message: "Click buttons to count!",
  };

  increment(): void {
    this.state.count++;
    this.state.message = `Count is now ${this.state.count}`;
  }

  decrement(): void {
    this.state.count--;
    this.state.message = `Count is now ${this.state.count}`;
  }

  reset(): void {
    this.state.count = 0;
    this.state.message = "Reset to zero!";
  }

  setMessage(msg: string): void {
    this.state.message = msg;
  }
}