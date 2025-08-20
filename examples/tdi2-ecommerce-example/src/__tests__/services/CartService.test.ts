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

// DI-focused Service Unit Tests
// Test business logic in isolation without React components
describe('CartService - Service Unit Tests', () => {
  let cartService: CartService;
  let mockInventoryService: InventoryServiceInterface;

  beforeEach(() => {
    // Mock the dependency
    mockInventoryService = {
      isAvailable: vi.fn(),
      reserveStock: vi.fn(),
      releaseStock: vi.fn(),
      getStockLevel: vi.fn()
    };

    // Create service with mocked dependency (DI in tests)
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
    });

    it('should throw InsufficientStockError when stock unavailable', async () => {
      // Arrange
      vi.mocked(mockInventoryService.isAvailable).mockResolvedValue(false);

      // Act & Assert
      await expect(cartService.addItem(mockProduct, 1))
        .rejects.toThrow(InsufficientStockError);
      
      expect(cartService.state.items).toHaveLength(0);
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
      expect(cartService.state.discountAmount).toBe(5.998); // 10% of $59.98
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
  });
});