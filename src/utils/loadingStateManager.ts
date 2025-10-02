/**
 * Loading State Manager
 * Provides consistent loading state patterns across the application
 */

export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
  error?: string;
}

export interface LoadingConfig {
  minDuration?: number; // Minimum loading duration in ms
  showProgress?: boolean;
  showText?: boolean;
  gracefulTransition?: boolean;
}

export class LoadingStateManager {
  private static defaultConfig: LoadingConfig = {
    minDuration: 300,
    showProgress: false,
    showText: true,
    gracefulTransition: true
  };

  static createInitialState(loading = false): LoadingState {
    return {
      isLoading: loading,
      loadingText: undefined,
      progress: undefined,
      error: undefined
    };
  }

  static createLoadingState(text?: string, progress?: number): LoadingState {
    return {
      isLoading: true,
      loadingText: text,
      progress,
      error: undefined
    };
  }

  static createErrorState(error: string): LoadingState {
    return {
      isLoading: false,
      loadingText: undefined,
      progress: undefined,
      error
    };
  }

  static createSuccessState(): LoadingState {
    return {
      isLoading: false,
      loadingText: undefined,
      progress: undefined,
      error: undefined
    };
  }

  static async withMinDuration<T>(
    promise: Promise<T>,
    minDuration: number = this.defaultConfig.minDuration!
  ): Promise<T> {
    const startTime = Date.now();
    const result = await promise;
    const elapsed = Date.now() - startTime;
    
    if (elapsed < minDuration) {
      await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
    }
    
    return result;
  }

  static getLoadingText(operation: string, entityType?: string): string {
    const operations: Record<string, string> = {
      'loading': 'Loading',
      'saving': 'Saving',
      'deleting': 'Deleting',
      'updating': 'Updating',
      'creating': 'Creating',
      'importing': 'Importing',
      'exporting': 'Exporting',
      'processing': 'Processing',
      'analyzing': 'Analyzing',
      'calculating': 'Calculating',
      'fetching': 'Fetching',
      'searching': 'Searching'
    };

    const baseText = operations[operation.toLowerCase()] || 'Loading';
    
    if (entityType) {
      return `${baseText} ${entityType}...`;
    }
    
    return `${baseText}...`;
  }

  static getErrorMessage(operation: string, entityType?: string, error?: any): string {
    const baseError = `Failed to ${operation.toLowerCase()}`;
    
    if (entityType) {
      const errorText = `${baseError} ${entityType.toLowerCase()}`;
      
      if (error?.message) {
        return `${errorText}: ${error.message}`;
      }
      
      return errorText;
    }
    
    if (error?.message) {
      return `${baseError}: ${error.message}`;
    }
    
    return baseError;
  }
}

// Predefined loading states for common operations
export const LoadingStates = {
  // Data loading
  loadingData: LoadingStateManager.createLoadingState('Loading data...'),
  loadingDashboard: LoadingStateManager.createLoadingState('Loading dashboard...'),
  loadingAnalytics: LoadingStateManager.createLoadingState('Loading analytics...'),
  loadingReports: LoadingStateManager.createLoadingState('Generating reports...'),
  
  // CRUD operations
  saving: LoadingStateManager.createLoadingState('Saving changes...'),
  deleting: LoadingStateManager.createLoadingState('Deleting item...'),
  creating: LoadingStateManager.createLoadingState('Creating new item...'),
  updating: LoadingStateManager.createLoadingState('Updating item...'),
  
  // Import/Export
  importing: LoadingStateManager.createLoadingState('Importing data...'),
  exporting: LoadingStateManager.createLoadingState('Exporting data...'),
  
  // Calculations
  calculating: LoadingStateManager.createLoadingState('Calculating metrics...'),
  processing: LoadingStateManager.createLoadingState('Processing request...'),
  analyzing: LoadingStateManager.createLoadingState('Analyzing data...'),
  
  // Search
  searching: LoadingStateManager.createLoadingState('Searching...'),
  
  // Success state
  success: LoadingStateManager.createSuccessState()
};

export default LoadingStateManager;