import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
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
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  FileBarChart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Calendar as CalendarIcon,
  FileText,
  FileSpreadsheet,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
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

// No mock data - all data will be 0/empty until backend connected

const CHART_COLORS = {
  income: '#10b981',
  expense: '#ef4444', 
  netFlow: '#3b82f6'
};

export function CashFlowReports() {
  const [loading, setLoading] = useState(false);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  // Calculate summary metrics
  const totalIncome = cashFlowData.reduce((sum, item) => sum + (item.income || 0), 0);
  const totalExpenses = cashFlowData.reduce((sum, item) => sum + (item.expenses || 0), 0);
  const netCashFlow = totalIncome - totalExpenses;
  const avgDailyFlow = cashFlowData.length > 0 ? netCashFlow / cashFlowData.length : 0;

  const fetchCashFlowReportData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching cash flow report data from backend...');
      
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      if (dateRange.from) params.append('from', dateRange.from.toISOString().split('T')[0]);
      if (dateRange.to) params.append('to', dateRange.to.toISOString().split('T')[0]);
      
      const response = await fetch(`http://localhost:3001/api/cash-flow/reports?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCashFlowData(result.data.cashFlow || []);
          setCategoryData(result.data.categories || []);
          setExpenseData(result.data.expenses || []);
          console.log('✅ Cash flow report data loaded from backend');
          toast.success('✅ Cash flow report data loaded from backend');
        } else {
          console.log('❌ Backend returned no cash flow report data - setting to empty');
          setCashFlowData([]);
          setCategoryData([]);
          setExpenseData([]);
        }
      } else {
        console.log('❌ Backend not available for cash flow reports - setting to empty');
        setCashFlowData([]);
        setCategoryData([]);
        setExpenseData([]);
      }
    } catch (error) {
      console.error('❌ Backend connection failed for cash flow reports:', error);
      setCashFlowData([]);
      setCategoryData([]);
      setExpenseData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlowReportData();
  }, [selectedPeriod, dateRange]);

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setLoading(true);
      console.log(`📄 Exporting cash flow report as ${format.toUpperCase()}...`);
      
      const params = new URLSearchParams();
      params.append('format', format);
      params.append('period', selectedPeriod);
      if (dateRange.from) params.append('from', dateRange.from.toISOString().split('T')[0]);
      if (dateRange.to) params.append('to', dateRange.to.toISOString().split('T')[0]);
      
      const response = await fetch(`http://localhost:3001/api/cash-flow/reports/export?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const { download_url, filename } = result.data;
          
          // Trigger download
          const link = document.createElement('a');
          link.href = download_url;
          link.download = filename;
          link.click();
          
          toast.success(`✅ Cash flow report exported as ${format.toUpperCase()}`, {
            description: `File: ${filename}`
          });
        } else {
          throw new Error('Failed to export from backend');
        }
      } else {
        console.log('❌ Backend export not available for cash flow reports');
        toast.error('❌ Backend export not available');
      }
      
    } catch (error) {
      console.error('❌ Backend connection failed for export:', error);
      toast.error('❌ Backend connection failed for export');
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {new Date(label).toLocaleDateString('id-ID')}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.dataKey === 'income' ? 'Income' :
                   entry.dataKey === 'expenses' ? 'Expenses' :
                   entry.dataKey === 'netFlow' ? 'Net Flow' :
                   entry.dataKey}:
                </span>
                <span className="font-semibold">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cash Flow - Laporan Arus Kas</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">
              Laporan dan analisis cash flow komprehensif D'Busana
            </p>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => handleExport('pdf')} variant="outline" disabled={loading}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => handleExport('excel')} variant="outline" disabled={loading}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={fetchCashFlowReportData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedPeriod === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        `${formatDateSimple(dateRange.from)} - ${formatDateSimple(dateRange.to)}`
                      ) : (
                        formatDateSimple(dateRange.from)
                      )
                    ) : (
                      'Select date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 text-white rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Income</p>
                <p className="text-lg font-bold text-green-900">
                  {formatCurrency(totalIncome)}
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
                <p className="text-lg font-bold text-red-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Net Cash Flow</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatCurrency(netCashFlow)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 text-white rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Avg Daily Flow</p>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(avgDailyFlow)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Cash Flow Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {cashFlowData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No cash flow trend data</p>
                  <p className="text-sm">Data will appear when backend is connected</p>
                </div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.expense} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.expense} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatCompactCurrency(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke={CHART_COLORS.income}
                      fill="url(#incomeGradient)"
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke={CHART_COLORS.expense}
                      fill="url(#expenseGradient)"
                      name="Expenses"
                    />
                    <Line
                      type="monotone"
                      dataKey="netFlow"
                      stroke={CHART_COLORS.netFlow}
                      strokeWidth={3}
                      name="Net Flow"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Income by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {categoryData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No income category data</p>
                  <p className="text-sm">Data will appear when backend is connected</p>
                </div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Expense Breakdown by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {expenseData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No expense breakdown data</p>
                <p className="text-sm">Data will appear when backend is connected</p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCompactCurrency(value)}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5" />
            Report Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col"
              onClick={() => handleExport('pdf')}
              disabled={loading}
            >
              <FileText className="w-8 h-8 mb-2 text-red-600" />
              <span className="font-medium">Export PDF</span>
              <span className="text-sm text-gray-500">Detailed report</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col"
              onClick={() => handleExport('excel')}
              disabled={loading}
            >
              <FileSpreadsheet className="w-8 h-8 mb-2 text-green-600" />
              <span className="font-medium">Export Excel</span>
              <span className="text-sm text-gray-500">Data analysis</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Download className="w-8 h-8 mb-2 text-blue-600" />
              <span className="font-medium">Download Data</span>
              <span className="text-sm text-gray-500">Raw data CSV</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Activity className="w-8 h-8 mb-2 text-purple-600" />
              <span className="font-medium">Live Dashboard</span>
              <span className="text-sm text-gray-500">Real-time view</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}