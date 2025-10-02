import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Warehouse, AlertTriangle, BarChart3, Calculator, Banknote, Megaphone, Zap, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useSalesData } from '../contexts/SalesDataContext';
import { enhancedApi } from '../utils/enhancedApiWrapper';
import { formatCurrencyResponsive, formatNumberShort, formatWithTooltip } from '../utils/numberFormatUtils';
import { DateRange, DateRangeData, filterDataByDateRange, calculateTrendPercentage, getTrendInfo } from '../utils/dateRangeUtils';
import { useMonthlyTrends } from '../hooks/useMonthlyTrends';

interface KPICardData {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  subtitle?: string;
  color?: string;
  tooltip?: string;
  trendPercentage?: number;
  showTrend?: boolean;
  category: 'sales' | 'inventory' | 'finance' | 'marketing';
  priority: number;
}

interface KPICarouselProps {
  dateRange?: DateRange;
  dateRangeData?: DateRangeData | null;
  onDateRangeChange?: (range: DateRange) => void;
}

const KPI_CATEGORIES = [
  { id: 'sales', name: 'Penjualan', color: 'bg-blue-50 border-blue-200' },
  { id: 'inventory', name: 'Inventory', color: 'bg-green-50 border-green-200' },
  { id: 'finance', name: 'Keuangan', color: 'bg-purple-50 border-purple-200' },
  { id: 'marketing', name: 'Marketing', color: 'bg-orange-50 border-orange-200' }
];

function KPICard({ data, loading }: { data: KPICardData; loading?: boolean }) {
  const getChangeColor = () => {
    switch (data.changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    if (data.changeType === 'positive') return <TrendingUp className="h-3 w-3" />;
    if (data.changeType === 'negative') return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  const cardContent = (
    <Card className="h-full interactive-hover transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <data.icon className={`h-5 w-5 ${data.color}`} />
              <p className="text-sm font-medium text-muted-foreground">{data.title}</p>
            </div>
            
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{data.value}</p>
                {data.subtitle && (
                  <p className="text-xs text-muted-foreground">{data.subtitle}</p>
                )}
              </div>
            )}
            
            {!loading && data.change && (
              <div className={`flex items-center gap-1 text-xs ${getChangeColor()}`}>
                {getTrendIcon()}
                <span>{data.change}</span>
              </div>
            )}
          </div>
          
          {data.showTrend && data.trendPercentage !== undefined && (
            <div className="text-right">
              <Badge 
                variant={data.changeType === 'positive' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {data.trendPercentage > 0 ? '+' : ''}{data.trendPercentage.toFixed(1)}%
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (data.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{data.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}

export function KPICarousel({ dateRange, dateRangeData, onDateRangeChange }: KPICarouselProps) {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPICardData[]>([]);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const { salesData } = useSalesData();
  const { monthlyTrends } = useMonthlyTrends();

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoSliding) return;
    
    const timer = setInterval(() => {
      setCurrentCategory((prev) => (prev + 1) % KPI_CATEGORIES.length);
    }, 8000); // Change slide every 8 seconds

    return () => clearInterval(timer);
  }, [isAutoSliding]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === ' ') {
        event.preventDefault();
        setIsAutoSliding(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Pause auto-slide on hover
  const handleMouseEnter = () => setIsAutoSliding(false);
  const handleMouseLeave = () => setIsAutoSliding(true);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple sources
      const [salesResponse, stockResponse, analyticsResponse] = await Promise.allSettled([
        enhancedApi.salesData.fetchSalesAnalytics(dateRange),
        enhancedApi.inventory.fetchStockSummary(),
        enhancedApi.analytics.fetchBusinessAnalytics(dateRange)
      ]);

      // Process sales data
      const salesAnalytics = salesResponse.status === 'fulfilled' ? salesResponse.value : null;
      const stockData = stockResponse.status === 'fulfilled' ? stockResponse.value : null;
      const businessAnalytics = analyticsResponse.status === 'fulfilled' ? analyticsResponse.value : null;

      // Calculate KPIs with fallback data
      const totalRevenue = salesAnalytics?.totalRevenue || salesData.reduce((sum, sale) => sum + (sale.settlement_amount || 0), 0);
      const totalOrders = salesAnalytics?.totalOrders || salesData.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Create KPI data array
      const kpis: KPICardData[] = [
        // Sales Category
        {
          id: 'total-revenue',
          title: 'Total Revenue',
          value: formatCurrencyResponsive(totalRevenue),
          changeType: totalRevenue > 0 ? 'positive' : 'neutral',
          change: salesAnalytics?.revenueGrowth ? `${salesAnalytics.revenueGrowth.toFixed(1)}% vs periode lalu` : undefined,
          icon: DollarSign,
          color: 'text-blue-600',
          category: 'sales',
          priority: 1,
          tooltip: 'Total pendapatan dari semua penjualan',
          showTrend: true,
          trendPercentage: salesAnalytics?.revenueGrowth || 0
        },
        {
          id: 'total-orders',
          title: 'Total Orders',
          value: formatNumberShort(totalOrders),
          changeType: totalOrders > 0 ? 'positive' : 'neutral',
          change: salesAnalytics?.orderGrowth ? `${salesAnalytics.orderGrowth.toFixed(1)}% vs periode lalu` : undefined,
          icon: ShoppingCart,
          color: 'text-blue-600',
          category: 'sales',
          priority: 2,
          tooltip: 'Jumlah total pesanan yang diterima'
        },
        {
          id: 'avg-order-value',
          title: 'Average Order Value',
          value: formatCurrencyResponsive(averageOrderValue),
          changeType: averageOrderValue > 0 ? 'positive' : 'neutral',
          icon: BarChart3,
          color: 'text-blue-600',
          category: 'sales',
          priority: 3,
          tooltip: 'Rata-rata nilai per pesanan'
        },

        // Inventory Category
        {
          id: 'total-stock',
          title: 'Total Stock Value',
          value: formatCurrencyResponsive(stockData?.totalStockValue || 0),
          changeType: 'neutral',
          icon: Package,
          color: 'text-green-600',
          category: 'inventory',
          priority: 1,
          tooltip: 'Total nilai stok yang tersedia'
        },
        {
          id: 'low-stock-items',
          title: 'Low Stock Items',
          value: formatNumberShort(stockData?.lowStockItems || 0),
          changeType: (stockData?.lowStockItems || 0) > 0 ? 'negative' : 'positive',
          icon: AlertTriangle,
          color: 'text-orange-600',
          category: 'inventory',
          priority: 2,
          tooltip: 'Produk dengan stok rendah yang memerlukan perhatian'
        },
        {
          id: 'inventory-turnover',
          title: 'Inventory Turnover',
          value: `${(stockData?.inventoryTurnover || 0).toFixed(1)}x`,
          changeType: (stockData?.inventoryTurnover || 0) > 5 ? 'positive' : 'neutral',
          icon: Warehouse,
          color: 'text-green-600',
          category: 'inventory',
          priority: 3,
          tooltip: 'Tingkat perputaran inventory'
        },

        // Finance Category
        {
          id: 'gross-profit',
          title: 'Gross Profit',
          value: formatCurrencyResponsive(businessAnalytics?.grossProfit || 0),
          changeType: (businessAnalytics?.grossProfit || 0) > 0 ? 'positive' : 'neutral',
          change: businessAnalytics?.profitGrowth ? `${businessAnalytics.profitGrowth.toFixed(1)}% vs periode lalu` : undefined,
          icon: Calculator,
          color: 'text-purple-600',
          category: 'finance',
          priority: 1,
          tooltip: 'Keuntungan kotor sebelum dikurangi biaya operasional'
        },
        {
          id: 'net-profit',
          title: 'Net Profit',
          value: formatCurrencyResponsive(businessAnalytics?.netProfit || 0),
          changeType: (businessAnalytics?.netProfit || 0) > 0 ? 'positive' : 'negative',
          icon: Banknote,
          color: 'text-purple-600',
          category: 'finance',
          priority: 2,
          tooltip: 'Keuntungan bersih setelah semua biaya'
        },
        {
          id: 'profit-margin',
          title: 'Profit Margin',
          value: `${(businessAnalytics?.profitMargin || 0).toFixed(1)}%`,
          changeType: (businessAnalytics?.profitMargin || 0) > 20 ? 'positive' : 'neutral',
          icon: TrendingUp,
          color: 'text-purple-600',
          category: 'finance',
          priority: 3,
          tooltip: 'Persentase keuntungan dari total revenue'
        },

        // Marketing Category
        {
          id: 'marketing-spend',
          title: 'Marketing Spend',
          value: formatCurrencyResponsive(businessAnalytics?.marketingSpend || 0),
          changeType: 'neutral',
          icon: Megaphone,
          color: 'text-orange-600',
          category: 'marketing',
          priority: 1,
          tooltip: 'Total pengeluaran untuk marketing dan iklan'
        },
        {
          id: 'marketing-roi',
          title: 'Marketing ROI',
          value: `${(businessAnalytics?.marketingROI || 0).toFixed(1)}%`,
          changeType: (businessAnalytics?.marketingROI || 0) > 0 ? 'positive' : 'negative',
          icon: Zap,
          color: 'text-orange-600',
          category: 'marketing',
          priority: 2,
          tooltip: 'Return on Investment dari aktivitas marketing'
        },
        {
          id: 'conversion-rate',
          title: 'Conversion Rate',
          value: `${(businessAnalytics?.conversionRate || 0).toFixed(1)}%`,
          changeType: (businessAnalytics?.conversionRate || 0) > 2 ? 'positive' : 'neutral',
          icon: BarChart3,
          color: 'text-orange-600',
          category: 'marketing',
          priority: 3,
          tooltip: 'Tingkat konversi dari visitor menjadi pembeli'
        }
      ];

      setKpiData(kpis);
    } catch (error) {
      console.warn('Error fetching KPI data, using fallback data');
      // Use fallback KPI data with basic calculations from salesData
      const fallbackKpis: KPICardData[] = [
        {
          id: 'total-revenue',
          title: 'Total Revenue',
          value: formatCurrencyResponsive(salesData.reduce((sum, sale) => sum + (sale.settlement_amount || 0), 0)),
          changeType: 'positive',
          icon: DollarSign,
          color: 'text-blue-600',
          category: 'sales',
          priority: 1
        },
        {
          id: 'total-orders',
          title: 'Total Orders',
          value: formatNumberShort(salesData.length),
          changeType: 'positive',
          icon: ShoppingCart,
          color: 'text-blue-600',
          category: 'sales',
          priority: 2
        }
      ];
      setKpiData(fallbackKpis);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIData();
  }, [dateRange, salesData]);

  const getCurrentCategoryData = () => {
    const categoryId = KPI_CATEGORIES[currentCategory].id;
    return kpiData
      .filter(kpi => kpi.category === categoryId)
      .sort((a, b) => a.priority - b.priority);
  };

  const goToPrevious = () => {
    setIsAutoSliding(false); // Stop auto-slide when user navigates manually
    setCurrentCategory((prev) => (prev - 1 + KPI_CATEGORIES.length) % KPI_CATEGORIES.length);
  };

  const goToNext = () => {
    setIsAutoSliding(false); // Stop auto-slide when user navigates manually
    setCurrentCategory((prev) => (prev + 1) % KPI_CATEGORIES.length);
  };

  const currentCategoryData = getCurrentCategoryData();
  const currentCategoryInfo = KPI_CATEGORIES[currentCategory];

  return (
    <div className="space-y-4" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Category Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className={`px-4 py-2 rounded-lg border ${currentCategoryInfo.color}`}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{currentCategoryInfo.name}</h3>
              <span className="text-xs text-muted-foreground">
                {currentCategory + 1}/{KPI_CATEGORIES.length}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Auto-slide Control & Category Indicators */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoSliding(!isAutoSliding)}
            className="h-8 w-8 p-0"
            title={isAutoSliding ? 'Pause auto-slide' : 'Resume auto-slide'}
          >
            {isAutoSliding ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          
          <div className="flex gap-2">
            {KPI_CATEGORIES.map((category, index) => (
              <button
                key={category.id}
                onClick={() => {
                  setCurrentCategory(index);
                  setIsAutoSliding(false);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentCategory 
                    ? 'bg-accent-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                title={category.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid with Animation */}
      <div className="relative overflow-hidden">
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 ease-in-out"
          key={currentCategory} // This forces re-render with animation
        >
          {currentCategoryData.length > 0 ? (
            currentCategoryData.map((kpi, index) => (
              <div
                key={kpi.id}
                className="animate-in slide-in-from-right duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <KPICard
                  data={kpi}
                  loading={loading}
                />
              </div>
            ))
          ) : (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-in slide-in-from-right duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auto-slide Progress Bar & Help Text */}
      <div className="space-y-2">
        <div className="w-full bg-muted rounded-full h-1">
          <div 
            className="bg-accent-primary h-1 rounded-full transition-all duration-100 ease-linear"
            style={{
              width: `${((currentCategory + 1) / KPI_CATEGORIES.length) * 100}%`
            }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Keyboard: ← → untuk navigasi</span>
            <span>Spacebar untuk pause/resume</span>
          </div>
          <div className="flex items-center gap-2">
            {isAutoSliding && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <span>Auto-slide aktif</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}