import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { TrendingUp, TrendingDown, Calendar, BarChart3, AlertTriangle } from 'lucide-react';
import { useMonthlyTrendSummary } from '../hooks/useMonthlyTrends';
import { Skeleton } from './ui/skeleton';

interface MonthlyTrendSummaryWidgetProps {
  onViewDetails?: () => void;
}

export function MonthlyTrendSummaryWidget({ onViewDetails }: MonthlyTrendSummaryWidgetProps) {
  const { summary, loading, error, refetch } = useMonthlyTrendSummary();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p>Data tidak tersedia</p>
              <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
                Coba Lagi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Monthly Performance
          </div>
          <Button variant="ghost" size="sm" onClick={refetch}>
            <BarChart3 className="w-4 h-4" />
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {summary.currentMonth} vs {summary.previousMonth}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Revenue Change */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              {summary.revenueChange.direction === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
              {summary.revenueChange.direction === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
              {summary.revenueChange.direction === 'neutral' && <span className="w-5 h-5 flex items-center justify-center text-gray-600">—</span>}
            </div>
            <p className={`text-2xl font-bold ${summary.revenueChange.color}`}>
              {summary.revenueChange.percentage > 0 ? '+' : ''}{summary.revenueChange.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-blue-700">Revenue Growth</p>
          </div>
          
          {/* Profit Change */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              {summary.profitChange.direction === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
              {summary.profitChange.direction === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
              {summary.profitChange.direction === 'neutral' && <span className="w-5 h-5 flex items-center justify-center text-gray-600">—</span>}
            </div>
            <p className={`text-2xl font-bold ${summary.profitChange.color}`}>
              {summary.profitChange.percentage > 0 ? '+' : ''}{summary.profitChange.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-green-700">Profit Growth</p>
          </div>
        </div>

        {/* Current vs Previous Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Revenue:</span>
            <Badge variant="outline">
              Rp {summary.currentMetrics.revenue.toLocaleString('id-ID')}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Previous Revenue:</span>
            <Badge variant="secondary">
              Rp {summary.previousMetrics.revenue.toLocaleString('id-ID')}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Sales Count:</span>
            <Badge variant="outline">
              {summary.currentMetrics.sales.toLocaleString('id-ID')} sales
            </Badge>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Performance:</span>
            <div className="flex items-center gap-1">
              {summary.revenueChange.percentage >= 0 && summary.profitChange.percentage >= 0 ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Growing</span>
                </>
              ) : summary.revenueChange.percentage >= 0 || summary.profitChange.percentage >= 0 ? (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Mixed</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Declining</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onViewDetails && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onViewDetails}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Detailed Trends
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for smaller spaces
export function MonthlyTrendSummaryWidgetCompact() {
  const { summary, loading, error } = useMonthlyTrendSummary();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-muted-foreground" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div className="flex-1">
              <p className="font-medium">Monthly Trends</p>
              <p className="text-sm text-muted-foreground">Error loading</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Monthly Growth</p>
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-medium ${summary.revenueChange.color}`}>
                Revenue: {summary.revenueChange.percentage > 0 ? '+' : ''}{summary.revenueChange.percentage.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">|</span>
              <span className={`font-medium ${summary.profitChange.color}`}>
                Profit: {summary.profitChange.percentage > 0 ? '+' : ''}{summary.profitChange.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">vs {summary.previousMonth}</p>
            {summary.revenueChange.direction === 'up' && <TrendingUp className="w-4 h-4 text-green-600 ml-auto" />}
            {summary.revenueChange.direction === 'down' && <TrendingDown className="w-4 h-4 text-red-600 ml-auto" />}
            {summary.revenueChange.direction === 'neutral' && <span className="w-4 h-4 flex items-center justify-center text-gray-600 ml-auto">—</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}