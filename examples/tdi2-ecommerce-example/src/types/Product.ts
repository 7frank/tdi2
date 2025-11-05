export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stockQuantity: number;
  tags: string[];
}

export interface ProductFilter {
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  tags: string[];
}