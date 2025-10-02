import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DateRangePicker } from './DateRangePicker';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  Calendar as CalendarIcon,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  Eye,
  ChevronRight,
  Activity
} from 'lucide-react';
import { simpleApiSales, simpleApiAdvertising } from '../utils/simpleApiUtils';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/productAnalyticsUtils';
import { getPredefinedPeriods } from '../utils/productAnalyticsUtils';
import { toast } from 'sonner@2.0.3';

// DateRange interface is now imported from DateRangePicker
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface SalesRecord {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  order_amount: number;
  created_time: string;
  delivered_time?: string;
  marketplace?: string;
  settlement_amount?: number;
  hpp?: number;
  customer?: string;
}

interface AdvertisingRecord {
  id: string;
  campaign_name: string;
  ad_spend: number;
  impressions: number;
  clicks: number;
  created_time: string;
  marketplace?: string;
}

interface DashboardMetrics {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  totalQuantity: number;
  avgOrderValue: number;
  profitMargin: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  marketplaceBreakdown: { name: string; value: number; percentage: number; color: string }[];
  timelineData: { date: string; revenue: number; orders: number; profit: number; quantity: number }[];
  growthMetrics: {
    revenueGrowth: number;
    ordersGrowth: number;
    profitGrowth: number;
  };
  customerMetrics: {
    totalCustomers: number;
    repeatCustomers: number;
    newCustomers: number;
    repeatRate: number;
  };
  adMetrics?: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    cpm: number;
    roas: number;
  };
}

export function SalesAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allSales, setAllSales] = useState<SalesRecord[]>([]);
  const [allAds, setAllAds] = useState<AdvertisingRecord[]>([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined, 
    to: undefined 
  });
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Load data from API
  const loadData = async () => {
    try {
      setRefreshing(true);
      
      const [salesResult, adsResult] = await Promise.all([
        simpleApiSales.getAll(),
        simpleApiAdvertising.getAll()
      ]);

      // Ensure allSales is always an array
      if (salesResult.success && salesResult.data) {
        const salesData = Array.isArray(salesResult.data) ? salesResult.data : [];
        console.log('📊 Sales data loaded:', { count: salesData.length, sample: salesData[0] });
        setAllSales(salesData);
      } else {
        console.warn('⚠️ Failed to load sales data, using empty array');
        setAllSales([]);
      }

      // Ensure allAds is always an array  
      if (adsResult.success && adsResult.data) {
        const adsData = Array.isArray(adsResult.data) ? adsResult.data : [];
        console.log('📊 Ads data loaded:', { count: adsData.length, sample: adsData[0] });
        setAllAds(adsData);
      } else {
        console.warn('⚠️ Failed to load ads data, using empty array');
        setAllAds([]);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      // Ensure arrays are always set even on error
      setAllSales([]);
      setAllAds([]);
      toast.error('Error loading data - using fallback');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get latest data date from sales data
  const getLatestDataDate = () => {
    if (allSales.length === 0) return new Date();
    
    // Find the latest delivered_time from sales data
    const latestDate = allSales.reduce((latest, sale) => {
      const saleDate = new Date(sale.delivered_time || sale.created_time);
      return saleDate > latest ? saleDate : latest;
    }, new Date(0));
    
    return latestDate.getTime() > 0 ? latestDate : new Date();
  };

  // Get date range based on selected date range
  const getDateRange = (): { start: Date; end: Date } => {
    // If custom date range is selected
    if (dateRange.from && dateRange.to) {
      return { start: dateRange.from, end: dateRange.to };
    }
    
    // If "All Data" is selected (both from and to are undefined)
    if (!dateRange.from && !dateRange.to) {
      return {
        start: new Date(2020, 0, 1), // Start from a reasonable past date
        end: new Date()
      };
    }
    
    // Default to current month if no valid range
    const currentDate = new Date();
    return {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      end: currentDate
    };
  };

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo((): DashboardMetrics => {
    // Ensure allSales and allAds are always arrays
    const salesArray = Array.isArray(allSales) ? allSales : [];
    const adsArray = Array.isArray(allAds) ? allAds : [];
    
    const { start, end } = getDateRange();

    // Filter sales data by date range and marketplace
    let filteredSales = salesArray.filter(sale => {
      const saleDate = new Date(sale.created_time || sale.delivered_time);
      const inDateRange = saleDate >= start && saleDate <= end;
      const inMarketplace = selectedMarketplace === 'all' || sale.marketplace === selectedMarketplace;
      return inDateRange && inMarketplace;
    });

    // Calculate basic metrics
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.order_amount, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => {
      const settlement = sale.settlement_amount || sale.order_amount;
      const hpp = sale.hpp || 0;
      return sum + (settlement - hpp);
    }, 0);
    const totalOrders = filteredSales.length;
    const totalQuantity = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Top products
    const productStats: { [key: string]: { quantity: number; revenue: number } } = {};
    filteredSales.forEach(sale => {
      if (!productStats[sale.product_name]) {
        productStats[sale.product_name] = { quantity: 0, revenue: 0 };
      }
      productStats[sale.product_name].quantity += sale.quantity;
      productStats[sale.product_name].revenue += sale.order_amount;
    });

    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Marketplace breakdown
    const marketplaceStats: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
      const marketplace = sale.marketplace || 'Unknown';
      marketplaceStats[marketplace] = (marketplaceStats[marketplace] || 0) + sale.order_amount;
    });

    const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5A2B'];
    const marketplaceBreakdown = Object.entries(marketplaceStats)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Timeline data (daily aggregation)
    const timelineMap: { [key: string]: { revenue: number; orders: number; profit: number; quantity: number } } = {};
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.created_time || sale.delivered_time);
      const key = saleDate.toISOString().split('T')[0];
      
      if (!timelineMap[key]) {
        timelineMap[key] = { revenue: 0, orders: 0, profit: 0, quantity: 0 };
      }
      
      const settlement = sale.settlement_amount || sale.order_amount;
      const hpp = sale.hpp || 0;
      
      timelineMap[key].revenue += sale.order_amount;
      timelineMap[key].orders += 1;
      timelineMap[key].profit += (settlement - hpp);
      timelineMap[key].quantity += sale.quantity;
    });

    const timelineData = Object.entries(timelineMap)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        fullDate: date,
        ...data
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    // Growth metrics (compare with previous period)
    const periodLength = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodLength);
    const previousEnd = new Date(start.getTime());

    const previousSales = salesArray.filter(sale => {
      const saleDate = new Date(sale.created_time || sale.delivered_time);
      const inDateRange = saleDate >= previousStart && saleDate < previousEnd;
      const inMarketplace = selectedMarketplace === 'all' || sale.marketplace === selectedMarketplace;
      return inDateRange && inMarketplace;
    });

    const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.order_amount, 0);
    const previousOrders = previousSales.length;
    const previousProfit = previousSales.reduce((sum, sale) => {
      const settlement = sale.settlement_amount || sale.order_amount;
      const hpp = sale.hpp || 0;
      return sum + (settlement - hpp);
    }, 0);

    const growthMetrics = {
      revenueGrowth: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0,
      ordersGrowth: previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0,
      profitGrowth: Math.abs(previousProfit) > 0 ? ((totalProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0,
    };

    // Customer metrics
    const customerMap: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
      if (sale.customer) {
        customerMap[sale.customer] = (customerMap[sale.customer] || 0) + 1;
      }
    });

    const allCustomers = Object.keys(customerMap);
    const repeatCustomers = allCustomers.filter(customer => customerMap[customer] > 1);

    // For new customers, we need to check if they had orders before the current period
    const previousCustomers = new Set(
      salesArray
        .filter(sale => {
          const saleDate = new Date(sale.created_time || sale.delivered_time);
          return saleDate < start && sale.customer;
        })
        .map(sale => sale.customer!)
    );

    const newCustomers = allCustomers.filter(customer => !previousCustomers.has(customer));

    const customerMetrics = {
      totalCustomers: allCustomers.length,
      repeatCustomers: repeatCustomers.length,
      newCustomers: newCustomers.length,
      repeatRate: allCustomers.length > 0 ? (repeatCustomers.length / allCustomers.length) * 100 : 0
    };

    // Ad metrics
    const filteredAds = adsArray.filter(ad => {
      const adDate = new Date(ad.created_time);
      const inDateRange = adDate >= start && adDate <= end;
      const inMarketplace = selectedMarketplace === 'all' || ad.marketplace === selectedMarketplace;
      return inDateRange && inMarketplace;
    });

    const totalSpend = filteredAds.reduce((sum, ad) => sum + ad.ad_spend, 0);
    const totalImpressions = filteredAds.reduce((sum, ad) => sum + ad.impressions, 0);
    const totalClicks = filteredAds.reduce((sum, ad) => sum + ad.clicks, 0);

    const adMetrics = {
      totalSpend,
      totalImpressions,
      totalClicks,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0
    };

    return {
      totalRevenue,
      totalProfit,
      totalOrders,
      totalQuantity,
      avgOrderValue,
      profitMargin,
      topProducts,
      marketplaceBreakdown,
      timelineData,
      growthMetrics,
      customerMetrics,
      adMetrics
    };
  }, [allSales, allAds, selectedMarketplace, dateRange.from, dateRange.to]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPeriodLabel = (): string => {
    // Check if this is "All Data" selection - when both from and to are undefined
    if (!dateRange.from && !dateRange.to) {
      return "All Data";
    }
    if (!dateRange.from) {
      return "Pilih rentang tanggal";
    }
    if (!dateRange.to) {
      return formatDate(dateRange.from);
    }
    return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
  };

  const marketplaceOptions = useMemo(() => {
    // Ensure allSales is an array before using map
    const salesArray = Array.isArray(allSales) ? allSales : [];
    const marketplaces = new Set(salesArray.map(sale => sale.marketplace).filter(Boolean));
    return [
      { value: 'all', label: 'Semua Marketplace' },
      ...Array.from(marketplaces).map(marketplace => ({
        value: marketplace!,
        label: marketplace!
      }))
    ];
  }, [allSales]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Analisis mendalam performa bisnis D'Busana dengan data real-time dari database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Periode</label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                className="w-full"
                latestDataDate={getLatestDataDate()}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Marketplace</label>
              <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {marketplaceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary">
              Period: {getPeriodLabel()}
            </Badge>
            {selectedMarketplace !== 'all' && (
              <Badge variant="outline">
                {selectedMarketplace}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboardMetrics.totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {dashboardMetrics.growthMetrics.revenueGrowth > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs ${dashboardMetrics.growthMetrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(Math.abs(dashboardMetrics.growthMetrics.revenueGrowth))}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(dashboardMetrics.totalOrders)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {dashboardMetrics.growthMetrics.ordersGrowth > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs ${dashboardMetrics.growthMetrics.ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(Math.abs(dashboardMetrics.growthMetrics.ordersGrowth))}
                  </span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${dashboardMetrics.totalProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {formatCurrency(dashboardMetrics.totalProfit)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Margin: {formatPercentage(dashboardMetrics.profitMargin)}
                  </span>
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(dashboardMetrics.avgOrderValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(dashboardMetrics.totalQuantity)} total items
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="advertising">Advertising</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Tren Revenue & Orders</CardTitle>
                <CardDescription>Perkembangan penjualan harian dalam periode terpilih</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={dashboardMetrics.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' || name === 'profit' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                        name === 'revenue' ? 'Revenue' : name === 'profit' ? 'Profit' : name === 'orders' ? 'Orders' : 'Quantity'
                      ]}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#10B981" stroke="#10B981" fillOpacity={0.3} />
                    <Bar yAxisId="right" dataKey="orders" fill="#3B82F6" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Marketplace Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Breakdown Marketplace</CardTitle>
                <CardDescription>Distribusi revenue berdasarkan platform penjualan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardMetrics.marketplaceBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    >
                      {dashboardMetrics.marketplaceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Profit Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Analisis Profit Margin</CardTitle>
              <CardDescription>Tren profitabilitas dan margin keuntungan</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardMetrics.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <YAxis 
                    domain={[0, 'dataMax']}
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                      if (absValue >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (absValue >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return `${value}`;
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Profit']}
                    labelStyle={{ color: '#333' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#8B5CF6" 
                    fill="url(#profitGradient)" 
                    fillOpacity={0.8}
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Produk dengan performa terbaik berdasarkan revenue dan quantity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardMetrics.topProducts.slice(0, 10).map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{formatNumber(product.quantity)} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold text-blue-600">{formatNumber(dashboardMetrics.customerMetrics.totalCustomers)}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Repeat Customers</p>
                    <p className="text-2xl font-bold text-green-600">{formatNumber(dashboardMetrics.customerMetrics.repeatCustomers)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(dashboardMetrics.customerMetrics.repeatRate)} repeat rate
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">New Customers</p>
                    <p className="text-2xl font-bold text-purple-600">{formatNumber(dashboardMetrics.customerMetrics.newCustomers)}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advertising" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Ad Spend</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(dashboardMetrics.adMetrics?.totalSpend || 0)}</p>
                  </div>
                  <Activity className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Impressions</p>
                    <p className="text-2xl font-bold text-blue-600">{formatNumber(dashboardMetrics.adMetrics?.totalImpressions || 0)}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-2xl font-bold text-green-600">{formatNumber(dashboardMetrics.adMetrics?.totalClicks || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      CTR: {formatPercentage(dashboardMetrics.adMetrics?.ctr || 0)}
                    </p>
                  </div>
                  <ChevronRight className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS</p>
                    <p className="text-2xl font-bold text-purple-600">{(dashboardMetrics.adMetrics?.roas || 0).toFixed(2)}x</p>
                    <p className="text-xs text-muted-foreground">
                      CPM: {formatCurrency(dashboardMetrics.adMetrics?.cpm || 0)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}