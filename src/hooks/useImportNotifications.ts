import { useState, useCallback } from 'react';
import { importSuccessNotifications, type ImportSuccessData } from '../utils/importSuccessNotifications';

interface ImportNotificationHook {
  showSuccessDialog: boolean;
  successData: ImportSuccessData | null;
  showSuccess: (data: ImportSuccessData, options?: {
    showDialog?: boolean;
    autoNavigate?: boolean;
    celebrateIfLarge?: boolean;
  }) => void;
  showError: (type: string, error: string) => void;
  showWarning: (type: string, message: string) => void;
  closeDialog: () => void;
  navigateToView: (path: string) => void;
}

export function useImportNotifications(): ImportNotificationHook {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<ImportSuccessData | null>(null);

  const showSuccess = useCallback((
    data: ImportSuccessData, 
    options: {
      showDialog?: boolean;
      autoNavigate?: boolean;
      celebrateIfLarge?: boolean;
    } = {}
  ) => {
    const {
      showDialog = false,
      autoNavigate = false,
      celebrateIfLarge = true
    } = options;

    // Toast notifications disabled, but show enhanced console output
    console.log(`🎉 ${data.type.toUpperCase()} Import Success:`, {
      imported: data.imported,
      total: data.total, 
      successRate: data.total > 0 ? Math.round((data.imported / data.total) * 100) : 0,
      errors: data.errors || 0,
      duplicates: data.duplicates || 0,
      fileName: data.fileName,
      processingTime: data.processingTime ? `${data.processingTime}ms` : 'N/A'
    });

    // Celebration notifications disabled
    if (celebrateIfLarge && data.imported >= 500) {
      console.log(`Celebration: Large import ${data.imported} records`);
    }

    // Show dialog if requested
    if (showDialog) {
      setSuccessData(data);
      setShowSuccessDialog(true);
    }

    // Auto navigate if requested
    if (autoNavigate) {
      setTimeout(() => {
        navigateToView(getNavigationPath(data.type));
      }, 1500);
    }

    // Log import success for analytics
    logImportSuccess(data);
  }, []);

  const showError = useCallback((type: string, error: string) => {
    // Error notifications disabled, but show enhanced console output
    console.error(`❌ ${type.toUpperCase()} Import Failed:`, {
      error: error,
      type: type,
      timestamp: new Date().toISOString(),
      troubleshooting: {
        'Check backend': 'Ensure backend server is running on port 3001',
        'File format': 'Verify file is .xlsx, .xls, or .csv',
        'Template': 'Use downloaded template for correct format',
        'Required fields': 'Check all required fields are filled'
      }
    });
  }, []);

  const showWarning = useCallback((type: string, message: string) => {
    // Warning notifications disabled  
    console.warn(`⚠️ Import Warning [${type}]:`, message);
  }, []);

  const closeDialog = useCallback(() => {
    setShowSuccessDialog(false);
    setSuccessData(null);
  }, []);

  const navigateToView = useCallback((path: string) => {
    window.location.href = path;
  }, []);

  return {
    showSuccessDialog,
    successData,
    showSuccess,
    showError,
    showWarning,
    closeDialog,
    navigateToView,
  };
}

// Helper function to get navigation path
function getNavigationPath(type: string): string {
  const paths = {
    sales: '/sales',
    products: '/products',
    stock: '/stock',
    advertising: '/advertising',
    'advertising-settlement': '/advertising'
  };
  
  return paths[type as keyof typeof paths] || '/dashboard';
}

// Helper function to log import success for analytics
function logImportSuccess(data: ImportSuccessData): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: data.type,
    imported: data.imported,
    total: data.total,
    successRate: data.total > 0 ? Math.round((data.imported / data.total) * 100) : 0,
    errors: data.errors || 0,
    duplicates: data.duplicates || 0,
    fileName: data.fileName,
    processingTime: data.processingTime
  };

  // Store in localStorage for import history
  try {
    const history = JSON.parse(localStorage.getItem('import_history') || '[]');
    history.unshift(logEntry);
    
    // Keep only last 50 imports
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem('import_history', JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save import history:', error);
  }

  // Log for debugging
  console.log('📊 Import Success Logged:', logEntry);
}

// Export additional utility for getting import history
export function getImportHistory(): any[] {
  try {
    return JSON.parse(localStorage.getItem('import_history') || '[]');
  } catch {
    return [];
  }
}

// Export utility for clearing import history
export function clearImportHistory(): void {
  localStorage.removeItem('import_history');
}