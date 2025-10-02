/**
 * Simple backend utilities without complex TypeScript generics
 * Fallback for environments where generic syntax causes issues
 */

const BACKEND_URL = 'http://localhost:3001';

export interface ApiResponse {
  data: any;
  fromBackend: boolean;
  error?: string;
}

/**
 * Simple API request with timeout and fallback
 */
export const fetchWithFallback = async (
  endpoint: string,
  fallbackData: any,
  timeoutMs: number = 5000
): Promise<ApiResponse> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(`${BACKEND_URL}/api${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-development-only': 'true'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ API success: ${endpoint}`);
    
    return {
      data,
      fromBackend: true
    };
  } catch (error) {
    console.warn(`⚠️ API fallback: ${endpoint}`, error);
    
    return {
      data: fallbackData,
      fromBackend: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Check if backend is reachable
 */
export const isBackendAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
};