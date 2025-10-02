// API Error Handler - Graceful fallback for when backend is not available

// Simple fallback data generators
export const generateFallbackSalesData = (days = 30) => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate realistic sales data
    const baseRevenue = 5000000 + Math.random() * 3000000; // 5M - 8M
    const seasonalFactor = 1 + 0.3 * Math.sin((i / days) * 2 * Math.PI); // Seasonal variation
    const randomFactor = 0.8 + Math.random() * 0.4; // Random variation
    
    const revenue = Math.floor(baseRevenue * seasonalFactor * randomFactor);
    const quantity = Math.floor(revenue / 500000); // Assuming ~500k per item
    
    data.push({
      id: `fallback_${i}`,
      created_time: date.toISOString(),
      delivered_time: date.toISOString(),
      revenue,
      total_revenue: revenue,
      order_amount: revenue,
      settlement_amount: revenue,
      quantity: Math.max(1, quantity),
      product_name: `Product ${String.fromCharCode(65 + (i % 26))}`,
      marketplace: ['Shopee', 'Tokopedia', 'Lazada', 'Blibli'][i % 4],
      hpp: Math.floor(revenue * 0.6),
      customer: `Customer ${i + 1}`,
      location: ['Jakarta', 'Bandung', 'Surabaya', 'Medan'][i % 4]
    });
  }

  return data;
};

export const generateFallbackProductsData = () => {
  return [
    { id: '1', name: 'Dress Elegant A', category: 'Dress', brand: 'D\'Busana', price: 500000, stock: 25 },
    { id: '2', name: 'Blouse Modern B', category: 'Blouse', brand: 'D\'Busana', price: 350000, stock: 40 },
    { id: '3', name: 'Skirt Classic C', category: 'Skirt', brand: 'D\'Busana', price: 275000, stock: 30 },
    { id: '4', name: 'Jacket Premium D', category: 'Jacket', brand: 'D\'Busana', price: 750000, stock: 15 },
    { id: '5', name: 'Pants Casual E', category: 'Pants', brand: 'D\'Busana', price: 400000, stock: 35 }
  ];
};

// Graceful API wrapper (simplified without TypeScript generics)
export const withGracefulFallback = async (apiCall, fallbackData, resourceName = 'Data') => {
  try {
    const result = await apiCall();
    if (result && result.success) {
      return result;
    }
    
    // API call failed, use fallback
    console.log(`⚠️ ${resourceName} API failed, using fallback data:`, result?.error || 'Unknown error');
    return {
      success: true,
      data: fallbackData,
      message: `Using fallback ${resourceName.toLowerCase()} (backend unavailable)`
    };
  } catch (error) {
    // Network error or other exception, use fallback
    console.log(`⚠️ ${resourceName} API error, using fallback data:`, error);
    return {
      success: true,
      data: fallbackData,
      message: `Using fallback ${resourceName.toLowerCase()} (backend unavailable)`
    };
  }
};

// Silent error logging (no UI notifications)
export const logApiError = (endpoint, error) => {
  console.log(`🔍 API Debug - ${endpoint}:`, {
    error: error instanceof Error ? error.message : error,
    timestamp: new Date().toISOString(),
    type: typeof error
  });
};

// Check if error is recoverable
export const isRecoverableError = (error) => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('fetch') || 
           message.includes('network') || 
           message.includes('timeout') ||
           message.includes('connection');
  }
  return false;
};

export default {
  generateFallbackSalesData,
  generateFallbackProductsData,
  withGracefulFallback,
  logApiError,
  isRecoverableError
};