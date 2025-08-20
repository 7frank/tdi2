import type { Inject } from '@tdi2/di-core/markers';
import { CartServiceInterface } from '../services/CartService';
import { UserServiceInterface } from '../services/UserService';

interface HeaderProps {
  services: {
    cartService: Inject<CartServiceInterface>;
    userService: Inject<UserServiceInterface>;
  };
  onNavigate: (view: 'products' | 'cart' | 'profile') => void;
  currentView: string;
}

export function Header(props: HeaderProps) {
  const { services: { cartService, userService }, onNavigate, currentView } = props;
  const { totalItems } = cartService.state;
  const { isAuthenticated, currentUser } = userService.state;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">TDI2 Store</h1>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Zero Props Demo
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <button
              onClick={() => onNavigate('products')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'products'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Products
            </button>

            {/* Cart Button */}
            <button
              onClick={() => onNavigate('cart')}
              className={`relative flex items-center text-sm font-medium transition-colors ${
                currentView === 'cart'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Section */}
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center text-sm font-medium transition-colors ${
                currentView === 'profile'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 00-8 0v4m-4 9h16l-1-9H5l-1 9z" />
              </svg>
              {isAuthenticated ? currentUser?.name || 'Profile' : 'Sign In'}
            </button>
          </nav>
        </div>
      </div>

      {/* Debug Notice */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-blue-700">
            🚀 <strong>DI Debug Mode:</strong> Visit{' '}
            <a href="/_di_debug" target="_blank" className="underline">/_di_debug</a> to inspect the dependency injection container
          </p>
        </div>
      </div>
    </header>
  );
}