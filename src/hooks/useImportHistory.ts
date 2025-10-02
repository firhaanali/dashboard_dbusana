import { useState, useEffect } from 'react';
import { makeApiRequest, createBackendUrl } from '../utils/apiUtils';

export interface ImportHistoryEntry {
  id: string;
  timestamp: string;
  user_id?: string;
  import_type: 'sales' | 'products' | 'stock' | 'advertising';
  file_name?: string;
  file_size?: number;
  total_records: number;
  imported_records: number;
  failed_records: number;
  duplicate_records: number;
  success_rate?: number;
  processing_time_ms?: number;
  import_status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  import_summary?: Record<string, any>;
  created_at: string;
}

export interface ImportHistoryStats {
  total_imports: number;
  total_records_processed: number;
  total_records_imported: number;
  total_failed: number;
  total_duplicates: number;
  average_success_rate: number;
  average_processing_time: number;
}

export interface ImportHistoryResponse {
  success: boolean;
  data: {
    history: ImportHistoryEntry[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    statistics: ImportHistoryStats;
    type_breakdown: Record<string, { count: number; total_imported: number }>;
  };
}

interface UseImportHistoryOptions {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useImportHistory = (options: UseImportHistoryOptions = {}) => {
  const {
    page = 1,
    limit = 20,
    type,
    status,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const [data, setData] = useState<ImportHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (type) params.append('type', type);
      if (status) params.append('status', status);

      const result = await makeApiRequest<any>(`/import-history?${params}`);
      
      if (result.success) {
        setData(result as ImportHistoryResponse);
      } else {
        throw new Error(result.error || 'Failed to fetch import history');
      }
    } catch (err) {
      console.error('Error fetching import history:', err);
      
      // Handle table not found error gracefully
      if (err instanceof Error && err.message.includes('does not exist')) {
        setError('Import history not initialized. Please run database migration.');
        // Set empty data structure for graceful handling
        setData({
          success: true,
          data: {
            history: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limit
            },
            statistics: {
              total_imports: 0,
              total_records_processed: 0,
              total_records_imported: 0,
              total_failed: 0,
              total_duplicates: 0,
              average_success_rate: 0,
              average_processing_time: 0
            },
            type_breakdown: {}
          }
        });
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const createHistoryEntry = async (entry: {
    import_type: string;
    file_name?: string;
    file_size?: number;
    total_records: number;
    imported_records: number;
    failed_records?: number;
    duplicate_records?: number;
    processing_time_ms?: number;
    import_summary?: Record<string, any>;
    user_id?: string;
  }) => {
    try {
      const result = await makeApiRequest<any>('/import-history', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      
      if (result.success) {
        // Refresh the history after creating new entry
        await fetchHistory();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create history entry');
      }
    } catch (err) {
      console.error('Error creating history entry:', err);
      throw err;
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    try {
      const result = await makeApiRequest<any>(`/import-history/${id}`, {
        method: 'DELETE',
      });
      
      if (result.success) {
        // Refresh the history after deletion
        await fetchHistory();
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete history entry');
      }
    } catch (err) {
      console.error('Error deleting history entry:', err);
      throw err;
    }
  };

  const clearHistory = async (options: {
    older_than_days?: number;
    import_type?: string;
    user_id?: string;
  } = {}) => {
    try {
      const result = await makeApiRequest<any>('/import-history/bulk', {
        method: 'DELETE',
        body: JSON.stringify({
          ...options,
          confirm_deletion: true,
        }),
      });
      
      if (result.success) {
        // Refresh the history after bulk deletion
        await fetchHistory();
        return result.data?.deleted_count;
      } else {
        throw new Error(result.error || 'Failed to clear history');
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [page, limit, type, status]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHistory();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    refresh: fetchHistory,
    createHistoryEntry,
    deleteHistoryEntry,
    clearHistory,
    // Derived data for convenience
    history: data?.data?.history || [],
    pagination: data?.data?.pagination,
    statistics: data?.data?.statistics,
    typeBreakdown: data?.data?.type_breakdown || {},
  };
};

// Hook for import history statistics only
export const useImportHistoryStats = (days = 30) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await makeApiRequest<any>(`/import-history/stats?days=${days}`);
      
      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch import history stats');
      }
    } catch (err) {
      console.error('Error fetching import history stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [days]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
};