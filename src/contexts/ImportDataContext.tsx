import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';
import { importDataReducer, initialState } from './importDataReducer';
import { DashboardMetricsCalculator } from './dashboardMetricsCalculator';
import type { 
  ImportDataContextType, 
  ImportedProductData, 
  ImportStats,
  SalesDataRow 
} from './importDataTypes';

const ImportDataContext = createContext<ImportDataContextType | undefined>(undefined);

// Provider component
interface ImportDataProviderProps {
  children: ReactNode;
}

export function ImportDataProvider({ children }: ImportDataProviderProps) {
  const [state, dispatch] = useReducer(importDataReducer, initialState);

  // Load products and sales data from database on mount (graceful fallback)
  useEffect(() => {
    const loadDataFromDatabase = async () => {
      try {
        console.log('🔄 Attempting to load data from backend...');
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Load products
        const productsResponse = await api.getProducts();
        
        if (productsResponse.success) {
          const productsData = productsResponse.data || [];
          const totalCount = productsResponse.count !== undefined ? productsResponse.count : productsData.length;
          
          console.log('✅ Successfully loaded products from backend:', totalCount);
          
          const productStats = {
            totalRecords: totalCount,
            validRecords: totalCount,
            invalidRecords: 0,
            importedRecords: totalCount,
            lastImportDate: new Date().toISOString(),
            fileName: 'Backend Database',
            fileType: 'database' as 'excel' | 'csv'
          };
          
          dispatch({ 
            type: 'SET_PRODUCT_DATA', 
            payload: { 
              data: productsData, 
              stats: productStats 
            } 
          });
        } else {
          // If backend is not available, initialize with empty data
          console.log('ℹ️ Backend not available - initializing with empty product data');
          dispatch({ 
            type: 'SET_PRODUCT_DATA', 
            payload: { 
              data: [], 
              stats: {
                totalRecords: 0,
                validRecords: 0,
                invalidRecords: 0,
                importedRecords: 0,
                lastImportDate: new Date().toISOString(),
                fileName: 'No Backend Connection',
                fileType: 'database' as 'excel' | 'csv'
              } 
            } 
          });
        }

        // Note: Sales data is now handled by SalesProvider context
        // This avoids redundant API calls - ImportDataContext only manages products
        console.log('ℹ️ Sales data is handled by SalesProvider to avoid redundant API calls');
        
      } catch (error) {
        // Silent handling of network/connection errors that are expected when backend is not running
        console.log('ℹ️ Backend connection failed, operating in frontend-only mode');
        // Don't log this as an error since it's expected behavior in this environment
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadDataFromDatabase();
  }, []);

  const actions = {
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setSalesData: (data: any[], stats: ImportStats) => 
      dispatch({ type: 'SET_SALES_DATA', payload: { data, stats } }),
    setProductData: (data: ImportedProductData[], stats: ImportStats) => 
      dispatch({ type: 'SET_PRODUCT_DATA', payload: { data, stats } }),
    setStockData: (data: any[], stats: ImportStats) => 
      dispatch({ type: 'SET_STOCK_DATA', payload: { data, stats } }),
    
    // Enhanced addProduct with database sync
    addProduct: async (product: ImportedProductData) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await api.createProduct(product);
        
        if (response.success && response.data) {
          dispatch({ type: 'ADD_PRODUCT', payload: response.data });
          return { success: true, data: response.data };
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to add product' });
          return { success: false, error: response.error };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add product';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    
    // Enhanced updateProduct with database sync
    updateProduct: async (id: string, product: Partial<ImportedProductData>) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await api.updateProduct(id, product);
        
        if (response.success && response.data) {
          dispatch({ type: 'UPDATE_PRODUCT', payload: { id, product: response.data } });
          return { success: true, data: response.data };
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to update product' });
          return { success: false, error: response.error };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    
    // Enhanced deleteProduct with database sync
    deleteProduct: async (id: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await api.deleteProduct(id);
        
        if (response.success) {
          dispatch({ type: 'DELETE_PRODUCT', payload: id });
          return { success: true };
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to delete product' });
          return { success: false, error: response.error };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    
    // Update product stock only (for stock management)
    updateProductStock: (id: string, stock_quantity: number) => {
      dispatch({ type: 'UPDATE_PRODUCT_STOCK', payload: { id, stock_quantity } });
    },
    
    // Frontend-only product management (for import scenarios where backend is not available)
    addProductData: (product: ImportedProductData) => {
      dispatch({ type: 'ADD_PRODUCT', payload: product });
    },
    
    removeProductData: (id: string) => {
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    },
    
    clearSalesData: () => dispatch({ type: 'CLEAR_SALES_DATA' }),
    clearProductData: () => dispatch({ type: 'CLEAR_PRODUCT_DATA' }),
    clearStockData: () => dispatch({ type: 'CLEAR_STOCK_DATA' }),
    clearAllData: () => dispatch({ type: 'CLEAR_ALL_DATA' }),
    updateImportStats: (type: 'sales' | 'products' | 'stock', stats: Partial<ImportStats>) =>
      dispatch({ type: 'UPDATE_IMPORT_STATS', payload: { type, stats } }),
    
    // Refresh data from database
    refreshDataFromDatabase: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Note: Sales data refresh is handled by SalesProvider
        console.log('ℹ️ Sales data refresh is handled by SalesProvider context');
        
        // Refresh products data
        const productsResponse = await api.getProducts();
        
        if (productsResponse.success) {
          const productsData = productsResponse.data || [];
          const totalCount = productsResponse.count !== undefined ? productsResponse.count : productsData.length;
          
          console.log('🔄 Refreshed products data:', totalCount);
          
          const productStats = {
            totalRecords: totalCount,
            validRecords: totalCount,
            invalidRecords: 0,
            importedRecords: totalCount,
            lastImportDate: new Date().toISOString(),
            fileName: 'Backend Database (Refreshed)',
            fileType: 'database' as 'excel' | 'csv'
          };
          
          dispatch({ 
            type: 'SET_PRODUCT_DATA', 
            payload: { 
              data: productsData, 
              stats: productStats 
            } 
          });
        }
        
        return { success: true };
      } catch (error) {
        console.error('❌ Error refreshing data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
  };

  // Create dashboard metrics calculator instance
  const metricsCalculator = new DashboardMetricsCalculator(state);

  // Dashboard integration methods with error handling
  const getDashboardMetrics = () => {
    try {
      return metricsCalculator.getDashboardMetrics();
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error);
      return {
        distinctOrders: 0,
        totalQuantitySold: 0,
        totalRevenue: 0,
        totalProfit: 0,
        totalHPP: 0,
        profitMargin: 0,
        totalSales: 0,
        todayRevenue: 0,
        todaySales: 0,
        todayOrders: 0,
        monthRevenue: 0,
        monthSales: 0,
        monthOrders: 0,
        averageOrderValue: 0,
        totalProducts: 0,
        totalSKUs: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalCategories: 0,
        totalBrands: 0,
        totalColors: 0,
        totalSizes: 0,
      };
    }
  };
  
  const getChartData = (period: '7d' | '30d' | '90d') => {
    try {
      return metricsCalculator.getChartData(period);
    } catch (error) {
      console.error('Error in getChartData:', error);
      return [];
    }
  };
  
  const getCategorySales = () => {
    try {
      return metricsCalculator.getCategorySales();
    } catch (error) {
      console.error('Error in getCategorySales:', error);
      return [];
    }
  };
  
  const getBrandPerformance = () => {
    try {
      return metricsCalculator.getBrandPerformance();
    } catch (error) {
      console.error('Error in getBrandPerformance:', error);
      return [];
    }
  };
  
  const getProductSales = () => {
    try {
      return metricsCalculator.getProductSales();
    } catch (error) {
      console.error('Error in getProductSales:', error);
      return [];
    }
  };
  
  const getSKUPerformance = () => {
    try {
      return metricsCalculator.getSKUPerformance();
    } catch (error) {
      console.error('Error in getSKUPerformance:', error);
      return [];
    }
  };
  
  const getTopProducts = (limit?: number) => {
    try {
      return metricsCalculator.getTopProducts(limit);
    } catch (error) {
      console.error('Error in getTopProducts:', error);
      return [];
    }
  };
  
  const getRecentActivities = (limit?: number) => {
    try {
      return metricsCalculator.getRecentActivities(limit);
    } catch (error) {
      console.error('Error in getRecentActivities:', error);
      return [];
    }
  };
  
  const getKPISummary = () => {
    try {
      return metricsCalculator.getKPISummary();
    } catch (error) {
      console.error('Error in getKPISummary:', error);
      return { orders: 0, productsSold: 0, revenue: 0, profit: 0 };
    }
  };

  // Stock management helper
  const updateProductStock = (id: string, stock_quantity: number) => {
    dispatch({ type: 'UPDATE_PRODUCT_STOCK', payload: { id, stock_quantity } });
  };

  // ✅ Simplified interface compatibility for user request
  const data: SalesDataRow[] = state.salesData;
  const setData = (rows: SalesDataRow[]) => {
    const stats: ImportStats = {
      totalRecords: rows.length,
      validRecords: rows.length,
      invalidRecords: 0,
      importedRecords: rows.length,
      lastImportDate: new Date().toISOString(),
    };
    dispatch({ type: 'SET_SALES_DATA', payload: { data: rows, stats } });
  };

  // ⭐ NEW: File upload functionality for transaction management
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileUpload = async (file: File, importType: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      setIsImporting(true);
      setImportProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      // Map import types to API endpoints
      const endpointMap: { [key: string]: string } = {
        'sales': '/api/import/sales',
        'products': '/api/import/products',
        'stock': '/api/import/stock',
        'advertising': '/api/import/advertising',
        'advertising_settlement': '/api/import/advertising-settlement',
        'returns_and_cancellations': '/api/import/returns-and-cancellations',
        'marketplace_reimbursements': '/api/import/marketplace-reimbursements',
        'commission_adjustments': '/api/import/commission-adjustments',
        'affiliate_samples': '/api/import/affiliate-samples'
      };

      const endpoint = endpointMap[importType];
      if (!endpoint) {
        throw new Error(`Import type "${importType}" is not supported`);
      }

      setImportProgress(25);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      setImportProgress(75);

      const result = await response.json();

      setImportProgress(100);

      if (result.success) {
        // Optionally refresh data based on import type
        if (importType === 'sales') {
          // Sales data is handled by SalesProvider, so we don't need to refresh here
          console.log('✅ Sales import completed, SalesProvider will handle data refresh');
        } else if (importType === 'products') {
          // Refresh product data
          actions.refreshDataFromDatabase?.();
        }

        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || result.message || 'Import failed'
        };
      }

    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const contextValue: ImportDataContextType = {
    state,
    dispatch,
    actions,
    getDashboardMetrics,
    getChartData,
    getCategorySales,
    getBrandPerformance,
    getProductSales,
    getSKUPerformance,
    getTopProducts,
    getRecentActivities,
    getKPISummary,
    updateProductStock,
    data,
    setData,
    handleFileUpload,
    isImporting,
    importProgress,
  };

  return (
    <ImportDataContext.Provider value={contextValue}>
      {children}
    </ImportDataContext.Provider>
  );
}

// ⚠️ DEPRECATED - DO NOT USE IN NEW COMPONENTS
// This context is deprecated and will be removed in future versions.
// Use direct database API calls instead via simpleApiUtils or apiUtils.
export function useImportData() {
  const context = useContext(ImportDataContext);
  if (context === undefined) {
    throw new Error('useImportData must be used within an ImportDataProvider. WARNING: This context is deprecated - use database APIs instead.');
  }
  return context;
}

// Export types for backward compatibility
export type {
  ImportedSalesData,
  ImportedProductData,
  ImportedStockData,
  ImportStats,
  DashboardMetrics,
  ChartDataPoint,
  CategorySales,
  BrandPerformance,
  ProductSales,
  SKUPerformance,
  SalesDataRow
} from './importDataTypes';