import { DIContainer } from '@tdi2/di-core';
import { ProductService } from './services/ProductService';
import { CartService } from './services/CartService';
import { UserService } from './services/UserService';
import { InventoryService } from './services/InventoryService';
import { ProductRepository } from './repositories/ProductRepository';
import { UserRepository } from './repositories/UserRepository';

// Create DI container
export const container = new DIContainer();

// Register repositories
container.register('ProductRepositoryInterface', ProductRepository);
container.register('UserRepositoryInterface', UserRepository);

// Register services
container.register('ProductServiceInterface', ProductService);
container.register('CartServiceInterface', CartService);
container.register('UserServiceInterface', UserService);
container.register('InventoryServiceInterface', InventoryService);