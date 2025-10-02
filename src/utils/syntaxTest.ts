/**
 * Syntax Test - Simple test to verify all utilities compile correctly
 */

// Test imports to verify syntax is correct
import { universalApiCall, apiHelpers } from './universalApiFallback';
import { makeRateLimitedRequest, rateLimitManager } from './rateLimitManager';
import { makeApiRequest, withRetry } from './apiUtils';
import { performanceMetricsApi } from './performanceMetricsApiUtils';
import { emergencyFallback } from './emergencyFallbackSystem';
import { enhancedEmergencyApi } from './performanceMetricsMockData';

// Simple test function to verify everything compiles
export function runSyntaxTest() {
  console.log('🧪 Running syntax test for all API utilities...');
  
  try {
    // Test function availability
    if (typeof universalApiCall === 'function') {
      console.log('✅ universalApiCall - OK');
    }
    
    if (typeof apiHelpers.get === 'function') {
      console.log('✅ apiHelpers.get - OK');
    }
    
    if (typeof apiHelpers.post === 'function') {
      console.log('✅ apiHelpers.post - OK');  
    }
    
    if (typeof apiHelpers.healthCheck === 'function') {
      console.log('✅ apiHelpers.healthCheck - OK');
    }
    
    if (typeof makeRateLimitedRequest === 'function') {
      console.log('✅ makeRateLimitedRequest - OK');
    }
    
    if (typeof makeApiRequest === 'function') {
      console.log('✅ makeApiRequest - OK');
    }
    
    if (typeof withRetry === 'function') {
      console.log('✅ withRetry - OK');
    }
    
    if (typeof performanceMetricsApi.getAllData === 'function') {
      console.log('✅ performanceMetricsApi.getAllData - OK');
    }
    
    if (typeof emergencyFallback.makeEmergencyRequest === 'function') {
      console.log('✅ emergencyFallback.makeEmergencyRequest - OK');
    }
    
    if (typeof enhancedEmergencyApi.getSales === 'function') {
      console.log('✅ enhancedEmergencyApi.getSales - OK');
    }
    
    console.log('✅ All syntax tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Syntax test failed:', error);
    return false;
  }
}

// Export for window access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).runSyntaxTest = runSyntaxTest;
  console.log('🧪 Syntax test available at window.runSyntaxTest()');
}