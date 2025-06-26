// src/services/ConsoleLoggerService.ts

import { Service } from '../di/decorators';
import { type LoggerService } from './ExampleApiService';

@Service({})
export class ConsoleLoggerService implements LoggerService {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
  }
}