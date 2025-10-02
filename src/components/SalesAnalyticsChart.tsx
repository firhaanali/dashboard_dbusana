import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { simpleApiDashboard } from '../utils/simpleApiUtils';
import { formatCurrencyResponsive } from '../utils/numberFormatUtils';

interface ChartData {
  date: string;
  name: string;
  penjualan: number;
  quantity: number;
  orders: number;
  target: number;
}

interface SalesAnalyticsChartProps {
  period?: '7d' | '30d' | '90d';
  onPeriodChange?: (period: '7d' | '30d' | '90d') => void;
}

export function SalesAnalyticsChart({ period = '30d', onPeriodChange }: SalesAnalyticsChartProps) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeMetric, setActiveMetric] = useState<'penjualan' | 'quantity' | 'orders'>('penjualan');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    fetchChartData();
  }, [period]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      console.log(`📊 Fetching chart data for ${period}...`);

      const response = await simpleApiDashboard.getChartData(period);
      
      if (response.success && response.data) {
        setChartData(response.data);
        console.log('✅ Chart data loaded:', response.data.length, 'data points');
      }
    } catch (error) {
      console.error('❌ Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricConfig = () => {
    switch (activeMetric) {
      case 'penjualan':
        return {
          title: 'Penjualan',
          dataKey: 'penjualan',
          color: '#3b82f6',
          formatter: (value: number) => formatCurrencyResponsive(value, { useShortFormat: true }).display
        };
      case 'quantity':
        return {
          title: 'Produk Terjual',
          dataKey: 'quantity',
          color: '#10b981',
          formatter: (value: number) => `${value} unit`
        };
      case 'orders':
        return {
          title: 'Jumlah Pesanan',
          dataKey: 'orders',
          color: '#f59e0b',
          formatter: (value: number) => `${value} pesanan`
        };
    }
  };

  const metricConfig = getMetricConfig();

  const periodLabels = {
    '7d': '7 Hari',
    '30d': '30 Hari',
    '90d': '90 Hari'
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Tren {metricConfig.title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Analisis performa {periodLabels[period]} terakhir
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'penjualan' as const, label: 'Penjualan', icon: TrendingUp },
                { key: 'quantity' as const, label: 'Produk', icon: BarChart3 },
                { key: 'orders' as const, label: 'Pesanan', icon: Calendar }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={activeMetric === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveMetric(key)}
                  className="px-3 py-1.5 text-xs"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="px-3 py-1.5 text-xs"
              >
                Garis
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="px-3 py-1.5 text-xs"
              >
                Batang
              </Button>
            </div>
            
            {/* Period Selector */}
            {onPeriodChange && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                {Object.entries(periodLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={period === key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onPeriodChange(key as '7d' | '30d' | '90d')}
                    className="px-3 py-1.5 text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickFormatter={metricConfig.formatter}
                />
                <Tooltip 
                  formatter={(value: any) => [metricConfig.formatter(Number(value)), metricConfig.title]}
                  labelStyle={{ color: '#666' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={metricConfig.dataKey} 
                  stroke={metricConfig.color} 
                  strokeWidth={3}
                  dot={{ fill: metricConfig.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: metricConfig.color, strokeWidth: 2, fill: 'white' }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickFormatter={metricConfig.formatter}
                />
                <Tooltip 
                  formatter={(value: any) => [metricConfig.formatter(Number(value)), metricConfig.title]}
                  labelStyle={{ color: '#666' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey={metricConfig.dataKey} 
                  fill={metricConfig.color}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Chart Summary */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: metricConfig.color }}
              />
              {metricConfig.title}
            </Badge>
            <span className="text-sm text-gray-600">
              {chartData.length} data point
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            Periode: {periodLabels[period]}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}