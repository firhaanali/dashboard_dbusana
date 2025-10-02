import { useState, useEffect, useMemo } from 'react';
import { simpleApiSales } from '../utils/simpleApiUtils';

interface SalesRecord {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  order_amount: number;
  created_time: string;
  delivered_time?: string;
  marketplace?: string;
  settlement_amount?: number;
  hpp?: number;
}

interface ProductAnalyticsData {
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  avgOrderValue: number;
  totalOrders: number;
  marketplaceBreakdown: { [key: string]: { quantity: number; revenue: number } };
  timelineData: { date: string; quantity: number; revenue: number }[];
  periodComparison?: {
    previousPeriod: {
      totalQuantity: number;
      totalRevenue: number;
      totalProfit: number;
    };
    growth: {
      quantity: number;
      revenue: number;
      profit: number;
    };
  };
}

interface DateRange {
  start: Date;
  end: Date;
}

export function useProductAnalytics() {
  const [allSales, setAllSales] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sales data
  const loadSalesData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await simpleApiSales.getAll();
      if (result.success && result.data) {
        setAllSales(result.data);
      } else {
        setError('Failed to load sales data');
      }
    } catch (err) {
      setError('Error loading sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, []);

  // Get unique product names
  const productNames = useMemo(() => {
    return [...new Set(allSales.map(sale => sale.product_name))].sort();
  }, [allSales]);

  // Analyze product for specific period
  const analyzeProduct = useMemo(() => {
    return (productName: string, dateRange: DateRange, includeComparison: boolean = false): ProductAnalyticsData => {
      if (!productName || allSales.length === 0) {
        return {
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0,
          avgOrderValue: 0,
          totalOrders: 0,
          marketplaceBreakdown: {},
          timelineData: []
        };
      }

      // Filter sales for selected product and date range
      const productSales = allSales.filter(sale => {
        const saleDate = new Date(sale.created_time || sale.delivered_time);
        return sale.product_name.toLowerCase().includes(productName.toLowerCase()) &&
               saleDate >= dateRange.start && 
               saleDate <= dateRange.end;
      });

      // Calculate metrics
      const totalQuantity = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
      const totalRevenue = productSales.reduce((sum, sale) => sum + sale.order_amount, 0);
      const totalProfit = productSales.reduce((sum, sale) => {
        const settlement = sale.settlement_amount || sale.order_amount;
        const hpp = sale.hpp || 0;
        return sum + (settlement - hpp);
      }, 0);
      const totalOrders = productSales.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Marketplace breakdown
      const marketplaceBreakdown: { [key: string]: { quantity: number; revenue: number } } = {};
      productSales.forEach(sale => {
        const marketplace = sale.marketplace || 'Unknown';
        if (!marketplaceBreakdown[marketplace]) {
          marketplaceBreakdown[marketplace] = { quantity: 0, revenue: 0 };
        }
        marketplaceBreakdown[marketplace].quantity += sale.quantity;
        marketplaceBreakdown[marketplace].revenue += sale.order_amount;
      });

      // Timeline data
      const timelineMap: { [key: string]: { quantity: number; revenue: number } } = {};
      const periodLengthDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
      
      productSales.forEach(sale => {
        const saleDate = new Date(sale.created_time || sale.delivered_time);
        let key: string;
        
        if (periodLengthDays > 90) {
          // Group by month for long periods
          key = saleDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
        } else if (periodLengthDays > 30) {
          // Group by week for medium periods
          const weekStart = new Date(saleDate);
          weekStart.setDate(saleDate.getDate() - saleDate.getDay());
          key = weekStart.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        } else {
          // Group by day for short periods
          key = saleDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        }

        if (!timelineMap[key]) {
          timelineMap[key] = { quantity: 0, revenue: 0 };
        }
        timelineMap[key].quantity += sale.quantity;
        timelineMap[key].revenue += sale.order_amount;
      });

      const timelineData = Object.entries(timelineMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let periodComparison;
      if (includeComparison) {
        // Calculate previous period data for comparison
        const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
        const previousStart = new Date(dateRange.start.getTime() - periodLength);
        const previousEnd = new Date(dateRange.start.getTime());

        const previousPeriodSales = allSales.filter(sale => {
          const saleDate = new Date(sale.created_time || sale.delivered_time);
          return sale.product_name.toLowerCase().includes(productName.toLowerCase()) &&
                 saleDate >= previousStart && 
                 saleDate < previousEnd;
        });

        const previousQuantity = previousPeriodSales.reduce((sum, sale) => sum + sale.quantity, 0);
        const previousRevenue = previousPeriodSales.reduce((sum, sale) => sum + sale.order_amount, 0);
        const previousProfit = previousPeriodSales.reduce((sum, sale) => {
          const settlement = sale.settlement_amount || sale.order_amount;
          const hpp = sale.hpp || 0;
          return sum + (settlement - hpp);
        }, 0);

        periodComparison = {
          previousPeriod: {
            totalQuantity: previousQuantity,
            totalRevenue: previousRevenue,
            totalProfit: previousProfit
          },
          growth: {
            quantity: previousQuantity > 0 ? ((totalQuantity - previousQuantity) / previousQuantity) * 100 : 0,
            revenue: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0,
            profit: Math.abs(previousProfit) > 0 ? ((totalProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0
          }
        };
      }

      return {
        totalQuantity,
        totalRevenue,
        totalProfit,
        avgOrderValue,
        totalOrders,
        marketplaceBreakdown,
        timelineData,
        periodComparison
      };
    };
  }, [allSales]);

  // Get top performing products
  const getTopProducts = useMemo(() => {
    return (limit: number = 10, dateRange?: DateRange) => {
      let salesData = allSales;
      
      if (dateRange) {
        salesData = allSales.filter(sale => {
          const saleDate = new Date(sale.created_time || sale.delivered_time);
          return saleDate >= dateRange.start && saleDate <= dateRange.end;
        });
      }

      const productStats: { [key: string]: { quantity: number; revenue: number; orders: number } } = {};
      
      salesData.forEach(sale => {
        const productName = sale.product_name;
        if (!productStats[productName]) {
          productStats[productName] = { quantity: 0, revenue: 0, orders: 0 };
        }
        productStats[productName].quantity += sale.quantity;
        productStats[productName].revenue += sale.order_amount;
        productStats[productName].orders += 1;
      });

      return Object.entries(productStats)
        .map(([name, stats]) => ({
          productName: name,
          ...stats,
          avgOrderValue: stats.orders > 0 ? stats.revenue / stats.orders : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    };
  }, [allSales]);

  return {
    allSales,
    loading,
    error,
    productNames,
    analyzeProduct,
    getTopProducts,
    loadSalesData
  };
}