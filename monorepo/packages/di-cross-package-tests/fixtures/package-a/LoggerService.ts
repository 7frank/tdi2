import { Service } from '@tdi2/di-core';

/**
 * Base logger interface - Package A
 */
export interface LoggerInterface {
  state: {
    logs: string[];
  };
  log(message: string): void;
  getLogs(): string[];
}

/**
 * Logger service implementation in Package A
 */
@Service()
export class LoggerService implements LoggerInterface {
  state = {
    logs: [] as string[],
  };

  log(message: string): void {
    const timestamp = new Date().toISOString();
    this.state.logs.push(`[${timestamp}] ${message}`);
    console.log(message);
  }

  getLogs(): string[] {
    return this.state.logs;
  }
}
