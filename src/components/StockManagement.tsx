import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  AlertTriangle, 
  RefreshCw,
  Loader2,
  Database,
  AlertCircle,
  BarChart3,
  Upload,
  Search,
  Filter,
  Edit,
  Save,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner@2.0.3';
import { api } from '../services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  History,
  Clock
} from 'lucide-react';
import { formatDateSimple } from '../utils/dateUtils';
import { makeSimpleApiRequest } from '../utils/simpleApiUtils';
import { logStockActivity } from '../utils/activityLogger';

// Enhanced interfaces
interface Product {
  id: string;
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
  created_at: string;
  updated_at: string;
}

interface StockStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  totalBrands: number;
  reconciliationNeeded?: number;
}

interface StockMovement {
  id: string;
  product_code: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_number?: string;
  notes?: string;
  movement_date: string;
  product?: {
    product_name: string;
    category: string;
    brand: string;
  };
}

interface StockManagementProps {}

export function StockManagement({}: StockManagementProps = {}) {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [stockStats, setStockStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingStock, setEditingStock] = useState<{[key: string]: number}>({});

  // Stock Movement states
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [isCreateMovementOpen, setIsCreateMovementOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // New movement form
  const [newMovement, setNewMovement] = useState({
    product_code: '',
    movement_type: '' as 'in' | 'out' | 'adjustment',
    quantity: '',
    reference_number: '',
    notes: '',
    reason: ''
  });

  // Helper functions
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Update stats when products change
  useEffect(() => {
    if (products.length > 0) {
      const stats = calculateStatsFromProducts(products);
      setStockStats(stats);
    }
  }, [products]);

  const loadAllData = async () => {
    await Promise.all([
      loadProducts(),
      loadStockStats(),
      loadRecentMovements()
    ]);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Use makeSimpleApiRequest for consistent product loading
      const result = await makeSimpleApiRequest('/products');
      
      if (result.success && result.data) {
        // Transform API data to match our Product interface
        const transformedProducts = result.data.map((item: any, index: number) => ({
          id: item.id || `product-${Date.now()}-${index}`,
          product_code: item.product_code || item.code || `P${index + 1}`,
          product_name: item.product_name || item.name || 'Unknown Product',
          category: item.category || 'General',
          brand: item.brand || 'Unknown Brand',  
          size: item.size || '',
          color: item.color || '',
          price: safeNumber(item.price || item.unit_price, 0),
          cost: safeNumber(item.cost || item.cost_price, 0),
          stock_quantity: safeNumber(item.stock_quantity, 0),
          min_stock: safeNumber(item.min_stock, 5),
          description: item.description || '',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));
        
        setProducts(transformedProducts);
      } else {
        // API returned success but no data, or failed gracefully
        setProducts([]);
      }
    } catch (error) {
      console.log('💡 Backend not available, showing empty state');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStockStats = async () => {
    try {
      // Use makeSimpleApiRequest for consistent stats loading
      const result = await makeSimpleApiRequest('/stock/stats');
      
      if (result.success && result.data) {
        setStockStats(result.data);
      } else {
        throw new Error('API returned no data');
      }
    } catch (error) {
      console.log('💡 Using calculated stats instead of API');
      
      // Calculate stats from current products as fallback
      if (products.length > 0) {
        const stats = calculateStatsFromProducts(products);
        setStockStats(stats);
        console.log('✅ Stock stats calculated from current products');
      } else {
        // Set default empty stats
        setStockStats({
          totalProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          totalCategories: 0,
          totalBrands: 0,
          reconciliationNeeded: 0
        });
      }
    }
  };

  const calculateStatsFromProducts = (productList: Product[]): StockStats => {
    const totalProducts = productList.length;
    const outOfStockProducts = productList.filter(p => safeNumber(p.stock_quantity) === 0).length;
    const lowStockProducts = productList.filter(p => 
      safeNumber(p.stock_quantity) > 0 && safeNumber(p.stock_quantity) <= safeNumber(p.min_stock)
    ).length;
    const totalCategories = new Set(productList.map(p => p.category || 'Unknown')).size;
    const totalBrands = new Set(productList.map(p => p.brand || 'Unknown')).size;

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalCategories,
      totalBrands,
      reconciliationNeeded: 0
    };
  };

  // Stock management functions
  const updateProductStockAPI = async (productId: string, newStock: number) => {
    try {
      // Use the stock controller endpoint which automatically creates stock movements
      const response = await fetch(`http://localhost:3001/api/stock/products/${productId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stock_quantity: newStock,
          notes: `Manual stock update via Stock Management interface`
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Product stock updated with movement tracking: ${productId} -> ${newStock}`);
        console.log(`📝 Stock movement created:`, result.stockMovement);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Failed to update product stock:', error);
      return false;
    }
  };

  const handleStockEdit = async (productId: string, newStock: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Produk tidak ditemukan');
      return;
    }

    const oldStock = product.stock_quantity;

    // Update UI immediately (optimistic update)
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, stock_quantity: newStock, updated_at: new Date().toISOString() }
        : p
    ));

    // Remove from editing state
    setEditingStock(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });

    // Show success feedback
    toast.success('Stock berhasil diupdate!', {
      description: `${product.product_name}: ${oldStock} → ${newStock}`,
      duration: 3000
    });

    // ✅ LOG STOCK ACTIVITY - Real-time activity logging
    try {
      const action = newStock > oldStock ? 'increase' : 'decrease';
      const quantityChange = Math.abs(newStock - oldStock);
      await logStockActivity(product.product_name, action, quantityChange);
      console.log('✅ Stock activity logged:', { product: product.product_name, action, change: quantityChange });
    } catch (activityError) {
      console.warn('Failed to log stock activity:', activityError);
      // Don't fail the stock update if activity logging fails
    }

    try {
      // Update in database
      const success = await updateProductStockAPI(productId, newStock);
      
      if (!success) {
        throw new Error('Gagal menyimpan ke database');
      }
      
      console.log('✅ Stock update synced to backend successfully');
    } catch (error) {
      console.error('❌ Backend sync failed:', error);
      
      // Revert optimistic update if backend fails
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, stock_quantity: oldStock }
          : p
      ));
      
      toast.error('Gagal menyinkronkan ke database', {
        description: 'Stock telah dikembalikan ke nilai sebelumnya. Coba lagi.',
        duration: 5000
      });
    }
  };

  const handleQuickStockAdjustment = async (productId: string, adjustment: number, type: 'add' | 'subtract') => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentStock = product.stock_quantity;
    const newStock = type === 'add' ? currentStock + adjustment : currentStock - adjustment;

    // Validate adjustment
    if (newStock < 0) {
      toast.error('Stock tidak boleh negatif');
      return;
    }

    await handleStockEdit(productId, newStock);
  };

  const getStockStatus = (product: Product) => {
    const stockQty = safeNumber(product.stock_quantity);
    const minStock = safeNumber(product.min_stock);
    
    if (stockQty < 0) {
      return { status: 'negative_stock', label: 'Stock Negatif', color: 'destructive' };
    } else if (stockQty === 0) {
      return { status: 'out_of_stock', label: 'Habis', color: 'destructive' };
    } else if (stockQty <= minStock) {
      return { status: 'low_stock', label: 'Stok Rendah', color: 'secondary' };
    } else {
      return { status: 'in_stock', label: 'Tersedia', color: 'default' };
    }
  };

  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(price)) {
      return 'Rp 0';
    }
    return `Rp ${Number(price).toLocaleString('id-ID')}`;
  };

  // Stock Movement functions
  const loadRecentMovements = async () => {
    try {
      setMovementLoading(true);
      const result = await makeSimpleApiRequest('/stock/movements?limit=20');
      
      if (result.success && result.data) {
        setMovements(result.data);
        console.log('✅ Loaded recent movements:', result.data.length);
      } else {
        console.warn('⚠️ No movements data:', result.error);
        setMovements([]);
      }
    } catch (error) {
      console.error('❌ Failed to load movements:', error);
      setMovements([]);
    } finally {
      setMovementLoading(false);
    }
  };

  const createMovement = async () => {
    if (!newMovement.product_code || !newMovement.movement_type || !newMovement.quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    setCreateLoading(true);
    
    try {
      const selectedProduct = products.find(p => p.product_code === newMovement.product_code);
      const quantity = parseInt(newMovement.quantity);
      
      // Build notes with reason if provided
      let notes = newMovement.notes;
      if (newMovement.reason && newMovement.reason !== 'Other') {
        notes = newMovement.reason + (notes ? ` - ${notes}` : '');
      }
      
      const result = await makeSimpleApiRequest('/stock/movements', {
        method: 'POST',
        data: {
          product_code: newMovement.product_code,
          movement_type: newMovement.movement_type,
          quantity: quantity,
          reference_number: newMovement.reference_number || undefined,
          notes: notes || undefined
        }
      });
      
      if (result.success) {
        toast.success('Stock movement created successfully!', {
          description: `${selectedProduct?.product_name}: ${result.data.previousStock} → ${result.data.newStock}`
        });

        // ✅ LOG STOCK MOVEMENT ACTIVITY
        try {
          const action = newMovement.movement_type === 'in' ? 'increase' : 
                        newMovement.movement_type === 'out' ? 'decrease' : 'adjustment';
          await logStockActivity(
            selectedProduct?.product_name || newMovement.product_code,
            action as 'increase' | 'decrease',
            quantity
          );
          console.log('✅ Stock movement activity logged');
        } catch (activityError) {
          console.warn('Failed to log stock movement activity:', activityError);
        }
        
        // Reset form and close dialog
        setNewMovement({
          product_code: '',
          movement_type: '' as any,
          quantity: '',
          reference_number: '',
          notes: '',
          reason: ''
        });
        setIsCreateMovementOpen(false);
        
        // Reload data
        await loadAllData();
      } else {
        toast.error(result.error || 'Failed to create movement');
      }
    } catch (error) {
      console.error('❌ Failed to create movement:', error);
      toast.error('Failed to create movement');
    } finally {
      setCreateLoading(false);
    }
  };

  const getMovementTypeConfig = (type: string) => {
    const types = {
      in: { label: 'Stock In', icon: ArrowUpRight, color: 'bg-accent-muted text-accent-secondary-foreground border-accent-border' },
      out: { label: 'Stock Out', icon: ArrowDownRight, color: 'bg-destructive/10 text-destructive border-destructive/30' },
      adjustment: { label: 'Adjustment', icon: Activity, color: 'bg-accent-secondary text-accent-secondary-foreground border-accent-border' }
    };
    return types[type as keyof typeof types] || types.adjustment;
  };

  const formatQuantity = (quantity: number, type: string) => {
    const prefix = type === 'in' ? '+' : type === 'out' ? '-' : '=';
    return `${prefix}${quantity}`;
  };

  const MOVEMENT_TYPES = [
    { value: 'in', label: 'Stock In', icon: ArrowUpRight },
    { value: 'out', label: 'Stock Out', icon: ArrowDownRight },
    { value: 'adjustment', label: 'Adjustment', icon: Activity }
  ];

  const MOVEMENT_REASONS = {
    in: ['Purchase', 'Return', 'Production', 'Transfer In', 'Other'],
    out: ['Sale', 'Damage', 'Loss', 'Transfer Out', 'Other'],
    adjustment: ['Recount', 'Correction', 'System Sync', 'Other']
  };

  // Filter products based on search and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      (product.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.product_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const stockStatus = getStockStatus(product);
    const matchesFilter = filterStatus === 'all' || stockStatus.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Stock Management</h1>
          <p className="text-muted-foreground">
            Kelola inventory dan stock movements untuk produk D'Busana
          </p>
        </div>
      </div>

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding products in the Products Management page to manage their stock levels.
            </p>
            <Button onClick={() => navigate('/products')}>
              <Package className="w-4 h-4 mr-2" />
              Go to Products Management
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading products...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      {products.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p>{stockStats?.totalProducts || 0}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-yellow-600">{stockStats?.lowStockProducts || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <p className="text-destructive">{stockStats?.outOfStockProducts || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categories</p>
                  <p className="text-green-600">{stockStats?.totalCategories || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      {products.length > 0 && !loading && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk berdasarkan nama atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="in_stock">Tersedia</SelectItem>
                <SelectItem value="low_stock">Stock Rendah</SelectItem>
                <SelectItem value="out_of_stock">Habis</SelectItem>
                <SelectItem value="negative_stock">Stock Negatif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Menampilkan {filteredProducts.length} dari {products.length} produk
          </div>
        </div>
      )}

      {/* Main Content with Tabs */}
      {products.length > 0 && !loading && (
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
            <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            {/* Inventory Management Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Daftar Produk ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode Produk</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Min Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product);
                        const isEditing = editingStock.hasOwnProperty(product.id);
                        
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-sm">
                              {product.product_code}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{product.product_name}</div>
                                {(product.size || product.color) && (
                                  <div className="text-sm text-muted-foreground">
                                    {[product.size, product.color].filter(Boolean).join(' • ')}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>{product.brand}</TableCell>
                            <TableCell>{formatPrice(product.price)}</TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={editingStock[product.id]}
                                    onChange={(e) => setEditingStock(prev => ({
                                      ...prev,
                                      [product.id]: parseInt(e.target.value) || 0
                                    }))}
                                    className="w-20 h-8"
                                    min="0"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleStockEdit(product.id, editingStock[product.id])}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingStock(prev => {
                                      const newState = { ...prev };
                                      delete newState[product.id];
                                      return newState;
                                    })}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{product.stock_quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingStock(prev => ({
                                      ...prev,
                                      [product.id]: product.stock_quantity
                                    }))}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{product.min_stock}</TableCell>
                            <TableCell>
                              <Badge variant={stockStatus.color as any}>
                                {stockStatus.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickStockAdjustment(product.id, 1, 'add')}
                                  className="h-6 w-6 p-0"
                                  title="Tambah 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickStockAdjustment(product.id, 1, 'subtract')}
                                  className="h-6 w-6 p-0"
                                  title="Kurang 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            {/* Stock Movements Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Stock Movements
                  </CardTitle>
                  <Button onClick={() => setIsCreateMovementOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Movement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {movementLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading movements...
                  </div>
                ) : movements.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="mb-2">No Stock Movements</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first stock movement to track inventory changes.
                    </p>
                    <Button onClick={() => setIsCreateMovementOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Movement
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {movements.map((movement) => {
                      const config = getMovementTypeConfig(movement.movement_type);
                      const Icon = config.icon;
                      
                      return (
                        <div
                          key={movement.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded border ${config.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {movement.product?.product_name || movement.product_code}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {config.label} • {formatQuantity(movement.quantity, movement.movement_type)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {formatDateSimple(movement.movement_date)}
                            </div>
                            {movement.reference_number && (
                              <div className="text-xs text-muted-foreground">
                                Ref: {movement.reference_number}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Movement Dialog */}
      <Dialog open={isCreateMovementOpen} onOpenChange={setIsCreateMovementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Stock Movement</DialogTitle>
            <DialogDescription>
              Record a new stock movement for inventory tracking.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-select">Product</Label>
              <Select value={newMovement.product_code} onValueChange={(value) => 
                setNewMovement(prev => ({ ...prev, product_code: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.product_code}>
                      {product.product_name} ({product.product_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-type">Movement Type</Label>
              <Select value={newMovement.movement_type} onValueChange={(value: any) => 
                setNewMovement(prev => ({ ...prev, movement_type: value, reason: '' }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select movement type" />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {newMovement.movement_type && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select value={newMovement.reason} onValueChange={(value) => 
                  setNewMovement(prev => ({ ...prev, reason: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVEMENT_REASONS[newMovement.movement_type as keyof typeof MOVEMENT_REASONS]?.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={newMovement.quantity}
                onChange={(e) => setNewMovement(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number (Optional)</Label>
              <Input
                id="reference"
                placeholder="e.g., PO-123, INV-456"
                value={newMovement.reference_number}
                onChange={(e) => setNewMovement(prev => ({ ...prev, reference_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={newMovement.notes}
                onChange={(e) => setNewMovement(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateMovementOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createMovement}
              disabled={createLoading || !newMovement.product_code || !newMovement.movement_type || !newMovement.quantity}
            >
              {createLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Movement'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}