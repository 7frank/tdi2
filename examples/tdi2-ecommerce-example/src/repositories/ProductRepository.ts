import { Product } from '../types/Product';
import { Service } from '@tdi2/di-core';
import productsData from '../data/products.json';

export interface ProductRepositoryInterface {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByCategory(category: string): Promise<Product[]>;
  updateStock(id: string, quantity: number): Promise<void>;
}

@Service()
export class ProductRepository implements ProductRepositoryInterface {
  private products: Product[] = productsData as Product[];

  async findAll(): Promise<Product[]> {
    // Simulate async API call
    await this.delay(300);
    return [...this.products];
  }

  async findById(id: string): Promise<Product | null> {
    await this.delay(100);
    return this.products.find(product => product.id === id) || null;
  }

  async findByCategory(category: string): Promise<Product[]> {
    await this.delay(200);
    return this.products.filter(product => product.category === category);
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await this.delay(100);
    const product = this.products.find(p => p.id === id);
    if (product) {
      product.stockQuantity = Math.max(0, product.stockQuantity - quantity);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}