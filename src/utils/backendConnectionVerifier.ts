// ✅ Backend Connection Verifier and Auto-Fix Utility
export interface BackendStatus {
  isRunning: boolean;
  isHealthy: boolean;
  hasData: boolean;
  port: number;
  message: string;
  details?: any;
  errors?: string[];
}

export class BackendConnectionVerifier {
  private static instance: BackendConnectionVerifier;
  private baseUrl: string = 'http://localhost:3001';
  private lastCheck: number = 0;
  private checkInterval: number = 60000; // 1 minute
  private cachedStatus: BackendStatus | null = null;

  private constructor() {}

  public static getInstance(): BackendConnectionVerifier {
    if (!BackendConnectionVerifier.instance) {
      BackendConnectionVerifier.instance = new BackendConnectionVerifier();
    }
    return BackendConnectionVerifier.instance;
  }

  // ✅ Comprehensive backend status check
  public async checkBackendStatus(): Promise<BackendStatus> {
    const now = Date.now();
    
    // Return cached result if recent (within 1 minute)
    if (this.cachedStatus && (now - this.lastCheck) < this.checkInterval) {
      return this.cachedStatus;
    }

    console.log('🔍 Performing comprehensive backend status check...');
    
    const status: BackendStatus = {
      isRunning: false,
      isHealthy: false,
      hasData: false,
      port: 3001,
      message: 'Checking backend status...',
      errors: []
    };

    try {
      // 1. Check if backend server is running
      const healthResponse = await this.checkHealth();
      if (!healthResponse.success) {
        status.message = 'Backend server is not running';
        status.errors?.push('Health check failed: ' + healthResponse.error);
        this.cachedStatus = status;
        this.lastCheck = now;
        return status;
      }

      status.isRunning = true;
      status.details = healthResponse.data;

      // 2. Check if API endpoints are accessible
      const apiCheck = await this.checkApiEndpoints();
      if (!apiCheck.success) {
        status.message = 'Backend is running but API endpoints are not accessible';
        status.errors?.push('API check failed: ' + apiCheck.error);
        this.cachedStatus = status;
        this.lastCheck = now;
        return status;
      }

      status.isHealthy = true;

      // 3. Check if database has data
      const dataCheck = await this.checkDatabaseData();
      if (dataCheck.success && dataCheck.hasData) {
        status.hasData = true;
        status.message = 'Backend is running and has data';
        status.details = {
          ...status.details,
          dataStatus: dataCheck.data
        };
      } else {
        status.message = 'Backend is running but database is empty';
        status.errors?.push('Database check: ' + (dataCheck.error || 'No data found'));
      }

    } catch (error) {
      status.message = 'Backend status check failed';
      status.errors?.push(error instanceof Error ? error.message : 'Unknown error');
    }

    this.cachedStatus = status;
    this.lastCheck = now;
    
    console.log('📊 Backend status check completed:', {
      isRunning: status.isRunning,
      isHealthy: status.isHealthy,
      hasData: status.hasData,
      message: status.message
    });

    return status;
  }

  // ✅ Health check endpoint
  private async checkHealth(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { success: false, error: `Health check failed with status ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  // ✅ API endpoints accessibility check
  private async checkApiEndpoints(): Promise<{ success: boolean; error?: string }> {
    const endpoints = [
      '/api/dashboard/metrics',
      '/api/sales/stats',
      '/api/products'
    ];

    try {
      for (const endpoint of endpoints) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          signal: controller.signal,
          headers: {
            'x-development-only': 'true',
            'Cache-Control': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        // We expect 200 or at least a valid JSON response (not 404)
        if (response.status === 404) {
          return { success: false, error: `Endpoint ${endpoint} not found (404)` };
        }

        // If we get any other status, try to parse JSON to see if it's a valid API response
        try {
          await response.json();
        } catch {
          return { success: false, error: `Endpoint ${endpoint} returned invalid JSON` };
        }
      }

      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'API endpoints check failed'
      };
    }
  }

  // ✅ Database data check
  private async checkDatabaseData(): Promise<{ success: boolean; hasData: boolean; data?: any; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/api/dashboard/metrics`, {
        signal: controller.signal,
        headers: {
          'x-development-only': 'true',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          success: false, 
          hasData: false, 
          error: `Database check failed: ${response.status} - ${errorText}` 
        };
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        return { 
          success: false, 
          hasData: false, 
          error: 'API returned no data' 
        };
      }

      const data = result.data;
      const hasData = (
        (data.distinctOrders && data.distinctOrders > 0) ||
        (data.totalProducts && data.totalProducts > 0) ||
        (data.totalRevenue && data.totalRevenue > 0)
      );

      return {
        success: true,
        hasData,
        data: {
          distinctOrders: data.distinctOrders || 0,
          totalProducts: data.totalProducts || 0,
          totalRevenue: data.totalRevenue || 0,
          totalSales: data.totalSales || 0
        }
      };

    } catch (error) {
      return { 
        success: false, 
        hasData: false, 
        error: error instanceof Error ? error.message : 'Database check failed'
      };
    }
  }

  // ✅ Get diagnostic information
  public async getDiagnosticInfo(): Promise<any> {
    const status = await this.checkBackendStatus();
    
    return {
      timestamp: new Date().toISOString(),
      backend: {
        url: this.baseUrl,
        status: status.isRunning ? 'Running' : 'Not Running',
        health: status.isHealthy ? 'Healthy' : 'Unhealthy',
        dataAvailable: status.hasData
      },
      checks: {
        serverRunning: status.isRunning,
        apiAccessible: status.isHealthy,
        databaseConnected: status.hasData
      },
      details: status.details,
      errors: status.errors || [],
      recommendations: this.getRecommendations(status)
    };
  }

  // ✅ Get recommendations based on status
  private getRecommendations(status: BackendStatus): string[] {
    const recommendations: string[] = [];

    if (!status.isRunning) {
      recommendations.push('Start the backend server: cd backend && npm start');
      recommendations.push('Make sure PostgreSQL is running');
      recommendations.push('Check if port 3001 is available');
    } else if (!status.isHealthy) {
      recommendations.push('Check backend logs for errors');
      recommendations.push('Verify database connection in backend/.env');
      recommendations.push('Run database migrations');
    } else if (!status.hasData) {
      recommendations.push('Import sales data to see dashboard metrics');
      recommendations.push('Import product data for inventory tracking');
      recommendations.push('Check if database tables are properly created');
    } else {
      recommendations.push('Backend is working correctly!');
      recommendations.push('All systems are operational');
    }

    return recommendations;
  }

  // ✅ Clear cache to force fresh check
  public clearCache(): void {
    this.cachedStatus = null;
    this.lastCheck = 0;
  }
}

// ✅ Export singleton instance
export const backendVerifier = BackendConnectionVerifier.getInstance();

// ✅ Simple utility functions
export const checkBackendConnection = () => backendVerifier.checkBackendStatus();
export const getBackendDiagnostics = () => backendVerifier.getDiagnosticInfo();
export const clearBackendCache = () => backendVerifier.clearCache();