/**
 * Unified API Client for D'Busana Dashboard
 * Consolidates all API patterns into a single, consistent interface
 */

// Configuration
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3001';
const API_BASE_URL = `${BACKEND_URL}/api`;
const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// Unified API Client Class
class UnifiedApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'x-development-only': 'true'
    };
  }

  /**
   * Make HTTP request with unified error handling and retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES, headers = {}, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;
    
    let lastError: Error | null = null;
    
    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 API Request: ${fetchOptions.method || 'GET'} ${url}${attempt > 0 ? ` (retry ${attempt})` : ''}`);
        
        // Setup request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...this.defaultHeaders,
            ...headers
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle response
        const result = await this.handleResponse<T>(response, url);
        
        if (result.success || attempt === retries) {
          return result;
        }
        
        // If not successful and we have retries left, continue
        lastError = new Error(result.error || 'Request failed');
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on certain errors
        if (lastError.name === 'AbortError' && attempt < retries) {
          console.log(`⏳ Request timeout, retrying... (${attempt + 1}/${retries})`);
          await this.delay(1000 * (attempt + 1));
          continue;
        }
        
        if (attempt === retries) {
          break;
        }
        
        await this.delay(1000 * (attempt + 1));
      }
    }
    
    // All retries failed
    return this.createErrorResponse(lastError || new Error('All retries failed'));
  }

  /**
   * Handle HTTP response with proper error parsing
   */
  private async handleResponse<T>(response: Response, url: string): Promise<ApiResponse<T>> {
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn(`⚠️ Non-JSON response from ${url}:`, text.substring(0, 200));
      
      if (response.status === 404) {
        return {
          success: false,
          error: 'API endpoint not found - make sure backend is running'
        };
      }
      
      return {
        success: false,
        error: `Invalid response format (${response.status})`
      };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ API Error ${response.status}:`, data);
      return {
        success: false,
        error: data.error || data.message || `Request failed (${response.status})`,
        data: data.data // Include error details if available
      };
    }
    
    console.log(`✅ API Success:`, {
      endpoint: url.replace(this.baseUrl, ''),
      dataType: Array.isArray(data.data) ? `array[${data.data.length}]` : typeof data.data,
      hasCount: !!data.count
    });
    
    return {
      success: true,
      data: data.data || data,
      message: data.message,
      count: data.count
    };
  }

  /**
   * Create consistent error response
   */
  private createErrorResponse(error: Error): ApiResponse {
    console.error('❌ API Request Failed:', error);
    
    let errorMessage = 'Request failed';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - backend may be slow or unavailable';
    } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      errorMessage = 'Cannot connect to backend - make sure server is running';
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid server response format';
    } else {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const requestOptions: RequestInit & RequestOptions = {
      ...options,
      method: 'POST'
    };

    if (body instanceof FormData) {
      // Don't set Content-Type for FormData, let browser set it with boundary
      delete requestOptions.headers?.['Content-Type'];
      requestOptions.body = body;
    } else if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    return this.makeRequest<T>(endpoint, requestOptions);
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }
}

// Create unified API client instance
const unifiedClient = new UnifiedApiClient(API_BASE_URL);

// API Modules
export const salesApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = queryParams.toString() ? `/sales?${queryParams.toString()}` : '/sales';
    return unifiedClient.get(endpoint);
  },
  
  getStats: () => unifiedClient.get('/sales/stats'),
  
  getChartData: (period?: string) => {
    const queryParams = period ? `?period=${period}` : '';
    return unifiedClient.get(`/sales/chart-data${queryParams}`);
  },
  
  importFromFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return unifiedClient.post('/import/sales', formData, { timeout: 30000 });
  }
};

export const productsApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = queryParams.toString() ? `/products?${queryParams.toString()}` : '/products';
    return unifiedClient.get(endpoint);
  },
  
  getById: (id: string) => unifiedClient.get(`/products/${id}`),
  
  create: (product: any) => unifiedClient.post('/products', product),
  
  update: (id: string, product: any) => unifiedClient.put(`/products/${id}`, product),
  
  delete: (id: string) => unifiedClient.delete(`/products/${id}`),
  
  getStats: () => unifiedClient.get('/products/stats'),
  
  search: (params: { q?: string; category?: string; brand?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.brand) queryParams.append('brand', params.brand);
    
    return unifiedClient.get(`/products/search?${queryParams.toString()}`);
  }
};

export const dashboardApi = {
  getMetrics: () => unifiedClient.get('/dashboard/metrics'),
  
  getKPISummary: () => unifiedClient.get('/dashboard/kpi-summary'),
  
  getChartData: (period?: string) => {
    const queryParams = period ? `?period=${period}` : '';
    return unifiedClient.get(`/dashboard/charts${queryParams}`);
  },
  
  getCategorySales: () => unifiedClient.get('/dashboard/category-sales'),
  
  getBrandPerformance: () => unifiedClient.get('/dashboard/brand-performance'),
  
  getTopProducts: (limit?: number) => {
    const queryParams = limit ? `?limit=${limit}` : '';
    return unifiedClient.get(`/dashboard/top-products${queryParams}`);
  },
  
  getRecentActivities: (limit?: number) => {
    const queryParams = limit ? `?limit=${limit}` : '';
    return unifiedClient.get(`/dashboard/recent-activities${queryParams}`);
  },
  
  getOverview: () => unifiedClient.get('/dashboard/overview'),
  
  getMarketplaceAnalytics: () => unifiedClient.get('/dashboard/marketplace-analytics')
};

export const categoriesApi = {
  getAll: () => unifiedClient.get('/categories'),
  getById: (id: string) => unifiedClient.get(`/categories/${id}`),
  create: (category: any) => unifiedClient.post('/categories', category),
  update: (id: string, category: any) => unifiedClient.put(`/categories/${id}`, category),
  delete: (id: string) => unifiedClient.delete(`/categories/${id}`),
  getStats: () => unifiedClient.get('/categories/stats')
};

export const brandsApi = {
  getAll: () => unifiedClient.get('/brands'),
  getById: (id: string) => unifiedClient.get(`/brands/${id}`),
  create: (brand: any) => unifiedClient.post('/brands', brand),
  update: (id: string, brand: any) => unifiedClient.put(`/brands/${id}`, brand),
  delete: (id: string) => unifiedClient.delete(`/brands/${id}`),
  getStats: () => unifiedClient.get('/brands/stats')
};

export const stockApi = {
  getMovements: (params?: { page?: number; limit?: number; productCode?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.productCode) queryParams.append('productCode', params.productCode);
    
    const endpoint = queryParams.toString() ? `/stock/movements?${queryParams.toString()}` : '/stock/movements';
    return unifiedClient.get(endpoint);
  },
  
  createMovement: (movement: {
    product_code: string;
    movement_type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reference_number?: string;
    notes?: string;
  }) => unifiedClient.post('/stock/movements', movement),
  
  getStats: () => unifiedClient.get('/stock/stats'),
  
  updateProductStock: (productId: string, stockData: { stock_quantity: number; notes?: string }) => 
    unifiedClient.put(`/stock/products/${productId}/stock`, stockData)
};

export const importApi = {
  uploadSales: (file: File) => salesApi.importFromFile(file),
  
  getImportHistory: (params?: { page?: number; limit?: number; type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    
    const endpoint = queryParams.toString() ? `/import/history?${queryParams.toString()}` : '/import/history';
    return unifiedClient.get(endpoint);
  },
  
  getImportStatus: (batchId: string) => unifiedClient.get(`/import/status/${batchId}`)
};

// Health check utility
export const healthCheck = {
  ping: () => unifiedClient.get('/status'),
  
  fullCheck: async () => {
    try {
      const healthUrl = `${BACKEND_URL}/health`;
      const response = await fetch(healthUrl, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data,
          connected: true
        };
      }
      
      return {
        success: false,
        error: `Health check failed (${response.status})`,
        connected: false
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        connected: false
      };
    }
  }
};

// Export unified API as default
export const unifiedApi = {
  sales: salesApi,
  products: productsApi,
  dashboard: dashboardApi,
  categories: categoriesApi,
  brands: brandsApi,
  stock: stockApi,
  import: importApi,
  health: healthCheck
};

export default unifiedApi;