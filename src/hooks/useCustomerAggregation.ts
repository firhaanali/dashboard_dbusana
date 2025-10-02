import { useState, useEffect, useCallback } from 'react';
import { AggregatedCustomer } from '../utils/customerAggregationUtils';

interface CustomerAggregationFilters {
  province?: string;
  regency_city?: string;
  date_start?: string;
  date_end?: string;
  customer_type?: 'all' | 'known' | 'unknown';
}

interface CustomerAggregationData {
  customers: AggregatedCustomer[];
  analytics: {
    total_customers: number;
    known_customers: number;
    unknown_customer_groups: number;
    total_unknown_orders: number;
    total_orders: number;
    unknown_orders_percentage: number;
    province_distribution: any[];
    top_customers: AggregatedCustomer[];
  };
  filters_applied: CustomerAggregationFilters;
}

interface CustomerAggregationSummary {
  total_sales_records: number;
  total_unique_customers: number;
  known_customers: number;
  unknown_customer_groups: number;
  unknown_orders_count: number;
  unknown_orders_percentage: number;
  top_unknown_locations: Array<{
    location: string;
    orders: number;
    revenue: number;
  }>;
}

interface CustomerLocations {
  provinces: Array<{
    province: string;
    cities: Array<{
      regency_city: string;
      order_count: number;
    }>;
    total_orders: number;
  }>;
  total_locations: number;
}

export const useCustomerAggregation = (initialFilters?: CustomerAggregationFilters) => {
  const [data, setData] = useState<CustomerAggregationData | null>(null);
  const [summary, setSummary] = useState<CustomerAggregationSummary | null>(null);
  const [locations, setLocations] = useState<CustomerLocations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomerAggregationFilters>(initialFilters || {});

  const fetchCustomerAggregation = useCallback(async (queryFilters?: CustomerAggregationFilters) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = queryFilters || filters;
      const queryParams = new URLSearchParams();

      // Add filters to query params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `http://localhost:3001/api/customer-aggregation?${queryParams.toString()}`,
        {
          headers: {
            'x-development-only': 'true',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        console.log('✅ Customer aggregation data loaded:', {
          totalCustomers: result.data.analytics.total_customers,
          knownCustomers: result.data.analytics.known_customers,
          unknownGroups: result.data.analytics.unknown_customer_groups
        });
      } else {
        throw new Error(result.error || 'Failed to fetch customer aggregation data');
      }
    } catch (err) {
      console.error('❌ Error fetching customer aggregation:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCustomerAggregationSummary = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/customer-aggregation/summary', {
        headers: {
          'x-development-only': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSummary(result.data);
        console.log('✅ Customer aggregation summary loaded:', result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch customer aggregation summary');
      }
    } catch (err) {
      console.error('❌ Error fetching customer aggregation summary:', err);
      // Don't set error for summary - it's optional
    }
  }, []);

  const fetchCustomerLocations = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/customer-aggregation/locations', {
        headers: {
          'x-development-only': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setLocations(result.data);
        console.log('✅ Customer locations loaded:', {
          totalProvinces: result.data.provinces.length,
          totalLocations: result.data.total_locations
        });
      } else {
        throw new Error(result.error || 'Failed to fetch customer locations');
      }
    } catch (err) {
      console.error('❌ Error fetching customer locations:', err);
      // Don't set error for locations - it's optional
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<CustomerAggregationFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchCustomerAggregation(updatedFilters);
  }, [filters, fetchCustomerAggregation]);

  const resetFilters = useCallback(() => {
    const defaultFilters = {};
    setFilters(defaultFilters);
    fetchCustomerAggregation(defaultFilters);
  }, [fetchCustomerAggregation]);

  // Initial data fetch
  useEffect(() => {
    fetchCustomerAggregation();
    fetchCustomerAggregationSummary();
    fetchCustomerLocations();
  }, [fetchCustomerAggregation, fetchCustomerAggregationSummary, fetchCustomerLocations]);

  // Derived state for convenience
  const isLoadingAny = loading;
  const hasData = !!data;
  const hasSummary = !!summary;
  const hasLocations = !!locations;

  // Helper functions
  const getKnownCustomers = () => data?.customers.filter(c => !c.is_aggregated) || [];
  const getUnknownCustomerGroups = () => data?.customers.filter(c => c.is_aggregated) || [];
  
  const getCustomersByProvince = (province: string) => 
    data?.customers.filter(c => c.province === province) || [];
    
  const getTopCustomersByRevenue = (limit: number = 10) => 
    data?.customers
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, limit) || [];

  return {
    // Data
    data,
    summary,
    locations,
    
    // State
    loading: isLoadingAny,
    error,
    filters,
    
    // Computed data
    knownCustomers: getKnownCustomers(),
    unknownCustomerGroups: getUnknownCustomerGroups(),
    
    // Status helpers
    hasData,
    hasSummary,
    hasLocations,
    
    // Actions
    refetch: fetchCustomerAggregation,
    updateFilters,
    resetFilters,
    
    // Helper functions
    getCustomersByProvince,
    getTopCustomersByRevenue,
    
    // Raw fetch functions for manual usage
    fetchCustomerAggregation,
    fetchCustomerAggregationSummary,
    fetchCustomerLocations
  };
};

// Hook for just the summary data (lightweight for dashboard widgets)
export const useCustomerAggregationSummary = () => {
  const [summary, setSummary] = useState<CustomerAggregationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/customer-aggregation/summary', {
        headers: {
          'x-development-only': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSummary(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch customer aggregation summary');
      }
    } catch (err) {
      console.error('❌ Error fetching customer aggregation summary:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
};