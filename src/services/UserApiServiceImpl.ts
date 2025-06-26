// src/services/UserApiServiceImpl.ts - Example of interface-based implementation

import { Service, Inject } from '../di/decorators';
import type { ExampleApiInterface } from './ExampleApiInterface';

// Define additional interfaces
export interface LoggerInterface {
  log(message: string): void;
  error(message: string, error?: any): void;
  warn(message: string): void;
}

export interface CacheInterface<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// Logger implementation
@Service()
export class ConsoleLogger implements LoggerInterface {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  }
}

// Cache implementation
@Service()
export class MemoryCache<T> implements CacheInterface<T> {
  private cache = new Map<string, { value: T; expires?: number }>();

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expires = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

// Enhanced User API Service with interface-based dependencies
@Service()
export class UserApiServiceImpl implements ExampleApiInterface {
  
  // Constructor injection using interfaces (no explicit tokens needed!)
  constructor(
    @Inject() private logger: LoggerInterface,
    @Inject() private cache?: CacheInterface<any>
  ) {
    this.logger.log('UserApiServiceImpl initialized');
  }

  async getData(): Promise<string[]> {
    this.logger.log('Fetching data from API');
    
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get('api-data');
      if (cached) {
        this.logger.log('Returning cached data');
        return cached;
      }
    }
    
    // Simulate API call
    await this.delay(1000);
    const data = ['Item 1 (Interface DI)', 'Item 2 (Interface DI)', 'Item 3 (Interface DI)', 'Item 4 (Interface DI)'];
    
    // Cache the result
    if (this.cache) {
      await this.cache.set('api-data', data, 300); // 5 minutes TTL
      this.logger.log('Data cached for 5 minutes');
    }
    
    return data;
  }

  async postData(data: any): Promise<boolean> {
    this.logger.log('Posting data to API');
    
    try {
      // Simulate API call
      await this.delay(500);
      
      // Invalidate cache
      if (this.cache) {
        await this.cache.delete('api-data');
        this.logger.log('Cache invalidated after data post');
      }
      
      console.log('Posting data:', data);
      return true;
    } catch (error) {
      this.logger.error('Failed to post data', error);
      return false;
    }
  }

  async getUserInfo(id: string): Promise<{ id: string; name: string; email: string }> {
    this.logger.log(`Fetching user info for ID: ${id}`);
    
    // Try cache first
    const cacheKey = `user-${id}`;
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.log(`Returning cached user data for ${id}`);
        return cached;
      }
    }
    
    // Simulate API call
    await this.delay(800);
    const userInfo = {
      id,
      name: `User ${id} (Interface DI)`,
      email: `user${id}@example.com`
    };
    
    // Cache the result
    if (this.cache) {
      await this.cache.set(cacheKey, userInfo, 600); // 10 minutes TTL
      this.logger.log(`User data cached for ${id}`);
    }
    
    return userInfo;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Alternative implementation for testing
@Service()
export class MockUserApiService implements ExampleApiInterface {
  
  constructor(@Inject() private logger: LoggerInterface) {
    this.logger.log('MockUserApiService initialized (for testing)');
  }

  async getData(): Promise<string[]> {
    this.logger.log('Mock: Returning test data');
    return ['Mock Item 1', 'Mock Item 2'];
  }

  async postData(data: any): Promise<boolean> {
    this.logger.log('Mock: Simulating data post');
    console.log('Mock posting:', data);
    return true;
  }

  async getUserInfo(id: string): Promise<{ id: string; name: string; email: string }> {
    this.logger.log(`Mock: Returning test user for ID: ${id}`);
    return {
      id,
      name: `Mock User ${id}`,
      email: `mock${id}@test.com`
    };
  }
}