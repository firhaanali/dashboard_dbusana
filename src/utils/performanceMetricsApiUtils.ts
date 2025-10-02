/**
 * Performance Metrics API Utilities
 * Optimized API calls for Performance Metrics with fast failover
 */

import { ApiResponse, createBackendUrl, createApiHeaders } from './apiUtils';
import { simpleApiSales, simpleApiProducts } from './simpleApiUtils';
import { makeRateLimitedRequest } from './rateLimitManager';

const PERFORMANCE_API_TIMEOUT = 3000; // 3 seconds - very fast timeout
const MAX_RETRIES = 0; // No retries for instant failover

export class PerformanceMetricsApiError extends Error {
  constructor(message: string, public isConnectionError: boolean = false) {
    super(message);
    this.name = 'PerformanceMetricsApiError';
  }
}

export async function makePerformanceApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return makeRateLimitedRequest(endpoint, async () => {
    try {
      const url = createBackendUrl(endpoint);
      const headers = createApiHeaders(options.headers as Record<string, string>);
      
      console.log(`⚡ Performance API Request: ${options.method || 'GET'} ${url}`);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PERFORMANCE_API_TIMEOUT);
      
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log(`⚡ Performance API Response: ${response.status} ${response.statusText}`);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new PerformanceMetricsApiError(`Invalid response format (${response.status})`, true);
        }
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error(`❌ Performance API Error ${response.status}:`, data);
          throw new PerformanceMetricsApiError(
            data.error || data.message || `API request failed (${response.status})`,
            response.status >= 500 || response.status === 0
          );
        }
        
        console.log(`✅ Performance API Success:`, { 
          endpoint, 
          dataType: Array.isArray(data.data) ? `array[${data.data.length}]` : typeof data.data
        });
        
        return {
          success: true,
          data: data.data || data,
          message: data.message,
          count: data.count
        };
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            throw new PerformanceMetricsApiError('Request timeout - backend too slow', true);
          }
          
          if (fetchError.message.includes('fetch') || 
              fetchError.message.includes('NetworkError') || 
              fetchError.message.includes('Failed to fetch') ||
              fetchError.message.includes('ERR_NETWORK') ||
              fetchError.message.includes('ERR_CONNECTION')) {
            throw new PerformanceMetricsApiError('Cannot connect to backend', true);
          }
        }
        
        throw fetchError;
      }
      
    } catch (error) {
      console.warn(`⚠️ Performance API request failed for ${endpoint}:`, error);
      
      if (error instanceof PerformanceMetricsApiError) {
        return {
          success: false,
          error: error.message,
          isConnectionError: error.isConnectionError
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isConnectionError: true
      };
    }
  });
}

export interface PerformanceDataResponse {
  sales: ApiResponse<any>;
  products: ApiResponse<any>;
  source: 'live' | 'demo';
}

export async function fetchPerformanceData(): Promise<PerformanceDataResponse> {
  console.log('🎯 Fetching performance data with fast failover...');
  
  try {
    // Try primary API with very short timeout
    const [salesResult, productsResult] = await Promise.all([
      makePerformanceApiRequest<any>('/sales'),
      makePerformanceApiRequest<any>('/products')
    ]);
    
    // Check if both succeeded
    if (salesResult.success && productsResult.success) {
      console.log('✅ Performance data from live backend');
      return {
        sales: salesResult,
        products: productsResult,
        source: 'live'
      };
    }
    
    // If either failed, throw to trigger fallback
    throw new Error('Primary API partially failed');
    
  } catch (primaryError) {
    console.warn('🔄 Primary API failed, using enhanced demo data...', primaryError);
    
    // Immediate fallback to demo data from simpleApiUtils
    try {
      const [demoSales, demoProducts] = await Promise.all([
        simpleApiSales.getAll(),
        simpleApiProducts.getAll()
      ]);
      
      console.log('🎭 Performance data from demo');
      
      return {
        sales: {
          success: true,
          data: demoSales.data,
          count: demoSales.count
        },
        products: {
          success: true,
          data: demoProducts.data,
          count: demoProducts.count
        },
        source: 'demo'
      };
      
    } catch (demoError) {
      console.error('❌ Demo data also failed:', demoError);
      throw new Error('All data sources failed');
    }
  }
}

// Helper functions
async function getSalesWithFallback() {
  const result = await makePerformanceApiRequest<any>('/sales');
  if (!result.success) {
    const fallback = await simpleApiSales.getAll();
    return {
      success: true,
      data: fallback.data,
      count: fallback.count,
      source: 'demo'
    };
  }
  return { ...result, source: 'live' };
}

async function getProductsWithFallback() {
  const result = await makePerformanceApiRequest<any>('/products');
  if (!result.success) {
    const fallback = await simpleApiProducts.getAll();
    return {
      success: true,
      data: fallback.data,
      count: fallback.count,
      source: 'demo'
    };
  }
  return { ...result, source: 'live' };
}

async function checkHealthWithLatency(): Promise<{ healthy: boolean; latency?: number }> {
  const start = Date.now();
  try {
    const result = await makePerformanceApiRequest('/test');
    const latency = Date.now() - start;
    return { healthy: result.success, latency };
  } catch {
    return { healthy: false };
  }
}

// Specific optimized endpoints for Performance Metrics
export const performanceMetricsApi = {
  // Get all data needed for performance metrics in one call
  getAllData: fetchPerformanceData,
  
  // Individual endpoints with fast failover
  getSales: getSalesWithFallback,
  getProducts: getProductsWithFallback,
  
  // Health check with very fast timeout
  checkHealth: checkHealthWithLatency
};

// Add to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceMetricsApi = performanceMetricsApi;
  console.log('⚡ Performance Metrics API available at window.performanceMetricsApi');
}