// src/di/types.ts

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface ServiceMetadata {
  token: string | symbol;
  scope?: 'singleton' | 'transient' | 'scoped';
  implementation: Constructor;
}

export interface DIContainer {
  register<T>(token: string | symbol, implementation: Constructor<T>, scope?: 'singleton' | 'transient' | 'scoped'): void;
  resolve<T>(token: string | symbol): T;
  has(token: string | symbol): boolean;
  createScope(): DIContainer;
}

// Service decorator options
export interface ServiceOptions {
  scope?: 'singleton' | 'transient' | 'scoped';
  token?: string | symbol;
}

// Generated service factory type
export type ServiceFactory<T> = () => T;

// Generated dependency injection map
export interface DIMap {
  [token: string]: {
    factory: ServiceFactory<any>;
    scope: 'singleton' | 'transient' | 'scoped';
    dependencies: string[];
  };
}