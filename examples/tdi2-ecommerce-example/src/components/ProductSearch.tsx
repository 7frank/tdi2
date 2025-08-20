import React from 'react';
import { Inject } from '@tdi2/di-core';
import { ProductServiceInterface } from '../services/ProductService';

interface ProductSearchProps {
  services: {
    productService: Inject<ProductServiceInterface>;
  };
}

export function ProductSearch({ services }: ProductSearchProps) {
  const { productService } = services;
  const { searchQuery, filters } = productService.state;
  const categories = productService.categories;
  const allTags = productService.allTags;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Search & Filter</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => productService.searchProducts(e.target.value)}
            placeholder="Search products..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={filters.category}
            onChange={(e) => productService.setFilter({ category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
          <input
            type="range"
            min="0"
            max="1000"
            value={filters.priceRange.max}
            onChange={(e) => productService.setFilter({ 
              priceRange: { ...filters.priceRange, max: Number(e.target.value) } 
            })}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>$0</span>
            <span>${filters.priceRange.max}</span>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={() => productService.clearFilters()}
            className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Popular Tags */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Popular Tags</label>
        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 8).map(tag => (
            <button
              key={tag}
              onClick={() => {
                const newTags = filters.tags.includes(tag)
                  ? filters.tags.filter(t => t !== tag)
                  : [...filters.tags, tag];
                productService.setFilter({ tags: newTags });
              }}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.tags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}