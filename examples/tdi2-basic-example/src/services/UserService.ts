import { Service, Inject } from '@tdi2/di-core/decorators';
import type { UserServiceInterface, LoggerInterface, User, CreateUserData } from './interfaces';

@Service()
export class UserService implements UserServiceInterface {
  constructor(
    @Inject() private logger: LoggerInterface // Auto-resolved to ConsoleLogger!
  ) {}

  async getUser(id: string): Promise<User> {
    this.logger.log(`Fetching user with id: ${id}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
    };

    this.logger.log(`Successfully fetched user: ${user.name}`);
    return user;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    this.logger.log(`Creating user: ${userData.name}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData,
    };

    this.logger.log(`Successfully created user: ${user.name}`);
    return user;
  }
}