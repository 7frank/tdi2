import type { Inject } from '@tdi2/di-core/markers';

export interface CounterServiceInterface {
  state: {
    count: number;
    message: string;
  };
  increment(): void;
  decrement(): void;
  reset(): void;
}

export interface DataServiceInterface {
  state: {
    data: string;
    isLoading: boolean;
  };
  loadData(): void;
  resetData(): void;
}
