import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KPICards } from '../KPICards';
import { MarketplaceKPICards } from '../MarketplaceKPICards';
import { MarketplaceBreakdown } from '../MarketplaceBreakdown';

import { QuickActions } from '../QuickActions';
import { SalesQuickActions } from '../SalesQuickActions';
import { RecentActivities } from '../RecentActivities';
// Removed NetProfitSummaryCard import
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BarChart3, Store, TrendingUp, Package, Users, DollarSign, Zap, Target } from 'lucide-react';

interface DashboardContentProps {
  dashboardKey: number;
}

export function DashboardContent({ dashboardKey }: DashboardContentProps) {
  const navigate = useNavigate();

  return (
    <div key={dashboardKey} className="space-y-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">
              Dashboard D'Busana
            </h1>
          </div>
        </div>
      </div>

      {/* Welcome Card with Quick Stats */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Selamat Datang di D'Busana Dashboard! 👋</h2>
              <p className="text-blue-100 mb-4">
                Monitor semua aspek bisnis fashion Anda dalam satu platform terintegrasi
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-green-300" />
                  <span className="text-sm">Multi Marketplace</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-300" />
                  <span className="text-sm">AI Forecasting</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white/90">
                {new Date().getDate().toString().padStart(2, '0')} {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date().getMonth()]}
              </div>
              <div className="text-sm text-blue-100">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long'
                })}, {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main KPI Cards - Database integration */}
      <KPICards />

      {/* Marketplace KPI Overview - Marketplace analytics */}
      <MarketplaceKPICards />

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="border-b border-border">
          <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-3"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="marketplace" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-3"
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Marketplace</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-3"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="products" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-3"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger 
              value="actions" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-3"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab - Clean Business Summary */}
        <TabsContent value="overview" className="space-y-6">
          {/* Business Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Business Overview
              </CardTitle>
              <CardDescription>
                Ringkasan performa bisnis D'Busana - Dashboard terintegrasi untuk semua aspek bisnis fashion Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Sales & Orders</span>
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-xs">
                    Monitor penjualan dari semua marketplace dalam satu dashboard terpusat
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Products & Inventory</span>
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs">
                    Kelola master produk, kategori, brand, dan tracking inventory yang akurat
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Analytics & Reports</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs">
                    Dapatkan insights mendalam dengan advanced analytics dan comprehensive reporting
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Actions & Management</span>
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-xs">
                    Akses cepat ke semua fitur management - dari import data hingga supplier management
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/analytics')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Deep Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Analisis mendalam dengan AI-powered insights, marketplace comparison, dan revenue analytics
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/import-data')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-green-600" />
                  Import Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Import data penjualan, produk, stock, dan advertising dari Excel/CSV dalam satu unified interface
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Import Data Now
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/sales')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="w-5 h-5 text-blue-600" />
                  Sales Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Kelola penjualan, customer management, dan invoice generation dalam satu platform
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Manage Sales
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Net Profit Summary - Removed from main dashboard */}

          {/* Quick Actions and Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickActions />
            <RecentActivities />
          </div>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          {/* Marketplace Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-green-600" />
                Marketplace Analytics
              </CardTitle>
              <CardDescription>
                Analisis performa penjualan di berbagai marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Monitor dan bandingkan performa penjualan di TikTok Shop, Shopee, Tokopedia, dan platform lainnya dalam satu dashboard terpusat.
              </div>
            </CardContent>
          </Card>

          <MarketplaceBreakdown />
        </TabsContent>

        {/* Analytics Tab - Navigation to Dedicated Pages */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Navigation */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Advanced Analytics & Insights
              </CardTitle>
              <CardDescription>
                Akses semua fitur analytics mendalam - dipisahkan per kategori untuk pengalaman yang optimal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Untuk performa optimal dan fokus analisis yang lebih mendalam, setiap analytics tersedia di halaman terpisah dengan fitur lengkap.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => navigate('/analytics')} className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">Dashboard Analytics</span>
                  </div>
                  <p className="text-xs text-left text-muted-foreground">
                    Comprehensive analytics dengan marketplace comparison, product analysis, dan growth trends
                  </p>
                </Button>
                <Button variant="outline" onClick={() => navigate('/revenue-comparison')} className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Revenue Analysis</span>
                  </div>
                  <p className="text-xs text-left text-muted-foreground">
                    Deep dive revenue analytics, monthly comparisons, dan top products performance
                  </p>
                </Button>
                <Button variant="outline" onClick={() => navigate('/performance-metrics')} className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold">Performance Metrics</span>
                  </div>
                  <p className="text-xs text-left text-muted-foreground">
                    KPI monitoring, conversion rates, dan detailed performance breakdowns
                  </p>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advertising & Forecasting Quick Access */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-pink-600" />
                  Advertising Analytics
                </CardTitle>
                <CardDescription>
                  Campaign performance & ROI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Analisis performa campaign advertising di berbagai platform dengan ROI tracking dan optimization insights.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/advertising')}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Campaign Dashboard
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/advertising/roi')}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    ROI Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  AI Forecasting
                </CardTitle>
                <CardDescription>
                  Prediksi bisnis dengan machine learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Forecasting dengan 4 model AI untuk prediksi sales, demand planning, dan strategic business insights.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/forecasting')}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Forecasting Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Products Summary */}
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Product Performance Analytics
              </CardTitle>
              <CardDescription>
                Analisis performa produk dan inventory management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Monitor performa setiap produk, analisis quantity vs revenue, dan optimasi inventory untuk memaksimalkan profit.
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-card rounded-lg">
            <p className="text-muted-foreground">Product performance analytics akan tersedia di halaman terpisah untuk analisis yang lebih mendalam.</p>
          </div>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          {/* Actions Summary */}
          <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" />
                Quick Actions & Activity Monitor
              </CardTitle>
              <CardDescription>
                Akses cepat ke fitur utama dan monitor aktivitas terbaru
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Akses semua fitur utama dengan satu klik - import data, kelola penjualan, analytics, dan monitor semua aktivitas bisnis.
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SalesQuickActions />
            <div className="space-y-6">
              <QuickActions />
              <RecentActivities />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}