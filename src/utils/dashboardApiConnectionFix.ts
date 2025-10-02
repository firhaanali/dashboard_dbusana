import { SimpleApiResponse } from './simpleApiUtils';

const BACKEND_URL = 'http://localhost:3001';

// ✅ Enhanced Dashboard API Client with direct database connection
export class DashboardApiClient {
  private static instance: DashboardApiClient;
  private baseUrl: string;
  private isHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private readonly healthCheckInterval = 30000; // 30 seconds

  private constructor() {
    this.baseUrl = BACKEND_URL;
    this.initializeConnection();
  }

  public static getInstance(): DashboardApiClient {
    if (!DashboardApiClient.instance) {
      DashboardApiClient.instance = new DashboardApiClient();
    }
    return DashboardApiClient.instance;
  }

  private async initializeConnection(): Promise<void> {
    console.log('🔌 Initializing dashboard API connection...');
    await this.checkHealth();
  }

  private async checkHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent
    if (now - this.lastHealthCheck < this.healthCheckInterval && this.isHealthy) {
      return this.isHealthy;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/sales?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      this.isHealthy = response.ok;
      this.lastHealthCheck = now;

      if (this.isHealthy) {
        console.log('✅ Backend connection established:', {
          status: 'online',
          endpoint: '/api/sales',
          responseStatus: response.status
        });
      } else {
        console.warn('⚠️ Backend health check failed:', response.status, response.statusText);
      }

      return this.isHealthy;
    } catch (error) {
      console.error('❌ Backend health check error:', error instanceof Error ? error.message : error);
      this.isHealthy = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  private async makeRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<SimpleApiResponse<T>> {
    // Ensure backend is healthy before making requests
    if (!this.isHealthy) {
      const healthCheck = await this.checkHealth();
      if (!healthCheck) {
        return {
          success: false,
          error: 'Backend server is not responding. Please start the backend server:\n1. Open terminal\n2. cd backend\n3. npm start'
        };
      }
    }

    try {
      const url = `${this.baseUrl}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      
      console.log(`📊 Dashboard API Request: ${options.method || 'GET'} ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true',
          ...options.headers
        },
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      console.log(`📡 Dashboard API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Dashboard API Error ${response.status}:`, errorText);
        
        // Mark as unhealthy if we get server errors
        if (response.status >= 500) {
          this.isHealthy = false;
        }

        return {
          success: false,
          error: `API request failed (${response.status}): ${errorText}`
        };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.warn('🔶 Non-JSON response received:', text.substring(0, 200));
        return {
          success: false,
          error: 'Invalid response format from backend'
        };
      }

      const data = await response.json();
      
      console.log('✅ Dashboard API Success:', {
        endpoint,
        hasData: !!data.data,
        dataSize: data.data ? Object.keys(data.data).length : 0
      });

      return {
        success: true,
        data: data.data || data,
        message: data.message,
        count: data.count
      };

    } catch (error) {
      console.error(`❌ Dashboard API request failed for ${endpoint}:`, error);
      
      // Mark as unhealthy on network errors
      if (error instanceof Error && (
        error.name === 'AbortError' || 
        error.message.includes('fetch') || 
        error.message.includes('NetworkError')
      )) {
        this.isHealthy = false;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ✅ Dashboard-specific API methods
  public async getDashboardMetrics(): Promise<SimpleApiResponse> {
    return this.makeRequest('/dashboard/metrics');
  }

  public async getMarketplaceAnalytics(): Promise<SimpleApiResponse> {
    return this.makeRequest('/dashboard/marketplace-analytics');
  }

  public async getChartData(period?: string): Promise<SimpleApiResponse> {
    const endpoint = period ? `/dashboard/charts?period=${period}` : '/dashboard/charts';
    return this.makeRequest(endpoint);
  }

  public async getKPISummary(): Promise<SimpleApiResponse> {
    return this.makeRequest('/dashboard/kpi-summary');
  }

  public async getRecentActivities(limit?: number): Promise<SimpleApiResponse> {
    const endpoint = limit ? `/dashboard/recent-activities?limit=${limit}` : '/dashboard/recent-activities';
    return this.makeRequest(endpoint);
  }

  public async getTopProducts(limit?: number): Promise<SimpleApiResponse> {
    const endpoint = limit ? `/dashboard/top-products?limit=${limit}` : '/dashboard/top-products';
    return this.makeRequest(endpoint);
  }

  public async getCategorySales(): Promise<SimpleApiResponse> {
    return this.makeRequest('/dashboard/category-sales');
  }

  public async getBrandPerformance(): Promise<SimpleApiResponse> {
    return this.makeRequest('/dashboard/brand-performance');
  }

  // ✅ Sales data API methods
  public async getSalesData(params?: { page?: number; limit?: number }): Promise<SimpleApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = queryParams.toString() ? `/sales?${queryParams.toString()}` : '/sales';
    return this.makeRequest(endpoint);
  }

  public async getSalesStats(): Promise<SimpleApiResponse> {
    return this.makeRequest('/sales/stats');
  }

  // ✅ Test connection method
  public async testConnection(): Promise<{ healthy: boolean; message: string; details?: any }> {
    console.log('🧪 Testing dashboard API connection...');
    
    try {
      const healthCheck = await this.checkHealth();
      if (!healthCheck) {
        return {
          healthy: false,
          message: 'Backend server is not responding'
        };
      }

      // Test dashboard metrics endpoint
      const metricsTest = await this.getDashboardMetrics();
      if (!metricsTest.success) {
        return {
          healthy: false,
          message: 'Dashboard metrics endpoint failed',
          details: metricsTest.error
        };
      }

      return {
        healthy: true,
        message: 'Dashboard API connection is working',
        details: {
          hasMetrics: !!metricsTest.data,
          dataKeys: metricsTest.data ? Object.keys(metricsTest.data) : []
        }
      };

    } catch (error) {
      return {
        healthy: false,
        message: 'Connection test failed',
        details: error instanceof Error ? error.message : error
      };
    }
  }
}

// ✅ Export singleton instance
export const dashboardApi = DashboardApiClient.getInstance();

// ✅ Simple hook for React components
export const useDashboardApi = () => {
  return {
    api: dashboardApi,
    getDashboardMetrics: () => dashboardApi.getDashboardMetrics(),
    getMarketplaceAnalytics: () => dashboardApi.getMarketplaceAnalytics(),
    getChartData: (period?: string) => dashboardApi.getChartData(period),
    getKPISummary: () => dashboardApi.getKPISummary(),
    testConnection: () => dashboardApi.testConnection()
  };
};