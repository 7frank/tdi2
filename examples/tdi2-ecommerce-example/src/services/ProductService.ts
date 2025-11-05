import { Service, Inject } from '@tdi2/di-core/decorators';
import { Product, ProductFilter } from '../types/Product';
import { ProductRepositoryInterface } from '../repositories/ProductRepository';

export interface ProductServiceInterface {
  state: {
    products: Product[];
    currentProduct: Product | null;
    searchQuery: string;
    filters: ProductFilter;
    loading: boolean;
    error: string | null;
  };
  loadProducts(): Promise<void>;
  loadProduct(id: string): Promise<void>;
  searchProducts(query: string): void;
  setFilter(filters: Partial<ProductFilter>): void;
  clearFilters(): void;
  filteredProducts: Product[];
}

@Service()
export class ProductService implements ProductServiceInterface {
  state = {
    products: [] as Product[],
    currentProduct: null as Product | null,
    searchQuery: '',
    filters: {
      category: '',
      priceRange: { min: 0, max: 1000 },
      tags: [] as string[]
    },
    loading: false,
    error: null as string | null
  };

  constructor(
    @Inject() private productRepository: ProductRepositoryInterface
  ) {
    // Auto-load products on service initialization
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    
    try {
      const products = await this.productRepository.findAll();
      this.state.products = products;
    } catch (error) {
      this.state.error = 'Failed to load products';
      console.error('Error loading products:', error);
    } finally {
      this.state.loading = false;
    }
  }

  async loadProduct(id: string): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    
    try {
      const product = await this.productRepository.findById(id);
      if (product) {
        this.state.currentProduct = product;
      } else {
        this.state.error = `Product not found: ${id}`;
      }
    } catch (error) {
      this.state.error = `Failed to load product: ${id}`;
      console.error('Error loading product:', error);
    } finally {
      this.state.loading = false;
    }
  }

  searchProducts(query: string): void {
    this.state.searchQuery = query.toLowerCase();
  }

  setFilter(filters: Partial<ProductFilter>): void {
    this.state.filters = { ...this.state.filters, ...filters };
  }

  clearFilters(): void {
    this.state.searchQuery = '';
    this.state.filters = {
      category: '',
      priceRange: { min: 0, max: 1000 },
      tags: []
    };
  }

  get filteredProducts(): Product[] {
    return this.state.products.filter(product => {
      // Search query filter
      const matchesSearch = !this.state.searchQuery || 
        product.name.toLowerCase().includes(this.state.searchQuery) ||
        product.description.toLowerCase().includes(this.state.searchQuery) ||
        product.tags.some(tag => tag.toLowerCase().includes(this.state.searchQuery));
      
      // Category filter
      const matchesCategory = !this.state.filters.category || 
        product.category === this.state.filters.category;
      
      // Price range filter
      const matchesPrice = product.price >= this.state.filters.priceRange.min &&
        product.price <= this.state.filters.priceRange.max;
      
      // Tags filter
      const matchesTags = this.state.filters.tags.length === 0 ||
        this.state.filters.tags.some(tag => product.tags.includes(tag));
      
      return matchesSearch && matchesCategory && matchesPrice && matchesTags;
    });
  }

  get categories(): string[] {
    const categories = new Set(this.state.products.map(p => p.category));
    return Array.from(categories).sort();
  }

  get allTags(): string[] {
    const tags = new Set(this.state.products.flatMap(p => p.tags));
    return Array.from(tags).sort();
  }
}