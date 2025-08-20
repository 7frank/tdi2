import { useState } from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import { CartServiceInterface } from '../services/CartService';
import { CartItem } from '../types/Cart';

interface ShoppingCartProps {
  services: {
    cartService: Inject<CartServiceInterface>;
  };
}

export function ShoppingCart(props: ShoppingCartProps) {
  const { services: { cartService } } = props;
  const { 
    items, 
    totalItems, 
    totalPrice, 
    subtotal, 
    discountAmount, 
    shippingCost, 
    appliedDiscounts 
  } = cartService.state;

  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState('');

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      await cartService.updateQuantity(productId, quantity);
    } catch (error) {
      alert(`Could not update quantity: ${error.message}`);
    }
  };

  const handleApplyDiscount = async () => {
    setDiscountError('');
    const success = await cartService.applyDiscountCode(discountCode);
    
    if (success) {
      setDiscountCode('');
    } else {
      setDiscountError('Invalid discount code or requirements not met');
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-lg">Your cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Cart Header */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold">Shopping Cart ({totalItems} items)</h2>
      </div>

      {/* Cart Items */}
      <div className="divide-y">
        {items.map(item => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={() => cartService.removeItem(item.id)}
          />
        ))}
      </div>

      {/* Discount Section */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Enter discount code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleApplyDiscount}
            disabled={!discountCode.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            Apply
          </button>
        </div>
        {discountError && (
          <p className="text-red-600 text-sm">{discountError}</p>
        )}
        
        {appliedDiscounts.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-green-700 mb-2">Applied Discounts:</p>
            {appliedDiscounts.map(discount => (
              <div key={discount.id} className="flex items-center justify-between text-sm">
                <span className="text-green-600">
                  {discount.code} - {discount.type === 'percentage' ? `${discount.amount}%` : `$${discount.amount}`} off
                </span>
                <button
                  onClick={() => cartService.removeDiscount(discount.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      <div className="px-6 py-4 border-t">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-semibold border-t pt-2">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <button className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: () => void;
}

function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  return (
    <div className="px-6 py-4 flex items-center space-x-4">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="w-16 h-16 object-cover rounded"
      />
      
      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-gray-600">${item.price.toFixed(2)} each</p>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          -
        </button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100"
        >
          +
        </button>
      </div>

      <div className="text-right min-w-[80px]">
        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
      </div>

      <button
        onClick={onRemove}
        className="text-red-600 hover:text-red-800 p-1"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}