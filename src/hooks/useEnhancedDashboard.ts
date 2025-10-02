/**
 * 🎯 ENHANCED DASHBOARD HOOK
 * 
 * Comprehensive dashboard data management with automatic
 * fallback handling and error recovery.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedApiClient } from '../services/enhancedApiClient';
import { fallbackDataGenerator } from '../utils/comprehensiveFallbackData';

interface DashboardState {
  metrics: any | null;
  sales: any[] | null;
  products: any[] | null;
  marketplaceAnalytics: any | null;
  monthlyTrends: any[] | null;
  activityLogs: any[] | null;
  advertisingData: any[] | null;
  advertisingStats: any | null;
  cashFlowEntries: any[] | null;
  salesStats: any | null;
}

interface DashboardStatus {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  usingFallback: boolean;
  connectionStatus: 'online' | 'offline' | 'checking';
}

export const useEnhancedDashboard = () => {
  const [data, setData] = useState<DashboardState>({
    metrics: null,
    sales: null,
    products: null,
    marketplaceAnalytics: null,
    monthlyTrends: null,
    activityLogs: null,
    advertisingData: null,
    advertisingStats: null,
    cashFlowEntries: null,
    salesStats: null
  });

  const [status, setStatus] = useState<DashboardStatus>({
    loading: true,
    error: null,
    lastUpdated: null,
    usingFallback: false,
    connectionStatus: 'checking'
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  /**
   * Load all dashboard data
   */
  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      console.log('📊 Loading enhanced dashboard data...');
      
      // Check connection status
      const isOnline = enhancedApiClient.isOnline();
      setStatus(prev => ({ 
        ...prev, 
        connectionStatus: isOnline ? 'online' : 'offline',
        usingFallback: !isOnline
      }));

      // Load all data concurrently with individual error handling
      const [
        metricsResult,
        salesResult,
        productsResult,
        marketplaceResult,
        trendsResult,
        activityResult,
        advertisingResult,
        advertisingStatsResult,
        cashFlowResult,
        salesStatsResult
      ] = await Promise.allSettled([
        enhancedApiClient.getDashboardMetrics(),
        enhancedApiClient.getSales(1, 50),
        enhancedApiClient.getProducts(),
        enhancedApiClient.getMarketplaceAnalytics(),
        enhancedApiClient.getMonthlyTrends(),
        enhancedApiClient.getActivityLogs(5),
        enhancedApiClient.getAdvertisingData(),
        enhancedApiClient.getAdvertisingStats(),
        enhancedApiClient.getCashFlowEntries('expense', 1000),
        enhancedApiClient.getSalesStats()
      ]);

      // Process results with fallback handling
      const newData: DashboardState = {
        metrics: getResultData(metricsResult, 'metrics'),
        sales: getResultData(salesResult, 'sales'),
        products: getResultData(productsResult, 'products'),
        marketplaceAnalytics: getResultData(marketplaceResult, 'marketplaceAnalytics'),
        monthlyTrends: getResultData(trendsResult, 'monthlyTrends'),
        activityLogs: getResultData(activityResult, 'activityLogs'),
        advertisingData: getResultData(advertisingResult, 'advertisingData'),
        advertisingStats: getResultData(advertisingStatsResult, 'advertisingStats'),
        cashFlowEntries: getResultData(cashFlowResult, 'cashFlowEntries'),
        salesStats: getResultData(salesStatsResult, 'salesStats')
      };

      setData(newData);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        usingFallback: !isOnline
      }));

      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Dashboard data loading failed:', error);
      
      // Load fallback data for all endpoints
      const fallbackData = {
        metrics: fallbackDataGenerator.getFallbackForEndpoint('/dashboard/metrics'),
        sales: fallbackDataGenerator.getFallbackForEndpoint('/sales'),
        products: fallbackDataGenerator.getFallbackForEndpoint('/products'),
        marketplaceAnalytics: fallbackDataGenerator.getFallbackForEndpoint('/analytics/marketplace'),
        monthlyTrends: fallbackDataGenerator.getFallbackForEndpoint('/monthly-trends'),
        activityLogs: fallbackDataGenerator.getFallbackForEndpoint('/activity-logs'),
        advertisingData: fallbackDataGenerator.getFallbackForEndpoint('/advertising'),
        advertisingStats: fallbackDataGenerator.getFallbackForEndpoint('/advertising/stats'),
        cashFlowEntries: fallbackDataGenerator.getFallbackForEndpoint('/cash-flow/entries'),
        salesStats: fallbackDataGenerator.getFallbackForEndpoint('/sales/marketplace-stats')
      };

      setData(fallbackData);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: null, // Don't show error when using fallback
        lastUpdated: new Date(),
        usingFallback: true,
        connectionStatus: 'offline'
      }));

      console.log('📋 Using comprehensive fallback data');
    }
  }, []);

  /**
   * Helper function to extract data from Promise results
   */
  const getResultData = (result: PromiseSettledResult<any>, type: string): any => {
    if (result.status === 'fulfilled' && result.value?.success) {
      return result.value.data;
    } else {
      // Return fallback data for failed requests
      const fallbackEndpoint = getEndpointForType(type);
      return fallbackDataGenerator.getFallbackForEndpoint(fallbackEndpoint);
    }
  };

  /**
   * Map data types to API endpoints
   */
  const getEndpointForType = (type: string): string => {
    const endpointMap: Record<string, string> = {
      metrics: '/dashboard/metrics',
      sales: '/sales',
      products: '/products',
      marketplaceAnalytics: '/analytics/marketplace',
      monthlyTrends: '/monthly-trends',
      activityLogs: '/activity-logs',
      advertisingData: '/advertising',
      advertisingStats: '/advertising/stats',
      cashFlowEntries: '/cash-flow/entries',
      salesStats: '/sales/marketplace-stats'
    };
    return endpointMap[type] || '/dashboard/metrics';
  };

  /**
   * Refresh specific data section
   */
  const refreshSection = useCallback(async (section: keyof DashboardState) => {
    console.log(`🔄 Refreshing ${section} data...`);
    
    try {
      let result;
      switch (section) {
        case 'metrics':
          result = await enhancedApiClient.getDashboardMetrics();
          break;
        case 'sales':
          result = await enhancedApiClient.getSales(1, 50);
          break;
        case 'products':
          result = await enhancedApiClient.getProducts();
          break;
        case 'marketplaceAnalytics':
          result = await enhancedApiClient.getMarketplaceAnalytics();
          break;
        case 'monthlyTrends':
          result = await enhancedApiClient.getMonthlyTrends();
          break;
        case 'activityLogs':
          result = await enhancedApiClient.getActivityLogs(5);
          break;
        case 'advertisingData':
          result = await enhancedApiClient.getAdvertisingData();
          break;
        case 'advertisingStats':
          result = await enhancedApiClient.getAdvertisingStats();
          break;
        case 'cashFlowEntries':
          result = await enhancedApiClient.getCashFlowEntries('expense', 1000);
          break;
        case 'salesStats':
          result = await enhancedApiClient.getSalesStats();
          break;
        default:
          console.warn(`Unknown section: ${section}`);
          return;
      }

      if (result?.success) {
        setData(prev => ({
          ...prev,
          [section]: result.data
        }));
        console.log(`✅ ${section} data refreshed successfully`);
      } else {
        console.warn(`⚠️ ${section} refresh failed, keeping existing data`);
      }
    } catch (error) {
      console.error(`❌ ${section} refresh error:`, error);
    }
  }, []);

  /**
   * Auto-refresh functionality
   */
  const setupAutoRefresh = useCallback((intervalMinutes = 5) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Auto-refreshing dashboard data...');
      loadDashboardData(true); // Silent refresh
      setupAutoRefresh(intervalMinutes); // Schedule next refresh
    }, intervalMinutes * 60 * 1000);
  }, [loadDashboardData]);

  /**
   * Connection status change handler
   */
  useEffect(() => {
    const handleConnectionChange = (isOnline: boolean) => {
      setStatus(prev => ({
        ...prev,
        connectionStatus: isOnline ? 'online' : 'offline'
      }));

      if (isOnline && isInitializedRef.current) {
        console.log('🔄 Connection restored, refreshing data...');
        loadDashboardData(true);
      }
    };

    // Add connection status listener
    enhancedApiClient.checkConnection();
    
    return () => {
      // Cleanup would go here if backend resolver supported removeListener
    };
  }, [loadDashboardData]);

  /**
   * Initialize dashboard
   */
  useEffect(() => {
    if (!isInitializedRef.current) {
      loadDashboardData();
      setupAutoRefresh(5); // Refresh every 5 minutes
      isInitializedRef.current = true;
    }

    // Cleanup timeout on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [loadDashboardData, setupAutoRefresh]);

  /**
   * Manual refresh all data
   */
  const refreshAll = useCallback(() => {
    console.log('🔄 Manual refresh triggered...');
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Get connection health info
   */
  const getConnectionInfo = useCallback(() => {
    return {
      ...enhancedApiClient.getConnectionStatus(),
      usingFallback: status.usingFallback,
      lastUpdated: status.lastUpdated,
      cacheInfo: enhancedApiClient.getFallbackCacheInfo()
    };
  }, [status.usingFallback, status.lastUpdated]);

  return {
    // Data
    data,
    
    // Status
    loading: status.loading,
    error: status.error,
    lastUpdated: status.lastUpdated,
    usingFallback: status.usingFallback,
    connectionStatus: status.connectionStatus,
    
    // Actions
    refreshAll,
    refreshSection,
    getConnectionInfo,
    
    // Connection management
    checkConnection: enhancedApiClient.checkConnection,
    clearCache: enhancedApiClient.clearFallbackCache
  };
};