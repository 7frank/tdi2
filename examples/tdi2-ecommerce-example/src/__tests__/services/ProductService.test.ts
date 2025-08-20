import { describe, it, expect, beforeEach, vi } from 'vitest';
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

// Service Unit Tests - Focus on business logic
describe('ProductService - Business Logic Tests', () => {
  let productService: ProductService;
  let mockProductRepository: ProductRepositoryInterface;

  beforeEach(() => {
    // Mock repository dependency
    mockProductRepository = {
      findAll: vi.fn().mockResolvedValue(mockProducts),
      findById: vi.fn().mockImplementation((id: string) => 
        Promise.resolve(mockProducts.find(p => p.id === id) || null)
      ),
      findByCategory: vi.fn(),
      search: vi.fn()
    };

    // Create service with injected mock
    productService = new ProductService(mockProductRepository);
  });

  describe('product loading', () => {
    it('should load products from repository', async () => {
      // Act
      await productService.loadProducts();

      // Assert - Service state updated correctly
      expect(productService.state.products).toEqual(mockProducts);
      expect(productService.state.loading).toBe(false);
      expect(productService.state.error).toBeNull();
      expect(mockProductRepository.findAll).toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const error = new Error('Repository error');
      vi.mocked(mockProductRepository.findAll).mockRejectedValue(error);

      // Act
      await productService.loadProducts();

      // Assert
      expect(productService.state.error).toBe('Failed to load products');
      expect(productService.state.loading).toBe(false);
      expect(productService.state.products).toEqual([]);
    });

    it('should load single product by ID', async () => {
      // Act
      await productService.loadProduct('1');

      // Assert
      expect(productService.state.currentProduct).toEqual(mockProducts[0]);
      expect(mockProductRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('search and filtering', () => {
    beforeEach(async () => {
      // Load products first
      await productService.loadProducts();
    });

    it('should filter products by search query', () => {
      // Act
      productService.searchProducts('laptop');

      // Assert
      const results = productService.filteredProducts;
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Gaming Laptop');
    });

    it('should filter by category', () => {
      // Act
      productService.setFilter({ category: 'Electronics' });

      // Assert
      const results = productService.filteredProducts;
      expect(results).toHaveLength(2);
      results.forEach(product => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('should filter by price range', () => {
      // Act
      productService.setFilter({ priceRange: { min: 0, max: 50 } });

      // Assert
      const results = productService.filteredProducts;
      expect(results).toHaveLength(2);
      results.forEach(product => {
        expect(product.price).toBeLessThanOrEqual(50);
      });
    });

    it('should filter by tags', () => {
      // Act
      productService.setFilter({ tags: ['gaming'] });

      // Assert
      const results = productService.filteredProducts;
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('gaming');
    });

    it('should combine multiple filters', () => {
      // Act - Search + category + price filter
      productService.searchProducts('mouse');
      productService.setFilter({ 
        category: 'Electronics',
        priceRange: { min: 0, max: 100 }
      });

      // Assert
      const results = productService.filteredProducts;
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Wireless Mouse');
    });

    it('should clear all filters', () => {
      // Arrange - Set various filters
      productService.searchProducts('laptop');
      productService.setFilter({ category: 'Electronics' });

      // Act
      productService.clearFilters();

      // Assert
      expect(productService.state.searchQuery).toBe('');
      expect(productService.state.filters.category).toBe('');
      expect(productService.filteredProducts).toEqual(mockProducts);
    });
  });

  describe('computed properties', () => {
    beforeEach(async () => {
      await productService.loadProducts();
    });

    it('should return unique categories', () => {
      // Act
      const categories = productService.categories;

      // Assert
      expect(categories).toEqual(['Electronics', 'Home']);
      expect(categories).toHaveLength(2);
    });

    it('should return all unique tags', () => {
      // Act
      const tags = productService.allTags;

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
      vi.mocked(mockProductRepository.findAll).mockReturnValue(slowPromise);

      // Act - Start loading
      const loadPromise = productService.loadProducts();
      
      // Assert - Should be loading
      expect(productService.state.loading).toBe(true);
      expect(productService.state.error).toBeNull();

      // Complete the async operation
      resolvePromise!(mockProducts);
      await loadPromise;

      // Assert - Loading complete
      expect(productService.state.loading).toBe(false);
    });
  });
});