import React, { useState, useEffect } from 'react';
import { Store, TrendingUp, TrendingDown, ShoppingBag, BarChart3, Target, Crown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { useMarketplaceAnalyticsShared } from '../hooks/useMarketplaceAnalyticsShared';

interface MarketplaceMetric {
  marketplace: string;
  totalSales: number;
  distinctOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  totalHPP: number;
  totalProfit: number;
  profitMargin: number;
  avgOrderValue: number;
  percentage: number;
}

interface MarketplaceAnalyticsData {
  marketplaces: MarketplaceMetric[];
  summary: {
    totalMarketplaces: number;
    totalRevenue: number;
    topMarketplace: string;
    topMarketplaceRevenue: number;
  };
}

interface MarketplaceKPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color?: string;
  badge?: string;
  badgeColor?: string;
  loading?: boolean;
}

function MarketplaceKPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'text-blue-600',
  badge,
  badgeColor = 'bg-blue-100 text-blue-800',
  loading 
}: MarketplaceKPICardProps) {
  if (loading) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-10 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 dark:border-l-blue-400 h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 flex-shrink-0">
        <div className="flex-1 min-w-0 pr-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
            {title}
          </CardTitle>
          {badge && (
            <Badge className={`text-xs px-2 py-1 mt-1 font-semibold ${badgeColor} border border-current/20 inline-block`}>
              {badge}
            </Badge>
          )}
        </div>
        <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
      </CardHeader>
      <CardContent className="pb-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="text-3xl font-bold text-foreground break-words leading-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground break-words leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketplaceKPICards() {
  const { data: marketplaceData, loading, error } = useMarketplaceAnalyticsShared('MarketplaceKPICards');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(1)}K`;
    } else {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getMarketplaceIcon = (marketplace: string) => {
    const icons = {
      'TikTok Shop': '🎵',
      'Shopee': '🛒',
      'Tokopedia': '🏪',
      'Lazada': '📦',
      'Blibli': '💎',
      'Bukalapak': '📱'
    };
    return icons[marketplace as keyof typeof icons] || '🏬';
  };

  const getShortMarketplaceName = (marketplace: string) => {
    const shortNames = {
      'TikTok Shop': 'TikTok Shop',
      'Shopee': 'Shopee',
      'Tokopedia': 'Tokopedia',
      'Lazada': 'Lazada',
      'Blibli': 'Blibli',
      'Bukalapak': 'Bukalapak'
    };
    return shortNames[marketplace as keyof typeof shortNames] || marketplace;
  };

  // Calculate metrics for KPI cards
  const getMarketplaceKPIs = () => {
    if (!marketplaceData || marketplaceData.marketplaces.length === 0) {
      return {
        totalMarketplaces: 0,
        totalRevenue: 0,
        topMarketplace: 'Belum ada data',
        topMarketplaceRevenue: 0,
        totalOrders: 0,
        totalQuantity: 0,
        avgProfitMargin: 0,
        avgOrderValue: 0,
        bestPerformingMarketplace: 'Belum ada data'
      };
    }

    const { marketplaces, summary } = marketplaceData;
    
    // Calculate totals across all marketplaces
    const totalOrders = marketplaces.reduce((sum, mp) => sum + mp.distinctOrders, 0);
    const totalQuantity = marketplaces.reduce((sum, mp) => sum + mp.totalQuantity, 0);
    const totalProfit = marketplaces.reduce((sum, mp) => sum + mp.totalProfit, 0);
    const avgProfitMargin = summary.totalRevenue > 0 ? (totalProfit / summary.totalRevenue) * 100 : 0;
    
    // Calculate average AOV across marketplaces
    const totalAOV = marketplaces.reduce((sum, mp) => sum + mp.avgOrderValue, 0);
    const avgOrderValue = marketplaces.length > 0 ? totalAOV / marketplaces.length : 0;
    
    // Find best performing marketplace by profit margin
    const bestPerformingMarketplace = marketplaces.reduce((best, current) => 
      current.profitMargin > best.profitMargin ? current : best
    , marketplaces[0]);

    return {
      totalMarketplaces: summary.totalMarketplaces,
      totalRevenue: summary.totalRevenue,
      topMarketplace: summary.topMarketplace,
      topMarketplaceRevenue: summary.topMarketplaceRevenue,
      totalOrders,
      totalQuantity,
      avgProfitMargin,
      avgOrderValue,
      bestPerformingMarketplace: bestPerformingMarketplace?.marketplace || 'Belum ada data'
    };
  };

  const kpis = getMarketplaceKPIs();
  const hasData = marketplaceData && marketplaceData.marketplaces.length > 0;

  if (error) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Store className="w-5 h-5" />
              Marketplace Overview
            </h3>
          </div>
        </div>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Failed to load marketplace data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const marketplaceKPIs = [
    {
      title: 'Total Marketplace',
      value: hasData ? kpis.totalMarketplaces.toString() : '0',
      icon: Store,
      color: 'text-blue-600 dark:text-blue-400',
      badge: hasData ? 'Active' : 'Empty',
      badgeColor: hasData ? 'bg-blue-100 text-blue-900 dark:bg-blue-200/90 dark:text-blue-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-200/90 dark:text-gray-800'
    },
    {
      title: 'Top Marketplace',
      value: hasData ? `${getMarketplaceIcon(kpis.topMarketplace)} ${getShortMarketplaceName(kpis.topMarketplace)}` : '🏬 None',
      icon: Crown,
      color: 'text-yellow-600 dark:text-yellow-400',
      badge: hasData ? 'Leader' : 'N/A',
      badgeColor: hasData ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-200/90 dark:text-yellow-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-200/90 dark:text-gray-800'
    },
    {
      title: 'Total Orders',
      value: hasData ? formatNumber(kpis.totalOrders) : '0',
      icon: ShoppingBag,
      color: 'text-green-600 dark:text-green-400',
      badge: hasData ? 'Multi-Channel' : 'Empty',
      badgeColor: hasData ? 'bg-green-100 text-green-900 dark:bg-green-200/90 dark:text-green-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-200/90 dark:text-gray-800'
    },
    {
      title: 'Total Revenue',
      value: hasData ? formatCompactCurrency(kpis.totalRevenue) : formatCompactCurrency(0),
      icon: BarChart3,
      color: 'text-emerald-600 dark:text-emerald-400',
      badge: hasData ? 'Multi-Platform' : 'Empty',
      badgeColor: hasData ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-200/90 dark:text-emerald-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-200/90 dark:text-gray-800'
    },
    {
      title: 'Avg Profit Margin',
      value: hasData ? `${kpis.avgProfitMargin.toFixed(1)}%` : '0%',
      icon: TrendingUp,
      color: hasData && kpis.avgProfitMargin > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400',
      badge: hasData ? (kpis.avgProfitMargin > 20 ? 'Excellent' : kpis.avgProfitMargin > 10 ? 'Good' : 'Fair') : 'N/A',
      badgeColor: hasData ? 
        (kpis.avgProfitMargin > 20 ? 'bg-green-100 text-green-900 dark:bg-green-200/90 dark:text-green-900' : 
         kpis.avgProfitMargin > 10 ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-200/90 dark:text-yellow-900' : 
         'bg-orange-100 text-orange-900 dark:bg-orange-200/90 dark:text-orange-900') : 
        'bg-gray-100 text-gray-700 dark:bg-gray-200/90 dark:text-gray-800'
    },
    {
      title: 'Best Performer',
      value: hasData ? `${getMarketplaceIcon(kpis.bestPerformingMarketplace)} ${getShortMarketplaceName(kpis.bestPerformingMarketplace)}` : '🏬 None',
      icon: Target,
      color: 'text-purple-600 dark:text-purple-400',
      badge: hasData ? 'Top Margin' : 'N/A',
      badgeColor: hasData ? 'bg-purple-100 text-purple-900 dark:bg-purple-200/90 dark:text-purple-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-200/90 dark:text-gray-800'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Store className="w-5 h-5" />
            Marketplace Overview
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {hasData && (
            <Badge variant="outline" className="text-blue-700 border-blue-300 dark:text-blue-200 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 font-medium">
              {kpis.totalMarketplaces} channels
            </Badge>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 auto-rows-fr">
        {marketplaceKPIs.map((kpi) => (
          <MarketplaceKPICard key={kpi.title} {...kpi} loading={loading} />
        ))}
      </div>

      {/* Quick Marketplace Summary */}
      {hasData && marketplaceData && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Top 3 Marketplace Performance
                </p>
                <div className="flex items-center gap-4 mt-1">
                  {marketplaceData.marketplaces.slice(0, 3).map((mp, index) => (
                    <div key={mp.marketplace} className="flex items-center gap-1 text-xs">
                      <span>{getMarketplaceIcon(mp.marketplace)}</span>
                      <span className="font-medium text-foreground">{mp.marketplace}</span>
                      <span className="text-muted-foreground">
                        ({mp.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-200/90 dark:text-blue-900 font-semibold border border-blue-300 dark:border-blue-700">
              Multi-Channel
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketplaceKPICards;