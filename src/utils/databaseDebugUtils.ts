/**
 * Database Debug Utilities
 * Helper functions for debugging database integration and KPI calculations
 */

import { universalApiCall, apiHelpers } from './universalApiFallback';

interface DatabaseDiagnostic {
  connectionStatus: 'connected' | 'failed' | 'partial';
  responseTime: number;
  endpoints: {
    health: boolean;
    metrics: boolean;
    marketplace: boolean;
  };
  dataQuality: {
    hasOrders: boolean;
    hasProducts: boolean;
    hasCategories: boolean;
    totalRecords: number;
  };
  lastCheck: string;
  errors: string[];
}

class DatabaseDebugUtils {
  
  async runFullDiagnostic(): Promise<DatabaseDiagnostic> {
    console.log('🔍 Running comprehensive database diagnostic...');
    
    const startTime = Date.now();
    const diagnostic: DatabaseDiagnostic = {
      connectionStatus: 'failed',
      responseTime: 0,
      endpoints: {
        health: false,
        metrics: false,
        marketplace: false
      },
      dataQuality: {
        hasOrders: false,
        hasProducts: false,
        hasCategories: false,
        totalRecords: 0
      },
      lastCheck: new Date().toISOString(),
      errors: []
    };

    try {
      // Test health endpoint
      console.log('🏥 Testing health endpoint...');
      const healthResult = await apiHelpers.healthCheck();
      diagnostic.endpoints.health = healthResult.success;
      
      if (!healthResult.success) {
        diagnostic.errors.push('Health endpoint failed');
        diagnostic.responseTime = Date.now() - startTime;
        return diagnostic;
      }

      // Test metrics endpoint
      console.log('📊 Testing metrics endpoint...');
      try {
        const metricsResult = await universalApiCall(
          '/dashboard/metrics',
          async () => {
            const response = await fetch('http://localhost:3001/api/dashboard/metrics', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
          },
          { timeout: 5000, suppressToast: true, fallbackEnabled: false }
        );

        if (metricsResult.success && metricsResult.data) {
          diagnostic.endpoints.metrics = true;
          
          const data = metricsResult.data.data || metricsResult.data;
          diagnostic.dataQuality = {
            hasOrders: (data.distinctOrders || 0) > 0,
            hasProducts: (data.totalProducts || 0) > 0,
            hasCategories: (data.totalCategories || 0) > 0,
            totalRecords: (data.totalSales || 0) + (data.totalProducts || 0)
          };

          console.log('✅ Metrics endpoint working, data quality:', diagnostic.dataQuality);
        } else {
          diagnostic.errors.push('Metrics endpoint returned no data');
        }
      } catch (error) {
        diagnostic.errors.push(`Metrics endpoint error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      // Test marketplace endpoint
      console.log('🏪 Testing marketplace endpoint...');
      try {
        const marketplaceResult = await universalApiCall(
          '/dashboard/marketplace-analytics',
          async () => {
            const response = await fetch('http://localhost:3001/api/dashboard/marketplace-analytics', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
          },
          { timeout: 5000, suppressToast: true, fallbackEnabled: false }
        );

        diagnostic.endpoints.marketplace = marketplaceResult.success;
        
        if (!marketplaceResult.success) {
          diagnostic.errors.push('Marketplace endpoint failed');
        }
      } catch (error) {
        diagnostic.errors.push(`Marketplace endpoint error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      // Determine overall status
      if (diagnostic.endpoints.health && diagnostic.endpoints.metrics) {
        if (diagnostic.dataQuality.totalRecords > 0) {
          diagnostic.connectionStatus = 'connected';
        } else {
          diagnostic.connectionStatus = 'partial';
          diagnostic.errors.push('Database connected but no data available');
        }
      } else {
        diagnostic.connectionStatus = 'failed';
      }

      diagnostic.responseTime = Date.now() - startTime;
      
      console.log('✅ Database diagnostic completed:', {
        status: diagnostic.connectionStatus,
        responseTime: diagnostic.responseTime,
        endpoints: diagnostic.endpoints,
        dataQuality: diagnostic.dataQuality,
        errors: diagnostic.errors
      });

      return diagnostic;

    } catch (error) {
      diagnostic.errors.push(`Diagnostic error: ${error instanceof Error ? error.message : 'Unknown'}`);
      diagnostic.responseTime = Date.now() - startTime;
      console.error('❌ Database diagnostic failed:', error);
      return diagnostic;
    }
  }

  async quickConnectionTest(): Promise<{ connected: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const healthResult = await apiHelpers.healthCheck();
      return {
        connected: healthResult.success,
        responseTime: Date.now() - startTime,
        error: healthResult.success ? undefined : 'Backend not responding'
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  showDatabaseInfo(): void {
    console.group('📊 Database Integration Information');
    console.log('Backend URL:', 'http://localhost:3001');
    console.log('API Endpoints:');
    console.log('  - Health: /health');
    console.log('  - Metrics: /api/dashboard/metrics');
    console.log('  - Marketplace: /api/dashboard/marketplace-analytics');
    console.log('  - Charts: /api/dashboard/charts');
    console.log('Database:', 'PostgreSQL via Prisma ORM');
    console.log('Connection Method:', 'REST API with Universal Fallback');
    console.log('');
    console.log('🔧 Available Debug Commands:');
    console.log('  window.databaseDebug.runFullDiagnostic() - Complete diagnostic');
    console.log('  window.databaseDebug.quickConnectionTest() - Quick connection test');
    console.log('  window.databaseDebug.showDatabaseInfo() - Show this info');
    console.log('  window.databaseDebug.testKPIData() - Test KPI data loading');
    console.groupEnd();
  }

  async testKPIData(): Promise<void> {
    console.log('🎯 Testing KPI data loading...');
    
    try {
      const result = await universalApiCall(
        '/dashboard/metrics',
        async () => {
          const response = await fetch('http://localhost:3001/api/dashboard/metrics', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          return await response.json();
        },
        { timeout: 5000, suppressToast: true }
      );

      if (result.success && result.data) {
        const data = result.data.data || result.data;
        
        console.group('📈 KPI Data from Database');
        console.log('Data Source:', result.source);
        console.log('Distinct Orders:', data.distinctOrders || 0);
        console.log('Total Revenue:', data.totalRevenue || 0);
        console.log('Total Settlement Amount:', data.totalSettlementAmount || 0);
        console.log('Total Profit:', data.totalProfit || 0);
        console.log('Profit Margin:', `${(data.profitMargin || 0).toFixed(2)}%`);
        console.log('Total Products:', data.totalProducts || 0);
        console.log('Total Stock Quantity:', data.totalStockQuantity || 0);
        console.log('Low Stock Products:', data.lowStockProducts || 0);
        console.log('Out of Stock Products:', data.outOfStockProducts || 0);
        console.groupEnd();
        
        console.log('✅ KPI data test completed successfully');
      } else {
        console.warn('⚠️ KPI data test failed - no data received');
      }
      
    } catch (error) {
      console.error('❌ KPI data test error:', error);
    }
  }

  // Format diagnostic results for display
  formatDiagnostic(diagnostic: DatabaseDiagnostic): string {
    const lines = [
      `🔍 Database Diagnostic Report`,
      `=====================================`,
      `Status: ${diagnostic.connectionStatus.toUpperCase()}`,
      `Response Time: ${diagnostic.responseTime}ms`,
      `Last Check: ${new Date(diagnostic.lastCheck).toLocaleString('id-ID')}`,
      ``,
      `📊 Endpoint Status:`,
      `  Health: ${diagnostic.endpoints.health ? '✅' : '❌'}`,
      `  Metrics: ${diagnostic.endpoints.metrics ? '✅' : '❌'}`,
      `  Marketplace: ${diagnostic.endpoints.marketplace ? '✅' : '❌'}`,
      ``,
      `📈 Data Quality:`,
      `  Has Orders: ${diagnostic.dataQuality.hasOrders ? '✅' : '❌'}`,
      `  Has Products: ${diagnostic.dataQuality.hasProducts ? '✅' : '❌'}`,
      `  Has Categories: ${diagnostic.dataQuality.hasCategories ? '✅' : '❌'}`,
      `  Total Records: ${diagnostic.dataQuality.totalRecords.toLocaleString('id-ID')}`,
    ];

    if (diagnostic.errors.length > 0) {
      lines.push(``, `❌ Errors:`);
      diagnostic.errors.forEach(error => {
        lines.push(`  - ${error}`);
      });
    }

    return lines.join('\n');
  }
}

// Create singleton instance
const databaseDebugUtils = new DatabaseDebugUtils();

// Add to window for easy access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).databaseDebug = databaseDebugUtils;
  
  console.log('🔍 Database Debug Utils loaded');
  console.log('   window.databaseDebug.runFullDiagnostic() - Complete diagnostic');
  console.log('   window.databaseDebug.quickConnectionTest() - Quick test');
  console.log('   window.databaseDebug.showDatabaseInfo() - Show database info');
  console.log('   window.databaseDebug.testKPIData() - Test KPI data loading');
}

export default databaseDebugUtils;
export { databaseDebugUtils };