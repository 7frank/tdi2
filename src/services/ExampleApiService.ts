// src/services/ExampleApiService.ts

import { Service, Inject } from '../di/decorators';
import { ExampleApiInterface, EXAMPLE_API_TOKEN } from './ExampleApiInterface';

// Example of a dependency that could be injected
export interface LoggerService {
  log(message: string): void;
}

export const LOGGER_TOKEN = 'LoggerService';

@Service({ token: EXAMPLE_API_TOKEN })
export class ExampleApiService implements ExampleApiInterface {
  
  // Example of constructor injection
  constructor(
    @Inject(LOGGER_TOKEN) private logger?: LoggerService
  ) {}

  async getData(): Promise<string[]> {
    this.logger?.log('Fetching data from API');
    // Simulate API call
    await this.delay(1000);
    return ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
  }

  async postData(data: any): Promise<boolean> {
    this.logger?.log('Posting data to API');
    // Simulate API call
    await this.delay(500);
    console.log('Posting data:', data);
    return true;
  }

  async getUserInfo(id: string): Promise<{ id: string; name: string; email: string }> {
    this.logger?.log(`Fetching user info for ID: ${id}`);
    // Simulate API call
    await this.delay(800);
    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}