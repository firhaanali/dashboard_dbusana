import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users, MapPin, TrendingUp, Eye, AlertTriangle } from 'lucide-react';
import { useCustomerAggregationSummary } from '../hooks/useCustomerAggregation';
import { Skeleton } from './ui/skeleton';

interface CustomerAggregationWidgetProps {
  onViewDetails?: () => void;
}

export function CustomerAggregationWidget({ onViewDetails }: CustomerAggregationWidgetProps) {
  const { summary, loading, error, refetch } = useCustomerAggregationSummary();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Customer Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
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
            <Users className="w-5 h-5" />
            Customer Analytics
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
            <Users className="w-5 h-5 text-blue-600" />
            Customer Analytics
          </div>
          <Button variant="ghost" size="sm" onClick={refetch}>
            <TrendingUp className="w-4 h-4" />
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Analisis agregasi customer berdasarkan lokasi
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {summary.known_customers.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-blue-700">Known Customers</p>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {summary.unknown_customer_groups.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-orange-700">Location Groups</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {summary.total_unique_customers.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-green-700">Total Unique</p>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {summary.unknown_orders_percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-red-700">Unknown Orders</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Sales Records:</span>
            <Badge variant="outline">
              {summary.total_sales_records.toLocaleString('id-ID')}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Unknown Orders:</span>
            <Badge variant="destructive">
              {summary.unknown_orders_count.toLocaleString('id-ID')}
            </Badge>
          </div>
        </div>

        {/* Top Unknown Locations */}
        {summary.top_unknown_locations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Top Unknown Locations:</h4>
            <div className="space-y-1">
              {summary.top_unknown_locations.slice(0, 3).map((location, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1 mr-2">{location.location}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1">
                      {location.orders}
                    </Badge>
                    <span className="text-muted-foreground">
                      Rp {(location.revenue / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {onViewDetails && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onViewDetails}
          >
            <MapPin className="w-4 h-4 mr-2" />
            View Detailed Analytics
          </Button>
        )}

        {/* Data Quality Indicator */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Data Quality:</span>
            <div className="flex items-center gap-1">
              {summary.unknown_orders_percentage < 10 ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Excellent</span>
                </>
              ) : summary.unknown_orders_percentage < 25 ? (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Good</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Needs Attention</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for dashboard overview
export function CustomerAggregationWidgetCompact() {
  const { summary, loading, error } = useCustomerAggregationSummary();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-muted-foreground" />
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
              <p className="font-medium">Customer Data</p>
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
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Customer Groups</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 font-medium">
                {summary.known_customers}
              </span>
              <span className="text-muted-foreground">known,</span>
              <span className="text-orange-600 font-medium">
                {summary.unknown_customer_groups}
              </span>
              <span className="text-muted-foreground">groups</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Unknown %</p>
            <p className="font-bold text-red-600">
              {summary.unknown_orders_percentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}