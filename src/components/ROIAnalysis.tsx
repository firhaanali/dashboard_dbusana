import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
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
  Legend,
  ComposedChart,
  LabelList
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calculator,
  PieChart as PieChartIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Wallet,
  Award,
  Zap
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { enhancedApi } from '../utils/enhancedApiWrapper';

// Extend Window interface for console logging control
declare global {
  interface Window {
    platformFallbackLogged?: boolean;
    missingDateWarningLogged?: boolean;
    invalidDateWarningLogged?: boolean;
  }
}

interface ROIData {
  campaign_name: string;
  platform: string;
  total_cost: number;
  total_revenue: number;
  profit: number;
  roi_percentage: number;
  roas: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  cpa: number;
  ltv_estimate: number;
  payback_period: number;
  efficiency_rating: 'excellent' | 'good' | 'average' | 'poor';
}

interface TimeSeriesROI {
  date: string;
  cumulative_cost: number;
  cumulative_revenue: number;
  cumulative_profit: number;
  daily_roi: number;
  cumulative_roi: number;
}

interface ROIBreakdown {
  platform: string;
  campaigns: number;
  total_investment: number;
  total_return: number;
  net_profit: number;
  roi_percentage: number;
  avg_roas: number;
  best_campaign: string;
  worst_campaign: string;
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
  return `${value.toFixed(1)}%`;
};

const getROIColor = (roi: number) => {
  if (roi >= 300) return 'text-green-700';
  if (roi >= 200) return 'text-blue-700';
  if (roi >= 100) return 'text-yellow-700';
  if (roi >= 0) return 'text-orange-700';
  return 'text-red-700';
};

const getROIBadgeColor = (roi: number) => {
  if (roi >= 300) return 'bg-green-100 text-green-800 border-green-300';
  if (roi >= 200) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (roi >= 100) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (roi >= 0) return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-red-100 text-red-800 border-red-300';
};

const platformColors = {
  google_ads: '#4285F4',
  facebook_ads: '#1877F2',
  instagram_ads: '#E4405F',
  tiktok_ads: '#000000',
  shopee_ads: '#FB5B2D',
  tokopedia_ads: '#03AC0E',
  lazada_ads: '#0F136D',
  youtube_ads: '#FF0000',
  whatsapp_ads: '#25D366',
  organic_social: '#8B5CF6',
  other: '#6B7280',
  unknown: '#9CA3AF'
};

// ROI Distribution colors
const roiColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

// Custom label function for pie chart - optimized to prevent text cutoff
const renderCustomizedLabel = (entry: any) => {
  // Only show percentage for slices >= 5% to avoid clutter
  if (entry.percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  // Reduce radius to keep labels inside container
  const radius = entry.innerRadius + (entry.outerRadius - entry.innerRadius) * 0.8;
  const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
  const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white"
      textAnchor="middle" 
      dominantBaseline="central"
      fontSize="11"
      fontWeight="600"
      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
    >
      {`${(entry.percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ROIAnalysis() {
  const [roiData, setROIData] = useState<ROIData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesROI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter states
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [minROI, setMinROI] = useState<string>('all');

  const fetchROIData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching ROI analysis data...', {
        selectedPlatform,
        timeRange,
        isAllData: timeRange === 'all'
      });
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform);
      }
      
      // Calculate date range
      let dateStart = null;
      if (timeRange !== 'all') {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        dateStart = new Date();
        dateStart.setDate(dateStart.getDate() - days);
        params.append('date_start', dateStart.toISOString());
      }

      // Use the enhanced API with fallback system
      const paramsObject = {
        platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
        date_start: dateStart?.toISOString()
      };

      const advertisingResult = await enhancedApi.advertising.getAll(paramsObject);
      
      // For analytics, just use the same advertising data as we don't have separate analytics endpoint
      const analyticsResult = { success: true, data: {} };
      
      if (advertisingResult.success && analyticsResult.success) {
        // Check if we have any data
        const advertisingData = advertisingResult.data || [];
        if (!Array.isArray(advertisingData) || advertisingData.length === 0) {
          console.warn('⚠️ No advertising data available for ROI analysis');
          setROIData([]);
          setTimeSeriesData([]);
          setLastUpdated(new Date());
          
          toast.info(`ℹ️ Tidak ada data advertising untuk periode ${timeRange}`, {
            description: 'Silakan coba periode waktu yang berbeda atau tambahkan data advertising'
          });
          return;
        }

        // Debug first few items to understand data structure
        console.log('🔍 Sample advertising data structure:', {
          firstItem: advertisingData[0],
          totalItems: advertisingData.length,
          availableFields: advertisingData[0] ? Object.keys(advertisingData[0]) : []
        });

        // Process ROI data
        const processedROIData = processROIData(advertisingData);
        const timeSeriesROI = generateTimeSeriesROI(advertisingData);
        
        setROIData(processedROIData);
        setTimeSeriesData(timeSeriesROI);
        setLastUpdated(new Date());
        
        console.log('✅ ROI analysis data loaded:', {
          rawData: advertisingData.length,
          campaigns: processedROIData.length,
          timeSeriesPoints: timeSeriesROI.length,
          timeRange: timeRange,
          sampleTimeSeriesItem: timeSeriesROI[0] || null
        });
        
        if (processedROIData.length === 0) {
          toast.warning(`⚠️ Data advertising ditemukan tapi tidak valid`, {
            description: 'Data mungkin tidak memiliki campaign_name atau platform yang valid'
          });
        } else {
          toast.success(`✅ ROI analysis berhasil dimuat`, {
            description: `${processedROIData.length} campaigns dianalisis untuk periode ${timeRange}`
          });
        }
      } else {
        const error = advertisingResult.error || analyticsResult.error || 'Failed to fetch ROI data';
        throw new Error(error);
      }
    } catch (err) {
      console.log('ℹ️ ROI data unavailable, using fallback or empty state:', err instanceof Error ? err.message : err);
      
      // Don't set error state if we're using fallback system - just show empty state
      if (err instanceof Error && err.message.includes('backend')) {
        setROIData([]);
        setTimeSeriesData([]);
        setLastUpdated(new Date());
        // Don't show error toast for backend unavailability
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        
        toast.error('❌ Error memuat ROI data', {
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const processROIData = (rawData: any[]): ROIData[] => {
    // Filter and clean data with better validation and fallbacks
    const validData = rawData.filter(item => {
      if (!item.campaign_name) {
        console.warn('⚠️ Item missing campaign_name, skipping:', { 
          id: item.id, 
          account_name: item.account_name 
        });
        return false;
      }
      
      // Add fallback platform if missing - use account_name to infer platform
      if (!item.platform || item.platform === null || item.platform === undefined || item.platform === '') {
        // Infer platform from account_name if available
        if (item.account_name) {
          const accountName = item.account_name.toLowerCase();
          if (accountName.includes('tiktok')) {
            item.platform = 'tiktok_ads';
          } else if (accountName.includes('shopee')) {
            item.platform = 'shopee_ads';
          } else if (accountName.includes('facebook')) {
            item.platform = 'facebook_ads';
          } else if (accountName.includes('instagram')) {
            item.platform = 'instagram_ads';
          } else if (accountName.includes('google')) {
            item.platform = 'google_ads';
          } else {
            item.platform = 'other'; // Generic fallback
          }
        } else {
          item.platform = 'other'; // Generic fallback
        }
        
        // Only log once per session to reduce console noise
        if (!window.platformFallbackLogged) {
          console.log(`📝 Auto-assigning platform based on account_name. This will only be logged once.`);
          window.platformFallbackLogged = true;
        }
      }
      
      return true;
    });

    console.log(`📊 Processing ${rawData.length} items, ${validData.length} valid for ROI analysis`);

    // Group by campaign and calculate ROI metrics
    const campaignGroups = validData.reduce((acc, item) => {
      const key = `${item.campaign_name}-${item.platform}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(campaignGroups).map(([key, campaigns]) => {
      const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0);
      const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
      const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
      const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
      const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
      
      const profit = totalRevenue - totalCost;
      const roiPercentage = totalCost > 0 ? (profit / totalCost) * 100 : 0;
      const roas = totalCost > 0 ? totalRevenue / totalCost : 0;
      const cpc = totalClicks > 0 ? totalCost / totalClicks : 0;
      const cpa = totalConversions > 0 ? totalCost / totalConversions : 0;
      
      // Estimate LTV (simplified calculation)
      const avgOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;
      const ltvEstimate = avgOrderValue * 2.5; // Assume 2.5x multiplier for LTV
      
      // Calculate payback period (simplified)
      const paybackPeriod = cpa > 0 ? Math.ceil(cpa / (avgOrderValue * 0.3)) : 0; // 30% margin assumption
      
      // Efficiency rating
      let efficiencyRating: 'excellent' | 'good' | 'average' | 'poor' = 'poor';
      if (roiPercentage >= 300) efficiencyRating = 'excellent';
      else if (roiPercentage >= 200) efficiencyRating = 'good';
      else if (roiPercentage >= 100) efficiencyRating = 'average';

      return {
        campaign_name: campaigns[0].campaign_name,
        platform: campaigns[0].platform,
        total_cost: totalCost,
        total_revenue: totalRevenue,
        profit,
        roi_percentage: roiPercentage,
        roas,
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        cpc,
        cpa,
        ltv_estimate: ltvEstimate,
        payback_period: paybackPeriod,
        efficiency_rating: efficiencyRating
      };
    });
  };

  const generateTimeSeriesROI = (rawData: any[]): TimeSeriesROI[] => {
    // Filter out items with invalid dates first - check for either date_start or date_range_start
    const validData = rawData.filter(item => {
      // Try date_start first (from advertising data), then fallback to date_range_start
      const dateField = item.date_start || item.date_range_start;
      
      if (!dateField) {
        // Reduce console noise for missing dates
        if (!window.missingDateWarningLogged) {
          console.warn('⚠️ Some items missing date field (date_start or date_range_start) - this affects time series analysis');
          window.missingDateWarningLogged = true;
        }
        return false;
      }
      
      const testDate = new Date(dateField);
      if (isNaN(testDate.getTime())) {
        // Reduce console noise for invalid dates
        if (!window.invalidDateWarningLogged) {
          console.warn('⚠️ Some items have invalid date format');
          window.invalidDateWarningLogged = true;
        }
        return false;
      }
      
      return true;
    });

    console.log(`📊 Filtered ${rawData.length} items to ${validData.length} valid items for time series`);

    // If no valid data, return empty array
    if (validData.length === 0) {
      console.warn('⚠️ No valid date data for time series ROI generation');
      return [];
    }
    
    // Sort by date and calculate cumulative ROI - use the correct date field
    const sortedData = validData.sort((a, b) => {
      const dateA = new Date(a.date_start || a.date_range_start).getTime();
      const dateB = new Date(b.date_start || b.date_range_start).getTime();
      return dateA - dateB;
    });
    
    let cumulativeCost = 0;
    let cumulativeRevenue = 0;
    
    const timeSeriesMap = new Map<string, {
      cost: number;
      revenue: number;
    }>();

    // Group by date with additional validation - use correct date field
    sortedData.forEach(item => {
      try {
        const dateField = item.date_start || item.date_range_start;
        const dateObj = new Date(dateField);
        if (isNaN(dateObj.getTime())) {
          // Skip silently as we already logged this type of warning
          return;
        }
        
        const date = dateObj.toISOString().split('T')[0];
        if (!timeSeriesMap.has(date)) {
          timeSeriesMap.set(date, { cost: 0, revenue: 0 });
        }
        const existing = timeSeriesMap.get(date)!;
        existing.cost += item.cost || 0;
        existing.revenue += item.revenue || 0;
      } catch (error) {
        // Skip silently to reduce console noise
      }
    });

    // Convert to time series with additional date validation
    return Array.from(timeSeriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        cumulativeCost += data.cost;
        cumulativeRevenue += data.revenue;
        const cumulativeProfit = cumulativeRevenue - cumulativeCost;
        const dailyROI = data.cost > 0 ? ((data.revenue - data.cost) / data.cost) * 100 : 0;
        const cumulativeROI = cumulativeCost > 0 ? (cumulativeProfit / cumulativeCost) * 100 : 0;

        try {
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) {
            // Return invalid date marker silently
            return {
              date: 'Invalid Date',
              cumulative_cost: cumulativeCost,
              cumulative_revenue: cumulativeRevenue,
              cumulative_profit: cumulativeProfit,
              daily_roi: dailyROI,
              cumulative_roi: cumulativeROI
            };
          }

          return {
            date: dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            cumulative_cost: cumulativeCost,
            cumulative_revenue: cumulativeRevenue,
            cumulative_profit: cumulativeProfit,
            daily_roi: dailyROI,
            cumulative_roi: cumulativeROI
          };
        } catch (error) {
          // Return invalid date marker silently
          return {
            date: 'Invalid Date',
            cumulative_cost: cumulativeCost,
            cumulative_revenue: cumulativeRevenue,
            cumulative_profit: cumulativeProfit,
            daily_roi: dailyROI,
            cumulative_roi: cumulativeROI
          };
        }
      })
      .filter(item => item.date !== 'Invalid Date'); // Remove invalid dates from final result
  };

  useEffect(() => {
    fetchROIData();
  }, [selectedPlatform, timeRange]);

  // Filter data based on minimum ROI
  const filteredROIData = useMemo(() => {
    let filtered = roiData;
    
    if (minROI !== 'all') {
      const minROIValue = parseInt(minROI);
      filtered = filtered.filter(item => item.roi_percentage >= minROIValue);
    }
    
    return filtered.sort((a, b) => b.roi_percentage - a.roi_percentage);
  }, [roiData, minROI]);

  // Calculate platform breakdown
  const platformBreakdown = useMemo((): ROIBreakdown[] => {
    const platformGroups = filteredROIData.reduce((acc, item) => {
      if (!acc[item.platform]) {
        acc[item.platform] = [];
      }
      acc[item.platform].push(item);
      return acc;
    }, {} as Record<string, ROIData[]>);

    return Object.entries(platformGroups).map(([platform, campaigns]) => {
      const totalInvestment = campaigns.reduce((sum, c) => sum + c.total_cost, 0);
      const totalReturn = campaigns.reduce((sum, c) => sum + c.total_revenue, 0);
      const netProfit = totalReturn - totalInvestment;
      const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
      const avgRoas = campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length;
      
      const sortedByROI = campaigns.sort((a, b) => b.roi_percentage - a.roi_percentage);
      
      return {
        platform,
        campaigns: campaigns.length,
        total_investment: totalInvestment,
        total_return: totalReturn,
        net_profit: netProfit,
        roi_percentage: roiPercentage,
        avg_roas: avgRoas,
        best_campaign: sortedByROI[0]?.campaign_name || 'N/A',
        worst_campaign: sortedByROI[sortedByROI.length - 1]?.campaign_name || 'N/A'
      };
    }).sort((a, b) => b.roi_percentage - a.roi_percentage);
  }, [filteredROIData]);

  // Overall ROI summary
  const overallSummary = useMemo(() => {
    const totalInvestment = filteredROIData.reduce((sum, item) => sum + item.total_cost, 0);
    const totalReturn = filteredROIData.reduce((sum, item) => sum + item.total_revenue, 0);
    const totalProfit = totalReturn - totalInvestment;
    const overallROI = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    const avgROAS = filteredROIData.length > 0 ? 
      filteredROIData.reduce((sum, item) => sum + item.roas, 0) / filteredROIData.length : 0;
    
    const profitableCampaigns = filteredROIData.filter(item => item.roi_percentage > 0).length;
    const excellentCampaigns = filteredROIData.filter(item => item.efficiency_rating === 'excellent').length;

    return {
      totalInvestment,
      totalReturn,
      totalProfit,
      overallROI,
      avgROAS,
      profitableCampaigns,
      excellentCampaigns,
      totalCampaigns: filteredROIData.length
    };
  }, [filteredROIData]);

  // ROI distribution data for pie chart with better label positioning
  const roiDistributionData = useMemo(() => {
    const excellent = filteredROIData.filter(item => item.roi_percentage >= 300).length;
    const good = filteredROIData.filter(item => item.roi_percentage >= 200 && item.roi_percentage < 300).length;
    const poor = filteredROIData.filter(item => item.roi_percentage >= 0 && item.roi_percentage < 100).length;
    const negative = filteredROIData.filter(item => item.roi_percentage < 0).length;
    
    const total = filteredROIData.length;
    
    if (total === 0) return [];
    
    const data = [
      { name: 'Excellent (≥300%)', value: excellent, percentage: ((excellent / total) * 100) },
      { name: 'Good (200-299%)', value: good, percentage: ((good / total) * 100) },
      { name: 'Poor (0-99%)', value: poor, percentage: ((poor / total) * 100) },
      { name: 'Negative (<0%)', value: negative, percentage: ((negative / total) * 100) }
    ];
    
    // Filter out zero values to avoid cluttered chart
    return data.filter(item => item.value > 0);
  }, [filteredROIData]);

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
                    : entry.dataKey.includes('roi') || entry.dataKey.includes('percentage')
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
            <Calculator className="w-5 h-5 animate-pulse" />
            ROI Analysis
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
            ROI Analysis - Connection Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="font-semibold text-red-800 mb-2">
              Gagal Memuat ROI Data
            </h3>
            <p className="text-red-700 mb-4 max-w-md mx-auto">{error}</p>
            <Button onClick={fetchROIData} variant="outline">
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">ROI Analysis</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Period Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7d')}
              disabled={loading}
            >
              7 Hari
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30d')}
              disabled={loading}
            >
              30 Hari
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('90d')}
              disabled={loading}
            >
              90 Hari
            </Button>
            <Button
              variant={timeRange === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('all')}
              disabled={loading}
            >
              All Data
            </Button>
            <Button onClick={fetchROIData} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
                <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                <SelectItem value="instagram_ads">Instagram Ads</SelectItem>
                <SelectItem value="tiktok_ads">TikTok Ads</SelectItem>
                <SelectItem value="shopee_ads">Shopee Ads</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={minROI} onValueChange={setMinROI}>
              <SelectTrigger>
                <SelectValue placeholder="Minimum ROI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ROI</SelectItem>
                <SelectItem value="0">ROI ≥ 0%</SelectItem>
                <SelectItem value="100">ROI ≥ 100%</SelectItem>
                <SelectItem value="200">ROI ≥ 200%</SelectItem>
                <SelectItem value="300">ROI ≥ 300%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ROI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 text-white rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Investment</p>
                <p className="text-lg font-bold text-green-900">
                  {formatCurrency(overallSummary.totalInvestment)}
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
                <p className="text-sm text-blue-700">Total Return</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatCurrency(overallSummary.totalReturn)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 text-white rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Net Profit</p>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(overallSummary.totalProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 text-white rounded-lg">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-orange-700">Overall ROI</p>
                <p className="text-lg font-bold text-orange-900">
                  {formatPercentage(overallSummary.overallROI)}
                </p>
                <p className="text-xs text-orange-600">
                  ROAS: {overallSummary.avgROAS.toFixed(1)}x
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI Distribution Pie Chart with Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  ROI Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={roiDistributionData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {roiDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={roiColors[index % roiColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: any) => [
                          `${value} campaigns (${((value / filteredROIData.length) * 100).toFixed(1)}%)`,
                          name
                        ]}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{
                          paddingTop: '10px',
                          fontSize: '12px'
                        }}
                        formatter={(value: string) => {
                          // Shorten legend text to prevent overflow
                          if (value.includes('Excellent')) return 'Excellent (≥300%)';
                          if (value.includes('Good')) return 'Good (200-299%)';
                          if (value.includes('Poor')) return 'Poor (0-99%)';
                          if (value.includes('Negative')) return 'Negative (<0%)';
                          return value;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">
                        {overallSummary.profitableCampaigns}
                      </p>
                      <p className="text-sm text-green-700">Profitable Campaigns</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">
                        {overallSummary.excellentCampaigns}
                      </p>
                      <p className="text-sm text-blue-700">Excellent ROI</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">
                        {overallSummary.totalCampaigns}
                      </p>
                      <p className="text-sm text-purple-700">Total Campaigns</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-3xl font-bold text-orange-600">
                        {overallSummary.avgROAS.toFixed(1)}x
                      </p>
                      <p className="text-sm text-orange-700">Average ROAS</p>
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Key Insights</h4>
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{Math.round((overallSummary.profitableCampaigns / overallSummary.totalCampaigns) * 100)}% campaigns are profitable</span>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span>Best performing platform: {platformBreakdown[0]?.platform || 'other'}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span>Average payback period: 2 days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* ROI Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>ROI Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative_roi" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Cumulative ROI (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="daily_roi" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Daily ROI (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          {/* Platform Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformBreakdown.map((platform, index) => (
                  <div key={platform.platform} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold capitalize">{platform.platform.replace('_', ' ')}</h4>
                      <Badge className={getROIBadgeColor(platform.roi_percentage)}>
                        {formatPercentage(platform.roi_percentage)} ROI
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Campaigns</p>
                        <p className="font-semibold">{platform.campaigns}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Investment</p>
                        <p className="font-semibold">{formatCurrency(platform.total_investment)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Return</p>
                        <p className="font-semibold">{formatCurrency(platform.total_return)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg ROAS</p>
                        <p className="font-semibold">{platform.avg_roas.toFixed(1)}x</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Top Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredROIData.slice(0, 10).map((campaign, index) => (
                  <div key={campaign.campaign_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{campaign.campaign_name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{campaign.platform.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getROIBadgeColor(campaign.roi_percentage)}>
                        {formatPercentage(campaign.roi_percentage)} ROI
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(campaign.profit)} profit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}