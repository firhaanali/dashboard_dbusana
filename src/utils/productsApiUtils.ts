/**
 * Products API Utilities with Enhanced Error Handling
 * Simplified API client untuk Products management
 */

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  category: string;
  brand: string;
  size?: string;
  color?: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ProductStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  totalBrands: number;
  categories: Array<{ name: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
}

// Fallback data for when backend is not available
const FALLBACK_STATS: ProductStats = {
  totalProducts: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  totalCategories: 0,
  totalBrands: 0,
  categories: [],
  brands: []
};

const FALLBACK_PRODUCTS: Product[] = [];

class ProductsApiUtils {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Development-Only': 'true',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Products API: Backend server not available, using fallback data');
        throw new Error('Backend server not available. Please check if the server is running on port 3000.');
      }
      
      console.error('❌ Products API Error:', error);
      throw error;
    }
  }

  async fetchProducts(): Promise<Product[]> {
    try {
      const result = await this.makeRequest('/products');
      console.log(`✅ Products API: Fetched ${result.data?.length || 0} products`);
      return result.data || FALLBACK_PRODUCTS;
    } catch (error) {
      console.warn('⚠️ Products API: Using fallback products data');
      return FALLBACK_PRODUCTS;
    }
  }

  async fetchProductStats(): Promise<ProductStats> {
    try {
      const result = await this.makeRequest('/products/stats');
      console.log('✅ Products API: Fetched product statistics');
      return result.data || FALLBACK_STATS;
    } catch (error) {
      console.warn('⚠️ Products API: Using fallback stats data');
      return FALLBACK_STATS;
    }
  }

  async searchProducts(query: string, category?: string, brand?: string): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category && category !== 'all') params.append('category', category);
      if (brand && brand !== 'all') params.append('brand', brand);

      const result = await this.makeRequest(`/products/search?${params.toString()}`);
      console.log(`✅ Products API: Search found ${result.data?.length || 0} products`);
      return result.data || FALLBACK_PRODUCTS;
    } catch (error) {
      console.warn('⚠️ Products API: Search failed, using fallback');
      return FALLBACK_PRODUCTS;
    }
  }

  async createProduct(productData: Partial<Product>): Promise<Product | null> {
    try {
      const result = await this.makeRequest('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      
      console.log('✅ Products API: Created product:', result.data.product_name);
      return result.data;
    } catch (error) {
      console.error('❌ Products API: Failed to create product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
    try {
      const result = await this.makeRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
      
      console.log('✅ Products API: Updated product:', result.data.product_name);
      return result.data;
    } catch (error) {
      console.error('❌ Products API: Failed to update product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/products/${id}`, {
        method: 'DELETE',
      });
      
      console.log('✅ Products API: Deleted product:', id);
      return true;
    } catch (error) {
      console.error('❌ Products API: Failed to delete product:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.makeRequest('/products/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const productsApi = new ProductsApiUtils();

// Export types
export type { Product, ProductStats };

// Export utility functions for components
export const fetchProductsWithFallback = () => productsApi.fetchProducts();
export const fetchProductStatsWithFallback = () => productsApi.fetchProductStats();
export const searchProductsWithFallback = (query: string, category?: string, brand?: string) => 
  productsApi.searchProducts(query, category, brand);

// Health check utility
export const checkProductsApiHealth = () => productsApi.checkHealth();