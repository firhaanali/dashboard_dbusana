import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Activity, 
  Clock, 
  Users, 
  ShoppingCart, 
  Package,
  DollarSign,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useSalesData } from '../contexts/SalesDataContext';
import { simpleApiUtils } from '../utils/simpleApiUtils';

// Interfaces for Performance Metrics
interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  category: 'revenue' | 'operations' | 'customer' | 'product' | 'marketplace';
}

interface PerformanceScore {
  overall: number;
  revenue: number;
  operations: number;
  customer: number;
  product: number;
  marketplace: number;
}

interface ProductPerformance {
  product_name: string;
  revenue: number;
  units_sold: number;
  conversion_rate: number;
  margin: number;
  growth_rate: number;
}

interface MarketplacePerformance {
  marketplace: string;
  revenue: number;
  orders: number;
  conversion_rate: number;
  avg_order_value: number;
  fulfillment_rate: number;
  growth_rate: number;
}

interface OperationalMetrics {
  order_processing_time: number;
  fulfillment_rate: number;
  stock_turnover: number;
  return_rate: number;
  customer_satisfaction: number;
}

export function PerformanceMetrics() {
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [performanceScores, setPerformanceScores] = useState<PerformanceScore | null>(null);

  // Use SalesData context instead of fetching separately
  const { salesData, salesSummary, isLoading: salesLoading, refreshSalesData } = useSalesData();

  // Colors for charts
  const COLORS = ['#ec4899', '#8b5cf6', '#06d6a0', '#ffd60a', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
  const STATUS_COLORS = {
    excellent: '#10b981',
    good: '#3b82f6', 
    warning: '#f59e0b',
    critical: '#ef4444'
  };

  const fetchProductsData = async () => {
    setLoading(true);
    
    try {
      console.log('🎯 Fetching products data...');
      
      const productsResponse = await simpleApiUtils.products.getAll();
      
      if (productsResponse.success && productsResponse.data) {
        setProductsData(productsResponse.data);
        console.log(`📦 Products data loaded: ${productsResponse.data.length} products`);
      }
    } catch (err) {
      console.error('❌ Error fetching products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch products data once - sales data comes from context
    fetchProductsData();
  }, []); // Only run once on mount

  // Calculate KPI Metrics
  const kpiMetrics = useMemo((): KPIMetric[] => {
    if (salesData.length === 0) return [];

    let currentPeriodSales, previousPeriodSales;

    // Handle "All Data" period - use all available data
    if (period === 'all') {
      currentPeriodSales = salesData;
      
      // For All Data mode, use first half vs second half for comparison
      const sortedSales = [...salesData].sort((a, b) => {
        const dateA = new Date(a.created_time || a.createdAt);
        const dateB = new Date(b.created_time || b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });
      
      const midPoint = Math.floor(sortedSales.length / 2);
      previousPeriodSales = sortedSales.slice(0, midPoint);
    } else {
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);

      currentPeriodSales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_time || sale.createdAt);
        return saleDate >= cutoffDate;
      });

      const previousCutoffDate = new Date(cutoffDate);
      previousCutoffDate.setDate(cutoffDate.getDate() - periodDays);

      previousPeriodSales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_time || sale.createdAt);
        return saleDate >= previousCutoffDate && saleDate < cutoffDate;
      });
    }

    // Calculate metrics
    const currentRevenue = currentPeriodSales.reduce((sum, sale) => sum + (sale.total_revenue || sale.orderAmount || 0), 0);
    const previousRevenue = previousPeriodSales.reduce((sum, sale) => sum + (sale.total_revenue || sale.orderAmount || 0), 0);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const currentOrders = currentPeriodSales.length;
    const previousOrders = previousPeriodSales.length;
    const orderGrowth = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

    const avgOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const previousAvgOrderValue = previousOrders > 0 ? previousRevenue / previousOrders : 0;
    const aovGrowth = previousAvgOrderValue > 0 ? ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100 : 0;

    const deliveredOrders = currentPeriodSales.filter(sale => !!sale.delivered_time).length;
    const fulfillmentRate = currentOrders > 0 ? (deliveredOrders / currentOrders) * 100 : 0;

    const uniqueProducts = new Set(currentPeriodSales.map(sale => sale.product_name || sale.productId)).size;
    const productPerformance = uniqueProducts > 0 ? (currentRevenue / uniqueProducts) : 0;

    const uniqueMarketplaces = new Set(currentPeriodSales.map(sale => sale.marketplace || 'TikTok Shop')).size;
    const marketplaceDiversification = uniqueMarketplaces;

    const getStatus = (value: number, target: number): 'excellent' | 'good' | 'warning' | 'critical' => {
      const ratio = value / target;
      if (ratio >= 1.2) return 'excellent';
      if (ratio >= 1.0) return 'good';
      if (ratio >= 0.8) return 'warning';
      return 'critical';
    };

    return [
      {
        id: 'revenue',
        name: 'Total Revenue',
        value: currentRevenue,
        target: 100000000, // 100M target
        unit: 'IDR',
        trend: revenueGrowth,
        status: getStatus(currentRevenue, 100000000),
        category: 'revenue'
      },
      {
        id: 'orders',
        name: 'Total Orders',
        value: currentOrders,
        target: 1000,
        unit: 'orders',
        trend: orderGrowth,
        status: getStatus(currentOrders, 1000),
        category: 'operations'
      },
      {
        id: 'aov',
        name: 'Avg Order Value',
        value: avgOrderValue,
        target: 150000,
        unit: 'IDR',
        trend: aovGrowth,
        status: getStatus(avgOrderValue, 150000),
        category: 'customer'
      },
      {
        id: 'fulfillment',
        name: 'Fulfillment Rate',
        value: fulfillmentRate,
        target: 95,
        unit: '%',
        trend: 0, // Would need historical data
        status: getStatus(fulfillmentRate, 95),
        category: 'operations'
      },
      {
        id: 'product_performance',
        name: 'Revenue per Product',
        value: productPerformance,
        target: 5000000,
        unit: 'IDR',
        trend: 0,
        status: getStatus(productPerformance, 5000000),
        category: 'product'
      },
      {
        id: 'marketplace_count',
        name: 'Active Marketplaces',
        value: marketplaceDiversification,
        target: 4,
        unit: 'platforms',
        trend: 0,
        status: getStatus(marketplaceDiversification, 4),
        category: 'marketplace'
      }
    ];
  }, [salesData, period]);

  // Calculate Performance Scores
  const calculatedPerformanceScores = useMemo((): PerformanceScore => {
    const getScoreForCategory = (category: string) => {
      const categoryMetrics = kpiMetrics.filter(metric => metric.category === category);
      if (categoryMetrics.length === 0) return 0;
      
      const totalScore = categoryMetrics.reduce((sum, metric) => {
        const ratio = metric.target > 0 ? Math.min(metric.value / metric.target, 1.5) : 0;
        return sum + (ratio * 100);
      }, 0);
      
      return Math.min(totalScore / categoryMetrics.length, 100);
    };

    const revenue = getScoreForCategory('revenue');
    const operations = getScoreForCategory('operations');
    const customer = getScoreForCategory('customer');
    const product = getScoreForCategory('product');
    const marketplace = getScoreForCategory('marketplace');
    const overall = (revenue + operations + customer + product + marketplace) / 5;

    return { overall, revenue, operations, customer, product, marketplace };
  }, [kpiMetrics]);

  // Top Products Performance
  const topProductsPerformance = useMemo(() => {
    if (salesData.length === 0) return [];

    let filteredSales;

    if (period === 'all') {
      filteredSales = salesData;
    } else {
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);

      filteredSales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_time || sale.createdAt);
        return saleDate >= cutoffDate;
      });
    }

    const productMap = new Map();
    
    filteredSales.forEach(sale => {
      const productName = sale.product_name || sale.productId || 'Unknown Product';
      const revenue = sale.total_revenue || sale.orderAmount || 0;
      const quantity = sale.quantity || 1;

      if (!productMap.has(productName)) {
        productMap.set(productName, {
          product_name: productName,
          revenue: 0,
          units_sold: 0,
          orders: 0
        });
      }

      const product = productMap.get(productName);
      product.revenue += revenue;
      product.units_sold += quantity;
      product.orders += 1;
    });

    return Array.from(productMap.values())
      .map(product => ({
        ...product,
        avg_order_value: product.orders > 0 ? product.revenue / product.orders : 0,
        conversion_rate: Math.random() * 10 + 5, // Mock data - would need page view data
        margin: Math.random() * 30 + 20, // Mock data - would need cost data
        growth_rate: Math.random() * 50 - 25 // Mock data - would need historical comparison
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [salesData, period]);

  // Marketplace Performance Analytics
  const marketplacePerformance = useMemo(() => {
    if (salesData.length === 0) return [];

    let filteredSales;

    if (period === 'all') {
      filteredSales = salesData;
    } else {
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);

      filteredSales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_time || sale.createdAt);
        return saleDate >= cutoffDate;
      });
    }

    const marketplaceMap = new Map();

    filteredSales.forEach(sale => {
      const marketplace = sale.marketplace || 'TikTok Shop';
      const revenue = sale.total_revenue || sale.orderAmount || 0;
      const hasDelivered = !!sale.delivered_time;

      if (!marketplaceMap.has(marketplace)) {
        marketplaceMap.set(marketplace, {
          marketplace,
          revenue: 0,
          orders: 0,
          delivered_orders: 0
        });
      }

      const mp = marketplaceMap.get(marketplace);
      mp.revenue += revenue;
      mp.orders += 1;
      if (hasDelivered) mp.delivered_orders += 1;
    });

    return Array.from(marketplaceMap.values())
      .map(mp => ({
        ...mp,
        avg_order_value: mp.orders > 0 ? mp.revenue / mp.orders : 0,
        conversion_rate: Math.random() * 8 + 2, // Mock data
        fulfillment_rate: mp.orders > 0 ? (mp.delivered_orders / mp.orders) * 100 : 0,
        growth_rate: Math.random() * 40 - 20 // Mock data
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [salesData, period]);

  // Operational Efficiency Metrics
  const operationalMetrics = useMemo((): OperationalMetrics => {
    if (salesData.length === 0) {
      return {
        order_processing_time: 0,
        fulfillment_rate: 0,
        stock_turnover: 0,
        return_rate: 0,
        customer_satisfaction: 0
      };
    }

    let filteredSales;

    if (period === 'all') {
      filteredSales = salesData;
    } else {
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);

      filteredSales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_time || sale.createdAt);
        return saleDate >= cutoffDate;
      });
    }

    const deliveredOrders = filteredSales.filter(sale => !!sale.delivered_time);
    const fulfillmentRate = filteredSales.length > 0 ? (deliveredOrders.length / filteredSales.length) * 100 : 0;

    // Calculate average processing time for delivered orders
    const processingTimes = deliveredOrders.map(sale => {
      const createdTime = new Date(sale.created_time || sale.createdAt);
      const deliveredTime = new Date(sale.delivered_time);
      return (deliveredTime.getTime() - createdTime.getTime()) / (1000 * 60 * 60 * 24); // days
    }).filter(time => time > 0);

    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    return {
      order_processing_time: avgProcessingTime,
      fulfillment_rate: fulfillmentRate,
      stock_turnover: Math.random() * 12 + 6, // Mock data - would need inventory data
      return_rate: Math.random() * 5 + 1, // Mock data - would need return data
      customer_satisfaction: Math.random() * 2 + 4 // Mock data - would need customer feedback
    };
  }, [salesData, period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="w-3 h-3 text-green-600" />;
    if (trend < 0) return <ArrowDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  // Show error state only if sales data is unavailable
  if (salesData.length === 0 && !salesLoading) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Performance Metrics - Connection Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-amber-300" />
            <h3 className="font-semibold text-amber-800 mb-2">
              Backend Connection Issue
            </h3>
            <p className="text-amber-700 mb-4 max-w-md mx-auto">
              Sales data tidak tersedia. Silakan refresh atau coba lagi.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={refreshSalesData} variant="outline" className="border-amber-300 hover:bg-amber-100">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Sales Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Performance Metrics</h2>
          


        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">          
          {/* Period Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={period === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('7d')}
              disabled={loading}
            >
              7 Hari
            </Button>
            <Button
              variant={period === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('30d')}
              disabled={loading}
            >
              30 Hari
            </Button>
            <Button
              variant={period === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('90d')}
              disabled={loading}
            >
              90 Hari
            </Button>
            <Button
              variant={period === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('all')}
              disabled={loading}
            >
              All Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshSalesData();
                fetchProductsData();
              }}
              disabled={loading || salesLoading}
              className="gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading || salesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Score Dashboard */}
      {calculatedPerformanceScores && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-700">Overall</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {calculatedPerformanceScores.overall.toFixed(0)}
              </div>
              <Progress value={calculatedPerformanceScores.overall} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Revenue</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {calculatedPerformanceScores.revenue.toFixed(0)}
              </div>
              <Progress value={calculatedPerformanceScores.revenue} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Operations</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {calculatedPerformanceScores.operations.toFixed(0)}
              </div>
              <Progress value={calculatedPerformanceScores.operations} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-700">Customer</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {calculatedPerformanceScores.customer.toFixed(0)}
              </div>
              <Progress value={calculatedPerformanceScores.customer} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-indigo-700">Product</span>
              </div>
              <div className="text-2xl font-bold text-indigo-900">
                {calculatedPerformanceScores.product.toFixed(0)}
              </div>
              <Progress value={calculatedPerformanceScores.product} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-pink-600" />
                <span className="text-sm text-pink-700">Marketplace</span>
              </div>
              <div className="text-2xl font-bold text-pink-900">
                {calculatedPerformanceScores.marketplace.toFixed(0)}
              </div>
              <Progress value={calculatedPerformanceScores.marketplace} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {kpiMetrics.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* KPI Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Performance Radar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { category: 'Revenue', score: calculatedPerformanceScores?.revenue || 0, fullMark: 100 },
                        { category: 'Operations', score: calculatedPerformanceScores?.operations || 0, fullMark: 100 },
                        { category: 'Customer', score: calculatedPerformanceScores?.customer || 0, fullMark: 100 },
                        { category: 'Product', score: calculatedPerformanceScores?.product || 0, fullMark: 100 },
                        { category: 'Marketplace', score: calculatedPerformanceScores?.marketplace || 0, fullMark: 100 }
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar
                          name="Performance Score"
                          dataKey="score"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top KPIs Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Key Metrics Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {kpiMetrics.slice(0, 6).map((metric) => (
                      <div key={metric.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(metric.status)}
                            <span className="font-medium text-sm">{metric.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(metric.trend)}
                            <span className={`text-xs ${metric.trend > 0 ? 'text-green-600' : metric.trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                              {metric.trend !== 0 && `${metric.trend > 0 ? '+' : ''}${metric.trend.toFixed(1)}%`}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-end text-xs">
                          <div>
                            <span className="text-gray-500">Current:</span>
                            <div className="font-medium">
                              {metric.unit === 'IDR' ? formatCurrency(metric.value) : 
                               metric.unit === '%' ? formatPercentage(metric.value) : 
                               `${formatNumber(metric.value)} ${metric.unit}`}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Target:</span>
                            <div className="font-medium">
                              {metric.unit === 'IDR' ? formatCurrency(metric.target) : 
                               metric.unit === '%' ? formatPercentage(metric.target) : 
                               `${formatNumber(metric.target)} ${metric.unit}`}
                            </div>
                          </div>
                        </div>
                        
                        <Progress 
                          value={Math.min((metric.value / metric.target) * 100, 100)} 
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data Performance</h3>
                  <p className="text-gray-600">
                    Silakan import data penjualan untuk melihat performance metrics dan KPI tracking.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          {kpiMetrics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpiMetrics.map((metric) => (
                <Card key={metric.id} className={`border-2`} style={{ borderColor: STATUS_COLORS[metric.status] + '40' }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(metric.status)}
                        <span className="font-medium">{metric.name}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          color: STATUS_COLORS[metric.status],
                          borderColor: STATUS_COLORS[metric.status] + '60'
                        }}
                      >
                        {metric.category}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-2xl font-bold" style={{ color: STATUS_COLORS[metric.status] }}>
                        {metric.unit === 'IDR' ? formatCurrency(metric.value) : 
                         metric.unit === '%' ? formatPercentage(metric.value) : 
                         `${formatNumber(metric.value)} ${metric.unit}`}
                      </div>
                      {metric.trend !== 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {getTrendIcon(metric.trend)}
                          <span className={`text-sm ${metric.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}% vs previous {period}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Target</span>
                        <span className="font-medium">
                          {metric.unit === 'IDR' ? formatCurrency(metric.target) : 
                           metric.unit === '%' ? formatPercentage(metric.target) : 
                           `${formatNumber(metric.target)} ${metric.unit}`}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((metric.value / metric.target) * 100, 100)} 
                        className="h-2"
                        style={{
                          '--progress-background': STATUS_COLORS[metric.status],
                        } as React.CSSProperties}
                      />
                      <div className="text-xs text-gray-500 text-center">
                        {((metric.value / metric.target) * 100).toFixed(1)}% of target achieved
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada KPI Data</h3>
                  <p className="text-gray-600">
                    Import data penjualan untuk tracking KPI metrics dan performance indicators.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {topProductsPerformance.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Top Products by Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProductsPerformance.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="product_name" 
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Product Performance Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Product Performance Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {topProductsPerformance.slice(0, 6).map((product, index) => (
                      <div key={product.product_name} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white`} 
                               style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-sm truncate">{product.product_name}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Revenue:</span>
                            <div className="font-medium">{formatCurrency(product.revenue)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Units Sold:</span>
                            <div className="font-medium">{formatNumber(product.units_sold)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Order Value:</span>
                            <div className="font-medium">{formatCurrency(product.avg_order_value)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Orders:</span>
                            <div className="font-medium">{formatNumber(product.orders)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data Produk</h3>
                  <p className="text-gray-600">
                    Import data penjualan untuk melihat analytics performance produk.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="marketplaces" className="space-y-4">
          {marketplacePerformance.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Marketplace Revenue Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Breakdown Marketplace
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribusi revenue berdasarkan platform penjualan
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Pie Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={marketplacePerformance}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="revenue"
                            nameKey="marketplace"
                            label={false} // Remove labels from pie slices
                          >
                            {marketplacePerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Custom Legend Below */}
                    <div className="grid grid-cols-2 gap-3">
                      {marketplacePerformance.map((marketplace, index) => {
                        const total = marketplacePerformance.reduce((sum, m) => sum + m.revenue, 0);
                        const percentage = total > 0 ? (marketplace.revenue / total * 100).toFixed(1) : '0';
                        
                        return (
                          <div key={marketplace.marketplace} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {marketplace.marketplace}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {percentage}% • {formatCurrency(marketplace.revenue)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Marketplace Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Marketplace Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketplacePerformance.map((mp, index) => (
                      <div key={mp.marketplace} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium text-sm">{mp.marketplace}</span>
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                Top
                              </Badge>
                            )}
                          </div>
                          <div className={`text-xs flex items-center gap-1 ${mp.growth_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {getTrendIcon(mp.growth_rate)}
                            {mp.growth_rate.toFixed(1)}%
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Revenue:</span>
                            <div className="font-medium">{formatCurrency(mp.revenue)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Orders:</span>
                            <div className="font-medium">{formatNumber(mp.orders)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">AOV:</span>
                            <div className="font-medium">{formatCurrency(mp.avg_order_value)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Fulfillment:</span>
                            <div className={`font-medium ${mp.fulfillment_rate > 90 ? 'text-green-600' : mp.fulfillment_rate > 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {mp.fulfillment_rate.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data Marketplace</h3>
                  <p className="text-gray-600">
                    Import data penjualan dengan field marketplace untuk analytics per platform.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Operational KPIs */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">Avg Processing Time</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {operationalMetrics.order_processing_time.toFixed(1)} days
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  From order to delivery
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">Fulfillment Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {operationalMetrics.fulfillment_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Orders successfully delivered
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-700">Stock Turnover</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {operationalMetrics.stock_turnover.toFixed(1)}x
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Times per year
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700">Customer Satisfaction</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {operationalMetrics.customer_satisfaction.toFixed(1)}/5.0
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Average rating
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operational Insights */}
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Zap className="w-5 h-5" />
                Operational Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-yellow-900 mb-3">Efficiency Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-700">Processing Time</span>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.max(0, 100 - (operationalMetrics.order_processing_time * 10))} className="w-16 h-2" />
                        <Badge variant="outline" className={`text-xs ${operationalMetrics.order_processing_time <= 3 ? 'bg-green-100 text-green-800 border-green-300' : operationalMetrics.order_processing_time <= 7 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                          {operationalMetrics.order_processing_time <= 3 ? 'Excellent' : operationalMetrics.order_processing_time <= 7 ? 'Good' : 'Needs Improvement'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-700">Fulfillment Rate</span>
                      <div className="flex items-center gap-2">
                        <Progress value={operationalMetrics.fulfillment_rate} className="w-16 h-2" />
                        <Badge variant="outline" className={`text-xs ${operationalMetrics.fulfillment_rate >= 95 ? 'bg-green-100 text-green-800 border-green-300' : operationalMetrics.fulfillment_rate >= 85 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                          {operationalMetrics.fulfillment_rate >= 95 ? 'Excellent' : operationalMetrics.fulfillment_rate >= 85 ? 'Good' : 'Needs Improvement'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-700">Stock Turnover</span>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(operationalMetrics.stock_turnover * 10, 100)} className="w-16 h-2" />
                        <Badge variant="outline" className={`text-xs ${operationalMetrics.stock_turnover >= 8 ? 'bg-green-100 text-green-800 border-green-300' : operationalMetrics.stock_turnover >= 6 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                          {operationalMetrics.stock_turnover >= 8 ? 'High' : operationalMetrics.stock_turnover >= 6 ? 'Normal' : 'Low'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-yellow-900 mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {operationalMetrics.order_processing_time > 7 && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-yellow-700">
                          Order processing time is high. Consider optimizing fulfillment workflow.
                        </span>
                      </div>
                    )}
                    
                    {operationalMetrics.fulfillment_rate < 90 && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-yellow-700">
                          Fulfillment rate below target. Review order management processes.
                        </span>
                      </div>
                    )}
                    
                    {operationalMetrics.stock_turnover < 6 && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-yellow-700">
                          Low stock turnover. Consider inventory optimization strategies.
                        </span>
                      </div>
                    )}
                    
                    {operationalMetrics.fulfillment_rate >= 90 && operationalMetrics.order_processing_time <= 5 && (
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-green-700">
                          Great operational efficiency! Maintain current performance levels.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}