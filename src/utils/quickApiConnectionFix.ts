// Quick API Connection Fix
// This utility helps diagnose and fix common API connection issues

export const quickApiConnectionFix = {
  // Test backend connection
  async testBackendConnection() {
    try {
      console.log('🔄 Testing backend connection...');
      
      const response = await fetch('http://localhost:3001/api/debug/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection successful:', data);
        return true;
      } else {
        console.log('❌ Backend connection failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Backend connection error:', error);
      return false;
    }
  },

  // Test Products API
  async testProductsApi() {
    try {
      console.log('🔄 Testing Products API...');
      
      const response = await fetch('http://localhost:3001/api/products?limit=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Products API successful:', data);
        return true;
      } else {
        console.log('❌ Products API failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Products API error:', error);
      return false;
    }
  },

  // Test Sales API
  async testSalesApi() {
    try {
      console.log('🔄 Testing Sales API...');
      
      const response = await fetch('http://localhost:3001/api/sales?limit=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sales API successful:', data);
        return true;
      } else {
        console.log('❌ Sales API failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Sales API error:', error);
      return false;
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Running API connection diagnostics...');
    
    const results = {
      backend: await this.testBackendConnection(),
      products: await this.testProductsApi(),
      sales: await this.testSalesApi()
    };
    
    console.log('📊 API Test Results:', results);
    
    if (results.backend && results.products && results.sales) {
      console.log('✅ All APIs working correctly!');
    } else {
      console.log('❌ Some APIs have issues. Check backend server status.');
      
      if (!results.backend) {
        console.log('💡 Fix: Start backend server with: cd backend && npm start');
      }
    }
    
    return results;
  }
};

// Auto-run diagnostics in development
if (process.env.NODE_ENV === 'development') {
  // Run after a short delay to allow app to initialize
  setTimeout(() => {
    quickApiConnectionFix.runAllTests();
  }, 2000);
}