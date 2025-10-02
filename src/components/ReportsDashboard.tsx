import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  FileBarChart,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Grid,
  List,
  BarChart3,
  Database,
  Target,
  Minus
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { DateRangePicker } from './DateRangePicker';
import { filterDataByDateRange } from '../utils/dateRangeUtils';
import { enhancedApi } from '../utils/enhancedApiWrapper';
import { cn } from './ui/utils';

// Import DateRange interface from utils to ensure consistency
import { DateRange } from '../utils/dateRangeUtils';

// Interfaces

interface SalesReportData {
  date: string;
  revenue: number;
  orders: number;
  quantity: number;
  profit: number;
  net_profit: number;
  marketplace_breakdown?: Record<string, number>;
  product_breakdown?: Record<string, number>;
}

interface ProductReportData {
  product_name: string;
  total_sold: number;
  total_revenue: number;
  total_profit: number;
  net_profit: number;
  avg_price: number;
  stock_current: number;
  stock_min: number;
}

interface MarketplaceReportData {
  marketplace: string;
  total_orders: number;
  total_revenue: number;
  total_profit: number;
  net_profit: number;
  avg_order_value: number;
  percentage_share: number;
}

interface AdvertisingData {
  cost: number;
  date_range_start: string;
  date_range_end: string;
  platform: string;
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(Math.round(num));
};

// Colors for charts
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

// Color classes mapping for Tailwind V4 compatibility with proper theme support
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-600 dark:text-blue-400' },
    green: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-600 dark:text-green-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-600 dark:text-purple-400' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-600 dark:text-orange-400' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-950', text: 'text-pink-600 dark:text-pink-400' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950', text: 'text-indigo-600 dark:text-indigo-400' },
    red: { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-600 dark:text-red-400' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-600 dark:text-yellow-400' }
  };
  return colorMap[color] || { bg: 'bg-muted', text: 'text-muted-foreground' };
};

export function ReportsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Data states
  const [allSalesData, setAllSalesData] = useState<any[]>([]);
  const [allProductsData, setAllProductsData] = useState<any[]>([]);
  const [advertisingData, setAdvertisingData] = useState<AdvertisingData[]>([]);
  
  // Processed data based on filters
  const [processedSalesData, setProcessedSalesData] = useState<SalesReportData[]>([]);
  const [productReports, setProductReports] = useState<ProductReportData[]>([]);
  const [marketplaceReports, setMarketplaceReports] = useState<MarketplaceReportData[]>([]);

  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGenerating, setIsGenerating] = useState(false);

  // New date range state - Default to "All Data" (no date filter)
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined, 
    to: undefined 
  });
  
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Load ALL data initially - Real data implementation
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Reports - Loading real data from API...');

      // Parallel API calls for better performance
      const [salesResponse, productsResponse, advertisingResponse] = await Promise.allSettled([
        enhancedApi.sales.getAll(),
        enhancedApi.products.getAll(),
        enhancedApi.advertising.getAll()
      ]);

      // Handle sales data
      if (salesResponse.status === 'fulfilled' && salesResponse.value.success) {
        const salesData = salesResponse.value.data || [];
        setAllSalesData(salesData);
        console.log(`✅ Loaded ${salesData.length} sales records`);
      } else {
        console.warn('⚠️ Sales data not available, using empty array');
        setAllSalesData([]);
      }

      // Handle products data
      if (productsResponse.status === 'fulfilled' && productsResponse.value.success) {
        const productsData = productsResponse.value.data || [];
        setAllProductsData(productsData);
        console.log(`✅ Loaded ${productsData.length} products records`);
      } else {
        console.warn('⚠️ Products data not available, using empty array');
        setAllProductsData([]);
      }

      // Handle advertising data
      if (advertisingResponse.status === 'fulfilled' && advertisingResponse.value.success) {
        const advertisingData = advertisingResponse.value.data || [];
        setAdvertisingData(advertisingData);
        console.log(`✅ Loaded ${advertisingData.length} advertising records`);
      } else {
        console.warn('⚠️ Advertising data not available, using empty array');
        setAdvertisingData([]);
      }

      setLastUpdated(new Date());
      console.log('✅ Reports data loading completed');

    } catch (err) {
      console.error('❌ Error loading reports data:', err);
      setError('Failed to load reports data. Please try refreshing.');
      // Set empty arrays on error
      setAllSalesData([]);
      setAllProductsData([]);
      setAdvertisingData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Get latest data date for calendar component
  const getLatestDataDate = () => {
    if (allSalesData.length === 0) return new Date();
    
    // Find the latest delivered_time from sales data
    const latestDate = allSalesData.reduce((latest, sale) => {
      const saleDate = new Date(sale.delivered_time || sale.created_time);
      return saleDate > latest ? saleDate : latest;
    }, new Date(0));
    
    return latestDate.getTime() > 0 ? latestDate : new Date();
  };

  // Handle date range change
  const handleDateRangeChange = (newRange: DateRange) => {
    console.log('📅 Reports date range changed:', {
      from: newRange.from?.toLocaleDateString('id-ID'),
      to: newRange.to?.toLocaleDateString('id-ID'),
      isAllData: !newRange.from && !newRange.to
    });
    setDateRange(newRange);
  };

  // Filter sales data based on date range
  const filteredSalesData = useMemo(() => {
    if (allSalesData.length === 0) return [];
    
    // If no date range is set, return all data
    if (!dateRange.from && !dateRange.to) {
      return allSalesData;
    }
    
    // Filter data by date range
    return filterDataByDateRange(allSalesData, dateRange);
  }, [allSalesData, dateRange]);

  // Calculate total marketing costs for period
  const calculateMarketingCosts = useMemo(() => {
    if (advertisingData.length === 0) return 0;
    
    return advertisingData.reduce((total, ad) => {
      return total + (Number(ad.cost) || 0);
    }, 0);
  }, [advertisingData]);

  // Calculate settlement costs
  const calculateSettlementCosts = useMemo(() => {
    if (filteredSalesData.length === 0) return 0;
    
    return filteredSalesData.reduce((total, sale) => {
      return total + (Number(sale.settlement_amount) || 0);
    }, 0);
  }, [filteredSalesData]);

  // Process sales data for reporting
  const processSalesData = useMemo(() => {
    if (filteredSalesData.length === 0) return [];
    
    // Group data by date based on granularity
    const groupedData: Record<string, any> = {};
    
    filteredSalesData.forEach(sale => {
      const saleDate = new Date(sale.delivered_time || sale.created_time);
      let dateKey: string;
      
      switch (granularity) {
        case 'weekly':
          // Get start of week (Monday)
          const weekStart = new Date(saleDate);
          weekStart.setDate(saleDate.getDate() - saleDate.getDay() + 1);
          dateKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          dateKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // daily
          dateKey = saleDate.toISOString().split('T')[0];
      }
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          revenue: 0,
          orders: new Set(),
          quantity: 0,
          profit: 0,
          net_profit: 0,
          marketplace_breakdown: {},
          product_breakdown: {}
        };
      }
      
      const revenue = Number(sale.total_revenue) || 0;
      const hpp = Number(sale.hpp) || 0;
      const profit = (Number(sale.settlement_amount) || 0) - hpp;
      
      groupedData[dateKey].revenue += revenue;
      groupedData[dateKey].orders.add(sale.order_id);
      groupedData[dateKey].quantity += Number(sale.quantity) || 0;
      groupedData[dateKey].profit += profit;
      groupedData[dateKey].net_profit += profit; // Will subtract marketing costs later
      
      // Marketplace breakdown
      const marketplace = sale.marketplace || 'Unknown';
      groupedData[dateKey].marketplace_breakdown[marketplace] = 
        (groupedData[dateKey].marketplace_breakdown[marketplace] || 0) + revenue;
      
      // Product breakdown
      const product = sale.nama_produk || sale.product_name || 'Unknown';
      groupedData[dateKey].product_breakdown[product] = 
        (groupedData[dateKey].product_breakdown[product] || 0) + revenue;
    });
    
    // Convert to array and fix orders count
    return Object.values(groupedData).map(item => ({
      ...item,
      orders: item.orders.size
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSalesData, granularity]);

  // Generate product performance reports
  const generateProductReports = useMemo(() => {
    if (filteredSalesData.length === 0) return [];
    
    const productGroups: Record<string, any> = {};
    
    filteredSalesData.forEach(sale => {
      const productName = sale.nama_produk || sale.product_name || 'Unknown Product';
      
      if (!productGroups[productName]) {
        productGroups[productName] = {
          product_name: productName,
          total_sold: 0,
          total_revenue: 0,
          total_profit: 0,
          net_profit: 0,
          orders: new Set(),
          stock_current: 0, // Will be filled from products data if available
          stock_min: 0
        };
      }
      
      const revenue = Number(sale.total_revenue) || 0;
      const hpp = Number(sale.hpp) || 0;
      const profit = (Number(sale.settlement_amount) || 0) - hpp;
      
      productGroups[productName].total_sold += Number(sale.quantity) || 0;
      productGroups[productName].total_revenue += revenue;
      productGroups[productName].total_profit += profit;
      productGroups[productName].net_profit += profit;
      productGroups[productName].orders.add(sale.order_id);
    });
    
    // Convert to array and calculate averages
    return Object.values(productGroups).map(product => {
      const orderCount = product.orders.size;
      return {
        ...product,
        avg_price: orderCount > 0 ? product.total_revenue / product.total_sold : 0,
        orders: orderCount
      };
    }).sort((a, b) => b.total_revenue - a.total_revenue);
  }, [filteredSalesData]);

  // Generate marketplace performance reports
  const generateMarketplaceReports = useMemo(() => {
    if (filteredSalesData.length === 0) return [];
    
    const marketplaceGroups: Record<string, any> = {};
    let totalRevenue = 0;
    
    // First pass: calculate totals
    filteredSalesData.forEach(sale => {
      totalRevenue += Number(sale.total_revenue) || 0;
    });
    
    // Second pass: group by marketplace
    filteredSalesData.forEach(sale => {
      const marketplace = sale.marketplace || 'Unknown';
      
      if (!marketplaceGroups[marketplace]) {
        marketplaceGroups[marketplace] = {
          marketplace,
          total_orders: new Set(),
          total_revenue: 0,
          total_profit: 0,
          net_profit: 0,
          order_values: []
        };
      }
      
      const revenue = Number(sale.total_revenue) || 0;
      const hpp = Number(sale.hpp) || 0;
      const profit = (Number(sale.settlement_amount) || 0) - hpp;
      
      marketplaceGroups[marketplace].total_orders.add(sale.order_id);
      marketplaceGroups[marketplace].total_revenue += revenue;
      marketplaceGroups[marketplace].total_profit += profit;
      marketplaceGroups[marketplace].net_profit += profit;
      marketplaceGroups[marketplace].order_values.push(revenue);
    });
    
    // Convert to array and calculate metrics
    return Object.values(marketplaceGroups).map(mp => {
      const orderCount = mp.total_orders.size;
      const avgOrderValue = orderCount > 0 ? mp.total_revenue / orderCount : 0;
      const percentageShare = totalRevenue > 0 ? (mp.total_revenue / totalRevenue) * 100 : 0;
      
      return {
        marketplace: mp.marketplace,
        total_orders: orderCount,
        total_revenue: mp.total_revenue,
        total_profit: mp.total_profit,
        net_profit: mp.net_profit,
        avg_order_value: avgOrderValue,
        percentage_share: percentageShare
      };
    }).sort((a, b) => b.total_revenue - a.total_revenue);
  }, [filteredSalesData]);

  // Update processed data when filters change
  useEffect(() => {
    const processed = processSalesData;
    console.log(`📊 Processing sales data for reports: ${processed.length} records`);
    setProcessedSalesData(processed);
  }, [processSalesData]);

  useEffect(() => {
    const products = generateProductReports;
    console.log(`📦 Generating product reports: ${products.length} records`);
    setProductReports(products);
  }, [generateProductReports]);

  useEffect(() => {
    const marketplaces = generateMarketplaceReports;
    console.log(`🏪 Generating marketplace reports: ${marketplaces.length} records`);
    setMarketplaceReports(marketplaces);
  }, [generateMarketplaceReports]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (filteredSalesData.length === 0) {
      return {
        total_revenue: 0,
        total_orders: 0,
        total_profit: 0,
        total_net_profit: 0,
        marketing_costs: 0,
        settlement_costs: 0,
        avg_order_value: 0,
        profit_margin: 0,
        net_profit_margin: 0,
        growth_rate: 0
      };
    }
    
    const uniqueOrders = new Set();
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalSettlement = 0;
    
    filteredSalesData.forEach(sale => {
      uniqueOrders.add(sale.order_id);
      totalRevenue += Number(sale.total_revenue) || 0;
      totalSettlement += Number(sale.settlement_amount) || 0;
      const hpp = Number(sale.hpp) || 0;
      totalProfit += (Number(sale.settlement_amount) || 0) - hpp;
    });
    
    const marketingCosts = calculateMarketingCosts;
    const netProfit = totalProfit - marketingCosts;
    const totalOrders = uniqueOrders.size;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const profitMargin = totalSettlement > 0 ? (totalProfit / totalSettlement) * 100 : 0;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    return {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      total_profit: totalProfit,
      total_net_profit: netProfit,
      marketing_costs: marketingCosts,
      settlement_costs: calculateSettlementCosts,
      avg_order_value: avgOrderValue,
      profit_margin: profitMargin,
      net_profit_margin: netProfitMargin,
      growth_rate: 0 // TODO: Calculate based on previous period
    };
  }, [filteredSalesData, calculateMarketingCosts, calculateSettlementCosts]);

  // Available report types
  const reportTypes = [
    {
      id: 'sales',
      name: 'Sales Report',
      description: 'Comprehensive sales analysis with trends and breakdowns',
      icon: ShoppingCart,
      color: 'blue',
      data: processedSalesData,
      count: processedSalesData.length
    },
    {
      id: 'financial',
      name: 'Financial Report',
      description: 'Revenue, profit, and financial performance metrics',
      icon: DollarSign,
      color: 'green',
      data: summaryMetrics,
      count: summaryMetrics ? 1 : 0
    },
    {
      id: 'product',
      name: 'Product Performance',
      description: 'Individual product sales and performance analysis',
      icon: Package,
      color: 'purple',
      data: productReports,
      count: productReports.length
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      description: 'Stock levels, turnover, and inventory optimization',
      icon: Package,
      color: 'orange',
      data: allProductsData,
      count: allProductsData.length
    },
    {
      id: 'marketing',
      name: 'Marketing Report',
      description: 'Marketplace performance and channel analysis',
      icon: Activity,
      color: 'pink',
      data: marketplaceReports,
      count: marketplaceReports.length
    },
    {
      id: 'customer',
      name: 'Customer Report',
      description: 'Customer behavior and order analysis',
      icon: Users,
      color: 'indigo',
      data: filteredSalesData,
      count: filteredSalesData.length
    }
  ];

  // Handle report generation with enhanced CSV and PDF support
  const handleGenerateReport = async (reportType: string, format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    setIsGenerating(true);
    
    try {
      console.log(`📄 Generating ${format.toUpperCase()} report for ${reportType}...`);
      
      const reportData = reportTypes.find(r => r.id === reportType);
      
      if (!reportData || !reportData.data || !Array.isArray(reportData.data) || reportData.data.length === 0) {
        toast.error('❌ Tidak ada data untuk report ini');
        return;
      }
      
      // Process real data for report generation
      console.log(`Processing ${reportData.name} with ${reportData.count} records`);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const dateRangeText = dateRange.from && dateRange.to 
        ? `_${dateRange.from.toISOString().split('T')[0]}_to_${dateRange.to.toISOString().split('T')[0]}`
        : '';
      const filename = `D-Busana_${reportType}_report${dateRangeText}_${timestamp}`;
      
      if (format === 'csv') {
        // Enhanced CSV generation with proper formatting
        const data = reportData.data;
        if (data.length === 0) {
          toast.error('❌ Tidak ada data untuk di-export');
          return;
        }

        // Get headers from first object with validation
        const sampleData = data[0];
        if (!sampleData || typeof sampleData !== 'object') {
          toast.error('❌ Format data tidak valid untuk export');
          return;
        }
        
        const headers = Object.keys(sampleData).filter(key => 
          key !== null && key !== undefined && key !== ''
        );
        
        // Format headers to be more user-friendly
        const formattedHeaders = headers.map(header => {
          return header.replace(/_/g, ' ').toUpperCase();
        });
        
        // Format data rows with proper CSV escaping and error handling
        const rows = data.map((item, index) => {
          try {
            return headers.map(header => {
              let value = item && item[header];
              
              // Handle different data types with comprehensive validation
              if (value === null || value === undefined) {
                value = '';
              } else if (typeof value === 'number') {
                // Format numbers properly with validation
                if (isNaN(value)) {
                  value = '';
                } else if (header.includes('price') || header.includes('amount') || header.includes('revenue') || header.includes('hpp')) {
                  value = value.toLocaleString('id-ID');
                } else {
                  value = value.toString();
                }
              } else if (typeof value === 'string') {
                // Escape quotes and wrap in quotes if contains comma or newline
                value = value.trim();
                if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
                  value = `"${value.replace(/"/g, '""')}"`;
                }
              } else if (typeof value === 'boolean') {
                value = value ? 'TRUE' : 'FALSE';
              } else if (value instanceof Date) {
                value = value.toLocaleDateString('id-ID');
              } else {
                value = String(value);
              }
              
              return value;
            }).join(',');
          } catch (rowError) {
            console.warn(`Error processing row ${index}:`, rowError);
            return headers.map(() => '').join(','); // Return empty row on error
          }
        }).filter(row => row.trim() !== ''); // Remove completely empty rows
        
        const csvContent = [formattedHeaders.join(','), ...rows].join('\n');
        
        // Validate content before creating blob
        if (!csvContent || csvContent.trim() === formattedHeaders.join(',')) {
          toast.error('❌ Tidak ada data valid untuk di-export');
          return;
        }
        
        // Create and download CSV with error handling
        try {
          const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.csv`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success(`📄 ${reportData.name} berhasil didownload sebagai CSV`, {
            description: `${rows.length} records exported successfully`
          });
        } catch (downloadError) {
          console.error('Download error:', downloadError);
          toast.error('❌ Gagal mendownload file CSV');
        }
        
      } else if (format === 'pdf') {
        // Enhanced PDF generation with proper formatting
        try {
          // For now, we'll create a structured text report that can be converted to PDF
          const data = reportData.data;
          const reportTitle = `D'Busana ${reportData.name}`;
          const reportDate = new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          let pdfContent = `${reportTitle}\n`;
          pdfContent += `Generated on: ${reportDate}\n`;
          if (dateRange.from && dateRange.to) {
            pdfContent += `Period: ${dateRange.from.toLocaleDateString('id-ID')} - ${dateRange.to.toLocaleDateString('id-ID')}\n`;
          }
          pdfContent += `Total Records: ${data.length}\n`;
          pdfContent += '='.repeat(50) + '\n\n';
          
          // Add summary metrics if available
          if (reportType === 'sales') {
            pdfContent += `SUMMARY METRICS:\n`;
            pdfContent += `Total Revenue: Rp ${summaryMetrics.total_revenue.toLocaleString('id-ID')}\n`;
            pdfContent += `Total Orders: ${summaryMetrics.total_orders.toLocaleString('id-ID')}\n`;
            pdfContent += `Total Profit: Rp ${summaryMetrics.total_profit.toLocaleString('id-ID')}\n`;
            pdfContent += `Average Order Value: Rp ${summaryMetrics.avg_order_value.toLocaleString('id-ID')}\n`;
            pdfContent += `Profit Margin: ${summaryMetrics.profit_margin.toFixed(2)}%\n\n`;
          }
          
          // Add detailed data (first 100 records to avoid large files)
          pdfContent += `DETAILED DATA (showing first ${Math.min(100, data.length)} records):\n`;
          pdfContent += '-'.repeat(50) + '\n';
          
          data.slice(0, 100).forEach((item, index) => {
            pdfContent += `Record ${index + 1}:\n`;
            Object.entries(item).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                const formattedKey = key.replace(/_/g, ' ').toUpperCase();
                pdfContent += `  ${formattedKey}: ${value}\n`;
              }
            });
            pdfContent += '\n';
          });
          
          if (data.length > 100) {
            pdfContent += `... and ${data.length - 100} more records\n`;
          }
          
          // Create and download as text file (users can convert to PDF if needed)
          const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.txt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success(`📄 ${reportData.name} berhasil didownload sebagai Text Report`, {
            description: `${data.length} records exported - can be converted to PDF`
          });
          
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          toast.error('❌ Gagal generate PDF, coba format CSV sebagai alternatif');
        }
      }
      
    } catch (err) {
      console.error('❌ Error generating report:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`❌ Gagal generate report: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle export all data
  const handleExportAll = async (format: 'csv' | 'pdf' = 'csv') => {
    setIsGenerating(true);
    
    try {
      console.log(`📄 Exporting all data as ${format.toUpperCase()}...`);
      
      if (filteredSalesData.length === 0) {
        toast.error('❌ Tidak ada data untuk di-export');
        return;
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      const dateRangeText = dateRange.from && dateRange.to 
        ? `_${dateRange.from.toISOString().split('T')[0]}_to_${dateRange.to.toISOString().split('T')[0]}`
        : '';
      const filename = `D-Busana_Complete_Report${dateRangeText}_${timestamp}`;
      
      if (format === 'csv') {
        // Export comprehensive sales data with validation
        const data = filteredSalesData;
        
        if (!data || data.length === 0) {
          toast.error('❌ Tidak ada data sales untuk di-export');
          return;
        }
        
        const sampleData = data[0];
        if (!sampleData || typeof sampleData !== 'object') {
          toast.error('❌ Format data tidak valid untuk export');
          return;
        }
        
        const headers = Object.keys(sampleData).filter(key => 
          key !== null && key !== undefined && key !== ''
        );
        
        // Format headers
        const formattedHeaders = headers.map(header => {
          return header.replace(/_/g, ' ').toUpperCase();
        });
        
        // Format data rows with comprehensive validation
        const rows = data.map((item, index) => {
          try {
            return headers.map(header => {
              let value = item && item[header];
              
              if (value === null || value === undefined) {
                value = '';
              } else if (typeof value === 'number') {
                if (isNaN(value)) {
                  value = '';
                } else if (header.includes('price') || header.includes('amount') || header.includes('revenue') || header.includes('hpp')) {
                  value = value.toLocaleString('id-ID');
                } else {
                  value = value.toString();
                }
              } else if (typeof value === 'string') {
                value = value.trim();
                if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
                  value = `"${value.replace(/"/g, '""')}"`;
                }
              } else if (typeof value === 'boolean') {
                value = value ? 'TRUE' : 'FALSE';
              } else if (value instanceof Date) {
                value = value.toLocaleDateString('id-ID');
              } else {
                value = String(value);
              }
              
              return value;
            }).join(',');
          } catch (rowError) {
            console.warn(`Error processing row ${index} in export all:`, rowError);
            return headers.map(() => '').join(',');
          }
        }).filter(row => row.trim() !== '');
        
        const csvContent = [formattedHeaders.join(','), ...rows].join('\n');
        
        // Validate content before creating blob
        if (!csvContent || csvContent.trim() === formattedHeaders.join(',')) {
          toast.error('❌ Tidak ada data valid untuk di-export');
          return;
        }
        
        // Show progress for large exports
        if (data.length > 1000) {
          toast.info(`📊 Processing ${data.length} records for export...`);
        }
        
        // Create and download CSV with error handling
        try {
          const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.csv`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success(`📄 Complete Report berhasil didownload sebagai CSV`, {
            description: `${rows.length} total records exported successfully`
          });
        } catch (downloadError) {
          console.error('Export all download error:', downloadError);
          toast.error('❌ Gagal mendownload file Complete Report CSV');
        }
      }
      
    } catch (err) {
      console.error('❌ Error exporting all data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`❌ Gagal export semua data: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Reports</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchAllData()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-bold">Reports</h1>
            <p className="text-muted-foreground">Laporan dan insights bisnis fashion D'Busana</p>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated?.toLocaleString('id-ID') || 'Never'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportAll('csv')}
              disabled={isGenerating || filteredSalesData.length === 0}
              className="gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export All CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAllData()}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Filters & Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Picker from KPI Dashboard */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Date Range:</span>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  latestDataDate={getLatestDataDate()}
                />
              </div>

              {/* Granularity Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Granularity:</span>
                <div className="flex gap-1 p-1 bg-muted rounded">
                  {(['daily', 'weekly', 'monthly'] as const).map((g) => (
                    <Button
                      key={g}
                      variant={granularity === g ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setGranularity(g)}
                      className="capitalize h-8 px-3"
                    >
                      {g}
                    </Button>
                  ))}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">View:</span>
                <div className="flex gap-1 p-1 bg-muted rounded">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Summary Cards */}
      <div>
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue KPI */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(summaryMetrics.total_revenue)}
                  </p>
                  {summaryMetrics.growth_rate !== 0 && (
                    <p className={cn(
                      "text-xs flex items-center gap-1 mt-1",
                      summaryMetrics.growth_rate > 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {summaryMetrics.growth_rate > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(summaryMetrics.growth_rate).toFixed(1)}% vs previous period
                    </p>
                  )}
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Profit KPI */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(summaryMetrics.total_net_profit)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Margin: {summaryMetrics.net_profit_margin.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Orders KPI */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-semibold">
                    {formatNumber(summaryMetrics.total_orders)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AOV: {formatCurrency(summaryMetrics.avg_order_value)}
                  </p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marketing Costs KPI */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Marketing Costs</p>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(summaryMetrics.marketing_costs)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Settlement: {formatCurrency(summaryMetrics.settlement_costs)}
                  </p>
                </div>
                <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="space-y-6">
        {/* Report Types Grid */}
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1"
        )}>
          {reportTypes.map((report) => {
            const IconComponent = report.icon;
            const colorClasses = getColorClasses(report.color);
            
            return (
              <Card key={report.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "p-2 rounded-lg",
                      colorClasses.bg
                    )}>
                      <IconComponent className={cn("w-5 h-5", colorClasses.text)} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {formatNumber(report.count)} records
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.description}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReport(report.id, 'csv')}
                      disabled={isGenerating || report.count === 0}
                      className="flex-1 gap-2"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isGenerating ? 'Exporting...' : 'CSV'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReport(report.id, 'pdf')}
                      disabled={isGenerating || report.count === 0}
                      className="flex-1 gap-2"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileBarChart className="w-4 h-4" />
                      )}
                      {isGenerating ? 'Exporting...' : 'PDF'}
                    </Button>
                  </div>
                  
                  {report.count === 0 && (
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Database className="w-4 h-4" />
                        <span className="text-xs">No data available for selected period</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {reportTypes.every(report => report.count === 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                <p className="text-muted-foreground mb-4">
                  No data found for the selected date range. Try adjusting your filters or refresh the data.
                </p>
                <Button 
                  onClick={() => fetchAllData()} 
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}