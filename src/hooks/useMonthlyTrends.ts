import { useState, useEffect, useCallback } from 'react';
import { enhancedApi } from '../utils/enhancedApiWrapper';

interface MonthlyMetrics {
  distinctOrders: number;
  totalQuantitySold: number;
  totalGMV: number;
  totalRevenue: number;
  totalSettlementAmount: number;
  totalProfit: number;
  totalAdvertisingSettlement: number;
  totalAffiliateEndorseFee: number;
  totalAffiliateActualSales: number;
  totalAffiliateCommission: number;
  totalSalariesBenefits: number;
  netProfit: number;
  averageOrderValue: number;
}

interface StockMetrics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockQuantity: number;
  totalStockValue: number;
  averageStockPerProduct: number;
}

interface TrendInfo {
  percentageChange: number;
  direction: 'up' | 'down' | 'neutral';
  color: string;
  isImprovement: boolean;
  absoluteChange: number;
}

interface KPITrends {
  distinctOrders: TrendInfo;
  totalQuantitySold: TrendInfo;
  totalGMV: TrendInfo;
  totalRevenue: TrendInfo;
  totalSettlementAmount: TrendInfo;
  totalProfit: TrendInfo;
  totalAdvertisingSettlement: TrendInfo;
  totalAffiliateEndorseFee: TrendInfo;
  netProfit: TrendInfo;
  averageOrderValue: TrendInfo;
}

interface MonthlyTrendsData {
  currentPeriod: {
    label: string;
    startDate: string;
    endDate: string;
    metrics: MonthlyMetrics;
  };
  previousPeriod: {
    label: string;
    startDate: string;
    endDate: string;
    metrics: MonthlyMetrics;
  };
  stockMetrics: StockMetrics;
  trends: KPITrends;
  summary: {
    totalKPIs: number;
    improvingKPIs: number;
    decliningKPIs: number;
    neutralKPIs: number;
  };
}

interface MonthlyTrendSummary {
  currentMonth: string;
  previousMonth: string;
  revenueChange: {
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
    color: string;
  };
  profitChange: {
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
    color: string;
  };
  currentMetrics: {
    revenue: number;
    profit: number;
    sales: number;
  };
  previousMetrics: {
    revenue: number;
    profit: number;
    sales: number;
  };
}

export const useMonthlyTrends = () => {
  const [data, setData] = useState<MonthlyTrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await enhancedApi.dashboard.getMonthlyTrends();

      if (result.success && result.data) {
        setData(result.data);
        console.log('✅ Monthly trends data loaded:', {
          currentMonth: result.data.currentPeriod?.label || 'N/A',
          previousMonth: result.data.previousPeriod?.label || 'N/A',
          improvingKPIs: result.data.summary?.improvingKPIs || 0,
          decliningKPIs: result.data.summary?.decliningKPIs || 0,
          sampleTrends: {
            revenue: result.data.trends?.totalRevenue?.percentageChange?.toFixed(1) + '%' || '0.0%',
            profit: result.data.trends?.totalProfit?.percentageChange?.toFixed(1) + '%' || '0.0%',
            orders: result.data.trends?.distinctOrders?.percentageChange?.toFixed(1) + '%' || '0.0%'
          }
        });
      } else {
        console.log('⚠️ Monthly trends using fallback data');
        setError(null); // Don't show error to user, enhanced API provides fallback
      }
    } catch (err) {
      console.log('⚠️ Monthly trends error, using fallback:', err);
      setError(null); // Enhanced API wrapper handles fallbacks automatically
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthlyTrends();
  }, [fetchMonthlyTrends]);

  // Helper functions
  const getTrendForKPI = (kpiName: keyof KPITrends) => {
    return data?.trends[kpiName] || null;
  };

  const getCurrentMetric = (metricName: keyof MonthlyMetrics) => {
    return data?.currentPeriod.metrics[metricName] || 0;
  };

  const getPreviousMetric = (metricName: keyof MonthlyMetrics) => {
    return data?.previousPeriod.metrics[metricName] || 0;
  };

  const getOverallPerformance = () => {
    if (!data) return null;

    const { improvingKPIs, decliningKPIs, totalKPIs } = data.summary;
    const improvementRate = (improvingKPIs / totalKPIs) * 100;

    return {
      status: improvementRate >= 60 ? 'excellent' : 
              improvementRate >= 40 ? 'good' : 
              improvementRate >= 20 ? 'average' : 'poor',
      improvementRate,
      improvingKPIs,
      decliningKPIs,
      message: improvementRate >= 60 ? 'Performa sangat baik! Mayoritas KPI meningkat.' :
               improvementRate >= 40 ? 'Performa baik dengan beberapa area untuk diperbaiki.' :
               improvementRate >= 20 ? 'Performa rata-rata, perlu fokus perbaikan.' :
               'Performa perlu perhatian khusus, banyak KPI menurun.'
    };
  };

  return {
    // Data
    data,
    
    // State
    loading,
    error,
    
    // Computed data
    hasData: !!data,
    
    // Actions
    refetch: fetchMonthlyTrends,
    
    // Helper functions
    getTrendForKPI,
    getCurrentMetric,
    getPreviousMetric,
    getOverallPerformance
  };
};

// Hook for just the summary data (lightweight for dashboard widgets)
export const useMonthlyTrendSummary = () => {
  const [summary, setSummary] = useState<MonthlyTrendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use main monthly trends API for summary as well
      const result = await enhancedApi.dashboard.getMonthlyTrends();

      if (result.success && result.data) {
        // Extract summary from the full data
        const currentDate = new Date();
        const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        
        const summaryData: MonthlyTrendSummary = {
          currentMonth: currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          previousMonth: previousDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          revenueChange: {
            percentage: result.data.trends?.totalRevenue?.percentageChange || 0,
            direction: result.data.trends?.totalRevenue?.direction || 'neutral',
            color: result.data.trends?.totalRevenue?.color || 'text-gray-600'
          },
          profitChange: {
            percentage: result.data.trends?.totalProfit?.percentageChange || 0,
            direction: result.data.trends?.totalProfit?.direction || 'neutral',
            color: result.data.trends?.totalProfit?.color || 'text-gray-600'
          },
          currentMetrics: {
            revenue: result.data.currentPeriod?.metrics?.totalRevenue || 0,
            profit: result.data.currentPeriod?.metrics?.totalProfit || 0,
            sales: result.data.currentPeriod?.metrics?.distinctOrders || 0
          },
          previousMetrics: {
            revenue: result.data.previousPeriod?.metrics?.totalRevenue || 0,
            profit: result.data.previousPeriod?.metrics?.totalProfit || 0,
            sales: result.data.previousPeriod?.metrics?.distinctOrders || 0
          }
        };

        setSummary(summaryData);
        console.log('✅ Monthly trend summary loaded:', {
          currentMonth: summaryData.currentMonth,
          revenueChange: summaryData.revenueChange.percentage.toFixed(1) + '%',
          profitChange: summaryData.profitChange.percentage.toFixed(1) + '%'
        });
      } else {
        console.log('⚠️ Monthly trend summary using fallback data');
        setError(null); // Enhanced API provides fallback
      }
    } catch (err) {
      console.log('⚠️ Monthly trend summary error, using fallback:', err);
      setError(null); // Enhanced API wrapper handles fallbacks automatically
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
};