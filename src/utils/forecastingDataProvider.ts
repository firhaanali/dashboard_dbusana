/**
 * Forecasting Data Provider
 * Centralized real data loader for all forecasting dashboards
 * Ensures consistent data access from PostgreSQL database
 */

import { simpleApiSales } from './simpleApiUtils';
import { withGracefulFallback } from './apiErrorHandler';

export interface ForecastingDataPoint {
  id: string;
  date: string; // ISO date string
  revenue: number;
  orders: number;
  quantity: number;
  profit: number;
  settlement_amount: number;
  hpp: number;
  product_name: string;
  marketplace: string;
  customer: string;
  location: string;
}

export interface ProcessedForecastingData {
  dailyData: {
    date: string;
    revenue: number;
    orders: number;
    quantity: number;
    profit: number;
    avg_order_value: number;
    marketplace_breakdown: Record<string, number>;
  }[];
  summary: {
    totalRecords: number;
    totalRevenue: number;
    totalProfit: number;
    dateRange: {
      earliest: string;
      latest: string;
      daysCovered: number;
    };
    dataQuality: 'Excellent' | 'Good' | 'Fair' | 'Limited';
    uniqueMarketplaces: string[];
    uniqueProducts: string[];
  };
}

export interface ForecastingDataResult {
  success: boolean;
  data: ProcessedForecastingData | null;
  rawData: ForecastingDataPoint[];
  error?: string;
  message?: string;
}

/**
 * Load and process all sales data for forecasting
 * @returns Complete processed data suitable for all forecasting algorithms
 */
export async function loadForecastingData(): Promise<ForecastingDataResult> {
  console.log('📊 FORECASTING DATA PROVIDER: Loading ALL sales data from database...');
  
  try {
    // Get ALL sales data without pagination limits
    const result = await withGracefulFallback(
      () => simpleApiSales.getAll(), // No params = get ALL data
      [],
      'Complete Sales Dataset for Forecasting'
    );
    
    if (!result.success || !result.data || result.data.length === 0) {
      console.warn('⚠️ No sales data available from database');
      return {
        success: false,
        data: null,
        rawData: [],
        error: 'No sales data available from database',
        message: 'Please ensure the backend is running and database contains sales data'
      };
    }
    
    console.log(`📈 Processing ${result.data.length} raw sales records from database...`);
    
    // Filter and process sales data
    const validSales: ForecastingDataPoint[] = result.data
      .filter((sale: any) => {
        // Comprehensive validation for forecasting accuracy
        const hasValidRevenue = (
          (sale.order_amount !== null && sale.order_amount !== undefined && Number(sale.order_amount) > 0) || 
          (sale.total_revenue !== null && sale.total_revenue !== undefined && Number(sale.total_revenue) > 0) || 
          (sale.settlement_amount !== null && sale.settlement_amount !== undefined && Number(sale.settlement_amount) > 0)
        );
        const hasValidDate = sale.created_time || sale.delivered_time || sale.order_date;
        
        return sale && hasValidRevenue && hasValidDate;
      })
      .map((sale: any) => {
        // Use most reliable date field
        const date = sale.delivered_time || sale.created_time || sale.order_date || new Date().toISOString();
        
        // Use highest revenue value for accuracy
        const revenue = Math.max(
          Number(sale.settlement_amount) || 0,
          Number(sale.total_revenue) || 0, 
          Number(sale.order_amount) || 0,
          Number(sale.revenue) || 0
        );
        
        const settlementAmount = Number(sale.settlement_amount) || revenue;
        const hpp = Number(sale.hpp) || Number(sale.product_cost) || 0;
        const profit = settlementAmount - hpp;
        
        return {
          id: sale.id || `sale_${Date.now()}_${Math.random()}`,
          date: new Date(date).toISOString().split('T')[0], // YYYY-MM-DD format
          revenue,
          orders: 1, // Each record represents one order
          quantity: Number(sale.quantity) || 1,
          profit,
          settlement_amount: settlementAmount,
          hpp,
          product_name: sale.nama_produk || sale.product_name || sale.product || 'Unknown Product',
          marketplace: sale.marketplace || 'Unknown',
          customer: sale.customer_name || sale.customer || '',
          location: sale.location || sale.city || sale.province || ''
        } as ForecastingDataPoint;
      })
      .sort((a, b) => a.date.localeCompare(b.date)); // Chronological order for time series
    
    if (validSales.length === 0) {
      console.warn('⚠️ No valid sales data after filtering');
      return {
        success: false,
        data: null,
        rawData: [],
        error: 'No valid sales data after filtering',
        message: 'Sales data exists but none meet forecasting quality requirements'
      };
    }
    
    // Process into daily aggregated data
    const dailyDataMap: Record<string, {
      revenue: number;
      orders: number;
      quantity: number;
      profit: number;
      marketplace_data: Record<string, number>;
    }> = {};
    
    validSales.forEach(sale => {
      if (!dailyDataMap[sale.date]) {
        dailyDataMap[sale.date] = {
          revenue: 0,
          orders: 0,
          quantity: 0,
          profit: 0,
          marketplace_data: {}
        };
      }
      
      const day = dailyDataMap[sale.date];
      day.revenue += sale.revenue;
      day.orders += 1;
      day.quantity += sale.quantity;
      day.profit += sale.profit;
      day.marketplace_data[sale.marketplace] = (day.marketplace_data[sale.marketplace] || 0) + sale.revenue;
    });
    
    // Convert to array format
    const dailyData = Object.entries(dailyDataMap)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        quantity: data.quantity,
        profit: data.profit,
        avg_order_value: data.orders > 0 ? data.revenue / data.orders : 0,
        marketplace_breakdown: data.marketplace_data
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate summary statistics
    const totalRevenue = validSales.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalProfit = validSales.reduce((sum, sale) => sum + sale.profit, 0);
    const uniqueMarketplaces = [...new Set(validSales.map(sale => sale.marketplace))];
    const uniqueProducts = [...new Set(validSales.map(sale => sale.product_name))];
    
    const earliestDate = validSales[0].date;
    const latestDate = validSales[validSales.length - 1].date;
    const daysCovered = Math.ceil((new Date(latestDate).getTime() - new Date(earliestDate).getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine data quality for forecasting algorithms
    let dataQuality: 'Excellent' | 'Good' | 'Fair' | 'Limited';
    if (validSales.length >= 1000 && daysCovered >= 365) {
      dataQuality = 'Excellent'; // Perfect for ARIMA + Prophet
    } else if (validSales.length >= 365 && daysCovered >= 180) {
      dataQuality = 'Good'; // Good for most algorithms
    } else if (validSales.length >= 100 && daysCovered >= 90) {
      dataQuality = 'Fair'; // Acceptable for basic forecasting
    } else {
      dataQuality = 'Limited'; // Limited accuracy expected
    }
    
    const processedData: ProcessedForecastingData = {
      dailyData,
      summary: {
        totalRecords: validSales.length,
        totalRevenue,
        totalProfit,
        dateRange: {
          earliest: earliestDate,
          latest: latestDate,
          daysCovered
        },
        dataQuality,
        uniqueMarketplaces,
        uniqueProducts
      }
    };
    
    console.log('✅ FORECASTING DATA PROVIDER: Successfully processed real database data:', {
      rawRecords: result.data.length,
      validRecords: validSales.length,
      dailyDataPoints: dailyData.length,
      dateRange: `${earliestDate} to ${latestDate}`,
      daysCovered,
      dataQuality,
      totalRevenue: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalRevenue),
      marketplaces: uniqueMarketplaces.length,
      products: uniqueProducts.length
    });
    
    return {
      success: true,
      data: processedData,
      rawData: validSales,
      message: `Successfully loaded ${validSales.length} sales records (${dailyData.length} daily data points) from database`
    };
    
  } catch (error) {
    console.error('❌ FORECASTING DATA PROVIDER: Error loading data:', error);
    
    return {
      success: false,
      data: null,
      rawData: [],
      error: error instanceof Error ? error.message : 'Unknown error loading forecasting data',
      message: 'Failed to load sales data for forecasting. Check backend connection.'
    };
  }
}

/**
 * Validate data quality for specific forecasting algorithms
 */
export function validateDataForAlgorithm(data: ProcessedForecastingData, algorithm: 'basic' | 'hybrid' | 'arima' | 'prophet' | 'advanced'): {
  isValid: boolean;
  recommendation: string;
  requirements: {
    minPoints: number;
    minDays: number;
    actual: {
      points: number;
      days: number;
    };
  };
} {
  const requirements = {
    basic: { minPoints: 30, minDays: 30 },
    hybrid: { minPoints: 60, minDays: 60 },
    arima: { minPoints: 100, minDays: 90 },
    prophet: { minPoints: 365, minDays: 365 },
    advanced: { minPoints: 500, minDays: 365 }
  };
  
  const req = requirements[algorithm];
  const actual = {
    points: data.dailyData.length,
    days: data.summary.dateRange.daysCovered
  };
  
  const isValid = actual.points >= req.minPoints && actual.days >= req.minDays;
  
  let recommendation: string;
  if (isValid) {
    recommendation = `✅ Dataset is suitable for ${algorithm} forecasting`;
  } else {
    recommendation = `⚠️ Dataset may have limited accuracy for ${algorithm} forecasting. Need ${req.minPoints}+ data points and ${req.minDays}+ days coverage.`;
  }
  
  return {
    isValid,
    recommendation,
    requirements: {
      minPoints: req.minPoints,
      minDays: req.minDays,
      actual
    }
  };
}

/**
 * Export processed data in format expected by forecasting engines
 */
export function formatDataForEngine(data: ProcessedForecastingData, type: 'revenue' | 'orders' | 'profit') {
  return data.dailyData.map(day => ({
    date: day.date,
    value: type === 'revenue' ? day.revenue : type === 'orders' ? day.orders : day.profit,
    metadata: {
      orders_count: day.orders,
      quantity: day.quantity,
      avg_order_value: day.avg_order_value,
      marketplace: day.marketplace_breakdown
    }
  }));
}