/**
 * Stock Forecasting Utilities
 * Utilities khusus untuk stock/inventory forecasting dengan business logic
 */

import { simpleApiSales } from './simpleApiUtils';

export interface StockMetrics {
  current_stock: number;
  stock_movement: number;
  stock_value: number;
  reorder_point: number;
  stockout_risk: number;
  turnover_rate: number;
}

export interface StockForecastConfig {
  includeSeasonality: boolean;
  reorderOptimization: boolean;
  demandSmoothing: boolean;
  stockoutPrevention: boolean;
}

/**
 * Generate mock stock data from sales data for forecasting
 * This simulates stock movements based on sales patterns
 */
export async function generateStockDataFromSales(): Promise<any[]> {
  try {
    console.log('📦 Generating stock data from sales patterns...');
    
    // Fetch sales data to derive stock patterns
    const salesResult = await simpleApiSales.getAll({ limit: 500 });
    
    if (!salesResult.success || !salesResult.data?.length) {
      console.log('⚠️ No sales data available for stock generation');
      return [];
    }

    const salesData = salesResult.data;
    
    // Group sales by product to calculate stock movements
    const productStockMap = new Map<string, any>();
    
    salesData.forEach((sale: any) => {
      const productName = sale.product_name || sale.nama_produk || 'Unknown Product';
      const quantity = Number(sale.quantity) || 1;
      const revenue = Number(sale.settlement_amount || sale.total_revenue || sale.order_amount) || 0;
      const unitPrice = quantity > 0 ? revenue / quantity : 0;
      
      if (!productStockMap.has(productName)) {
        productStockMap.set(productName, {
          product_name: productName,
          total_sales: 0,
          total_quantity: 0,
          avg_price: 0,
          sales_frequency: 0,
          last_sale_date: sale.delivered_time || sale.created_time,
          marketplace: sale.marketplace || 'Unknown'
        });
      }
      
      const productData = productStockMap.get(productName)!;
      productData.total_sales += revenue;
      productData.total_quantity += quantity;
      productData.sales_frequency += 1;
      productData.avg_price = productData.total_sales / productData.total_quantity;
    });

    // Convert to stock forecast data
    const stockData = Array.from(productStockMap.values()).map((product, index) => {
      // Estimate current stock based on sales patterns
      const avgMonthlySales = product.total_quantity / 3; // Assume 3 months of data
      const estimatedStock = Math.max(10, Math.round(avgMonthlySales * 1.5)); // Keep 1.5 months buffer
      const reorderPoint = Math.max(5, Math.round(avgMonthlySales * 0.5)); // Reorder at 0.5 months
      
      // Generate realistic stock movements (daily changes)
      const stockMovement = Math.round((Math.random() - 0.5) * avgMonthlySales * 0.1); // ±10% daily variation
      
      return {
        id: `stock_${index + 1}`,
        created_time: new Date().toISOString(),
        updated_time: new Date().toISOString(),
        product_name: product.product_name,
        current_stock: estimatedStock,
        stock_movement: stockMovement,
        stock_value: estimatedStock * product.avg_price,
        category: 'Fashion', // Default category for D'Busana
        marketplace: product.marketplace,
        location: 'Warehouse_A',
        reorder_point: reorderPoint,
        max_stock: estimatedStock * 2,
        unit_cost: product.avg_price,
        // Additional stock metrics
        last_sale_date: product.last_sale_date,
        sales_frequency: product.sales_frequency,
        turnover_rate: product.total_quantity / Math.max(estimatedStock, 1)
      };
    });

    console.log(`✅ Generated ${stockData.length} stock forecast entries from sales data`);
    return stockData;
    
  } catch (error) {
    console.error('❌ Error generating stock data from sales:', error);
    return [];
  }
}

/**
 * Calculate stock forecasting metrics
 */
export function calculateStockMetrics(stockData: any[]): StockMetrics {
  if (!stockData.length) {
    return {
      current_stock: 0,
      stock_movement: 0,
      stock_value: 0,
      reorder_point: 0,
      stockout_risk: 0,
      turnover_rate: 0
    };
  }

  const totalStock = stockData.reduce((sum, item) => sum + (Number(item.current_stock) || 0), 0);
  const totalMovement = stockData.reduce((sum, item) => sum + (Number(item.stock_movement) || 0), 0);
  const totalValue = stockData.reduce((sum, item) => sum + (Number(item.stock_value) || 0), 0);
  const avgReorderPoint = stockData.reduce((sum, item) => sum + (Number(item.reorder_point) || 0), 0) / stockData.length;
  
  // Calculate stockout risk (percentage of products below reorder point)
  const belowReorderPoint = stockData.filter(item => 
    (Number(item.current_stock) || 0) <= (Number(item.reorder_point) || 0)
  ).length;
  const stockoutRisk = (belowReorderPoint / stockData.length) * 100;
  
  // Calculate average turnover rate
  const avgTurnover = stockData.reduce((sum, item) => sum + (Number(item.turnover_rate) || 0), 0) / stockData.length;

  return {
    current_stock: totalStock,
    stock_movement: totalMovement,
    stock_value: totalValue,
    reorder_point: avgReorderPoint,
    stockout_risk: stockoutRisk,
    turnover_rate: avgTurnover
  };
}

/**
 * Generate stock forecast recommendations
 */
export function generateStockRecommendations(stockData: any[], forecastResults: any[]): string[] {
  const recommendations: string[] = [];
  
  // Analyze current stock status
  const metrics = calculateStockMetrics(stockData);
  
  if (metrics.stockout_risk > 30) {
    recommendations.push('⚠️ High stockout risk detected. Consider increasing safety stock levels.');
  }
  
  if (metrics.turnover_rate < 0.5) {
    recommendations.push('📦 Low inventory turnover. Review slow-moving products.');
  }
  
  if (metrics.stock_movement < 0) {
    recommendations.push('📈 Negative stock trend. Plan for inventory replenishment.');
  }
  
  // Analyze forecast trends
  if (forecastResults.length > 0) {
    const avgForecast = forecastResults.reduce((sum, f) => sum + (f.predicted || 0), 0) / forecastResults.length;
    const currentAvg = metrics.current_stock / Math.max(stockData.length, 1);
    
    if (avgForecast > currentAvg * 1.2) {
      recommendations.push('📊 Forecasts show increasing demand. Consider stock buildup.');
    } else if (avgForecast < currentAvg * 0.8) {
      recommendations.push('📉 Forecasts show decreasing demand. Monitor for overstock.');
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Stock levels appear optimized. Continue monitoring.');
  }
  
  return recommendations;
}

/**
 * Optimize reorder points based on forecast data
 */
export function optimizeReorderPoints(stockData: any[], forecastResults: any[]): any[] {
  return stockData.map(item => {
    const currentStock = Number(item.current_stock) || 0;
    const currentReorder = Number(item.reorder_point) || 0;
    
    // Find relevant forecast data
    const relevantForecasts = forecastResults.filter(f => 
      f.product_name === item.product_name || !f.product_name
    );
    
    if (relevantForecasts.length > 0) {
      const avgForecast = relevantForecasts.reduce((sum, f) => sum + (f.predicted || 0), 0) / relevantForecasts.length;
      const optimizedReorder = Math.max(
        Math.round(avgForecast * 0.3), // 30% of forecasted demand
        Math.round(currentStock * 0.2), // Or 20% of current stock
        5 // Minimum reorder point
      );
      
      return {
        ...item,
        reorder_point: optimizedReorder,
        optimized: optimizedReorder !== currentReorder
      };
    }
    
    return item;
  });
}

export default {
  generateStockDataFromSales,
  calculateStockMetrics,
  generateStockRecommendations,
  optimizeReorderPoints
};