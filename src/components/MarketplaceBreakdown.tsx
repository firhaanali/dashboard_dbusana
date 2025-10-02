import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { TrendingUp, TrendingDown, Store, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMarketplaceAnalyticsShared } from '../hooks/useMarketplaceAnalyticsShared';

interface MarketplaceData {
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
  marketplaces: MarketplaceData[];
  summary: {
    totalMarketplaces: number;
    totalRevenue: number;
    topMarketplace: string;
    topMarketplaceRevenue: number;
  };
}

export function MarketplaceBreakdown() {
  const { data: marketplaceData, loading, error } = useMarketplaceAnalyticsShared('MarketplaceBreakdown');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  const getMarketplaceColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Marketplace Breakdown
          </CardTitle>
          <CardDescription>
            Performa penjualan berdasarkan marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Marketplace Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">❌ Error</div>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!marketplaceData || marketplaceData.marketplaces.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Marketplace Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🏬</div>
            <p className="text-sm text-muted-foreground">
              Belum ada data marketplace tersedia
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" />
          Marketplace Breakdown
        </CardTitle>
        <CardDescription>
          Performa penjualan berdasarkan marketplace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {marketplaceData.summary.totalMarketplaces}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Marketplace
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(marketplaceData.summary.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Revenue
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-purple-600">
              {marketplaceData.summary.topMarketplace}
            </div>
            <div className="text-xs text-muted-foreground">
              Top Marketplace
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-orange-600">
              {formatCurrency(marketplaceData.summary.topMarketplaceRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              Top Revenue
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Marketplace List */}
        <div className="space-y-4">
          {marketplaceData.marketplaces.map((marketplace, index) => (
            <div key={marketplace.marketplace} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getMarketplaceIcon(marketplace.marketplace)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{marketplace.marketplace}</h3>
                    <p className="text-sm text-muted-foreground">
                      {marketplace.percentage.toFixed(1)}% dari total revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {formatCurrency(marketplace.totalRevenue)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    marketplace.profitMargin > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {marketplace.profitMargin > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {marketplace.profitMargin.toFixed(1)}% Profit
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getMarketplaceColor(index)}`}
                    style={{ width: `${marketplace.percentage}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-blue-600">
                    {formatNumber(marketplace.distinctOrders)}
                  </div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">
                    {formatNumber(marketplace.totalQuantity)}
                  </div>
                  <div className="text-xs text-muted-foreground">Products</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600">
                    {formatCurrency(marketplace.avgOrderValue)}
                  </div>
                  <div className="text-xs text-muted-foreground">AOV</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-orange-600">
                    {formatCurrency(marketplace.totalProfit)}
                  </div>
                  <div className="text-xs text-muted-foreground">Profit</div>
                </div>
              </div>
            </div>
          ))}
        </div>


      </CardContent>
    </Card>
  );
}

export default MarketplaceBreakdown;