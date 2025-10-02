import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp,
  Brain,
  Calculator,
  RefreshCw,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';
import { simpleApiSales, simpleApiProducts } from '../utils/simpleApiUtils';

interface RealSalesData {
  id: string;
  created_time: string;
  revenue: number;
  total_revenue: number;
  quantity: number;
  product_name: string;
  marketplace: string;
  settlement_amount?: number;
  hpp?: number;
}

interface ProcessedDataPoint {
  date: string;
  revenue: number | null;
  orders: number;
  quantity: number;
  profit: number;
  avg_order_value: number;
  marketplace_data: Record<string, number>;
  trend?: number;
  forecast?: number | null;
  forecastUpper?: number;
  forecastLower?: number;
  isForecast?: boolean;
}

export function ForecastingSimple() {
  const [salesData, setSalesData] = useState<RealSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState<'30d' | '90d' | '180d'>('90d');
  const [viewMode, setViewMode] = useState<'overview' | 'revenue' | 'quantity'>('overview');

  // Load data from database
  const loadData = async () => {
    setLoading(true);
    
    try {
      const salesResult = await simpleApiSales.getAll({ limit: 5000 });
      
      if (salesResult.success && salesResult.data && salesResult.data.length > 0) {
        const validSales = salesResult.data
          .filter((sale: any) => {
            const hasValidRevenue = (sale.order_amount > 0) || (sale.total_revenue > 0) || (sale.settlement_amount > 0);
            const hasValidDate = sale.created_time || sale.delivered_time;
            return sale && hasValidRevenue && hasValidDate;
          })
          .map((sale: any) => {
            const createdTime = sale.delivered_time || sale.created_time || new Date().toISOString();
            const revenue = Number(sale.settlement_amount) || Number(sale.total_revenue) || Number(sale.order_amount) || 0;
            
            return {
              id: sale.id || `sale_${Date.now()}_${Math.random()}`,
              created_time: createdTime,
              revenue: revenue,
              total_revenue: revenue,
              quantity: Math.max(1, Number(sale.quantity) || 1),
              product_name: sale.product_name || 'Unknown Product',
              marketplace: sale.marketplace || 'Unknown',
              settlement_amount: revenue,
              hpp: Number(sale.hpp) || (revenue * 0.6)
            };
          });
        
        setSalesData(validSales);
      } else {
        setSalesData([]);
      }

      setLastUpdated(new Date());
      toast.success('📊 Forecasting data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading forecasting data:', error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Process sales data
  const processedData = useMemo(() => {
    if (!salesData.length) return [];
    
    const dailyData = new Map<string, ProcessedDataPoint>();
    
    salesData.forEach(sale => {
      try {
        const saleDate = new Date(sale.created_time);
        if (isNaN(saleDate.getTime())) return;
        
        const date = saleDate.toISOString().split('T')[0];
        
        if (!dailyData.has(date)) {
          dailyData.set(date, {
            date,
            revenue: 0,
            orders: 0,
            quantity: 0,
            profit: 0,
            avg_order_value: 0,
            marketplace_data: {}
          });
        }
        
        const dayData = dailyData.get(date)!;
        const revenue = sale.settlement_amount || sale.total_revenue || sale.revenue || 0;
        const marketplace = sale.marketplace || 'Unknown';
        
        dayData.revenue += revenue;
        dayData.orders += 1;
        dayData.quantity += sale.quantity;
        dayData.profit += revenue - (sale.hpp || 0);
        
        if (!dayData.marketplace_data[marketplace]) {
          dayData.marketplace_data[marketplace] = 0;
        }
        dayData.marketplace_data[marketplace] += revenue;
      } catch (error) {
        console.warn('Error processing sale:', sale.id, error);
      }
    });
    
    return Array.from(dailyData.values())
      .map(data => ({
        ...data,
        avg_order_value: data.orders > 0 ? data.revenue / data.orders : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [salesData]);

  // Simple forecasting algorithm
  const generateForecast = (data: ProcessedDataPoint[], days: number): ProcessedDataPoint[] => {
    if (data.length === 0) return [];
    
    const lastDate = new Date(data[data.length - 1].date);
    const revenueValues = data.map(d => d.revenue);
    const avgRevenue = revenueValues.reduce((sum, val) => sum + val, 0) / revenueValues.length;
    const avgOrders = data.reduce((sum, d) => sum + d.orders, 0) / data.length;
    const avgQuantity = data.reduce((sum, d) => sum + d.quantity, 0) / data.length;
    
    const forecast: ProcessedDataPoint[] = [];
    
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);
      
      // Simple forecast with seasonal variation
      const dayOfWeek = forecastDate.getDay();
      let seasonalMultiplier = 1.0;
      if (dayOfWeek === 0 || dayOfWeek === 6) seasonalMultiplier = 1.15; // Weekend boost
      if (dayOfWeek === 1) seasonalMultiplier = 0.85; // Monday dip
      
      const forecastRevenue = avgRevenue * seasonalMultiplier;
      const forecastOrders = Math.round(avgOrders * seasonalMultiplier);
      const forecastQuantity = Math.round(avgQuantity * seasonalMultiplier);

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        revenue: null,
        orders: forecastOrders,
        quantity: forecastQuantity,
        profit: Math.round(forecastRevenue * 0.4),
        avg_order_value: Math.round(forecastRevenue / Math.max(1, forecastOrders)),
        marketplace_data: {},
        forecast: Math.round(forecastRevenue),
        isForecast: true
      });
    }
    
    return forecast;
  };

  const getHorizonDays = () => {
    switch (forecastHorizon) {
      case '30d': return 30;
      case '90d': return 90;
      case '180d': return 180;
      default: return 90;
    }
  };

  const forecastData = useMemo(() => {
    return generateForecast(processedData, getHorizonDays());
  }, [processedData, forecastHorizon]);

  const chartData = useMemo(() => {
    const historicalWithForecast = processedData.slice(-90).map(d => ({
      ...d,
      forecast: null
    }));
    
    const forecastWithValues = forecastData.map(d => ({
      ...d,
      forecast: d.forecast,
      revenue: null
    }));
    
    return [...historicalWithForecast, ...forecastWithValues];
  }, [processedData, forecastData]);

  // Calculate metrics
  const totalRevenue = processedData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = processedData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const forecastRevenue = forecastData.reduce((sum, d) => sum + (d.forecast || 0), 0);

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Loading forecasting data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                Forecasting Dashboard
                <Badge variant="outline" className="text-xs ml-2">
                  {viewMode.toUpperCase()}
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered sales and inventory forecasting for strategic planning
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </Button>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Last updated: {formatDateSimple(lastUpdated)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Forecast Horizon:</label>
              <Select 
                value={forecastHorizon} 
                onValueChange={(value: '30d' | '90d' | '180d') => setForecastHorizon(value)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Select horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="180d">180 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">View Mode:</label>
              <Select 
                value={viewMode} 
                onValueChange={(value: typeof viewMode) => setViewMode(value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-800">
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Total Orders</p>
                <p className="text-2xl font-bold text-green-800">{totalOrders.toLocaleString('id-ID')}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-800">
                  Rp {avgOrderValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <Calculator className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Forecast Revenue</p>
                <p className="text-2xl font-bold text-orange-800">
                  Rp {forecastRevenue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Revenue Forecast Overview
            <Badge variant="outline" className="text-xs">
              {forecastHorizon} horizon
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    value ? `Rp ${Number(value).toLocaleString('id-ID')}` : null,
                    name === 'revenue' ? 'Historical Revenue' : 
                    name === 'forecast' ? 'Forecast Revenue' : name
                  ]}
                  labelFormatter={(date) => formatDateSimple(new Date(date))}
                />
                <Legend />
                
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Historical Revenue"
                  connectNulls={false}
                />
                
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Forecast Revenue"
                  connectNulls={false}
                />
                
                <ReferenceLine 
                  x={processedData.length > 0 ? processedData[processedData.length - 1]?.date : undefined}
                  stroke="#6b7280" 
                  strokeDasharray="3 3" 
                  label={{ value: "Today", position: "top" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="quantity">Quantity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Forecast Period:</span>
                  <Badge variant="outline">{forecastHorizon}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Historical Data Points:</span>
                  <span>{processedData.length} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Forecast Data Points:</span>
                  <span>{forecastData.length} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Algorithm:</span>
                  <span>Seasonal Trend Analysis</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Detailed revenue forecasting and trend analysis will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quantity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quantity Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Product quantity trends and inventory forecasting will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}