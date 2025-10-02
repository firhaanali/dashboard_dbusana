/**
 * 🔧 BACKEND CONNECTION RESOLVER - DISABLED
 * 
 * This resolver has been disabled to prevent health check polling
 * Dashboard now uses simple fallback system without connection monitoring.
 */

interface BackendStatus {
  isOnline: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  maxRetries: number;
}

class BackendConnectionResolver {
  private status: BackendStatus = {
    isOnline: false,
    lastCheck: new Date(),
    consecutiveFailures: 0,
    maxRetries: 3
  };

  private baseUrl = 'http://localhost:3001';
  private listeners: ((status: boolean) => void)[] = [];

  /**
   * Initialize connection monitoring - DISABLED
   */
  initialize() {
    console.log('🔧 Backend Connection Resolver - DISABLED');
    console.log('📋 Dashboard will use fallback data when backend unavailable');
    // No polling, no health checks
  }

  /**
   * Add connection status listener - NO-OP
   */
  addStatusListener(callback: (status: boolean) => void) {
    // No-op
  }

  /**
   * Remove connection status listener - NO-OP
   */
  removeStatusListener(callback: (status: boolean) => void) {
    // No-op
  }

  /**
   * Get current connection status - Always returns offline to use fallback
   */
  getStatus(): BackendStatus {
    return { ...this.status };
  }

  /**
   * Check if backend is currently online - Always returns false to use fallback
   */
  isOnline(): boolean {
    return false;
  }

  /**
   * Force connection check - NO-OP
   */
  async forceCheck(): Promise<boolean> {
    return false;
  }

  /**
   * Enhanced API request with fallback handling - SIMPLIFIED
   */
  async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    fallbackData?: T
  ): Promise<T | null> {
    // Always return fallback data if available
    if (fallbackData !== undefined) {
      console.log(`📋 Using fallback data for ${endpoint} (resolver disabled)`);
      return fallbackData;
    }
    
    return null;
  }

  /**
   * Cleanup resources - NO-OP
   */
  cleanup() {
    // No-op
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(): string {
    return 'Backend connection monitoring disabled - using fallback data';
  }

  /**
   * Get startup instructions
   */
  getStartupInstructions(): string[] {
    return [
      'Backend connection resolver telah dinonaktifkan.',
      'Dashboard menggunakan fallback data secara otomatis.',
      '',
      'Untuk menggunakan data real:',
      '1. cd backend',
      '2. npm start',
      '3. Data real akan otomatis digunakan jika backend tersedia'
    ];
  }
}

// Create singleton instance
export const backendResolver = new BackendConnectionResolver();

// No auto-initialization
export default backendResolver;