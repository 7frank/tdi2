// test-fixtures/inline-style.tsx - Inline injection markers

import React from 'react';
import type { Inject, InjectOptional } from '../src/di/markers';

// Fixture 1: Inline with destructuring
export function InlineWithDestructuring(props: {
  message: string;
  services: {
    api: Inject<ExampleApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { message, services } = props;
  
  React.useEffect(() => {
    services.api.getData().then(data => {
      services.logger?.log(`Got data: ${data.length} items`);
    });
  }, []);

  return <div>Inline with destructuring: {message}</div>;
}

// Fixture 2: Inline without destructuring
export function InlineWithoutDestructuring(props: {
  title: string;
  services: {
    api: Inject<ExampleApiInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}) {
  React.useEffect(() => {
    props.services.api.getData().then(data => {
      props.services.cache?.set('data', data);
    });
  }, []);

  return <div>Inline without destructuring: {props.title}</div>;
}

// Fixture 3: Inline with multiple required services
export function InlineMultipleRequired(props: {
  id: string;
  services: {
    api: Inject<ExampleApiInterface>;
    logger: Inject<LoggerInterface>;
    cache: Inject<CacheInterface<string[]>>;
  };
}) {
  const { id, services } = props;
  
  const handleClick = async () => {
    services.logger.log(`Processing ${id}`);
    const data = await services.api.getData();
    await services.cache.set(id, data);
  };

  return (
    <button onClick={handleClick}>
      Process {id}
    </button>
  );
}

// Fixture 4: Inline with all optional services
export function InlineAllOptional(props: {
  name: string;
  services: {
    logger?: InjectOptional<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
    api?: InjectOptional<ExampleApiInterface>;
  };
}) {
  const { name, services } = props;
  
  React.useEffect(() => {
    services.logger?.log(`Component ${name} mounted`);
    if (services.api) {
      services.api.getData().then(data => {
        services.cache?.set(name, data);
      });
    }
  }, []);

  return <div>All optional: {name}</div>;
}

// Fixture 5: Inline with mixed required/optional and no destructuring
export function InlineMixedNoDestructuring(props: {
  config: { enabled: boolean };
  services: {
    api: Inject<ExampleApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
    cache: Inject<CacheInterface<any>>;
  };
}) {
  if (!props.config.enabled) {
    return <div>Disabled</div>;
  }

  React.useEffect(() => {
    props.services.logger?.log('Component enabled');
    props.services.api.getData().then(data => {
      props.services.cache.set('enabled-data', data);
    });
  }, []);

  return <div>Mixed injection (no destructuring)</div>;
}

// Mock interfaces for testing
export interface ExampleApiInterface {
  getData(): Promise<string[]>;
  postData(data: any): Promise<boolean>;
}

export interface LoggerInterface {
  log(message: string): void;
  error(message: string, error?: any): void;
}

export interface CacheInterface<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
}