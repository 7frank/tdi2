import { useContext } from 'react';
import { DIContext } from '@tdi2/di-core';
import { ProductServiceInterface } from '../services/ProductService';
import { CartServiceInterface } from '../services/CartService';
import { UserServiceInterface } from '../services/UserService';
import { InventoryServiceInterface } from '../services/InventoryService';

export function useServices() {
  const container = useContext(DIContext);
  
  if (!container) {
    throw new Error('useServices must be used within a DIProvider');
  }

  return {
    productService: container.resolve<ProductServiceInterface>('ProductServiceInterface'),
    cartService: container.resolve<CartServiceInterface>('CartServiceInterface'),
    userService: container.resolve<UserServiceInterface>('UserServiceInterface'),
    inventoryService: container.resolve<InventoryServiceInterface>('InventoryServiceInterface')
  };
}