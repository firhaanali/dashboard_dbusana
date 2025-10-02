/**
 * Enhanced Error Boundary Component
 * Provides better error handling with retry functionality and user feedback
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  onRetry: () => void;
  onGoHome: () => void;
  context?: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for debugging
    console.error('🚨 Error Boundary Caught Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      timestamp: new Date().toISOString()
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (if available)
    if (typeof window !== 'undefined' && (window as any).reportError) {
      (window as any).reportError(error, {
        context: this.props.context,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error!}
            errorInfo={this.state.errorInfo}
            retryCount={this.state.retryCount}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            context={this.props.context}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  retryCount,
  onRetry,
  onGoHome,
  context
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-red-900">
                Oops! Something went wrong
              </CardTitle>
              {context && (
                <Badge variant="outline" className="mt-2">
                  Context: {context}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-medium">
              Error: {error.message}
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-red-600 mt-1">
                Retry attempts: {retryCount}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onRetry}
              className="flex items-center gap-2"
              disabled={retryCount >= 3}
            >
              <RefreshCw className="w-4 h-4" />
              {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
            </Button>
            
            <Button
              variant="outline"
              onClick={onGoHome}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </div>

          {isDevelopment && errorInfo && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Developer Details (Development Only)
              </summary>
              <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs font-mono overflow-auto max-h-64">
                <div className="mb-2">
                  <strong>Error Stack:</strong>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                </div>
              </div>
            </details>
          )}

          <div className="text-xs text-gray-500 mt-4">
            <p>If this problem persists, please contact support with the error details above.</p>
            <p className="mt-1">
              Timestamp: {new Date().toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary context={context} fallback={fallback}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook to manually trigger error boundary (for testing)
 */
export function useErrorBoundary() {
  return (error: Error) => {
    throw error;
  };
}