import type { Inject } from '@tdi2/di-core/markers';
import { ProductServiceInterface } from '../services/ProductService';
import { CartServiceInterface } from '../services/CartService';
import { Product } from '../types/Product';

interface ProductListProps {
  services: {
    productService: Inject<ProductServiceInterface>;
    cartService: Inject<CartServiceInterface>;
  };
}

export function ProductList(props: ProductListProps) {
  const { services: { productService, cartService } } = props;
  const { loading, error } = productService.state;
  const products = productService.filteredProducts;

  const handleAddToCart = async (product: Product) => {
    try {
      await cartService.addItem(product);
    } catch (error) {
      alert(`Could not add ${product.name} to cart: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  if (error) {
    return <div className="text-red-600 py-8">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => handleAddToCart(product)}
        />
      ))}
      {products.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No products match your search criteria
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.stockQuantity === 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-3">{product.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              {product.stockQuantity} in stock
            </span>
          </div>
          
          <button
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}