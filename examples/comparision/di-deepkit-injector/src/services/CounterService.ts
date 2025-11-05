export class CounterService {
  private _count = 0;
  private _message = "Click buttons to count!";
  private listeners: Set<() => void> = new Set();

  get count() {
    return this._count;
  }

  get message() {
    return this._message;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  increment() {
    this._count++;
    this._message = `Count is now ${this._count}`;
    this.notify();
  }

  decrement() {
    this._count--;
    this._message = `Count is now ${this._count}`;
    this.notify();
  }

  reset() {
    this._count = 0;
    this._message = "Reset to zero!";
    this.notify();
  }

  setMessage(msg: string) {
    this._message = msg;
    this.notify();
  }
}

export 
type CounterServiceInterface=typeof CounterService