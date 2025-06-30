// src/services/ConsoleLoggerService.ts

import { Service } from '@tdi2/di-core/decorators';
import { type LoggerService } from './ExampleApiService';

@Service()
export class ConsoleLoggerService implements LoggerService {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
  }
}