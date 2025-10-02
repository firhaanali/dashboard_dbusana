/**
 * Simple Backend Connection Utilities
 * Simplified version without complex TypeScript generics
 */

// Simple interface for API responses
interface SimpleApiResponse {
  success: boolean;
  data: any;
  message?: string;
  error?: string;
}

/**
 * Check if backend is available
 */
export const checkBackend = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/status', {
      method: 'GET',
      headers: { 'x-development-only': 'true' },
      signal: AbortSignal.timeout(2000)
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Make API call with fallback
 */
export const apiWithFallback = async (
  apiCall: () => Promise<any>,
  fallbackData: any,
  resourceName: string = 'Data'
) => {
  try {
    const isAvailable = await checkBackend();
    
    if (!isAvailable) {
      console.log(`ℹ️ Backend unavailable for ${resourceName} - using demo data`);
      return {
        success: true,
        data: fallbackData,
        message: `Using demo ${resourceName.toLowerCase()}`
      };
    }
    
    const result = await apiCall();
    
    if (result && result.success) {
      return result;
    }
    
    // API failed, use fallback
    return {
      success: true,
      data: fallbackData,
      message: `Using fallback ${resourceName.toLowerCase()}`
    };
    
  } catch (error) {
    return {
      success: true,
      data: fallbackData,
      message: `Using fallback ${resourceName.toLowerCase()}`
    };
  }
};

/**
 * Generate demo sales data
 */
export const generateDemoSales = (count: number = 50) => {
  const data = [];
  const marketplaces = ['Shopee', 'Tokopedia', 'TikTok Shop', 'Lazada'];
  const products = ['Dress Premium', 'Blouse Casual', 'Skirt Modern', 'Jacket Fashion'];
  
  for (let i = 0; i < count; i++) {
    const amount = 200000 + Math.random() * 600000;
    const hpp = Math.floor(amount * (0.4 + Math.random() * 0.2));
    
    data.push({
      id: `demo_${i}`,
      order_id: `ORD${1000 + i}`,
      order_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      settlement_amount: amount,
      hpp: hpp,
      profit: amount - hpp,
      nama_produk: products[Math.floor(Math.random() * products.length)],
      marketplace: marketplaces[Math.floor(Math.random() * marketplaces.length)],
      customer: `Customer ${i + 1}`,
      quantity: Math.floor(Math.random() * 3) + 1
    });
  }
  
  return data;
};

/**
 * Show startup info
 */
export const showStartupInfo = async () => {
  const isAvailable = await checkBackend();
  
  if (isAvailable) {
    console.log('✅ D\'Busana Dashboard - Backend Connected');
  } else {
    console.log('ℹ️ D\'Busana Dashboard - Demo Mode (Backend Offline)');
  }
};

export default {
  checkBackend,
  apiWithFallback,
  generateDemoSales,
  showStartupInfo
};