import React from 'react';
import { CheckCircle, AlertTriangle, Info, X, ExternalLink, FileText, Clock, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ImportToastData {
  type: 'sales' | 'products' | 'stock' | 'advertising' | 'advertising-settlement';
  imported: number;
  total: number;
  errors?: number;
  duplicates?: number;
  fileName?: string;
  processingTime?: number;
}

interface EnhancedImportToastProps {
  data: ImportToastData;
  onClose?: () => void;
  onNavigate?: (path: string) => void;
  isDarkMode?: boolean;
}

export function EnhancedImportToast({ 
  data, 
  onClose, 
  onNavigate,
  isDarkMode = false 
}: EnhancedImportToastProps) {
  const { type, imported, total, errors = 0, duplicates = 0, fileName, processingTime } = data;
  
  const successRate = total > 0 ? Math.round((imported / total) * 100) : 0;
  const isSuccess = successRate === 100;
  const hasWarnings = errors > 0 || duplicates > 0;

  // Get type-specific configuration
  const getTypeConfig = (type: string) => {
    const configs = {
      sales: {
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-700',
        label: 'Sales Data',
        path: '/sales'
      },
      products: {
        icon: FileText,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-700',
        label: 'Products Data',
        path: '/products'
      },
      stock: {
        icon: TrendingUp,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-700',
        label: 'Stock Data',
        path: '/stock'
      },
      advertising: {
        icon: TrendingUp,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-700',
        label: 'Advertising Data',
        path: '/advertising'
      },
      'advertising-settlement': {
        icon: TrendingUp,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-700',
        label: 'Settlement Data',
        path: '/advertising'
      }
    };
    
    return configs[type as keyof typeof configs] || configs.sales;
  };

  const config = getTypeConfig(type);
  const IconComponent = config.icon;

  const getStatusIcon = () => {
    if (isSuccess) {
      return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    } else if (hasWarnings) {
      return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    } else {
      return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
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

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(config.path);
    } else {
      window.location.href = config.path;
    }
  };

  return (
    <div className={`
      relative max-w-md w-full bg-card dark:bg-card 
      border border-border dark:border-border 
      rounded-lg shadow-lg p-4 
      transition-all duration-200 
      ${isDarkMode ? 'dark' : ''}
    `}>
      {/* Close Button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-muted dark:hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
          <IconComponent className={`w-4 h-4 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon()}
            <h4 className="font-semibold text-foreground dark:text-foreground text-sm">
              {getStatusText()}
            </h4>
          </div>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            {config.label} • {imported} dari {total} records
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground dark:text-muted-foreground">Progress</span>
          <Badge 
            variant={isSuccess ? "default" : hasWarnings ? "destructive" : "secondary"}
            className="text-xs px-2 py-0"
          >
            {successRate}%
          </Badge>
        </div>
        <div className="w-full bg-secondary dark:bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isSuccess ? 'bg-green-500' : 
              hasWarnings ? 'bg-yellow-500' : 
              'bg-blue-500'
            }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        {fileName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span className="truncate">{fileName}</span>
          </div>
        )}
        
        {processingTime && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Waktu proses: {processingTime}ms</span>
          </div>
        )}

        {(errors > 0 || duplicates > 0) && (
          <div className="text-xs space-y-1">
            {errors > 0 && (
              <div className="text-red-600 dark:text-red-400">
                • {errors} records gagal
              </div>
            )}
            {duplicates > 0 && (
              <div className="text-yellow-600 dark:text-yellow-400">
                • {duplicates} records duplikat dilewati
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={handleNavigate}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Lihat {config.label}
        </Button>
      </div>
    </div>
  );
}

// Enhanced Import Notifications Class with Dark Mode Support
export class EnhancedImportNotifications {
  private isDarkMode = false;

  constructor() {
    // Detect dark mode
    this.updateDarkMode();
    
    // Listen for theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => this.updateDarkMode());
      
      // Also listen for manual theme changes
      const observer = new MutationObserver(() => this.updateDarkMode());
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme']
      });
    }
  }

  private updateDarkMode() {
    if (typeof window !== 'undefined') {
      this.isDarkMode = 
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  showImportSuccess(data: ImportToastData, onNavigate?: (path: string) => void): void {
    // For now, just log to console since toasts are disabled
    // But component is ready for integration
    const { imported, total, type } = data;
    const successRate = total > 0 ? Math.round((imported / total) * 100) : 0;
    
    console.log(`🎉 Import Success: ${type} - ${imported}/${total} records (${successRate}%)`, {
      darkMode: this.isDarkMode,
      data
    });

    // Could be used with a toast library or custom toast container
    // Example: showCustomToast(<EnhancedImportToast data={data} onNavigate={onNavigate} isDarkMode={this.isDarkMode} />);
  }

  showImportError(type: string, error: string): void {
    console.error(`❌ Import Error: ${type} - ${error}`, {
      darkMode: this.isDarkMode
    });
  }

  showImportWarning(type: string, message: string): void {
    console.warn(`⚠️ Import Warning: ${type} - ${message}`, {
      darkMode: this.isDarkMode
    });
  }
}

// Export singleton instance
export const enhancedImportNotifications = new EnhancedImportNotifications();

// Export individual functions for backward compatibility
export function showAdvertisingImportSuccess(data: ImportToastData, onNavigate?: (path: string) => void): void {
  enhancedImportNotifications.showImportSuccess(data, onNavigate);
}

export function showAffiliateSamplesImportSuccess(data: ImportToastData, onNavigate?: (path: string) => void): void {
  enhancedImportNotifications.showImportSuccess(data, onNavigate);
}

export function showCommissionAdjustmentsImportSuccess(data: ImportToastData, onNavigate?: (path: string) => void): void {
  enhancedImportNotifications.showImportSuccess(data, onNavigate);
}

export function showReimbursementsImportSuccess(data: ImportToastData, onNavigate?: (path: string) => void): void {
  enhancedImportNotifications.showImportSuccess(data, onNavigate);
}

export function showReturnsImportSuccess(data: ImportToastData, onNavigate?: (path: string) => void): void {
  enhancedImportNotifications.showImportSuccess(data, onNavigate);
}