import React from 'react';
import { Card, CardContent } from '../ui/card';
import { DollarSign, Package, User } from 'lucide-react';
import type { DashboardMetrics } from '../../contexts/ImportDataContext';

interface SalesOverviewCardsProps {
  salesDataLength: number;
  metrics: DashboardMetrics;
}

export function SalesOverviewCards({ salesDataLength, metrics }: SalesOverviewCardsProps) {
  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-xl font-semibold text-gray-900">
                {salesDataLength}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unique Orders</p>
              <p className="text-xl font-semibold text-gray-900">
                {metrics.distinctOrders}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Products Sold</p>
              <p className="text-xl font-semibold text-gray-900">
                {metrics.totalQuantitySold}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCompactCurrency(metrics.totalRevenue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}