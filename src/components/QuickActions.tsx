import React from 'react';
import { Plus, Upload, FileText, ShoppingCart, Package, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();
  
  const actions = [
    {
      icon: Plus,
      label: 'Tambah Penjualan',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => navigate('/sales')
    },
    {
      icon: Upload,
      label: 'Import Data',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => navigate('/import-data')
    },
    {
      icon: Package,
      label: 'Kelola Produk',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => navigate('/products')
    },
    {
      icon: FileText,
      label: 'Generate Laporan',
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => navigate('/reports')
    },
    {
      icon: ShoppingCart,
      label: 'Kelola Stok',
      color: 'bg-pink-500 hover:bg-pink-600',
      onClick: () => navigate('/stock')
    },
    {
      icon: BarChart3,
      label: 'Lihat Analytics',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      onClick: () => navigate('/analytics')
    }
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="w-full h-auto p-3 flex items-center gap-3 hover:shadow-md transition-all justify-start"
              onClick={action.onClick}
            >
              <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p>{action.label}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}