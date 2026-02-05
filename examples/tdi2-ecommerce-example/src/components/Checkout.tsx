import type { Inject } from '@tdi2/di-core/markers';
import { CheckoutServiceInterface } from '../services/CheckoutService';
import { CartServiceInterface } from '../services/CartService';

interface CheckoutProps {
  services: {
    checkoutService: Inject<CheckoutServiceInterface>;
    cartService: Inject<CartServiceInterface>;
  };
}

export function Checkout(props: CheckoutProps) {
  const { services: { checkoutService, cartService } } = props;
  const {
    isCheckoutOpen,
    shippingInfo,
    paymentInfo,
    orderStatus,
    errorMessage
  } = checkoutService.state;

  const { totalPrice, items } = cartService.state;

  if (!isCheckoutOpen) {
    return null;
  }

  if (orderStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Successful!</h2>
          <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been confirmed.</p>
          <button
            onClick={() => checkoutService.resetCheckout()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold">Checkout</h2>
            <button
              onClick={() => checkoutService.closeCheckout()}
              className="text-gray-500 hover:text-gray-700"
              disabled={orderStatus === 'processing'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => checkoutService.autoFillTestData()}
            className="text-sm px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 border border-purple-300"
            disabled={orderStatus === 'processing'}
          >
            🎲 Auto-Fill Test Data
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Shipping Information</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={shippingInfo.fullName}
                onChange={(e) => checkoutService.updateShippingInfo('fullName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={orderStatus === 'processing'}
              />
              <input
                type="text"
                placeholder="Address"
                value={shippingInfo.address}
                onChange={(e) => checkoutService.updateShippingInfo('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={orderStatus === 'processing'}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={shippingInfo.city}
                  onChange={(e) => checkoutService.updateShippingInfo('city', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={orderStatus === 'processing'}
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={shippingInfo.zipCode}
                  onChange={(e) => checkoutService.updateShippingInfo('zipCode', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={orderStatus === 'processing'}
                />
              </div>
              <input
                type="text"
                placeholder="Country"
                value={shippingInfo.country}
                onChange={(e) => checkoutService.updateShippingInfo('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={orderStatus === 'processing'}
              />
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Card Number"
                value={paymentInfo.cardNumber}
                onChange={(e) => checkoutService.updatePaymentInfo('cardNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={orderStatus === 'processing'}
              />
              <input
                type="text"
                placeholder="Cardholder Name"
                value={paymentInfo.cardHolder}
                onChange={(e) => checkoutService.updatePaymentInfo('cardHolder', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={orderStatus === 'processing'}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={paymentInfo.expiryDate}
                  onChange={(e) => checkoutService.updatePaymentInfo('expiryDate', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={orderStatus === 'processing'}
                />
                <input
                  type="text"
                  placeholder="CVV"
                  value={paymentInfo.cvv}
                  onChange={(e) => checkoutService.updatePaymentInfo('cvv', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={orderStatus === 'processing'}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={() => checkoutService.closeCheckout()}
            disabled={orderStatus === 'processing'}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => checkoutService.processOrder()}
            disabled={orderStatus === 'processing'}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center"
          >
            {orderStatus === 'processing' ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
