// File ini sudah diganti dengan CategoryManagement.tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Plus,
  Edit, 
  Trash2, 
  Eye,
  Tag,
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
  Database
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { simpleApiCategories, simpleApiProducts, checkSimpleBackendHealth, withSimpleRetry } from '../utils/simpleApiUtils';

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

interface CategoryStats {
  totalCategories: number;
  totalProducts: number;
  categoriesWithProducts: number;
  emptyCategoriesCount: number;
  categoryProductCounts: Array<{ category: string; productCount: number }>;
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    color: ''
  });

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isHealthy = await checkSimpleBackendHealth();
      if (!isHealthy) {
        throw new Error('Backend server is not running or not reachable at localhost:3001');
      }
      
      const result = await withSimpleRetry(() => simpleApiCategories.getAll());
      
      if (result.success) {
        setCategories(result.data || []);
        console.log(`✅ Loaded ${result.data?.length || 0} categories from database`);
      } else {
        // Check for various database/migration related errors
        const errorMessage = result.error?.toLowerCase() || '';
        const isMigrationError = 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('relation') ||
          errorMessage.includes('table') ||
          errorMessage.includes('schema') ||
          errorMessage.includes('column') ||
          errorMessage.includes('categories') ||
          errorMessage.includes('migration') ||
          errorMessage.includes('database') ||
          errorMessage.includes('failed to fetch categories');
        
        if (isMigrationError) {
          console.log('🔧 Detected migration required error for categories:', result.error);
          throw new Error('MIGRATION_REQUIRED');
        } else {
          throw new Error(result.error || 'Failed to fetch categories');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch product counts for each category
  const fetchProductCounts = async () => {
    try {
      const result = await withSimpleRetry(() => simpleApiProducts.getAll());
      
      if (result.success) {
        const products = result.data || [];
        const counts: Record<string, number> = {};
        
        products.forEach((product: any) => {
          const category = product.category || 'Unknown';
          counts[category] = (counts[category] || 0) + 1;
        });
        
        setProductCounts(counts);
        
        // Calculate stats
        const totalCategories = categories.length;
        const totalProducts = products.length;
        const categoriesWithProducts = Object.keys(counts).length;
        const emptyCategoriesCount = Math.max(0, totalCategories - categoriesWithProducts);
        
        const categoryProductCounts = Object.entries(counts)
          .map(([category, productCount]) => ({ category, productCount }))
          .sort((a, b) => b.productCount - a.productCount);
        
        setStats({
          totalCategories,
          totalProducts,
          categoriesWithProducts,
          emptyCategoriesCount,
          categoryProductCounts
        });
      }
    } catch (err) {
      console.error('❌ Error fetching product counts:', err);
    }
  };

  // Create new category
  const handleCreateCategory = async () => {
    if (!addFormData.name.trim()) {
      toast.error('Nama kategori wajib diisi');
      return;
    }

    setFormLoading(true);
    try {
      const categoryData = {
        name: addFormData.name.trim(),
        description: addFormData.description.trim() || undefined,
        color: addFormData.color || undefined
      };

      const result = await withSimpleRetry(() => simpleApiCategories.create(categoryData));

      if (result.success) {
        toast.success('✅ Kategori berhasil ditambahkan!');
        setAddDialogOpen(false);
        setAddFormData({ name: '', description: '', color: '#3B82F6' });
        fetchCategories();
        fetchProductCounts();
      } else {
        throw new Error(result.error || 'Failed to create category');
      }
    } catch (err) {
      console.error('❌ Error creating category:', err);
      toast.error(`Gagal menambahkan kategori: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Update existing category
  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    
    if (!editFormData.name.trim()) {
      toast.error('Nama kategori wajib diisi');
      return;
    }

    setFormLoading(true);
    try {
      const categoryData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        color: editFormData.color || undefined
      };

      const result = await withSimpleRetry(() => simpleApiCategories.update(selectedCategory.id, categoryData));

      if (result.success) {
        toast.success('✅ Kategori berhasil diupdate!');
        setEditDialogOpen(false);
        setSelectedCategory(null);
        setEditFormData({ name: '', description: '', color: '' });
        fetchCategories();
        fetchProductCounts();
      } else {
        throw new Error(result.error || 'Failed to update category');
      }
    } catch (err) {
      console.error('❌ Error updating category:', err);
      toast.error(`Gagal mengupdate kategori: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit dialog open
  const handleEditDialogOpen = (category: Category) => {
    setSelectedCategory(category);
    setEditFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6'
    });
    setEditDialogOpen(true);
  };

  // Delete category
  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : 'kategori ini';
    const productCount = productCounts[categoryName] || 0;
    
    if (productCount > 0) {
      if (!confirm(`Kategori "${categoryName}" memiliki ${productCount} produk.\\n\\nMenghapus kategori ini akan mengubah kategori semua produk terkait menjadi "Unknown".\\n\\nApakah Anda yakin ingin melanjutkan?`)) {
        return;
      }
    } else {
      if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryName}"?`)) {
        return;
      }
    }

    try {
      const result = await withSimpleRetry(() => simpleApiCategories.delete(categoryId));

      if (result.success) {
        toast.success(`✅ Kategori "${categoryName}" berhasil dihapus`);
        fetchCategories();
        fetchProductCounts();
      } else {
        throw new Error(result.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('❌ Error deleting category:', err);
      toast.error(`Gagal menghapus kategori "${categoryName}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Show all categories (no filtering)
  const filteredCategories = useMemo(() => {
    return categories;
  }, [categories]);

  // Paginated categories
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  // Load data on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch product counts when categories change
  useEffect(() => {
    if (categories.length > 0) {
      fetchProductCounts();
    }
  }, [categories]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Category Management</h1>
            <p className="text-muted-foreground">Loading categories from database...</p>
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
                <h3 className="text-yellow-900 mb-2">Database Migration Required</h3>
                <p className="text-yellow-700 mb-4 max-w-2xl mx-auto">
                  Table Categories belum ada di database. Untuk menggunakan fitur Category Management, 
                  Anda perlu menjalankan migration terlebih dahulu untuk membuat table yang diperlukan.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white/50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">✅ Aman</h4>
                    <p className="text-sm text-yellow-700">Migration tidak akan mengganggu data produk yang sudah ada</p>
                  </div>
                  <div className="p-4 bg-white/50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">📊 5 Categories</h4>
                    <p className="text-sm text-yellow-700">Default categories akan ditambahkan otomatis</p>
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
                  <Button variant="outline" onClick={fetchCategories}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Again
                  </Button>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-100 rounded-lg text-left max-w-2xl mx-auto">
                  <h4 className="font-medium text-yellow-900 mb-2">🚀 Quick Migration Options:</h4>
                  <div className="space-y-2 text-sm text-yellow-800">
                    <div><strong>Option 1:</strong> Use Migration Runner → <span className="font-mono text-xs">/database-migration</span></div>
                    <div><strong>Option 2:</strong> Backend command → <span className="font-mono text-xs">cd backend && node src/scripts/runMigration.js</span></div>
                    <div><strong>Option 3:</strong> Manual SQL → <span className="font-mono text-xs">backend/prisma/migrations/001_add_categories_brands.sql</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Placeholder Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Dress', 'Blouse', 'Pants', 'Skirt', 'Outer'].map((categoryName, index) => (
              <Card key={index} className="opacity-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-pink-400' : index === 1 ? 'bg-teal-400' : index === 2 ? 'bg-blue-400' : index === 3 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <h3 className="font-medium">{categoryName}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {index === 0 ? 'Koleksi dress dan gaun' : 
                     index === 1 ? 'Koleksi blouse dan atasan' :
                     index === 2 ? 'Koleksi celana panjang dan pendek' :
                     index === 3 ? 'Koleksi rok dan midi skirt' :
                     'Koleksi jaket dan cardigan'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Products</span>
                    <Badge className="text-xs text-muted-foreground bg-muted border-0">
                      Will be available after migration
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // Regular error handling
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Category Management</h1>
            <p className="text-muted-foreground">Error loading categories</p>
          </div>
        </div>
        
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-destructive mb-2">Error Loading Categories</h3>
            <p className="text-destructive/80 mb-4">{error}</p>
            <Button onClick={fetchCategories} variant="outline">
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
          <h1>Categories</h1>
          <p className="text-muted-foreground">
            Sistem manajemen kategori bisnis fashion terintegrasi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Categories</p>
                <p>{stats?.totalCategories || 0}</p>
              </div>
              <Tag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories with Products</p>
                <p>{stats?.categoriesWithProducts || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Empty Categories</p>
                <p>{stats?.emptyCategoriesCount || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
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
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {category.color && (
                      <div 
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <h3 className="font-medium">{category.name}</h3>
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedCategory(category);
                    setDetailDialogOpen(true);
                  }}>
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEditDialogOpen(category)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)} className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Products</span>
                  <Badge className="text-xs bg-accent-secondary text-accent-secondary-foreground border-0">
                    {productCounts[category.name] || 0} items
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={(productCounts[category.name] || 0) > 0 ? 'text-green-600 border-green-300' : 'text-muted-foreground border-border'}>
                    {(productCounts[category.name] || 0) > 0 ? 'Active' : 'Empty'}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Created: {new Date(category.created_at).toLocaleDateString('id-ID')}
                </div>
              </div>
            </CardContent>
          </Card>
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

      {/* Dialogs */}
      {/* Add Category Dialog */}
      {addDialogOpen && (
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Add a new category to the database.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Category Name *</Label>
                <Input
                  id="add-name"
                  placeholder="Enter category name"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-description">Description</Label>
                <Textarea
                  id="add-description"
                  placeholder="Enter category description (optional)"
                  value={addFormData.description}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-color">Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="add-color"
                    type="color"
                    value={addFormData.color}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    placeholder="#3B82F6"
                    value={addFormData.color}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAddDialogOpen(false);
                    setAddFormData({ name: '', description: '', color: '#3B82F6' });
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCategory}
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
                      Save Category
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Category Dialog */}
      {editDialogOpen && selectedCategory && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Edit category: {selectedCategory.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter category name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter category description (optional)"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="edit-color"
                    type="color"
                    value={editFormData.color}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    placeholder="#3B82F6"
                    value={editFormData.color}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedCategory(null);
                    setEditFormData({ name: '', description: '', color: '' });
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateCategory}
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
                      Update Category
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail Category Dialog */}
      {detailDialogOpen && selectedCategory && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedCategory.color && (
                  <div 
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                )}
                {selectedCategory.name}
              </DialogTitle>
              <DialogDescription>
                Category details and statistics
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm mt-1">{selectedCategory.name}</p>
                </div>
                
                {selectedCategory.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm mt-1 text-muted-foreground">{selectedCategory.description}</p>
                  </div>
                )}
                
                <div>
                  <Label>Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedCategory.color && (
                      <div 
                        className="w-6 h-6 rounded border border-border"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                    )}
                    <span className="text-sm font-mono">{selectedCategory.color || 'No color set'}</span>
                  </div>
                </div>

                <div>
                  <Label>Products</Label>
                  <p className="text-sm mt-1">{productCounts[selectedCategory.name] || 0} products in this category</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <Label>Created</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(selectedCategory.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <Label>Updated</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(selectedCategory.updated_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setDetailDialogOpen(false);
                    handleEditDialogOpen(selectedCategory);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}