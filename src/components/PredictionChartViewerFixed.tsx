import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart,
  Bar,
  ScatterChart,
  Scatter,
  Brush
} from 'recharts';
import { 
  Maximize2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Settings,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  Calendar,
  Filter,
  Grid3X3,
  Layers
} from 'lucide-react';
import { formatDateSimple } from '../utils/dateUtils';

interface PredictionChartViewerProps {
  chartData: any[];
  forecastData: any[];
  processedData: any[];
  forecastMetrics: any;
  summaryMetrics: any;
}

export function PredictionChartViewerFixed({ 
  chartData, 
  forecastData, 
  processedData, 
  forecastMetrics,
  summaryMetrics 
}: PredictionChartViewerProps) {
  // Chart display states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area' | 'composed' | 'scatter'>('composed');
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '60d' | '90d'>('all');
  const [zoomLevel, setZoomLevel] = useState([0, 100]);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(false);
  const [showComponents, setShowComponents] = useState(false);
  const [showVolatility, setShowVolatility] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [animate, setAnimate] = useState(true);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    if (timeRange === 'all') return chartData;
    
    const days = parseInt(timeRange.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return chartData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  }, [chartData, timeRange]);

  // Apply zoom to data
  const zoomedData = useMemo(() => {
    const startIndex = Math.floor((zoomLevel[0] / 100) * filteredData.length);
    const endIndex = Math.ceil((zoomLevel[1] / 100) * filteredData.length);
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, zoomLevel]);

  // Detect data type for chart configuration
  const dataType = useMemo(() => {
    if (zoomedData.length === 0) return 'unknown';
    const sample = zoomedData[0];
    
    if (sample.demand_quantity !== undefined || sample.predicted_demand !== undefined) {
      return 'stock';
    } else if (sample.revenue !== undefined || sample.predicted !== undefined) {
      return 'sales';
    }
    return 'unknown';
  }, [zoomedData]);

  // Find forecast start point for reference line
  const forecastStartDate = processedData && processedData.length > 0 
    ? processedData[processedData.length - 1]?.date 
    : null;

  // Chart component based on type
  const renderChart = (height: number = 400) => {
    const commonProps = {
      data: zoomedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    // Debug: Log data to see what's available
    if (zoomedData.length > 0) {
      console.log('🔍 Chart Data Sample:', {
        firstItem: zoomedData[0],
        lastItem: zoomedData[zoomedData.length - 1],
        availableKeys: Object.keys(zoomedData[0] || {}),
        dataType,
        dataLength: zoomedData.length
      });
    }

    // Get data keys based on type
    const historicalKey = dataType === 'stock' ? 'demand_quantity' : 'revenue';
    const forecastKey = dataType === 'stock' ? 'predicted_demand' : 'predicted';
    const historicalName = dataType === 'stock' ? 'Historical Demand' : 'Historical Revenue';
    const forecastName = dataType === 'stock' ? 'Forecast Demand' : 'Forecast Revenue';

    const tooltipFormatter = (value: any, name: string) => {
      if (!value || isNaN(value)) return ['-', name];
      
      let formattedValue;
      if (dataType === 'stock') {
        // Round demand values to the nearest whole number for better readability
        const roundedValue = Math.round(Number(value));
        formattedValue = `${roundedValue.toLocaleString('id-ID')} units`;
      } else {
        formattedValue = `Rp ${Number(value).toLocaleString('id-ID')}`;
      }
      
      // Custom nama untuk chart yang lebih jelas
      const nameMapping: { [key: string]: string } = {
        'demand_quantity': 'Historical Demand',
        'predicted_demand': 'Forecast Demand',
        'revenue': 'Historical Revenue',
        'predicted': 'Forecast Revenue',
        'daily_demand': 'Daily Demand',
        'required_stock': 'Required Stock',
        'orders': 'Daily Orders'
      };
      
      const displayName = nameMapping[name] || name;
      return [formattedValue, displayName];
    };

    const labelFormatter = (label: string) => formatDateSimple(new Date(label));

    const yAxisFormatter = (value: any) => {
      const num = Number(value);
      if (dataType === 'stock') {
        return `${num.toLocaleString('id-ID')}`;
      } else {
        // Format as currency for sales data
        if (num >= 1000000) {
          return `Rp ${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
          return `Rp ${(num / 1000).toFixed(0)}K`;
        } else {
          return `Rp ${num.toLocaleString('id-ID')}`;
        }
      }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={labelFormatter}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={yAxisFormatter}
                domain={[0, 'dataMax']}
              />
              <Tooltip formatter={tooltipFormatter} labelFormatter={labelFormatter} />
              <Legend />
              
              {/* Historical Data Line */}
              <Line
                type="monotone"
                dataKey={historicalKey}
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name={historicalName}
                animationDuration={animate ? 1500 : 0}
                connectNulls={false}
              />
              
              {/* Forecast Data Line */}
              <Line
                type="monotone"
                dataKey={forecastKey}
                stroke="#dc2626"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
                name={forecastName}
                animationDuration={animate ? 1500 : 0}
                connectNulls={false}
              />
              
              {forecastStartDate && (
                <ReferenceLine 
                  x={forecastStartDate} 
                  stroke="#6b7280" 
                  strokeDasharray="2 2"
                  label="Forecast Start"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="date" tickFormatter={labelFormatter} />
              <YAxis 
                tickFormatter={yAxisFormatter}
                domain={[0, 'dataMax']}
              />
              <Tooltip formatter={tooltipFormatter} labelFormatter={labelFormatter} />
              <Legend />
              
              {/* Historical Data Area */}
              <Area
                type="monotone"
                dataKey={historicalKey}
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.3}
                name={historicalName}
                animationDuration={animate ? 1500 : 0}
              />
              
              {/* Forecast Data Area */}
              <Area
                type="monotone"
                dataKey={forecastKey}
                stroke="#dc2626"
                fill="#dc2626"
                fillOpacity={0.2}
                name={forecastName}
                animationDuration={animate ? 1500 : 0}
              />
              
              {forecastStartDate && (
                <ReferenceLine 
                  x={forecastStartDate} 
                  stroke="#6b7280" 
                  strokeDasharray="2 2"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis dataKey="date" tickFormatter={labelFormatter} />
              <YAxis 
                tickFormatter={yAxisFormatter}
                domain={[0, 'dataMax']}
              />
              <Tooltip formatter={tooltipFormatter} labelFormatter={labelFormatter} />
              <Legend />
              
              {showVolatility && (
                <Bar
                  dataKey="volatility_factor"
                  fill="#e5e7eb"
                  fillOpacity={0.3}
                  name="Volatility"
                />
              )}
              
              {/* Historical Data Line */}
              <Line
                type="monotone"
                dataKey={historicalKey}
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name={historicalName}
                animationDuration={animate ? 1500 : 0}
                connectNulls={false}
              />
              
              {/* Forecast Data Line */}
              <Line
                type="monotone"
                dataKey={forecastKey}
                stroke="#dc2626"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
                name={forecastName}
                animationDuration={animate ? 1500 : 0}
                connectNulls={false}
              />
              
              {forecastStartDate && (
                <ReferenceLine 
                  x={forecastStartDate} 
                  stroke="#6b7280" 
                  strokeDasharray="2 2"
                  label="Forecast Start"
                />
              )}
              
              {/* Brush for zooming */}
              <Brush dataKey="date" height={30} stroke="#8884d8" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey="date"
                tickFormatter={labelFormatter}
              />
              <YAxis 
                tickFormatter={yAxisFormatter}
                domain={[0, 'dataMax']}
              />
              <Tooltip formatter={tooltipFormatter} labelFormatter={labelFormatter} />
              <Legend />
              
              <Line
                type="monotone"
                dataKey={historicalKey}
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name={historicalName}
                animationDuration={animate ? 1500 : 0}
                connectNulls={false}
              />
              
              <Line
                type="monotone"
                dataKey={forecastKey}
                stroke="#dc2626"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
                name={forecastName}
                animationDuration={animate ? 1500 : 0}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Reset all settings
  const resetSettings = () => {
    setChartType('composed');
    setTimeRange('all');
    setZoomLevel([0, 100]);
    setShowConfidenceInterval(false);
    setShowComponents(false);
    setShowVolatility(false);
    setShowGrid(true);
    setAnimate(true);
  };

  // Export chart (placeholder)
  const exportChart = () => {
    // This would implement actual chart export functionality
    alert('Export functionality would be implemented here');
  };

  const FullscreenDialog = () => (
    <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Advanced Prediction Chart Viewer
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-6 pt-4">
          <Tabs defaultValue="chart" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="settings">Chart Settings</TabsTrigger>
              <TabsTrigger value="data">Data Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="h-full mt-4">
              <div className="h-[calc(100%-2rem)]">
                {renderChart(600)}
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Chart Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Chart Type</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                        <SelectItem value="composed">Composed Chart</SelectItem>
                        <SelectItem value="scatter">Scatter Plot</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Time Range */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Time Range</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Data</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="60d">Last 60 Days</SelectItem>
                        <SelectItem value="90d">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Zoom Level */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Zoom Level</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Start: {zoomLevel[0]}%</span>
                        <span>End: {zoomLevel[1]}%</span>
                      </div>
                      <Slider
                        value={zoomLevel}
                        onValueChange={setZoomLevel}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Display Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Display Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">

                      <div className="flex items-center justify-between">
                        <label className="text-sm">Show Components</label>
                        <Switch 
                          checked={showComponents} 
                          onCheckedChange={setShowComponents} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Show Volatility</label>
                        <Switch 
                          checked={showVolatility} 
                          onCheckedChange={setShowVolatility} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Grid Lines</label>
                        <Switch 
                          checked={showGrid} 
                          onCheckedChange={setShowGrid} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Animations</label>
                        <Switch 
                          checked={animate} 
                          onCheckedChange={setAnimate} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4">
                <Button onClick={resetSettings} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset Settings
                </Button>
                <Button onClick={exportChart} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Chart
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="data" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Data Points</span>
                        <span className="font-medium">{chartData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Historical Points</span>
                        <span className="font-medium">{processedData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Forecast Points</span>
                        <span className="font-medium">{forecastData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date Range</span>
                        <span className="font-medium">{timeRange.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Data Type</span>
                        <span className="font-medium capitalize">{dataType}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Model Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">MAPE</span>
                        <Badge variant={forecastMetrics?.mape < 15 ? "default" : "secondary"}>
                          {forecastMetrics?.mape?.toFixed(1) || '0.0'}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">R² Score</span>
                        <Badge variant={forecastMetrics?.r_squared > 0.8 ? "default" : "secondary"}>
                          {forecastMetrics?.r_squared?.toFixed(3) || '0.000'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Confidence</span>
                        <Badge variant="outline">
                          {summaryMetrics?.confidence?.toFixed(0) || '0'}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Data Quality</span>
                        <Badge variant={summaryMetrics?.qualityScore > 85 ? "default" : "secondary"}>
                          {summaryMetrics?.qualityScore?.toFixed(1) || '0.0'}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );

  const chartTitle = dataType === 'stock' ? 'Stock Demand Forecasting Chart' : 'Sales Revenue Forecasting Chart';
  const chartDescription = dataType === 'stock' 
    ? 'Interactive stock demand forecasting with historical fluctuations, forecast values, and confidence intervals'
    : 'Interactive sales revenue forecasting with historical data, predicted values, and confidence intervals';

  return (
    <>
      {/* Regular Chart with View Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {chartTitle}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Quick Controls */}
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="composed">Composed</SelectItem>
                  <SelectItem value="scatter">Scatter</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfidenceInterval(!showConfidenceInterval)}
                className={showConfidenceInterval ? 'bg-blue-50' : ''}
              >
                <Eye className="w-4 h-4 mr-1" />
                Confidence
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Maximize2 className="w-4 h-4 mr-1" />
                    Full View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Prediction Chart - Full View</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1">
                    {renderChart(500)}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Advanced
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {chartDescription}
          </p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="space-y-4">
              {renderChart(400)}
              
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Data Points</div>
                  <div className="font-semibold">{zoomedData.length}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Chart Type</div>
                  <div className="font-semibold capitalize">{chartType}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Time Range</div>
                  <div className="font-semibold">{timeRange === 'all' ? 'All Data' : timeRange}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Data Type</div>
                  <div className="font-semibold capitalize">{dataType}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No data available for chart visualization</p>
                <p className="text-sm mt-1">Data type: {dataType}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Advanced Viewer */}
      <FullscreenDialog />
    </>
  );
}