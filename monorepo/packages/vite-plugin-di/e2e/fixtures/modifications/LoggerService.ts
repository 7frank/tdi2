import { Service } from '@tdi2/di-core';
import type { LoggerServiceInterface } from '../types/interfaces';

@Service()
export class LoggerService implements LoggerServiceInterface {
  state = {
    logs: [] as string[],
  };

  log(message: string) {
    const timestamp = new Date().toISOString();
    this.state.logs.push(`[${timestamp}] ${message}`);
  }

  clear() {
    this.state.logs = [];
  }
}
