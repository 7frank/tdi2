import { Service, Inject } from '@tdi2/di-core';
import { ProductRepositoryInterface } from '../repositories/ProductRepository';

export interface InventoryServiceInterface {
  isAvailable(productId: string, quantity: number): Promise<boolean>;
  reserveStock(productId: string, quantity: number): Promise<boolean>;
  releaseStock(productId: string, quantity: number): Promise<void>;
  getStockLevel(productId: string): Promise<number>;
}

@Service()
export class InventoryService implements InventoryServiceInterface {
  private reservedStock = new Map<string, number>();

  constructor(
    @Inject() private productRepository: ProductRepositoryInterface
  ) {}

  async isAvailable(productId: string, quantity: number): Promise<boolean> {
    const product = await this.productRepository.findById(productId);
    if (!product) return false;

    const reserved = this.reservedStock.get(productId) || 0;
    const availableStock = product.stockQuantity - reserved;
    
    return availableStock >= quantity;
  }

  async reserveStock(productId: string, quantity: number): Promise<boolean> {
    const available = await this.isAvailable(productId, quantity);
    
    if (available) {
      const currentReserved = this.reservedStock.get(productId) || 0;
      this.reservedStock.set(productId, currentReserved + quantity);
      return true;
    }
    
    return false;
  }

  async releaseStock(productId: string, quantity: number): Promise<void> {
    const currentReserved = this.reservedStock.get(productId) || 0;
    const newReserved = Math.max(0, currentReserved - quantity);
    
    if (newReserved === 0) {
      this.reservedStock.delete(productId);
    } else {
      this.reservedStock.set(productId, newReserved);
    }
  }

  async getStockLevel(productId: string): Promise<number> {
    const product = await this.productRepository.findById(productId);
    if (!product) return 0;

    const reserved = this.reservedStock.get(productId) || 0;
    return Math.max(0, product.stockQuantity - reserved);
  }
}