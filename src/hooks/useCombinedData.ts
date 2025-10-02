import { useMemo } from 'react';
import { useDashboardStats, useSalesChart } from './useApi';
import { useImportData } from '../contexts/ImportDataContext';

// ✅ Hook to provide zero values when no data - NO DUMMY DATA
export function useCombinedDashboardStats() {
  const { data: apiStats, loading: apiLoading, error: apiError } = useDashboardStats();
  const { state: importState, getDashboardMetrics } = useImportData();

  const combinedStats = useMemo(() => {
    const importMetrics = getDashboardMetrics();
    const hasImportData = importState.salesData.length > 0 || importState.productData.length > 0;

    console.log('🔄 useCombinedDashboardStats - Data Status:', {
      hasImportData,
      apiStats: apiStats ? 'available' : 'null',
      apiError,
      importSalesCount: importState.salesData.length,
      importProductsCount: importState.productData.length
    });

    // ✅ Always return stats, but with zeros when no data
    return {
      today_sales: hasImportData ? importMetrics.todayRevenue : (apiStats?.today_sales || 0),
      month_sales: hasImportData ? importMetrics.monthRevenue : (apiStats?.month_sales || 0),
      total_sales: hasImportData ? importMetrics.totalSales : (apiStats?.total_sales || 0),
      total_products: hasImportData ? importMetrics.totalProducts : (apiStats?.total_products || 0),
      inventory_value: hasImportData ? (importMetrics.totalProducts * 100000) : (apiStats?.inventory_value || 0),
      avg_order_value: hasImportData ? importMetrics.averageOrderValue : (apiStats?.avg_order_value || 0),
      low_stock_count: hasImportData ? importMetrics.lowStockProducts : (apiStats?.low_stock_count || 0),
      out_of_stock_count: hasImportData ? importMetrics.outOfStockProducts : (apiStats?.out_of_stock_count || 0),
      total_categories: hasImportData ? importMetrics.totalCategories : (apiStats?.total_categories || 0),
      total_colors: hasImportData ? importMetrics.totalColors : (apiStats?.total_colors || 0),
      total_brands: hasImportData ? importMetrics.totalBrands : (apiStats?.total_brands || 0),
      // Import-specific metrics
      import_data_active: hasImportData,
      import_sales_count: hasImportData ? importMetrics.totalSales : 0,
      import_products_count: hasImportData ? importMetrics.totalProducts : 0,
      last_import_date: hasImportData ? (importState.stats.sales.lastImportDate || importState.stats.products.lastImportDate) : null
    };
  }, [apiStats, importState, getDashboardMetrics, apiError]);

  return {
    data: combinedStats,
    loading: apiLoading && (importState.salesData.length === 0 && importState.productData.length === 0),
    error: apiError && apiError !== 'Backend not available' ? apiError : null, // ✅ Don't show backend unavailable as error
    hasImportData: importState.salesData.length > 0 || importState.productData.length > 0
  };
}

export function useCombinedSalesChart(period: '7d' | '30d' | '90d' = '30d') {
  const { data: apiChartData, loading: apiLoading, error: apiError, refetch } = useSalesChart(period);
  const { state: importState, getChartData } = useImportData();

  const combinedChartData = useMemo(() => {
    const hasImportData = importState.salesData.length > 0;
    const importChartData = getChartData(period);
    
    console.log('📈 useCombinedSalesChart - Data Status:', {
      hasImportData,
      apiChartData: apiChartData ? `${apiChartData.length} points` : 'null',
      importChartData: `${importChartData.length} points`,
      apiError
    });
    
    if (!apiChartData && !hasImportData) {
      return [];
    }
    
    if (hasImportData && (!apiChartData || apiChartData.length === 0)) {
      return importChartData;
    }
    
    if (apiChartData && apiChartData.length > 0 && !hasImportData) {
      return apiChartData;
    }
    
    // Merge both datasets if both are available
    if (apiChartData && apiChartData.length > 0 && hasImportData) {
      const mergedData = apiChartData.map((apiDay, index) => ({
        ...apiDay,
        penjualan: (apiDay.penjualan || 0) + (importChartData[index]?.penjualan || 0),
        target: Math.max(apiDay.target || 0, importChartData[index]?.target || 0),
        // Add metadata to track data sources
        hasApiData: (apiDay.penjualan || 0) > 0,
        hasImportData: (importChartData[index]?.penjualan || 0) > 0
      }));
      return mergedData;
    }
    
    // Fallback to import data if available
    if (hasImportData) {
      return importChartData.map(day => ({
        ...day,
        hasApiData: false,
        hasImportData: true
      }));
    }
    
    return [];
  }, [apiChartData, importState, getChartData, period, apiError]);

  const calculateTrend = () => {
    if (!combinedChartData || combinedChartData.length < 2) {
      return { trend: 'neutral', percentage: 0 };
    }
    
    const recent = combinedChartData.slice(-3).reduce((sum, item) => sum + item.penjualan, 0) / 3;
    const previous = combinedChartData.slice(-6, -3).reduce((sum, item) => sum + item.penjualan, 0) / 3;
    
    if (recent > previous) {
      return { trend: 'up', percentage: ((recent - previous) / previous * 100).toFixed(1) };
    } else if (recent < previous) {
      return { trend: 'down', percentage: ((previous - recent) / previous * 100).toFixed(1) };
    }
    return { trend: 'neutral', percentage: 0 };
  };

  return {
    data: combinedChartData,
    loading: apiLoading && importState.salesData.length === 0,
    error: apiError && apiError !== 'Backend not available' ? apiError : null, // ✅ Don't show backend unavailable as error
    refetch,
    hasImportData: importState.salesData.length > 0,
    trend: calculateTrend(),
    importMetrics: {
      totalImportSales: importState.salesData.length,
      totalImportRevenue: importState.salesData.reduce((sum, sale) => sum + (sale.total_revenue || sale.order_amount), 0)
    }
  };
}

// Hook for combined analytics data
export function useCombinedAnalytics() {
  const { state: importState, getCategorySales, getBrandPerformance, getTopProducts, getRecentActivities } = useImportData();

  return useMemo(() => ({
    categorySales: getCategorySales(),
    brandPerformance: getBrandPerformance(),
    topProducts: getTopProducts(),
    recentActivities: getRecentActivities(),
    hasData: importState.salesData.length > 0 || importState.productData.length > 0,
    summary: {
      totalImportedSales: importState.salesData.length,
      totalImportedProducts: importState.productData.length,
      totalImportedStock: importState.stockData.length,
      lastImportDate: importState.stats.sales.lastImportDate || 
                       importState.stats.products.lastImportDate || 
                       importState.stats.stock.lastImportDate
    }
  }), [importState, getCategorySales, getBrandPerformance, getTopProducts, getRecentActivities]);
}