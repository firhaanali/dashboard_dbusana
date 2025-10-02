/**
 * Unified Error Handling Hook
 * Provides consistent error handling across the application
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';

export interface ErrorState {
  error: string | null;
  isError: boolean;
  timestamp?: Date;
}

export interface UseErrorHandlerReturn {
  error: string | null;
  isError: boolean;
  showError: (error: Error | string, options?: ErrorOptions) => void;
  clearError: () => void;
  handleAsyncError: (operation: () => Promise<any>) => Promise<any>;
}

export interface ErrorOptions {
  toast?: boolean;
  persist?: boolean;
  context?: string;
}

/**
 * Custom hook for unified error handling
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false
  });

  const showError = useCallback((error: Error | string, options: ErrorOptions = {}) => {
    const {
      toast: showToast = true,
      persist = false,
      context = ''
    } = options;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;

    // Log error for debugging
    console.error('🚨 Application Error:', {
      message: fullMessage,
      context,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Update state
    setErrorState({
      error: fullMessage,
      isError: true,
      timestamp: new Date()
    });

    // Show toast notification
    if (showToast) {
      toast.error(fullMessage, {
        duration: persist ? Infinity : 4000,
        action: persist ? {
          label: 'Dismiss',
          onClick: () => setErrorState({ error: null, isError: false })
        } : undefined
      });
    }

    // Auto-clear non-persistent errors
    if (!persist) {
      setTimeout(() => {
        setErrorState(prev => prev.error === fullMessage ? { error: null, isError: false } : prev);
      }, 5000);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState({ error: null, isError: false });
  }, []);

  const handleAsyncError = useCallback(async (
    operation: () => Promise<any>
  ): Promise<any> => {
    try {
      clearError();
      return await operation();
    } catch (error) {
      showError(error instanceof Error ? error : new Error('Unknown error occurred'));
      return null;
    }
  }, [showError, clearError]);

  return {
    error: errorState.error,
    isError: errorState.isError,
    showError,
    clearError,
    handleAsyncError
  };
}

/**
 * Hook for handling API errors specifically
 */
export function useApiErrorHandler() {
  const { showError, ...rest } = useErrorHandler();

  const handleApiError = useCallback((error: any, context?: string) => {
    let errorMessage = 'An unexpected error occurred';

    if (error?.error) {
      errorMessage = error.error;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Add context for API errors
    const fullContext = context || 'API Request';
    
    showError(errorMessage, {
      context: fullContext,
      toast: true,
      persist: false
    });
  }, [showError]);

  return {
    ...rest,
    showError,
    handleApiError
  };
}

/**
 * Hook for async operations with loading and error states
 */
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const { error, isError, showError, clearError } = useErrorHandler();

  const execute = useCallback(async (
    operation: () => Promise<any>,
    context?: string
  ): Promise<any> => {
    try {
      setLoading(true);
      clearError();
      
      const result = await operation();
      return result;
    } catch (error) {
      showError(error instanceof Error ? error : new Error('Operation failed'), {
        context: context || 'Async Operation',
        toast: true
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [showError, clearError]);

  return {
    loading,
    error,
    isError,
    execute,
    clearError
  };
}

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Standard error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Network connection failed. Please check your internet connection.',
  BACKEND_UNAVAILABLE: 'Backend server is not available. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  FILE_UPLOAD: 'File upload failed. Please check the file format and size.',
  DATA_LOAD: 'Failed to load data. Please refresh the page.',
  SAVE_FAILED: 'Failed to save changes. Please try again.',
  DELETE_FAILED: 'Failed to delete item. Please try again.',
  IMPORT_FAILED: 'Data import failed. Please check the file format.',
  EXPORT_FAILED: 'Data export failed. Please try again.'
} as const;

/**
 * Utility function to create standardized error objects
 */
export function createError(message: string, context?: string, originalError?: Error): Error {
  const error = new Error(message);
  error.name = context || 'ApplicationError';
  
  if (originalError) {
    error.stack = originalError.stack;
    (error as any).originalError = originalError;
  }
  
  return error;
}