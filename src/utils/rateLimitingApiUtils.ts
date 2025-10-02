/**
 * Rate Limiting API Utils
 * Prevents CORS and 429 errors by controlling request flow
 */

import { unifiedApi } from '../services/unified-api';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 2,
  REQUEST_DELAY: 500, // ms between requests
  MAX_RETRIES: 1, // Reduced from 3 to prevent spam
  RETRY_DELAY: 2000, // ms between retries
  TIMEOUT: 10000 // ms request timeout
};

// Request queue and tracking
let activeRequests = 0;
let requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;

// Request tracking for debugging
const requestLog = {
  total: 0,
  successful: 0,
  failed: 0,
  rateLimited: 0,
  corsError: 0
};

/**
 * Process request queue with rate limiting
 */
async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0 && activeRequests < RATE_LIMIT_CONFIG.MAX_CONCURRENT_REQUESTS) {
    const request = requestQueue.shift();
    if (request) {
      activeRequests++;
      
      try {
        await request();
      } catch (error) {
        console.warn('⚠️ Queued request failed:', error);
      } finally {
        activeRequests--;
        
        // Add delay between requests
        if (requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.REQUEST_DELAY));
        }
      }
    }
  }

  isProcessingQueue = false;

  // Continue processing if queue has items
  if (requestQueue.length > 0) {
    setTimeout(processRequestQueue, RATE_LIMIT_CONFIG.REQUEST_DELAY);
  }
}

/**
 * Add request to queue
 */
function queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const wrappedRequest = async () => {
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    requestQueue.push(wrappedRequest);
    processRequestQueue();
  });
}

/**
 * Safe API wrapper with rate limiting and error handling
 */
export class RateLimitedApiClient {
  private static instance: RateLimitedApiClient;

  static getInstance(): RateLimitedApiClient {
    if (!RateLimitedApiClient.instance) {
      RateLimitedApiClient.instance = new RateLimitedApiClient();
    }
    return RateLimitedApiClient.instance;
  }

  private async makeRateLimitedRequest<T>(
    apiCall: () => Promise<any>,
    context: string
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    requestLog.total++;

    try {
      // Check if we should queue this request
      if (activeRequests >= RATE_LIMIT_CONFIG.MAX_CONCURRENT_REQUESTS) {
        console.log(`🚦 Rate limiting: Queueing request for ${context}`);
        const result = await queueRequest(apiCall);
        return this.handleResponse(result, context);
      }

      // Execute request immediately
      activeRequests++;
      console.log(`🔄 API Request: ${context} (Active: ${activeRequests}/${RATE_LIMIT_CONFIG.MAX_CONCURRENT_REQUESTS})`);

      const result = await Promise.race([
        apiCall(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), RATE_LIMIT_CONFIG.TIMEOUT)
        )
      ]);

      return this.handleResponse(result, context);

    } catch (error) {
      requestLog.failed++;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Categorize errors
      if (errorMessage.includes('CORS')) {
        requestLog.corsError++;
        console.error(`❌ CORS Error in ${context}:`, errorMessage);
        return {
          success: false,
          error: 'Backend connection issue (CORS). Please check if backend is running.'
        };
      }
      
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        requestLog.rateLimited++;
        console.error(`❌ Rate Limited in ${context}:`, errorMessage);
        return {
          success: false,
          error: 'Too many requests. Please wait a moment and try again.'
        };
      }

      if (errorMessage.includes('timeout')) {
        console.error(`❌ Timeout in ${context}:`, errorMessage);
        return {
          success: false,
          error: 'Request timeout. Backend may be slow or unavailable.'
        };
      }

      console.error(`❌ API Error in ${context}:`, errorMessage);
      return {
        success: false,
        error: errorMessage
      };

    } finally {
      activeRequests--;
    }
  }

  private handleResponse(result: any, context: string) {
    if (result && result.success) {
      requestLog.successful++;
      console.log(`✅ API Success: ${context}`);
      return {
        success: true,
        data: result.data,
        count: result.count
      };
    } else if (result && result.success === false) {
      return {
        success: false,
        error: result.error || 'API request failed'
      };
    } else {
      // Handle direct data responses (legacy compatibility)
      requestLog.successful++;
      return {
        success: true,
        data: result
      };
    }
  }

  // Safe API methods
  async getSales(params?: { page?: number; limit?: number }) {
    return this.makeRateLimitedRequest(
      () => unifiedApi.sales.getAll(params),
      'Sales Data'
    );
  }

  async getProducts(params?: { page?: number; limit?: number }) {
    return this.makeRateLimitedRequest(
      () => unifiedApi.products.getAll(params),
      'Products Data'
    );
  }

  async getDashboardMetrics() {
    return this.makeRateLimitedRequest(
      () => unifiedApi.dashboard.getMetrics(),
      'Dashboard Metrics'
    );
  }

  async getDashboardOverview() {
    return this.makeRateLimitedRequest(
      () => unifiedApi.dashboard.getOverview(),
      'Dashboard Overview'
    );
  }

  async getMarketplaceAnalytics() {
    return this.makeRateLimitedRequest(
      () => unifiedApi.dashboard.getMarketplaceAnalytics(),
      'Marketplace Analytics'
    );
  }

  async getCategories() {
    return this.makeRateLimitedRequest(
      () => unifiedApi.categories.getAll(),
      'Categories'
    );
  }

  async getBrands() {
    return this.makeRateLimitedRequest(
      () => unifiedApi.brands.getAll(),
      'Brands'
    );
  }

  // Utility methods
  getRequestStats() {
    return {
      ...requestLog,
      activeRequests,
      queueLength: requestQueue.length,
      successRate: requestLog.total > 0 ? (requestLog.successful / requestLog.total * 100).toFixed(1) + '%' : '0%'
    };
  }

  clearRequestQueue() {
    requestQueue = [];
    console.log('🗑️ Request queue cleared');
  }

  // Emergency stop for debugging
  emergencyStop() {
    requestQueue = [];
    activeRequests = 0;
    isProcessingQueue = false;
    console.log('🛑 Emergency stop: All requests cleared');
  }
}

// Create singleton instance
export const rateLimitedApi = RateLimitedApiClient.getInstance();

// Add to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).rateLimitedApi = rateLimitedApi;
  console.log('🔧 Rate Limited API available at window.rateLimitedApi');
  console.log('💡 Commands: .getRequestStats(), .clearRequestQueue(), .emergencyStop()');
}

// Export convenience functions
export const safeApiCalls = {
  getSales: (params?: { page?: number; limit?: number }) => rateLimitedApi.getSales(params),
  getProducts: (params?: { page?: number; limit?: number }) => rateLimitedApi.getProducts(params),
  getDashboardMetrics: () => rateLimitedApi.getDashboardMetrics(),
  getDashboardOverview: () => rateLimitedApi.getDashboardOverview(),
  getMarketplaceAnalytics: () => rateLimitedApi.getMarketplaceAnalytics(),
  getCategories: () => rateLimitedApi.getCategories(),
  getBrands: () => rateLimitedApi.getBrands(),
};

export default rateLimitedApi;