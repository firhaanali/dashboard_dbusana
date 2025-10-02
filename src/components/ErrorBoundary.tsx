import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Terjadi Kesalahan Sistem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                <p className="text-red-700 text-sm mb-2">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-red-600 text-sm font-medium">
                      Technical Details (Development Mode)
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 overflow-auto bg-red-100 p-2 rounded">
                      {this.state.error?.stack}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Kemungkinan Penyebab:</h4>
                <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                  <li>Backend server tidak berjalan (port 3001)</li>
                  <li>Koneksi internet bermasalah</li>
                  <li>Data import tidak valid atau rusak</li>
                  <li>Komponen mengalami error rendering</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Cara Mengatasi:</h4>
                <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Pastikan backend berjalan: <code className="bg-yellow-100 px-1 rounded">cd backend && npm run dev</code></li>
                  <li>Periksa console browser untuk error detail</li>
                  <li>Refresh halaman untuk reset state</li>
                  <li>Clear data import jika data bermasalah</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Reload Halaman
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  D'Busana Dashboard v1.0.0 | 
                  Error ID: {Date.now().toString(36)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error caught:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      // Log error for monitoring
      console.error('Application error:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }, [error]);

  return {
    error,
    handleError,
    clearError,
  };
}

// Simple error display component for small errors
export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss,
  className = "" 
}: { 
  error: string; 
  onRetry?: () => void; 
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-800 text-sm">{error}</p>
          <div className="flex gap-2 mt-2">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}