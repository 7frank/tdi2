export interface UserServiceInterface {
  getUser(id: string): Promise<User>;
  createUser(userData: CreateUserData): Promise<User>;
}

export interface LoggerInterface {
  log(message: string): void;
  error(message: string, error?: Error): void;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserData {
  name: string;
  email: string;
}