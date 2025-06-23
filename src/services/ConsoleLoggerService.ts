// src/services/ConsoleLoggerService.ts

import { Service } from '../di/decorators';
import { type LoggerService, LOGGER_TOKEN } from './ExampleApiService';

@Service({ token: LOGGER_TOKEN })
export class ConsoleLoggerService implements LoggerService {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
  }
}