import { Service } from '@tdi2/di-core/decorators';
import type { LoggerInterface } from './interfaces';

@Service()
export class ConsoleLogger implements LoggerInterface {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  }
}