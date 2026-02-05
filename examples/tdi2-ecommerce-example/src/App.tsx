import { useState } from "react";
import { Header } from "./components/Header";
import { ProductList } from "./components/ProductList";
import { ProductSearch } from "./components/ProductSearch";
import { ShoppingCart } from "./components/ShoppingCart";
import { UserProfile } from "./components/UserProfile";
import { Checkout } from "./components/Checkout";

type ViewType = "products" | "cart" | "profile";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("products");

  const renderView = () => {
    switch (currentView) {
      case "cart":
        return <ShoppingCart />;
      case "profile":
        return <UserProfile />;
      default:
        return (
          <div>
            <ProductSearch />
            <ProductList />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={setCurrentView} currentView={currentView} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      {/* Checkout Modal */}
      <Checkout />

      {/* TDI2 Success Message */}
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium">✅ Zero Props Achieved!</p>
            <p className="text-sm">Services auto-injected by TDI2!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

