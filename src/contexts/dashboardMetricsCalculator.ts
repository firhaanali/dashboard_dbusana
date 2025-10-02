import { extractDateString, parseUniversalDate } from '../utils/dateUtils';
import type { 
  ImportDataState, 
  DashboardMetrics, 
  ChartDataPoint, 
  CategorySales, 
  BrandPerformance, 
  ProductSales, 
  SKUPerformance 
} from './importDataTypes';

export class DashboardMetricsCalculator {
  constructor(private state: ImportDataState) {}

  getDashboardMetrics(): DashboardMetrics {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Utility function to safely extract date string from created_time
    const getDateString = (created_time: string | Date | number): string => {
      return extractDateString(created_time) || '1970-01-01';
    };

    // Filter data by time periods with safe date parsing
    const todaySalesData = this.state.salesData.filter(sale => {
      try {
        const saleDateStr = getDateString(sale.created_time);
        return saleDateStr === todayStr;
      } catch (error) {
        console.warn('Error filtering today sales:', sale, error);
        return false;
      }
    });

    const monthSalesData = this.state.salesData.filter(sale => {
      try {
        const saleDate = parseUniversalDate(sale.created_time);
        if (!saleDate) return false;
        
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      } catch (error) {
        console.warn('Error filtering month sales:', sale, error);
        return false;
      }
    });

    // ✅ Core KPI Calculations
    const distinctOrderIds = new Set(this.state.salesData.map(sale => sale.order_id));
    const distinctOrders = distinctOrderIds.size;
    
    const todayDistinctOrders = new Set(todaySalesData.map(sale => sale.order_id)).size;
    const monthDistinctOrders = new Set(monthSalesData.map(sale => sale.order_id)).size;

    const totalQuantitySold = this.state.salesData.reduce((sum, sale) => sum + (sale.quantity || 0), 0);

    const totalRevenue = this.state.salesData.reduce((sum, sale) => sum + (sale.total_revenue || sale.order_amount || 0), 0);
    const todayRevenue = todaySalesData.reduce((sum, sale) => sum + (sale.total_revenue || sale.order_amount || 0), 0);
    const monthRevenue = monthSalesData.reduce((sum, sale) => sum + (sale.total_revenue || sale.order_amount || 0), 0);

    const totalHPP = this.state.salesData.reduce((sum, sale) => sum + (sale.hpp || 0), 0);
    const totalSettlementAmount = this.state.salesData.reduce((sum, sale) => sum + (sale.settlement_amount || 0), 0);
    
    // ✅ UPDATED: Use settlement_amount for profit calculation when available, fallback to total_revenue
    const totalProfit = totalSettlementAmount > 0 ? totalSettlementAmount - totalHPP : totalRevenue - totalHPP;
    const baseAmount = totalSettlementAmount > 0 ? totalSettlementAmount : totalRevenue;
    const profitMargin = baseAmount > 0 ? (totalProfit / baseAmount) * 100 : 0;

    const averageOrderValue = distinctOrders > 0 ? totalRevenue / distinctOrders : 0;

    // Product metrics
    const lowStockProducts = this.state.productData.filter(product => 
      product.stock_quantity <= product.min_stock && product.stock_quantity > 0
    ).length;
    const outOfStockProducts = this.state.productData.filter(product => 
      product.stock_quantity === 0
    ).length;

    // ✅ FIXED: Unique products calculation - no duplication with proper null checks
    // Combine unique product names from both sales data and product data
    const salesProductNames = new Set(this.state.salesData
      .map(sale => sale.product_name?.trim()?.toLowerCase())
      .filter(Boolean)
    );
    const productDataNames = new Set(this.state.productData
      .map(p => p.product_name?.trim()?.toLowerCase())
      .filter(Boolean)
    );
    const allUniqueProducts = new Set([...salesProductNames, ...productDataNames]);
    
    // ✅ NEW: Total SKUs calculation - allows duplication by name (counts all variations) with proper null checks
    // Combine unique SKUs from both sales data and product data
    const salesSKUs = new Set(this.state.salesData
      .map(sale => sale.seller_sku?.trim())
      .filter(Boolean)
    );
    const productSKUs = new Set(this.state.productData
      .map(p => p.product_code?.trim() || p.seller_sku?.trim())
      .filter(Boolean)
    );
    const allUniqueSKUs = new Set([...salesSKUs, ...productSKUs]);
    
    console.log('🎯 Products & SKUs Calculation:', {
      uniqueProducts: {
        fromSalesData: salesProductNames.size,
        fromProductData: productDataNames.size,
        totalUnique: allUniqueProducts.size,
        sampleProducts: Array.from(allUniqueProducts).slice(0, 3)
      },
      totalSKUs: {
        fromSalesData: salesSKUs.size,
        fromProductData: productSKUs.size,
        totalUnique: allUniqueSKUs.size,
        sampleSKUs: Array.from(allUniqueSKUs).slice(0, 3)
      }
    });

    // Category/Brand analysis from sales data and product data with proper null checks
    const salesCategories = new Set(this.state.salesData
      .map(sale => sale.product_name?.split(' ')[0])
      .filter(Boolean)
    );
    const productCategories = new Set(this.state.productData
      .map(p => p.category)
      .filter(Boolean)
    );
    const allCategories = new Set([...salesCategories, ...productCategories]);

    const salesBrands = new Set(this.state.salesData
      .map(sale => sale.seller_sku?.split('-')[0] || 'D\'Busana')
      .filter(Boolean)
    );
    const productBrands = new Set(this.state.productData
      .map(p => p.brand)
      .filter(Boolean)
    );
    const allBrands = new Set([...salesBrands, ...productBrands]);

    const salesColors = new Set(this.state.salesData
      .map(sale => sale.color)
      .filter(Boolean)
    );
    const productColors = new Set(this.state.productData
      .map(p => p.color)
      .filter(Boolean)
    );
    const allColors = new Set([...salesColors, ...productColors]);

    const salesSizes = new Set(this.state.salesData
      .map(sale => sale.size)
      .filter(Boolean)
    );
    const productSizes = new Set(this.state.productData
      .map(p => p.size)
      .filter(Boolean)
    );
    const allSizes = new Set([...salesSizes, ...productSizes]);

    return {
      // Core KPI metrics
      distinctOrders,
      totalQuantitySold,  
      totalRevenue,
      totalProfit,
      totalHPP,
      profitMargin,
      
      // Secondary metrics
      totalSales: this.state.salesData.length,
      todayRevenue,
      todaySales: todaySalesData.length,
      todayOrders: todayDistinctOrders,
      monthRevenue,
      monthSales: monthSalesData.length,
      monthOrders: monthDistinctOrders,
      averageOrderValue,
      totalProducts: allUniqueProducts.size, // ✅ Unique products count (no duplication by name)
      totalSKUs: allUniqueSKUs.size,         // ✅ NEW: Total SKUs count (all variations)
      lowStockProducts,
      outOfStockProducts,
      totalCategories: allCategories.size,
      totalBrands: allBrands.size,
      totalColors: allColors.size,
      totalSizes: allSizes.size,
    };
  }

  getChartData(period: '7d' | '30d' | '90d'): ChartDataPoint[] {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data: ChartDataPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const daySales = this.state.salesData.filter(sale => {
        try {
          const saleDateStr = extractDateString(sale.created_time);
          return saleDateStr === dateStr;
        } catch (error) {
          console.warn('Error parsing date in getChartData:', sale.created_time, error);
          return false;
        }
      });

      const dayRevenue = daySales.reduce((sum, sale) => {
        return sum + (sale.total_revenue || sale.order_amount || 0);
      }, 0);

      const dayOrders = new Set(daySales.map(sale => sale.order_id)).size;
      const dayQuantity = daySales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);

      let target = 0;
      if (dayRevenue > 0) {
        target = dayRevenue * 1.2;
      } else {
        const recentSalesData = this.state.salesData.filter(sale => {
          const saleDate = parseUniversalDate(sale.delivered_time || sale.created_time);
          if (!saleDate) return false;
          const diffTime = today.getTime() - saleDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= days;
        });
        
        if (recentSalesData.length > 0) {
          const recentRevenue = recentSalesData.reduce((sum, sale) => sum + (sale.total_revenue || sale.order_amount || 0), 0);
          const recentDays = Math.min(days, 7);
          target = (recentRevenue / recentDays) * 0.8;
        } else {
          target = 500000;
        }
      }

      data.push({
        name: `Hari ${days - i}`,
        penjualan: dayRevenue,
        target: target,
        date: dateStr,
        orders: dayOrders,
        quantity: dayQuantity,
        salesCount: daySales.length,
      });
    }

    return data;
  }

  getCategorySales(): CategorySales[] {
    if (!this.state.salesData || this.state.salesData.length === 0) {
      return [];
    }

    const categoryMap = new Map<string, { sales: number; revenue: number }>();

    this.state.salesData.forEach(sale => {
      if (!sale.product_name) return; // Skip if product_name is undefined/null
      
      const category = sale.product_name.split(' ')[0] || 'Unknown';
      const existing = categoryMap.get(category) || { sales: 0, revenue: 0 };
      
      categoryMap.set(category, {
        sales: existing.sales + (sale.quantity || 0),
        revenue: existing.revenue + (sale.total_revenue || sale.order_amount || 0)
      });
    });

    const categoryArray = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      sales: data.sales,
      revenue: data.revenue
    }));

    return categoryArray.sort((a, b) => b.revenue - a.revenue);
  }

  getBrandPerformance(): BrandPerformance[] {
    if (!this.state.salesData || this.state.salesData.length === 0) {
      return [];
    }

    const brandMap = new Map<string, { sales: number; revenue: number }>();

    this.state.salesData.forEach(sale => {
      if (!sale.seller_sku) return; // Skip if seller_sku is undefined/null
      
      const brand = sale.seller_sku.split('-')[0] || 'D\'Busana';
      const existing = brandMap.get(brand) || { sales: 0, revenue: 0 };
      
      brandMap.set(brand, {
        sales: existing.sales + (sale.quantity || 0),
        revenue: existing.revenue + (sale.total_revenue || sale.order_amount || 0)
      });
    });

    const brandArray = Array.from(brandMap.entries()).map(([brand, data]) => ({
      brand,
      sales: data.sales,
      revenue: data.revenue
    }));

    return brandArray.sort((a, b) => b.revenue - a.revenue);
  }

  getProductSales(): ProductSales[] {
    if (!this.state.salesData || this.state.salesData.length === 0) {
      return [];
    }

    const productMap = new Map<string, { sales: number; revenue: number }>();

    this.state.salesData.forEach(sale => {
      const productName = sale.product_name?.trim() || 'Unknown Product';
      const existing = productMap.get(productName) || { sales: 0, revenue: 0 };
      
      productMap.set(productName, {
        sales: existing.sales + (sale.quantity || 0),
        revenue: existing.revenue + (sale.total_revenue || sale.order_amount || 0)
      });
    });

    const productArray = Array.from(productMap.entries()).map(([product, data]) => ({
      product,
      sales: data.sales,
      revenue: data.revenue
    }));

    return productArray.sort((a, b) => b.revenue - a.revenue);
  }

  getSKUPerformance(): SKUPerformance[] {
    if (!this.state.salesData || this.state.salesData.length === 0) {
      return [];
    }

    const skuMap = new Map<string, { sales: number; revenue: number }>();

    this.state.salesData.forEach(sale => {
      const sku = sale.seller_sku?.trim() || 'Unknown SKU';
      const existing = skuMap.get(sku) || { sales: 0, revenue: 0 };
      
      skuMap.set(sku, {
        sales: existing.sales + (sale.quantity || 0),
        revenue: existing.revenue + (sale.total_revenue || sale.order_amount || 0)
      });
    });

    const skuArray = Array.from(skuMap.entries()).map(([sku, data]) => ({
      sku,
      sales: data.sales,
      revenue: data.revenue
    }));

    return skuArray.sort((a, b) => b.revenue - a.revenue);
  }

  getTopProducts(limit: number = 5): { product: string; sales: number; revenue: number }[] {
    return this.getProductSales().slice(0, limit);
  }

  getRecentActivities(limit: number = 10): { type: string; description: string; timestamp: string; value?: number }[] {
    const activities: { type: string; description: string; timestamp: string; value?: number }[] = [];

    // Get recent sales
    const recentSales = this.state.salesData
      .slice(-limit)
      .map(sale => ({
        type: 'sale',
        description: `Sale: ${sale.product_name} (${sale.quantity}x)`,
        timestamp: sale.created_time,
        value: sale.total_revenue || sale.order_amount
      }));

    activities.push(...recentSales);

    // Sort by timestamp (most recent first)
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getKPISummary(): { orders: number; productsSold: number; revenue: number; profit: number } {
    const metrics = this.getDashboardMetrics();
    return {
      orders: metrics.distinctOrders,
      productsSold: metrics.totalQuantitySold,
      revenue: metrics.totalRevenue,
      profit: metrics.totalProfit
    };
  }
}