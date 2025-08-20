import { Service, Inject } from '@tdi2/di-core';
import { Product } from '../types/Product';
import { CartItem, Discount } from '../types/Cart';
import { InventoryServiceInterface } from './InventoryService';

export class InsufficientStockError extends Error {
  constructor(productId: string, requestedQuantity: number) {
    super(`Insufficient stock for product ${productId}. Requested: ${requestedQuantity}`);
    this.name = 'InsufficientStockError';
  }
}

export interface CartServiceInterface {
  state: {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    appliedDiscounts: Discount[];
  };
  addItem(product: Product, quantity?: number): Promise<void>;
  removeItem(productId: string): void;
  updateQuantity(productId: string, quantity: number): Promise<void>;
  clearCart(): void;
  applyDiscountCode(code: string): Promise<boolean>;
  removeDiscount(discountId: string): void;
}

@Service()
export class CartService implements CartServiceInterface {
  state = {
    items: [] as CartItem[],
    totalItems: 0,
    totalPrice: 0,
    subtotal: 0,
    discountAmount: 0,
    shippingCost: 5.99, // Fixed shipping cost for demo
    appliedDiscounts: [] as Discount[]
  };

  constructor(
    @Inject() private inventoryService: InventoryServiceInterface
  ) {}

  async addItem(product: Product, quantity: number = 1): Promise<void> {
    // Check stock availability
    const isAvailable = await this.inventoryService.isAvailable(product.id, quantity);
    if (!isAvailable) {
      throw new InsufficientStockError(product.id, quantity);
    }

    const existingItem = this.state.items.find(item => item.id === product.id);
    
    if (existingItem) {
      // Check if we can add more of this item
      const newQuantity = existingItem.quantity + quantity;
      const canAdd = await this.inventoryService.isAvailable(product.id, newQuantity);
      
      if (!canAdd) {
        const maxAdditional = await this.getMaxAdditionalQuantity(product.id, existingItem.quantity);
        throw new InsufficientStockError(product.id, quantity);
      }
      
      existingItem.quantity = newQuantity;
    } else {
      const cartItem: CartItem = {
        ...product,
        quantity
      };
      this.state.items.push(cartItem);
    }
    
    this.recalculateTotal();
  }

  removeItem(productId: string): void {
    this.state.items = this.state.items.filter(item => item.id !== productId);
    this.recalculateTotal();
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const item = this.state.items.find(item => item.id === productId);
    if (!item) return;

    // Check stock availability for new quantity
    const isAvailable = await this.inventoryService.isAvailable(productId, quantity);
    if (!isAvailable) {
      const maxAvailable = await this.inventoryService.getStockLevel(productId);
      throw new InsufficientStockError(productId, quantity);
    }

    item.quantity = quantity;
    this.recalculateTotal();
  }

  clearCart(): void {
    this.state.items = [];
    this.state.appliedDiscounts = [];
    this.recalculateTotal();
  }

  async applyDiscountCode(code: string): Promise<boolean> {
    // Simple discount code validation (in real app, this would call a service)
    const discountCodes: Record<string, Discount> = {
      'SAVE10': {
        id: '1',
        code: 'SAVE10',
        amount: 10,
        type: 'percentage',
        minOrderAmount: 50
      },
      'WELCOME20': {
        id: '2',
        code: 'WELCOME20',
        amount: 20,
        type: 'fixed',
        minOrderAmount: 30
      }
    };

    const discount = discountCodes[code.toUpperCase()];
    if (!discount) {
      return false;
    }

    // Check if discount is already applied
    if (this.state.appliedDiscounts.some(d => d.code === discount.code)) {
      return false;
    }

    // Check minimum order amount
    if (discount.minOrderAmount && this.state.subtotal < discount.minOrderAmount) {
      return false;
    }

    this.state.appliedDiscounts.push(discount);
    this.recalculateTotal();
    return true;
  }

  removeDiscount(discountId: string): void {
    this.state.appliedDiscounts = this.state.appliedDiscounts.filter(
      discount => discount.id !== discountId
    );
    this.recalculateTotal();
  }

  private async getMaxAdditionalQuantity(productId: string, currentQuantity: number): Promise<number> {
    const stockLevel = await this.inventoryService.getStockLevel(productId);
    return Math.max(0, stockLevel - currentQuantity);
  }

  private recalculateTotal(): void {
    // Calculate subtotal
    this.state.subtotal = this.state.items.reduce(
      (total, item) => total + (item.price * item.quantity), 0
    );

    // Calculate total items
    this.state.totalItems = this.state.items.reduce(
      (total, item) => total + item.quantity, 0
    );

    // Calculate discount amount
    this.state.discountAmount = this.state.appliedDiscounts.reduce((total, discount) => {
      if (discount.type === 'percentage') {
        return total + (this.state.subtotal * discount.amount / 100);
      } else {
        return total + discount.amount;
      }
    }, 0);

    // Calculate final total
    const discountedSubtotal = Math.max(0, this.state.subtotal - this.state.discountAmount);
    this.state.totalPrice = discountedSubtotal + (this.state.items.length > 0 ? this.state.shippingCost : 0);
  }

  get isEmpty(): boolean {
    return this.state.items.length === 0;
  }

  get itemCount(): number {
    return this.state.totalItems;
  }
}