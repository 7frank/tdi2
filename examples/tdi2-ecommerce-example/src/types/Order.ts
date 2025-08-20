import { CartItem } from './Cart';
import { Address } from './User';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export interface PaymentMethod {
  type: 'credit_card' | 'paypal' | 'bank_transfer';
  last4?: string; // for credit cards
  email?: string; // for paypal
}