/**
 * 🔧 ENHANCED API CLIENT
 * 
 * Improved API client with comprehensive error handling,
 * automatic fallback data, and connection management.
 */

import { backendResolver } from '../utils/backendConnectionResolver';
import { fallbackDataGenerator } from '../utils/comprehensiveFallbackData';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class EnhancedApiClient {
  private baseUrl = 'http://localhost:3001';
  private timeout = 10000; // 10 seconds

  constructor() {
    // Initialize backend resolver if not already done
    if (typeof window !== 'undefined') {
      backendResolver.initialize();
    }
  }

  /**
   * Enhanced API request with automatic fallback
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    useFallback = true
  ): Promise<ApiResponse<T>> {
    try {
      // Check if backend is available
      if (!backendResolver.isOnline()) {
        console.warn(`⚠️ Backend offline - ${endpoint}`);
        if (useFallback) {
          const fallbackData = fallbackDataGenerator.getFallbackForEndpoint(endpoint, {
            useCachedData: true,
            dataVariation: 'rich'
          });
          if (fallbackData) {
            console.log(`📋 Using fallback data for ${endpoint}`);
            return { success: true, data: fallbackData };
          }
        }
        return { success: false, error: 'Backend not available' };
      }

      // Use backend resolver for the request
      const response = await backendResolver.apiRequest<T>(endpoint, options);
      
      if (response) {
        return { success: true, data: response };
      } else {
        // If request failed but we should use fallback
        if (useFallback) {
          const fallbackData = fallbackDataGenerator.getFallbackForEndpoint(endpoint, {
            useCachedData: true,
            dataVariation: 'rich'
          });
          if (fallbackData) {
            console.log(`📋 API failed, using fallback data for ${endpoint}`);
            return { success: true, data: fallbackData };
          }
        }
        return { success: false, error: 'Request failed' };
      }
    } catch (error) {
      console.error(`❌ API request error for ${endpoint}:`, error);
      
      // Try fallback on error
      if (useFallback) {
        const fallbackData = fallbackDataGenerator.getFallbackForEndpoint(endpoint, {
          useCachedData: true,
          dataVariation: 'rich'
        });
        if (fallbackData) {
          console.log(`📋 Error occurred, using fallback data for ${endpoint}`);
          return { success: true, data: fallbackData };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Dashboard API Methods
   */
  async getDashboardMetrics(): Promise<ApiResponse<any>> {
    return this.makeRequest('/dashboard/metrics');
  }

  async getMarketplaceAnalytics(): Promise<ApiResponse<any>> {
    return this.makeRequest('/analytics/marketplace');
  }

  async getMonthlyTrends(): Promise<ApiResponse<any>> {
    return this.makeRequest('/monthly-trends');
  }

  /**
   * Sales API Methods
   */
  async getSales(page = 1, limit = 50): Promise<ApiResponse<any>> {
    return this.makeRequest(`/sales?page=${page}&limit=${limit}`);
  }

  async getSalesStats(): Promise<ApiResponse<any>> {
    return this.makeRequest('/sales/marketplace-stats');
  }

  async createSale(saleData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    }, false); // Don't use fallback for create operations
  }

  /**
   * Products API Methods
   */
  async getProducts(): Promise<ApiResponse<any>> {
    return this.makeRequest('/products');
  }

  async createProduct(productData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    }, false); // Don't use fallback for create operations
  }

  async updateProduct(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }, false); // Don't use fallback for update operations
  }

  /**
   * Advertising API Methods
   */
  async getAdvertisingData(dateStart?: string): Promise<ApiResponse<any>> {
    const endpoint = dateStart ? `/advertising?date_start=${encodeURIComponent(dateStart)}` : '/advertising';
    return this.makeRequest(endpoint);
  }

  async getAdvertisingStats(): Promise<ApiResponse<any>> {
    return this.makeRequest('/advertising/stats');
  }

  /**
   * Activity Logs API Methods
   */
  async getActivityLogs(limit = 5, sort = 'created_at', order = 'desc'): Promise<ApiResponse<any>> {
    return this.makeRequest(`/activity-logs?limit=${limit}&sort=${sort}&order=${order}`);
  }

  /**
   * Cash Flow API Methods
   */
  async getCashFlowEntries(entryType?: string, limit = 1000): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (entryType) params.append('entry_type', entryType);
    if (limit) params.append('limit', limit.toString());
    
    return this.makeRequest(`/cash-flow/entries?${params.toString()}`);
  }

  /**
   * Import API Methods
   */
  async importSalesFromExcel(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.makeRequest('/import/sales', {
      method: 'POST',
      body: formData
    }, false); // Don't use fallback for import operations
  }

  async importProductsFromExcel(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.makeRequest('/import/products', {
      method: 'POST',
      body: formData
    }, false); // Don't use fallback for import operations
  }

  /**
   * Template Download Methods
   */
  async downloadTemplate(type: 'sales' | 'products' | 'stock'): Promise<Response> {
    const url = `${this.baseUrl}/api/templates/${type}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Template download failed for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Connection Management
   */
  async checkConnection(): Promise<boolean> {
    return await backendResolver.forceCheck();
  }

  getConnectionStatus() {
    return backendResolver.getStatus();
  }

  isOnline(): boolean {
    return backendResolver.isOnline();
  }

  /**
   * Cache Management
   */
  clearFallbackCache() {
    fallbackDataGenerator.clearCache();
  }

  getFallbackCacheInfo() {
    return fallbackDataGenerator.getCacheInfo();
  }

  /**
   * Error Recovery
   */
  async retryFailedRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    maxRetries = 3
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for ${endpoint}`);
        
        // Wait a bit between retries (exponential backoff)
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
        
        const result = await this.makeRequest<T>(endpoint, options, false);
        if (result.success) {
          console.log(`✅ Retry successful for ${endpoint} on attempt ${attempt}`);
          return result;
        }
        
        lastError = new Error(result.error || 'Request failed');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`❌ Retry attempt ${attempt} failed for ${endpoint}:`, lastError.message);
      }
    }
    
    // All retries failed, return fallback if available
    const fallbackData = fallbackDataGenerator.getFallbackForEndpoint(endpoint, {
      useCachedData: true,
      dataVariation: 'rich'
    });
    
    if (fallbackData) {
      console.log(`📋 All retries failed, using fallback data for ${endpoint}`);
      return { success: true, data: fallbackData };
    }
    
    return {
      success: false,
      error: lastError?.message || 'All retry attempts failed'
    };
  }
}

// Create singleton instance
export const enhancedApiClient = new EnhancedApiClient();

export default enhancedApiClient;