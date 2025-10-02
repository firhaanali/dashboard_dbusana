import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  BarChart3,
  Settings
} from 'lucide-react';

export function ThemePreview() {
  const { actualTheme, colorScheme } = useTheme();

  // Get accent color based on current color scheme
  const getAccentClass = () => {
    switch (colorScheme) {
      case 'green':
        return 'bg-green-600 text-white border-green-600';
      case 'purple':
        return 'bg-purple-600 text-white border-purple-600';
      case 'orange':
        return 'bg-orange-600 text-white border-orange-600';
      default:
        return 'bg-blue-600 text-white border-blue-600';
    }
  };

  const getAccentSecondaryClass = () => {
    switch (colorScheme) {
      case 'green':
        return actualTheme === 'dark' ? 'bg-green-900/20 text-green-400 border-green-700' : 'bg-green-50 text-green-700 border-green-200';
      case 'purple':
        return actualTheme === 'dark' ? 'bg-purple-900/20 text-purple-400 border-purple-700' : 'bg-purple-50 text-purple-700 border-purple-200';
      case 'orange':
        return actualTheme === 'dark' ? 'bg-orange-900/20 text-orange-400 border-orange-700' : 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return actualTheme === 'dark' ? 'bg-blue-900/20 text-blue-400 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="w-80 space-y-3 theme-transition">
      {/* Mini Header */}
      <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${getAccentClass()}`}>
            <BarChart3 className="w-3 h-3" />
          </div>
          <span className="text-sm font-medium">D'Busana Dashboard</span>
        </div>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
          <Settings className="w-3 h-3" />
        </Button>
      </div>

      {/* Mini KPI Cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-sm font-semibold">Rp 2.5M</p>
              </div>
              <div className={`p-1 rounded-full ${getAccentSecondaryClass()}`}>
                <DollarSign className="w-3 h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-sm font-semibold">142</p>
              </div>
              <div className={`p-1 rounded-full ${getAccentSecondaryClass()}`}>
                <ShoppingCart className="w-3 h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini Chart Card */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Sales Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="h-12 flex items-end justify-between gap-1">
            {[40, 65, 30, 80, 55, 90, 75].map((height, index) => (
              <div
                key={index}
                className={`w-3 rounded-t ${getAccentClass()} opacity-70`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between items-center mt-2">
            <Badge variant="secondary" className="text-xs">
              +12.5%
            </Badge>
            <span className="text-xs text-muted-foreground">vs last week</span>
          </div>
        </CardContent>
      </Card>

      {/* Mini Action Buttons */}
      <div className="flex gap-2">
        <Button size="sm" className={`flex-1 text-xs ${getAccentClass()}`}>
          <Users className="w-3 h-3 mr-1" />
          Customers
        </Button>
        <Button size="sm" variant="outline" className="flex-1 text-xs">
          <BarChart3 className="w-3 h-3 mr-1" />
          Reports
        </Button>
      </div>

      {/* Theme Info */}
      <div className="text-center p-2 bg-muted/50 rounded border-dashed border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium capitalize">{actualTheme}</span> theme • 
          <span className="font-medium capitalize ml-1">{colorScheme}</span> scheme
        </p>
      </div>
    </div>
  );
}