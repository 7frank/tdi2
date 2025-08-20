import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductList } from '../../components/ProductList';
import { ProductServiceInterface } from '../../services/ProductService';
import { CartServiceInterface } from '../../services/CartService';
import { Product } from '../../types/Product';

// Mock product data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones',
    price: 79.99,
    category: 'Electronics',
    imageUrl: '/headphones.jpg',
    tags: ['audio', 'wireless'],
    stockQuantity: 5
  },
  {
    id: '2',
    name: 'Smart Watch',
    description: 'Feature-rich smart watch',
    price: 199.99,
    category: 'Electronics',
    imageUrl: '/watch.jpg',
    tags: ['wearable', 'smart'],
    stockQuantity: 0 // Out of stock
  }
];

// Component Behavior Tests with Service Mocks
// Test how components interact with services without full DI container
describe('ProductList - Component Behavior Tests', () => {
  let mockProductService: ProductServiceInterface;
  let mockCartService: CartServiceInterface;

  beforeEach(() => {
    // Mock service interfaces - focus on component behavior
    mockProductService = {
      state: {
        products: mockProducts,
        currentProduct: null,
        searchQuery: '',
        filters: { category: '', priceRange: { min: 0, max: 1000 }, tags: [] },
        loading: false,
        error: null
      },
      loadProducts: vi.fn(),
      loadProduct: vi.fn(),
      searchProducts: vi.fn(),
      setFilter: vi.fn(),
      clearFilters: vi.fn(),
      filteredProducts: mockProducts,
      categories: ['Electronics'],
      allTags: ['audio', 'wireless', 'wearable', 'smart']
    };

    mockCartService = {
      state: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        subtotal: 0,
        discountAmount: 0,
        shippingCost: 5.99,
        appliedDiscounts: []
      },
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      applyDiscountCode: vi.fn(),
      removeDiscount: vi.fn()
    };
  });

  it('should render product list with service data', () => {
    // Act
    render(
      <ProductList 
        services={{ 
          productService: mockProductService, 
          cartService: mockCartService 
        }} 
      />
    );

    // Assert - Component displays service state correctly
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
    expect(screen.getByText('$79.99')).toBeInTheDocument();
    expect(screen.getByText('$199.99')).toBeInTheDocument();
  });

  it('should show loading state when service is loading', () => {
    // Arrange - Service in loading state
    mockProductService.state.loading = true;

    // Act
    render(
      <ProductList 
        services={{ 
          productService: mockProductService, 
          cartService: mockCartService 
        }} 
      />
    );

    // Assert
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('should display error from service', () => {
    // Arrange - Service in error state
    mockProductService.state.error = 'Failed to load products';

    // Act
    render(
      <ProductList 
        services={{ 
          productService: mockProductService, 
          cartService: mockCartService 
        }} 
      />
    );

    // Assert
    expect(screen.getByText('Failed to load products')).toBeInTheDocument();
  });

  it('should disable add to cart button for out of stock items', () => {
    // Act
    render(
      <ProductList 
        services={{ 
          productService: mockProductService, 
          cartService: mockCartService 
        }} 
      />
    );

    // Assert - Check stock-based UI behavior
    const addToCartButtons = screen.getAllByRole('button');
    const outOfStockButton = addToCartButtons.find(btn => 
      btn.textContent === 'Out of Stock'
    );
    expect(outOfStockButton).toBeDisabled();
  });

  it('should call cart service when add to cart clicked', async () => {
    // Arrange
    vi.mocked(mockCartService.addItem).mockResolvedValue(undefined);

    render(
      <ProductList 
        services={{ 
          productService: mockProductService, 
          cartService: mockCartService 
        }} 
      />
    );

    // Act - Click add to cart for first product
    const addToCartButtons = screen.getAllByText('Add to Cart');
    fireEvent.click(addToCartButtons[0]);

    // Assert - Service method called with correct product
    expect(mockCartService.addItem).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('should show no products message when filtered list is empty', () => {
    // Arrange - Service returns empty filtered results
    mockProductService.filteredProducts = [];

    // Act
    render(
      <ProductList 
        services={{ 
          productService: mockProductService, 
          cartService: mockCartService 
        }} 
      />
    );

    // Assert
    expect(screen.getByText('No products match your search criteria')).toBeInTheDocument();
  });

  describe('error handling', () => {
    it('should show alert when cart service throws error', async () => {
      // Arrange
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const cartError = new Error('Insufficient stock');
      vi.mocked(mockCartService.addItem).mockRejectedValue(cartError);

      render(
        <ProductList 
          services={{ 
            productService: mockProductService, 
            cartService: mockCartService 
          }} 
        />
      );

      // Act
      const addToCartButtons = screen.getAllByText('Add to Cart');
      fireEvent.click(addToCartButtons[0]);

      // Wait for async error handling
      await vi.waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Could not add Wireless Headphones to cart: Insufficient stock'
        );
      });

      mockAlert.mockRestore();
    });
  });
});