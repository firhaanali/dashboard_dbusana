// Safe environment variable access function
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    // For Vite environments - simplified approach
    const env = (window as any)?.process?.env || {};
    if (env[key]) {
      return env[key];
    }
    
    // Fallback to default value
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to access environment variable ${key}, using default:`, defaultValue);
    return defaultValue;
  }
};

// API Configuration with better backend detection
const DEFAULT_BACKEND_URL = 'http://localhost:3001'; // Backend server URL
const API_BASE_URL = getEnvVar('VITE_API_BASE_URL', `${DEFAULT_BACKEND_URL}/api`); // Direct to backend by default
const API_TIMEOUT = parseInt(getEnvVar('VITE_API_TIMEOUT', '30000'));
const BACKEND_URL = getEnvVar('VITE_BACKEND_URL', DEFAULT_BACKEND_URL); 

// Fallback to direct URLs if proxy is not available
const DIRECT_API_URL = 'http://localhost:3001/api';
const DIRECT_BACKEND_URL = 'http://localhost:3001';

// Environment configuration with better backend detection
export const apiConfig = {
  baseURL: API_BASE_URL,
  backendURL: BACKEND_URL,
  directBackendURL: DIRECT_BACKEND_URL,
  timeout: API_TIMEOUT,
  isDevelopment: getEnvVar('VITE_APP_ENV', 'development') === 'development',
  enableDebug: getEnvVar('VITE_ENABLE_DEBUG', 'false') === 'true',
  enableProxy: API_BASE_URL.startsWith('/'), // Auto-detect proxy usage
  maxFileSize: parseInt(getEnvVar('VITE_MAX_FILE_SIZE', '10485760')),
  allowedFileTypes: getEnvVar('VITE_ALLOWED_FILE_TYPES', '.xlsx,.xls,.csv'),
};

// Auth token management
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('auth_token');
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number; // For paginated or counted responses
  backendSuccess?: boolean; // Original backend success status
}

// Sales interfaces
export interface Sale {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  product_name: string;
  product_code: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  discount?: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'cancelled';
  sale_date: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  brand: string;
  colors: string[];
  sizes: string[];
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  created_at: string;
}

export interface DashboardStats {
  totalSales: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
  revenue: {
    today: number;
    monthly: number;
  };
  pendingSales: number;
}

export interface SalesChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsData {
  categories: Array<{
    category: string;
    revenue: number;
    quantity: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  stock: {
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalProducts: number;
  };
  customers: {
    totalCustomers: number;
    avgOrderValue: number;
    totalOrders: number;
  };
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseURL}${endpoint}`;
    
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        ...(options?.headers as HeadersInit),
      };

      // Only add Content-Type if not FormData
      if (!(options?.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      // Add development-only header for CORS compatibility
      headers['x-development-only'] = 'true';

      // Only add auth token for endpoints that require authentication
      // Skip auth for basic endpoints like /products, /sales, /dashboard
      const requiresAuth = endpoint.includes('/auth/') || endpoint.includes('/admin/') || endpoint.includes('/user/');
      if (token && requiresAuth) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`🔄 API Request: ${options?.method || 'GET'} ${fullUrl}`);

      const response = await fetch(fullUrl, {
        headers,
        ...options,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(API_TIMEOUT),
      });

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      // Handle non-JSON responses (like 404 HTML pages)
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle HTML/text responses
        const text = await response.text();
        console.warn(`⚠️ Non-JSON response from ${fullUrl}:`, text.substring(0, 200));
        
        if (response.status === 404) {
          return {
            success: false,
            error: `API endpoint not found: ${endpoint}`,
          };
        }
        
        return {
          success: false,
          error: `Unexpected response format from server (${response.status})`,
        };
      }

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data);
        
        // Handle auth errors
        if (response.status === 401) {
          clearAuthToken();
          // Don't redirect in dev environment - just log
          if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            window.location.href = '/login';
          }
        }
        
        return {
          success: false,
          error: data.error || data.message || `Request failed (${response.status})`,
        };
      }

      console.log(`✅ API Success:`, data);

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      // ✅ Enhanced error handling with better debugging
      console.error(`❌ API request failed: ${error}`);
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          console.warn(`⚠️ API request timeout for ${fullUrl} - backend may not be running`);
          return {
            success: false,
            error: 'Backend not available',
          };
        } else if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          console.warn(`⚠️ Network error for ${fullUrl} - backend not accessible`);
          return {
            success: false,
            error: 'Backend not available',
          };
        } else if (error.message.includes('JSON')) {
          console.warn(`⚠️ JSON parse error for ${fullUrl} - server returned non-JSON response`);
          return {
            success: false,
            error: 'Backend not available',
          };
        } else {
          console.error(`🚨 Unexpected API error for ${fullUrl}:`, error.message);
        }
      }
      
      return {
        success: false,
        error: `API request failed: ${error}`,
      };
    }
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    nama: string;
    jabatan?: string;
    role?: string;
  }): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Dashboard endpoints with graceful fallbacks
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await this.request<DashboardStats>('/dashboard/stats');
    
    // ✅ If backend not available, return zero values instead of error
    if (!response.success && response.error === 'Backend not available') {
      console.info('📊 Backend not available - returning zero dashboard stats');
      return {
        success: true,
        data: {
          totalSales: 0,
          totalProducts: 0,
          totalCustomers: 0,
          lowStockProducts: 0,
          revenue: {
            today: 0,
            monthly: 0,
          },
          pendingSales: 0,
        },
      };
    }
    
    return response;
  }

  async getSalesChart(period: '7days' | '30days' | '12months' = '7days'): Promise<ApiResponse<SalesChartData[]>> {
    const response = await this.request<SalesChartData[]>(`/dashboard/sales-chart?period=${period}`);
    
    // ✅ If backend not available, return empty chart data instead of error
    if (!response.success && response.error === 'Backend not available') {
      console.info('📈 Backend not available - returning empty chart data');
      return {
        success: true,
        data: [],
      };
    }
    
    return response;
  }

  async getTopProducts(limit = 10): Promise<ApiResponse<any[]>> {
    const response = await this.request<any[]>(`/dashboard/top-products?limit=${limit}`);
    
    // ✅ If backend not available, return empty array instead of error
    if (!response.success && response.error === 'Backend not available') {
      console.info('🏆 Backend not available - returning empty top products');
      return {
        success: true,
        data: [],
      };
    }
    
    return response;
  }

  async getRecentActivities(limit = 20): Promise<ApiResponse<any[]>> {
    const response = await this.request<any[]>(`/dashboard/recent-activities?limit=${limit}`);
    
    // ✅ If backend not available, return empty array instead of error
    if (!response.success && response.error === 'Backend not available') {
      console.info('🏃‍♂️ Backend not available - returning empty activities');
      return {
        success: true,
        data: [],
      };
    }
    
    return response;
  }

  async getAnalytics(): Promise<ApiResponse<AnalyticsData>> {
    const response = await this.request<AnalyticsData>('/dashboard/analytics');
    
    // ✅ If backend not available, return empty analytics instead of error
    if (!response.success && response.error === 'Backend not available') {
      console.info('📊 Backend not available - returning empty analytics');
      return {
        success: true,
        data: {
          categories: [],
          monthlyTrends: [],
          stock: {
            totalValue: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            totalProducts: 0,
          },
          customers: {
            totalCustomers: 0,
            avgOrderValue: 0,
            totalOrders: 0,
          },
        },
      };
    }
    
    return response;
  }

  // Sales endpoints
  async getSales(page = 1, limit = 50): Promise<ApiResponse<{ sales: Sale[]; total: number }>> {
    const response = await this.request<{ sales: Sale[]; total: number }>(`/sales?page=${page}&limit=${limit}`);
    
    // ✅ If backend not available, return empty sales data instead of error
    if (!response.success && response.error === 'Backend not available') {
      console.info('💰 Backend not available - returning empty sales data');
      return {
        success: true,
        data: {
          sales: [],
          total: 0,
        },
      };
    }
    
    return response;
  }

  async createSale(sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Sale>> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, sale: Partial<Sale>): Promise<ApiResponse<Sale>> {
    return this.request<Sale>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sale),
    });
  }

  async deleteSale(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/sales/${id}`, {
      method: 'DELETE',
    });
  }

  // Products endpoints - Enhanced for new backend with direct parsing
  async getProducts(): Promise<ApiResponse<any[]>> {
    try {
      const fullUrl = `${this.baseURL}/products`;
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Skip auth for products endpoint - it should be publicly accessible
      // Only add auth token for endpoints that require authentication
      const requiresAuth = false; // Products endpoint doesn't require auth
      if (token && requiresAuth) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`🔄 API Request: GET ${fullUrl}`);

      const res = await fetch(fullUrl, {
        headers,
        signal: AbortSignal.timeout(API_TIMEOUT),
      });

      console.log(`📡 API Response: ${res.status} ${res.statusText}`);

      // Handle non-JSON responses (like 404 HTML pages)
      const contentType = res.headers.get('content-type');
      let json;
      
      if (contentType && contentType.includes('application/json')) {
        json = await res.json();
      } else {
        // Handle HTML/text responses
        const text = await res.text();
        console.warn(`⚠️ Non-JSON response from ${fullUrl}:`, text.substring(0, 200));
        
        if (res.status === 404) {
          return {
            success: false,
            error: `API endpoint not found: /products`,
          };
        }
        
        return {
          success: false,
          error: `Unexpected response format from server (${res.status})`,
        };
      }

      if (!res.ok) {
        console.error(`❌ API Error ${res.status}:`, json);
        
        // Handle auth errors
        if (res.status === 401) {
          clearAuthToken();
          if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            window.location.href = '/login';
          }
        }
        
        return {
          success: false,
          error: json.error || json.message || `Request failed (${res.status})`,
        };
      }

      // ✅ Parse with json.data || [] to handle backend wrapper { success, data, count }
      const products = json.data || [];
      console.log(`✅ Products parsed:`, { total: products.length, hasMetadata: !!json.count });
      
      return {
        success: true,
        data: products,
        message: json.message,
        // Include metadata if available
        ...(json.count !== undefined && { count: json.count }),
        ...(json.success !== undefined && { backendSuccess: json.success }),
      };
    } catch (error) {
      // ✅ Enhanced error handling
      console.error(`❌ Products API request failed: ${error}`);
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          console.warn(`⚠️ Products API timeout - backend may not be running at ${this.baseURL}`);
          // Return empty products data instead of error
          console.info('📦 Backend not available - returning empty products data');
          return {
            success: true,
            data: [],
          };
        } else if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          console.warn(`⚠️ Products network error - backend not accessible at ${this.baseURL}`);
          // Return empty products data instead of error
          console.info('📦 Backend not available - returning empty products data');
          return {
            success: true,
            data: [],
          };
        }
      }
      
      return {
        success: false,
        error: `Products API request failed: ${error}`,
      };
    }
  }

  async getProductById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(product: any): Promise<ApiResponse<any>> {
    console.log('🆕 Creating product via API:', product);
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: Partial<any>): Promise<ApiResponse<any>> {
    console.log('🔄 Updating product via API:', { id, product });
    return this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse<any>> {
    console.log('🗑️ Deleting product via API:', id);
    return this.request<any>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async searchProducts(params: {
    q?: string;
    category?: string;
    brand?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.brand) queryParams.append('brand', params.brand);
    
    return this.request<any[]>(`/products/search?${queryParams.toString()}`);
  }

  async getProductStats(): Promise<ApiResponse<any>> {
    const response = await this.request<any>('/products/stats');
    
    // ✅ If backend not available, return default stats
    if (!response.success && response.error === 'Backend not available') {
      console.info('📊 Backend not available - returning default product stats');
      return {
        success: true,
        data: {
          totalProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          totalCategories: 0,
          totalBrands: 0,
          categories: [],
          brands: []
        },
      };
    }
    
    return response;
  }

  // Customers endpoints
  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    const response = await this.request<Customer[]>('/customers');
    
    // ✅ If backend not available, return empty customers data instead of error
    if (!response.success && response.error === 'Backend not available') {
      console.info('👥 Backend not available - returning empty customers data');
      return {
        success: true,
        data: [],
      };
    }
    
    return response;
  }

  // Import endpoints - Updated to match backend routes
  async importSalesFromExcel(file: File): Promise<ApiResponse<ImportResult>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<ImportResult>('/import/sales', {
      method: 'POST',
      body: formData,
    });
  }

  async importProductsFromExcel(file: File): Promise<ApiResponse<ImportResult>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<ImportResult>('/import/products', {
      method: 'POST',
      body: formData,
    });
  }

  async importStockFromExcel(file: File): Promise<ApiResponse<ImportResult>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<ImportResult>('/import/stock', {
      method: 'POST',
      body: formData,
    });
  }

  async downloadTemplate(type: 'sales' | 'products' | 'stock'): Promise<Response> {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${this.baseURL}/import/templates/${type}`, {
      headers,
    });
  }

  // Dashboard endpoints matching backend implementation
  async getDashboardMetrics(): Promise<ApiResponse<any>> {
    return this.request<any>('/dashboard/metrics');
  }

  async getChartData(period: '7d' | '30d' | '90d' = '30d'): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/dashboard/charts?period=${period}`);
  }

  async getCategorySales(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/dashboard/category-sales');
  }

  async getBrandPerformance(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/dashboard/brand-performance');
  }

  async getTopProductsAPI(limit = 10): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/dashboard/top-products?limit=${limit}`);
  }

  async getRecentActivitiesAPI(limit = 10): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/dashboard/recent-activities?limit=${limit}`);
  }

  async getKPISummary(): Promise<ApiResponse<any>> {
    return this.request<any>('/dashboard/kpi-summary');
  }

  async getDashboardOverview(): Promise<ApiResponse<any>> {
    return this.request<any>('/dashboard/overview');
  }

  // Import tracking endpoints
  async getImportStatus(batchId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/import/status/${batchId}`);
  }

  async getImportHistory(page = 1, limit = 10, type?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (type) params.append('type', type);
    
    return this.request<any>(`/import/history?${params.toString()}`);
  }

  // Marketplace Analytics endpoint
  async getMarketplaceAnalytics(): Promise<ApiResponse<any>> {
    const response = await this.request<any>('/dashboard/marketplace-analytics');
    
    // ✅ If backend not available, return empty marketplace data instead of error
    if (!response.success && response.error?.includes('Backend not available')) {
      console.info('🏪 Backend not available - returning empty marketplace data');
      return {
        success: true,
        data: {
          marketplaces: [],
          summary: {
            totalMarketplaces: 0,
            totalRevenue: 0,
            topMarketplace: 'Belum ada data',
            topMarketplaceRevenue: 0
          }
        },
      };
    }
    
    return response;
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// ✅ NO MORE MOCK DATA - Only real API calls

// ✅ Always use real API client - no mock fallback
export const api = apiClient;

// Helper function to show API connection status with enhanced debugging
export const getApiConnectionStatus = async (): Promise<boolean> => {
  console.log('🔍 API Connection Check:', {
    baseURL: API_BASE_URL,
    backendURL: BACKEND_URL,
    enableProxy: apiConfig.enableProxy,
    currentOrigin: window.location.origin
  });
  
  try {
    let healthUrl: string;
    
    // Try proxy endpoint first if enabled
    if (apiConfig.enableProxy) {
      healthUrl = '/health';
      console.log(`🔗 Trying proxy health check: ${healthUrl}`);
      try {
        const response = await fetch(healthUrl, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
          console.log('✅ Proxy health check successful');
          return true;
        }
        console.log('⚠️ Proxy health check failed:', response.status);
      } catch (proxyError) {
        console.log('⚠️ Proxy health check error:', proxyError);
      }
    }
    
    // Fallback to direct backend URL
    healthUrl = `${DIRECT_BACKEND_URL}/health`;
    console.log(`🔗 Trying direct health check: ${healthUrl}`);
    const response = await fetch(healthUrl, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      console.log('✅ Direct health check successful');
      return true;
    }
    
    console.log('❌ Direct health check failed:', response.status);
    return false;
  } catch (error) {
    console.log('❌ All health checks failed:', error);
    return false;
  }
};

// Debug function to check current API configuration
export const debugApiConfig = () => {
  console.log('🔧 Current API Configuration:', {
    ...apiConfig,
    currentURL: window.location.href,
    baseURL: API_BASE_URL,
    backendURL: BACKEND_URL,
    directBackendURL: DIRECT_BACKEND_URL,
    isProxy: apiConfig.enableProxy,
    environment: apiConfig.isDevelopment ? 'development' : 'production'
  });
};

// Helper functions to extract metadata from API responses
export const getResponseCount = (response: ApiResponse<any>): number => {
  return response.count || (Array.isArray(response.data) ? response.data.length : 0);
};

export const isBackendResponse = (response: ApiResponse<any>): boolean => {
  return response.backendSuccess !== undefined;
};

// ⛔ REMOVED: Auto-initialization on module load 
// This was causing multiple health checks when api.ts is imported by multiple components
// Health checks now only happen when components explicitly call getApiConnectionStatus()