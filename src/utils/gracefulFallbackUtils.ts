// Graceful fallback utilities for handling API failures gracefully

import { toast } from 'sonner@2.0.3';

interface FallbackOptions {
  showUserMessage?: boolean;
  logToConsole?: boolean;
  component?: string;
  operation?: string;
}

interface FallbackResult<T> {
  success: boolean;
  data?: T;
  isDemo?: boolean;
  error?: string;
}

// Generic fallback handler
export const withGracefulFallback = async <T>(
  primaryOperation: () => Promise<T>,
  fallbackData: T,
  options: FallbackOptions = {}
): Promise<FallbackResult<T>> => {
  const {
    showUserMessage = false,
    logToConsole = true,
    component = 'Component',
    operation = 'operation'
  } = options;

  try {
    console.log(`🔄 Attempting ${operation} for ${component}...`);
    
    const result = await primaryOperation();
    
    console.log(`✅ ${operation} successful for ${component}`);
    
    return {
      success: true,
      data: result,
      isDemo: false
    };
    
  } catch (error) {
    if (logToConsole) {
      console.warn(`⚠️ ${operation} failed for ${component}, using fallback:`, error);
    }

    // Only show user message if explicitly requested and it's an important operation
    if (showUserMessage) {
      toast.info(`📊 ${component} loaded in offline mode`, {
        description: 'Backend connection unavailable - showing cached data'
      });
    }

    return {
      success: true,
      data: fallbackData,
      isDemo: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// API-specific fallback handler
export const withApiGracefulFallback = async <T>(
  apiCall: () => Promise<{ success: boolean; data?: T; error?: string }>,
  fallbackData: T,
  options: FallbackOptions = {}
): Promise<FallbackResult<T>> => {
  const {
    showUserMessage = false,
    logToConsole = true,
    component = 'Component',
    operation = 'API call'
  } = options;

  try {
    console.log(`🔄 Making ${operation} for ${component}...`);
    
    const result = await apiCall();
    
    if (result.success && result.data) {
      console.log(`✅ ${operation} successful for ${component}`);
      
      return {
        success: true,
        data: result.data,
        isDemo: false
      };
    } else {
      // API returned error, use fallback
      if (logToConsole) {
        console.warn(`⚠️ ${operation} returned error for ${component}:`, result.error);
      }

      if (showUserMessage) {
        toast.info(`📊 ${component} loaded in offline mode`, {
          description: 'Backend connection unavailable - showing demo data'
        });
      }

      return {
        success: true,
        data: fallbackData,
        isDemo: true,
        error: result.error
      };
    }
    
  } catch (error) {
    if (logToConsole) {
      console.warn(`⚠️ ${operation} failed for ${component}, using fallback:`, error);
    }

    // Only show user message for important components
    if (showUserMessage) {
      toast.info(`📊 ${component} loaded in offline mode`, {
        description: 'Backend connection unavailable - showing demo data'
      });
    }

    return {
      success: true,
      data: fallbackData,
      isDemo: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Silent fallback (no user messages, minimal logging)
export const withSilentFallback = async <T>(
  primaryOperation: () => Promise<T>,
  fallbackData: T,
  operation: string = 'operation'
): Promise<T> => {
  try {
    const result = await primaryOperation();
    console.log(`✅ ${operation} completed successfully`);
    return result;
  } catch (error) {
    console.log(`💡 ${operation} unavailable, using fallback data`);
    return fallbackData;
  }
};

// Network status checker
export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'x-development-only': 'true'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Enhanced error handler for user-facing messages
export const handleUserFacingError = (
  error: any,
  component: string,
  fallbackAction?: string
): void => {
  console.error(`❌ Error in ${component}:`, error);
  
  // Don't show technical error details to users
  if (fallbackAction) {
    toast.info(`📊 ${component} working in offline mode`, {
      description: fallbackAction
    });
  } else {
    toast.info('Working in offline mode', {
      description: 'Some features may show cached data'
    });
  }
};

// Connection status tracker (for optional status indicators)
export class ConnectionStatusTracker {
  private isOnline = true;
  private lastCheck = Date.now();
  private checkInterval = 30000; // 30 seconds
  
  async getStatus(): Promise<{ online: boolean; lastCheck: number }> {
    const now = Date.now();
    
    // Only check if enough time has passed
    if (now - this.lastCheck > this.checkInterval) {
      this.isOnline = await checkNetworkStatus();
      this.lastCheck = now;
    }
    
    return {
      online: this.isOnline,
      lastCheck: this.lastCheck
    };
  }
  
  async forceCheck(): Promise<boolean> {
    this.isOnline = await checkNetworkStatus();
    this.lastCheck = Date.now();
    return this.isOnline;
  }
}

export const globalConnectionTracker = new ConnectionStatusTracker();

// Demo data generators (to be extended as needed)
export const generateDemoEmptyState = <T>(type: string): T[] => {
  console.log(`📊 Generating empty demo state for ${type}`);
  return [];
};

export const generateDemoError = (operation: string): Error => {
  return new Error(`Demo mode: ${operation} not available offline`);
};

// Utility to determine if we should show offline indicators
export const shouldShowOfflineIndicator = (component: string): boolean => {
  // Only show for critical components that users need to know are offline
  const criticalComponents = ['Dashboard', 'Sales', 'Products', 'Reports'];
  return criticalComponents.some(critical => 
    component.toLowerCase().includes(critical.toLowerCase())
  );
};