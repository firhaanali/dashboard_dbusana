import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { makeSimpleApiRequest } from '../utils/simpleApiUtils';

interface SalesData {
  id: string;
  order_id: string;
  customer: string;
  product_name: string;
  quantity: number;
  order_amount: number;
  total_revenue: number;
  settlement_amount: number;
  hpp: number;
  marketplace: string;
  delivered_time: string;
  created_time: string;
  [key: string]: any;
}

interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  totalQuantity: number;
  averageOrderValue: number;
  marketplaceBreakdown: Record<string, any>;
}

interface SalesContextType {
  salesData: SalesData[];
  salesSummary: SalesSummary | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshSalesData: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function useSalesData() {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSalesData must be used within a SalesProvider');
  }
  return context;
}

interface SalesProviderProps {
  children: ReactNode;
}

export function SalesProvider({ children }: SalesProviderProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const calculateSummary = (data: SalesData[]): SalesSummary => {
    const uniqueOrders = new Set(data.map(item => item.order_id)).size;
    const totalRevenue = data.reduce((sum, item) => sum + (item.settlement_amount || item.total_revenue || item.order_amount || 0), 0);
    const totalHPP = data.reduce((sum, item) => sum + (item.hpp || 0), 0);
    const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Marketplace breakdown
    const marketplaceStats = data.reduce((acc, item) => {
      const marketplace = item.marketplace || 'Unknown';
      if (!acc[marketplace]) {
        acc[marketplace] = {
          sales: 0,
          revenue: 0,
          orders: new Set(),
          quantity: 0
        };
      }
      acc[marketplace].sales += 1;
      acc[marketplace].revenue += item.settlement_amount || item.total_revenue || item.order_amount || 0;
      acc[marketplace].orders.add(item.order_id);
      acc[marketplace].quantity += item.quantity || 0;
      return acc;
    }, {} as Record<string, any>);

    // Convert Sets to numbers for final result
    Object.keys(marketplaceStats).forEach(key => {
      marketplaceStats[key].orders = marketplaceStats[key].orders.size;
    });

    return {
      totalSales: data.length,
      totalOrders: uniqueOrders,
      totalRevenue,
      totalProfit: totalRevenue - totalHPP,
      totalQuantity,
      averageOrderValue: uniqueOrders > 0 ? totalRevenue / uniqueOrders : 0,
      marketplaceBreakdown: marketplaceStats
    };
  };

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Direct API call to sales endpoint
      const result = await makeSimpleApiRequest('/sales');
      
      if (result.success && result.data && Array.isArray(result.data)) {
        const data = result.data;
        setSalesData(data);
        setSalesSummary(calculateSummary(data));
        setLastUpdated(new Date());
        
        console.log(`✅ SalesProvider: Loaded ${data.length} sales records`);
      } else {
        // Set empty data if no data available but don't show error prominently 
        console.log('ℹ️ SalesProvider: Backend not available, using empty data');
        setSalesData([]);
        setSalesSummary({
          totalSales: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalQuantity: 0,
          averageOrderValue: 0,
          marketplaceBreakdown: {}
        });
        // Don't set error for backend unavailability - this is expected behavior
        if (result.error && !result.error.includes('Backend') && !result.error.includes('fallback')) {
          setError(result.error);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ SalesProvider: Error fetching sales data:', errorMessage);
      
      // Set empty data on error
      setSalesData([]);
      setSalesSummary({
        totalSales: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
        totalQuantity: 0,
        averageOrderValue: 0,
        marketplaceBreakdown: {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSalesData = async () => {
    await fetchSalesData();
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const contextValue: SalesContextType = {
    salesData,
    salesSummary,
    isLoading,
    error,
    lastUpdated,
    refreshSalesData
  };

  return (
    <SalesContext.Provider value={contextValue}>
      {children}
    </SalesContext.Provider>
  );
}