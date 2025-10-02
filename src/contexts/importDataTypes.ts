// Types for imported data
export interface ImportedSalesData {
  order_id: string;
  seller_sku: string;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  order_amount: number;
  created_time: string;
  delivered_time?: string;
  settlement_amount?: number;
  total_revenue?: number;
  hpp?: number;
  total?: number;
  customer?: string;     // Customer name or identifier
  province?: string;     // Province/provinsi location
  regency?: string;      // Regency/kabupaten location
  city?: string;         // City/kota location
}

// ✅ Alias for user compatibility - matches requested interface exactly
export interface SalesDataRow extends ImportedSalesData {}

export interface ImportedProductData {
  product_code: string;
  product_name: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock: number;
  description?: string;
  // Optional fields for manually added products
  id?: string;
  seller_sku?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ImportedStockData {
  product_code: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_number?: string;
  notes?: string;
  movement_date: string;
}

export interface ImportStats {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  importedRecords: number;
  lastImportDate?: string;
  fileName?: string;
  fileType?: 'excel' | 'csv';
}

// State interface
export interface ImportDataState {
  salesData: ImportedSalesData[];
  productData: ImportedProductData[];
  stockData: ImportedStockData[];
  stats: {
    sales: ImportStats;
    products: ImportStats;
    stock: ImportStats;
  };
  isLoading: boolean;
  error: string | null;
}

// Action types
export type ImportDataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SALES_DATA'; payload: { data: ImportedSalesData[]; stats: ImportStats } }
  | { type: 'SET_PRODUCT_DATA'; payload: { data: ImportedProductData[]; stats: ImportStats } }
  | { type: 'SET_STOCK_DATA'; payload: { data: ImportedStockData[]; stats: ImportStats } }
  | { type: 'ADD_PRODUCT'; payload: ImportedProductData }
  | { type: 'UPDATE_PRODUCT'; payload: { id: string; product: Partial<ImportedProductData> } }
  | { type: 'UPDATE_PRODUCT_STOCK'; payload: { id: string; stock_quantity: number } }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'CLEAR_SALES_DATA' }
  | { type: 'CLEAR_PRODUCT_DATA' }
  | { type: 'CLEAR_STOCK_DATA' }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'UPDATE_IMPORT_STATS'; payload: { type: 'sales' | 'products' | 'stock'; stats: Partial<ImportStats> } }
  | { type: 'IMPORT_SUCCESS'; payload: { type: string; data: any; timestamp: string } };

// Aggregate data interfaces for dashboard integration
export interface DashboardMetrics {
  // Core KPI metrics as per requirements
  distinctOrders: number;           // Jumlah pesanan (distinct order_id)
  totalQuantitySold: number;        // Produk terjual (sum quantity)
  totalRevenue: number;             // Revenue (sum total_revenue)
  totalProfit: number;              // Profit (sum total_revenue - hpp)
  totalHPP: number;                 // Total HPP (sum hpp)
  profitMargin: number;             // Profit margin percentage
  
  // Secondary metrics
  totalSales: number;               // Total sales records
  todayRevenue: number;
  todaySales: number;
  todayOrders: number;              // Distinct orders today
  monthRevenue: number;
  monthSales: number;
  monthOrders: number;              // Distinct orders this month
  averageOrderValue: number;
  totalProducts: number;            // Unique product names (no duplication)
  totalSKUs: number;                // Total SKUs/variations (allows duplication by name)
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  totalBrands: number;
  totalColors: number;
  totalSizes: number;
}

export interface ChartDataPoint {
  name: string;
  penjualan: number;
  target: number;
  date: string;
  // ✅ Additional metadata for enhanced time-series analysis
  orders?: number;        // Distinct orders for the day
  quantity?: number;      // Total quantity sold for the day  
  salesCount?: number;    // Number of sales transactions for the day
}

export interface CategorySales {
  category: string;
  sales: number;
  revenue: number;
}

export interface BrandPerformance {
  brand: string;
  sales: number;
  revenue: number;
}

// 🎯 NEW: Interfaces for updated dashboard analytics
export interface ProductSales {
  product: string;
  sales: number;
  revenue: number;
}

export interface SKUPerformance {
  sku: string;
  sales: number;
  revenue: number;
}

// Full Context Interface (comprehensive)
export interface ImportDataContextType {
  state: ImportDataState;
  dispatch?: React.Dispatch<ImportDataAction>;
  actions: {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSalesData: (data: ImportedSalesData[], stats: ImportStats) => void;
    setProductData: (data: ImportedProductData[], stats: ImportStats) => void;
    setStockData: (data: ImportedStockData[], stats: ImportStats) => void;
    addProduct: (product: ImportedProductData) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateProduct: (id: string, product: Partial<ImportedProductData>) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateProductStock: (id: string, stock_quantity: number) => void;
    deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
    clearSalesData: () => void;
    clearProductData: () => void;
    clearStockData: () => void;
    clearAllData: () => void;
    updateImportStats: (type: 'sales' | 'products' | 'stock', stats: Partial<ImportStats>) => void;
  };
  // Dashboard integration methods
  getDashboardMetrics: () => DashboardMetrics;
  getChartData: (period: '7d' | '30d' | '90d') => ChartDataPoint[];
  getCategorySales: () => CategorySales[];
  getBrandPerformance: () => BrandPerformance[];
  // 🎯 NEW: Updated dashboard methods
  getProductSales: () => ProductSales[];
  getSKUPerformance: () => SKUPerformance[];
  getTopProducts: (limit?: number) => { product: string; sales: number; revenue: number }[];
  getRecentActivities: (limit?: number) => { type: string; description: string; timestamp: string; value?: number }[];
  getKPISummary: () => { orders: number; productsSold: number; revenue: number; profit: number };
  
  // Stock management helper
  updateProductStock: (id: string, stock_quantity: number) => void;
  
  // ✅ Simplified interface compatibility for user request
  data: SalesDataRow[];
  setData: (rows: SalesDataRow[]) => void;
  
  // ⭐ NEW: File upload functionality for transaction management
  handleFileUpload: (file: File, importType: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  isImporting: boolean;
  importProgress: number;
}