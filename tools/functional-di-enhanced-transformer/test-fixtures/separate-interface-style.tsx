// test-fixtures/separate-interface-style.tsx - Separate interface definitions

import React from 'react';
import type { Inject, InjectOptional } from '../src/di/markers';

// Interface definitions
interface SimpleComponentProps {
  title: string;
  services: {
    api: Inject<ExampleApiInterface>;
  };
}

interface ComplexComponentProps {
  userId: string;
  config: {
    timeout: number;
    retries: number;
  };
  services: {
    api: Inject<ExampleApiInterface>;
    logger: Inject<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<UserData>>;
  };
}

interface OptionalOnlyProps {
  name: string;
  services: {
    logger?: InjectOptional<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}

interface NestedServicesProps {
  data: {
    id: string;
    type: 'user' | 'admin';
  };
  services: {
    userApi: Inject<UserApiInterface>;
    adminApi: Inject<AdminApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}

interface GenericServicesProps<T> {
  item: T;
  services: {
    repository: Inject<RepositoryInterface<T>>;
    logger?: InjectOptional<LoggerInterface>;
  };
}

// Fixture 1: Simple separate interface with destructuring
export function SeparateInterfaceWithDestructuring(props: SimpleComponentProps) {
  const { title, services } = props;
  
  React.useEffect(() => {
    services.api.getData().then(data => {
      console.log(`${title}: got ${data.length} items`);
    });
  }, []);

  return <div>Separate interface: {title}</div>;
}

// Fixture 2: Complex separate interface without destructuring
export function SeparateInterfaceWithoutDestructuring(props: ComplexComponentProps) {
  React.useEffect(() => {
    props.services.logger.log(`Loading user ${props.userId}`);
    
    const fetchWithRetry = async (retries: number) => {
      for (let i = 0; i < retries; i++) {
        try {
          const data = await props.services.api.getUserInfo(props.userId);
          props.services.cache?.set(props.userId, data);
          return data;
        } catch (error) {
          props.services.logger.error(`Attempt ${i + 1} failed`, error);
          if (i === retries - 1) throw error;
        }
      }
    };

    fetchWithRetry(props.config.retries);
  }, []);

  return <div>Complex props: {props.userId}</div>;
}

// Fixture 3: Optional only services
export function SeparateInterfaceOptionalOnly(props: OptionalOnlyProps) {
  const { name, services } = props;
  
  React.useEffect(() => {
    services.logger?.log(`Optional component ${name} mounted`);
    services.cache?.set(`optional-${name}`, { mounted: true });
  }, []);

  return <div>Optional only: {name}</div>;
}

// Fixture 4: Nested/complex services structure
export function SeparateInterfaceNested(props: NestedServicesProps) {
  const { data, services } = props;
  
  const handleAction = async () => {
    services.logger?.log(`Handling ${data.type} action for ${data.id}`);
    
    if (data.type === 'user') {
      await services.userApi.getUserProfile(data.id);
    } else {
      await services.adminApi.getAdminDashboard(data.id);
    }
  };

  return (
    <button onClick={handleAction}>
      {data.type} action for {data.id}
    </button>
  );
}

// Fixture 5: Generic component with separate interface
export function SeparateInterfaceGeneric<T>(props: GenericServicesProps<T>) {
  const { item, services } = props;
  
  React.useEffect(() => {
    services.logger?.log('Generic component mounted');
    services.repository.save(item);
  }, []);

  return <div>Generic component</div>;
}

// Fixture 6: Arrow function with separate interface
export const SeparateInterfaceArrow = (props: SimpleComponentProps) => {
  const { title, services } = props;
  
  const handleRefresh = () => {
    services.api.getData().then(data => {
      console.log('Refreshed:', data);
    });
  };

  return (
    <div onClick={handleRefresh}>
      Arrow function: {title}
    </div>
  );
};

// Mock interfaces
export interface ExampleApiInterface {
  getData(): Promise<string[]>;
  getUserInfo(userId: string): Promise<UserData>;
}

export interface LoggerInterface {
  log(message: string): void;
  error(message: string, error?: any): void;
}

export interface CacheInterface<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
}

export interface UserApiInterface {
  getUserProfile(userId: string): Promise<UserProfile>;
}

export interface AdminApiInterface {
  getAdminDashboard(adminId: string): Promise<AdminDashboard>;
}

export interface RepositoryInterface<T> {
  save(item: T): Promise<void>;
  findById(id: string): Promise<T | null>;
}

// Mock types
export interface UserData {
  id: string;
  name: string;
  email: string;
}

export interface UserProfile {
  user: UserData;
  preferences: any;
}

export interface AdminDashboard {
  stats: any;
  users: UserData[];
}