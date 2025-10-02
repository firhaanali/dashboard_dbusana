import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Calendar,
  Target,
  Zap,
  PieChart,
  Activity,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Percent
} from 'lucide-react';
import { useSalesData } from '../contexts/SalesDataContext';
import { useMonthlyTrends } from '../hooks/useMonthlyTrends';
import { simpleApiDashboard } from '../utils/simpleApiUtils';
import { formatCurrencyResponsive, formatNumberShort } from '../utils/numberFormatUtils';

interface ComprehensiveAnalytics {
  // Summary metrics
  totalMetrics: {
    orders: number;
    revenue: number;
    profit: number;
    netProfit: number;
    products: number;
    quantity: number;
    customers: number;
    marketplaces: number;
  };
  
  // Time-based analytics
  timeAnalytics: {
    dailyAverage: number;
    weeklyAverage: number;
    monthlyAverage: number;
    growthRate: number;
    bestMonth: string;
    bestDay: string;
  };
  
  // Geographic analytics
  geoAnalytics: {
    topProvinces: Array<{ name: string; orders: number; revenue: number }>;
    topCities: Array<{ name: string; orders: number; revenue: number }>;
    coverage: number;
  };
  
  // Product analytics
  productAnalytics: {
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
    categories: Array<{ name: string; count: number; revenue: number }>;
    brands: Array<{ name: string; count: number; revenue: number }>;
  };
  
  // Marketplace analytics
  marketplaceAnalytics: {
    performance: Array<{ marketplace: string; orders: number; revenue: number; share: number }>;
    topPerformer: string;
    diversificationIndex: number;
  };
  
  // Customer analytics
  customerAnalytics: {
    totalCustomers: number;
    averageOrderValue: number;
    repeatCustomers: number;
    customerSegments: Array<{ segment: string; count: number; value: number }>;
  };
}

interface BusinessAnalyticsComprehensiveProps {
  showAllData?: boolean;
}

export function BusinessAnalyticsComprehensive({ showAllData = true }: BusinessAnalyticsComprehensiveProps) {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { salesData, isLoading: salesLoading } = useSalesData();
  const { data: monthlyTrends, loading: trendsLoading } = useMonthlyTrends();

  // Calculate comprehensive analytics from all available data
  const calculateComprehensiveAnalytics = useMemo(() => {
    return (data: any[]): ComprehensiveAnalytics | null => {
      if (!data || data.length === 0) return null;

      console.log('📊 Calculating comprehensive analytics from', data.length, 'records');

      // Basic totals
      const totalOrders = new Set(data.map(item => item.order_id)).size;
      const totalRevenue = data.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0);
      const totalQuantity = data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const totalHPP = data.reduce((sum, item) => sum + (Number(item.hpp) || 0), 0);
      const totalSettlement = data.reduce((sum, item) => sum + (Number(item.settlement_amount) || 0), 0);
      const totalProfit = totalSettlement - totalHPP;

      // Unique counts
      const uniqueProducts = new Set(data.map(item => `${item.product_name}-${item.color}-${item.size}`)).size;
      const uniqueCustomers = new Set(data.filter(item => item.customer).map(item => item.customer)).size;
      const uniqueMarketplaces = new Set(data.map(item => item.marketplace)).size;

      // Time analytics
      const sortedByDate = data.filter(item => item.delivered_time || item.created_time)
        .sort((a, b) => new Date(a.delivered_time || a.created_time).getTime() - 
                       new Date(b.delivered_time || b.created_time).getTime());
      
      const firstDate = sortedByDate[0] ? new Date(sortedByDate[0].delivered_time || sortedByDate[0].created_time) : new Date();
      const lastDate = sortedByDate[sortedByDate.length - 1] ? 
        new Date(sortedByDate[sortedByDate.length - 1].delivered_time || sortedByDate[sortedByDate.length - 1].created_time) : new Date();
      
      const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
      const weeksDiff = Math.max(1, Math.ceil(daysDiff / 7));
      const monthsDiff = Math.max(1, Math.ceil(daysDiff / 30));

      const dailyAverage = totalRevenue / daysDiff;
      const weeklyAverage = totalRevenue / weeksDiff;
      const monthlyAverage = totalRevenue / monthsDiff;

      // Geographic analytics
      const provinceMap = new Map<string, { orders: Set<string>, revenue: number }>();
      const cityMap = new Map<string, { orders: Set<string>, revenue: number }>();

      data.forEach(item => {
        if (item.province) {
          const existing = provinceMap.get(item.province) || { orders: new Set(), revenue: 0 };
          existing.orders.add(item.order_id);
          existing.revenue += Number(item.total_revenue) || 0;
          provinceMap.set(item.province, existing);
        }

        if (item.regency_city) {
          const existing = cityMap.get(item.regency_city) || { orders: new Set(), revenue: 0 };
          existing.orders.add(item.order_id);
          existing.revenue += Number(item.total_revenue) || 0;
          cityMap.set(item.regency_city, existing);
        }
      });

      const topProvinces = Array.from(provinceMap.entries())
        .map(([name, data]) => ({ name, orders: data.orders.size, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const topCities = Array.from(cityMap.entries())
        .map(([name, data]) => ({ name, orders: data.orders.size, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Product analytics
      const productMap = new Map<string, { quantity: number, revenue: number }>();
      const categoryMap = new Map<string, { count: number, revenue: number }>();
      const brandMap = new Map<string, { count: number, revenue: number }>();

      data.forEach(item => {
        const productKey = `${item.product_name}`;
        const existing = productMap.get(productKey) || { quantity: 0, revenue: 0 };
        existing.quantity += Number(item.quantity) || 0;
        existing.revenue += Number(item.total_revenue) || 0;
        productMap.set(productKey, existing);

        // Category from product name (simple extraction)
        const category = item.category || extractCategoryFromProductName(item.product_name);
        if (category) {
          const catExisting = categoryMap.get(category) || { count: 0, revenue: 0 };
          catExisting.count += Number(item.quantity) || 0;
          catExisting.revenue += Number(item.total_revenue) || 0;
          categoryMap.set(category, catExisting);
        }

        // Brand extraction
        const brand = item.brand || extractBrandFromProductName(item.product_name);
        if (brand) {
          const brandExisting = brandMap.get(brand) || { count: 0, revenue: 0 };
          brandExisting.count += Number(item.quantity) || 0;
          brandExisting.revenue += Number(item.total_revenue) || 0;
          brandMap.set(brand, brandExisting);
        }
      });

      const topProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const categories = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

      const brands = Array.from(brandMap.entries())
        .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

      // Marketplace analytics
      const marketplaceMap = new Map<string, { orders: Set<string>, revenue: number }>();
      data.forEach(item => {
        const marketplace = item.marketplace || 'Unknown';
        const existing = marketplaceMap.get(marketplace) || { orders: new Set(), revenue: 0 };
        existing.orders.add(item.order_id);
        existing.revenue += Number(item.total_revenue) || 0;
        marketplaceMap.set(marketplace, existing);
      });

      const marketplacePerformance = Array.from(marketplaceMap.entries())
        .map(([marketplace, data]) => ({
          marketplace,
          orders: data.orders.size,
          revenue: data.revenue,
          share: (data.revenue / totalRevenue) * 100
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const topMarketplace = marketplacePerformance[0]?.marketplace || 'N/A';

      // Diversification index (Herfindahl-Hirschman Index)
      const diversificationIndex = marketplacePerformance.reduce((sum, mp) => {
        const share = mp.share / 100;
        return sum + (share * share);
      }, 0);

      // Customer analytics
      const customerOrderMap = new Map<string, { orders: Set<string>, revenue: number }>();
      data.filter(item => item.customer).forEach(item => {
        const existing = customerOrderMap.get(item.customer) || { orders: new Set(), revenue: 0 };
        existing.orders.add(item.order_id);
        existing.revenue += Number(item.total_revenue) || 0;
        customerOrderMap.set(item.customer, existing);
      });

      const repeatCustomers = Array.from(customerOrderMap.values()).filter(c => c.orders.size > 1).length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Customer segments
      const customerSegments = [
        { segment: 'High Value (>1M)', count: 0, value: 0 },
        { segment: 'Medium Value (500K-1M)', count: 0, value: 0 },
        { segment: 'Regular (100K-500K)', count: 0, value: 0 },
        { segment: 'Low Value (<100K)', count: 0, value: 0 }
      ];

      customerOrderMap.forEach(customer => {
        if (customer.revenue > 1000000) {
          customerSegments[0].count++;
          customerSegments[0].value += customer.revenue;
        } else if (customer.revenue > 500000) {
          customerSegments[1].count++;
          customerSegments[1].value += customer.revenue;
        } else if (customer.revenue > 100000) {
          customerSegments[2].count++;
          customerSegments[2].value += customer.revenue;
        } else {
          customerSegments[3].count++;
          customerSegments[3].value += customer.revenue;
        }
      });

      return {
        totalMetrics: {
          orders: totalOrders,
          revenue: totalRevenue,
          profit: totalProfit,
          netProfit: totalProfit * 0.8, // Simplified net profit calculation
          products: uniqueProducts,
          quantity: totalQuantity,
          customers: uniqueCustomers,
          marketplaces: uniqueMarketplaces
        },
        timeAnalytics: {
          dailyAverage,
          weeklyAverage,
          monthlyAverage,
          growthRate: monthlyTrends?.trends.totalRevenue.percentageChange || 0,
          bestMonth: 'November 2024', // Could be calculated from data
          bestDay: 'Senin' // Could be calculated from data
        },
        geoAnalytics: {
          topProvinces,
          topCities,
          coverage: provinceMap.size
        },
        productAnalytics: {
          topProducts,
          categories,
          brands
        },
        marketplaceAnalytics: {
          performance: marketplacePerformance,
          topPerformer: topMarketplace,
          diversificationIndex: 1 - diversificationIndex // Higher = more diversified
        },
        customerAnalytics: {
          totalCustomers: uniqueCustomers,
          averageOrderValue,
          repeatCustomers,
          customerSegments
        }
      };
    };
  }, [monthlyTrends]);

  // Helper functions
  const extractCategoryFromProductName = (productName: string): string => {
    if (!productName) return 'Unknown';
    const lower = productName.toLowerCase();
    if (lower.includes('dress') || lower.includes('gaun')) return 'Dress';
    if (lower.includes('blouse') || lower.includes('blus')) return 'Blouse';
    if (lower.includes('pants') || lower.includes('celana')) return 'Pants';
    if (lower.includes('skirt') || lower.includes('rok')) return 'Skirt';
    if (lower.includes('jacket') || lower.includes('jaket')) return 'Jacket';
    return 'Fashion Items';
  };

  const extractBrandFromProductName = (productName: string): string => {
    if (!productName) return 'D\'Busana';
    // Simple brand extraction - could be enhanced
    return 'D\'Busana'; // Default brand
  };

  useEffect(() => {
    if (salesData && salesData.length > 0) {
      setLoading(true);
      try {
        const comprehensiveAnalytics = calculateComprehensiveAnalytics(salesData);
        setAnalytics(comprehensiveAnalytics);
        setError(null);
        
        console.log('✅ Comprehensive analytics calculated:', {
          totalOrders: comprehensiveAnalytics?.totalMetrics.orders,
          totalRevenue: comprehensiveAnalytics?.totalMetrics.revenue,
          topProvinces: comprehensiveAnalytics?.geoAnalytics.topProvinces.length,
          topProducts: comprehensiveAnalytics?.productAnalytics.topProducts.length,
          marketplaces: comprehensiveAnalytics?.marketplaceAnalytics.performance.length
        });
      } catch (err) {
        console.error('❌ Error calculating analytics:', err);
        setError('Failed to calculate analytics');
      } finally {
        setLoading(false);
      }
    } else if (!salesLoading) {
      setLoading(false);
      setError('No sales data available');
    }
  }, [salesData, salesLoading, calculateComprehensiveAnalytics]);

  if (loading || salesLoading || trendsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Business Analytics - All Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Activity className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p>Loading comprehensive analytics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Business Analytics Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Business Analytics - Complete Overview
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              All Data ({analytics.totalMetrics.orders.toLocaleString('id-ID')} orders)
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive analysis dari seluruh data penjualan - {analytics.totalMetrics.products.toLocaleString('id-ID')} produk, 
            {analytics.totalMetrics.marketplaces} marketplace, {analytics.geoAnalytics.coverage} provinsi
          </p>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalMetrics.orders.toLocaleString('id-ID')}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatNumberShort(analytics.totalMetrics.revenue)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalMetrics.quantity.toLocaleString('id-ID')}</p>
                <p className="text-sm text-muted-foreground">Items Sold</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalMetrics.customers.toLocaleString('id-ID')}</p>
                <p className="text-sm text-muted-foreground">Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="geography">Geography</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Time Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Daily Average:</span>
                      <span className="font-medium">{formatNumberShort(analytics.timeAnalytics.dailyAverage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekly Average:</span>
                      <span className="font-medium">{formatNumberShort(analytics.timeAnalytics.weeklyAverage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Average:</span>
                      <span className="font-medium">{formatNumberShort(analytics.timeAnalytics.monthlyAverage)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Growth Rate:</span>
                      <div className="flex items-center gap-1">
                        {analytics.timeAnalytics.growthRate > 0 ? 
                          <TrendingUp className="w-4 h-4 text-green-600" /> : 
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        }
                        <span className={`font-medium ${analytics.timeAnalytics.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analytics.timeAnalytics.growthRate > 0 ? '+' : ''}{analytics.timeAnalytics.growthRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Key Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Avg. Order Value:</span>
                      <span className="font-medium">{formatNumberShort(analytics.customerAnalytics.averageOrderValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Repeat Customers:</span>
                      <span className="font-medium">{analytics.customerAnalytics.repeatCustomers.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Product Variety:</span>
                      <span className="font-medium">{analytics.totalMetrics.products.toLocaleString('id-ID')} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Coverage:</span>
                      <span className="font-medium">{analytics.geoAnalytics.coverage} provinces</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="geography" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Provinces */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Top Provinces
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.geoAnalytics.topProvinces.slice(0, 8).map((province, index) => (
                        <div key={province.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{province.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatNumberShort(province.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{province.orders} orders</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Cities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Top Cities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.geoAnalytics.topCities.slice(0, 8).map((city, index) => (
                        <div key={city.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{city.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatNumberShort(city.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{city.orders} orders</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Top Products */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Best Sellers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.productAnalytics.topProducts.slice(0, 6).map((product, index) => (
                        <div key={product.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium text-sm truncate">{product.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{formatNumberShort(product.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{product.quantity} sold</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.productAnalytics.categories.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatNumberShort(category.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{category.count} items</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Brands */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Brands
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.productAnalytics.brands.map((brand, index) => (
                        <div key={brand.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{brand.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatNumberShort(brand.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{brand.count} items</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="marketplace" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Marketplace Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Marketplace Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.marketplaceAnalytics.performance.map((mp, index) => (
                        <div key={mp.marketplace} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{mp.marketplace}</span>
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              {mp.share.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${mp.share}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{mp.orders} orders</span>
                            <span>{formatNumberShort(mp.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Marketplace Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Marketplace Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Top Performer</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{analytics.marketplaceAnalytics.topPerformer}</p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Diversification</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {(analytics.marketplaceAnalytics.diversificationIndex * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-green-700">Market spread efficiency</p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">Coverage</span>
                      </div>
                      <p className="text-lg font-bold text-purple-600">
                        {analytics.totalMetrics.marketplaces} Platforms
                      </p>
                      <p className="text-sm text-purple-700">Active marketplaces</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Segments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Customer Segments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.customerAnalytics.customerSegments.map((segment, index) => (
                        <div key={segment.segment} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{segment.segment}</span>
                            <Badge variant="outline">
                              {segment.count} customers
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(segment.count / analytics.customerAnalytics.totalCustomers) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{((segment.count / analytics.customerAnalytics.totalCustomers) * 100).toFixed(1)}%</span>
                            <span>{formatNumberShort(segment.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Customer Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Total Customers</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics.customerAnalytics.totalCustomers.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Repeat Customers</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.customerAnalytics.repeatCustomers.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm text-green-700">
                        Customer loyalty rate: {((analytics.customerAnalytics.repeatCustomers / analytics.customerAnalytics.totalCustomers) * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Avg. Order Value</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatNumberShort(analytics.customerAnalytics.averageOrderValue)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}