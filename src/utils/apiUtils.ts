// API utilities for handling backend connections and errors

const BACKEND_URL = 'http://localhost:3001';
const API_TIMEOUT = 3000; // 3 seconds - reduced for faster failover to demo mode

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export class ApiConnectionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'ApiConnectionError';
  }
}

export class ApiTimeoutError extends Error {
  constructor(message: string = 'API request timeout') {
    super(message);
    this.name = 'ApiTimeoutError';
  }
}

export const createBackendUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
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

export const withTimeout = (promise: Promise<Response>, timeoutMs: number = API_TIMEOUT): Promise<Response> => {
  return Promise.race([
    promise,
    new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new ApiTimeoutError(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
};

export async function makeApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = createBackendUrl(endpoint);
    const headers = createApiHeaders(options.headers as Record<string, string>);
    
    console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await withTimeout(
      fetch(url, {
        ...options,
        headers
      })
    );
    
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn(`⚠️ Non-JSON response from ${url}:`, text.substring(0, 200));
      
      if (response.status === 404) {
        throw new ApiConnectionError(`API endpoint not found: ${endpoint}. Make sure backend is running.`);
      }
      
      throw new ApiConnectionError(`Invalid response format from backend (${response.status})`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ API Error ${response.status}:`, data);
      throw new ApiConnectionError(
        data.error || data.message || `API request failed (${response.status})`,
        new Error(`HTTP ${response.status}`)
      );
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
    console.log(`ℹ️ Backend unavailable for ${endpoint} - running in demo mode`);
    
    if (error instanceof ApiTimeoutError) {
      return {
        success: false,
        error: 'Request timeout - backend may not be running. Check if server is started.'
      };
    }
    
    if (error instanceof ApiConnectionError) {
      return {
        success: false,
        error: error.message
      };
    }
    
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
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

// Specific API functions for common endpoints
export const apiProducts = {
  getAll: () => makeApiRequest<any[]>('/products'),
  getById: (id: string) => makeApiRequest<any>(`/products/${id}`),
  create: (product: any) => makeApiRequest<any>('/products', {
    method: 'POST',
    body: JSON.stringify(product)
  }),
  update: (id: string, product: any) => makeApiRequest<any>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product)
  }),
  delete: (id: string) => makeApiRequest<void>(`/products/${id}`, {
    method: 'DELETE'
  }),
  getStats: () => makeApiRequest<any>('/products/stats'),
  search: (params: { q?: string; category?: string; brand?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.brand) queryParams.append('brand', params.brand);
    
    return makeApiRequest<any[]>(`/products/search?${queryParams.toString()}`);
  }
};

// Check if backend is reachable
export const checkBackendHealth = async (): Promise<{ 
  healthy: boolean; 
  error?: string; 
  details?: any 
}> => {
  try {
    const response = await withTimeout(
      fetch(`${BACKEND_URL}/health`, {
        headers: createApiHeaders()
      }),
      5000 // 5 second timeout for health check
    );
    
    if (response.ok) {
      const data = await response.json();
      return { 
        healthy: true, 
        details: data 
      };
    } else {
      return { 
        healthy: false, 
        error: `Health check returned ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    console.warn('Backend health check failed:', error);
    
    if (error instanceof ApiTimeoutError) {
      return { 
        healthy: false, 
        error: 'Backend health check timeout - server may not be running' 
      };
    }
    
    if (error instanceof Error && error.message.includes('fetch')) {
      return { 
        healthy: false, 
        error: 'Cannot reach backend server - make sure it\'s running on localhost:3001' 
      };
    }
    
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown health check error' 
    };
  }
};

// Retry logic for failed requests - optimized for fast demo mode fallback
export async function withRetry<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  maxRetries: number = 1, // Reduced for faster failover to demo mode
  delayMs: number = 500   // Short delay between retries
): Promise<ApiResponse<T>> {
  let lastError: ApiResponse<T> | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      if (result.success) {
        return result;
      }
      lastError = result;
    } catch (error) {
      lastError = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ Retrying API call in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return lastError || {
    success: false,
    error: 'All retry attempts failed'
  };
}

// Enhanced API wrapper with graceful fallback
export async function makeApiRequestWithFallback<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<ApiResponse<T>> {
  try {
    const result = await makeApiRequest<T>(endpoint, options);
    return result;
  } catch (error) {
    console.log(`💡 API call to ${endpoint} failed, using graceful fallback`);
    
    if (fallbackData !== undefined) {
      return {
        success: true,
        data: fallbackData,
        message: 'Demo mode - backend unavailable'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API call failed'
    };
  }
};