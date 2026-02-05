import { Service, Inject } from '@tdi2/di-core/decorators';
import { CartServiceInterface } from './CartService';

export interface CheckoutServiceInterface {
  state: {
    isCheckoutOpen: boolean;
    shippingInfo: {
      fullName: string;
      address: string;
      city: string;
      zipCode: string;
      country: string;
    };
    paymentInfo: {
      cardNumber: string;
      cardHolder: string;
      expiryDate: string;
      cvv: string;
    };
    orderStatus: 'idle' | 'processing' | 'success' | 'error';
    errorMessage: string;
  };

  openCheckout(): void;
  closeCheckout(): void;
  updateShippingInfo(field: string, value: string): void;
  updatePaymentInfo(field: string, value: string): void;
  processOrder(): Promise<void>;
  resetCheckout(): void;
}

@Service()
export class CheckoutService implements CheckoutServiceInterface {
  constructor(
    @Inject() private cartService: CartServiceInterface
  ) {}

  state = {
    isCheckoutOpen: false,
    shippingInfo: {
      fullName: '',
      address: '',
      city: '',
      zipCode: '',
      country: '',
    },
    paymentInfo: {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
    },
    orderStatus: 'idle' as 'idle' | 'processing' | 'success' | 'error',
    errorMessage: '',
  };

  openCheckout(): void {
    this.state.isCheckoutOpen = true;
  }

  closeCheckout(): void {
    this.state.isCheckoutOpen = false;
  }

  updateShippingInfo(field: string, value: string): void {
    this.state.shippingInfo[field] = value;
  }

  updatePaymentInfo(field: string, value: string): void {
    this.state.paymentInfo[field] = value;
  }

  async processOrder(): Promise<void> {
    this.state.orderStatus = 'processing';
    this.state.errorMessage = '';

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate
      if (!this.state.shippingInfo.fullName || !this.state.shippingInfo.address) {
        throw new Error('Please fill in all shipping information');
      }

      if (!this.state.paymentInfo.cardNumber || !this.state.paymentInfo.cardHolder) {
        throw new Error('Please fill in all payment information');
      }

      // Success
      this.state.orderStatus = 'success';

      // Clear cart after successful order
      setTimeout(() => {
        this.cartService.clearCart();
        this.resetCheckout();
      }, 2000);

    } catch (error) {
      this.state.orderStatus = 'error';
      this.state.errorMessage = error instanceof Error
        ? error.message
        : 'An error occurred while processing your order';
      console.error('Order processing error:', error);
    }
  }

  resetCheckout(): void {
    this.state.isCheckoutOpen = false;
    this.state.shippingInfo = {
      fullName: '',
      address: '',
      city: '',
      zipCode: '',
      country: '',
    };
    this.state.paymentInfo = {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
    };
    this.state.orderStatus = 'idle';
    this.state.errorMessage = '';
  }
}
