// tools/functional-di-enhanced-transformer/fixtures/marker-approach.ts.txt - Test fixtures for marker approach

export const MARKER_FIXTURES = {
  SINGLE_SERVICE_FUNCTION: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface FooInterface {
  foo(): string;
}

export function Component(props: { service: Inject<FooInterface> }) {
  const { service } = props;
  return <div>{service.foo()}</div>;
}
  `,

  SINGLE_SERVICE_ARROW: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface FooInterface<A, B> {
  process(a: A, b: B): string;
}

export const Component = (props: { service: Inject<FooInterface<string, number>> }) => {
  const { service } = props;
  return <div>{service.process('test', 42)}</div>;
};
  `,

  DESTRUCTURED_SINGLE_SERVICE: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface FooInterface {
  foo(): string;
}

export const Component = ({ service }: { service: Inject<FooInterface> }) => {
  return <div>{service.foo()}</div>;
};
  `,

  MULTIPLE_SERVICES_NESTED: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface FooInterface {
  foo(): string;
}

export interface BarInterface {
  bar(): number;
}

export function Component(props: { 
  services: { 
    foo: Inject<FooInterface>; 
    bar: Inject<BarInterface>; 
  } 
}) {
  const { services: { foo, bar } } = props;
  return <div>{foo.foo()} - {bar.bar()}</div>;
}
  `,

  MULTIPLE_SERVICES_WITH_GENERICS: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface FooInterface<A> {
  process(a: A): string;
}

export interface BarInterface<B> {
  handle(b: B): number;
}

export const Component = ({ services }: { 
  services: { 
    foo: Inject<FooInterface<string>>; 
    bar: Inject<BarInterface<number>>; 
  } 
}) => {
  const { foo, bar } = services;
  return <div>{foo.process('test')} - {bar.handle(42)}</div>;
};
  `,

  NESTED_GENERIC_INJECTION: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface Bar<T> {
  process(item: T): T;
}

export interface Baz {
  value: string;
}

export interface FooInterface<T> {
  handle(processor: T): string;
}

export const Component = ({ service }: { 
  service: Inject<FooInterface<Bar<Baz>>> 
}) => {
  return <div>{service.handle({ process: (item) => item })}</div>;
};
  `,

  OPTIONAL_SERVICES: `
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export interface FooInterface {
  foo(): string;
}

export interface BarInterface {
  bar(): number;
}

export interface CacheInterface<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
}

export function Component(props: {
  services: {
    foo: Inject<FooInterface>;
    bar?: InjectOptional<BarInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}) {
  const { services } = props;
  
  React.useEffect(() => {
    console.log(services.foo.foo());
    if (services.bar) {
      console.log(services.bar.bar());
    }
    if (services.cache) {
      services.cache.set('key', 'value');
    }
  }, [services]);
  
  return <div>Component with optional services</div>;
}
  `,

  SEPARATE_INTERFACE_DEFINITION: `
import React from 'react';
import type { ComponentProps } from './ComponentProps';

export function Component(props: ComponentProps) {
  const { title, services } = props;
  return <div>{title}</div>;
}
  `,

  SEPARATE_INTERFACE_FILE: `
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export interface FooInterface {
  foo(): string;
}

export interface BarInterface {
  bar(): number;
}

export interface ComponentProps {
  title: string;
  services: {
    foo: Inject<FooInterface>;
    bar?: InjectOptional<BarInterface>;
  };
}
  `,

  COMPLEX_PROPS_DESTRUCTURING: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface ApiInterface {
  getData(): Promise<string[]>;
}

export function Component(props: {
  user: {
    profile: {
      settings: { theme: string };
    };
  };
  services: {
    api: Inject<ApiInterface>;
  };
}) {
  const { 
    user: { 
      profile: { 
        settings: { theme } 
      } 
    }, 
    services 
  } = props;
  
  React.useEffect(() => {
    services.api.getData();
  }, []);
  
  return <div>Theme: {theme}</div>;
}
  `,

  MIXED_DI_AND_NON_DI: `
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export interface ApiInterface {
  getData(): Promise<string[]>;
}

export interface CacheInterface<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
}

// Regular service classes (not DI)
export class LoggerService {
  log(message: string): void {
    console.log(message);
  }
}

export class UtilityService {
  format(value: any): string {
    return String(value);
  }
}

export function Component(props: {
  config: any;
  services: {
    api: Inject<ApiInterface>; // DI
    logger: LoggerService; // Non-DI
    cache?: InjectOptional<CacheInterface<any>>; // DI optional
    utils: UtilityService; // Non-DI
  };
}) {
  const { config, services } = props;
  return <div>Mixed services</div>;
}
  `,

  INVALID_MARKER_SOURCE: `
import React from 'react';
import type { Inject } from "some-other-package/markers";

export interface FooInterface {
  foo(): string;
}

// This should NOT be transformed due to invalid marker source
export function Component(props: { service: Inject<FooInterface> }) {
  const { service } = props;
  return <div>{service.foo()}</div>;
}
  `,

  NO_MARKER_TYPES: `
import React from 'react';

export interface FooInterface {
  foo(): string;
}

export interface BarInterface {
  bar(): number;
}

// This should NOT be transformed - no Inject<> markers
export function Component(props: {
  data: any;
  services: {
    foo: FooInterface; // No Inject wrapper
    bar: BarInterface; // No Inject wrapper
  };
}) {
  return <div>Non-DI services</div>;
}
  `,

  MULTIPLE_PARAMETERS: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface ApiInterface {
  getData(): Promise<string[]>;
}

// This should NOT be transformed - multiple parameters
export function Component(
  props: { title: string },
  config: { enabled: boolean },
  services: {
    api: Inject<ApiInterface>;
  }
) {
  return <div>Multiple params</div>;
}
  `,

  ASYNC_STATE_MARKERS: `
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export interface UserServiceState {
  userId: string;
  isLoggedIn: boolean;
  profile?: any;
}

export interface ProductServiceState {
  products: any[];
  loading: boolean;
}

export function Component(props: {
  services: {
    userState: Inject<AsyncState<UserServiceState>>;
    productState?: InjectOptional<AsyncState<ProductServiceState>>;
  };
}) {
  const { services } = props;
  
  React.useEffect(() => {
    const userState = services.userState.getState();
    const productState = services.productState?.getState();
    
    console.log({ userState, productState });
  }, []);
  
  return <div>State-based DI</div>;
}
  `,

  INHERITANCE_MARKERS: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface NotificationData {
  message: string;
  type: 'info' | 'warning' | 'error';
}

export function Component(props: {
  services: {
    notifications: Inject<AsyncState<NotificationData[]>>;
    userService: Inject<BaseService<UserServiceState>>;
  };
}) {
  const { services } = props;
  return <div>Inheritance-based DI</div>;
}
  `,

  COMPLEX_NESTED_GENERICS: `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}

export interface UserEntity {
  id: string;
  name: string;
  email: string;
}

export interface ConfigData {
  theme: string;
  language: string;
}

export interface CacheInterface<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
}

export interface StateManager<T> {
  getState(): T;
  setState(newState: T): void;
}

export function Component(props: {
  services: {
    userRepo: Inject<Repository<UserEntity>>;
    configCache: Inject<CacheInterface<Map<string, ConfigData>>>;
    stateManager: Inject<StateManager<{
      users: UserEntity[];
      config: ConfigData;
      notifications: string[];
    }>>;
  };
}) {
  const { services } = props;
  return <div>Complex nested generics</div>;
}
  `
};