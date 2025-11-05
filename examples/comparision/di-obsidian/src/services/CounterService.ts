import { Observable } from "react-obsidian";

export interface CounterServiceInterface {
  count: Observable<number>;

  increment(): void;

  decrement(): void;

  reset(): void;
}

export class CounterService implements CounterServiceInterface {
  public count = new Observable(0);

  increment(): void {
    this.count.value++;
  }

  decrement(): void {
    this.count.value--;
  }

  reset(): void {
    this.count.value = 0;
  }
}
