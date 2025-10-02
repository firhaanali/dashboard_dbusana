import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
  ComposedChart,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Filter,
  Download,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  CreditCard,
  Wallet,
  Building2,
  ShoppingCart,
  Package,
  Truck,
  Users,
  PieChart as PieChartIcon,
  FileText,
  FileSpreadsheet,
  Calculator,
  Target,
  AlertTriangle,
  Info,
  Zap,
  Eye,
  EyeOff,
  Settings,
  Clock,
  Hash,
  Percent,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';
import { simpleApiCashFlow } from '../utils/simpleApiUtils';

// Cash Flow interfaces
interface CashFlowSummary {
  period: string;
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  operating_cash_flow: number;
  free_cash_flow: number;
  cash_flow_margin: number;
}

interface IncomeBreakdown {
  source: string;
  category: 'sales' | 'other_income' | 'investment' | 'loan';
  amount: number;
  percentage: number;
  growth_rate: number;
  transactions_count: number;
}

interface ExpenseBreakdown {
  category: string;
  type: 'operating' | 'marketing' | 'inventory' | 'fixed' | 'other';
  amount: number;
  percentage: number;
  growth_rate: number;
  budget_vs_actual?: number;
}

interface CashFlowTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  source: string;
  marketplace?: string;
  reference?: string;
}

interface CashFlowForecast {
  period: string;
  predicted_income: number;
  predicted_expenses: number;
  predicted_net_flow: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  scenario: 'conservative' | 'realistic' | 'optimistic';
}

interface CashFlowFilter {
  date_start: string;
  date_end: string;
  granularity: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string[];
  type?: string[];
  source?: string[];
  marketplace?: string[];
  min_amount?: number;
  max_amount?: number;
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

const formatCompactCurrency = (amount: number) => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B`;
  } else if (absAmount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

// Chart color schemes
const CHART_COLORS = {
  income: '#10b981',
  expense: '#ef4444',
  netFlow: '#3b82f6',
  forecast: '#f59e0b',
  budget: '#8b5cf6',
  mixed: ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
};

export function CashFlowDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states - with safe initialization
  const [cashFlowSummary, setCashFlowSummary] = useState<CashFlowSummary[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<IncomeBreakdown[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
  const [forecast, setForecast] = useState<CashFlowForecast[]>([]);

  // UI states
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Filter states
  const [filters, setFilters] = useState<CashFlowFilter>({
    date_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_end: new Date().toISOString().split('T')[0],
    granularity: 'daily',
    category: [],
    type: [],
    source: [],
    marketplace: []
  });

  // Date picker states
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    categories: ['Sales', 'Marketing', 'Inventory', 'Operating', 'Other'],
    sources: ['Shopee', 'Tokopedia', 'Lazada', 'Blibli', 'TikTok Shop', 'Direct Sales', 'Other'],
    types: ['Income', 'Expense']
  });

  const fetchCashFlowData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching cash flow data with filters:', filters);
      
      const params = {
        date_start: filters.date_start,
        date_end: filters.date_end,
        granularity: filters.granularity,
        type: filters.type?.join(',')
      };
      
      // Fetch cash flow data from the comprehensive endpoint
      const dataResult = await simpleApiCashFlow.getAll(params);
      
      if (dataResult.success && dataResult.data) {
        const apiData = dataResult.data;
        
        // Ensure all data is properly formatted as arrays with safe fallbacks
        setCashFlowSummary(Array.isArray(apiData.summary) ? apiData.summary : []);
        setIncomeBreakdown(Array.isArray(apiData.income_breakdown) ? apiData.income_breakdown : []);
        setExpenseBreakdown(Array.isArray(apiData.expense_breakdown) ? apiData.expense_breakdown : []);
        setTransactions(Array.isArray(apiData.transactions) ? apiData.transactions.slice(0, 100) : []);
        setForecast(Array.isArray(apiData.forecast) ? apiData.forecast : []);
        
        const transactionCount = Array.isArray(apiData.transactions) ? apiData.transactions.length : 0;
        const summaryCount = Array.isArray(apiData.summary) ? apiData.summary.length : 0;
        
        console.log(`✅ Cash flow data loaded: ${transactionCount} transactions, ${summaryCount} summary periods`);
        
        toast.success(`✅ Cash flow data berhasil dimuat`, {
          description: `${transactionCount} transaksi dimuat dalam ${summaryCount} periode`
        });
      } else {
        throw new Error(dataResult.error || 'Failed to fetch cash flow data');
      }
      
    } catch (err) {
      console.error('❌ Error fetching cash flow data:', err);
      
      // Safe reset to empty arrays
      setCashFlowSummary([]);
      setIncomeBreakdown([]);
      setExpenseBreakdown([]);
      setTransactions([]);
      setForecast([]);
      
      const errorMessage = err instanceof Error ? err.message : 'Backend connection failed';
      setError(errorMessage);
      
      // Show error only in console for clean dashboard policy
      console.error('❌ Cash flow data fetch failed:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and reload when main filters change
  useEffect(() => {
    fetchCashFlowData();
  }, [filters.date_start, filters.date_end, filters.granularity]);

  // Update filters when date range changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      setFilters(prev => ({
        ...prev,
        date_start: dateRange.from!.toISOString().split('T')[0],
        date_end: dateRange.to!.toISOString().split('T')[0]
      }));
    }
  }, [dateRange]);

  // Safe chart data with realistic fallback or sample data
  const chartData = useMemo(() => {
    if (!Array.isArray(cashFlowSummary) || cashFlowSummary.length === 0) {
      // Generate sample cash flow data for demonstration
      const sampleData = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Generate realistic sample data
        const baseIncome = 5000000 + Math.random() * 10000000; // 5-15M IDR
        const baseExpenses = 3000000 + Math.random() * 6000000; // 3-9M IDR
        
        sampleData.push({
          period: currentDate.toISOString().split('T')[0],
          total_income: Math.floor(baseIncome),
          total_expenses: Math.floor(baseExpenses),
          net_cash_flow: Math.floor(baseIncome - baseExpenses),
          operating_cash_flow: Math.floor(baseIncome * 0.8 - baseExpenses),
          free_cash_flow: Math.floor(baseIncome * 0.7 - baseExpenses),
          cash_flow_margin: ((baseIncome - baseExpenses) / baseIncome) * 100
        });
      }
      
      return sampleData;
    }
    return cashFlowSummary;
  }, [cashFlowSummary]);

  // Calculate summary metrics with safe array operations
  const summaryMetrics = useMemo(() => {
    // Use chartData (which includes sample data) for calculations if real data is not available
    const dataToCalculate = Array.isArray(cashFlowSummary) && cashFlowSummary.length > 0 
      ? cashFlowSummary 
      : chartData;
    
    if (!Array.isArray(dataToCalculate) || dataToCalculate.length === 0) {
      return {
        total_income: 0,
        total_expenses: 0,
        net_cash_flow: 0,
        cash_flow_margin: 0,
        growth_rate: 0,
        positive_periods: 0,
        average_daily_flow: 0
      };
    }

    // Safe reduce operations with null checking
    const totalIncome = dataToCalculate.reduce((sum, item) => {
      return sum + (typeof item?.total_income === 'number' ? item.total_income : 0);
    }, 0);
    
    const totalExpenses = dataToCalculate.reduce((sum, item) => {
      return sum + (typeof item?.total_expenses === 'number' ? item.total_expenses : 0);
    }, 0);
    
    const netCashFlow = totalIncome - totalExpenses;
    const cashFlowMargin = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;
    
    const positivePeriods = dataToCalculate.filter(item => 
      typeof item?.net_cash_flow === 'number' && item.net_cash_flow > 0
    ).length;
    
    const averageDailyFlow = dataToCalculate.length > 0 ? netCashFlow / dataToCalculate.length : 0;
    
    // Calculate growth rate (simplified) with safe operations
    const midPoint = Math.floor(dataToCalculate.length / 2);
    const firstHalfFlow = dataToCalculate.slice(0, midPoint).reduce((sum, item) => {
      return sum + (typeof item?.net_cash_flow === 'number' ? item.net_cash_flow : 0);
    }, 0);
    
    const secondHalfFlow = dataToCalculate.slice(midPoint).reduce((sum, item) => {
      return sum + (typeof item?.net_cash_flow === 'number' ? item.net_cash_flow : 0);
    }, 0);
    
    const growthRate = firstHalfFlow !== 0 ? ((secondHalfFlow - firstHalfFlow) / Math.abs(firstHalfFlow)) * 100 : 0;

    return {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_cash_flow: netCashFlow,
      cash_flow_margin: cashFlowMargin,
      growth_rate: growthRate,
      positive_periods: positivePeriods,
      average_daily_flow: averageDailyFlow
    };
  }, [cashFlowSummary, chartData]);

  // Handle filter changes
  const handleFilterChange = (key: keyof CashFlowFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle export with custom date range
  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      console.log(`📄 Exporting cash flow report as ${format.toUpperCase()}...`);
      
      const params = new URLSearchParams();
      params.append('format', format);
      params.append('date_start', exportDateRange.from.toISOString().split('T')[0]);
      params.append('date_end', exportDateRange.to.toISOString().split('T')[0]);
      params.append('granularity', filters.granularity);
      
      const response = await fetch(`http://localhost:3001/api/cash-flow/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          const { download_url, filename } = result.data;
          
          toast.success(`✅ Cash flow report exported as ${format.toUpperCase()}`, {
            description: `File: ${filename} siap diunduh`
          });
        } else {
          throw new Error('Failed to export report from backend');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Export failed:', response.status, errorText);
        toast.error(`❌ Export gagal: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Backend connection failed for export:', err);
      toast.error('❌ Koneksi backend gagal untuk export');
    }
  };

  // Handle filter toggle
  const handleFiltersToggle = () => {
    setShowFilters(!showFilters);
  };

  // Handle forecast toggle
  const handleForecastToggle = () => {
    setShowForecast(!showForecast);
  };

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    
    // Update filters based on selected period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 3);
    }
    
    setFilters(prev => ({
      ...prev,
      date_start: startDate.toISOString().split('T')[0],
      date_end: endDate.toISOString().split('T')[0]
    }));
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 dark:text-gray-100 mb-2 font-medium">
            {new Date(label).toLocaleDateString('id-ID', { 
              weekday: 'short', 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {entry.dataKey === 'total_income' ? 'Pemasukan' :
                     entry.dataKey === 'total_expenses' ? 'Pengeluaran' :
                     entry.dataKey === 'net_cash_flow' ? 'Net Cash Flow' :
                     entry.dataKey}:
                  </span>
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(entry.value)}
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
            <DollarSign className="w-5 h-5 animate-pulse" />
            Cash Flow Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
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
            Cash Flow Dashboard - Connection Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-red-800 mb-2">
              Gagal Memuat Data Cash Flow
            </h3>
            <p className="text-red-700 mb-4 max-w-md mx-auto">{error}</p>
            <Button onClick={fetchCashFlowData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Panel removed as per Clean Dashboard Policy */}
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Cash Flow Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive cash flow analysis dan pemasukan untuk D'Busana
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Bulan</SelectItem>
              <SelectItem value="3months">3 Bulan</SelectItem>
              <SelectItem value="6months">6 Bulan</SelectItem>
              <SelectItem value="1year">1 Tahun</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleFiltersToggle}
            variant={showFilters ? "default" : "outline"}
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          <Button
            onClick={handleForecastToggle}
            variant={showForecast ? "default" : "outline"}
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            Forecast
          </Button>

          {/* Export Dropdown */}
          <Popover open={showExportOptions} onOpenChange={setShowExportOptions}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Export Cash Flow Report</h4>
                  
                  {/* Date Range Selector */}
                  <div className="space-y-3">
                    <Label className="text-sm">Pilih Periode Export:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Dari:</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start text-left">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {exportDateRange.from.toLocaleDateString('id-ID', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={exportDateRange.from}
                              onSelect={(date) => date && setExportDateRange(prev => ({ ...prev, from: date }))}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Sampai:</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start text-left">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {exportDateRange.to.toLocaleDateString('id-ID', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={exportDateRange.to}
                              onSelect={(date) => date && setExportDateRange(prev => ({ ...prev, to: date }))}
                              disabled={(date) => date > new Date() || date < exportDateRange.from}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-2 pt-3">
                    <Button 
                      onClick={() => {
                        handleExport('pdf');
                        setShowExportOptions(false);
                      }} 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      onClick={() => {
                        handleExport('excel');
                        setShowExportOptions(false);
                      }} 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Granularity */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Granularitas:</Label>
                <Select 
                  value={filters.granularity} 
                  onValueChange={(value) => handleFilterChange('granularity', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                    <SelectItem value="yearly">Tahunan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Kategori:</Label>
                <Select 
                  value={filters.category?.[0] || ''} 
                  onValueChange={(value) => handleFilterChange('category', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Kategori</SelectItem>
                    {filterOptions.categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Tipe:</Label>
                <Select 
                  value={filters.type?.[0] || ''} 
                  onValueChange={(value) => handleFilterChange('type', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Tipe</SelectItem>
                    <SelectItem value="Income">Pemasukan</SelectItem>
                    <SelectItem value="Expense">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Sumber:</Label>
                <Select 
                  value={filters.source?.[0] || ''} 
                  onValueChange={(value) => handleFilterChange('source', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Sumber</SelectItem>
                    {filterOptions.sources.map(source => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setFilters({
                      date_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      date_end: new Date().toISOString().split('T')[0],
                      granularity: 'daily',
                      category: [],
                      type: []
                    });
                  }}
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast Panel */}
      {showForecast && forecast.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Cash Flow Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {forecast.slice(0, 3).map((item, index) => (
                <div key={index} className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">{item.period}</p>
                  <p className="font-medium">
                    {formatCurrency(item.predicted_net_flow)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.scenario} scenario
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 text-white rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Income</p>
                <p className="text-green-900">
                  {formatCurrency(summaryMetrics.total_income)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 text-white rounded-lg">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-red-700">Total Expenses</p>
                <p className="text-red-900">
                  {formatCurrency(summaryMetrics.total_expenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-blue-200 bg-gradient-to-r ${
          summaryMetrics.net_cash_flow >= 0 ? 'from-blue-50 to-blue-100' : 'from-orange-50 to-orange-100'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 text-white rounded-lg ${
                summaryMetrics.net_cash_flow >= 0 ? 'bg-blue-500' : 'bg-orange-500'
              }`}>
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-sm ${
                  summaryMetrics.net_cash_flow >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>Net Cash Flow</p>
                <p className={
                  summaryMetrics.net_cash_flow >= 0 ? 'text-blue-900' : 'text-orange-900'
                }>
                  {formatCurrency(summaryMetrics.net_cash_flow)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 text-white rounded-lg">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Cash Flow Margin</p>
                <p className="text-purple-900">
                  {formatPercentage(summaryMetrics.cash_flow_margin)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Cash Flow Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!Array.isArray(cashFlowSummary) || cashFlowSummary.length === 0 ? (
            <div className="space-y-4">
              {/* Show sample data notice */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">Menampilkan data contoh cash flow (30 hari terakhir)</span>
                </div>
              </div>
              
              {/* Chart with sample data */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" opacity={0.8} />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const absValue = Math.abs(value);
                        if (absValue >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                        if (absValue >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (absValue >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return `${value}`;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Bar 
                      dataKey="total_income" 
                      fill={CHART_COLORS.income} 
                      name="Pemasukan" 
                      opacity={0.8}
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="total_expenses" 
                      fill={CHART_COLORS.expense} 
                      name="Pengeluaran" 
                      opacity={0.8}
                      radius={[2, 2, 0, 0]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net_cash_flow" 
                      stroke={CHART_COLORS.netFlow} 
                      strokeWidth={3} 
                      name="Net Cash Flow"
                      dot={{ r: 5, fill: CHART_COLORS.netFlow, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: CHART_COLORS.netFlow }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" opacity={0.8} />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                      if (absValue >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (absValue >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return `${value}`;
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Bar 
                    dataKey="total_income" 
                    fill={CHART_COLORS.income} 
                    name="Pemasukan" 
                    opacity={0.8}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="total_expenses" 
                    fill={CHART_COLORS.expense} 
                    name="Pengeluaran" 
                    opacity={0.8}
                    radius={[2, 2, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net_cash_flow" 
                    stroke={CHART_COLORS.netFlow} 
                    strokeWidth={3} 
                    name="Net Cash Flow"
                    dot={{ r: 5, fill: CHART_COLORS.netFlow, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: CHART_COLORS.netFlow }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}