// Sales Analytics Route & API Integration Tester
// This utility helps verify that Sales Analytics Dashboard route and data fetching works correctly

import { simpleApiSales, simpleApiAdvertising } from './simpleApiUtils';

export interface RouteTestResult {
  routeConfigured: boolean;
  salesApiWorking: boolean;
  advertisingApiWorking: boolean;
  dataAvailable: boolean;
  errorDetails?: string[];
}

export const testSalesAnalyticsRoute = async (): Promise<RouteTestResult> => {
  const errors: string[] = [];
  let salesApiWorking = false;
  let advertisingApiWorking = false;
  let dataAvailable = false;

  console.log('🧪 Testing Sales Analytics Route Integration...');

  // Test 1: Check Route Configuration
  const routeConfigured = window.location.pathname === '/analytics' || 
                         document.querySelector('[href="/analytics"]') !== null;

  if (!routeConfigured) {
    errors.push('Route /analytics not found in navigation or current URL');
  }

  // Test 2: Test Sales API
  try {
    console.log('📊 Testing Sales API...');
    const salesResult = await simpleApiSales.getAll({ limit: 5 });
    
    if (salesResult.success && salesResult.data) {
      salesApiWorking = true;
      const salesData = Array.isArray(salesResult.data) ? salesResult.data : [];
      console.log(`✅ Sales API working - Found ${salesData.length} records`);
      
      if (salesData.length > 0) {
        dataAvailable = true;
        console.log('📈 Sample sales record:', salesData[0]);
      }
    } else {
      errors.push(`Sales API failed: ${salesResult.error || 'Unknown error'}`);
    }
  } catch (error) {
    errors.push(`Sales API exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test 3: Test Advertising API  
  try {
    console.log('📺 Testing Advertising API...');
    const adsResult = await simpleApiAdvertising.getAll({ limit: 5 });
    
    if (adsResult.success && adsResult.data) {
      advertisingApiWorking = true;
      const adsData = Array.isArray(adsResult.data) ? adsResult.data : [];
      console.log(`✅ Advertising API working - Found ${adsData.length} records`);
      
      if (adsData.length > 0) {
        console.log('📺 Sample advertising record:', adsData[0]);
      }
    } else {
      errors.push(`Advertising API failed: ${adsResult.error || 'Unknown error'}`);
    }
  } catch (error) {
    errors.push(`Advertising API exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const result: RouteTestResult = {
    routeConfigured,
    salesApiWorking,
    advertisingApiWorking,
    dataAvailable,
    errorDetails: errors.length > 0 ? errors : undefined
  };

  // Summary
  console.log('🧪 Test Results Summary:');
  console.log(`📍 Route Configured: ${routeConfigured ? '✅' : '❌'}`);
  console.log(`📊 Sales API: ${salesApiWorking ? '✅' : '❌'}`);
  console.log(`📺 Advertising API: ${advertisingApiWorking ? '✅' : '❌'}`);
  console.log(`📈 Data Available: ${dataAvailable ? '✅' : '❌'}`);
  
  if (errors.length > 0) {
    console.log('❌ Errors found:');
    errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
  } else {
    console.log('🎉 All tests passed! Sales Analytics route should work correctly.');
  }

  return result;
};

// Quick function to test from browser console
export const quickTest = () => {
  testSalesAnalyticsRoute().then(result => {
    if (result.routeConfigured && result.salesApiWorking && result.dataAvailable) {
      console.log('🚀 Sales Analytics Dashboard is ready to use!');
      console.log('💡 Navigate to /analytics to view the dashboard');
    } else {
      console.log('⚠️ Some issues detected. Check the error details above.');
    }
  });
};

// Export for use in development console
if (typeof window !== 'undefined') {
  (window as any).testSalesAnalytics = quickTest;
  console.log('💡 Dev tip: Run window.testSalesAnalytics() in console to test route integration');
}