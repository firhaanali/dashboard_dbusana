import { useState, useEffect, useCallback, useRef } from 'react';
import { api, apiClient, apiConfig, DashboardStats, SalesChartData, AnalyticsData, ImportResult, Sale, Product, Customer } from '../services/api';
import { backendResolver } from '../utils/backendConnectionResolver';
import { fallbackDataGenerator } from '../utils/comprehensiveFallbackData';

// Generic API hook with graceful error handling - overloaded for endpoint paths
export function useApi<T>(endpoint: string): { data: T | null; loading: boolean; error: string | null; refetch: () => void };
export function useApi<T>(
  apiCall: () => Promise<{ success: boolean; data?: T; error?: string }>,
  dependencies?: any[]
): { data: T | null; loading: boolean; error: string | null; refetch: () => void };
export function useApi<T>(
  apiCallOrEndpoint: (() => Promise<{ success: boolean; data?: T; error?: string }>) | string,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add debouncing to prevent excessive requests
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchTimeRef = useRef<number>(0);
  const minFetchInterval = 1000; // Minimum 1 second between requests

  const fetchData = useCallback(async () => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Check if we're making requests too frequently
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (timeSinceLastFetch < minFetchInterval) {
      // Debounce the request
      const delay = minFetchInterval - timeSinceLastFetch;
      debounceTimeoutRef.current = setTimeout(() => {
        performFetch();
      }, delay);
      return;
    }

    performFetch();
  }, [apiCallOrEndpoint, ...dependencies]);

  const performFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      lastFetchTimeRef.current = Date.now();
      
      let response;
      if (typeof apiCallOrEndpoint === 'string') {
        // Handle endpoint path strings - use backend resolver with fallback
        const fallbackData = fallbackDataGenerator.getFallbackForEndpoint(apiCallOrEndpoint, {
          useCachedData: true,
          dataVariation: 'rich'
        });
        
        if (backendResolver.isOnline()) {
          console.info(`🔌 Backend online - fetching from ${apiCallOrEndpoint}`);
          response = await backendResolver.apiRequest(apiCallOrEndpoint, {}, fallbackData);
          if (response) {
            setData(response);
            return;
          }
        }
        
        // Use fallback data
        console.info(`📋 Using fallback data for ${apiCallOrEndpoint}`);
        setData(fallbackData);
        setError(null);
        return;
      } else {
        // Handle function API calls with enhanced error handling
        try {
          response = await apiCallOrEndpoint();
        } catch (fetchError) {
          // If function call fails, try to determine endpoint and use fallback
          console.warn('📡 Function API call failed, attempting fallback:', fetchError);
          setData(null);
          setError(null); // Don't show error, let component handle with mock data
          return;
        }
      }
      
      if (response && response.success && response.data !== undefined) {
        setData(response.data);
      } else {
        // Enhanced error handling with fallback support
        if (response && (response.error === 'Backend not available' || response.error?.includes('Failed to fetch'))) {
          console.info('🔌 Backend not available - using fallback data handling');
          setData(null);
          setError(null); // Don't set error for expected backend unavailability
        } else {
          setError(response?.error || 'Failed to fetch data');
        }
      }
    } catch (err) {
      console.warn('📡 API hook error:', err);
      // Don't set error for network/connection issues - let components handle gracefully
      if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network'))) {
        setData(null);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Dashboard stats hook
export function useDashboardStats() {
  return useApi<DashboardStats>(() => api.getDashboardStats());
}

// Sales chart hook
export function useSalesChart(period: '7d' | '30d' | '90d' = '7d') {
  // Convert period format to API format
  const apiPeriod = period === '7d' ? '7days' : period === '30d' ? '30days' : '12months';
  return useApi<SalesChartData[]>(() => api.getSalesChart(apiPeriod as '7days' | '30days' | '12months'), [period]);
}

// Analytics hooks
export function useTopProducts(limit = 10) {
  return useApi<any[]>(() => apiClient.getTopProducts(limit), [limit]);
}

export function useRecentActivities(limit = 20) {
  return useApi<any[]>(() => apiClient.getRecentActivities(limit), [limit]);
}

export function useAnalytics() {
  return useApi<AnalyticsData>(() => apiClient.getAnalytics());
}

// Sales hook
export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchSales = useCallback(async (page = 1, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSales(page, limit);
      
      if (response.success && response.data) {
        setSales(response.data.sales);
        setTotal(response.data.total);
      } else {
        setError(response.error || 'Failed to fetch sales');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const createSale = async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await api.createSale(sale);
      if (response.success && response.data) {
        setSales(prev => [response.data!, ...prev]);
        setTotal(prev => prev + 1);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const updateSale = async (id: string, updates: Partial<Sale>) => {
    try {
      const response = await api.updateSale(id, updates);
      if (response.success && response.data) {
        setSales(prev => prev.map(sale => sale.id === id ? response.data! : sale));
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const response = await api.deleteSale(id);
      if (response.success) {
        setSales(prev => prev.filter(sale => sale.id !== id));
        setTotal(prev => prev - 1);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return {
    sales,
    loading,
    error,
    total,
    refetch: fetchSales,
    createSale,
    updateSale,
    deleteSale,
  };
}

// Products hook
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getProducts();
      
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await api.createProduct(product);
      if (response.success && response.data) {
        setProducts(prev => [response.data!, ...prev]);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const response = await api.updateProduct(id, updates);
      if (response.success && response.data) {
        setProducts(prev => prev.map(product => product.id === id ? response.data! : product));
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
  };
}

// Customers hook
export function useCustomers() {
  return useApi<Customer[]>(() => api.getCustomers());
}

// Import hook with validation and Excel parsing support
export function useImport() {
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);

  // File validation function
  const validateFile = (file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > apiConfig.maxFileSize) {
      errors.push(`File size exceeds ${apiConfig.maxFileSize / (1024 * 1024)}MB limit`);
    }
    
    // Check file type
    const allowedTypes = apiConfig.allowedFileTypes.split(',');
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type ${fileExtension} not allowed. Allowed types: ${apiConfig.allowedFileTypes}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateExcelData = async (file: File) => {
    try {
      setValidating(true);
      const validation = validateFile(file);
      return validation;
    } catch (err) {
      return {
        isValid: false,
        errors: [err instanceof Error ? err.message : 'Validation failed']
      };
    } finally {
      setValidating(false);
    }
  };

  const importSalesFromExcel = async (file: File) => {
    try {
      setImporting(true);
      
      // Validate file first
      const validation = validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }
      
      const response = await apiClient.importSalesFromExcel(file);
      
      if (apiConfig.enableDebug) {
        console.log('📤 Sales import response:', response);
      }
      
      // Enhanced error handling with detailed error information
      if (!response.success && response.data?.errorDetails) {
        console.log('📋 Detailed errors from backend:', response.data.errorDetails);
        return {
          success: false,
          error: response.error || response.message || 'Import failed',
          data: response.data, // Include data with errorDetails for frontend display
        };
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      console.error('❌ Sales import error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setImporting(false);
    }
  };

  const importProductsFromExcel = async (file: File) => {
    try {
      setImporting(true);
      
      // Validate file first
      const validation = validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }
      
      const response = await apiClient.importProductsFromExcel(file);
      
      if (apiConfig.enableDebug) {
        console.log('📤 Products import response:', response);
      }
      
      // Enhanced error handling with detailed error information
      if (!response.success && response.data?.errorDetails) {
        console.log('📋 Detailed errors from backend:', response.data.errorDetails);
        return {
          success: false,
          error: response.error || response.message || 'Import failed',
          data: response.data, // Include data with errorDetails for frontend display
        };
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Backend not available';
      console.log('ℹ️ Products import falling back to frontend parsing:', errorMessage);
      return {
        success: false,
        error: 'Backend not available - using frontend parsing fallback',
      };
    } finally {
      setImporting(false);
    }
  };

  const importStockFromExcel = async (file: File) => {
    try {
      setImporting(true);
      
      // Validate file first
      const validation = validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }
      
      const response = await apiClient.importStockFromExcel(file);
      
      if (apiConfig.enableDebug) {
        console.log('📤 Stock import response:', response);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      console.error('❌ Stock import error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async (type: 'sales' | 'products' | 'stock') => {
    try {
      const response = await apiClient.downloadTemplate(type);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dbusana_${type}_template.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to download template' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      console.error('❌ Template download error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Add product stats function for StockManagement
  const getProductStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Get product stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get product stats'
      };
    }
  };

  // Add update product function for stock management
  const updateProduct = async (id: string, updates: any) => {
    try {
      const response = await fetch(`http://localhost:3001/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Update product error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product'
      };
    }
  };

  // Add product management functions for ProductsManagement
  const createProduct = async (product: any) => {
    try {
      console.log('🆕 Creating product via useImport hook:', product);
      const response = await apiClient.createProduct(product);
      
      if (apiConfig.enableDebug) {
        console.log('📤 Create product response:', response);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Create product failed';
      console.error('❌ Create product error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      console.log('🗑️ Deleting product via useImport hook:', id);
      const response = await apiClient.deleteProduct(id);
      
      if (apiConfig.enableDebug) {
        console.log('📤 Delete product response:', response);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete product failed';
      console.error('❌ Delete product error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const getProducts = async () => {
    try {
      const response = await apiClient.getProducts();
      
      if (apiConfig.enableDebug) {
        console.log('📤 Get products response:', response);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Get products failed';
      console.error('❌ Get products error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    importing,
    validating,
    importSalesFromExcel,
    importProductsFromExcel,
    importStockFromExcel,
    downloadTemplate,
    validateExcelData,
    getProductStats,
    updateProduct,
    createProduct,
    deleteProduct,
    getProducts,
  };
}

// Dashboard hooks using new backend endpoints
export function useDashboardMetrics() {
  return useApi<any>(() => apiClient.getDashboardMetrics());
}

export function useChartData(period: '7d' | '30d' | '90d' = '30d') {
  return useApi<any[]>(() => apiClient.getChartData(period), [period]);
}

export function useCategorySales() {
  return useApi<any[]>(() => apiClient.getCategorySales());
}

export function useBrandPerformance() {
  return useApi<any[]>(() => apiClient.getBrandPerformance());
}

export function useTopProductsAPI(limit = 10) {
  return useApi<any[]>(() => apiClient.getTopProductsAPI(limit), [limit]);
}

export function useRecentActivitiesAPI(limit = 10) {
  return useApi<any[]>(() => apiClient.getRecentActivitiesAPI(limit), [limit]);
}

export function useKPISummary() {
  return useApi<any>(() => apiClient.getKPISummary());
}

export function useDashboardOverview() {
  return useApi<any>(() => apiClient.getDashboardOverview());
}

// Marketplace Analytics hook with caching and debouncing
export function useMarketplaceAnalytics() {
  // Memoize the API call function to prevent unnecessary re-creations
  const memoizedApiCall = useCallback(() => apiClient.getMarketplaceAnalytics(), []);
  
  return useApi<any>(memoizedApiCall, []); // Empty dependency array to prevent re-runs
}

// Import tracking hooks
export function useImportStatus(batchId: string) {
  return useApi<any>(() => apiClient.getImportStatus(batchId), [batchId]);
}

export function useImportHistory(page = 1, limit = 10, type?: string) {
  return useApi<any>(() => apiClient.getImportHistory(page, limit, type), [page, limit, type]);
}

// Auth hook
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(username, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        return response;
      }
      return response;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    nama: string;
    jabatan?: string;
    role?: string;
  }) => {
    try {
      setLoading(true);
      const response = await apiClient.register(userData);
      if (response.success && response.data) {
        setUser(response.data.user);
        return response;
      }
      return response;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // Clear token logic will be handled by API client
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
  };
}