/**
 * Service interfaces for test application
 */

export interface CounterServiceInterface {
  state: {
    count: number;
    message: string;
  };
  increment(): void;
  decrement(): void;
  reset(): void;
}

export interface LoggerServiceInterface {
  state: {
    logs: string[];
  };
  log(message: string): void;
  clear(): void;
}
