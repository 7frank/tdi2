// Shared type definitions for testing

export interface ApiInterface {
  getData(): Promise<any[]>;
  getUserData(id: string): Promise<any>;
  refreshData(): Promise<void>;
  configure(config: { url: string; timeout: number }): void;
}

export interface TestStateInterface<T> {
  value: T;
  setValue(v: T): Promise<void>;
}

export interface LoggerInterface {
  log(message: string): void;
  error(message: string, error?: Error): void;
  warn(message: string): void;
}

export interface CacheInterface<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  clear(): void;
}

export interface UserServiceInterface {
  updateProfile(data: any): Promise<void>;
  processData(data: any[]): void;
}

export interface RepositoryInterface<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}

// Non-existent interfaces for testing missing dependencies
export interface NonExistentInterface {
  doSomething(): void;
}

export interface AnotherNonExistentInterface {
  doSomethingElse(): void;
}

// Non-DI service classes
export class ApiService implements ApiInterface {
  async getData() {
    return [];
  }
  async getUserData(id: string) {
    return {};
  }
  async refreshData() {}
  configure(config: any) {}
}

// Non-DI service classes
export class StateService implements TestStateInterface<string> {
  value = "foo";
  async setValue(v: string): Promise<void> {
    this.value = v;
  }
}

export class LoggerService implements LoggerInterface {
  log(message: string) {
    console.log(message);
  }
  error(message: string, error?: Error) {
    console.error(message, error);
  }
  warn(message: string) {
    console.warn(message);
  }
}
