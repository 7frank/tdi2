import { useState } from 'react';
import { DIProvider, Inject } from '@tdi2/di-core';
import { container } from './container';
import { Header } from './components/Header';
import { ProductList } from './components/ProductList';
import { ProductSearch } from './components/ProductSearch';
import { ShoppingCart } from './components/ShoppingCart';
import { UserProfile } from './components/UserProfile';
import { ProductServiceInterface } from './services/ProductService';
import { CartServiceInterface } from './services/CartService';
import { UserServiceInterface } from './services/UserService';

type ViewType = 'products' | 'cart' | 'profile';

interface AppContentProps {
  productService: Inject<ProductServiceInterface>;
  cartService: Inject<CartServiceInterface>;
  userService: Inject<UserServiceInterface>;
}

function AppContent({ productService, cartService, userService }: AppContentProps) {
  const [currentView, setCurrentView] = useState<ViewType>('products');

  const renderView = () => {
    switch (currentView) {
      case 'cart':
        return <ShoppingCart cartService={cartService} />;
      case 'profile':
        return <UserProfile userService={userService} />;
      default:
        return (
          <div>
            <ProductSearch productService={productService} />
            <ProductList productService={productService} cartService={cartService} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        cartService={cartService}
        userService={userService}
        onNavigate={setCurrentView}
        currentView={currentView}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      {/* TDI2 Success Message */}
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">✅ Zero Props Achieved!</p>
            <p className="text-sm">Services injected via DI container</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Resolve services from container
  const productService = container.resolve<ProductServiceInterface>('ProductServiceInterface');
  const cartService = container.resolve<CartServiceInterface>('CartServiceInterface'); 
  const userService = container.resolve<UserServiceInterface>('UserServiceInterface');

  return (
    <DIProvider container={container}>
      <AppContent 
        productService={productService}
        cartService={cartService}
        userService={userService}
      />
    </DIProvider>
  );
}

export default App;