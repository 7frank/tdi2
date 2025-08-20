import { describe, it, expect, beforeEach, vi } from 'vitest';
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

// DI-focused Service Unit Tests using Vitest Mocks
// Test business logic in isolation without React components
describe('CartService - Service Unit Tests', () => {
  let cartService: CartService;
  let mockInventoryService: InventoryServiceInterface;

  beforeEach(() => {
    // Create mock inventory service
    mockInventoryService = {
      isAvailable: vi.fn(),
      getStockLevel: vi.fn(),
      reserveStock: vi.fn(),
      releaseStock: vi.fn(),
      updateStock: vi.fn()
    } as InventoryServiceInterface;

    // Create service under test with mocked dependencies
    cartService = new CartService(mockInventoryService);
  });

  describe('addItem', () => {
    it('should add item to cart when stock is available', async () => {
      // Arrange
      vi.mocked(mockInventoryService.isAvailable).mockResolvedValue(true);

      // Act
      await cartService.addItem(mockProduct, 2);

      // Assert - Test reactive state updates
      expect(cartService.state.items).toHaveLength(1);
      expect(cartService.state.items[0].quantity).toBe(2);
      expect(cartService.state.totalItems).toBe(2);
      expect(cartService.state.subtotal).toBe(59.98);
      
      // Verify service interactions
      expect(mockInventoryService.isAvailable).toHaveBeenCalledWith('1', 2);
    });

    it('should throw InsufficientStockError when stock unavailable', async () => {
      // Arrange
      vi.mocked(mockInventoryService.isAvailable).mockResolvedValue(false);

      // Act & Assert
      await expect(cartService.addItem(mockProduct, 1))
        .rejects.toThrow(InsufficientStockError);
      
      expect(cartService.state.items).toHaveLength(0);
      
      // Verify service interaction
      expect(mockInventoryService.isAvailable).toHaveBeenCalledWith('1', 1);
    });

    it('should update quantity for existing items', async () => {
      // Arrange
      vi.mocked(mockInventoryService.isAvailable).mockResolvedValue(true);
      
      await cartService.addItem(mockProduct, 1);

      // Act
      await cartService.addItem(mockProduct, 2);

      // Assert
      expect(cartService.state.items).toHaveLength(1);
      expect(cartService.state.items[0].quantity).toBe(3);
      
      // Verify multiple service calls (3 total: beforeEach setup + 2 explicit calls)
      expect(mockInventoryService.isAvailable).toHaveBeenCalledTimes(3);
    });
  });

  describe('discount system', () => {
    beforeEach(async () => {
      vi.mocked(mockInventoryService.isAvailable).mockResolvedValue(true);
      await cartService.addItem(mockProduct, 2); // $59.98 subtotal
    });

    it('should apply percentage discount when requirements met', async () => {
      // Act
      const result = await cartService.applyDiscountCode('SAVE10');

      // Assert
      expect(result).toBe(true);
      expect(cartService.state.appliedDiscounts).toHaveLength(1);
      expect(cartService.state.discountAmount).toBeCloseTo(5.998, 2); // 10% of $59.98
    });

    it('should reject discount when minimum not met', async () => {
      // Arrange - Clear cart and add smaller amount
      cartService.clearCart();
      await cartService.addItem(mockProduct, 1); // $29.99 < $50 minimum

      // Act
      const result = await cartService.applyDiscountCode('SAVE10');

      // Assert
      expect(result).toBe(false);
      expect(cartService.state.appliedDiscounts).toHaveLength(0);
    });
  });

  describe('service-to-service interaction', () => {
    it('should call inventory service for stock checks', async () => {
      // Arrange
      vi.mocked(mockInventoryService.isAvailable).mockResolvedValue(true);

      // Act
      await cartService.addItem(mockProduct, 3);

      // Assert - Verify DI dependency was called correctly
      expect(mockInventoryService.isAvailable).toHaveBeenCalledWith('1', 3);
    });

    it('should handle inventory service failures', async () => {
      // Arrange
      vi.mocked(mockInventoryService.isAvailable).mockRejectedValue(new Error('Inventory service down'));

      // Act & Assert
      await expect(cartService.addItem(mockProduct, 1))
        .rejects.toThrow('Inventory service down');
        
      // Verify service was called despite failure
      expect(mockInventoryService.isAvailable).toHaveBeenCalledTimes(1);
      
      // Verify cart state remains unchanged
      expect(cartService.state.items).toHaveLength(0);
    });
  });

  describe('reactive state management', () => {
    it('should update computed properties when cart changes', async () => {
      // Arrange
      vi.mocked(mockInventoryService.isAvailable).mockResolvedValue(true);

      // Act
      await cartService.addItem(mockProduct, 2);

      // Assert - Verify reactive computed properties
      expect(cartService.state.totalItems).toBe(2);
      expect(cartService.state.subtotal).toBe(59.98);
      expect(cartService.state.totalPrice).toBe(65.97); // subtotal + shipping
    });
  });
});