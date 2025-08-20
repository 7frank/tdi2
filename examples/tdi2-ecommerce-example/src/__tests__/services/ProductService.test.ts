import { describe, it, expect, beforeEach } from 'vitest';
import { 
  MockBean, 
  TestContext, 
  createTestInstance,
  verify,
  verifyNoInteractions
} from '@tdi2/di-testing';
import type { MockedService } from '@tdi2/di-testing';
import { ProductService } from '../../services/ProductService';
import { ProductRepositoryInterface } from '../../repositories/ProductRepository';
import { Product } from '../../types/Product';

// Mock product data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptop',
    price: 1299.99,
    category: 'Electronics',
    imageUrl: '/laptop.jpg',
    tags: ['gaming', 'laptop', 'performance'],
    stockQuantity: 3
  },
  {
    id: '2',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    price: 29.99,
    category: 'Electronics',
    imageUrl: '/mouse.jpg',
    tags: ['wireless', 'peripheral'],
    stockQuantity: 15
  },
  {
    id: '3',
    name: 'Coffee Mug',
    description: 'Ceramic coffee mug',
    price: 12.99,
    category: 'Home',
    imageUrl: '/mug.jpg',
    tags: ['kitchen', 'ceramic'],
    stockQuantity: 25
  }
];

// Service Unit Tests - Focus on business logic using TDI2 Testing Framework
describe('ProductService - Business Logic Tests', () => {

  @TestContext({ isolateTest: true, autoReset: true })
  class ProductServiceTests {
    @MockBean()
    productRepository!: MockedService<ProductRepositoryInterface>;

    // Business service under test
    productService!: ProductService;

    setup() {
      // Mock the constructor call to prevent auto-loading
      this.productRepository.__mock__
        .when('findAll').thenReturn(Promise.resolve([]));
        
      this.productService = new ProductService(this.productRepository as any);
    }
  }

  let testInstance: ProductServiceTests & { __testContext: any };

  beforeEach(() => {
    testInstance = createTestInstance(ProductServiceTests);
    testInstance.setup();
  });

  describe('product loading', () => {
    it('should load products from repository', async () => {
      // Arrange
      testInstance.productRepository.__mock__
        .when('findAll').thenReturn(Promise.resolve(mockProducts));

      // Act
      await testInstance.productService.loadProducts();

      // Assert - Service state updated correctly
      expect(testInstance.productService.state.products).toEqual(mockProducts);
      expect(testInstance.productService.state.loading).toBe(false);
      expect(testInstance.productService.state.error).toBeNull();
      
      // Verify repository interaction
      verify(testInstance.productRepository, 'findAll').times(2); // Constructor + explicit call
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const error = new Error('Repository error');
      testInstance.productRepository.__mock__
        .when('findAll').thenThrow(error);

      // Act
      await testInstance.productService.loadProducts();

      // Assert
      expect(testInstance.productService.state.error).toBe('Failed to load products');
      expect(testInstance.productService.state.loading).toBe(false);
      expect(testInstance.productService.state.products).toEqual([]);
      
      // Verify repository was called
      verify(testInstance.productRepository, 'findAll').atLeastOnce();
    });

    it('should load single product by ID', async () => {
      // Arrange
      const targetProduct = mockProducts[0];
      testInstance.productRepository.__mock__
        .when('findById').thenReturn(Promise.resolve(targetProduct));

      // Act
      await testInstance.productService.loadProduct('1');

      // Assert
      expect(testInstance.productService.state.currentProduct).toEqual(targetProduct);
      
      // Verify repository interaction
      verify(testInstance.productRepository, 'findById')
        .withArgs('1');
    });
  });

  describe('search and filtering', () => {
    beforeEach(async () => {
      // Load products first
      testInstance.productRepository.__mock__
        .when('findAll').thenReturn(Promise.resolve(mockProducts));
      await testInstance.productService.loadProducts();
    });

    it('should filter products by search query', () => {
      // Act
      testInstance.productService.searchProducts('laptop');

      // Assert
      const results = testInstance.productService.filteredProducts;
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Gaming Laptop');
      
      // Verify state was updated
      expect(testInstance.productService.state.searchQuery).toBe('laptop');
    });

    it('should filter by category', () => {
      // Act
      testInstance.productService.setFilter({ category: 'Electronics' });

      // Assert
      const results = testInstance.productService.filteredProducts;
      expect(results).toHaveLength(2);
      results.forEach(product => {
        expect(product.category).toBe('Electronics');
      });
      
      // Verify state was updated
      expect(testInstance.productService.state.filters.category).toBe('Electronics');
    });

    it('should filter by price range', () => {
      // Act
      testInstance.productService.setFilter({ priceRange: { min: 0, max: 50 } });

      // Assert
      const results = testInstance.productService.filteredProducts;
      expect(results).toHaveLength(2);
      results.forEach(product => {
        expect(product.price).toBeLessThanOrEqual(50);
      });
    });

    it('should filter by tags', () => {
      // Act
      testInstance.productService.setFilter({ tags: ['gaming'] });

      // Assert
      const results = testInstance.productService.filteredProducts;
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('gaming');
    });

    it('should combine multiple filters', () => {
      // Act - Search + category + price filter
      testInstance.productService.searchProducts('mouse');
      testInstance.productService.setFilter({ 
        category: 'Electronics',
        priceRange: { min: 0, max: 100 }
      });

      // Assert
      const results = testInstance.productService.filteredProducts;
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Wireless Mouse');
    });

    it('should clear all filters', () => {
      // Arrange - Set various filters
      testInstance.productService.searchProducts('laptop');
      testInstance.productService.setFilter({ category: 'Electronics' });

      // Act
      testInstance.productService.clearFilters();

      // Assert
      expect(testInstance.productService.state.searchQuery).toBe('');
      expect(testInstance.productService.state.filters.category).toBe('');
      expect(testInstance.productService.filteredProducts).toEqual(mockProducts);
    });
  });

  describe('computed properties', () => {
    beforeEach(async () => {
      testInstance.productRepository.__mock__
        .when('findAll').thenReturn(Promise.resolve(mockProducts));
      await testInstance.productService.loadProducts();
    });

    it('should return unique categories', () => {
      // Act
      const categories = testInstance.productService.categories;

      // Assert
      expect(categories).toEqual(['Electronics', 'Home']);
      expect(categories).toHaveLength(2);
    });

    it('should return all unique tags', () => {
      // Act
      const tags = testInstance.productService.allTags;

      // Assert
      expect(tags).toContain('gaming');
      expect(tags).toContain('laptop');
      expect(tags).toContain('wireless');
      expect(tags).toContain('kitchen');
      expect(tags).toHaveLength(6); // All unique tags
    });
  });

  describe('reactive state management', () => {
    it('should maintain loading state during async operations', async () => {
      // Arrange - Slow repository response
      let resolvePromise: (value: Product[]) => void;
      const slowPromise = new Promise<Product[]>((resolve) => {
        resolvePromise = resolve;
      });
      testInstance.productRepository.__mock__
        .when('findAll').thenReturn(slowPromise);

      // Act - Start loading
      const loadPromise = testInstance.productService.loadProducts();
      
      // Assert - Should be loading
      expect(testInstance.productService.state.loading).toBe(true);
      expect(testInstance.productService.state.error).toBeNull();

      // Complete the async operation
      resolvePromise!(mockProducts);
      await loadPromise;

      // Assert - Loading complete
      expect(testInstance.productService.state.loading).toBe(false);
    });

    it('should handle concurrent loading requests', async () => {
      // Arrange
      testInstance.productRepository.__mock__
        .when('findAll').thenReturn(Promise.resolve(mockProducts));

      // Act - Start multiple concurrent loads
      const load1 = testInstance.productService.loadProducts();
      const load2 = testInstance.productService.loadProducts();
      
      await Promise.all([load1, load2]);

      // Assert - State should be consistent
      expect(testInstance.productService.state.products).toEqual(mockProducts);
      expect(testInstance.productService.state.loading).toBe(false);
      
      // Verify repository called multiple times
      verify(testInstance.productRepository, 'findAll').atLeastOnce();
    });
  });
});