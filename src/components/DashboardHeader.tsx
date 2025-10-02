import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';

import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Sparkles } from 'lucide-react';
import dbusanaLogo from 'figma:asset/e8b6fff0f467edb21198114a8e47e56f63632a02.png';

export function DashboardHeader() {
  const location = useLocation();
  const { actualTheme } = useTheme();
  const { t } = useTranslation();
  
  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    const pageTitles: { [key: string]: { title: string; subtitle: string } } = {
      '/dashboard': { title: 'Dashboard Overview', subtitle: 'Monitor performa bisnis dan metrik penting' },
      '/import': { title: 'Import Penjualan', subtitle: 'Upload dan parse data Excel untuk dashboard' },
      '/sales': { title: 'Sales Management', subtitle: 'Kelola transaksi dan data penjualan' },
      '/products': { title: 'Products Management', subtitle: 'Kelola master data produk dan inventory' },
      '/categories': { title: 'Categories', subtitle: 'Sistem manajemen kategori bisnis fashion terintegrasi' },
      '/stock': { title: 'Stock Management', subtitle: 'Monitor dan kelola inventory stock' },
      '/cash-flow': { title: 'Cash Flow Management', subtitle: 'Monitor arus kas dan keuangan' },
      '/bom': { title: 'Bill of Materials', subtitle: 'Kelola struktur dan cost produk' },
      '/analytics': { title: 'Analytics Dashboard', subtitle: 'Analisis mendalam performa bisnis' },
      '/advertising': { title: 'Advertising Management', subtitle: 'Kelola campaign dan marketing' },
      '/forecasting': { title: 'Sales Forecasting', subtitle: 'Prediksi dan proyeksi penjualan' },
      '/reports': { title: 'Advanced Reports', subtitle: 'Laporan komprehensif dan insights' },
      '/settings': { title: 'System Settings', subtitle: 'Konfigurasi sistem dan preferensi' },
      '/language-demo': { title: t('settings.language') + ' Demo', subtitle: 'Test multi-language system functionality' }
    };
    
    return pageTitles[path] || { 
      title: path.split('/').pop()?.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') || 'Dashboard',
      subtitle: 'Sistem manajemen bisnis fashion terintegrasi'
    };
  };

  const pageInfo = getPageTitle();

  return (
    <header className={`
      bg-card/95 backdrop-blur-sm border-b border-border px-4 lg:px-6 py-4 flex-shrink-0 
      transition-all duration-300 
      ${actualTheme === 'dark' ? 'shadow-lg shadow-black/10' : 'shadow-sm shadow-gray-100/50'}
    `}>
      <div className="flex items-center justify-between">
        {/* Left side - Title with mobile menu space */}
        <div className="ml-12 lg:ml-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground transition-colors duration-200">
              {pageInfo.title}
            </h1>
            {actualTheme === 'dark' && (
              <Badge 
                variant="secondary" 
                className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-800/50 text-gray-300 border-gray-700"
              >
                <Sparkles className="h-3 w-3" />
                Dark Mode
              </Badge>
            )}
          </div>
          <p className={`
            text-sm lg:text-base hidden sm:block transition-colors duration-200
            ${actualTheme === 'dark' ? 'text-muted-foreground/80' : 'text-muted-foreground'}
          `}>
            {pageInfo.subtitle}
          </p>
        </div>
        
        {/* Right side - Controls */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Language Selector */}
          <LanguageSelector variant="compact" />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* User Profile - Responsive */}
          <div className="flex items-center gap-2 ml-2">
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center p-1 transition-all duration-200
              ${actualTheme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-black shadow-lg shadow-black/50' 
                : 'bg-gradient-to-br from-gray-900 to-black shadow-md shadow-gray-900/30'
              }
            `}>
              <img 
                src={dbusanaLogo} 
                alt="D'Busana" 
                className="w-full h-full object-contain filter brightness-110"
              />
            </div>
            <div className="text-right hidden lg:block">
              <p className="text-sm font-medium text-foreground transition-colors duration-200">
                D'Busana Administrator
              </p>
              <p className={`
                text-xs transition-colors duration-200
                ${actualTheme === 'dark' ? 'text-muted-foreground/70' : 'text-muted-foreground'}
              `}>
                admin@dbusana.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}