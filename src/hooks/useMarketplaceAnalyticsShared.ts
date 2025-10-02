import { useState, useEffect, useCallback, useRef } from 'react';
// API wrapper removed as per cleanup policy
// API monitoring utils removed as per cleanup policy

// Shared state untuk marketplace analytics
class MarketplaceAnalyticsManager {
  private data: any = null;
  private loading: boolean = false;
  private error: string | null = null;
  private listeners: Set<() => void> = new Set();
  private lastFetch: number = 0;
  private cacheDuration: number = 300000; // 5 minutes cache - increased from 60s
  private requestPromise: Promise<any> | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private isInitialized: boolean = false;
  private pendingInitialFetch: boolean = false;

  // Subscribe to changes
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all subscribers
  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Get current state
  getState() {
    return {
      data: this.data,
      loading: this.loading,
      error: this.error
    };
  }

  // Fetch data with deduplication and caching
  async fetchData(force = false, skipIfLoading = true) {
    const now = Date.now();
    
    // Skip if already loading and not forcing
    if (!force && skipIfLoading && this.loading) {
      console.log('🏪 Marketplace analytics already loading, skipping duplicate request');
      return this.getState();
    }
    
    // Return cached data if still valid and not forced
    if (!force && this.data && (now - this.lastFetch) < this.cacheDuration) {
      console.log('🏪 Using cached marketplace analytics data (valid for', Math.round((this.cacheDuration - (now - this.lastFetch)) / 1000), 'more seconds)');
      return this.getState();
    }

    // Return existing promise if already fetching
    if (this.requestPromise) {
      console.log('🏪 Marketplace analytics request already in progress, waiting...');
      try {
        await this.requestPromise;
        return this.getState();
      } catch (error) {
        console.warn('🏪 Existing request failed:', error);
        // Continue with new request
      }
    }

    // Aggressive rate limiting: prevent too frequent requests
    const timeSinceLastFetch = now - this.lastFetch;
    if (!force && timeSinceLastFetch < 30000) { // 30 second minimum interval - increased from 5s
      console.log('🏪 Aggressive rate limiting: Too soon since last fetch, using cached data (', Math.round((30000 - timeSinceLastFetch) / 1000), 's remaining)');
      return this.getState();
    }

    console.log('🏪 Fetching fresh marketplace analytics data');

    this.loading = true;
    this.error = null;
    this.notify();

    // Create and store the request promise
    this.requestPromise = this.performFetch();
    
    try {
      await this.requestPromise;
      this.retryCount = 0; // Reset retry count on success
    } catch (error) {
      console.error('🏪 Marketplace analytics fetch failed:', error);
      this.retryCount++;
    } finally {
      this.requestPromise = null;
    }

    return this.getState();
  }

  private async performFetch() {
    try {
      console.log(`🏪 Marketplace API request (retry: ${this.retryCount})`);
      
      // Import simpleApiUtils dynamically to avoid circular dependency
      const { simpleApiDashboard, simpleApiSales, simpleApiAnalytics } = await import('../utils/simpleApiUtils');
      
      // Try multiple endpoints for marketplace data
      let result;
      
      // First attempt: Dashboard marketplace analytics
      result = await simpleApiDashboard.getMarketplaceAnalytics();
      
      if (!result.success) {
        console.log('🏪 Trying analytics endpoint as fallback...');
        result = await simpleApiAnalytics.getMarketplaceStats();
      }
      
      if (!result.success) {
        console.log('🏪 Trying sales marketplace stats as fallback...');
        result = await simpleApiSales.getMarketplaceStats();
      }
      
      if (result.success && result.data) {
        this.data = result.data;
        this.error = null;
        this.lastFetch = Date.now();
        this.isInitialized = true;
        console.log('✅ Marketplace analytics data loaded at', new Date().toLocaleTimeString());
      } else {
        console.log('❌ All marketplace endpoints failed - no data available');
        this.data = null;
        this.error = result.error || 'No marketplace data available';
      }
    } catch (err) {
      console.log('❌ Marketplace analytics fetch failed:', err);
      this.data = null;
      this.error = err instanceof Error ? err.message : 'Backend connection failed';
    } finally {
      this.loading = false;
      this.pendingInitialFetch = false;
      this.notify();
    }
  }

  // Force refresh
  refresh() {
    console.log('🔄 Force refreshing marketplace analytics');
    this.lastFetch = 0; // Reset last fetch time to bypass cache
    return this.fetchData(true, false);
  }

  // Clear cache
  clearCache() {
    console.log('🗑️ Clearing marketplace analytics cache');
    this.data = null;
    this.lastFetch = 0;
    this.error = null;
    this.retryCount = 0;
    this.isInitialized = false;
    this.pendingInitialFetch = false;
    this.notify();
  }

  // Initialize data if not already done
  async initializeIfNeeded() {
    if (this.isInitialized || this.pendingInitialFetch) {
      return this.getState();
    }
    
    this.pendingInitialFetch = true;
    console.log('🏪 Initializing marketplace analytics data');
    return this.fetchData(false, false);
  }
}

// Create singleton instance
const marketplaceAnalyticsManager = new MarketplaceAnalyticsManager();

// Track hook usage for debugging
let hookUsageCount = 0;
const activeHooks = new Set<string>();

// Hook to use shared marketplace analytics
export function useMarketplaceAnalyticsShared(componentName?: string) {
  const [state, setState] = useState(marketplaceAnalyticsManager.getState());
  const isSubscribed = useRef(true);
  const isMounted = useRef(false);
  const hookId = useRef(`hook-${++hookUsageCount}-${componentName || 'unknown'}`);

  // Track hook usage
  useEffect(() => {
    const id = hookId.current;
    activeHooks.add(id);
    isMounted.current = true;
    
    console.log(`🎣 useMarketplaceAnalyticsShared mounted: ${id}`);
    console.log(`📊 Total active hooks: ${activeHooks.size}`);
    
    return () => {
      activeHooks.delete(id);
      isMounted.current = false;
      console.log(`🎣 useMarketplaceAnalyticsShared unmounted: ${id}`);
      console.log(`📊 Total active hooks: ${activeHooks.size}`);
    };
  }, []);

  // Subscribe to manager updates
  useEffect(() => {
    const unsubscribe = marketplaceAnalyticsManager.subscribe(() => {
      if (isSubscribed.current && isMounted.current) {
        setState(marketplaceAnalyticsManager.getState());
      }
    });

    return () => {
      isSubscribed.current = false;
      unsubscribe();
    };
  }, []);

  // Smart initial fetch - only fetch if this is the first hook or cache is stale
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initializeData = async () => {
      // Add a larger delay to avoid rapid successive calls and prevent polling
      const randomDelay = 1000 + Math.random() * 2000; // 1-3 second random delay
      timeoutId = setTimeout(() => {
        if (isMounted.current) {
          marketplaceAnalyticsManager.initializeIfNeeded();
        }
      }, randomDelay);
    };

    initializeData();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Memoized refetch function
  const refetch = useCallback(() => {
    return marketplaceAnalyticsManager.refresh();
  }, []);

  // Memoized clear cache function
  const clearCache = useCallback(() => {
    marketplaceAnalyticsManager.clearCache();
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    clearCache
  };
}

// Export manager for debugging
export { marketplaceAnalyticsManager };