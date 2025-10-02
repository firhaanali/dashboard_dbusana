import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Upload, 
  Download, 
  ShoppingCart, 
  BarChart3, 
  FileText, 
  Plus,
  Eye,
  TrendingUp,
  Package,
  Users,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SalesQuickActions() {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: Upload,
      title: 'Import Data Penjualan',
      description: 'Upload file Excel penjualan baru',
      action: () => navigate('/import-penjualan'),
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: ShoppingCart,
      title: 'Lihat Sales Management',
      description: 'Kelola dan analisis data penjualan',
      action: () => navigate('/sales'),
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Lihat tren dan insights mendalam',
      action: () => navigate('/analytics'),
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      icon: Download,
      title: 'Export Laporan',
      description: 'Download laporan penjualan',
      action: () => {
        // This would trigger export functionality
        console.log('Export sales report');
      },
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  const salesInsights = [
    {
      icon: TrendingUp,
      label: 'Penjualan Hari Ini',
      value: 'Rp 2.5M',
      trend: '+12%',
      trendUp: true
    },
    {
      icon: Users,
      label: 'Pelanggan Aktif',
      value: '145',
      trend: '+5%',
      trendUp: true
    },
    {
      icon: Package,
      label: 'Produk Terlaris',
      value: 'Kemeja A',
      trend: '23 unit',
      trendUp: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Sales Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className={`${action.bgColor} ${action.borderColor} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
                onClick={action.action}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Sales Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salesInsights.map((insight, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <insight.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{insight.label}</p>
                  <p className="font-semibold text-gray-900">{insight.value}</p>
                  <p className={`text-xs ${insight.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {insight.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}