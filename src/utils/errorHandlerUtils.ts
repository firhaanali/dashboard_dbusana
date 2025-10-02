// Enhanced error handling utilities for API requests

// Classify and handle different types of errors
export const classifyError = (error) => {
  const errorMessage = error?.message || error?.error || String(error);
  
  // Network/Connection errors
  if (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('Connection refused') ||
    errorMessage.includes('ECONNREFUSED')
  ) {
    return {
      type: 'network',
      message: 'Network connection failed',
      details: errorMessage,
      isRetryable: true,
      userMessage: 'Tidak dapat terhubung ke server. Pastikan koneksi internet Anda stabil.'
    };
  }

  // Backend not available
  if (
    errorMessage.includes('Backend not available') ||
    errorMessage.includes('server is running') ||
    errorMessage.includes('Request timeout') ||
    errorMessage.includes('TimeoutError') ||
    errorMessage.includes('AbortError')
  ) {
    return {
      type: 'backend',
      message: 'Backend server not available',
      details: errorMessage,
      isRetryable: true,
      userMessage: 'Server sedang tidak tersedia. Menggunakan data local sementara.'
    };
  }

  // Authentication errors
  if (
    errorMessage.includes('401') ||
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Authentication')
  ) {
    return {
      type: 'auth',
      message: 'Authentication required',
      details: errorMessage,
      isRetryable: false,
      userMessage: 'Sesi Anda telah berakhir. Silakan login kembali.'
    };
  }

  // Validation errors
  if (
    errorMessage.includes('400') ||
    errorMessage.includes('Bad Request') ||
    errorMessage.includes('validation') ||
    errorMessage.includes('Invalid')
  ) {
    return {
      type: 'validation',
      message: 'Data validation failed',
      details: errorMessage,
      isRetryable: false,
      userMessage: 'Data yang dikirim tidak valid. Periksa kembali input Anda.'
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message: 'Unknown error occurred',
    details: errorMessage,
    isRetryable: false,
    userMessage: 'Terjadi kesalahan tidak terduga. Silakan coba lagi.'
  };
};

// Handle API errors gracefully
export const handleApiError = (error, fallbackData) => {
  const errorInfo = classifyError(error);
  
  // Log the error for debugging
  console.error(`🚨 API Error [${errorInfo.type}]:`, {
    message: errorInfo.message,
    details: errorInfo.details,
    isRetryable: errorInfo.isRetryable
  });

  // For network/backend errors, return fallback data if available
  if ((errorInfo.type === 'network' || errorInfo.type === 'backend') && fallbackData !== undefined) {
    console.info('📦 Using fallback data due to connectivity issues');
    return {
      success: true,
      data: fallbackData,
      isOffline: true,
      errorInfo
    };
  }

  // For other errors, return error response
  return {
    success: false,
    error: errorInfo.userMessage,
    errorInfo,
    data: fallbackData
  };
};

// Retry mechanism for retryable errors
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 API Call attempt ${attempt}/${maxRetries}`);
      const result = await apiCall();
      console.log(`✅ API Call succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      const errorInfo = classifyError(error);
      
      console.warn(`❌ API Call failed on attempt ${attempt}:`, errorInfo.message);
      
      // Don't retry if error is not retryable
      if (!errorInfo.isRetryable || attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      const retryDelay = delay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`⏰ Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError;
};

// Create a safe API wrapper that handles errors gracefully
export const safeApiCall = async (apiCall, fallbackData, options = {}) => {
  const { retries = 0, silent = false, logPrefix = 'API' } = options;

  try {
    let result;
    
    if (retries > 0) {
      result = await retryApiCall(apiCall, retries);
    } else {
      result = await apiCall();
    }

    if (result.success) {
      if (!silent) console.log(`✅ ${logPrefix} call successful`);
      return {
        success: true,
        data: result.data || null
      };
    } else {
      // Handle API errors
      const handled = handleApiError(result.error, fallbackData);
      return {
        success: handled.success,
        data: handled.data || null,
        error: handled.error,
        isOffline: handled.isOffline
      };
    }
  } catch (error) {
    // Handle network/fetch errors
    const handled = handleApiError(error, fallbackData);
    
    if (!silent) {
      console.error(`❌ ${logPrefix} call failed:`, handled.errorInfo?.message);
    }
    
    return {
      success: handled.success,
      data: handled.data || null,
      error: handled.error,
      isOffline: handled.isOffline
    };
  }
};

// Hook-friendly error handler
export const useErrorHandler = () => {
  const handleError = (error, context = 'API') => {
    const errorInfo = classifyError(error);
    
    // Log error with context
    console.error(`🚨 ${context} Error:`, {
      type: errorInfo.type,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      isRetryable: errorInfo.isRetryable
    });
    
    return errorInfo;
  };

  const isNetworkError = (error) => {
    const errorInfo = classifyError(error);
    return errorInfo.type === 'network' || errorInfo.type === 'backend';
  };

  const shouldShowToUser = (error) => {
    const errorInfo = classifyError(error);
    return errorInfo.type !== 'network' && errorInfo.type !== 'backend';
  };

  return {
    handleError,
    isNetworkError,
    shouldShowToUser,
    classifyError
  };
};

// Utility to create default/empty data for different resource types
export const getEmptyData = (resourceType) => {
  const emptyDataMap = {
    sales: { sales: [], total: 0 },
    products: [],
    customers: [],
    analytics: {
      categories: [],
      monthlyTrends: [],
      stock: { totalValue: 0, lowStockCount: 0, outOfStockCount: 0, totalProducts: 0 },
      customers: { totalCustomers: 0, avgOrderValue: 0, totalOrders: 0 }
    },
    dashboard: {
      totalSales: 0,
      totalProducts: 0,
      totalCustomers: 0,
      lowStockProducts: 0,
      revenue: { today: 0, monthly: 0 },
      pendingSales: 0
    },
    marketplace: {
      marketplaces: [],
      summary: {
        totalMarketplaces: 0,
        totalRevenue: 0,
        topMarketplace: 'Belum ada data',
        topMarketplaceRevenue: 0
      }
    },
    chart: [],
    activities: [],
    kpi: {},
    reports: { data: [], summary: {} }
  };

  return emptyDataMap[resourceType] || null;
};

// Debug utility to test error handling
export const testErrorHandling = () => {
  const testErrors = [
    'Failed to fetch',
    'NetworkError when attempting to fetch resource',
    'Backend not available',
    'TypeError: Failed to fetch',
    'Request timeout - backend may not be running',
    '401 Unauthorized',
    '400 Bad Request',
    'Unknown error'
  ];

  console.log('🧪 Testing error classification:');
  
  testErrors.forEach(error => {
    const classified = classifyError(error);
    console.log(`❌ "${error}" → ${classified.type} (${classified.isRetryable ? 'retryable' : 'not retryable'})`);
    console.log(`   User message: ${classified.userMessage}`);
  });
};

// Export for console debugging
if (typeof window !== 'undefined') {
  window.errorHandlerUtils = {
    classifyError,
    handleApiError,
    testErrorHandling,
    getEmptyData
  };
}