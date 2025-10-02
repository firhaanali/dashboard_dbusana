// Fallback data generator for when backend is not available

export const generateRealisticSalesData = (days: number = 60) => {
  // Return empty array - no mock data
  return [];
};

const getProvinceFromCity = (city: string): string => {
  const cityProvinceMap: Record<string, string> = {
    'Jakarta': 'DKI Jakarta',
    'Bandung': 'Jawa Barat',
    'Surabaya': 'Jawa Timur',
    'Medan': 'Sumatera Utara',
    'Makassar': 'Sulawesi Selatan',
    'Semarang': 'Jawa Tengah'
  };
  return cityProvinceMap[city] || 'Unknown Province';
};

export const generateProductData = () => {
  // Return empty array - no mock data
  return [];
};

export const generateDashboardMetrics = () => {
  // Return zero values - no mock data
  return {
    total_revenue: 0,
    total_orders: 0,
    total_products: 0,
    average_order_value: 0,
    revenue_growth: 0,
    orders_growth: 0,
    conversion_rate: 0
  };
};

export default {
  generateRealisticSalesData,
  generateProductData,
  generateDashboardMetrics
};