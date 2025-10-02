import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, AlertTriangle, FileText, Clock, TrendingUp, BarChart3, Package, DollarSign, Target, Sparkles, ExternalLink } from 'lucide-react';

interface ImportSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    type: 'sales' | 'products' | 'stock' | 'advertising' | 'advertising-settlement';
    imported: number;
    total: number;
    errors?: number;
    duplicates?: number;
    fileName?: string;
    processingTime?: number;
    summary?: Record<string, any>;
  };
  onNavigate?: (path: string) => void;
}

export function ImportSuccessDialog({ 
  isOpen, 
  onClose, 
  data, 
  onNavigate 
}: ImportSuccessDialogProps) {
  const { type, imported, total, errors = 0, duplicates = 0, fileName, processingTime, summary } = data;
  
  const successRate = total > 0 ? Math.round((imported / total) * 100) : 0;
  const isSuccess = successRate === 100;
  const hasWarnings = errors > 0 || duplicates > 0;

  // Get type-specific configuration
  const getTypeConfig = (type: string) => {
    const configs = {
      sales: {
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Sales Data',
        description: 'Data penjualan berhasil diimport',
        navigatePath: '/sales'
      },
      products: {
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Products Data',
        description: 'Data produk berhasil diimport',
        navigatePath: '/products'
      },
      stock: {
        icon: BarChart3,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        label: 'Stock Data',
        description: 'Data stok berhasil diimport',
        navigatePath: '/stock'
      },
      advertising: {
        icon: TrendingUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Advertising Data',
        description: 'Data advertising berhasil diimport',
        navigatePath: '/advertising'
      },
      'advertising-settlement': {
        icon: Target,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Advertising Settlement',
        description: 'Data settlement advertising berhasil diimport',
        navigatePath: '/advertising'
      }
    };
    
    return configs[type as keyof typeof configs] || configs.sales;
  };

  const config = getTypeConfig(type);
  const IconComponent = config.icon;

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(config.navigatePath);
    } else {
      window.location.href = config.navigatePath;
    }
    onClose();
  };

  const getStatusIcon = () => {
    if (isSuccess) {
      return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />;
    } else if (hasWarnings) {
      return <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />;
    } else {
      return <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getStatusText = () => {
    if (isSuccess) {
      return 'Import Berhasil Sempurna!';
    } else if (hasWarnings) {
      return 'Import Selesai dengan Warning';
    } else {
      return 'Import Berhasil';
    }
  };



  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setAnimationProgress(successRate);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, successRate]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg theme-transition sm:max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header with enhanced styling */}
        <DialogHeader className="space-y-4 pb-2">
          {/* Success Icon with Animation */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`relative p-4 rounded-full ${
              isSuccess ? 'bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20' :
              hasWarnings ? 'bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20' :
              'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20'
            } border ${
              isSuccess ? 'border-green-200 dark:border-green-700' :
              hasWarnings ? 'border-yellow-200 dark:border-yellow-700' :
              'border-blue-200 dark:border-blue-700'
            }`}>
              {isSuccess && <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 animate-pulse" />}
              {getStatusIcon()}
            </div>
            
            <div>
              <DialogTitle className={`text-xl mb-1 ${isSuccess ? 'text-green-700 dark:text-green-400' : hasWarnings ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-700 dark:text-blue-400'}`}>
                {getStatusText()}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600 dark:text-gray-300">
                {config.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Statistics with Color Coding */}
          <div className="grid grid-cols-2 gap-4">
            <Card className={`border ${config.borderColor} dark:border-opacity-50 theme-transition interactive-hover`}>
              <CardContent className={`p-4 text-center ${config.bgColor} dark:bg-opacity-10 theme-transition`}>
                <div className={`text-3xl font-bold mb-1 ${type === 'sales' ? 'text-green-600 dark:text-green-400' : type === 'products' ? 'text-blue-600 dark:text-blue-400' : type === 'stock' ? 'text-purple-600 dark:text-purple-400' : type === 'advertising' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                  {imported.toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Records Berhasil</div>
                <div className={`w-full h-1 rounded-full mt-2 ${
                  isSuccess ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <div className={`h-1 rounded-full transition-all duration-1000 ${
                    isSuccess ? 'bg-green-500' : 'bg-blue-500'
                  }`} style={{ width: `${(imported/total) * 100}%` }} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-border theme-transition interactive-hover">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">
                  {total.toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Records</div>
                <div className="w-full h-1 rounded-full mt-2 bg-gray-200 dark:bg-gray-700">
                  <div className="h-1 rounded-full bg-accent-primary transition-all duration-1000" style={{ width: '100%' }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Success Rate with Better Animation */}
          <Card className="theme-transition">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900 dark:text-white">Tingkat Keberhasilan</span>
                <Badge 
                  variant={isSuccess ? "default" : hasWarnings ? "destructive" : "secondary"}
                  className="px-3 py-1 text-sm font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                  {successRate}%
                </Badge>
              </div>
              <div className="relative">
                <div className="w-full bg-secondary dark:bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ease-out relative ${
                      isSuccess ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                      hasWarnings ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                      'bg-gradient-to-r from-blue-500 to-blue-400'
                    }`}
                    style={{ width: `${animationProgress}%` }}
                  >
                    {successRate === 100 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    )}
                  </div>
                </div>
                {successRate === 100 && (
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 animate-bounce" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Info with Enhanced Design */}
          <Card className={`${config.bgColor} dark:bg-opacity-10 ${config.borderColor} dark:border-opacity-50 border theme-transition`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${config.bgColor} dark:bg-opacity-20 ${config.borderColor} dark:border-opacity-30 border theme-transition`}>
                  <IconComponent className={`w-6 h-6 ${type === 'sales' ? 'text-green-600 dark:text-green-400' : type === 'products' ? 'text-blue-600 dark:text-blue-400' : type === 'stock' ? 'text-purple-600 dark:text-purple-400' : type === 'advertising' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">{config.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">{imported}</span> dari <span className="font-medium text-gray-900 dark:text-white">{total}</span> records berhasil diproses
                  </div>
                  {fileName && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md mt-2">
                      <FileText className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      <span className="truncate font-medium text-gray-700 dark:text-gray-200">{fileName}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Warnings */}
          {(errors > 0 || duplicates > 0) && (
            <Card className="border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 theme-transition">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">Peringatan</span>
                </div>
                <div className="space-y-2">
                  {errors > 0 && (
                    <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      {errors} records gagal diimport
                    </div>
                  )}
                  {duplicates > 0 && (
                    <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      {duplicates} records duplikat dilewati
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Time with Better Styling */}
          {processingTime && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg theme-transition">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Waktu pemrosesan: <span className="font-semibold text-gray-900 dark:text-white">{processingTime}ms</span></span>
            </div>
          )}

          {/* Enhanced Summary */}
          {summary && Object.keys(summary).length > 0 && (
            <Card className="theme-transition">
              <CardContent className="p-4">
                <div className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  <BarChart3 className="w-4 h-4 text-accent-primary dark:text-accent-primary" />
                  Detail Import
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(summary).map(([key, value]) => (
                    <div key={key} className="flex flex-col space-y-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{key}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 theme-transition btn-interactive"
            >
              Tutup
            </Button>
            <Button 
              onClick={handleNavigate} 
              className="flex-1 theme-transition btn-interactive"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-foreground)'
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Lihat {config.label}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}