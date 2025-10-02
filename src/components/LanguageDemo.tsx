import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useLanguageUtils } from '../hooks/useLanguageUtils';
import { ShoppingCart, DollarSign, Users, Package } from 'lucide-react';

export function LanguageDemo() {
  const { t, quick, formatters, language, languageInfo } = useLanguageUtils();

  const demoData = {
    totalOrders: 1250,
    totalRevenue: 875000000,
    totalCustomers: 892,
    totalProducts: 156,
    conversionRate: 3.2,
    date: new Date()
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p><strong>{t('settings.language')}:</strong> {languageInfo.name} ({languageInfo.code})</p>
              <p><strong>{t('common.loading')}:</strong> {t('common.loading')}</p>
              <p><strong>Current Date:</strong> {formatters.dateTime(demoData.date)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {quick.kpi('total_orders')}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatters.compactNumber(demoData.totalOrders)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {quick.kpi('total_revenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatters.currency(demoData.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {quick.kpi('total_customers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatters.compactNumber(demoData.totalCustomers)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {quick.kpi('total_products')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoData.totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.conversion.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>{formatters.percentage(demoData.conversionRate)}</p>
            <p className="text-sm text-muted-foreground">
              {t('analytics.conversion.insight', { 
                channel: 'TikTok Shop', 
                rate: demoData.conversionRate.toString() 
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.settings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Test Actions</h4>
              <p className="text-sm text-muted-foreground">{formatters.relativeTime(new Date('2024-01-01'))}</p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                {quick.action('save')}
              </Button>
              <Button variant="outline" size="sm">
                {quick.action('cancel')}
              </Button>
              <Button variant="outline" size="sm">
                {quick.action('export')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}