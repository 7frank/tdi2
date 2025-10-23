import { Observable } from 'react-obsidian';

export class CounterService {
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
