import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Warehouse, AlertTriangle, BarChart3, Calculator, Banknote, Megaphone, Zap, ChevronRight, ChevronLeft, RefreshCcw, HandCoins, Gift, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useSalesData } from '../contexts/SalesDataContext';
import { enhancedApi } from '../utils/enhancedApiWrapper';
import { formatCurrencyResponsive, formatNumberShort, formatWithTooltip } from '../utils/numberFormatUtils';
import { DateRange, DateRangeData, filterDataByDateRange, calculateTrendPercentage, getTrendInfo } from '../utils/dateRangeUtils';
import { DateRangePicker } from './DateRangePicker';
import { useMonthlyTrends } from '../hooks/useMonthlyTrends';
import { makeSimpleApiRequest } from '../utils/simpleApiUtils';
import { useLanguageUtils } from '../hooks/useLanguageUtils';

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  subtitle?: string;
  color?: string;
  loading?: boolean;
  tooltip?: string;
  isShortened?: boolean;
  trendPercentage?: number;
  showTrend?: boolean;
  monthlyTrendInfo?: {
    percentageChange: number;
    direction: 'up' | 'down' | 'neutral';
    color: string;
    isImprovement: boolean;
    comparisonPeriod?: string;
  };
}

interface KPICardsProps {
  dateRange?: DateRange;
  dateRangeData?: DateRangeData | null;
  onDateRangeChange?: (range: DateRange) => void;
}

function KPICard({ title, value, change, changeType, icon: Icon, subtitle, color = 'text-blue-600', loading, tooltip, isShortened, trendPercentage, showTrend, monthlyTrendInfo }: KPICardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return <TrendingUp className="w-3 h-3" />;
      case 'negative': return <TrendingDown className="w-3 h-3" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  const valueDisplay = (
    <div className="text-3xl font-bold text-foreground mb-1 break-words">{value}</div>
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground truncate pr-2">
          {title}
        </CardTitle>
        <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
      </CardHeader>
      <CardContent>
        {tooltip && isShortened ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {valueDisplay}
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          valueDisplay
        )}
        {subtitle && (
          <p className="text-muted-foreground mb-1 break-words">{subtitle}</p>
        )}
        {/* Monthly Trend Display (Priority) */}
        {monthlyTrendInfo && monthlyTrendInfo.percentageChange !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${monthlyTrendInfo.color || 'text-gray-600'}`}>
            {monthlyTrendInfo.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {monthlyTrendInfo.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {monthlyTrendInfo.direction === 'neutral' && <span className="w-3 h-3 flex items-center justify-center">—</span>}
            <span className="break-words">
              {(monthlyTrendInfo.percentageChange || 0) > 0 ? '+' : ''}{(monthlyTrendInfo.percentageChange || 0).toFixed(1)}%
            </span>
          </div>
        )}
        {/* Fallback to existing trend system */}
        {!monthlyTrendInfo && showTrend && trendPercentage !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${getTrendInfo(trendPercentage).color}`}>
            {getTrendInfo(trendPercentage).direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {getTrendInfo(trendPercentage).direction === 'down' && <TrendingDown className="w-3 h-3" />}
            <span className="break-words">
              {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
            </span>
          </div>
        )}
        {/* Legacy change display */}
        {!monthlyTrendInfo && change && !showTrend && (
          <div className={`flex items-center gap-1 text-xs ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="break-words">{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetrics {
  distinctOrders: number;
  totalQuantitySold: number;
  totalGMV: number;
  totalRevenue: number;
  totalSettlementAmount: number;
  totalProfit: number;
  totalHPP: number;
  profitMargin: number;
  averageOrderValue: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockQuantity: number;
  totalStockValue: number;
  totalStockCost: number;
  averageStockPerProduct: number;
  totalAdvertisingSettlement: number;
  totalAffiliateEndorseFee: number;
  totalAffiliateActualSales: number;
  totalAffiliateCommission: number;
  netProfit: number;
}

export function KPICards({ dateRange, dateRangeData, onDateRangeChange }: KPICardsProps = {}) {
  const navigate = useNavigate();
  const { quick, formatters } = useLanguageUtils();
  const [loading, setLoading] = useState(true);
  const [currentKPIPage, setCurrentKPIPage] = useState(0);
  const [backendMetrics, setBackendMetrics] = useState<DashboardMetrics | null>(null);
  const [previousPeriodMetrics, setPreviousPeriodMetrics] = useState<DashboardMetrics | null>(null);

  // Monthly trends data for month-over-month comparison
  const { data: monthlyTrendsData, loading: monthlyTrendsLoading } = useMonthlyTrends();

  // Debug logging for monthly trends
  useEffect(() => {
    console.log('📊 KPICards monthly trends status:', {
      loading: monthlyTrendsLoading,
      hasData: Boolean(monthlyTrendsData),
      hasTrends: Boolean(monthlyTrendsData?.trends),
      currentPeriod: monthlyTrendsData?.currentPeriod?.label,
      previousPeriod: monthlyTrendsData?.previousPeriod?.label,
      availableTrendKeys: monthlyTrendsData?.trends ? Object.keys(monthlyTrendsData.trends) : [],
      advertisingTrend: monthlyTrendsData?.trends?.totalAdvertisingSettlement?.percentageChange
    });
  }, [monthlyTrendsData, monthlyTrendsLoading]);

  // Use SalesData context
  const { salesData, salesSummary, isLoading: salesLoading } = useSalesData();

  // Stabilize dateRange with useMemo to prevent unnecessary re-renders
  const stableDateRange = useMemo(() => dateRange, [
    dateRange?.from?.getTime(), 
    dateRange?.to?.getTime()
  ]);

  const stableDateRangeData = useMemo(() => dateRangeData, [
    dateRangeData?.currentPeriod?.from?.getTime(),
    dateRangeData?.currentPeriod?.to?.getTime(),
    dateRangeData?.previousPeriod?.from?.getTime(),
    dateRangeData?.previousPeriod?.to?.getTime(),
    dateRangeData?.label
  ]);

  // Calculate metrics from sales data with date filtering
  const calculateSalesMetrics = useCallback((data: any[]): Partial<DashboardMetrics> => {
    if (!data || data.length === 0) {
      return {
        distinctOrders: 0,
        totalQuantitySold: 0,
        totalGMV: 0,
        totalRevenue: 0,
        totalSettlementAmount: 0,
        totalProfit: 0,
        totalHPP: 0,
        profitMargin: 0,
        averageOrderValue: 0
      };
    }

    const distinctOrders = new Set(data.map(item => item.order_id)).size;
    const totalQuantitySold = data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalGMV = data.reduce((sum, item) => sum + (Number(item.order_amount) || 0), 0);
    const totalRevenue = data.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0);
    const totalSettlementAmount = data.reduce((sum, item) => sum + (Number(item.settlement_amount) || 0), 0);
    const totalHPP = data.reduce((sum, item) => sum + (Number(item.hpp) || 0), 0);
    const totalProfit = totalSettlementAmount - totalHPP;
    const profitMargin = totalSettlementAmount > 0 ? (totalProfit / totalSettlementAmount) * 100 : 0;
    const averageOrderValue = distinctOrders > 0 ? totalRevenue / distinctOrders : 0;

    return {
      distinctOrders,
      totalQuantitySold,
      totalGMV,
      totalRevenue,
      totalSettlementAmount,
      totalProfit,
      totalHPP,
      profitMargin,
      averageOrderValue
    };
  }, []);

  // Fetch backend metrics (stock, advertising, etc.)
  useEffect(() => {
    let isMounted = true;
    
    const fetchBackendMetrics = async () => {
      try {
        // Build query parameters based on date range
        let queryParams = '';
        if (stableDateRangeData?.currentPeriod) {
          const startDate = stableDateRangeData.currentPeriod.from.toISOString().split('T')[0];
          const endDate = stableDateRangeData.currentPeriod.to.toISOString().split('T')[0];
          queryParams = `?start_date=${startDate}&end_date=${endDate}`;
          console.log('📊 KPI Cards fetching metrics with date range:', { 
            startDate, 
            endDate, 
            label: stableDateRangeData.label 
          });
        } else {
          console.log('📊 KPI Cards fetching metrics without date filtering (All Data)');
        }
        
        // ✅ Use makeSimpleApiRequest like NetProfitSummaryCard for consistent results
        const metricsResponse = await makeSimpleApiRequest(`/dashboard/metrics${queryParams}`);
        
        if (isMounted && metricsResponse.success && metricsResponse.data) {
          console.log('📊 KPI Cards received metrics via makeSimpleApiRequest:', {
            totalAdvertisingSettlement: metricsResponse.data.totalAdvertisingSettlement,
            totalAffiliateEndorseFee: metricsResponse.data.totalAffiliateEndorseFee,
            period: stableDateRangeData?.label || 'All Data',
            endpoint: `/dashboard/metrics${queryParams || ''}`,
            source: 'makeSimpleApiRequest'
          });
          setBackendMetrics(metricsResponse.data);
        } else {
          // Set default metrics structure if not available
          const defaultMetrics = {
            distinctOrders: 0,
            totalQuantitySold: 0,
            totalGMV: 0,
            totalRevenue: 0,
            totalSettlementAmount: 0,
            totalProfit: 0,
            totalHPP: 0,
            profitMargin: 0,
            averageOrderValue: 0,
            totalProducts: 0,
            lowStockProducts: 0,
            outOfStockProducts: 0,
            totalStockQuantity: 0,
            totalStockValue: 0,
            totalStockCost: 0,
            averageStockPerProduct: 0,
            totalAdvertisingSettlement: 0,
            totalAffiliateEndorseFee: 0,
            totalAffiliateActualSales: 0,
            totalAffiliateCommission: 0,
            netProfit: 0
          };
          setBackendMetrics(defaultMetrics);
        }
      } catch (err) {
        console.log('⚠️ KPI Cards metrics fetch failed:', err);
        console.log('⚠️ Metrics API fallback activated');
        // Use simple fallback structure that matches backend response
        const fallbackMetrics = {
          distinctOrders: 0,
          totalQuantitySold: 0,
          totalGMV: 0,
          totalRevenue: 0,
          totalSettlementAmount: 0,
          totalProfit: 0,
          totalHPP: 0,
          profitMargin: 0,
          averageOrderValue: 0,
          totalProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          totalStockQuantity: 0,
          totalStockValue: 0,
          totalStockCost: 0,
          averageStockPerProduct: 0,
          totalAdvertisingSettlement: 0,
          totalAffiliateEndorseFee: 0,
          totalAffiliateActualSales: 0,
          totalAffiliateCommission: 0,
          netProfit: 0
        };
        setBackendMetrics(fallbackMetrics);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBackendMetrics();
    
    return () => {
      isMounted = false;
    };
  }, [stableDateRangeData]);

  // Calculate current and previous period metrics when data changes
  const { currentMetrics, previousMetrics } = useMemo(() => {
    // Ensure we have at least empty sales data and backend metrics
    const safeSalesData = salesData || [];
    const safeBackendMetrics = backendMetrics || {
      distinctOrders: 0,
      totalQuantitySold: 0,
      totalGMV: 0,
      totalRevenue: 0,
      totalSettlementAmount: 0,
      totalProfit: 0,
      totalHPP: 0,
      profitMargin: 0,
      averageOrderValue: 0,
      totalProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      totalStockQuantity: 0,
      totalStockValue: 0,
      totalStockCost: 0,
      averageStockPerProduct: 0,
      totalAdvertisingSettlement: 0,
      totalAffiliateEndorseFee: 0,
      totalAffiliateActualSales: 0,
      totalAffiliateCommission: 0,
      netProfit: 0
    };

    let currentData = safeSalesData;
    let previousData: any[] = [];

    // Handle different data filtering scenarios
    if (stableDateRangeData) {
      // Use dateRangeData for specific date range
      currentData = filterDataByDateRange(safeSalesData, stableDateRangeData.currentPeriod);
      previousData = filterDataByDateRange(safeSalesData, stableDateRangeData.previousPeriod);
      
      console.log('📊 KPICards - Date filtering applied:', {
        totalData: safeSalesData.length,
        currentPeriodData: currentData.length,
        previousPeriodData: previousData.length,
        currentPeriod: {
          from: stableDateRangeData.currentPeriod.from?.toLocaleDateString('id-ID'),
          to: stableDateRangeData.currentPeriod.to?.toLocaleDateString('id-ID')
        }
      });
    } else if (!stableDateRange?.from && !stableDateRange?.to && !stableDateRangeData) {
      // "All Data" selection - use all data (only when both dateRange and dateRangeData are empty)
      currentData = safeSalesData;
      previousData = []; // No previous period for All Data
      
      console.log('📊 KPICards - All Data selection:', {
        totalData: safeSalesData.length,
        currentPeriodData: currentData.length,
        note: 'Using all available data, no trend comparison'
      });
    } else if (stableDateRange?.from || stableDateRange?.to) {
      // Custom date range selection
      currentData = filterDataByDateRange(safeSalesData, stableDateRange);
      // For custom ranges, calculate previous period if possible
      if (stableDateRange.from && stableDateRange.to) {
        const rangeDuration = stableDateRange.to.getTime() - stableDateRange.from.getTime();
        const previousRange = {
          from: new Date(stableDateRange.from.getTime() - rangeDuration),
          to: stableDateRange.from
        };
        previousData = filterDataByDateRange(safeSalesData, previousRange);
      }
      
      console.log('📊 KPICards - Custom date range filtering:', {
        totalData: safeSalesData.length,
        currentPeriodData: currentData.length,
        previousPeriodData: previousData.length,
        dateRange: {
          from: stableDateRange.from?.toLocaleDateString('id-ID'),
          to: stableDateRange.to?.toLocaleDateString('id-ID')
        }
      });
    }

    // Show sample data when current data is available
    if (currentData.length > 0) {
      console.log('📊 Sample current period data (first 3 records):', 
        currentData.slice(0, 3).map(item => ({
          order_id: item.order_id,
          delivered_time: item.delivered_time,
          settlement_amount: item.settlement_amount
        }))
      );
    }

    const currentSalesMetrics = calculateSalesMetrics(currentData);
    const previousSalesMetrics = calculateSalesMetrics(previousData);

    // Merge with backend metrics (stock, advertising data)
    const mergedCurrentMetrics: DashboardMetrics = {
      ...safeBackendMetrics,
      ...currentSalesMetrics,
      netProfit: (currentSalesMetrics.totalProfit || 0) - 
                 (safeBackendMetrics.totalAdvertisingSettlement || 0) - 
                 (safeBackendMetrics.totalAffiliateEndorseFee || 0)
    };

    const mergedPreviousMetrics: DashboardMetrics = {
      ...safeBackendMetrics,
      ...previousSalesMetrics,
      netProfit: (previousSalesMetrics.totalProfit || 0) - 
                 (safeBackendMetrics.totalAdvertisingSettlement || 0) - 
                 (safeBackendMetrics.totalAffiliateEndorseFee || 0)
    };

    return {
      currentMetrics: mergedCurrentMetrics,
      previousMetrics: mergedPreviousMetrics
    };
  }, [salesData, backendMetrics, stableDateRangeData, stableDateRange, calculateSalesMetrics]);

  // Update state when metrics are calculated
  useEffect(() => {
    if (currentMetrics && previousMetrics) {
      setPreviousPeriodMetrics(previousMetrics);
      console.log('✅ KPICards - Metrics calculated with date filtering:', {
        hasCurrentData: currentMetrics.distinctOrders > 0,
        hasPreviousData: previousMetrics.distinctOrders > 0,
        dateRangeLabel: stableDateRangeData?.label || 'No date range'
      });
    }
  }, [currentMetrics, previousMetrics, stableDateRangeData?.label]);

  // Check if we have sales data for the current period (based on filtered data)
  const hasSalesData = currentMetrics !== null && Number(currentMetrics.distinctOrders) > 0;
  
  // For inventory metrics, we check if we have backend data
  const hasInventoryData = backendMetrics !== null && Number(backendMetrics?.totalProducts || 0) > 0;
  
  // For advertising metrics, we check if we have backend advertising data
  const hasAdvertisingData = backendMetrics !== null && Number(backendMetrics?.totalAdvertisingSettlement || 0) > 0;
  
  // Debug logging for advertising data and date ranges
  console.log('📊 KPI Cards comprehensive status check:', {
    backendMetrics: backendMetrics ? 'available' : 'null',
    totalAdvertisingSettlement: backendMetrics?.totalAdvertisingSettlement,
    hasAdvertisingData,
    period: stableDateRangeData?.label || 'All Data',
    stableDateRange: stableDateRange ? {
      from: stableDateRange.from?.toLocaleDateString('id-ID'),
      to: stableDateRange.to?.toLocaleDateString('id-ID')
    } : 'null',
    stableDateRangeData: stableDateRangeData ? {
      label: stableDateRangeData.label,
      currentPeriod: {
        from: stableDateRangeData.currentPeriod?.from?.toLocaleDateString('id-ID'),
        to: stableDateRangeData.currentPeriod?.to?.toLocaleDateString('id-ID')
      }
    } : 'null',
    monthlyTrendsAvailable: Boolean(monthlyTrendsData),
    monthlyTrendsLoading
  });

  const isLoadingAny = loading || salesLoading;

  // Helper functions
  const getFormattedCurrency = (value: number | undefined | null) => {
    return formatWithTooltip(value);
  };

  const getTrendData = (currentValue: number, field: keyof DashboardMetrics) => {
    // For "All Data" selection, don't show trends (no previous period to compare)
    if (!stableDateRange?.from && !stableDateRange?.to && !stableDateRangeData) {
      return {
        trendPercentage: undefined,
        showTrend: false
      };
    }
    
    if (previousMetrics && (stableDateRangeData || (stableDateRange?.from && stableDateRange?.to))) {
      const previousValue = Number(previousMetrics[field]) || 0;
      const trendPercentage = calculateTrendPercentage(currentValue, previousValue);
      return {
        trendPercentage,
        showTrend: true
      };
    }
    return {
      trendPercentage: undefined,
      showTrend: false
    };
  };

  // Helper function to get monthly trend data for a specific KPI
  const getMonthlyTrendInfo = (kpiName: string) => {
    // Debug logging for monthly trends
    console.log('🔄 Monthly trends debug for', kpiName, {
      hasDateRange: Boolean(stableDateRange?.from || stableDateRange?.to),
      hasDateRangeData: Boolean(stableDateRangeData),
      monthlyTrendsData: monthlyTrendsData ? 'available' : 'null',
      hasTrends: Boolean(monthlyTrendsData?.trends),
      dateRangeLabel: stableDateRangeData?.label,
      availableTrends: monthlyTrendsData?.trends ? Object.keys(monthlyTrendsData.trends) : []
    });
    
    // DON'T show monthly trends when using "All Data" - only show for specific date ranges
    if (!stableDateRange?.from && !stableDateRange?.to && !stableDateRangeData) {
      console.log('🔄 Monthly trends skipped: All Data selection for', kpiName);
      return undefined; // No trends for "All Data" selection
    }

    if (!monthlyTrendsData || !monthlyTrendsData.trends) {
      console.log('🔄 Monthly trends skipped: No data available for', kpiName);
      return undefined;
    }

    const trendMap: Record<string, string> = {
      'distinctOrders': 'distinctOrders',
      'totalGMV': 'totalGMV',
      'totalRevenue': 'totalRevenue',
      'totalProfit': 'totalProfit',
      'netProfit': 'netProfit',
      'totalQuantity': 'totalQuantitySold',
      'averageOrderValue': 'averageOrderValue',
      'totalAdvertisingSettlement': 'totalAdvertisingSettlement'
    };

    const trendKey = trendMap[kpiName];
    if (!trendKey) return undefined;

    // Safely access the trends object
    const trends = monthlyTrendsData.trends as Record<string, any>;
    if (!trends || typeof trends !== 'object') {
      return undefined;
    }

    const trendInfo = trends[trendKey];
    if (!trendInfo || typeof trendInfo !== 'object') {
      console.log('🔄 Monthly trends: No trend info found for', kpiName, 'trendKey:', trendKey);
      return undefined;
    }
    
    const result = {
      percentageChange: Number(trendInfo.percentageChange) || 0,
      direction: trendInfo.direction || 'neutral',
      color: trendInfo.color || 'text-gray-600',
      isImprovement: Boolean(trendInfo.isImprovement),
      comparisonPeriod: monthlyTrendsData.previousPeriod?.label?.split(' ')[0] || 'N/A' // Just month name
    };
    
    console.log('✅ Monthly trend found for', kpiName, ':', {
      percentageChange: result.percentageChange,
      direction: result.direction,
      isImprovement: result.isImprovement,
      comparisonPeriod: result.comparisonPeriod
    });
    
    return result;
  };

  const kpis = useMemo(() => {
    // For sales metrics, use filtered data
    if (!hasSalesData || !currentMetrics) {
      return {
        distinctOrders: 0,
        totalQuantity: 0,
        totalGMV: 0,
        totalRevenue: 0,
        totalSettlementAmount: 0,
        totalProfit: 0,
        netProfit: 0,
        totalAdvertisingSettlement: 0,
        totalAffiliateEndorseFee: 0
      };
    }

    return {
      distinctOrders: currentMetrics.distinctOrders || 0,
      totalQuantity: currentMetrics.totalQuantitySold || 0,
      totalGMV: currentMetrics.totalGMV || 0,
      totalRevenue: currentMetrics.totalRevenue || 0,
      totalSettlementAmount: currentMetrics.totalSettlementAmount || 0,
      totalProfit: currentMetrics.totalProfit || 0,
      netProfit: currentMetrics.netProfit || 0,
      totalAdvertisingSettlement: currentMetrics.totalAdvertisingSettlement || 0,
      totalAffiliateEndorseFee: currentMetrics.totalAffiliateEndorseFee || 0
    };
  }, [hasSalesData, currentMetrics]);

  const mainKPIs = [
    {
      title: quick.kpi('total_orders'),
      value: hasSalesData ? kpis.distinctOrders.toString() : '0',
      icon: ShoppingCart,
      color: 'text-blue-600',
      subtitle: !hasSalesData ? quick.error('not_found') : undefined,
      monthlyTrendInfo: getMonthlyTrendInfo('distinctOrders'),
      ...getTrendData(kpis.distinctOrders, 'distinctOrders')
    },
    (() => {
      const formatted = hasSalesData ? getFormattedCurrency(kpis.totalGMV) : getFormattedCurrency(0);
      return {
        title: quick.kpi('total_revenue'),
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: BarChart3,
        color: 'text-orange-600',
        subtitle: !hasSalesData ? 'Tidak ada data untuk periode ini' : undefined,
        monthlyTrendInfo: getMonthlyTrendInfo('totalGMV'),
        ...getTrendData(kpis.totalGMV, 'totalGMV')
      };
    })(),
    (() => {
      const formatted = hasSalesData ? getFormattedCurrency(kpis.totalRevenue) : getFormattedCurrency(0);
      return {
        title: 'Total Revenue',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: DollarSign,
        color: 'text-green-600',
        subtitle: !hasSalesData ? 'Tidak ada data untuk periode ini' : undefined,
        monthlyTrendInfo: getMonthlyTrendInfo('totalRevenue'),
        ...getTrendData(kpis.totalRevenue, 'totalRevenue')
      };
    })(),
    (() => {
      const formatted = hasSalesData ? getFormattedCurrency(kpis.totalProfit) : getFormattedCurrency(0);
      return {
        title: 'Total Profit',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: Calculator,
        color: hasSalesData ? 
          (kpis.totalProfit > 0 ? 'text-emerald-600' : 'text-red-600') : 
          'text-gray-600',
        subtitle: !hasSalesData ? 'Tidak ada data untuk periode ini' : undefined,
        monthlyTrendInfo: getMonthlyTrendInfo('totalProfit'),
        ...getTrendData(kpis.totalProfit, 'totalProfit')
      };
    })(),
    (() => {
      // ✅ Always use backend advertising data, same approach as NetProfitSummaryCard
      const advertisingAmount = backendMetrics?.totalAdvertisingSettlement || 0;
      const formatted = getFormattedCurrency(advertisingAmount);
      
      console.log('📊 Total Biaya Iklan KPI:', {
        backendMetrics: backendMetrics ? 'available' : 'null',
        advertisingAmount,
        formatted: formatted.display,
        period: stableDateRangeData?.label || 'All Data',
        source: 'backendMetrics.totalAdvertisingSettlement'
      });
      
      return {
        title: 'Total Biaya Iklan',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: Megaphone,
        color: advertisingAmount > 0 ? 'text-orange-600' : 'text-gray-600',
        subtitle: advertisingAmount === 0 ? 'Tidak ada data iklan untuk periode ini' : undefined,
        monthlyTrendInfo: getMonthlyTrendInfo('totalAdvertisingSettlement'),
        ...getTrendData(advertisingAmount, 'totalAdvertisingSettlement')
      };
    })(),
    (() => {
      // ✅ Calculate Net Profit using backend data like NetProfitSummaryCard
      let netProfit = 0;
      if (hasSalesData && backendMetrics) {
        const totalProfit = kpis.totalProfit; // from sales data
        const advertisingCosts = Number(backendMetrics.totalAdvertisingSettlement) || 0;
        const affiliateEndorseFee = Number(backendMetrics.totalAffiliateEndorseFee) || 0;
        
        // Basic Net Profit calculation: Total Profit - Advertising - Affiliate Fees
        netProfit = totalProfit - advertisingCosts - affiliateEndorseFee;
        
        console.log('📊 Net Profit calculation:', {
          totalProfit,
          advertisingCosts,
          affiliateEndorseFee,
          calculatedNetProfit: netProfit,
          source: 'KPICards using backendMetrics'
        });
      }
      
      const formatted = getFormattedCurrency(netProfit);
      return {
        title: 'Pendapatan Bersih',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: Zap,
        color: hasSalesData ? 
          (netProfit > 0 ? 'text-emerald-600' : netProfit < 0 ? 'text-red-600' : 'text-gray-600') : 
          'text-gray-600',
        subtitle: !hasSalesData ? 'Tidak ada data untuk periode ini' : undefined,
        monthlyTrendInfo: getMonthlyTrendInfo('netProfit'),
        ...getTrendData(netProfit, 'netProfit')
      };
    })(),
    {
      title: 'Produk Terjual',
      value: hasSalesData ? kpis.totalQuantity.toString() : '0',
      icon: Package,
      color: 'text-purple-600',
      subtitle: !hasSalesData ? 'Tidak ada data untuk periode ini' : undefined,
      monthlyTrendInfo: getMonthlyTrendInfo('totalQuantity'),
      ...getTrendData(kpis.totalQuantity, 'totalQuantitySold')
    },
    (() => {
      const averageOrderValue = hasSalesData && currentMetrics ? currentMetrics.averageOrderValue || 0 : 0;
      const formatted = getFormattedCurrency(averageOrderValue);
      return {
        title: 'Rata-rata Nilai Order',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: Banknote,
        color: 'text-teal-600',
        subtitle: !hasSalesData ? 'Tidak ada data untuk periode ini' : undefined,
        monthlyTrendInfo: getMonthlyTrendInfo('averageOrderValue'),
        ...getTrendData(averageOrderValue, 'averageOrderValue')
      };
    })()
  ];

  const inventoryMetrics = useMemo(() => {
    // Inventory data is not date-filtered, use backend metrics directly
    const safeBackendMetrics = backendMetrics || {
      totalStockQuantity: 0,
      totalStockValue: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      totalProducts: 0
    };

    if (!hasInventoryData) {
      return {
        totalStock: 0,
        totalStockValue: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalProducts: 0
      };
    }

    return {
      totalStock: Number(safeBackendMetrics.totalStockQuantity) || 0,
      totalStockValue: Number(safeBackendMetrics.totalStockValue) || 0,
      lowStockProducts: Number(safeBackendMetrics.lowStockProducts) || 0,
      outOfStockProducts: Number(safeBackendMetrics.outOfStockProducts) || 0,
      totalProducts: Number(safeBackendMetrics.totalProducts) || 0
    };
  }, [hasInventoryData, backendMetrics]);

  const additionalMetrics = [
    {
      title: 'Total Jumlah Stok',
      value: hasInventoryData ? formatNumberShort(inventoryMetrics.totalStock, { maxLength: 10 }) : '0',
      icon: Warehouse,
      color: 'text-blue-600',
      subtitle: !hasInventoryData ? 'Tidak ada data stok' : undefined
    },
    (() => {
      const formatted = hasInventoryData ? getFormattedCurrency(inventoryMetrics.totalStockValue) : getFormattedCurrency(0);
      return {
        title: 'Nilai Total Stok',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: DollarSign,
        color: 'text-green-600',
        subtitle: !hasInventoryData ? 'Tidak ada data stok' : undefined
      };
    })(),
    {
      title: 'Stok Hampir Habis',
      value: hasInventoryData ? inventoryMetrics.lowStockProducts.toString() : '0',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      subtitle: !hasInventoryData ? 'Tidak ada data stok' : undefined
    },
    {
      title: 'Stok Habis',
      value: hasInventoryData ? inventoryMetrics.outOfStockProducts.toString() : '0',
      icon: AlertTriangle,
      color: 'text-red-600',
      subtitle: !hasInventoryData ? 'Tidak ada data stok' : undefined
    },
    
    // ⭐ NEW: Returns & Cancellations KPI
    (() => {
      const totalReturns = Number(backendMetrics?.totalReturnsAmount || 0);
      const formatted = getFormattedCurrency(totalReturns);
      return {
        title: 'Total Returns/Cancel',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: RotateCcw,
        color: 'text-red-600',
        subtitle: totalReturns === 0 ? 'Tidak ada data return' : undefined
      };
    })(),
    
    // ⭐ NEW: Marketplace Reimbursement KPI  
    (() => {
      const totalReimbursement = Number(backendMetrics?.totalReimbursementReceived || 0);
      const formatted = getFormattedCurrency(totalReimbursement);
      return {
        title: 'Reimbursement Diterima',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: HandCoins,
        color: 'text-green-600',
        subtitle: totalReimbursement === 0 ? 'Tidak ada reimbursement' : undefined
      };
    })(),
    
    // ⭐ NEW: Commission Adjustments KPI
    (() => {
      const totalCommissionLoss = Number(backendMetrics?.totalCommissionAdjustment || 0);
      const formatted = getFormattedCurrency(Math.abs(totalCommissionLoss));
      return {
        title: 'Commission Loss',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: TrendingDown,
        color: 'text-red-600',
        subtitle: totalCommissionLoss === 0 ? 'Tidak ada adjustment' : undefined
      };
    })(),
    
    // ⭐ NEW: Affiliate Samples Investment KPI
    (() => {
      const totalSampleInvestment = Number(backendMetrics?.totalAffiliateSampleCost || 0);
      const formatted = getFormattedCurrency(totalSampleInvestment);
      return {
        title: 'Affiliate Sample Investment',
        value: formatted.display,
        tooltip: formatted.tooltip,
        isShortened: formatted.isShortened,
        icon: Gift,
        color: 'text-purple-600',
        subtitle: totalSampleInvestment === 0 ? 'Tidak ada sample investment' : undefined
      };
    })()
  ];

  // Combine all KPIs into a single array
  const allKPIs = useMemo(() => {
    return [...mainKPIs, ...additionalMetrics];
  }, [mainKPIs, additionalMetrics]);

  // Pagination for all KPI cards
  const CARDS_PER_PAGE = 4;
  const totalPages = Math.ceil(allKPIs.length / CARDS_PER_PAGE);

  // Get current page data for all KPIs
  const getCurrentKPIs = () => {
    const startIndex = currentKPIPage * CARDS_PER_PAGE;
    return allKPIs.slice(startIndex, startIndex + CARDS_PER_PAGE);
  };

  const handleNextPage = () => {
    if (currentKPIPage < totalPages - 1) {
      setCurrentKPIPage(currentKPIPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentKPIPage > 0) {
      setCurrentKPIPage(currentKPIPage - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* All KPIs with Header and Controls */}
      <div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-medium text-foreground">Key Performance Indicators</h2>
            <p className="text-sm text-muted-foreground">Overview ringkasan performa bisnis D'Busana</p>
          </div>
          
          {/* Controls: Calendar and Pagination */}
          <div className="flex items-center gap-4">
            {/* Date Range Picker */}
            <DateRangePicker
              dateRange={dateRange || { from: undefined, to: undefined }}
              onDateRangeChange={onDateRangeChange || (() => {})}
              className="min-w-[280px]"
            />
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentKPIPage === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={i === currentKPIPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentKPIPage(i)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentKPIPage === totalPages - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {getCurrentKPIs().map((kpi, index) => (
            <KPICard key={`unified-${currentKPIPage}-${index}`} {...kpi} loading={isLoadingAny} />
          ))}
        </div>
      </div>
    </div>
  );
}