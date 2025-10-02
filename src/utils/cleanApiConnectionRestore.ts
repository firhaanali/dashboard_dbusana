// =====================================================
// CLEAN API CONNECTION RESTORE
// Memperbaiki masalah API connection tanpa error prominent
// =====================================================

import { apiClient } from '../services/api';
import { makeSimpleApiRequest } from './simpleApiUtils';

interface ConnectionDiagnostic {
  isConnected: boolean;
  backendAvailable: boolean;
  apiEndpointsWorking: boolean;
  issues: string[];
  recommendations: string[];
}

class CleanApiConnectionRestore {
  private static lastHealthCheck: number = 0;
  private static healthCheckCache: boolean = false;
  private static HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  /**
   * Quietly check if backend is available
   */
  static async checkBackendHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      return this.healthCheckCache;
    }

    try {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        },
        signal: AbortSignal.timeout(3000)
      });

      this.healthCheckCache = response.ok;
      this.lastHealthCheck = now;
      
      return response.ok;
    } catch (error) {
      this.healthCheckCache = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Diagnose connection issues without throwing errors
   */
  static async diagnoseConnection(): Promise<ConnectionDiagnostic> {
    const diagnostic: ConnectionDiagnostic = {
      isConnected: false,
      backendAvailable: false,
      apiEndpointsWorking: false,
      issues: [],
      recommendations: []
    };

    try {
      // Check basic connectivity
      const backendHealth = await this.checkBackendHealth();
      diagnostic.backendAvailable = backendHealth;

      if (!backendHealth) {
        diagnostic.issues.push('Backend server not running on localhost:3001');
        diagnostic.recommendations.push('Start the backend server using: npm run dev (in backend directory)');
        return diagnostic;
      }

      // Test basic API endpoints
      try {
        const testResult = await makeSimpleApiRequest('/products', { method: 'GET' });
        diagnostic.apiEndpointsWorking = testResult.success;
        
        if (!testResult.success) {
          if (testResult.error?.includes('403')) {
            diagnostic.issues.push('API access forbidden - authentication issue');
            diagnostic.recommendations.push('Check API authentication configuration');
          } else if (testResult.error?.includes('500')) {
            diagnostic.issues.push('Backend server error - database connection issue');
            diagnostic.recommendations.push('Check database connection and migrations');
          } else {
            diagnostic.issues.push(`API endpoint error: ${testResult.error}`);
          }
        }
      } catch (error) {
        diagnostic.issues.push('API endpoint test failed');
        diagnostic.apiEndpointsWorking = false;
      }

      diagnostic.isConnected = diagnostic.backendAvailable && diagnostic.apiEndpointsWorking;

    } catch (error) {
      diagnostic.issues.push('Connection diagnostic failed');
    }

    return diagnostic;
  }

  /**
   * Attempt to restore API connection quietly
   */
  static async attemptRestore(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to restore API connection...');
      
      // Wait a moment for any backend startup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test connection
      const diagnostic = await this.diagnoseConnection();
      
      if (diagnostic.isConnected) {
        console.log('✅ API connection restored successfully');
        return true;
      } else {
        console.log('ℹ️ API connection not available, continuing with fallback mode');
        console.log('Issues found:', diagnostic.issues);
        return false;
      }
    } catch (error) {
      console.log('ℹ️ API restore attempt completed, using fallback mode');
      return false;
    }
  }

  /**
   * Initialize connection monitoring
   */
  static initializeMonitoring(): void {
    // Only monitor in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // Check connection every 5 minutes
      setInterval(async () => {
        const isHealthy = await this.checkBackendHealth();
        if (isHealthy) {
          console.log('🔄 Background: API connection healthy');
        }
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Get current connection status
   */
  static async getConnectionStatus(): Promise<{
    status: 'connected' | 'disconnected' | 'degraded';
    message: string;
    details?: any;
  }> {
    const diagnostic = await this.diagnoseConnection();
    
    if (diagnostic.isConnected) {
      return {
        status: 'connected',
        message: 'API connection is working normally'
      };
    } else if (diagnostic.backendAvailable) {
      return {
        status: 'degraded',
        message: 'Backend available but some API endpoints have issues',
        details: diagnostic
      };
    } else {
      return {
        status: 'disconnected',
        message: 'Backend server is not available',
        details: diagnostic
      };
    }
  }

  /**
   * Clean API call wrapper that handles errors gracefully
   */
  static async makeCleanApiCall<T>(
    apiCall: () => Promise<any>,
    fallbackData?: T,
    options: {
      silent?: boolean;
      timeout?: number;
    } = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const { silent = true, timeout = 10000 } = options;

    try {
      // Add timeout to the API call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API call timeout')), timeout);
      });

      const result = await Promise.race([apiCall(), timeoutPromise]);
      
      if (result && result.success) {
        return { success: true, data: result.data };
      } else {
        if (!silent) {
          console.log('ℹ️ API call returned unsuccessful result');
        }
        return fallbackData ? 
          { success: true, data: fallbackData } : 
          { success: false, error: result?.error || 'API call failed' };
      }
    } catch (error) {
      if (!silent) {
        console.log('ℹ️ API call failed, using fallback if available');
      }
      
      return fallbackData ? 
        { success: true, data: fallbackData } : 
        { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Reset connection cache
   */
  static resetCache(): void {
    this.lastHealthCheck = 0;
    this.healthCheckCache = false;
    console.log('🔄 API connection cache reset');
  }
}

export default CleanApiConnectionRestore;