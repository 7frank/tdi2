import { Product } from './Product';

export interface CartItem extends Product {
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  discountAmount: number;
  shippingCost: number;
}

export interface Discount {
  id: string;
  code: string;
  amount: number;
  type: 'percentage' | 'fixed';
  minOrderAmount?: number;
}