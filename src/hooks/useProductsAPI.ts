import { useState, useCallback } from 'react';
import { productsApi, type Product, type ProductStats } from '../utils/productsApiUtils';

// Types imported from productsApiUtils

interface UseProductsAPIReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: () => Promise<Product[]>;
  fetchProductStats: () => Promise<ProductStats | null>;
  createProduct: (productData: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  searchProducts: (query: string, category?: string, brand?: string) => Promise<Product[]>;
}

export function useProductsAPI(): UseProductsAPIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Ensure we use full backend URL
      const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
      
      const response = await fetch(fullUrl, {
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
    } catch (err) {
      let errorMessage = 'Unknown error';
      
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        errorMessage = 'Products API request failed: Backend server not available. Please check if the server is running on port 3000.';
      } else if (err instanceof Error) {
        errorMessage = `Products API request failed: ${err.message}`;
      }
      
      setError(errorMessage);
      console.error('❌ Products API Request Error:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    try {
      return await productsApi.fetchProducts();
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      // Return empty array as fallback - component should handle gracefully
      return [];
    }
  }, []);

  const fetchProductStats = useCallback(async (): Promise<ProductStats | null> => {
    try {
      return await productsApi.fetchProductStats();
    } catch (err) {
      console.error('❌ Error fetching product stats:', err);
      // Return fallback stats when backend unavailable
      return {
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalCategories: 0,
        totalBrands: 0,
        categories: [],
        brands: []
      };
    }
  }, []);

  const createProduct = useCallback(async (productData: Partial<Product>): Promise<Product> => {
    const result = await productsApi.createProduct(productData);
    if (!result) {
      throw new Error('Failed to create product');
    }
    return result;
  }, []);

  const updateProduct = useCallback(async (id: string, productData: Partial<Product>): Promise<Product> => {
    const result = await productsApi.updateProduct(id, productData);
    if (!result) {
      throw new Error('Failed to update product');
    }
    return result;
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    await apiRequest(`/api/products/${id}`, {
      method: 'DELETE',
    });
    
    console.log('✅ Deleted product:', id);
  }, [apiRequest]);

  const searchProducts = useCallback(async (
    query: string, 
    category?: string, 
    brand?: string
  ): Promise<Product[]> => {
    try {
      return await productsApi.searchProducts(query, category, brand);
    } catch (err) {
      console.error('❌ Error searching products:', err);
      return [];
    }
  }, []);

  return {
    loading,
    error,
    fetchProducts,
    fetchProductStats,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
  };
}