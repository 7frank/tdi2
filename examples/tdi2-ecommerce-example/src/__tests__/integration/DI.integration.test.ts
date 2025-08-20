import { describe, it, expect, beforeEach } from 'vitest';
import { DIContainer } from '@tdi2/di-core';
import { ProductService, ProductServiceInterface } from '../../services/ProductService';
import { CartService, CartServiceInterface } from '../../services/CartService';
import { UserService, UserServiceInterface } from '../../services/UserService';
import { InventoryService, InventoryServiceInterface } from '../../services/InventoryService';
import { ProductRepository, ProductRepositoryInterface } from '../../repositories/ProductRepository';
import { UserRepository, UserRepositoryInterface } from '../../repositories/UserRepository';

// DI Integration Tests
// Test how services work together through dependency injection
describe('DI Integration Tests', () => {
  let container: DIContainer;
  let productService: ProductServiceInterface;
  let cartService: CartServiceInterface;
  let userService: UserServiceInterface;
  let inventoryService: InventoryServiceInterface;

  beforeEach(() => {
    // Create fresh DI container for each test
    container = new DIContainer();

    // Register repositories
    container.register('ProductRepositoryInterface', ProductRepository);
    container.register('UserRepositoryInterface', UserRepository);

    // Register services - DI will handle dependencies automatically
    container.register('ProductServiceInterface', ProductService);
    container.register('CartServiceInterface', CartService);
    container.register('UserServiceInterface', UserService);
    container.register('InventoryServiceInterface', InventoryService);

    // Resolve services from container
    productService = container.resolve<ProductServiceInterface>('ProductServiceInterface');
    cartService = container.resolve<CartServiceInterface>('CartServiceInterface');
    userService = container.resolve<UserServiceInterface>('UserServiceInterface');
    inventoryService = container.resolve<InventoryServiceInterface>('InventoryServiceInterface');
  });

  describe('Service Resolution', () => {
    it('should resolve all services from DI container', () => {
      expect(productService).toBeInstanceOf(ProductService);
      expect(cartService).toBeInstanceOf(CartService);
      expect(userService).toBeInstanceOf(UserService);
      expect(inventoryService).toBeInstanceOf(InventoryService);
    });

    it('should inject dependencies correctly', () => {
      // Services should have their dependencies injected
      expect(productService).toBeDefined();
      expect(cartService).toBeDefined();
      
      // CartService should have InventoryService injected
      expect(cartService.state).toBeDefined();
    });
  });

  describe('Service Interactions', () => {
    it('should handle product loading and cart interaction', async () => {
      // Arrange - Load products
      await productService.loadProducts();
      expect(productService.state.products.length).toBeGreaterThan(0);

      const firstProduct = productService.state.products[0];
      const initialCartItems = cartService.state.items.length;

      // Act - Add product to cart (this uses CartService -> InventoryService interaction)
      await cartService.addItem(firstProduct, 1);

      // Assert - Cart should update
      expect(cartService.state.items.length).toBe(initialCartItems + 1);
      expect(cartService.state.items[0].id).toBe(firstProduct.id);
      expect(cartService.state.totalItems).toBe(1);
    });

    it('should enforce stock constraints across services', async () => {
      // Arrange
      await productService.loadProducts();
      const product = productService.state.products[0];
      
      // Reserve all stock
      const stockLevel = await inventoryService.getStockLevel(product.id);
      await inventoryService.reserveStock(product.id, stockLevel);

      // Act & Assert - Cart should respect inventory constraints
      await expect(cartService.addItem(product, 1))
        .rejects.toThrow('Insufficient stock');
    });

    it('should handle user authentication workflow', async () => {
      // Arrange
      expect(userService.state.isAuthenticated).toBe(false);

      // Act - Login with demo credentials
      const loginSuccess = await userService.login('demo@example.com', 'password');

      // Assert
      expect(loginSuccess).toBe(true);
      expect(userService.state.isAuthenticated).toBe(true);
      expect(userService.state.currentUser?.email).toBe('demo@example.com');
    });
  });

  describe('Cross-Service State Management', () => {
    it('should maintain reactive state across service boundaries', async () => {
      // Arrange - Set up cart with items
      await productService.loadProducts();
      const product = productService.state.products[0];
      await cartService.addItem(product, 2);

      // Act - Apply discount
      const discountApplied = await cartService.applyDiscountCode('WELCOME20');

      // Assert - State updates propagate correctly
      expect(discountApplied).toBe(true);
      expect(cartService.state.appliedDiscounts).toHaveLength(1);
      expect(cartService.state.discountAmount).toBe(20);
      expect(cartService.state.totalPrice).toBeLessThan(cartService.state.subtotal);
    });

    it('should handle search and filter operations', () => {
      // Act - Search for products
      productService.searchProducts('laptop');
      const searchResults = productService.filteredProducts;

      // Assert - Filtered results should match search
      expect(searchResults.length).toBeGreaterThan(0);
      searchResults.forEach(product => {
        expect(
          product.name.toLowerCase().includes('laptop') ||
          product.description.toLowerCase().includes('laptop') ||
          product.tags.some(tag => tag.toLowerCase().includes('laptop'))
        ).toBe(true);
      });

      // Act - Apply category filter
      productService.setFilter({ category: 'Electronics' });
      const categoryResults = productService.filteredProducts;

      // Assert - Should filter by both search and category
      categoryResults.forEach(product => {
        expect(product.category).toBe('Electronics');
      });
    });
  });

  describe('Container Lifecycle', () => {
    it('should maintain singleton services across resolutions', () => {
      // Act - Resolve same service multiple times
      const productService1 = container.resolve<ProductServiceInterface>('ProductServiceInterface');
      const productService2 = container.resolve<ProductServiceInterface>('ProductServiceInterface');

      // Assert - Should be same instance (singleton pattern)
      expect(productService1).toBe(productService2);
    });

    it('should provide access to all registered services', () => {
      // Act - Get all service registrations
      const serviceTypes = [
        'ProductServiceInterface',
        'CartServiceInterface', 
        'UserServiceInterface',
        'InventoryServiceInterface',
        'ProductRepositoryInterface',
        'UserRepositoryInterface'
      ];

      // Assert - All services should be resolvable
      serviceTypes.forEach(serviceType => {
        expect(() => container.resolve(serviceType)).not.toThrow();
      });
    });
  });
});