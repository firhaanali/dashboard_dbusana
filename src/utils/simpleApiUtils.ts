// Simplified API utilities without complex TypeScript generics
import APIConnectionFallback from './apiConnectionFallback';

const BACKEND_URL = 'http://localhost:3001';
const API_TIMEOUT = 15000; // Increased timeout
const MAX_RETRIES = 2;

// Silent backend connection handling - no UI notifications

export interface SimpleApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  count?: number;
}

export const createBackendUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BACKEND_URL}/api${cleanEndpoint}`;
};

export const createApiHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'x-development-only': 'true',
    ...additionalHeaders
  };
};

export const makeSimpleApiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<SimpleApiResponse> => {
  try {
    const url = createBackendUrl(endpoint);
    const headers = createApiHeaders(options.headers as Record<string, string>);
    
    console.log(`🔄 API Request: ${options.method || 'GET'} ${url} ${retryCount > 0 ? `(retry ${retryCount})` : ''}`);
    
    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn(`⚠️ Non-JSON response from ${url}:`, text.substring(0, 200));
      
      if (response.status === 404) {
        return {
          success: false,
          error: `API endpoint not found: ${endpoint}. Make sure backend is running.`
        };
      }
      
      return {
        success: false,
        error: `Invalid response format from backend (${response.status})`
      };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ API Error ${response.status}:`, data);
      
      // Handle specific error cases more gracefully
      if (response.status === 403) {
        console.warn('⚠️ API Access forbidden - continuing with fallback data');
        return {
          success: false,
          error: 'Backend access restricted - using fallback data'
        };
      }
      
      if (response.status === 500) {
        console.warn('⚠️ Backend server error - continuing with fallback data');
        return {
          success: false,
          error: 'Backend server error - using fallback data'
        };
      }
      
      return {
        success: false,
        error: data.error || data.message || `API request failed (${response.status})`
      };
    }
    
    console.log(`✅ API Success:`, { 
      endpoint, 
      dataType: Array.isArray(data.data) ? `array[${data.data.length}]` : typeof data.data,
      hasCount: !!data.count 
    });
    
    return {
      success: true,
      data: data.data || data,
      message: data.message,
      count: data.count
    };
    
  } catch (error) {
    // Use console.log instead of console.error to avoid red errors in console when backend is simply unavailable
    console.log(`ℹ️ API request failed for ${endpoint}:`, error instanceof Error ? error.message : error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        if (retryCount < MAX_RETRIES) {
          console.log(`⏳ Retrying API request due to timeout (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return makeSimpleApiRequest(endpoint, options, retryCount + 1);
        }
        
        return {
          success: false,
          error: 'Request timeout - backend may not be running. Check if server is started.'
        };
      }
      
      if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        if (retryCount < MAX_RETRIES) {
          console.log(`⏳ Retrying API request due to network error (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return makeSimpleApiRequest(endpoint, options, retryCount + 1);
        }
        
        // Silent handling - don't throw uncaught errors
        console.log('ℹ️ Backend connection unavailable - fallback system will handle this gracefully');
        
        return {
          success: false,
          error: 'Cannot connect to backend - make sure server is running on localhost:3001'
        };
      }
      
      if (error.message.includes('JSON')) {
        return {
          success: false,
          error: 'Invalid server response - backend may be returning HTML instead of JSON'
        };
      }
    }
    
    return {
      success: false,
      error: `API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Simple API functions for activity logs - WITHOUT FALLBACK
export const simpleApiActivityLogs = {
  getAll: (params?: { page?: number; limit?: number; sort?: string; order?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    
    const endpoint = queryParams.toString() ? `/activity-logs?${queryParams.toString()}` : '/activity-logs';
    console.log('🔍 simpleApiActivityLogs.getAll called with:', { params, endpoint });
    
    // Direct API call - NO FALLBACK for activity logs
    return makeSimpleApiRequest(endpoint);
  },
  
  create: (data: any) => {
    console.log('🔍 simpleApiActivityLogs.create called with:', data);
    return makeSimpleApiRequest('/activity-logs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  getById: (id: string) => makeSimpleApiRequest(`/activity-logs/${id}`),
  
  // Get recent activities without any fallback
  getRecent: (limit: number = 5) => {
    console.log('🔍 simpleApiActivityLogs.getRecent called with limit:', limit);
    return makeSimpleApiRequest(`/activity-logs?limit=${limit}&sort=created_at&order=desc`);
  }
};

// Simple retry wrapper function
export const withSimpleRetry = async (
  apiCall: () => Promise<any>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<any> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying API call (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
};

// Simple API functions for brands
export const simpleApiBrands = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = queryParams.toString() ? `/brands?${queryParams.toString()}` : '/brands';
    return makeSimpleApiRequest(endpoint);
  },
  getById: (id: string) => makeSimpleApiRequest(`/brands/${id}`),
  create: (brand: any) => makeSimpleApiRequest('/brands', {
    method: 'POST',
    body: JSON.stringify(brand)
  }),
  update: (id: string, brand: any) => makeSimpleApiRequest(`/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(brand)
  }),
  delete: (id: string) => makeSimpleApiRequest(`/brands/${id}`, {
    method: 'DELETE'
  }),
  getStats: () => makeSimpleApiRequest('/brands/stats'),
  search: (query: string) => makeSimpleApiRequest(`/brands/search?q=${encodeURIComponent(query)}`)
};

// Simple API functions for categories
export const simpleApiCategories = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = queryParams.toString() ? `/categories?${queryParams.toString()}` : '/categories';
    return makeSimpleApiRequest(endpoint);
  },
  getById: (id: string) => makeSimpleApiRequest(`/categories/${id}`),
  create: (category: any) => makeSimpleApiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(category)
  }),
  update: (id: string, category: any) => makeSimpleApiRequest(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category)
  }),
  delete: (id: string) => makeSimpleApiRequest(`/categories/${id}`, {
    method: 'DELETE'
  }),
  getStats: () => makeSimpleApiRequest('/categories/stats'),
  search: (query: string) => makeSimpleApiRequest(`/categories/search?q=${encodeURIComponent(query)}`)
};

// Simple API functions for customers - NO FALLBACK (database-driven only)
export const simpleApiCustomers = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const endpoint = queryParams.toString() ? `/customers?${queryParams.toString()}` : '/customers';
    console.log('🔍 simpleApiCustomers.getAll called with:', { params, endpoint });
    
    // Direct API call - NO FALLBACK for customers (database-driven only)
    return makeSimpleApiRequest(endpoint);
  },
  getById: (id: string) => makeSimpleApiRequest(`/customers/${id}`),
  create: (customer: any) => makeSimpleApiRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(customer)
  }),
  update: (id: string, customer: any) => makeSimpleApiRequest(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customer)
  }),
  delete: (id: string) => makeSimpleApiRequest(`/customers/${id}`, {
    method: 'DELETE'
  }),
  getStats: async () => {
    console.log('🔍 simpleApiCustomers.getStats called');
    
    // Direct API call - NO FALLBACK for customer stats (database-driven only)
    return makeSimpleApiRequest('/customers/stats');
  },
  search: (query: string) => makeSimpleApiRequest(`/customers/search?q=${encodeURIComponent(query)}`),
  
  // Alias function for compatibility with CustomerManagement.tsx
  getCustomers: async (page?: number, pageSize?: number, search?: string, sortBy?: string, sortOrder?: string) => {
    console.log('🔍 simpleApiCustomers.getCustomers called (alias for getAll) with:', { page, pageSize, search, sortBy, sortOrder });
    
    return simpleApiCustomers.getAll({
      page,
      limit: pageSize,
      search,
      sortBy,
      sortOrder
    });
  }
};

// Simple API functions for forecasting - NO FALLBACK (database-driven only)
export const simpleApiForecasting = {
  getAll: async (params?: { 
    forecast_horizon?: string; 
    forecast_metric?: string; 
    granularity?: string; 
    historical_period?: string; 
    confidence_level?: number 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.forecast_horizon) queryParams.append('forecast_horizon', params.forecast_horizon);
    if (params?.forecast_metric) queryParams.append('forecast_metric', params.forecast_metric);
    if (params?.granularity) queryParams.append('granularity', params.granularity);
    if (params?.historical_period) queryParams.append('historical_period', params.historical_period);
    if (params?.confidence_level) queryParams.append('confidence_level', params.confidence_level.toString());
    
    const endpoint = queryParams.toString() ? `/forecasting?${queryParams.toString()}` : '/forecasting';
    console.log('🔍 simpleApiForecasting.getAll called with:', { params, endpoint });
    
    // Direct API call - NO FALLBACK for forecasting (database-driven only)
    return makeSimpleApiRequest(endpoint);
  },
  
  getProductForecasts: async (params?: { top_products?: number; forecast_days?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.top_products) queryParams.append('top_products', params.top_products.toString());
    if (params?.forecast_days) queryParams.append('forecast_days', params.forecast_days.toString());
    
    const endpoint = queryParams.toString() ? `/forecasting/products?${queryParams.toString()}` : '/forecasting/products';
    console.log('🔍 simpleApiForecasting.getProductForecasts called with:', { params, endpoint });
    
    return makeSimpleApiRequest(endpoint);
  },
  
  getMarketInsights: async () => {
    console.log('🔍 simpleApiForecasting.getMarketInsights called');
    return makeSimpleApiRequest('/forecasting/insights');
  }
};

// Simple API functions for stock management
export const simpleApiStock = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = queryParams.toString() ? `/stock?${queryParams.toString()}` : '/stock';
    return makeSimpleApiRequest(endpoint);
  },
  getById: (id: string) => makeSimpleApiRequest(`/stock/${id}`),
  update: (id: string, data: any) => makeSimpleApiRequest(`/stock/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getStats: () => makeSimpleApiRequest('/stock/stats'),
  getMovements: (params?: { limit?: number; product_code?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.product_code) queryParams.append('product_code', params.product_code);
    
    const endpoint = queryParams.toString() ? `/stock/movements?${queryParams.toString()}` : '/stock/movements';
    return makeSimpleApiRequest(endpoint);
  },
  createMovement: (data: {
    product_code: string;
    movement_type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reference_number?: string;
    notes?: string;
  }) => makeSimpleApiRequest('/stock/movements', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  adjustStock: (productId: string, adjustment: number, notes?: string) => makeSimpleApiRequest(`/stock/${productId}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ adjustment, notes })
  }),
  
  // Stock Forecasting API - Using stock forecasting utilities
  getForecastData: async (params?: { limit?: number; type?: string }) => {
    console.log('📦 simpleApiStock.getForecastData called with:', params);
    
    try {
      // First try to get real stock data from backend
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      
      const endpoint = queryParams.toString() ? `/stock/forecast-data?${queryParams.toString()}` : '/stock/forecast-data';
      
      const response = await makeSimpleApiRequest(endpoint);
      
      if (response.success && response.data && response.data.length > 0) {
        console.log(`✅ Retrieved ${response.data.length} stock forecast records from backend`);
        return response;
      } else {
        console.log('⚠️ No stock forecast data from backend, generating from sales data...');
        
        // Fallback: Generate stock data from sales patterns
        const { generateStockDataFromSales } = await import('./stockForecastingUtils');
        const stockData = await generateStockDataFromSales();
        
        return {
          success: true,
          data: stockData,
          message: 'Stock forecast data generated from sales patterns'
        };
      }
    } catch (error) {
      console.error('❌ Stock forecast data error:', error);
      
      // Generate minimal stock data as final fallback
      try {
        const { generateStockDataFromSales } = await import('./stockForecastingUtils');
        const stockData = await generateStockDataFromSales();
        
        return {
          success: true,
          data: stockData,
          message: 'Stock forecast data generated from sales fallback'
        };
      } catch (fallbackError) {
        console.error('❌ Stock forecast fallback failed:', fallbackError);
        return {
          success: false,
          error: 'Unable to generate stock forecast data',
          data: []
        };
      }
    }
  },
  
  getStockAnalytics: (params?: { period?: string; product?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.product) queryParams.append('product', params.product);
    
    const endpoint = queryParams.toString() ? `/stock/analytics?${queryParams.toString()}` : '/stock/analytics';
    return makeSimpleApiRequest(endpoint);
  },
  
  getReorderRecommendations: () => makeSimpleApiRequest('/stock/reorder-recommendations'),
  
  getStockForecast: (params?: { 
    horizon?: string; 
    type?: 'levels' | 'demand' | 'reorder';
    product?: string 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.horizon) queryParams.append('horizon', params.horizon);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.product) queryParams.append('product', params.product);
    
    const endpoint = queryParams.toString() ? `/stock/forecast?${queryParams.toString()}` : '/stock/forecast';
    return makeSimpleApiRequest(endpoint);
  }
};

// Check if backend is reachable
export const checkSimpleBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      headers: createApiHeaders(),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

// Simple API functions for products with enhanced fallback
export const simpleApiProducts = {
  getAll: (params?: { limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = queryParams.toString() ? `/products?${queryParams.toString()}` : '/products';
    return makeSimpleApiRequest(endpoint);
  },
  getById: (id: string) => makeSimpleApiRequest(`/products/${id}`),
  create: (product: any) => makeSimpleApiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(product)
  }),
  update: (id: string, product: any) => makeSimpleApiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product)
  }),
  delete: (id: string) => makeSimpleApiRequest(`/products/${id}`, {
    method: 'DELETE'
  }),
  getStats: () => makeSimpleApiRequest('/products/stats'),
  search: (params: { q?: string; category?: string; brand?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.brand) queryParams.append('brand', params.brand);
    
    return makeSimpleApiRequest(`/products/search?${queryParams.toString()}`);
  }
};

// Simple API functions for sales
export const simpleApiSales = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = queryParams.toString() ? `/sales?${queryParams.toString()}` : '/sales';
    
    console.log('🔍 simpleApiSales.getAll called with:', {
      params,
      endpoint,
      finalUrl: `http://localhost:3001/api${endpoint}`
    });
    
    try {
      return await APIConnectionFallback.withFallback(
        () => makeSimpleApiRequest(endpoint),
        () => ({ success: true, data: APIConnectionFallback.generateSalesData(60) }),
        'Sales data'
      );
    } catch (error) {
      console.log('⚠️ Sales API error, returning fallback data');
      return { success: true, data: APIConnectionFallback.generateSalesData(60) };
    }
  },
  getStats: () => makeSimpleApiRequest('/sales/stats'),
  getChartData: (period?: string) => {
    const queryParams = period ? `?period=${period}` : '';
    return makeSimpleApiRequest(`/sales/chart${queryParams}`);
  },
  getMarketplaceStats: () => makeSimpleApiRequest('/sales/marketplace-stats'),
  importFromFile: async (file: File): Promise<SimpleApiResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const url = createBackendUrl('/import/sales');
      console.log(`🔄 Sales Import Request: POST ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for file upload
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-development-only': 'true'
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📡 Sales Import Response: ${response.status} ${response.statusText}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn(`⚠️ Non-JSON response from sales import:`, text.substring(0, 200));
        
        return {
          success: false,
          error: `Invalid response format from backend (${response.status})`
        };
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Sales Import Error ${response.status}:`, data);
        return {
          success: false,
          error: data.error || data.message || `Sales import failed (${response.status})`,
          data: data.data // Include error details if available
        };
      }
      
      console.log(`✅ Sales Import Success:`, { 
        imported: data.data?.imported || 0,
        updated: data.data?.updated || 0,
        errors: data.data?.errors || 0,
        batchId: data.data?.batchId
      });
      
      return {
        success: true,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      console.error(`❌ Sales import request failed:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Upload timeout - file may be too large or backend is slow'
          };
        }
        
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          return {
            success: false,
            error: 'Cannot connect to backend - make sure server is running on localhost:3001'
          };
        }
      }
      
      return {
        success: false,
        error: `Sales import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Simple API functions for dashboard
export const simpleApiDashboard = {
  getMetrics: async (queryParams?: string) => {
    const endpoint = queryParams ? `/dashboard/metrics${queryParams}` : '/dashboard/metrics';
    
    return APIConnectionFallback.withFallback(
      () => makeSimpleApiRequest(endpoint),
      () => ({ success: true, data: APIConnectionFallback.generateDashboardMetrics() }),
      'Dashboard metrics'
    );
  },
  getKPISummary: () => makeSimpleApiRequest('/dashboard/kpi-summary'),
  getChartData: (period?: string) => {
    const queryParams = period ? `?period=${period}` : '';
    return makeSimpleApiRequest(`/dashboard/charts${queryParams}`);
  },
  getCategorySales: () => makeSimpleApiRequest('/dashboard/category-sales'),
  getBrandPerformance: () => makeSimpleApiRequest('/dashboard/brand-performance'),
  getTopProducts: (limit?: number) => {
    const queryParams = limit ? `?limit=${limit}` : '';
    return makeSimpleApiRequest(`/dashboard/top-products${queryParams}`);
  },
  getRecentActivities: async (limit?: number) => {
    const queryParams = limit ? `?limit=${limit}` : '';
    
    return APIConnectionFallback.withFallback(
      () => makeSimpleApiRequest(`/dashboard/recent-activities${queryParams}`),
      () => ({ success: true, data: APIConnectionFallback.generateRecentActivities() }),
      'Recent activities'
    );
  },
  getOverview: () => makeSimpleApiRequest('/dashboard/overview'),
  getMarketplaceAnalytics: () => makeSimpleApiRequest('/dashboard/marketplace-analytics'),
  getMonthlyTrends: async () => {
    return APIConnectionFallback.withFallback(
      () => makeSimpleApiRequest('/dashboard/monthly-trends'),
      () => ({ success: true, data: APIConnectionFallback.generateMonthlyTrends() }),
      'Monthly trends'
    );
  }
};

// Simple API functions for advertising
export const simpleApiAdvertising = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    date_start?: string; 
    date_end?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.date_start) queryParams.append('date_start', params.date_start);
    if (params?.date_end) queryParams.append('date_end', params.date_end);
    
    const endpoint = queryParams.toString() ? `/advertising?${queryParams.toString()}` : '/advertising';
    return makeSimpleApiRequest(endpoint);
  },
  getStats: () => makeSimpleApiRequest('/advertising/stats'),
  getSettlement: (params?: { date_start?: string; date_end?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date_start) queryParams.append('date_start', params.date_start);
    if (params?.date_end) queryParams.append('date_end', params.date_end);
    
    const endpoint = queryParams.toString() ? `/advertising/settlement?${queryParams.toString()}` : '/advertising/settlement';
    return makeSimpleApiRequest(endpoint);
  },
  create: (data: any) => makeSimpleApiRequest('/advertising', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => makeSimpleApiRequest(`/advertising/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => makeSimpleApiRequest(`/advertising/${id}`, {
    method: 'DELETE'
  })
};

// Simple API functions for cash flow
export const simpleApiCashFlow = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    date_start?: string; 
    date_end?: string;
    type?: string;
    granularity?: string;
    category?: string;
    source?: string;
    marketplace?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.date_start) queryParams.append('date_start', params.date_start);
    if (params?.date_end) queryParams.append('date_end', params.date_end);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.granularity) queryParams.append('granularity', params.granularity);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.marketplace) queryParams.append('marketplace', params.marketplace);
    
    const endpoint = queryParams.toString() ? `/cash-flow?${queryParams.toString()}` : '/cash-flow';
    console.log('💰 simpleApiCashFlow.getAll called with:', { params, endpoint });
    return makeSimpleApiRequest(endpoint);
  },
  create: (data: any) => makeSimpleApiRequest('/cash-flow/entries', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => makeSimpleApiRequest(`/cash-flow/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => makeSimpleApiRequest(`/cash-flow/entries/${id}`, {
    method: 'DELETE'
  }),
  getStats: async () => {
    console.log('💰 simpleApiCashFlow.getStats called');
    
    try {
      // Fetch comprehensive cash flow data  
      const currentDate = new Date();
      const startDate = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      
      const params = new URLSearchParams({
        date_start: startDate.toISOString().split('T')[0],
        date_end: currentDate.toISOString().split('T')[0],
        granularity: 'daily'
      });
      
      const response = await makeSimpleApiRequest(`/cash-flow?${params.toString()}`);
      
      if (response.success && response.data) {
        // Return properly structured data for cash flow dashboard
        return {
          success: true,
          data: {
            summary: response.data.summary || [],
            income_breakdown: response.data.income_breakdown || [],
            expense_breakdown: response.data.expense_breakdown || [],
            forecast: response.data.forecast || []
          }
        };
      } else {
        console.warn('⚠️ Cash flow stats API failed, returning empty data structure');
        return {
          success: true,
          data: {
            summary: [],
            income_breakdown: [],
            expense_breakdown: [],
            forecast: []
          }
        };
      }
    } catch (error) {
      console.error('❌ Cash flow stats error:', error);
      return {
        success: false,
        error: 'Failed to fetch cash flow statistics',
        data: {
          summary: [],
          income_breakdown: [],
          expense_breakdown: [],
          forecast: []
        }
      };
    }
  },
  getSummary: (params?: { period?: string }) => {
    const queryParams = params?.period ? `?period=${params.period}` : '';
    return makeSimpleApiRequest(`/cash-flow/summary${queryParams}`);
  },
  getEntries: (params?: { 
    entry_type?: string; 
    category?: string; 
    source?: string; 
    date_start?: string; 
    date_end?: string; 
    limit?: number; 
    offset?: number 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.entry_type) queryParams.append('entry_type', params.entry_type);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.date_start) queryParams.append('date_start', params.date_start);
    if (params?.date_end) queryParams.append('date_end', params.date_end);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const endpoint = queryParams.toString() ? `/cash-flow/entries?${queryParams.toString()}` : '/cash-flow/entries';
    return makeSimpleApiRequest(endpoint);
  },
  getCategories: () => makeSimpleApiRequest('/cash-flow/categories'),
  getMetrics: (period?: string) => {
    const queryParams = period ? `?period=${period}` : '';
    return makeSimpleApiRequest(`/cash-flow/metrics${queryParams}`);
  },
  generateForecast: (data: {
    method?: string;
    periods?: number;
    granularity?: string;
  }) => makeSimpleApiRequest('/cash-flow/forecast', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  exportReport: (params: {
    format: 'pdf' | 'excel';
    date_start?: string;
    date_end?: string;
    granularity?: string;
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('format', params.format);
    if (params.date_start) queryParams.append('date_start', params.date_start);
    if (params.date_end) queryParams.append('date_end', params.date_end);
    if (params.granularity) queryParams.append('granularity', params.granularity);
    
    return makeSimpleApiRequest(`/cash-flow/export?${queryParams.toString()}`);
  }
};

// Simple API functions for analytics  
export const simpleApiAnalytics = {
  getAll: (params?: { 
    start_date?: string; 
    end_date?: string; 
    include_products?: boolean;
    marketplace?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.include_products) queryParams.append('include_products', 'true');
    if (params?.marketplace) queryParams.append('marketplace', params.marketplace);
    
    const endpoint = queryParams.toString() ? `/analytics?${queryParams.toString()}` : '/analytics';
    console.log('📊 simpleApiAnalytics.getAll called with:', { params, endpoint });
    return makeSimpleApiRequest(endpoint);
  },
  getMarketplaceStats: () => makeSimpleApiRequest('/analytics/marketplace'),
  getProductStats: () => makeSimpleApiRequest('/analytics/products'),
  getTrends: (period?: string) => {
    const queryParams = period ? `?period=${period}` : '';
    return makeSimpleApiRequest(`/analytics/trends${queryParams}`);
  }
};

// Simple API functions for Product HPP (TikTok Commission Calculator)
export const simpleApiProductHPP = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const endpoint = queryParams.toString() ? `/product-hpp?${queryParams.toString()}` : '/product-hpp';
    console.log('🔍 simpleApiProductHPP.getAll called with:', { params, endpoint });
    return makeSimpleApiRequest(endpoint);
  },
  getById: (id: string) => makeSimpleApiRequest(`/product-hpp/${id}`),
  create: (productData: any) => {
    console.log('🔍 simpleApiProductHPP.create called with:', productData);
    return makeSimpleApiRequest('/product-hpp', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  update: (id: string, updates: any) => {
    console.log('🔍 simpleApiProductHPP.update called with:', { id, updates });
    return makeSimpleApiRequest(`/product-hpp/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  delete: (id: string) => makeSimpleApiRequest(`/product-hpp/${id}`, {
    method: 'DELETE'
  }),
  deleteAll: () => makeSimpleApiRequest('/product-hpp', {
    method: 'DELETE'
  }),
  bulkImport: (data: { products: any[] }) => {
    console.log('🔍 simpleApiProductHPP.bulkImport called with:', { count: data.products.length });
    return makeSimpleApiRequest('/product-hpp/bulk-import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  search: (query: string) => makeSimpleApiRequest(`/product-hpp/search?q=${encodeURIComponent(query)}`)
};

// Unified API object for simple importing
export const simpleApiUtils = {
  // Core API functions
  fetchWithFallback: makeSimpleApiRequest,
  withRetry: withSimpleRetry,
  checkBackendHealth: checkSimpleBackendHealth,
  
  // Specific API modules
  brands: simpleApiBrands,
  categories: simpleApiCategories,
  customers: simpleApiCustomers,
  products: simpleApiProducts,
  sales: simpleApiSales,
  advertising: simpleApiAdvertising,
  cashFlow: simpleApiCashFlow,
  analytics: simpleApiAnalytics,
  
  // Helper functions
  createBackendUrl,
  createApiHeaders
};