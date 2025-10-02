import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Package,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Grid,
  List,
  Palette,
  Ruler,
  Save,
  TrendingUp,
  RefreshCw,
  Database,
  ShoppingCart,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Tag,
  Layers,
  Upload,
  Warehouse,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Info
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { simpleApiProducts, checkSimpleBackendHealth, withSimpleRetry } from '../utils/simpleApiUtils';
import { formatCurrencyResponsive, formatWithTooltip } from '../utils/numberFormatUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { logActivity } from '../utils/activityLogger';

// StockValueCard component to handle the formatted stock value display
function StockValueCard({ totalStockValue }: { totalStockValue: number }) {
  const getFormattedCurrency = (value: number) => {
    return formatWithTooltip(value);
  };

  const formatted = getFormattedCurrency(totalStockValue);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Stock Value</p>
            {formatted.isShortened ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="break-words cursor-help">{formatted.display}</p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatted.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <p className="break-words">{formatted.display}</p>
            )}
            <p className="text-xs text-muted-foreground">At cost price</p>
          </div>
          <DollarSign className="w-8 h-8 text-green-600 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  category: string;
  brand: string;
  size?: string;
  color?: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ProductStats {
  totalUniqueProducts: number;
  totalSKUs: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  totalBrands: number;
  categories: Array<{ name: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
  totalStockValue: number;
  avgStockPerProduct: number;
  criticalStockProducts: number;
}

interface ProductWithAdvancedStock extends Product {
  total_stock_all_variants?: number;
  stock_preparation_needed?: number;
  days_of_inventory?: number;
  stock_velocity?: number;
  reorder_point?: number;
}

export function ProductsManagementDatabase() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Sorting states
  const [sortField, setSortField] = useState<keyof Product | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [quickSort, setQuickSort] = useState<string>('none');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    category: '',
    brand: '',
    size: '',
    color: '',
    price: 0,
    cost: 0,
    stock_quantity: 0,
    min_stock: 0,
    description: ''
  });
  const [saving, setSaving] = useState(false);

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    
    try {
      const result = await simpleApiProducts.getAll({ limit: 1000 });

      if (result.success && result.data) {
        setProducts(result.data);
      }

    } catch (err) {
      // Silent fail - no error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Get unique categories and brands
  const categories = Array.from(new Set(products.map(p => p.category)));
  const brands = Array.from(new Set(products.map(p => p.brand)));

  // Advanced stock calculations
  const calculateStockPreparation = (product: Product) => {
    const basePreparation = Math.max(0, (product.min_stock * 2) - product.stock_quantity);
    const seasonalFactor = 1.2;
    const safetyFactor = 1.1;
    
    return Math.ceil(basePreparation * seasonalFactor * safetyFactor);
  };

  const calculateDaysOfInventory = (product: Product) => {
    const avgDailySales = product.min_stock / 7;
    return avgDailySales > 0 ? Math.ceil(product.stock_quantity / avgDailySales) : 999;
  };

  const calculateStockVelocity = (product: Product) => {
    return product.min_stock > 0 ? product.stock_quantity / product.min_stock : 0;
  };

  const calculateReorderPoint = (product: Product) => {
    const leadTimeDays = 7;
    const avgDailyDemand = product.min_stock / 30;
    return Math.ceil(product.min_stock + (leadTimeDays * avgDailyDemand));
  };

  // Enhanced products with advanced stock calculations
  const enhancedProducts = useMemo(() => {
    return products.map(product => {
      const allVariants = products.filter(p => p.product_name === product.product_name);
      const total_stock_all_variants = allVariants.reduce((sum, variant) => sum + variant.stock_quantity, 0);
      
      return {
        ...product,
        total_stock_all_variants,
        stock_preparation_needed: calculateStockPreparation(product),
        days_of_inventory: calculateDaysOfInventory(product),
        stock_velocity: calculateStockVelocity(product),
        reorder_point: calculateReorderPoint(product)
      };
    });
  }, [products]);

  // Filtered and sorted products with enhanced data
  const filteredProducts = useMemo(() => {
    let filtered = enhancedProducts.filter(product => {
      const matchesSearch = searchTerm === '' || 
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      const matchesBrand = filterBrand === 'all' || product.brand === filterBrand;
      
      return matchesSearch && matchesCategory && matchesBrand;
    });

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortField as keyof ProductWithAdvancedStock];
        let bVal = b[sortField as keyof ProductWithAdvancedStock];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [enhancedProducts, searchTerm, filterCategory, filterBrand, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Product stats with enhanced calculations
  const stats: ProductStats = useMemo(() => {
    const totalSKUs = products.length;
    const uniqueProductNames = Array.from(new Set(products.map(p => p.product_name)));
    const totalUniqueProducts = uniqueProductNames.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
    const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock && p.stock_quantity > 0).length;
    const outOfStockProducts = products.filter(p => p.stock_quantity === 0).length;
    const criticalStockProducts = products.filter(p => p.stock_quantity < p.min_stock * 0.5).length;
    
    const totalStockValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.cost), 0);
    const avgStockPerProduct = totalUniqueProducts > 0 ? totalStock / totalUniqueProducts : 0;
    
    const categoryStats = categories.map(cat => ({
      name: cat,
      count: products.filter(p => p.category === cat).length
    }));
    
    const brandStats = brands.map(brand => ({
      name: brand,
      count: products.filter(p => p.brand === brand).length
    }));
    
    return {
      totalUniqueProducts,
      totalSKUs,
      totalStock,
      lowStockProducts,
      outOfStockProducts,
      totalCategories: categories.length,
      totalBrands: brands.length,
      categories: categoryStats,
      brands: brandStats,
      totalStockValue,
      avgStockPerProduct,
      criticalStockProducts
    };
  }, [products, categories, brands]);

  // Form handlers
  const resetForm = () => {
    setFormData({
      product_code: '',
      product_name: '',
      category: '',
      brand: '',
      size: '',
      color: '',
      price: 0,
      cost: 0,
      stock_quantity: 0,
      min_stock: 0,
      description: ''
    });
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handlers
  const handleAddProduct = async () => {
    if (!formData.product_code || !formData.product_name) {
      toast.error('Product code and name are required');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        cost: Number(formData.cost),
        stock_quantity: Number(formData.stock_quantity),
        min_stock: Number(formData.min_stock)
      };

      const result = await simpleApiProducts.create(productData);
      if (result.success) {
        toast.success('Product added successfully');
        
        // Log activity
        try {
          await logActivity({
            type: 'product',
            title: 'Produk Baru Ditambahkan',
            description: `Produk "${productData.product_name}" (${productData.product_code}) berhasil ditambahkan`,
            status: 'success',
            metadata: {
              product_name: productData.product_name,
              product_code: productData.product_code,
              category: productData.category,
              brand: productData.brand,
              action: 'create'
            }
          });
        } catch (activityError) {
          console.warn('Failed to log product creation activity:', activityError);
        }
        
        setAddDialogOpen(false);
        resetForm();
        loadProducts();
      } else {
        toast.error(result.error || 'Failed to add product');
      }
    } catch (error) {
      toast.error('Error adding product');
      console.error('Error adding product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct || !formData.product_code || !formData.product_name) {
      toast.error('Product code and name are required');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        cost: Number(formData.cost),
        stock_quantity: Number(formData.stock_quantity),
        min_stock: Number(formData.min_stock)
      };

      const result = await simpleApiProducts.update(selectedProduct.id, productData);
      if (result.success) {
        toast.success('Product updated successfully');
        
        // Log activity
        try {
          await logActivity({
            type: 'product',
            title: 'Produk Diperbarui',
            description: `Produk "${productData.product_name}" (${productData.product_code}) berhasil diperbarui`,
            status: 'success',
            metadata: {
              product_name: productData.product_name,
              product_code: productData.product_code,
              category: productData.category,
              brand: productData.brand,
              action: 'update'
            }
          });
        } catch (activityError) {
          console.warn('Failed to log product update activity:', activityError);
        }
        
        setEditDialogOpen(false);
        setSelectedProduct(null);
        resetForm();
        loadProducts();
      } else {
        toast.error(result.error || 'Failed to update product');
      }
    } catch (error) {
      toast.error('Error updating product');
      console.error('Error updating product:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_code: product.product_code,
      product_name: product.product_name,
      category: product.category,
      brand: product.brand,
      size: product.size || '',
      color: product.color || '',
      price: product.price,
      cost: product.cost,
      stock_quantity: product.stock_quantity,
      min_stock: product.min_stock,
      description: product.description || ''
    });
    setEditDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    // Find product info for logging
    const productToDelete = products.find(p => p.id === productId);
    
    try {
      const result = await simpleApiProducts.delete(productId);
      if (result.success) {
        toast.success('Product deleted successfully');
        
        // Log activity
        if (productToDelete) {
          try {
            await logActivity({
              type: 'product',
              title: 'Produk Dihapus',
              description: `Produk "${productToDelete.product_name}" (${productToDelete.product_code}) berhasil dihapus`,
              status: 'warning',
              metadata: {
                product_name: productToDelete.product_name,
                product_code: productToDelete.product_code,
                category: productToDelete.category,
                brand: productToDelete.brand,
                action: 'delete'
              }
            });
          } catch (activityError) {
            console.warn('Failed to log product deletion activity:', activityError);
          }
        }
        
        loadProducts();
      } else {
        toast.error(result.error || 'Failed to delete product');
      }
    } catch (error) {
      toast.error('Error deleting product');
      console.error('Error deleting product:', error);
    }
  };

  // Sorting handlers
  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleQuickSort = (sortType: string) => {
    setQuickSort(sortType);
    
    switch (sortType) {
      case 'stock-high':
        setSortField('stock_quantity');
        setSortDirection('desc');
        break;
      case 'stock-low':
        setSortField('stock_quantity');
        setSortDirection('asc');
        break;
      case 'price-high':
        setSortField('price');
        setSortDirection('desc');
        break;
      case 'price-low':
        setSortField('price');
        setSortDirection('asc');
        break;
      case 'name-az':
        setSortField('product_name');
        setSortDirection('asc');
        break;
      case 'name-za':
        setSortField('product_name');
        setSortDirection('desc');
        break;
      case 'none':
      default:
        setSortField('');
        setSortDirection('desc');
        break;
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: keyof Product) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-accent-primary" /> : 
      <ArrowDown className="w-4 h-4 text-accent-primary" />;
  };

  const formatCurrency = (value: number) => {
    return formatCurrencyResponsive(value, { 
      useShortFormat: true, 
      maxLength: 12 
    });
  };

  const getFormattedCurrency = (value: number) => {
    return formatWithTooltip(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1>Products Management</h1>
          <p className="text-muted-foreground">
            Kelola master data produk D'Busana - tambah manual atau edit existing products
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p>{stats.totalUniqueProducts.toLocaleString('id-ID')}</p>
                <p className="text-xs text-muted-foreground">Unique product names</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total SKU</p>
                <p>{stats.totalSKUs.toLocaleString('id-ID')}</p>
                <p className="text-xs text-muted-foreground">All product variants</p>
              </div>
              <Layers className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stock</p>
                <p>{stats.totalStock.toLocaleString('id-ID')}</p>
                <p className="text-xs text-muted-foreground">All units combined</p>
              </div>
              <Warehouse className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <StockValueCard totalStockValue={stats.totalStockValue} />
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Stock</p>
                <p className="text-destructive">{stats.criticalStockProducts}</p>
                <p className="text-xs text-muted-foreground">Need immediate attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg/Product</p>
                <p>{stats.avgStockPerProduct.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Units per product</p>
              </div>
              <BarChart3 className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={quickSort} onValueChange={handleQuickSort}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default Order</SelectItem>
                <SelectItem value="stock-high">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4" />
                    Stock: High to Low
                  </div>
                </SelectItem>
                <SelectItem value="stock-low">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4" />
                    Stock: Low to High
                  </div>
                </SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="name-az">Name: A to Z</SelectItem>
                <SelectItem value="name-za">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading products...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sorting Status Info */}
          {sortField && (
            <div className="flex items-center justify-between bg-accent-secondary border border-accent-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-primary" />
                <span className="text-sm text-accent-secondary-foreground">
                  Sorted by{' '}
                  <span className="font-medium">
                    {sortField === 'stock_quantity' ? 'Stock Quantity' :
                     sortField === 'product_name' ? 'Product Name' :
                     sortField === 'price' ? 'Price' :
                     sortField} ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                  </span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSortField('');
                  setQuickSort('none');
                }}
                className="text-accent-primary hover:text-accent-primary"
              >
                Clear Sort
              </Button>
            </div>
          )}

          {/* Table/Grid View */}
          {viewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="text-left p-4 font-medium">
                          <button
                            className="flex items-center gap-2 hover:text-accent-primary transition-colors"
                            onClick={() => handleSort('product_code')}
                          >
                            Product Code
                            {getSortIcon('product_code')}
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium">
                          <button
                            className="flex items-center gap-2 hover:text-accent-primary transition-colors"
                            onClick={() => handleSort('product_name')}
                          >
                            Name
                            {getSortIcon('product_name')}
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium">Category</th>
                        <th className="text-left p-4 font-medium">Brand</th>
                        <th className="text-left p-4 font-medium">
                          <button
                            className="flex items-center gap-2 hover:text-accent-primary transition-colors"
                            onClick={() => handleSort('price')}
                          >
                            Price
                            {getSortIcon('price')}
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium">
                          <button
                            className="flex items-center gap-2 hover:text-accent-primary transition-colors"
                            onClick={() => handleSort('stock_quantity')}
                          >
                            Stock
                            {getSortIcon('stock_quantity')}
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-muted-foreground">
                            {searchTerm || filterCategory !== 'all' || filterBrand !== 'all' 
                              ? 'No products found matching your criteria'
                              : 'No products available. Add some products to get started.'
                            }
                          </td>
                        </tr>
                      ) : (
                        paginatedProducts.map((product) => (
                          <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="font-medium">{product.product_code}</div>
                              {(product.size || product.color) && (
                                <div className="text-sm text-muted-foreground">
                                  {[product.size, product.color].filter(Boolean).join(' • ')}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-medium">{product.product_name}</div>
                              <div className="text-sm text-muted-foreground">
                                Cost: {formatCurrency(product.cost)}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="secondary">{product.category}</Badge>
                            </td>
                            <td className="p-4">{product.brand}</td>
                            <td className="p-4">
                              <div className="font-medium">{formatCurrency(product.price)}</div>
                              <div className="text-sm text-muted-foreground">
                                Margin: {((product.price - product.cost) / product.price * 100).toFixed(1)}%
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${
                                  product.stock_quantity <= product.min_stock 
                                    ? product.stock_quantity === 0 
                                      ? 'text-red-600 dark:text-red-400' 
                                      : 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {product.stock_quantity}
                                </span>
                                {product.stock_quantity <= product.min_stock && (
                                  <AlertTriangle className={`w-4 h-4 ${
                                    product.stock_quantity === 0 
                                      ? 'text-red-600 dark:text-red-400' 
                                      : 'text-yellow-600 dark:text-yellow-400'
                                  }`} />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Min: {product.min_stock}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(product)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2);
                        return page <= totalPages ? (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ) : null;
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedProducts.length === 0 ? (
                <div className="col-span-full text-center p-8 text-muted-foreground">
                  {searchTerm || filterCategory !== 'all' || filterBrand !== 'all' 
                    ? 'No products found matching your criteria'
                    : 'No products available. Add some products to get started.'
                  }
                </div>
              ) : (
                paginatedProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium text-sm truncate">{product.product_name}</h3>
                          <p className="text-xs text-muted-foreground">{product.product_code}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                            <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                          </div>
                          
                          {(product.size || product.color) && (
                            <p className="text-xs text-muted-foreground">
                              {[product.size, product.color].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
                            <span className="text-xs text-muted-foreground">
                              Margin: {((product.price - product.cost) / product.price * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Cost: {formatCurrency(product.cost)}</p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-medium ${
                              product.stock_quantity <= product.min_stock 
                                ? product.stock_quantity === 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {product.stock_quantity}
                            </span>
                            {product.stock_quantity <= product.min_stock && (
                              <AlertTriangle className={`w-3 h-3 ${
                                product.stock_quantity === 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-yellow-600 dark:text-yellow-400'
                              }`} />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">Min: {product.min_stock}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill in the product details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_code">Product Code</Label>
              <Input
                id="product_code"
                value={formData.product_code}
                onChange={(e) => handleFormChange('product_code', e.target.value)}
                placeholder="Enter product code"
              />
            </div>
            <div>
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => handleFormChange('product_name', e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                placeholder="Enter category"
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleFormChange('brand', e.target.value)}
                placeholder="Enter brand"
              />
            </div>
            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => handleFormChange('size', e.target.value)}
                placeholder="Enter size (optional)"
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleFormChange('color', e.target.value)}
                placeholder="Enter color (optional)"
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => handleFormChange('cost', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleFormChange('stock_quantity', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="min_stock">Min Stock</Label>
              <Input
                id="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={(e) => handleFormChange('min_stock', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Enter product description (optional)"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={saving}>
              {saving ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_product_code">Product Code</Label>
              <Input
                id="edit_product_code"
                value={formData.product_code}
                onChange={(e) => handleFormChange('product_code', e.target.value)}
                placeholder="Enter product code"
              />
            </div>
            <div>
              <Label htmlFor="edit_product_name">Product Name</Label>
              <Input
                id="edit_product_name"
                value={formData.product_name}
                onChange={(e) => handleFormChange('product_name', e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="edit_category">Category</Label>
              <Input
                id="edit_category"
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                placeholder="Enter category"
              />
            </div>
            <div>
              <Label htmlFor="edit_brand">Brand</Label>
              <Input
                id="edit_brand"
                value={formData.brand}
                onChange={(e) => handleFormChange('brand', e.target.value)}
                placeholder="Enter brand"
              />
            </div>
            <div>
              <Label htmlFor="edit_size">Size</Label>
              <Input
                id="edit_size"
                value={formData.size}
                onChange={(e) => handleFormChange('size', e.target.value)}
                placeholder="Enter size (optional)"
              />
            </div>
            <div>
              <Label htmlFor="edit_color">Color</Label>
              <Input
                id="edit_color"
                value={formData.color}
                onChange={(e) => handleFormChange('color', e.target.value)}
                placeholder="Enter color (optional)"
              />
            </div>
            <div>
              <Label htmlFor="edit_price">Price</Label>
              <Input
                id="edit_price"
                type="number"
                value={formData.price}
                onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="edit_cost">Cost</Label>
              <Input
                id="edit_cost"
                type="number"
                value={formData.cost}
                onChange={(e) => handleFormChange('cost', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="edit_stock_quantity">Stock Quantity</Label>
              <Input
                id="edit_stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleFormChange('stock_quantity', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="edit_min_stock">Min Stock</Label>
              <Input
                id="edit_min_stock"
                type="number"
                value={formData.min_stock}
                onChange={(e) => handleFormChange('min_stock', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit_description">Description</Label>
            <Textarea
              id="edit_description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Enter product description (optional)"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProduct} disabled={saving}>
              {saving ? 'Updating...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}