// ===== SIMPLE TDI2 + VALTIO EXAMPLE =====
// No hooks in components, all state in reactive services

// 1. Service Interface
export interface CounterServiceInterface {
  count: number;
  message: string;

  increment(): void;
  decrement(): void;
  reset(): void;
  setMessage(msg: string): void;
}

// 2. Service Implementation (Valtio makes this reactive)
import { Service } from "@tdi2/di-core/decorators";

@Service()
export class CounterService implements CounterServiceInterface {
  count = 0;
  message = "Click buttons to count!";

  increment(): void {
    this.count++;
    this.message = `Count is now ${this.count}`;
  }

  decrement(): void {
    this.count--;
    this.message = `Count is now ${this.count}`;
  }

  reset(): void {
    this.count = 0;
    this.message = "Reset to zero!";
  }

  setMessage(msg: string): void {
    this.message = msg;
  }
}
