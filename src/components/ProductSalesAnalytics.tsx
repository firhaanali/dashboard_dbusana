import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DateRangePicker } from './DateRangePicker';
import { 
  Search, 
  TrendingUp, 
  Package, 
  Calendar as CalendarIcon,
  BarChart3,
  Target,
  DollarSign,
  ShoppingCart,
  Filter
} from 'lucide-react';
import { Label } from './ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { simpleApiSales } from '../utils/simpleApiUtils';
import { toast } from 'sonner@2.0.3';

// DateRange interface for DateRangePicker
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
}

interface ProductAnalytics {
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  avgOrderValue: number;
  totalOrders: number;
  marketplaceBreakdown: { [key: string]: { quantity: number; revenue: number } };
  timelineData: { date: string; quantity: number; revenue: number; sortDate: Date }[];
}

export function ProductSalesAnalytics() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined, 
    to: undefined 
  });
  const [loading, setLoading] = useState(false);
  const [allSales, setAllSales] = useState<SalesRecord[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);

  // Load sales data
  const loadSalesData = async () => {
    setLoading(true);
    try {
      const result = await simpleApiSales.getAll();
      if (result.success && Array.isArray(result.data)) {
        setAllSales(result.data);
        
        // Extract unique product names for suggestions
        const uniqueProducts = [...new Set(result.data.map(sale => sale.product_name))].sort();
        setProductSuggestions(uniqueProducts);
      } else {
        console.warn('Sales data not available or invalid format');
        setAllSales([]);
        setProductSuggestions([]);
        toast.error('Gagal memuat data penjualan');
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
      setAllSales([]);
      setProductSuggestions([]);
      toast.error('Error loading sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, []);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery || !Array.isArray(productSuggestions)) return [];
    return productSuggestions.filter(product => 
      product.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [productSuggestions, searchQuery]);

  // Get latest data date from sales data
  const getLatestDataDate = () => {
    // Check if allSales is properly initialized and is an array
    if (!Array.isArray(allSales) || allSales.length === 0) {
      return new Date();
    }
    
    try {
      // Find the latest delivered_time from sales data
      const latestDate = allSales.reduce((latest, sale) => {
        const saleDate = new Date(sale.delivered_time || sale.created_time);
        return saleDate > latest ? saleDate : latest;
      }, new Date(0));
      
      return latestDate.getTime() > 0 ? latestDate : new Date();
    } catch (error) {
      console.error('Error getting latest data date:', error);
      return new Date();
    }
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

  // Calculate analytics for selected product and period
  const calculateAnalytics = (): ProductAnalytics => {
    if (!selectedProduct || !Array.isArray(allSales)) {
      return {
        totalQuantity: 0,
        totalRevenue: 0,
        totalProfit: 0,
        avgOrderValue: 0,
        totalOrders: 0,
        marketplaceBreakdown: {},
        timelineData: []
      };
    }

    const { start, end } = getDateRange();

    // Filter sales for selected product and date range
    const productSales = allSales.filter(sale => {
      const saleDate = new Date(sale.created_time || sale.delivered_time);
      return sale.product_name === selectedProduct &&
             saleDate >= start && 
             saleDate <= end;
    });

    // Calculate metrics
    const totalQuantity = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = productSales.reduce((sum, sale) => sum + sale.order_amount, 0);
    const totalProfit = productSales.reduce((sum, sale) => {
      const settlement = sale.settlement_amount || sale.order_amount;
      const hpp = sale.hpp || 0;
      return sum + (settlement - hpp);
    }, 0);
    const totalOrders = productSales.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Marketplace breakdown
    const marketplaceBreakdown: { [key: string]: { quantity: number; revenue: number } } = {};
    productSales.forEach(sale => {
      const marketplace = sale.marketplace || 'Unknown';
      if (!marketplaceBreakdown[marketplace]) {
        marketplaceBreakdown[marketplace] = { quantity: 0, revenue: 0 };
      }
      marketplaceBreakdown[marketplace].quantity += sale.quantity;
      marketplaceBreakdown[marketplace].revenue += sale.order_amount;
    });

    // Timeline data (grouped by day/week/month based on period)
    const timelineMap: { [key: string]: { quantity: number; revenue: number; sortDate: Date; displayDate: string } } = {};
    
    productSales.forEach(sale => {
      const saleDate = new Date(sale.created_time || sale.delivered_time);
      
      // Skip invalid dates
      if (isNaN(saleDate.getTime())) {
        console.warn('Invalid date found in sale:', sale);
        return;
      }
      
      let displayKey: string;
      let sortKey: string;
      
      // Check if it's "All Data" or a long period
      const isAllData = !dateRange.from && !dateRange.to;
      const isLongPeriod = (end.getTime() - start.getTime()) > 90 * 24 * 60 * 60 * 1000;
      
      if (isAllData || isLongPeriod) {
        // Group by month for long periods - ensure consistent formatting
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        displayKey = `${monthNames[saleDate.getMonth()]} ${saleDate.getFullYear()}`;
        // Create a sortable key using year-month format (YYYY-MM)
        sortKey = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        // Group by day for shorter periods - ensure consistent formatting  
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        displayKey = `${saleDate.getDate().toString().padStart(2, '0')} ${monthNames[saleDate.getMonth()]}`;
        // Create a sortable key using year-month-day format (YYYY-MM-DD)
        sortKey = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}-${saleDate.getDate().toString().padStart(2, '0')}`;
      }

      if (!timelineMap[sortKey]) {
        timelineMap[sortKey] = { 
          quantity: 0, 
          revenue: 0, 
          sortDate: new Date(saleDate.getFullYear(), saleDate.getMonth(), isAllData || isLongPeriod ? 1 : saleDate.getDate()),
          displayDate: displayKey 
        };
      }
      timelineMap[sortKey].quantity += sale.quantity;
      timelineMap[sortKey].revenue += sale.order_amount;
    });

    const timelineData = Object.entries(timelineMap)
      .map(([sortKey, data]) => ({ 
        date: data.displayDate, 
        quantity: data.quantity, 
        revenue: data.revenue,
        sortDate: data.sortDate 
      }))
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

    // Debug logging untuk memverifikasi urutan data (development only)
    if (timelineData.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('📊 Timeline data sorted for', selectedProduct, ':', timelineData.map(item => ({ 
        display: item.date, 
        sortDate: item.sortDate.toISOString().split('T')[0],
        quantity: item.quantity 
      })));
    }

    return {
      totalQuantity,
      totalRevenue,
      totalProfit,
      avgOrderValue,
      totalOrders,
      marketplaceBreakdown,
      timelineData
    };
  };

  const analytics = calculateAnalytics();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analisis Penjualan Produk</h1>
          <p className="text-muted-foreground">
            Lacak performa penjualan produk tertentu berdasarkan periode waktu
          </p>
        </div>

      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Product Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cari Produk</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Ketik nama produk (misal: niki)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {/* Product Suggestions */}
                {searchQuery && filteredProducts.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map((product, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                        onClick={() => {
                          setSelectedProduct(product);
                          setSearchQuery(product);
                        }}
                      >
                        <div className="font-medium">{product}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedProduct && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {selectedProduct}
                  </Badge>
                </div>
              )}
            </div>

            {/* Period Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Periode Analisis</Label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                className="w-full"
                latestDataDate={getLatestDataDate()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Results */}
      {selectedProduct && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Terjual</p>
                    <p className="text-2xl font-bold text-blue-600">{analytics.totalQuantity.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{analytics.totalOrders} transaksi</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Bersih</p>
                    <p className={`text-2xl font-bold ${analytics.totalProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      {formatCurrency(analytics.totalProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.totalRevenue > 0 ? `${((analytics.totalProfit / analytics.totalRevenue) * 100).toFixed(1)}%` : '0%'} margin
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rata-rata Order</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(analytics.avgOrderValue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(analytics.totalQuantity / Math.max(analytics.totalOrders, 1)).toFixed(1)} qty/order</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline Chart */}
            {analytics.timelineData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tren Penjualan</CardTitle>
                  <CardDescription>Penjualan {selectedProduct} - {getPeriodLabel()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={analytics.timelineData.length > 10 ? 'preserveStartEnd' : 0}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'quantity' ? `${value} unit` : formatCurrency(Number(value)),
                          name === 'quantity' ? 'Quantity' : 'Revenue'
                        ]}
                        labelFormatter={(label) => `Period: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="quantity" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        name="quantity"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        name="revenue"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Marketplace Breakdown */}
            {Object.keys(analytics.marketplaceBreakdown).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Breakdown per Marketplace</CardTitle>
                  <CardDescription>Distribusi penjualan {selectedProduct}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.marketplaceBreakdown).map(([marketplace, data]) => (
                      <div key={marketplace} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              marketplace === 'Shopee' ? 'bg-orange-100 text-orange-700' :
                              marketplace === 'Tokopedia' ? 'bg-green-100 text-green-700' :
                              marketplace === 'Lazada' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {marketplace}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{data.quantity} unit</div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(data.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* No Data Message */}
          {analytics.totalQuantity === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak Ada Data untuk "{selectedProduct}"
                </h3>
                <p className="text-gray-600 mb-4">
                  Tidak ditemukan penjualan untuk produk ini pada periode {getPeriodLabel()}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Lihat Sepanjang Waktu
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Product Selected */}
      {!selectedProduct && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Pilih Produk untuk Analisis
            </h3>
            <p className="text-gray-600 mb-4">
              Gunakan kolom pencarian di atas untuk mencari dan memilih produk yang ingin dianalisis
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {productSuggestions.slice(0, 5).map((product, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(product);
                    setSearchQuery(product);
                  }}
                >
                  {product}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

