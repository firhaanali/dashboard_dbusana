/**
 * Quick Backend Connection Fix
 * Provides simple utilities to handle backend unavailability gracefully
 */

interface ApiResponse {
  success: boolean;
  data: any;
  message?: string;
  error?: string;
}

/**
 * Simple backend availability checker
 */
export const checkBackendAvailability = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('http://localhost:3001/api/status', {
      method: 'GET',
      headers: { 'x-development-only': 'true' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Graceful API call wrapper with automatic fallback
 */
export const gracefulApiCall = async (
  apiCall: () => Promise<ApiResponse>,
  fallbackData: any,
  resourceName: string = 'Data'
): Promise<ApiResponse> => {
  try {
    // Check if backend is available first
    const isAvailable = await checkBackendAvailability();
    
    if (!isAvailable) {
      console.log(`ℹ️ Backend unavailable for ${resourceName} - using offline data`);
      return {
        success: true,
        data: fallbackData,
        message: `Using offline ${resourceName.toLowerCase()}`
      };
    }
    
    // Try the API call
    const result = await apiCall();
    
    if (result && result.success) {
      return result;
    }
    
    // API call failed, use fallback
    console.log(`⚠️ ${resourceName} API failed - using fallback data`);
    return {
      success: true,
      data: fallbackData,
      message: `Using fallback ${resourceName.toLowerCase()}`
    };
    
  } catch (error) {
    console.log(`⚠️ ${resourceName} error - using fallback data:`, error);
    return {
      success: true,
      data: fallbackData,
      message: `Using fallback ${resourceName.toLowerCase()}`
    };
  }
};

/**
 * Generate realistic fallback sales data
 */
export const generateFallbackSalesData = (count: number = 100): any[] => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const marketplaces = ['Shopee', 'Tokopedia', 'TikTok Shop', 'Lazada', 'Blibli'];
  const products = [
    'Dress Elegant Premium',
    'Blouse Casual Chic',
    'Skirt Formal Modern',
    'Jacket Professional',
    'Pants Fashion Trend',
    'Hijab Premium Quality',
    'Tas Kulit Original',
    'Sepatu Fashion'
  ];
  
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor((i / count) * 30));
    
    // Generate realistic sales patterns
    const baseAmount = 200000 + Math.random() * 800000; // 200k - 1M
    const hpp = Math.floor(baseAmount * (0.4 + Math.random() * 0.2)); // 40-60% HPP
    const marketplace = marketplaces[Math.floor(Math.random() * marketplaces.length)];
    
    data.push({
      id: `fallback_${i}`,
      order_id: `ORD${1000 + i}`,
      order_date: date.toISOString().split('T')[0],
      delivered_time: date.toISOString(),
      settlement_amount: baseAmount,
      hpp: hpp,
      profit: baseAmount - hpp,
      nama_produk: products[Math.floor(Math.random() * products.length)],
      marketplace: marketplace,
      customer: `Customer ${i + 1}`,
      customer_name: `Customer ${i + 1}`,
      location: ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Yogyakarta'][i % 5],
      quantity: Math.floor(Math.random() * 3) + 1
    });
  }
  
  return data;
};

/**
 * Generate fallback advertising data
 */
export const generateFallbackAdvertisingData = (count: number = 50): any[] => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const campaigns = ['Brand Awareness', 'Product Launch', 'Sales Boost', 'Retargeting', 'Seasonal'];
  const marketplaces = ['Shopee', 'Tokopedia', 'TikTok Shop', 'Lazada'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor((i / count) * 30));
    
    const spend = 500000 + Math.random() * 2000000; // 500k - 2.5M
    const revenue = spend * (1.5 + Math.random() * 2); // 1.5x - 3.5x ROAS
    
    data.push({
      id: `ad_fallback_${i}`,
      campaign_name: `${campaigns[Math.floor(Math.random() * campaigns.length)]} ${i + 1}`,
      marketplace: marketplaces[Math.floor(Math.random() * marketplaces.length)],
      date: date.toISOString().split('T')[0],
      spend: spend,
      revenue: revenue,
      roas: revenue / spend,
      impressions: Math.floor(spend / 100), // Rough estimate
      clicks: Math.floor(spend / 2000), // Rough estimate
      conversions: Math.floor(revenue / 500000) // Rough estimate
    });
  }
  
  return data;
};

/**
 * Generate fallback products data
 */
export const generateFallbackProductsData = (): any[] => {
  return [
    { 
      id: '1', 
      nama: 'Dress Elegant Premium', 
      category: 'Dress', 
      brand: 'D\'Busana', 
      price: 500000, 
      stock: 25,
      hpp: 200000
    },
    { 
      id: '2', 
      nama: 'Blouse Casual Chic', 
      category: 'Blouse', 
      brand: 'D\'Busana', 
      price: 350000, 
      stock: 40,
      hpp: 140000
    },
    { 
      id: '3', 
      nama: 'Skirt Formal Modern', 
      category: 'Skirt', 
      brand: 'D\'Busana', 
      price: 275000, 
      stock: 30,
      hpp: 110000
    },
    { 
      id: '4', 
      nama: 'Jacket Professional', 
      category: 'Jacket', 
      brand: 'D\'Busana', 
      price: 750000, 
      stock: 15,
      hpp: 300000
    },
    { 
      id: '5', 
      nama: 'Pants Fashion Trend', 
      category: 'Pants', 
      brand: 'D\'Busana', 
      price: 400000, 
      stock: 35,
      hpp: 160000
    }
  ];
};

/**
 * Simple startup message for backend issues
 */
export const showBackendStartupInfo = async (): Promise<void> => {
  const isAvailable = await checkBackendAvailability();
  
  if (!isAvailable) {
    console.log(`
🏪 D'Busana Dashboard - Offline Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ Backend server tidak tersedia
   Dashboard berjalan dengan demo data

📋 Features Available:
   ✅ All dashboard components
   ✅ Demo business analytics
   ✅ Offline data visualization
   ✅ UI/UX testing

🔧 To connect to real database:
   1. Start backend server: cd backend && npm start
   2. Verify database connection
   3. Refresh dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  } else {
    console.log(`
🏪 D'Busana Dashboard - Online Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Backend server connected
   Using real business data

📊 Live Data Sources:
   ✅ PostgreSQL database
   ✅ Real sales analytics
   ✅ Actual business metrics
   ✅ Live forecasting data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  }
};

export default {
  checkBackendAvailability,
  gracefulApiCall,
  generateFallbackSalesData,
  generateFallbackAdvertisingData,
  generateFallbackProductsData,
  showBackendStartupInfo
};