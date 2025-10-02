import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Target,
  Zap,
  Calendar as CalendarIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Download,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';
import { simpleApiAdvertising } from '../utils/simpleApiUtils';

// AdvertisingData interface now imported from advertisingDataIntegration utility

// AdvertisingAnalytics interface now imported from advertisingDataIntegration utility

// Utility functions
const formatCurrency = (amount: number | null | undefined) => {
  const safeAmount = Number(amount) || 0;
  console.log('💰 Formatting currency:', { original: amount, converted: safeAmount });
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(safeAmount);
};

const formatNumber = (num: number | null | undefined) => {
  const safeNum = Number(num) || 0;
  console.log('🔢 Formatting number:', { original: num, converted: safeNum });
  return new Intl.NumberFormat('id-ID').format(safeNum);
};

const formatPercentage = (value: number | null | undefined) => {
  const safeValue = Number(value) || 0;
  console.log('📊 Formatting percentage:', { original: value, converted: safeValue });
  return `${safeValue.toFixed(2)}%`;
};

export function AdvertisingDashboard() {
  const [advertisingData, setAdvertisingData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [settlementAnalytics, setSettlementAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter states - Start with NO date filtering to show all data
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');

  // Chart view state
  const [chartView, setChartView] = useState<'line' | 'bar' | 'pie'>('line');

  // Account colors for charts
  const accountColors = {
    'D\'Busana Fashion Ads': '#4285F4',
    'TikTok Shop Ads': '#000000',
    'Shopee Ads': '#FB5B2D',
    'Tokopedia Ads': '#03AC0E',
    'Lazada Ads': '#0F136D',
    'Instagram Ads': '#E4405F',
    'Facebook Ads': '#1877F2',
    other: '#6B7280'
  };

  const fetchSettlementData = async () => {
    try {
      const params = {
        date_start: dateRange.from?.toISOString(),
        date_end: dateRange.to?.toISOString()
      };
      
      const result = await simpleApiAdvertising.getSettlement(params);
      
      if (result.success) {
        setSettlementAnalytics(result.data);
      } else {
        setSettlementAnalytics(null);
      }
    } catch (err) {
      setSettlementAnalytics(null);
    }
  };

  const fetchRealAdvertisingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        date_start: dateRange.from?.toISOString(),
        date_end: dateRange.to?.toISOString()
      };
      
      console.log('🔄 Fetching advertising data with params:', params);
      
      // Fetch advertising data and stats in parallel
      const [advertisingResult, statsResult] = await Promise.all([
        simpleApiAdvertising.getAll(params),
        simpleApiAdvertising.getStats()
      ]);
      
      // Also fetch settlement data
      await fetchSettlementData();
      
      console.log('📊 API Results:', {
        advertising: advertisingResult.success,
        advertisingData: advertisingResult.data?.length || 0,
        stats: statsResult.success,
        statsData: !!statsResult.data
      });
      
      if (advertisingResult.success && statsResult.success) {
        setAdvertisingData(advertisingResult.data || []);
        setAnalytics(statsResult.data);
        setLastUpdated(new Date());
        
        const dataCount = advertisingResult.data?.length || 0;
        toast.success(`✅ Data advertising berhasil dimuat (${dataCount} records)`);
      } else {
        // Handle partial success or complete failure
        const errors = [];
        if (!advertisingResult.success) errors.push(`Advertising: ${advertisingResult.error}`);
        if (!statsResult.success) errors.push(`Stats: ${statsResult.error}`);
        
        throw new Error(errors.join(', '));
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database connection failed';
      console.error('❌ Error fetching advertising data:', errorMessage);
      setError(errorMessage);
      
      toast.error('❌ Error memuat data advertising', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealAdvertisingData();
  }, [selectedAccount, selectedMarketplace, dateRange]);

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange({
      from: range.from || null,
      to: range.to || null
    });
    
    if (range.from && range.to) {
      setShowDatePicker(false);
    }
  };

  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${formatDateSimple(dateRange.from.toISOString())} - ${formatDateSimple(dateRange.to.toISOString())}`;
    }
    return 'Select Date Range';
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.dataKey}:
                </span>
                <span className="font-semibold">
                  {entry.dataKey.includes('cost') || entry.dataKey.includes('revenue') || entry.dataKey.includes('profit')
                    ? formatCurrency(entry.value) 
                    : entry.dataKey.includes('rate') || entry.dataKey.includes('ctr') || entry.dataKey.includes('roas')
                    ? formatPercentage(entry.value)
                    : formatNumber(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 animate-pulse" />
            Advertising Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
            <div className="animate-pulse">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            Advertising Dashboard - Connection Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="font-semibold text-red-800 mb-2">
              Gagal Memuat Advertising Data
            </h3>
            <p className="text-red-700 mb-4 max-w-md mx-auto">{error}</p>
            <Button onClick={fetchRealAdvertisingData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Real Data
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Enhanced condition check with detailed debugging
  const hasValidAnalytics = analytics && analytics.overview && typeof analytics.overview.totalCampaigns === 'number';
  const hasAnyData = advertisingData && advertisingData.length > 0;
  
  // Debug logging for troubleshooting
  console.log('🔍 Component Render Debug:', {
    analytics: !!analytics,
    overview: !!analytics?.overview,
    totalCampaigns: analytics?.overview?.totalCampaigns,
    hasValidAnalytics,
    hasAnyData,
    advertisingDataLength: advertisingData?.length || 0,
    loading,
    error
  });

  if (!hasValidAnalytics && !loading && !error) {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <BarChart3 className="w-5 h-5" />
            Advertising Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="w-20 h-20 mx-auto mb-6 text-amber-300" />
            <h3 className="text-xl font-semibold text-amber-800 mb-3">
              Belum Ada Data Advertising
            </h3>
            <p className="text-amber-700 mb-6 max-w-md mx-auto">
              Koneksi ke database berhasil, tetapi belum ada data advertising.
              Import data marketing untuk melihat analytics advertising.
            </p>
            <div className="space-y-3">
              <Button onClick={fetchRealAdvertisingData} className="bg-amber-600 hover:bg-amber-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Database
              </Button>
              {/* Enhanced Debug Info */}
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                Debug: analytics={analytics ? 'exists' : 'null'}, 
                overview={analytics?.overview ? 'exists' : 'missing'},
                campaigns={analytics?.overview?.totalCampaigns || 'undefined'},
                hasValidAnalytics={hasValidAnalytics ? 'true' : 'false'}
              </div>
              {analytics && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  Raw analytics object keys: {Object.keys(analytics).join(', ')}
                  {analytics.overview && (
                    <div>Overview keys: {Object.keys(analytics.overview).join(', ')}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Final debug log before rendering
  console.log('🎯 Final KPI Values Debug with True Business ROI:', {
    totalImpressions: analytics.overview.totalImpressions,
    totalClicks: analytics.overview.totalClicks,
    totalConversions: analytics.overview.totalConversions,
    totalCost: analytics.overview.totalCost,
    totalRevenue: analytics.overview.totalRevenue,
    totalHPP: analytics.overview.totalHPP,
    netProfit: analytics.overview.netProfit,
    overallCTR: analytics.overview.overallCTR,
    overallConversionRate: analytics.overview.overallConversionRate,
    overallROI: analytics.overview.overallROI,
    basicROI: analytics.overview.basicROI,
    trueProfitROI: analytics.overview.trueProfitROI,
    roiCalculationType: analytics.overview.roiCalculationType,
    roiCalculationMethod: analytics.overview.roiCalculationMethod,
    hasProductAttribution: analytics.overview.hasProductAttribution,
    roiAccuracy: analytics.overview.roiAccuracy
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Advertising Dashboard</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">
              Analytics dari {analytics.overview.totalCampaigns} campaigns ({formatDateRange()})
            </p>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Database Live
            </Badge>
            {lastUpdated && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                <Activity className="w-3 h-3 mr-1" />
                {lastUpdated.toLocaleTimeString('id-ID')}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Account Filter */}
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="D'Busana Fashion Ads">D'Busana Fashion</SelectItem>
              <SelectItem value="TikTok Shop Ads">TikTok Shop</SelectItem>
              <SelectItem value="Shopee Ads">Shopee</SelectItem>
              <SelectItem value="Instagram Ads">Instagram</SelectItem>
            </SelectContent>
          </Select>

          {/* Marketplace Filter */}
          <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Marketplace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Marketplaces</SelectItem>
              <SelectItem value="TikTok Shop">TikTok Shop</SelectItem>
              <SelectItem value="Shopee">Shopee</SelectItem>
              <SelectItem value="Tokopedia">Tokopedia</SelectItem>
              <SelectItem value="Lazada">Lazada</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Date Range Picker */}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date Range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-900">Select Date Range</div>
                  
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from || undefined,
                      to: dateRange.to || undefined
                    }}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                    className="rounded-md border"
                    disabled={(date) => date > new Date()}
                  />
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDateRange({ from: null, to: null });
                        setShowDatePicker(false);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={fetchRealAdvertisingData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Real Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {/* Total Impressions */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Impressions</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatNumber(analytics?.overview?.totalImpressions)}
                </p>
                <p className="text-xs text-blue-600">views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Clicks */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 text-white rounded-lg">
                <MousePointer className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Clicks</p>
                <p className="text-lg font-bold text-green-900">
                  {formatNumber(analytics?.overview?.totalClicks)}
                </p>
                <p className="text-xs text-green-600">
                  CTR: {formatPercentage(analytics?.overview?.overallCTR)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Conversions */}
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 text-white rounded-lg">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Total Conversions</p>
                <p className="text-lg font-bold text-purple-900">
                  {formatNumber(analytics?.overview?.totalConversions)}
                </p>
                <p className="text-xs text-purple-600">
                  Rate: {formatPercentage(analytics?.overview?.overallConversionRate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 text-white rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-orange-700">Total Cost</p>
                <p className="text-lg font-bold text-orange-900">
                  {formatCurrency(analytics?.overview?.totalCost)}
                </p>
                <p className="text-xs text-orange-600">advertising spend</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-emerald-700">Total Revenue</p>
                <p className="text-lg font-bold text-emerald-900">
                  {formatCurrency(analytics?.overview?.totalRevenue)}
                </p>
                <p className="text-xs text-emerald-600">from ads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 text-white rounded-lg">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-indigo-700">Net Profit</p>
                <p className={`text-lg font-bold ${(analytics?.overview?.netProfit ?? 0) >= 0 ? 'text-indigo-900' : 'text-red-800'}`}>
                  {formatCurrency(analytics?.overview?.netProfit)}
                </p>
                <p className="text-xs text-indigo-600">
                  {analytics?.overview?.roiCalculationType === 'TRUE_BUSINESS_ROI' ? 'True' : 'Gross'} Margin: {
                    analytics?.overview?.roiCalculationType === 'TRUE_BUSINESS_ROI' 
                      ? formatPercentage(analytics?.overview?.trueProfitMargin)
                      : formatPercentage(analytics?.overview?.profitMargin)
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* True Business ROI */}
        <Card className={`${
          (analytics?.overview?.overallROI ?? 0) >= 0 
            ? 'border-pink-200 bg-gradient-to-r from-pink-50 to-pink-100' 
            : 'border-red-200 bg-gradient-to-r from-red-50 to-red-100'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500 text-white rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-pink-700">
                    {analytics?.overview?.roiCalculationType === 'TRUE_BUSINESS_ROI' ? 'True Business ROI' : 'Basic ROI'}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 py-0.5 ${
                      analytics?.overview?.roiAccuracy === 'HIGH' 
                        ? 'bg-green-50 text-green-700 border-green-300' 
                        : analytics?.overview?.roiAccuracy === 'MEDIUM'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    {analytics?.overview?.roiAccuracy || 'BASIC'}
                  </Badge>
                </div>
                <p className={`text-lg font-bold ${
                  (analytics?.overview?.overallROI ?? 0) >= 0 ? 'text-pink-900' : 'text-red-800'
                }`}>
                  {analytics?.overview?.overallROI !== null && analytics?.overview?.overallROI !== undefined 
                    ? `${analytics.overview.overallROI >= 0 ? '+' : ''}${analytics.overview.overallROI.toFixed(1)}%` 
                    : 'N/A'}
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-pink-600">
                    {analytics?.overview?.roiCalculationMethod === 'true_attribution' 
                      ? 'with product attribution' 
                      : analytics?.overview?.roiCalculationMethod === 'estimated_business'
                      ? 'estimated business'
                      : 'advertising effectiveness'
                    }
                  </p>
                  {analytics?.overview?.hasProductAttribution && (
                    <Badge variant="outline" className="text-xs px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-300">
                      ✓ Product
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average CPA */}
        <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-cyan-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500 text-white rounded-lg">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-cyan-700">Average CPA</p>
                <p className="text-lg font-bold text-cyan-900">
                  {formatCurrency(analytics?.overview?.averageCPA || 0)}
                </p>
                <p className="text-xs text-cyan-600">cost per acquisition</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settlement Amount */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-lg">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-amber-700">Settlement Amount</p>
                <p className="text-lg font-bold text-amber-900">
                  {settlementAnalytics?.overview?.totalSettlementAmount 
                    ? formatCurrency(settlementAnalytics.overview.totalSettlementAmount)
                    : 'Rp 0'
                  }
                </p>
                <p className="text-xs text-amber-600">
                  {settlementAnalytics?.overview?.totalSettlementOrders || 0} orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Trends
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={chartView === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView('line')}
                >
                  Line
                </Button>
                <Button
                  variant={chartView === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView('bar')}
                >
                  Bar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'line' ? (
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} name="Cost" />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} name="Profit" />
                  </LineChart>
                ) : (
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="cost" fill="#f59e0b" name="Cost" />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Account Performance Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Account Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics.accountPerformance || []).slice(0, 5).map((account, index) => {
                const revenue = account._sum.revenue || 0;
                const cost = account._sum.cost || 0;
                const roi = account._avg.roi || 0;
                const profit = revenue - cost;
                const maxRevenue = Math.max(...(analytics.accountPerformance || []).map(a => a._sum.revenue || 0));
                const revenuePercentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                
                // Get account color
                const accountColor = accountColors[account.account_name as keyof typeof accountColors] || accountColors.other;
                
                return (
                  <div key={account.account_name} className="flex items-center gap-4 p-3 rounded-lg border bg-gradient-to-r from-gray-50 to-white">
                    {/* Ranking Badge */}
                    <div 
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: accountColor }}
                    >
                      #{index + 1}
                    </div>
                    
                    {/* Account Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {account.account_name || 'Unknown Account'}
                        </h4>
                        <div className="text-right">
                          <span className="font-bold text-green-600">
                            {formatCurrency(revenue)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Performance Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${revenuePercentage}%`,
                            backgroundColor: accountColor 
                          }}
                        ></div>
                      </div>
                      
                      {/* Metrics Row */}
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-3">
                          <span>Cost: <span className="font-medium text-orange-600">{formatCurrency(cost)}</span></span>
                          <span>Profit: <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ROI: {roi > 0 ? `${roi.toFixed(1)}%` : 'N/A'}
                          </span>
                          {roi > 0 && (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* No Data State */}
              {(!analytics.accountPerformance || analytics.accountPerformance.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Belum ada data performa akun</p>
                </div>
              )}
              
              {/* Total Summary */}
              {analytics.accountPerformance && analytics.accountPerformance.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 text-center">
                    Menampilkan top {Math.min(5, analytics.accountPerformance.length)} dari {analytics.accountPerformance.length} akun advertising
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top Campaign Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(analytics?.campaignPerformance || []).slice(0, 10).map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold text-purple-600 min-w-[2rem] text-center">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{campaign.campaign_name}</h3>
                    <p className="text-sm text-gray-500">
                      {campaign.account_name || 'Unknown Account'} • ROI: {campaign._avg.roi !== null && campaign._avg.roi !== undefined ? `${campaign._avg.roi.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-medium">Cost</p>
                      <p className="text-lg font-bold text-orange-700">
                        {formatCurrency(campaign._sum.cost || 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-medium">Revenue</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(campaign._sum.revenue || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}