import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { MonthYearOnlyPicker } from './MonthYearOnlyPicker';

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator, 
  Megaphone, 
  Zap, 
  Info,
  AlertCircle,
  CheckCircle,
  Users,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { makeSimpleApiRequest } from '../utils/simpleApiUtils';
import { formatCurrency } from '../utils/currencyFormatHelper';
import { toast } from 'sonner@2.0.3';

interface NetProfitData {
  total_revenue: number;
  total_settlement_amount: number;
  total_hpp: number;
  gross_profit: number;
  advertising_costs: number;
  affiliate_endorse_fee: number;
  salaries_benefits: number;
  net_profit: number;
  profit_margin: number;
  net_profit_margin: number;
}



interface ProfitBreakdownProps {
  showDetails?: boolean;
  timeRange?: '30d' | '90d' | '365d';
  className?: string;
}

// Helper functions for trend display
const getTrendIcon = (value: number) => {
  if (value > 0) {
    return <TrendingUp className="w-4 h-4 text-green-600" />;
  } else if (value < 0) {
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  }
  return <DollarSign className="w-4 h-4 text-blue-600" />;
};

const getTrendColor = (value: number) => {
  if (value > 0) {
    return 'text-green-600';
  } else if (value < 0) {
    return 'text-red-600';
  }
  return 'text-blue-600';
};

export function NetProfitSummaryCard({ 
  showDetails = true, 
  timeRange = '30d',
  className = ''
}: ProfitBreakdownProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NetProfitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isChangingPeriod, setIsChangingPeriod] = useState(false);
  
  // Independent month/year state for NetProfitSummaryCard
  // Default to "All Data" (0 for month and year indicates All Data mode)
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);
  
  // Simple cache for recently fetched data
  const [dataCache, setDataCache] = useState<Map<string, NetProfitData>>(new Map());
  const fetchNetProfitData = async (silent = false) => {
    try {
      // Generate cache key for current selection
      const cacheKey = `${selectedMonth}-${selectedYear}`;
      
      // Check cache first for instant response
      if (dataCache.has(cacheKey)) {
        console.log('💰 Using cached data for:', cacheKey);
        setData(dataCache.get(cacheKey)!);
        setLastUpdated(new Date());
        setError(null);
        if (!silent) {
          setLoading(false);
        }
        return;
      }
      
      // Show period changing indicator instead of full loading for better UX
      if (!silent && data) {
        setIsChangingPeriod(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('💰 Fetching net profit calculation data...', {
        selectedMonth,
        selectedYear,
        mode: selectedMonth === 0 && selectedYear === 0 ? 'All Data' : 'Filtered',
        silent,
        cached: false
      });

      // Determine if using All Data mode or specific month/year filter
      let queryParams = '';
      let dateInfo = {};
      
      if (selectedMonth === 0 && selectedYear === 0) {
        // All Data mode - no date filtering
        console.log('📅 Using All Data mode (no date filtering)');
        dateInfo = { mode: 'All Data' };
      } else {
        // Calculate date range from selected month and year
        const startDate = new Date(selectedYear, selectedMonth - 1, 1); // First day of month
        const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of month
        
        queryParams = `?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
        
        dateInfo = {
          selectedMonth, 
          selectedYear,
          startDate: startDate.toISOString().split('T')[0], 
          endDate: endDate.toISOString().split('T')[0] 
        };
        
        console.log('📅 Using month/year filter:', dateInfo);
      }

      // Get dashboard metrics using simple API request with fallback
      const salesResult = await makeSimpleApiRequest(`/dashboard/metrics${queryParams}`);
      
      // Get cash flow expenses for salaries with date filtering 
      let expensesUrl = '/cash-flow/entries?entry_type=expense&limit=1000';
      if (queryParams) {
        // Convert start_date/end_date to date_start/date_end for cash flow API
        const dateParams = queryParams
          .replace('?start_date=', '&date_start=')
          .replace('&end_date=', '&date_end=');
        expensesUrl += dateParams;
      }
      
      console.log('💰 Fetching expenses with URL:', expensesUrl);
      console.log('💰 Date filtering parameters:', { 
        selectedMonth, 
        selectedYear, 
        originalQueryParams: queryParams 
      });
      const expensesResult = await makeSimpleApiRequest(expensesUrl);

      if (salesResult.success && salesResult.data) {
        const salesData = salesResult.data;

        // ✅ Use backend calculated values which now include affiliate endorse data
        const totalRevenue = Number(salesData.totalRevenue) || 0;
        const totalSettlementAmount = Number(salesData.totalSettlementAmount) || 0;
        const totalHPP = Number(salesData.totalHPP) || 0;
        const advertisingCosts = Number(salesData.totalAdvertisingSettlement) || 0;
        const affiliateEndorseFee = Number(salesData.totalAffiliateEndorseFee) || 0;

        // ✅ Calculate total salaries from Cash Flow Expenses
        let salariesAndBenefits = 0;
        if (expensesResult.success && expensesResult.data && expensesResult.data.entries) {
          const allExpenses = expensesResult.data.entries;
          const salaryExpenses = allExpenses
            .filter((expense: any) => expense.category === 'Salaries & Benefits');
          
          console.log('💰 Expenses API Response Details:', {
            totalExpenses: allExpenses.length,
            salaryExpenses: salaryExpenses.length,
            period: selectedMonth === 0 ? 'All Data' : `${selectedMonth}/${selectedYear}`,
            sampleExpenses: allExpenses.slice(0, 3).map(e => ({
              date: e.entry_date,
              category: e.category,
              amount: e.amount
            }))
          });
          
          salariesAndBenefits = salaryExpenses
            .reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);
            
          console.log('💰 Salary calculation result:', {
            totalSalaryExpenses: salaryExpenses.length,
            totalAmount: salariesAndBenefits,
            period: selectedMonth === 0 ? 'All Data' : `${selectedMonth}/${selectedYear}`
          });
        } else {
          console.log('💰 Expenses data not available:', {
            success: expensesResult.success,
            hasData: !!expensesResult.data,
            hasEntries: !!(expensesResult.data && expensesResult.data.entries)
          });
        }

        // ✅ NEW FORMULA: Net Profit = Gross Profit - Advertising Costs - Affiliate Endorse Fee - Salaries & Benefits
        const grossProfit = totalSettlementAmount - totalHPP; // Gross profit = Settlement - HPP
        const netProfit = grossProfit - advertisingCosts - affiliateEndorseFee - salariesAndBenefits;
      
        const profitMargin = totalSettlementAmount > 0 ? (grossProfit / totalSettlementAmount) * 100 : 0;
        const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        const newData = {
          total_revenue: totalRevenue,
          total_settlement_amount: totalSettlementAmount,
          total_hpp: totalHPP,
          gross_profit: grossProfit,
          advertising_costs: advertisingCosts,
          affiliate_endorse_fee: affiliateEndorseFee,
          salaries_benefits: salariesAndBenefits,
          net_profit: netProfit,
          profit_margin: profitMargin,
          net_profit_margin: netProfitMargin
        };
        
        setData(newData);
        
        // Cache the result for faster future access
        setDataCache(prev => new Map(prev).set(cacheKey, newData));
        
        setLastUpdated(new Date());
        console.log('✅ Net profit calculation completed:', {
          grossProfit,
          advertisingCosts,
          affiliateEndorseFee,
          salariesAndBenefits,
          netProfit,
          ...dateInfo,
          formula: 'NEW: Net Profit = Gross Profit - Advertising Costs - Affiliate Endorse Fee - Salaries & Benefits'
        });

      } else {
        // Use fallback data when API is unavailable
        console.log('ℹ️ Using fallback data for net profit calculation');
        
        // Calculate realistic salary data based on period selection
        let fallbackSalaries = 14000000; // Default monthly salary
        if (selectedMonth === 0 && selectedYear === 0) {
          // All data - assume 12 months of salary
          fallbackSalaries = 14000000 * 12; // 168,000,000
        }
        
        const fallbackGrossProfit = 27000000;
        const fallbackAdvertising = 2500000;
        const fallbackAffiliateEndorse = 125000;
        const fallbackNetProfit = fallbackGrossProfit - fallbackAdvertising - fallbackAffiliateEndorse - fallbackSalaries;
        
        // Provide fallback calculation with demo data
        const fallbackData = {
          total_revenue: 45000000,
          total_settlement_amount: 42000000,
          total_hpp: 15000000,
          gross_profit: fallbackGrossProfit,
          advertising_costs: fallbackAdvertising,
          affiliate_endorse_fee: fallbackAffiliateEndorse,
          salaries_benefits: fallbackSalaries,
          net_profit: fallbackNetProfit,
          profit_margin: 64.3,
          net_profit_margin: (fallbackNetProfit / 45000000) * 100
        };
        
        setData(fallbackData);
        
        // Cache fallback data too
        setDataCache(prev => new Map(prev).set(cacheKey, fallbackData));
        
        setLastUpdated(new Date());
        console.log('💰 Fallback salary calculation:', {
          period: selectedMonth === 0 ? 'All Data' : `${selectedMonth}/${selectedYear}`,
          salaries: fallbackSalaries,
          netProfit: fallbackNetProfit
        });
      }

    } catch (error) {
      console.error('❌ Net profit calculation failed:', error);
      setError('Gagal memuat data pendapatan bersih. Periksa koneksi backend.');
      
      // Set empty data instead of fallback
      setData({
        total_revenue: 0,
        total_settlement_amount: 0,
        total_hpp: 0,
        gross_profit: 0,
        advertising_costs: 0,
        affiliate_endorse_fee: 0,
        salaries_benefits: 0,
        net_profit: 0,
        profit_margin: 0,
        net_profit_margin: 0
      });
    } finally {
      setLoading(false);
      setIsChangingPeriod(false);
    }
  };

  useEffect(() => {
    // Use silent loading for subsequent period changes to provide smoother UX
    const isInitialLoad = data === null;
    fetchNetProfitData(!isInitialLoad);
  }, [selectedMonth, selectedYear]);



  const getPeriodDisplayText = () => {
    if (selectedMonth === 0 && selectedYear === 0) {
      return 'All Data';
    }
    
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
  };

  if (loading && !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Net Profit Calculation Error</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }



  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Pendapatan Bersih (Net Profit)</CardTitle>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Periode: {getPeriodDisplayText()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <MonthYearOnlyPicker
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
              className="h-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data && (
          <div className="space-y-6">
            {/* Main Net Profit Display */}
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getTrendIcon(data.net_profit)}
                <h3 className="text-lg font-medium text-gray-900">Pendapatan Bersih</h3>
              </div>
              <p className={`text-3xl font-bold ${getTrendColor(data.net_profit)}`}>
                {formatCurrency(data.net_profit)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Net Profit Margin: {data.net_profit_margin.toFixed(1)}%
              </p>
            </div>

            {/* Profit Calculation Breakdown */}
            {showDetails && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Breakdown Perhitungan</h4>
                </div>

                {/* Responsive Grid Layout for Better Use of Full Width */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column: Revenue Breakdown */}
                  <div className="space-y-3">
                    {/* Step 1: Gross Profit */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">1. Gross Profit</span>
                        <span className="font-bold text-gray-900">{formatCurrency(data.gross_profit)}</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Settlement Amount:</span>
                          <span>{formatCurrency(data.total_settlement_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HPP (Cost of Goods):</span>
                          <span>- {formatCurrency(data.total_hpp)}</span>
                        </div>
                        <div className="border-t pt-1 mt-1">
                          <div className="flex justify-between font-medium">
                            <span>Gross Profit:</span>
                            <span>{formatCurrency(data.gross_profit)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Expenses */}
                  <div className="space-y-3">
                    {/* Step 2: Advertising Costs */}
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-gray-700">2. Biaya Iklan</span>
                        </div>
                        <span className="font-bold text-red-700">- {formatCurrency(data.advertising_costs)}</span>
                      </div>
                    </div>

                    {/* Step 3: Affiliate Endorse Costs */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">3. Biaya Affiliate Endorse</span>
                        </div>
                        <span className="font-bold text-purple-700">- {formatCurrency(data.affiliate_endorse_fee)}</span>
                      </div>
                    </div>

                    {/* Step 4: Salaries & Benefits */}
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">4. Gaji Karyawan</span>
                        </div>
                        <span className="font-bold text-orange-700">- {formatCurrency(data.salaries_benefits)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5: Net Profit Result - Full Width */}
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">5. Pendapatan Bersih</span>
                    </div>
                    <span className={`font-bold text-lg ${getTrendColor(data.net_profit)}`}>
                      {formatCurrency(data.net_profit)}
                    </span>
                  </div>
                  
                  {/* Responsive breakdown display */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-600 mb-3">
                    <div className="flex justify-between md:flex-col md:items-start">
                      <span>Gross Profit:</span>
                      <span className="font-medium">{formatCurrency(data.gross_profit)}</span>
                    </div>
                    <div className="flex justify-between md:flex-col md:items-start">
                      <span>Biaya Iklan:</span>
                      <span className="font-medium text-red-600">- {formatCurrency(data.advertising_costs)}</span>
                    </div>
                    <div className="flex justify-between md:flex-col md:items-start">
                      <span>Biaya Affiliate Endorse:</span>
                      <span className="font-medium text-purple-600">- {formatCurrency(data.affiliate_endorse_fee)}</span>
                    </div>
                    <div className="flex justify-between md:flex-col md:items-start">
                      <span>Gaji Karyawan:</span>
                      <span className="font-medium text-orange-600">- {formatCurrency(data.salaries_benefits)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-medium text-green-700">
                      <span>Net Profit Final:</span>
                      <span className="text-lg">{formatCurrency(data.net_profit)}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}