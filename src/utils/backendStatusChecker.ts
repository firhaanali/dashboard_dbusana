/**
 * Simple backend status checker for graceful fallback handling
 */

const BACKEND_URL = 'http://localhost:3001';
const HEALTH_ENDPOINT = `${BACKEND_URL}/health`;

interface BackendStatus {
  isAvailable: boolean;
  lastCheck: Date;
  message: string;
}

let cachedStatus: BackendStatus | null = null;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Check if backend is available
 */
export const checkBackendStatus = async (): Promise<BackendStatus> => {
  // Return cached status if still valid
  if (cachedStatus && (Date.now() - cachedStatus.lastCheck.getTime()) < CACHE_DURATION) {
    return cachedStatus;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(HEALTH_ENDPOINT, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      cachedStatus = {
        isAvailable: true,
        lastCheck: new Date(),
        message: 'Backend connected'
      };
    } else {
      throw new Error(`Health check failed: ${response.status}`);
    }
  } catch (error) {
    cachedStatus = {
      isAvailable: false,
      lastCheck: new Date(),
      message: 'Backend unavailable - using demo data'
    };
  }

  return cachedStatus;
};

/**
 * Make API request with automatic fallback handling
 */
export const apiRequestWithFallback = async (
  endpoint: string,
  options: RequestInit | undefined,
  fallbackData: any
): Promise<{ data: any; fromBackend: boolean }> => {
  const status = await checkBackendStatus();
  
  if (!status.isAvailable) {
    console.log(`📱 Using demo data for ${endpoint}`);
    return { data: fallbackData, fromBackend: false };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const defaultOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-development-only': 'true'
      }
    };

    const mergedOptions: RequestInit = {
      ...defaultOptions,
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultOptions.headers,
        ...(options?.headers || {})
      }
    };

    const response = await fetch(`${BACKEND_URL}/api${endpoint}`, mergedOptions);

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Fetched data from ${endpoint}`);
    return { data: result, fromBackend: true };
  } catch (error: any) {
    console.warn(`⚠️ API fallback for ${endpoint}:`, error?.message || error);
    return { data: fallbackData, fromBackend: false };
  }
};

/**
 * Get current backend status without making a new request
 */
export const getCurrentBackendStatus = (): BackendStatus | null => {
  return cachedStatus;
};

/**
 * Clear cached status to force a fresh check
 */
export const clearBackendStatusCache = (): void => {
  cachedStatus = null;
};