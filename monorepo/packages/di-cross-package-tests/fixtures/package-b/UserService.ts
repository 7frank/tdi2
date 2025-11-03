import { Service } from '@tdi2/di-core';
import type { LoggerInterface } from '../package-a/LoggerService';

/**
 * User service interface - Package B
 */
export interface UserServiceInterface {
  state: {
    users: Array<{ id: number; name: string }>;
  };
  addUser(name: string): void;
  getUsers(): Array<{ id: number; name: string }>;
}

/**
 * User service implementation in Package B
 * DEPENDS ON LoggerInterface from Package A
 */
@Service()
export class UserService implements UserServiceInterface {
  state = {
    users: [] as Array<{ id: number; name: string }>,
  };

  constructor(private logger: LoggerInterface) {
    this.logger.log('UserService initialized');
  }

  addUser(name: string): void {
    const user = { id: this.state.users.length + 1, name };
    this.state.users.push(user);
    this.logger.log(`User added: ${name} (id: ${user.id})`);
  }

  getUsers(): Array<{ id: number; name: string }> {
    this.logger.log(`Fetching ${this.state.users.length} users`);
    return this.state.users;
  }
}
