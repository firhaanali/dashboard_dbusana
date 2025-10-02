import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { 
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  RefreshCw,
  Activity,
  DollarSign,
  Package,
  Gauge,
  ChevronDown
} from 'lucide-react';
// Removed toast import to prevent errors when backend is not available
import { formatDateSimple } from '../utils/dateUtils';
import { simpleApiSales } from '../utils/simpleApiUtils';
import { StockForecastingDashboard } from './StockForecastingDashboard';
import { withGracefulFallback } from '../utils/apiErrorHandler';
import { logSalesDataLoading } from '../utils/salesDataDebugLogger';
import { generateAdvancedForecast } from '../utils/forecastingMainGenerator';
import { PredictionChartViewerFixed } from './PredictionChartViewerFixed';
import { PredictionAnalysisPanelFixed as PredictionAnalysisPanel } from './PredictionAnalysisPanelFixed';
import { PredictionQuickActions } from './PredictionQuickActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ForecastingDebugMonitor } from '../utils/forecastingDebugMonitor';
import { logRealisticForecastingPerformance, validateRealisticBusinessLogic, trackRealisticForecastingTrends } from '../utils/realisticForecastingMonitor';
// No mock data - use empty arrays with zero values

// Main component interfaces
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
  customer?: string;
  location?: string;
}

interface ProcessedDataPoint {
  date: string;
  revenue: number;
  orders: number;
  quantity: number;
  profit: number;
  avg_order_value: number;
  marketplace_data: Record<string, number>;
}

export function ForecastingDashboard() {
  const [salesData, setSalesData] = useState<RealSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState<'30d' | '90d' | '180d'>('90d');
  const [forecastType, setForecastType] = useState<'sales' | 'stock'>('sales');
  const [dataRange, setDataRange] = useState<'recent' | 'all'>('recent');

  // Load comprehensive sales data - set to empty with zero values when no data
  const loadData = async () => {
    setLoading(true);
    
    try {
      console.log('🔄 Attempting to load sales data...');
      
      const result = await withGracefulFallback(
        () => simpleApiSales.getAll(), // Remove limit to get ALL sales data from database
        [], // Empty array instead of mock data
        'Sales data'
      );
      
      if (result.success && result.data && result.data.length > 0) {
        const validSales = result.data
          .filter((sale: any) => {
            // Accept revenue from any available field, including zero and non-zero values
            const hasValidRevenue = (
              (sale.order_amount !== null && sale.order_amount !== undefined) || 
              (sale.total_revenue !== null && sale.total_revenue !== undefined) || 
              (sale.settlement_amount !== null && sale.settlement_amount !== undefined)
            );
            const hasValidDate = sale.created_time || sale.delivered_time;
            return sale && hasValidRevenue && hasValidDate;
          })
          .map((sale: any) => {
            const createdTime = sale.delivered_time || sale.created_time || new Date().toISOString();
            // Use the highest available revenue value, ensuring we don't miss any data
            const revenue = Math.max(
              Number(sale.settlement_amount) || 0,
              Number(sale.total_revenue) || 0, 
              Number(sale.order_amount) || 0
            );
            
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
          })
          .sort((a, b) => new Date(a.created_time).getTime() - new Date(b.created_time).getTime());
        
        setSalesData(validSales);
        console.log(`✅ Loaded ${validSales.length} sales records`);
        
        // Debug logging for revenue calculation verification
        const totalRevenue = validSales.reduce((sum, sale) => sum + sale.revenue, 0);
        logSalesDataLoading(validSales.length, totalRevenue, 0); // Data points calculated later
      } else {
        console.log('⚠️ No sales data available - setting to empty');
        setSalesData([]); // Empty array instead of mock data
      }

      setLastUpdated(new Date());

    } catch (error) {
      console.log('⚠️ No data available - setting to empty');
      setSalesData([]); // Empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Process sales data into daily aggregates
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
    
    const sortedData = Array.from(dailyData.values())
      .map(data => ({
        ...data,
        avg_order_value: data.orders > 0 ? data.revenue / data.orders : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Apply data range filtering based on user selection
    let finalData = sortedData;
    
    if (dataRange === 'recent') {
      // Limit to last 4 months (120 days) for better chart visualization
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 120); // 4 months ago
      
      const recentData = sortedData.filter(data => {
        const dataDate = new Date(data.date);
        return dataDate >= cutoffDate;
      });
      
      // If we don't have enough recent data, fall back to the latest 60 data points
      finalData = recentData.length > 30 ? recentData : sortedData.slice(-60);
    }
    
    // Enhanced debug logging for processed data
    if (finalData.length > 0) {
      const totalProcessedRevenue = finalData.reduce((sum, d) => sum + d.revenue, 0);
      console.log('📈 Processed Sales Data Summary:', {
        totalDataPoints: sortedData.length,
        displayedDataPoints: finalData.length,
        totalRevenue: `Rp ${totalProcessedRevenue.toLocaleString('id-ID')}`,
        dateRange: finalData.length > 0 ? `${finalData[0].date} to ${finalData[finalData.length - 1].date}` : 'No data',
        avgDailyRevenue: `Rp ${(totalProcessedRevenue / finalData.length).toLocaleString('id-ID')}`,
        dataRangeMode: dataRange,
        displayInfo: dataRange === 'recent' ? 'Last 4 months or 60 points' : 'All available data'
      });
    }
    
    return finalData;
  }, [salesData, dataRange]);

  // Generate forecasts using advanced algorithms
  const forecastData = useMemo(() => {
    if (processedData.length < 7) return { forecasts: [], metrics: null, chartData: [] };
    
    try {
      // Convert processed data to format expected by forecasting algorithm
      const historicalData = processedData.map(d => ({
        date: d.date,
        value: d.revenue
      }));
      
      const periods = forecastHorizon === '30d' ? 30 : forecastHorizon === '90d' ? 90 : 180;
      const result = generateAdvancedForecast(historicalData, periods);
      
      // Enhanced debug monitoring for forecast quality
      if (result.forecasts.length > 0) {
        // Use realistic forecasting monitor if available
        if (result.bestModel === 'Realistic Natural Forecaster' && result.analysis) {
          logRealisticForecastingPerformance(
            result.bestModel,
            historicalData,
            result.forecasts,
            result.metrics,
            result.analysis
          );
          
          validateRealisticBusinessLogic(historicalData, result.forecasts);
          trackRealisticForecastingTrends(result.forecasts, forecastHorizon);
        } else {
          // Fallback to original monitoring
          ForecastingDebugMonitor.logForecastingPerformance(
            result.bestModel || 'Unknown',
            historicalData,
            result.forecasts,
            result.metrics
          );
          
          ForecastingDebugMonitor.validateBusinessLogic(historicalData, result.forecasts);
        }
        
        // Log algorithm comparison if available
        if (result.modelComparison && Array.isArray(result.modelComparison)) {
          ForecastingDebugMonitor.logAlgorithmComparison(result.modelComparison);
        }
      }
      
      // Combine historical and forecast data for charting
      const chartData = [
        ...processedData.map(d => ({
          date: d.date,
          revenue: d.revenue,
          orders: d.orders,
          type: 'historical'
        })),
        ...result.forecasts.map(f => ({
          date: f.date,
          predicted: f.predicted,
          lower_bound: f.lower_bound,
          upper_bound: f.upper_bound,
          type: 'forecast'
        }))
      ];
      
      return {
        forecasts: result.forecasts,
        metrics: result.metrics,
        chartData,
        bestModel: result.bestModel,
        modelComparison: result.modelComparison
      };
      
    } catch (error) {
      console.warn('Forecasting algorithm failed:', error);
      return { forecasts: [], metrics: null, chartData: [] };
    }
  }, [processedData, forecastHorizon]);

  // Calculate summary metrics with real forecasting data
  const summaryMetrics = useMemo(() => {
    const totalRevenue = processedData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = processedData.reduce((sum, d) => sum + d.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const recentData = processedData.slice(-30);
    const olderData = processedData.slice(-60, -30);
    
    const recentAvg = recentData.length > 0 ? recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length : 0;
    const olderAvg = olderData.length > 0 ? olderData.reduce((sum, d) => sum + d.revenue, 0) / olderData.length : recentAvg;
    
    const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    
    // Use real forecasting metrics if available
    const confidence = forecastData.metrics?.confidence || 0;
    const qualityScore = forecastData.metrics?.quality_score || 0;
    
    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      trend,
      confidence,
      qualityScore,
      marketCycle: trend > 0 ? 'expansion' : 'neutral',
      lastDataDate: processedData.length > 0 ? processedData[processedData.length - 1].date : null,
      bestModel: forecastData.bestModel || 'N/A'
    };
  }, [processedData, forecastData]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Loading forecasting engine...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                {forecastType === 'sales' ? 'Sales Forecasting' : 'Stock Forecasting'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Prediksi dan proyeksi {forecastType === 'sales' ? 'penjualan' : 'inventory'}
              </p>
              {forecastType === 'sales' && (
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                  <span>📈 Trend: <strong className={summaryMetrics.trend > 0 ? 'text-green-600' : summaryMetrics.trend < 0 ? 'text-red-600' : 'text-gray-500'}>
                    {summaryMetrics.trend > 0 ? '+' : ''}{summaryMetrics.trend.toFixed(1)}%
                  </strong></span>
                  <span>Data Quality: <strong className={summaryMetrics.qualityScore > 0 ? "text-blue-600" : "text-gray-500"}>{summaryMetrics.qualityScore.toFixed(1)}%</strong></span>
                  <span>Confidence: <strong className={summaryMetrics.confidence > 0 ? "text-purple-600" : "text-gray-500"}>{summaryMetrics.confidence.toFixed(0)}%</strong></span>
                  {summaryMetrics.lastDataDate && (
                    <span>From: <strong className="text-gray-700">{formatDateSimple(new Date(summaryMetrics.lastDataDate))}</strong></span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated: {formatDateSimple(lastUpdated)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Forecast Type Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Forecasting Type:</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    {forecastType === 'sales' ? (
                      <><TrendingUp className="w-4 h-4" />Sales Forecasting</>
                    ) : (
                      <><Package className="w-4 h-4" />Stock Forecasting</>
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setForecastType('sales')}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Sales Forecasting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setForecastType('stock')}>
                    <Package className="w-4 h-4 mr-2" />
                    Stock Forecasting
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {forecastType === 'sales' && (
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
            )}
            
            {forecastType === 'sales' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Data Range:</label>
                <Select 
                  value={dataRange} 
                  onValueChange={(value: 'recent' | 'all') => setDataRange(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent (4M)</SelectItem>
                    <SelectItem value="all">All Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Data Quality Badge */}
            {forecastType === 'sales' && (
              <Badge variant={summaryMetrics.qualityScore > 85 ? "default" : "secondary"}>
                Data Quality: {summaryMetrics.qualityScore.toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conditional Content Based on Forecast Type */}
      {forecastType === 'sales' ? (
        <>
          {/* Sales Forecasting KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total Revenue (Historical)</p>
                    <p className="text-2xl font-bold text-blue-800">
                      Rp {summaryMetrics.totalRevenue.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      From {summaryMetrics.totalOrders} orders
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
                    <p className="text-sm text-green-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-green-800">
                      Rp {summaryMetrics.avgOrderValue.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      Per transaction
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Model Confidence</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {summaryMetrics.confidence.toFixed(0)}%
                    </p>
                    <p className="text-xs text-purple-500 mt-1">
                      Quality: {summaryMetrics.qualityScore.toFixed(1)}%
                    </p>
                  </div>
                  <Gauge className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">Trend Direction</p>
                    <p className="text-2xl font-bold text-orange-800 flex items-center gap-1">
                      {summaryMetrics.trend > 0 ? (
                        <><TrendingUp className="w-6 h-6" /> +{summaryMetrics.trend.toFixed(1)}%</>
                      ) : summaryMetrics.trend < 0 ? (
                        <><TrendingDown className="w-6 h-6" /> {summaryMetrics.trend.toFixed(1)}%</>
                      ) : (
                        <><Activity className="w-6 h-6" /> 0.0%</>
                      )}
                    </p>
                    <p className="text-xs text-orange-500 mt-1">
                      30-day trend
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    {summaryMetrics.trend > 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    ) : summaryMetrics.trend < 0 ? (
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    ) : (
                      <Activity className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced 4-Tab Forecasting Dashboard */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Sales Forecasting Results</CardTitle>
                  <p className="text-sm text-gray-600">
                    Basic forecasting analysis with available data
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Data Points:</span>
                        <p className="font-semibold">{processedData.length} days</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Forecast Horizon:</span>
                        <p className="font-semibold">{forecastHorizon === '30d' ? '30' : forecastHorizon === '90d' ? '90' : '180'} days</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Best Model:</span>
                        <p className="font-semibold text-blue-600">{summaryMetrics.bestModel}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Model Status:</span>
                        <p className="font-semibold text-green-600">
                          {forecastData.forecasts?.length > 0 ? 'Active' : 'Ready'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Update:</span>
                        <p className="font-semibold">{lastUpdated ? formatDateSimple(lastUpdated) : 'N/A'}</p>
                      </div>
                    </div>

                    {/* Real forecast visualization */}
                    <div className="h-64">
                      {forecastData.chartData.length > 0 ? (
                        <PredictionChartViewerFixed
                          chartData={forecastData.chartData}
                          forecastData={forecastData.forecasts}
                          processedData={processedData}
                          forecastMetrics={forecastData.metrics || {
                            mape: 0, mae: 0, rmse: 0, confidence: 0, r_squared: 0, quality_score: 0
                          }}
                          summaryMetrics={summaryMetrics}
                        />
                      ) : (
                        <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Brain className="w-12 h-12 mx-auto mb-2 text-purple-600" />
                            <p className="text-gray-600">Forecasting Chart</p>
                            <p className="text-sm text-gray-500">
                              {processedData.length < 7 
                                ? `Need at least 7 days of data (have ${processedData.length})`
                                : 'Loading forecasting algorithms...'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <PredictionChartViewerFixed
                chartData={forecastData.chartData}
                forecastData={forecastData.forecasts}
                processedData={processedData}
                forecastMetrics={forecastData.metrics || {
                  mape: 0,
                  mae: 0,
                  rmse: 0,
                  confidence: 0,
                  r_squared: 0,
                  quality_score: 0
                }}
                summaryMetrics={summaryMetrics}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <PredictionAnalysisPanel
                forecastData={forecastData.forecasts}
                processedData={processedData}
                forecastMetrics={forecastData.metrics || {
                  mape: 0,
                  mae: 0,
                  rmse: 0,
                  confidence: 0,
                  r_squared: 0,
                  quality_score: 0
                }}
                summaryMetrics={summaryMetrics}
              />
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <PredictionQuickActions
                forecastData={forecastData.forecasts}
                forecastMetrics={forecastData.metrics || {
                  mape: 0,
                  mae: 0,
                  rmse: 0,
                  confidence: 0,
                  r_squared: 0,
                  quality_score: 0
                }}
                summaryMetrics={summaryMetrics}
                onRefreshForecast={loadData}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <StockForecastingDashboard />
      )}
    </div>
  );
}