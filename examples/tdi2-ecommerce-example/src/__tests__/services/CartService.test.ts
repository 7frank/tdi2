import { describe, it, expect, beforeEach } from 'vitest';
import { 
  MockBean, 
  TestContext, 
  createTestInstance,
  verify,
  verifyNoInteractions
} from '@tdi2/di-testing';
import type { MockedService } from '@tdi2/di-testing';
import { CartService, InsufficientStockError } from '../../services/CartService';
import { InventoryServiceInterface } from '../../services/InventoryService';
import { Product } from '../../types/Product';

// Mock product data
const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'A test product',
  price: 29.99,
  category: 'Electronics',
  imageUrl: '/test.jpg',
  tags: ['test'],
  stockQuantity: 10
};

// DI-focused Service Unit Tests using TDI2 Testing Framework
// Test business logic in isolation without React components
describe('CartService - Service Unit Tests', () => {

  @TestContext({ isolateTest: true, autoReset: true })
  class CartServiceTests {
    @MockBean()
    inventoryService!: MockedService<InventoryServiceInterface>;

    // Business service under test
    cartService!: CartService;

    setup() {
      // This would normally be injected by the DI container
      this.cartService = new CartService(this.inventoryService as any);
    }
  }

  let testInstance: CartServiceTests & { __testContext: any };

  beforeEach(() => {
    testInstance = createTestInstance(CartServiceTests);
    testInstance.setup();
  });

  describe('addItem', () => {
    it('should add item to cart when stock is available', async () => {
      // Arrange
      testInstance.inventoryService.__mock__
        .when('isAvailable').thenReturn(Promise.resolve(true));

      // Act
      await testInstance.cartService.addItem(mockProduct, 2);

      // Assert - Test reactive state updates
      expect(testInstance.cartService.state.items).toHaveLength(1);
      expect(testInstance.cartService.state.items[0].quantity).toBe(2);
      expect(testInstance.cartService.state.totalItems).toBe(2);
      expect(testInstance.cartService.state.subtotal).toBe(59.98);
      
      // Verify service interactions
      verify(testInstance.inventoryService, 'isAvailable')
        .withArgs('1', 2);
    });

    it('should throw InsufficientStockError when stock unavailable', async () => {
      // Arrange
      testInstance.inventoryService.__mock__
        .when('isAvailable').thenReturn(Promise.resolve(false));

      // Act & Assert
      await expect(testInstance.cartService.addItem(mockProduct, 1))
        .rejects.toThrow(InsufficientStockError);
      
      expect(testInstance.cartService.state.items).toHaveLength(0);
      
      // Verify service interaction
      verify(testInstance.inventoryService, 'isAvailable')
        .withArgs('1', 1);
    });

    it('should update quantity for existing items', async () => {
      // Arrange
      testInstance.inventoryService.__mock__
        .when('isAvailable').thenReturn(Promise.resolve(true));
      
      await testInstance.cartService.addItem(mockProduct, 1);

      // Act
      await testInstance.cartService.addItem(mockProduct, 2);

      // Assert
      expect(testInstance.cartService.state.items).toHaveLength(1);
      expect(testInstance.cartService.state.items[0].quantity).toBe(3);
      
      // Verify multiple service calls
      verify(testInstance.inventoryService, 'isAvailable').times(2);
    });
  });

  describe('discount system', () => {
    beforeEach(async () => {
      testInstance.inventoryService.__mock__
        .when('isAvailable').thenReturn(Promise.resolve(true));
      await testInstance.cartService.addItem(mockProduct, 2); // $59.98 subtotal
    });

    it('should apply percentage discount when requirements met', async () => {
      // Act
      const result = await testInstance.cartService.applyDiscountCode('SAVE10');

      // Assert
      expect(result).toBe(true);
      expect(testInstance.cartService.state.appliedDiscounts).toHaveLength(1);
      expect(testInstance.cartService.state.discountAmount).toBe(5.998); // 10% of $59.98
    });

    it('should reject discount when minimum not met', async () => {
      // Arrange - Clear cart and add smaller amount
      testInstance.cartService.clearCart();
      await testInstance.cartService.addItem(mockProduct, 1); // $29.99 < $50 minimum

      // Act
      const result = await testInstance.cartService.applyDiscountCode('SAVE10');

      // Assert
      expect(result).toBe(false);
      expect(testInstance.cartService.state.appliedDiscounts).toHaveLength(0);
    });
  });

  describe('service-to-service interaction', () => {
    it('should call inventory service for stock checks', async () => {
      // Arrange
      testInstance.inventoryService.__mock__
        .when('isAvailable').thenReturn(Promise.resolve(true));

      // Act
      await testInstance.cartService.addItem(mockProduct, 3);

      // Assert - Verify DI dependency was called correctly
      verify(testInstance.inventoryService, 'isAvailable')
        .withArgs('1', 3);
    });

    it('should handle inventory service failures', async () => {
      // Arrange
      testInstance.inventoryService.__mock__
        .when('isAvailable').thenThrow(new Error('Inventory service down'));

      // Act & Assert
      await expect(testInstance.cartService.addItem(mockProduct, 1))
        .rejects.toThrow('Inventory service down');
        
      // Verify service was called despite failure
      verify(testInstance.inventoryService, 'isAvailable').once();
      
      // Verify cart state remains unchanged
      expect(testInstance.cartService.state.items).toHaveLength(0);
    });
  });

  describe('reactive state management', () => {
    it('should update computed properties when cart changes', async () => {
      // Arrange
      testInstance.inventoryService.__mock__
        .when('isAvailable').thenReturn(Promise.resolve(true));

      // Act
      await testInstance.cartService.addItem(mockProduct, 2);

      // Assert - Verify reactive computed properties
      expect(testInstance.cartService.state.totalItems).toBe(2);
      expect(testInstance.cartService.state.subtotal).toBe(59.98);
      expect(testInstance.cartService.state.totalPrice).toBe(65.97); // subtotal + shipping
    });
  });
});