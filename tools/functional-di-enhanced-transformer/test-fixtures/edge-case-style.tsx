// test-fixtures/edge-case-style.tsx - Edge cases and complex scenarios

import React from 'react';
import type { Inject, InjectOptional } from '../src/di/markers';

// Fixture 1: No services (should be ignored by transformer)
export function NoServices(props: {
  message: string;
  onClick: () => void;
}) {
  return <button onClick={props.onClick}>{props.message}</button>;
}

// Fixture 2: Empty services object (should be ignored)
export function EmptyServices(props: {
  title: string;
  services: {};
}) {
  return <div>{props.title}</div>;
}

// Fixture 3: Services without DI markers (should be ignored)
export function NonDIServices(props: {
  data: any;
  services: {
    api: ApiService; // No Inject<> wrapper
    logger: LoggerService; // No Inject<> wrapper
  };
}) {
  return <div>Non-DI services</div>;
}

// Fixture 4: Mixed DI and non-DI services
export function MixedServices(props: {
  config: any;
  services: {
    api: Inject<ExampleApiInterface>; // DI
    logger: LoggerService; // Non-DI
    cache?: InjectOptional<CacheInterface<any>>; // DI optional
    utils: UtilityService; // Non-DI
  };
}) {
  const { config, services } = props;
  
  React.useEffect(() => {
    // Only DI services should be transformed
    services.api.getData();
    services.cache?.set('config', config);
    
    // Non-DI services should remain as props
    services.logger.log('Mixed services');
    services.utils.formatData(config);
  }, []);

  return <div>Mixed services</div>;
}

// Fixture 5: Deeply nested props destructuring
export function DeeplyNestedDestructuring(props: {
  user: {
    profile: {
      id: string;
      settings: {
        theme: string;
      };
    };
  };
  services: {
    api: Inject<ExampleApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { 
    user: { 
      profile: { 
        id, 
        settings: { theme } 
      } 
    }, 
    services 
  } = props;
  
  React.useEffect(() => {
    services.logger?.log(`User ${id} with theme ${theme}`);
    services.api.getUserInfo(id);
  }, []);

  return <div>Nested destructuring: {id} ({theme})</div>;
}

// Fixture 6: Services as second parameter (should not be transformed)
export function ServicesAsSecondParam(
  props: { message: string },
  services: {
    api: Inject<ExampleApiInterface>;
    logger: Inject<LoggerInterface>;
  }
) {
  return <div>Services as second param: {props.message}</div>;
}

// Fixture 7: Multiple parameters (should not be transformed)
export function MultipleParameters(
  props: { title: string },
  config: { enabled: boolean },
  services: {
    api: Inject<ExampleApiInterface>;
  }
) {
  return <div>Multiple params: {props.title}</div>;
}

// Fixture 8: Complex generic services
export function ComplexGenericServices(props: {
  data: any;
  services: {
    repository: Inject<RepositoryInterface<ComplexEntity>>;
    cache: Inject<CacheInterface<Map<string, ComplexEntity>>>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { data, services } = props;
  
  React.useEffect(() => {
    services.logger?.log('Complex generics');
    services.repository.save(data as ComplexEntity);
    services.cache.set('entities', new Map());
  }, []);

  return <div>Complex generics</div>;
}

// Fixture 9: AsyncState pattern services
export function AsyncStateServices(props: {
  userId: string;
  services: {
    userService: Inject<AsyncState<UserServiceState>>;
    formService: Inject<AsyncState<FormState>>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { userId, services } = props;
  
  React.useEffect(() => {
    services.logger?.log(`AsyncState component for ${userId}`);
    // These should resolve to state-based DI registrations
    if (services.userService.state.isIdle) {
      services.userService.loadUser(userId);
    }
  }, []);

  return <div>AsyncState services: {userId}</div>;
}

// Fixture 10: Inheritance-based services
export function InheritanceBasedServices(props: {
  entityId: string;
  services: {
    entityService: Inject<BaseEntityService<Entity>>;
    repository: Inject<BaseRepository<Entity>>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { entityId, services } = props;
  
  React.useEffect(() => {
    services.logger?.log(`Inheritance-based for ${entityId}`);
    services.entityService.processEntity(entityId);
    services.repository.findById(entityId);
  }, []);

  return <div>Inheritance-based: {entityId}</div>;
}

// Fixture 11: Component without function body (should handle gracefully)
export function NoFunctionBody(props: {
  services: {
    api: Inject<ExampleApiInterface>;
  };
}): JSX.Element;

// Fixture 12: Arrow function in variable declaration
export const ArrowFunctionVariable = (props: {
  name: string;
  services: {
    api: Inject<ExampleApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) => {
  const { name, services } = props;
  
  React.useEffect(() => {
    services.logger?.log(`Arrow function: ${name}`);
    services.api.getData();
  }, []);

  return <span>Arrow: {name}</span>;
};

// Fixture 13: Function with return type annotation
export function WithReturnType(props: {
  value: number;
  services: {
    calculator: Inject<CalculatorInterface>;
  };
}): React.ReactElement {
  const { value, services } = props;
  
  const result = services.calculator.square(value);
  
  return <div>Result: {result}</div>;
}

// Mock interfaces and types
export interface ExampleApiInterface {
  getData(): Promise<string[]>;
  getUserInfo(userId: string): Promise<any>;
}

export interface LoggerInterface {
  log(message: string): void;
}

export interface CacheInterface<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
}

export interface RepositoryInterface<T> {
  save(item: T): Promise<void>;
  findById(id: string): Promise<T | null>;
}

export interface AsyncState<T> {
  state: T;
  loadUser?(id: string): Promise<void>;
}

export interface BaseEntityService<T> {
  processEntity(id: string): Promise<T>;
}

export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
}

export interface CalculatorInterface {
  square(value: number): number;
}

// Mock classes (non-DI)
export class ApiService {
  getData() { return Promise.resolve([]); }
}

export class LoggerService {
  log(message: string) { console.log(message); }
}

export class UtilityService {
  formatData(data: any) { return data; }
}

// Mock types
export interface ComplexEntity {
  id: string;
  data: any;
}

export interface UserServiceState {
  user: any;
  isLoading: boolean;
  isIdle: boolean;
}

export interface FormState {
  values: any;
  errors: any;
}

export interface Entity {
  id: string;
}