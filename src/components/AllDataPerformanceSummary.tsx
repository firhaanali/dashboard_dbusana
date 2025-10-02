import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Database, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar, 
  MapPin, 
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Zap,
  Clock,
  Target,
  Activity,
  Sparkles
} from 'lucide-react';
import { useSalesData } from '../contexts/SalesDataContext';
import { useMonthlyTrends } from '../hooks/useMonthlyTrends';
import { formatNumberShort } from '../utils/numberFormatUtils';

interface AllDataSummaryMetrics {
  totalRecords: number;
  dateRange: {
    start: string;
    end: string;
    duration: number;
  };
  performance: {
    orders: number;
    revenue: number;
    growth: number;
    avgDaily: number;
  };
  coverage: {
    provinces: number;
    cities: number;
    marketplaces: number;
    products: number;
  };
  businessHealth: {
    score: number;
    status: 'excellent' | 'good' | 'average' | 'poor';
    trends: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
}

export function AllDataPerformanceSummary() {
  const [metrics, setMetrics] = useState<AllDataSummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { salesData, isLoading: salesLoading } = useSalesData();
  const { data: monthlyTrends, loading: trendsLoading } = useMonthlyTrends();

  const calculateAllDataMetrics = useMemo(() => {
    return (data: any[]): AllDataSummaryMetrics | null => {
      if (!data || data.length === 0) return null;

      console.log('🔍 All Data Performance Summary - Processing', data.length, 'records');

      // Date range analysis
      const sortedDates = data
        .filter(item => item.delivered_time || item.created_time)
        .map(item => new Date(item.delivered_time || item.created_time))
        .sort((a, b) => a.getTime() - b.getTime());

      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
      const durationDays = startDate && endDate ? 
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 1;

      // Performance metrics
      const totalOrders = new Set(data.map(item => item.order_id)).size;
      const totalRevenue = data.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0);
      const avgDaily = totalRevenue / Math.max(durationDays, 1);
      const growthRate = monthlyTrends?.trends.totalRevenue.percentageChange || 0;

      // Coverage analysis
      const uniqueProvinces = new Set(data.filter(item => item.province).map(item => item.province)).size;
      const uniqueCities = new Set(data.filter(item => item.regency_city).map(item => item.regency_city)).size;
      const uniqueMarketplaces = new Set(data.map(item => item.marketplace)).size;
      const uniqueProducts = new Set(data.map(item => `${item.product_name}-${item.color}-${item.size}`)).size;

      // Business health calculation
      const healthFactors = [
        totalOrders > 100 ? 1 : totalOrders / 100, // Orders factor
        totalRevenue > 10000000 ? 1 : totalRevenue / 10000000, // Revenue factor
        uniqueMarketplaces > 1 ? 1 : uniqueMarketplaces, // Diversification factor
        uniqueProvinces > 5 ? 1 : uniqueProvinces / 5, // Geographic reach factor
        growthRate > 0 ? 1 : 0.5 // Growth factor
      ];

      const healthScore = Math.min(100, (healthFactors.reduce((sum, factor) => sum + factor, 0) / healthFactors.length) * 100);
      
      let healthStatus: 'excellent' | 'good' | 'average' | 'poor';
      if (healthScore >= 80) healthStatus = 'excellent';
      else if (healthScore >= 60) healthStatus = 'good';
      else if (healthScore >= 40) healthStatus = 'average';
      else healthStatus = 'poor';

      // Trend analysis from monthly data
      const trendsData = monthlyTrends?.trends;
      const positiveTrends = trendsData ? Object.values(trendsData).filter(t => t.percentageChange > 0).length : 0;
      const negativeTrends = trendsData ? Object.values(trendsData).filter(t => t.percentageChange < 0).length : 0;
      const neutralTrends = trendsData ? Object.values(trendsData).filter(t => t.percentageChange === 0).length : 0;

      return {
        totalRecords: data.length,
        dateRange: {
          start: startDate ? startDate.toLocaleDateString('id-ID') : 'N/A',
          end: endDate ? endDate.toLocaleDateString('id-ID') : 'N/A',
          duration: durationDays
        },
        performance: {
          orders: totalOrders,
          revenue: totalRevenue,
          growth: growthRate,
          avgDaily
        },
        coverage: {
          provinces: uniqueProvinces,
          cities: uniqueCities,
          marketplaces: uniqueMarketplaces,
          products: uniqueProducts
        },
        businessHealth: {
          score: Math.round(healthScore),
          status: healthStatus,
          trends: {
            positive: positiveTrends,
            negative: negativeTrends,
            neutral: neutralTrends
          }
        }
      };
    };
  }, [monthlyTrends]);

  useEffect(() => {
    if (salesData && salesData.length > 0) {
      setLoading(true);
      try {
        const allDataMetrics = calculateAllDataMetrics(salesData);
        setMetrics(allDataMetrics);
        
        console.log('✅ All Data Performance Summary calculated:', {
          totalRecords: allDataMetrics?.totalRecords,
          businessHealth: allDataMetrics?.businessHealth.score,
          coverage: allDataMetrics?.coverage
        });
      } catch (error) {
        console.error('❌ Error calculating all data metrics:', error);
      } finally {
        setLoading(false);
      }
    } else if (!salesLoading) {
      setLoading(false);
    }
  }, [salesData, salesLoading, calculateAllDataMetrics]);

  if (loading || salesLoading || trendsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 animate-pulse" />
            All Data Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Activity className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
            <p>Analyzing all data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-500" />
            All Data Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Database className="w-8 h-8 mx-auto mb-2" />
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <Sparkles className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'average': return <BarChart3 className="w-4 h-4" />;
      case 'poor': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            All Data Performance Summary
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {metrics.dateRange.duration} days
            </Badge>
            <Badge variant="secondary">
              {metrics.totalRecords.toLocaleString('id-ID')} records
            </Badge>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete overview dari {metrics.dateRange.start} sampai {metrics.dateRange.end} 
          • Comprehensive business intelligence dari seluruh data penjualan
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{metrics.performance.orders.toLocaleString('id-ID')}</p>
              <p className="text-xs text-blue-700">Total Orders</p>
            </div>
            
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{formatNumberShort(metrics.performance.revenue)}</p>
              <p className="text-xs text-green-700">Total Revenue</p>
            </div>
            
            <div className="text-center p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-600">{formatNumberShort(metrics.performance.avgDaily)}</p>
              <p className="text-xs text-purple-700">Daily Average</p>
            </div>
            
            <div className="text-center p-3 bg-orange-100 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <div className="flex items-center justify-center gap-1">
                {metrics.performance.growth > 0 ? 
                  <TrendingUp className="w-4 h-4 text-green-600" /> : 
                  <TrendingDown className="w-4 h-4 text-red-600" />
                }
                <p className={`text-xl font-bold ${metrics.performance.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.performance.growth > 0 ? '+' : ''}{metrics.performance.growth.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-orange-700">Growth Rate</p>
            </div>
          </div>

          {/* Business Coverage */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-lg font-bold">{metrics.coverage.provinces}</p>
                <p className="text-xs text-muted-foreground">Provinces</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <MapPin className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-lg font-bold">{metrics.coverage.cities}</p>
                <p className="text-xs text-muted-foreground">Cities</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-lg font-bold">{metrics.coverage.marketplaces}</p>
                <p className="text-xs text-muted-foreground">Marketplaces</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Package className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-lg font-bold">{metrics.coverage.products}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
            </div>
          </div>

          {/* Business Health Score */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-dashed border-blue-300">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${getHealthColor(metrics.businessHealth.status)}`}>
                {getHealthIcon(metrics.businessHealth.status)}
              </div>
              <div>
                <p className="font-medium">Business Health Score</p>
                <p className="text-sm text-muted-foreground">
                  Overall performance dari semua aspek bisnis
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{metrics.businessHealth.score}</div>
                <div className="text-sm text-muted-foreground">/100</div>
              </div>
              <Badge className={getHealthColor(metrics.businessHealth.status)}>
                {metrics.businessHealth.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Trend Summary */}
          {metrics.businessHealth.trends.positive + metrics.businessHealth.trends.negative > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Monthly Trends:</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>{metrics.businessHealth.trends.positive} improving</span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <TrendingDown className="w-3 h-3" />
                  <span>{metrics.businessHealth.trends.negative} declining</span>
                </div>
                {metrics.businessHealth.trends.neutral > 0 && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <span>—</span>
                    <span>{metrics.businessHealth.trends.neutral} stable</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}