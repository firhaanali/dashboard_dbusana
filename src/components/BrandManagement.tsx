import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Search, 
  Plus,
  Edit, 
  Trash2, 
  Eye,
  Zap,
  Package,
  BarChart3,
  RefreshCw,
  Upload,
  Download,
  Save,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  AlertTriangle,
  CheckCircle,
  Star,
  Building,
  Database,
  Globe
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { simpleApiBrands, simpleApiProducts, checkSimpleBackendHealth, withSimpleRetry } from '../utils/simpleApiUtils';
import { ApiErrorHandler } from './ApiErrorHandler';

interface Brand {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo_color?: string;
  is_premium?: boolean;
  created_at: string;
  updated_at: string;
}

interface BrandStats {
  totalBrands: number;
  totalProducts: number;
  brandsWithProducts: number;
  emptyBrandsCount: number;
  premiumBrands: number;
  brandProductCounts: Array<{ brand: string; productCount: number }>;
}

// Brand Card Component
function BrandCard({ brand, productCount, onEdit, onDelete, onView }: {
  brand: Brand;
  productCount: number;
  onEdit: (brand: Brand) => void;
  onDelete: (brandId: string) => void;
  onView: (brand: Brand) => void;
}) {
  const getStatusColor = () => {
    if (productCount === 0) return 'text-muted-foreground bg-muted';
    if (productCount < 5) return 'text-accent-primary bg-accent-muted';
    return 'text-accent-primary bg-accent-secondary';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {brand.logo_color && (
                <div 
                  className="w-3 h-3 rounded border border-accent-border"
                  style={{ backgroundColor: brand.logo_color }}
                />
              )}
              <h3 className="font-medium text-foreground flex items-center gap-2">
                {brand.name}
                {brand.is_premium && (
                  <Star className="w-3 h-3 text-accent-primary fill-current" />
                )}
              </h3>
            </div>
            {brand.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{brand.description}</p>
            )}
            {brand.website && (
              <p className="text-xs text-accent-primary mt-1 truncate">{brand.website}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onView(brand)}>
              <Eye className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(brand)}>
              <Edit className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(brand.id)} className="text-destructive">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Products</span>
            <Badge className={`text-xs ${getStatusColor()} border-0`}>
              {productCount} items
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex gap-1">
              {brand.is_premium && (
                <Badge className="text-xs text-accent-primary bg-accent-muted border-0">
                  Premium
                </Badge>
              )}
              <Badge variant="outline" className={productCount > 0 ? 'text-accent-primary border-accent-border' : 'text-muted-foreground border-border'}>
                {productCount > 0 ? 'Active' : 'Empty'}
              </Badge>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Created: {new Date(brand.created_at).toLocaleDateString('id-ID')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Component
export function BrandManagement() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    description: '',
    website: '',
    logo_color: '#3B82F6',
    is_premium: false
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    website: '',
    logo_color: '',
    is_premium: false
  });

  // Fetch brands from API
  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isHealthy = await checkSimpleBackendHealth();
      if (!isHealthy) {
        // Set empty brands array instead of showing error
        setBrands([]);
        setLoading(false);
        return;
      }
      
      const result = await withSimpleRetry(() => simpleApiBrands.getAll());
      
      if (result.success) {
        setBrands(result.data || []);
        console.log(`✅ Loaded ${result.data?.length || 0} brands from database`);
      } else {
        // Check for various database/migration related errors
        const errorMessage = result.error?.toLowerCase() || '';
        const isMigrationError = 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('relation') ||
          errorMessage.includes('table') ||
          errorMessage.includes('schema') ||
          errorMessage.includes('column') ||
          errorMessage.includes('brands') ||
          errorMessage.includes('migration') ||
          errorMessage.includes('database') ||
          errorMessage.includes('failed to fetch brands');
        
        if (isMigrationError) {
          console.log('🔧 Detected migration required error for brands:', result.error);
          throw new Error('MIGRATION_REQUIRED');
        } else {
          throw new Error(result.error || 'Failed to fetch brands');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching brands:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch product counts for each brand
  const fetchProductCounts = async () => {
    try {
      const result = await withSimpleRetry(() => simpleApiProducts.getAll());
      
      if (result.success) {
        const products = result.data || [];
        const counts: Record<string, number> = {};
        
        products.forEach((product: any) => {
          const brand = product.brand || 'Unknown';
          counts[brand] = (counts[brand] || 0) + 1;
        });
        
        setProductCounts(counts);
        
        // Calculate stats
        const totalBrands = brands.length;
        const totalProducts = products.length;
        const brandsWithProducts = Object.keys(counts).length;
        const emptyBrandsCount = Math.max(0, totalBrands - brandsWithProducts);
        const premiumBrands = brands.filter(brand => brand.is_premium).length;
        
        const brandProductCounts = Object.entries(counts)
          .map(([brand, productCount]) => ({ brand, productCount }))
          .sort((a, b) => b.productCount - a.productCount);
        
        setStats({
          totalBrands,
          totalProducts,
          brandsWithProducts,
          emptyBrandsCount,
          premiumBrands,
          brandProductCounts
        });
      }
    } catch (err) {
      console.error('❌ Error fetching product counts:', err);
    }
  };

  // Create new brand
  const handleCreateBrand = async () => {
    if (!addFormData.name.trim()) {
      toast.error('Nama brand wajib diisi');
      return;
    }

    setFormLoading(true);
    try {
      const brandData = {
        name: addFormData.name.trim(),
        description: addFormData.description.trim() || undefined,
        website: addFormData.website.trim() || undefined,
        logo_color: addFormData.logo_color || undefined,
        is_premium: addFormData.is_premium
      };

      const result = await withSimpleRetry(() => simpleApiBrands.create(brandData));

      if (result.success) {
        toast.success('✅ Brand berhasil ditambahkan!');
        setAddDialogOpen(false);
        setAddFormData({ name: '', description: '', website: '', logo_color: '#3B82F6', is_premium: false });
        fetchBrands();
        fetchProductCounts();
      } else {
        throw new Error(result.error || 'Failed to create brand');
      }
    } catch (err) {
      console.error('❌ Error creating brand:', err);
      toast.error(`Gagal menambahkan brand: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Update existing brand
  const handleUpdateBrand = async () => {
    if (!selectedBrand) return;
    
    if (!editFormData.name.trim()) {
      toast.error('Nama brand wajib diisi');
      return;
    }

    setFormLoading(true);
    try {
      const brandData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        website: editFormData.website.trim() || undefined,
        logo_color: editFormData.logo_color || undefined,
        is_premium: editFormData.is_premium
      };

      const result = await withSimpleRetry(() => simpleApiBrands.update(selectedBrand.id, brandData));

      if (result.success) {
        toast.success('✅ Brand berhasil diupdate!');
        setEditDialogOpen(false);
        setSelectedBrand(null);
        setEditFormData({ name: '', description: '', website: '', logo_color: '', is_premium: false });
        fetchBrands();
        fetchProductCounts();
      } else {
        throw new Error(result.error || 'Failed to update brand');
      }
    } catch (err) {
      console.error('❌ Error updating brand:', err);
      toast.error(`Gagal mengupdate brand: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit dialog open
  const handleEditDialogOpen = (brand: Brand) => {
    setSelectedBrand(brand);
    setEditFormData({
      name: brand.name,
      description: brand.description || '',
      website: brand.website || '',
      logo_color: brand.logo_color || '#3B82F6',
      is_premium: brand.is_premium || false
    });
    setEditDialogOpen(true);
  };

  // Delete brand
  const handleDeleteBrand = async (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    const brandName = brand ? brand.name : 'brand ini';
    const productCount = productCounts[brandName] || 0;
    
    if (productCount > 0) {
      if (!confirm(`Brand "${brandName}" memiliki ${productCount} produk.\\n\\nMenghapus brand ini akan mengubah brand semua produk terkait menjadi "Unknown".\\n\\nApakah Anda yakin ingin melanjutkan?`)) {
        return;
      }
    } else {
      if (!confirm(`Apakah Anda yakin ingin menghapus brand "${brandName}"?`)) {
        return;
      }
    }

    try {
      const result = await withSimpleRetry(() => simpleApiBrands.delete(brandId));

      if (result.success) {
        toast.success(`✅ Brand "${brandName}" berhasil dihapus`);
        fetchBrands();
        fetchProductCounts();
      } else {
        throw new Error(result.error || 'Failed to delete brand');
      }
    } catch (err) {
      console.error('❌ Error deleting brand:', err);
      toast.error(`Gagal menghapus brand "${brandName}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Filter brands based on search
  const filteredBrands = useMemo(() => {
    return brands.filter(brand => {
      const matchesSearch = !searchTerm || 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (brand.website && brand.website.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  }, [brands, searchTerm]);

  // Paginated brands
  const paginatedBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBrands.slice(startIndex, endIndex);
  }, [filteredBrands, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Load data on component mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch product counts when brands change
  useEffect(() => {
    if (brands.length > 0) {
      fetchProductCounts();
    }
  }, [brands]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Brand Management</h1>
            <p className="text-muted-foreground">Loading brands from database...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    // Special handling for migration required error
    if (error === 'MIGRATION_REQUIRED') {
      return (
        <div className="space-y-6">
          {/* Migration Required Card */}
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Database Migration Required</h3>
                <p className="text-yellow-700 mb-4 max-w-2xl mx-auto">
                  Table Brands belum ada di database. Untuk menggunakan fitur Brand Management, 
                  Anda perlu menjalankan migration terlebih dahulu untuk membuat table yang diperlukan.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white/50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">✅ Aman</h4>
                    <p className="text-sm text-yellow-700">Migration tidak akan mengganggu data produk yang sudah ada</p>
                  </div>
                  <div className="p-4 bg-white/50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">🏢 4 Brands</h4>
                    <p className="text-sm text-yellow-700">Default brands akan ditambahkan otomatis</p>
                  </div>
                  <div className="p-4 bg-white/50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">🔧 Quick Fix</h4>
                    <p className="text-sm text-yellow-700">Migration dapat dijalankan dalam 1 menit</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button 
                    onClick={() => window.open('/database-migration', '_blank')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Open Migration Runner
                  </Button>
                  <Button variant="outline" onClick={fetchBrands}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Regular error handling
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Brand Management</h1>
            <p className="text-muted-foreground">Error loading brands</p>
          </div>
        </div>
        
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-destructive mb-2">Error Loading Brands</h3>
            <p className="text-destructive/80 mb-4">{error}</p>
            <Button onClick={fetchBrands} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1>Brand Management</h1>
          <p className="text-muted-foreground">
            Kelola master data brand produk D'Busana dari database PostgreSQL
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Brand
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Brands</p>
                <p>{stats?.totalBrands || 0}</p>
              </div>
              <Building className="w-8 h-8 text-accent-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brands with Products</p>
                <p>{stats?.brandsWithProducts || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-accent-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Premium Brands</p>
                <p>{stats?.premiumBrands || 0}</p>
              </div>
              <Star className="w-8 h-8 text-accent-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p>{stats?.totalProducts || 0}</p>
              </div>
              <Package className="w-8 h-8 text-accent-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {brands.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-semibold text-amber-800 mb-2">Belum Ada Brand</h3>
              <p className="text-amber-700 mb-4">
                Tambahkan brand pertama untuk memulai manajemen brand produk
              </p>
              <Button 
                onClick={() => setAddDialogOpen(true)} 
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Brand
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Brands Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedBrands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                productCount={productCounts[brand.name] || 0}
                onView={(brand) => {
                  setSelectedBrand(brand);
                  setDetailDialogOpen(true);
                }}
                onEdit={handleEditDialogOpen}
                onDelete={handleDeleteBrand}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}



      {/* Dialogs */}
      {/* Add Brand Dialog */}
      {addDialogOpen && (
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Brand</DialogTitle>
              <DialogDescription>
                Add a new brand to the database.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Brand Name *</Label>
                <Input
                  id="add-name"
                  placeholder="Enter brand name"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-description">Description</Label>
                <Textarea
                  id="add-description"
                  placeholder="Enter brand description (optional)"
                  value={addFormData.description}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-website">Website</Label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="add-website"
                    placeholder="https://brandwebsite.com (optional)"
                    value={addFormData.website}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-color">Logo Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="add-color"
                    type="color"
                    value={addFormData.logo_color}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, logo_color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    placeholder="#3B82F6"
                    value={addFormData.logo_color}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, logo_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="add-premium"
                  type="checkbox"
                  checked={addFormData.is_premium}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, is_premium: e.target.checked }))}
                  className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                />
                <Label htmlFor="add-premium" className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  Premium Brand
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAddDialogOpen(false);
                    setAddFormData({ name: '', description: '', website: '', logo_color: '#3B82F6', is_premium: false });
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateBrand}
                  disabled={formLoading || !addFormData.name.trim()}
                >
                  {formLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Brand
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Brand Dialog */}
      {editDialogOpen && selectedBrand && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Brand</DialogTitle>
              <DialogDescription>
                Edit brand: {selectedBrand.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Brand Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter brand name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter brand description (optional)"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="edit-website"
                    placeholder="https://brandwebsite.com (optional)"
                    value={editFormData.website}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">Logo Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="edit-color"
                    type="color"
                    value={editFormData.logo_color}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, logo_color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    placeholder="#3B82F6"
                    value={editFormData.logo_color}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, logo_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="edit-premium"
                  type="checkbox"
                  checked={editFormData.is_premium}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, is_premium: e.target.checked }))}
                  className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                />
                <Label htmlFor="edit-premium" className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  Premium Brand
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedBrand(null);
                    setEditFormData({ name: '', description: '', website: '', logo_color: '', is_premium: false });
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateBrand}
                  disabled={formLoading || !editFormData.name.trim()}
                >
                  {formLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Brand
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Brand Detail Dialog */}
      {detailDialogOpen && selectedBrand && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Brand Details</DialogTitle>
              <DialogDescription>
                {selectedBrand.name}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {selectedBrand.logo_color && (
                    <div 
                      className="w-6 h-6 rounded border-2 border-gray-200"
                      style={{ backgroundColor: selectedBrand.logo_color }}
                    />
                  )}
                  <div>
                    <strong>Name:</strong> {selectedBrand.name}
                    {selectedBrand.is_premium && (
                      <Star className="w-4 h-4 ml-2 inline text-yellow-500 fill-current" />
                    )}
                  </div>
                </div>
                {selectedBrand.description && (
                  <div>
                    <strong>Description:</strong> {selectedBrand.description}
                  </div>
                )}
                {selectedBrand.website && (
                  <div>
                    <strong>Website:</strong> 
                    <a 
                      href={selectedBrand.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      {selectedBrand.website}
                    </a>
                  </div>
                )}
                <div>
                  <strong>Products:</strong> {productCounts[selectedBrand.name] || 0}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <div className="flex gap-1 mt-1">
                    {selectedBrand.is_premium && (
                      <Badge className="text-xs text-yellow-600 bg-yellow-100 border-0">
                        Premium
                      </Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className={(productCounts[selectedBrand.name] || 0) > 0 ? 'text-green-600 border-green-300' : 'text-gray-500 border-gray-300'}
                    >
                      {(productCounts[selectedBrand.name] || 0) > 0 ? 'Active' : 'Empty'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <strong>Created:</strong> {new Date(selectedBrand.created_at).toLocaleString('id-ID')}
                </div>
                <div>
                  <strong>Updated:</strong> {new Date(selectedBrand.updated_at).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}