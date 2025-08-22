// tools/interface-resolver/fixtures/decorator-approach.ts.txt - Test fixtures for decorator approach

export const DECORATOR_FIXTURES = {
  STANDALONE_CLASS: `
import { Service } from "@tdi2/di-core/decorators";

@Service()
export class StandaloneService {
  doSomething(): void {
    console.log('Standalone service');
  }
}
  `,

  SIMPLE_INTERFACE: `
import { Service } from "@tdi2/di-core/decorators";

export interface FooInterface {
  foo(): string;
}

@Service()
export class SimpleInterfaceService implements FooInterface {
  foo(): string {
    return 'foo';
  }
}
  `,

  GENERIC_INTERFACE: `
import { Service } from "@tdi2/di-core/decorators";

export interface FooInterface<A, B> {
  process(a: A, b: B): string;
}

@Service()
export class GenericInterfaceService implements FooInterface<string, number> {
  process(a: string, b: number): string {
    return \`\${a}-\${b}\`;
  }
}
  `,

  BASE_CLASS_EXTENDS: `
import { Service } from "@tdi2/di-core/decorators";

export class BaseClass {
  baseMethod(): string {
    return 'base';
  }
}

@Service()
export class BaseClassService extends BaseClass {
  override baseMethod(): string {
    return 'extended';
  }
}
  `,

  GENERIC_BASE_CLASS: `
import { Service } from "@tdi2/di-core/decorators";

export class BaseClass<A, B> {
  process(a: A, b: B): string {
    return 'base';
  }
}

@Service()
export class GenericBaseClassService extends BaseClass<string, number> {
  override process(a: string, b: number): string {
    return \`generic-\${a}-\${b}\`;
  }
}
  `,

  IMPLEMENTS_AND_EXTENDS: `
import { Service } from "@tdi2/di-core/decorators";

export class BaseClass<A> {
  baseMethod(a: A): string {
    return 'base';
  }
}

export interface FooInterface<B> {
  fooMethod(b: B): string;
}

@Service()
export class ImplementsAndExtendsService 
  extends BaseClass<string>
  implements FooInterface<number> {
  
  fooMethod(b: number): string {
    return \`foo-\${b}\`;
  }
  
  override baseMethod(a: string): string {
    return \`extended-\${a}\`;
  }
}
  `,

  MULTIPLE_INTERFACES: `
import { Service } from "@tdi2/di-core/decorators";

export interface FooInterface {
  foo(): string;
}

export interface BarInterface {
  bar(): number;
}

@Service()
export class MultiInterfaceService implements FooInterface, BarInterface {
  foo(): string {
    return 'foo';
  }
  
  bar(): number {
    return 42;
  }
}
  `,

  NESTED_GENERIC_INTERFACE: `
import { Service } from "@tdi2/di-core/decorators";

export interface Bar<T> {
  process(item: T): T;
}

export interface Baz<C> {
  transform(data: C): C;
}

export interface FooInterface<T> {
  handle(processor: Bar<Baz<T>>): T;
}

@Service()
export class NestedGenericInterfaceService implements FooInterface<string> {
  handle(processor: Bar<Baz<string>>): string {
    return 'nested-generic';
  }
}
  `,

  ASYNC_STATE_INHERITANCE: `
import { Service } from "@tdi2/di-core/decorators";

export class AsyncState<T> {
  protected state: T | null = null;
  
  getState(): T | null {
    return this.state;
  }
  
  setState(newState: T): void {
    this.state = newState;
  }
}

export interface UserServiceState {
  userId: string;
  isLoggedIn: boolean;
  profile?: any;
}

@Service()
export class UserService extends AsyncState<UserServiceState> {
  login(userId: string): void {
    this.setState({
      userId,
      isLoggedIn: true
    });
  }
  
  logout(): void {
    this.setState({
      userId: '',
      isLoggedIn: false
    });
  }
}
  `,

  COMPLEX_STATE_SERVICE: `
import { Service } from "@tdi2/di-core/decorators";

export interface ProductData {
  id: string;
  name: string;
  price: number;
}

export interface CartState {
  items: ProductData[];
  total: number;
}

export class AsyncState<T> {
  protected state: T | null = null;
  
  getState(): T | null {
    return this.state;
  }
}

@Service()
export class CartService extends AsyncState<CartState> {
  addItem(product: ProductData): void {
    const currentState = this.getState() || { items: [], total: 0 };
    const newItems = [...currentState.items, product];
    const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
    
    this.setState({
      items: newItems,
      total: newTotal
    });
  }
}
  `,

  WITH_DEPENDENCIES: `
import { Service, Inject } from "@tdi2/di-core/decorators";

export interface LoggerInterface {
  log(message: string): void;
}

export interface CacheInterface<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
}

export interface ApiInterface {
  getData(): Promise<string[]>;
}

@Service()
export class ApiServiceWithDependencies implements ApiInterface {
  constructor(
    @Inject() private logger: LoggerInterface,
    @Inject() private cache?: CacheInterface<any>
  ) {}
  
  async getData(): Promise<string[]> {
    this.logger.log('Fetching data');
    
    const cached = this.cache?.get('data');
    if (cached) {
      return cached;
    }
    
    const data = ['item1', 'item2'];
    this.cache?.set('data', data);
    return data;
  }
}
  `,

  INVALID_SOURCE: `
import { Service } from "some-other-package/decorators";

// This should NOT be picked up by DI scanner due to invalid source
@Service()
export class InvalidSourceService {
  doSomething(): void {
    console.log('Invalid source');
  }
}
  `,

  NO_DECORATOR: `
// This should NOT be picked up by DI scanner - no @Service decorator
export class NoDecoratorService {
  doSomething(): void {
    console.log('No decorator');
  }
}
  `,

  MULTIPLE_CONSTRUCTORS: `
import { Service, Inject } from "@tdi2/di-core/decorators";

export interface LoggerInterface {
  log(message: string): void;
}

@Service()
export class MultipleConstructorsService {
  private logger: LoggerInterface;
  
  // First constructor
  constructor(@Inject() logger: LoggerInterface);
  
  // Second constructor (this should cause validation warning)
  constructor(@Inject() logger: LoggerInterface, config: any);
  
  constructor(@Inject() logger: LoggerInterface, config?: any) {
    this.logger = logger;
  }
}
  `,

  CIRCULAR_DEPENDENCY_A: `
import { Service, Inject } from "@tdi2/di-core/decorators";

export interface CircularBInterface {
  methodB(): void;
}

export interface CircularAInterface {
  methodA(): void;
}

@Service()
export class CircularA implements CircularAInterface {
  constructor(@Inject() private serviceB: CircularBInterface) {}
  
  methodA(): void {
    this.serviceB.methodB();
  }
}
  `,

  CIRCULAR_DEPENDENCY_B: `
import { Service, Inject } from "@tdi2/di-core/decorators";
import type { CircularAInterface } from './CircularA';

export interface CircularBInterface {
  methodB(): void;
}

@Service()
export class CircularB implements CircularBInterface {
  constructor(@Inject() private serviceA: CircularAInterface) {}
  
  methodB(): void {
    this.serviceA.methodA();
  }
}
  `
};