/**
 * Graceful Backend Fallback System
 * Handles backend unavailability gracefully without user-facing errors
 */

export class BackendGracefulFallback {
  private static instance: BackendGracefulFallback | null = null;
  private backendStatus: 'unknown' | 'available' | 'unavailable' = 'unknown';
  private lastCheck = 0;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  static getInstance(): BackendGracefulFallback {
    if (!this.instance) {
      this.instance = new BackendGracefulFallback();
    }
    return this.instance;
  }

  private constructor() {
    // Start with silent check
    this.checkBackendQuietly();
  }

  private async checkBackendQuietly(): Promise<boolean> {
    const now = Date.now();
    
    // Return cached result if recent
    if (this.backendStatus !== 'unknown' && (now - this.lastCheck) < this.CHECK_INTERVAL) {
      return this.backendStatus === 'available';
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Shorter timeout
      
      const response = await fetch('http://localhost:3001/api/status', {
        method: 'GET',
        headers: { 'x-development-only': 'true' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.backendStatus = 'available';
        this.lastCheck = now;
        
        // Only log once when becoming available
        if (this.backendStatus !== 'available') {
          console.log('✅ Backend connection restored');
        }
        return true;
      } else {
        this.backendStatus = 'unavailable';
        this.lastCheck = now;
        return false;
      }
    } catch (error) {
      this.backendStatus = 'unavailable';
      this.lastCheck = now;
      
      // Only log once when becoming unavailable
      if (this.backendStatus === 'available') {
        console.log('ℹ️ Backend unavailable - using offline mode');
      }
      return false;
    }
  }

  public async isBackendAvailable(): Promise<boolean> {
    return this.checkBackendQuietly();
  }

  public getStatus(): 'unknown' | 'available' | 'unavailable' {
    return this.backendStatus;
  }

  public isOfflineMode(): boolean {
    return this.backendStatus === 'unavailable';
  }

  public async ensureFallbackMode(): Promise<void> {
    const isAvailable = await this.checkBackendQuietly();
    if (!isAvailable && this.backendStatus === 'unknown') {
      console.log('🔄 D\'Busana Dashboard running in offline mode with demo data');
    }
  }
}

// Export singleton instance
export const backendGracefulFallback = BackendGracefulFallback.getInstance();

// Simple utility to check if we should use fallback
export const shouldUseFallback = async (): Promise<boolean> => {
  const isAvailable = await backendGracefulFallback.isBackendAvailable();
  return !isAvailable;
};

export default backendGracefulFallback;