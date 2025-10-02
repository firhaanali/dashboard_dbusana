import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp, TrendingDown, Users, Target, BarChart3, Calculator, Coins, Percent, Package, Star, ArrowUpRight, ArrowDownRight, Play, Pause } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Skeleton } from './ui/skeleton';

interface CampaignSummary {
  totalSpent: number;
  totalSales: number;
  totalCommission: number;
  totalNetAmount: number;
  totalHPP: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  averageROI: number;
  activeEndorsers: number;
  completedCampaigns: number;
}

interface AffiliateKPICardData {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  subtitle?: string;
  color?: string;
  tooltip?: string;
  badge?: string;
  category: 'financial' | 'performance' | 'endorsers' | 'profitability';
  priority: number;
}

interface AffiliateEndorseKPICarouselProps {
  campaignSummary: CampaignSummary;
  loading?: boolean;
}

const KPI_CATEGORIES = [
  { id: 'financial', name: 'Keuangan', color: 'bg-green-50 border-green-200' },
  { id: 'performance', name: 'Performa', color: 'bg-blue-50 border-blue-200' },
  { id: 'endorsers', name: 'Endorser', color: 'bg-purple-50 border-purple-200' },
  { id: 'profitability', name: 'Profitabilitas', color: 'bg-orange-50 border-orange-200' }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatPercentage = (num: number) => {
  return num.toFixed(1) + '%';
};

function AffiliateKPICard({ data, loading }: { data: AffiliateKPICardData; loading?: boolean }) {
  const getChangeColor = () => {
    switch (data.changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    if (data.changeType === 'positive') return <TrendingUp className="h-3 w-3" />;
    if (data.changeType === 'negative') return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  const cardContent = (
    <Card className="h-full interactive-hover transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <data.icon className={`h-5 w-5 ${data.color}`} />
              <p className="text-sm font-medium text-muted-foreground">{data.title}</p>
            </div>
            
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{data.value}</p>
                {data.subtitle && (
                  <p className="text-xs text-muted-foreground">{data.subtitle}</p>
                )}
              </div>
            )}
            
            {!loading && data.change && (
              <div className={`flex items-center gap-1 text-xs ${getChangeColor()}`}>
                {getTrendIcon()}
                <span>{data.change}</span>
              </div>
            )}
          </div>
          
          {data.badge && (
            <div className="text-right">
              <Badge variant="secondary" className="text-xs">
                {data.badge}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (data.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="w-full">
            {cardContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{data.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}

export function AffiliateEndorseKPICarousel({ campaignSummary, loading = false }: AffiliateEndorseKPICarouselProps) {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoSliding) return;
    
    const timer = setInterval(() => {
      setCurrentCategory((prev) => (prev + 1) % KPI_CATEGORIES.length);
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(timer);
  }, [isAutoSliding]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === ' ') {
        event.preventDefault();
        setIsAutoSliding(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Pause auto-slide on hover
  const handleMouseEnter = () => setIsAutoSliding(false);
  const handleMouseLeave = () => setIsAutoSliding(true);

  const goToPrevious = () => {
    setIsAutoSliding(false);
    setCurrentCategory((prev) => (prev - 1 + KPI_CATEGORIES.length) % KPI_CATEGORIES.length);
  };

  const goToNext = () => {
    setIsAutoSliding(false);
    setCurrentCategory((prev) => (prev + 1) % KPI_CATEGORIES.length);
  };

  // Calculate ROI status and profit margin
  const roiStatus = campaignSummary.averageROI > 200 ? 'positive' : campaignSummary.averageROI > 100 ? 'neutral' : 'negative';
  const profitMargin = campaignSummary.totalSales > 0 ? (campaignSummary.totalNetProfit / campaignSummary.totalSales) * 100 : 0;
  const profitMarginStatus = profitMargin > 20 ? 'positive' : profitMargin > 10 ? 'neutral' : 'negative';

  const createKPIData = (): AffiliateKPICardData[] => [
    // Financial Category
    {
      id: 'total-spent',
      title: 'Total Biaya Endorse',
      value: formatCurrency(campaignSummary.totalSpent),
      changeType: 'neutral',
      icon: DollarSign,
      color: 'text-green-600',
      category: 'financial',
      priority: 1,
      tooltip: 'Total pengeluaran untuk biaya endorsement',
      subtitle: 'Investasi endorsement'
    },
    {
      id: 'total-sales',
      title: 'Total Penjualan',
      value: formatCurrency(campaignSummary.totalSales),
      changeType: campaignSummary.totalSales > campaignSummary.totalSpent ? 'positive' : 'negative',
      icon: TrendingUp,
      color: 'text-green-600',
      category: 'financial',
      priority: 2,
      tooltip: 'Total penjualan yang dihasilkan dari campaign endorsement'
    },
    {
      id: 'net-profit',
      title: 'Net Profit',
      value: formatCurrency(campaignSummary.totalNetProfit),
      changeType: campaignSummary.totalNetProfit > 0 ? 'positive' : 'negative',
      icon: Calculator,
      color: 'text-green-600',
      category: 'financial',
      priority: 3,
      tooltip: 'Keuntungan bersih setelah dikurangi HPP, komisi, dan biaya endorse'
    },

    // Performance Category
    {
      id: 'average-roi',
      title: 'Rata-rata ROI',
      value: formatPercentage(campaignSummary.averageROI),
      changeType: roiStatus,
      change: campaignSummary.averageROI > 100 ? 'ROI positif' : 'Perlu optimasi',
      icon: Target,
      color: 'text-blue-600',
      category: 'performance',
      priority: 1,
      tooltip: 'Return on Investment rata-rata dari semua campaign'
    },
    {
      id: 'profit-margin',
      title: 'Profit Margin',
      value: formatPercentage(profitMargin),
      changeType: profitMarginStatus,
      icon: BarChart3,
      color: 'text-blue-600',
      category: 'performance',
      priority: 2,
      tooltip: 'Persentase keuntungan bersih terhadap total penjualan'
    },
    {
      id: 'commission-total',
      title: 'Total Komisi',
      value: formatCurrency(campaignSummary.totalCommission),
      changeType: 'neutral',
      icon: Coins,
      color: 'text-blue-600',
      category: 'performance',
      priority: 3,
      tooltip: 'Total komisi yang dibayarkan kepada endorser'
    },

    // Endorsers Category
    {
      id: 'active-endorsers',
      title: 'Endorser Aktif',
      value: formatNumber(campaignSummary.activeEndorsers),
      changeType: campaignSummary.activeEndorsers > 0 ? 'positive' : 'neutral',
      icon: Users,
      color: 'text-purple-600',
      category: 'endorsers',
      priority: 1,
      tooltip: 'Jumlah endorser yang sedang menjalankan campaign',
      badge: `${campaignSummary.completedCampaigns} selesai`
    },
    {
      id: 'completed-campaigns',
      title: 'Campaign Selesai',
      value: formatNumber(campaignSummary.completedCampaigns),
      changeType: campaignSummary.completedCampaigns > 0 ? 'positive' : 'neutral',
      icon: Star,
      color: 'text-purple-600',
      category: 'endorsers',
      priority: 2,
      tooltip: 'Jumlah campaign yang telah selesai dilaksanakan'
    },
    {
      id: 'avg-campaign-value',
      title: 'Rata-rata Nilai Campaign',
      value: formatCurrency(campaignSummary.activeEndorsers > 0 ? campaignSummary.totalSpent / (campaignSummary.activeEndorsers + campaignSummary.completedCampaigns) : 0),
      changeType: 'neutral',
      icon: Package,
      color: 'text-purple-600',
      category: 'endorsers',
      priority: 3,
      tooltip: 'Rata-rata nilai investasi per campaign endorsement'
    },

    // Profitability Category
    {
      id: 'gross-profit',
      title: 'Gross Profit',
      value: formatCurrency(campaignSummary.totalGrossProfit),
      changeType: campaignSummary.totalGrossProfit > 0 ? 'positive' : 'negative',
      icon: TrendingUp,
      color: 'text-orange-600',
      category: 'profitability',
      priority: 1,
      tooltip: 'Keuntungan kotor (Total Penjualan - HPP)',
      subtitle: 'Sebelum komisi & biaya'
    },
    {
      id: 'total-hpp',
      title: 'Total HPP',
      value: formatCurrency(campaignSummary.totalHPP),
      changeType: 'neutral',
      icon: Calculator,
      color: 'text-orange-600',
      category: 'profitability',
      priority: 2,
      tooltip: 'Total Harga Pokok Penjualan dari semua produk yang terjual'
    },
    {
      id: 'net-amount',
      title: 'Net Amount',
      value: formatCurrency(campaignSummary.totalNetAmount),
      changeType: campaignSummary.totalNetAmount > 0 ? 'positive' : 'negative',
      icon: Coins,
      color: 'text-orange-600',
      category: 'profitability',
      priority: 3,
      tooltip: 'Jumlah bersih yang diterima setelah dikurangi komisi'
    }
  ];

  const getCurrentCategoryData = () => {
    const categoryId = KPI_CATEGORIES[currentCategory].id;
    const kpiData = createKPIData();
    return kpiData
      .filter(kpi => kpi.category === categoryId)
      .sort((a, b) => a.priority - b.priority);
  };

  const currentCategoryData = getCurrentCategoryData();
  const currentCategoryInfo = KPI_CATEGORIES[currentCategory];

  return (
    <div className="space-y-4" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Category Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className={`px-4 py-2 rounded-lg border ${currentCategoryInfo.color}`}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{currentCategoryInfo.name}</h3>
              <span className="text-xs text-muted-foreground">
                {currentCategory + 1}/{KPI_CATEGORIES.length}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Auto-slide Control & Category Indicators */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoSliding(!isAutoSliding)}
            className="h-8 w-8 p-0"
            title={isAutoSliding ? 'Pause auto-slide' : 'Resume auto-slide'}
          >
            {isAutoSliding ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          
          <div className="flex gap-2">
            {KPI_CATEGORIES.map((category, index) => (
              <button
                key={category.id}
                onClick={() => {
                  setCurrentCategory(index);
                  setIsAutoSliding(false);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentCategory 
                    ? 'bg-accent-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                title={category.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid with Animation */}
      <div className="relative overflow-hidden">
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 ease-in-out"
          key={currentCategory}
        >
          {currentCategoryData.length > 0 ? (
            currentCategoryData.map((kpi, index) => (
              <div
                key={kpi.id}
                className="animate-in slide-in-from-right duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <AffiliateKPICard
                  data={kpi}
                  loading={loading}
                />
              </div>
            ))
          ) : (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-in slide-in-from-right duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auto-slide Progress Bar & Help Text */}
      <div className="space-y-2">
        <div className="w-full bg-muted rounded-full h-1">
          <div 
            className="bg-accent-primary h-1 rounded-full transition-all duration-100 ease-linear"
            style={{
              width: `${((currentCategory + 1) / KPI_CATEGORIES.length) * 100}%`
            }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Keyboard: ← → untuk navigasi</span>
            <span>Spacebar untuk pause/resume</span>
          </div>
          <div className="flex items-center gap-2">
            {isAutoSliding && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <span>Auto-slide aktif</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}