import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
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
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  AlertTriangle,
  Info,
  Lightbulb,
  GitCompare,
  TrendingUpIcon
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';
import { makeApiRequest, withRetry, ApiResponse } from '../utils/apiUtils';

interface CampaignData {
  id: string;
  campaign_name: string;
  campaign_type: string;
  platform: string;
  ad_group_name?: string;
  keyword?: string;
  ad_creative?: string;
  date_range_start: string;
  date_range_end: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  cpc?: number;
  cpm?: number;
  cpa?: number;
  ctr?: number;
  conversion_rate?: number;
  roas?: number;
  marketplace?: string;
  created_at: string;
  updated_at: string;
}

interface CampaignPerformance {
  campaign_name: string;
  platform: string;
  _sum: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    revenue: number;
  };
  _avg: {
    ctr: number;
    conversion_rate: number;
    roas: number;
  };
  profit: number;
  roi_percentage: number;
  efficiency_score: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

interface CampaignInsight {
  type: 'success' | 'warning' | 'info' | 'danger';
  campaign: string;
  title: string;
  description: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
    case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'average': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'poor': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getPlatformColor = (platform: string) => {
  const colors = {
    google_ads: '#4285F4',
    facebook_ads: '#1877F2',
    instagram_ads: '#E4405F',
    tiktok_ads: '#000000',
    shopee_ads: '#FB5B2D',
    tokopedia_ads: '#03AC0E',
    lazada_ads: '#0F136D',
    youtube_ads: '#FF0000',
    linkedin_ads: '#0077B5',
    twitter_ads: '#1DA1F2',
    other: '#6B7280'
  };
  return colors[platform as keyof typeof colors] || colors.other;
};

export function CampaignAnalytics() {
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter states
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCampaignType, setSelectedCampaignType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'cost' | 'roas' | 'conversions'>('revenue');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  // View states
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching campaign analytics data...');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform);
      }
      if (dateRange.from) {
        params.append('date_start', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.append('date_end', dateRange.to.toISOString());
      }

      // Use centralized API utility with retry logic
      const result = await withRetry(() => 
        makeApiRequest<any[]>(`/advertising?${params}`)
      );
      
      if (result.success && result.data) {
        setCampaignData(result.data);
        setLastUpdated(new Date());
        
        console.log('✅ Campaign analytics data loaded:', {
          totalCampaigns: result.data.length
        });
        
        toast.success(`✅ Campaign analytics berhasil dimuat`, {
          description: `${result.data.length} campaigns dari database PostgreSQL`
        });
      } else {
        throw new Error(result.error || 'Failed to fetch campaign data');
      }
    } catch (err) {
      console.error('❌ Error fetching campaign data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      toast.error('❌ Error memuat campaign data', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [selectedPlatform, dateRange]);

  // Process campaign performance data
  const campaignPerformance = useMemo((): CampaignPerformance[] => {
    if (!campaignData || campaignData.length === 0) return [];

    // Group by campaign name and platform
    const campaignGroups = campaignData.reduce((acc, campaign) => {
      const key = `${campaign.campaign_name}-${campaign.platform}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(campaign);
      return acc;
    }, {} as Record<string, CampaignData[]>);

    return Object.entries(campaignGroups).map(([key, campaigns]) => {
      const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
      const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
      const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
      const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0);
      const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
      
      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const roas = totalCost > 0 ? totalRevenue / totalCost : 0;
      const profit = totalRevenue - totalCost;
      const roiPercentage = totalCost > 0 ? (profit / totalCost) * 100 : 0;
      
      // Calculate efficiency score (composite metric)
      const efficiencyScore = (
        Math.min(avgCTR / 5, 1) * 0.25 + // CTR weight
        Math.min(avgConversionRate / 10, 1) * 0.25 + // Conversion rate weight
        Math.min(roas / 5, 1) * 0.5 // ROAS weight (most important)
      ) * 100;
      
      let status: 'excellent' | 'good' | 'average' | 'poor' = 'poor';
      if (efficiencyScore >= 80) status = 'excellent';
      else if (efficiencyScore >= 60) status = 'good';
      else if (efficiencyScore >= 40) status = 'average';

      return {
        campaign_name: campaigns[0].campaign_name,
        platform: campaigns[0].platform,
        _sum: {
          impressions: totalImpressions,
          clicks: totalClicks,
          conversions: totalConversions,
          cost: totalCost,
          revenue: totalRevenue
        },
        _avg: {
          ctr: avgCTR,
          conversion_rate: avgConversionRate,
          roas: roas
        },
        profit,
        roi_percentage: roiPercentage,
        efficiency_score: efficiencyScore,
        status
      };
    });
  }, [campaignData]);

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = campaignPerformance;

    // Filter by campaign type
    if (selectedCampaignType !== 'all') {
      const campaignTypeMap = campaignData.reduce((acc, c) => {
        acc[c.campaign_name] = c.campaign_type;
        return acc;
      }, {} as Record<string, string>);
      
      filtered = filtered.filter(c => campaignTypeMap[c.campaign_name] === selectedCampaignType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.platform.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort campaigns
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b._sum.revenue - a._sum.revenue;
        case 'cost':
          return b._sum.cost - a._sum.cost;
        case 'roas':
          return b._avg.roas - a._avg.roas;
        case 'conversions':
          return b._sum.conversions - a._sum.conversions;
        default:
          return b._sum.revenue - a._sum.revenue;
      }
    });

    return filtered;
  }, [campaignPerformance, selectedCampaignType, searchQuery, sortBy, campaignData]);

  // Generate campaign insights
  const campaignInsights = useMemo((): CampaignInsight[] => {
    const insights: CampaignInsight[] = [];

    filteredCampaigns.forEach(campaign => {
      // High ROAS campaigns
      if (campaign._avg.roas > 5) {
        insights.push({
          type: 'success',
          campaign: campaign.campaign_name,
          title: 'Excellent ROAS Performance',
          description: `ROAS of ${campaign._avg.roas.toFixed(2)}x is significantly above industry average`,
          suggestion: 'Consider increasing budget allocation for this high-performing campaign',
          impact: 'high'
        });
      }

      // Low ROAS warnings
      if (campaign._avg.roas < 2 && campaign._sum.cost > 500000) {
        insights.push({
          type: 'warning',
          campaign: campaign.campaign_name,
          title: 'Low ROAS Alert',
          description: `ROAS of ${campaign._avg.roas.toFixed(2)}x is below recommended threshold`,
          suggestion: 'Review targeting, creative, or consider pausing to optimize',
          impact: 'high'
        });
      }

      // High CTR, low conversion rate
      if (campaign._avg.ctr > 3 && campaign._avg.conversion_rate < 2) {
        insights.push({
          type: 'info',
          campaign: campaign.campaign_name,
          title: 'Traffic Quality Opportunity',
          description: 'Good CTR but low conversion rate suggests targeting or landing page issues',
          suggestion: 'Optimize landing page experience or refine audience targeting',
          impact: 'medium'
        });
      }

      // High cost, low performance
      if (campaign._sum.cost > 1000000 && campaign.efficiency_score < 40) {
        insights.push({
          type: 'danger',
          campaign: campaign.campaign_name,
          title: 'High Spend, Low Performance',
          description: 'Significant budget spent with poor efficiency metrics',
          suggestion: 'Consider pausing or major optimization needed',
          impact: 'high'
        });
      }
    });

    return insights.slice(0, 10); // Limit to top 10 insights
  }, [filteredCampaigns]);

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

  const handleCampaignSelect = (campaignName: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignName) 
        ? prev.filter(c => c !== campaignName)
        : [...prev, campaignName]
    );
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
            <Target className="w-5 h-5 animate-pulse" />
            Campaign Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
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
            Campaign Analytics - Connection Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="font-semibold text-red-800 mb-2">
              Gagal Memuat Campaign Data
            </h3>
            <p className="text-red-700 mb-4 max-w-md mx-auto">{error}</p>
            <Button onClick={fetchCampaignData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!campaignData || campaignData.length === 0) {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Target className="w-5 h-5" />
            Campaign Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="w-20 h-20 mx-auto mb-6 text-amber-300" />
            <h3 className="text-xl font-semibold text-amber-800 mb-3">
              Belum Ada Data Campaign
            </h3>
            <p className="text-amber-700 mb-6 max-w-md mx-auto">
              Koneksi ke database berhasil, tetapi belum ada data campaign.
              Import data advertising untuk mulai analisis campaign.
            </p>
            <Button onClick={fetchCampaignData} className="bg-amber-600 hover:bg-amber-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Periksa Ulang
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
          <h2 className="text-xl font-semibold text-gray-900">Campaign Analytics</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">
              Analisis mendalam dari {filteredCampaigns.length} campaigns ({formatDateRange()})
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
          <Button onClick={fetchCampaignData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Platform Filter */}
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
                <SelectItem value="tokopedia_ads">Tokopedia Ads</SelectItem>
              </SelectContent>
            </Select>

            {/* Campaign Type Filter */}
            <Select value={selectedCampaignType} onValueChange={setSelectedCampaignType}>
              <SelectTrigger>
                <SelectValue placeholder="Campaign Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="search">Search</SelectItem>
                <SelectItem value="display">Display</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="roas">ROAS</SelectItem>
                <SelectItem value="conversions">Conversions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Performing Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCampaigns.slice(0, 6).map((campaign, index) => (
              <Card key={`${campaign.campaign_name}-${campaign.platform}`} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCampaignSelect(campaign.campaign_name)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {campaign.campaign_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {campaign.platform.replace('_', ' ')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-semibold text-green-700">
                        {formatCurrency(campaign._sum.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Cost</p>
                      <p className="font-semibold text-orange-700">
                        {formatCurrency(campaign._sum.cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">ROAS</p>
                      <p className="font-semibold text-blue-700">
                        {campaign._avg.roas.toFixed(2)}x
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">ROI</p>
                      <p className={`font-semibold ${campaign.roi_percentage > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatPercentage(campaign.roi_percentage)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Efficiency Score</span>
                      <span className="font-semibold">{campaign.efficiency_score.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          campaign.efficiency_score >= 80 ? 'bg-green-500' :
                          campaign.efficiency_score >= 60 ? 'bg-blue-500' :
                          campaign.efficiency_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(campaign.efficiency_score, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Campaign Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredCampaigns.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="campaign_name" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="_sum.revenue" fill="#10b981" name="Revenue" />
                    <Bar dataKey="_sum.cost" fill="#f59e0b" name="Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ROAS vs Efficiency Scatter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                ROAS vs Efficiency Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={filteredCampaigns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_avg.roas" 
                      name="ROAS"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      dataKey="efficiency_score" 
                      name="Efficiency Score"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'ROAS' ? `${value}x` : `${value}%`,
                        name
                      ]}
                      labelFormatter={(value) => `Campaign: ${value}`}
                    />
                    <Scatter 
                      name="Campaigns" 
                      dataKey="efficiency_score"
                      fill="#8b5cf6"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Campaign Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaignInsights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'success' ? 'bg-green-50 border-green-400' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    insight.type === 'info' ? 'bg-blue-50 border-blue-400' :
                    'bg-red-50 border-red-400'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {insight.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {insight.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                        {insight.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
                        {insight.type === 'danger' && <AlertCircle className="w-5 h-5 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{insight.campaign}</p>
                        <p className="text-sm text-gray-800 mb-2">{insight.description}</p>
                        <p className="text-sm font-medium text-purple-700">{insight.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Excellent Campaigns</span>
                    </div>
                    <span className="font-semibold text-green-700">
                      {filteredCampaigns.filter(c => c.status === 'excellent').length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Good Campaigns</span>
                    </div>
                    <span className="font-semibold text-blue-700">
                      {filteredCampaigns.filter(c => c.status === 'good').length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Needs Optimization</span>
                    </div>
                    <span className="font-semibold text-yellow-700">
                      {filteredCampaigns.filter(c => c.status === 'average' || c.status === 'poor').length}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Top Recommendations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-green-700">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Scale top-performing campaigns</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700">
                      <Target className="w-4 h-4" />
                      <span>Optimize targeting for average performers</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Review underperforming campaigns</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="w-5 h-5" />
                Campaign Comparison
              </CardTitle>
              <p className="text-sm text-gray-600">
                Select campaigns to compare their performance side by side
              </p>
            </CardHeader>
            <CardContent>
              {selectedCampaigns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GitCompare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Click on campaign cards in the Overview tab to select campaigns for comparison</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Campaigns */}
                  <div className="flex flex-wrap gap-2">
                    {selectedCampaigns.map(campaignName => (
                      <Badge 
                        key={campaignName} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-red-50"
                        onClick={() => handleCampaignSelect(campaignName)}
                      >
                        {campaignName} ×
                      </Badge>
                    ))}
                  </div>

                  {/* Comparison Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={filteredCampaigns.filter(c => selectedCampaigns.includes(c.campaign_name)).map(c => ({
                        campaign: c.campaign_name.substring(0, 20) + '...',
                        ROAS: Math.min(c._avg.roas * 20, 100),
                        CTR: Math.min(c._avg.ctr * 20, 100),
                        'Conv Rate': Math.min(c._avg.conversion_rate * 10, 100),
                        Efficiency: c.efficiency_score
                      }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="campaign" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        {selectedCampaigns.map((_, index) => (
                          <Radar
                            key={index}
                            name={`Campaign ${index + 1}`}
                            dataKey="ROAS"
                            stroke={getPlatformColor(filteredCampaigns.find(c => selectedCampaigns.includes(c.campaign_name))?.platform || 'other')}
                            fill={getPlatformColor(filteredCampaigns.find(c => selectedCampaigns.includes(c.campaign_name))?.platform || 'other')}
                            fillOpacity={0.1}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}