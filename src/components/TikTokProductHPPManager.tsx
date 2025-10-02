import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Database, 
  Upload, 
  Download, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  BarChart3,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  Ruler
} from 'lucide-react';
import { useProductHPP, ProductHPP } from '../hooks/useProductHPP';
import * as XLSX from 'xlsx@0.18.5';

interface TikTokProductHPPManagerProps {
  onProductSelect?: (product: ProductHPP) => void;
}

const TikTokProductHPPManager: React.FC<TikTokProductHPPManagerProps> = ({ onProductSelect }) => {
  const {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    importFromExcel,
    exportToJSON,
    clearDatabase,
    getStatistics
  } = useProductHPP();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductHPP | null>(null);
  const [importResults, setImportResults] = useState<{success: number, updated: number, errors: string[]} | null>(null);
  const [newProduct, setNewProduct] = useState({
    nama_produk: '',
    size: '',
    hpp: '',
    kategori: '',
    deskripsi: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filteredProducts = searchProducts(searchQuery);
  const stats = getStatistics();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAddProduct = async () => {
    if (!newProduct.nama_produk.trim() || !newProduct.hpp) {
      alert('Nama produk dan HPP harus diisi');
      return;
    }

    try {
      await addProduct({
        nama_produk: newProduct.nama_produk.trim(),
        size: newProduct.size.trim() || undefined,
        hpp: parseFloat(newProduct.hpp),
        kategori: newProduct.kategori.trim() || undefined,
        deskripsi: newProduct.deskripsi.trim() || undefined
      });

      setNewProduct({ nama_produk: '', size: '', hpp: '', kategori: '', deskripsi: '' });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding product:', error);
      // Error will be shown through the error state in the hook
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !newProduct.nama_produk.trim() || !newProduct.hpp) {
      alert('Nama produk dan HPP harus diisi');
      return;
    }

    try {
      await updateProduct(editingProduct.id, {
        nama_produk: newProduct.nama_produk.trim(),
        size: newProduct.size.trim() || undefined,
        hpp: parseFloat(newProduct.hpp),
        kategori: newProduct.kategori.trim() || undefined,
        deskripsi: newProduct.deskripsi.trim() || undefined
      });

      setEditingProduct(null);
      setNewProduct({ nama_produk: '', size: '', hpp: '', kategori: '', deskripsi: '' });
    } catch (error) {
      console.error('Error updating product:', error);
      // Error will be shown through the error state in the hook
    }
  };

  const startEdit = (product: ProductHPP) => {
    setEditingProduct(product);
    setNewProduct({
      nama_produk: product.nama_produk,
      size: product.size || '',
      hpp: product.hpp.toString(),
      kategori: product.kategori || '',
      deskripsi: product.deskripsi || ''
    });
    setShowAddDialog(true);
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and process data
      const rows = jsonData.slice(1) as any[][];
      const importData = rows
        .filter(row => row.length > 0 && row[0]) // Filter empty rows
        .map(row => ({
          nama_produk: row[0]?.toString().trim() || '',
          size: row[1]?.toString().trim() || '',
          hpp: parseFloat(row[2]) || 0,
          kategori: row[3]?.toString().trim() || '',
          deskripsi: row[4]?.toString().trim() || ''
        }));

      const results = await importFromExcel(importData);
      setImportResults(results);
    } catch (err) {
      alert('Gagal membaca file Excel. Pastikan format file sesuai template.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const data = exportToJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-hpp-database-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const template = [
      ['nama_produk', 'size', 'hpp', 'kategori', 'deskripsi'],
      ['Hijab Syari Premium', 'M', 45000, 'Hijab', 'Hijab syari bahan premium'],
      ['Hijab Syari Premium', 'L', 50000, 'Hijab', 'Hijab syari bahan premium ukuran L'],
      ['Gamis Casual', 'S', 110000, 'Gamis', 'Gamis untuk sehari-hari ukuran S'],
      ['Gamis Casual', 'M', 120000, 'Gamis', 'Gamis untuk sehari-hari ukuran M'],
      ['Gamis Casual', 'L', 130000, 'Gamis', 'Gamis untuk sehari-hari ukuran L'],
      ['Kerudung Instan', '', 25000, 'Hijab', 'Kerudung praktis tanpa size']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template HPP');
    XLSX.writeFile(wb, 'template-hpp-produk.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Produk</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata HPP</p>
                <p className="text-lg font-bold">{formatCurrency(stats.averageHPP)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">HPP Tertinggi</p>
                <p className="text-lg font-bold">{formatCurrency(stats.maxHPP)}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs font-bold">MAX</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">HPP Terendah</p>
                <p className="text-lg font-bold">{formatCurrency(stats.minHPP)}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">MIN</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Import Results */}
      {importResults && (
        <Card className={`theme-transition interactive-hover ${
          importResults.errors.length > 0 
            ? 'border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-orange-25 dark:from-orange-900/20 dark:to-orange-800/10' 
            : 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-green-25 dark:from-green-900/20 dark:to-green-800/10'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${
                  importResults.errors.length > 0 
                    ? 'bg-orange-100 dark:bg-orange-800/30' 
                    : 'bg-green-100 dark:bg-green-800/30'
                }`}>
                  {importResults.errors.length > 0 ? (
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className={`font-semibold ${
                      importResults.errors.length > 0 
                        ? 'text-orange-800 dark:text-orange-200' 
                        : 'text-green-800 dark:text-green-200'
                    }`}>
                      {importResults.errors.length > 0 ? '⚠️ Import Selesai dengan Warning' : '✅ Import Berhasil Sempurna!'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Product HPP data berhasil diproses
                    </p>
                  </div>

                  {/* Statistics */}
                  <div className="flex gap-4">
                    <div className="bg-card dark:bg-card/50 px-3 py-2 rounded-lg border">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {importResults.success}
                      </div>
                      <div className="text-xs text-muted-foreground">Produk Baru</div>
                    </div>
                    
                    <div className="bg-card dark:bg-card/50 px-3 py-2 rounded-lg border">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {importResults.updated}
                      </div>
                      <div className="text-xs text-muted-foreground">Diperbarui</div>
                    </div>
                    
                    {importResults.errors.length > 0 && (
                      <div className="bg-card dark:bg-card/50 px-3 py-2 rounded-lg border">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {importResults.errors.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Errors</div>
                      </div>
                    )}
                  </div>

                  {/* Error Details */}
                  {importResults.errors.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                      <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Detail Error:</h5>
                      <ul className="space-y-1">
                        {importResults.errors.slice(0, 5).map((error, index) => (
                          <li key={index} className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            {error}
                          </li>
                        ))}
                        {importResults.errors.length > 5 && (
                          <li className="text-sm text-orange-600 dark:text-orange-400 italic">
                            ... dan {importResults.errors.length - 5} error lainnya
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImportResults(null)}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database HPP Produk
          </CardTitle>
          <CardDescription>
            Kelola data Harga Pokok Penjualan (HPP) untuk perhitungan komisi TikTok. Sekarang dengan support size/ukuran berbeda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk atau size..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {/* Add Product */}
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Produk
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProduct ? 'Perbarui informasi produk' : 'Tambahkan produk baru ke database HPP'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nama_produk">Nama Produk *</Label>
                      <Input
                        id="nama_produk"
                        value={newProduct.nama_produk}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, nama_produk: e.target.value }))}
                        placeholder="Hijab Syari Premium"
                      />
                    </div>
                    <div>
                      <Label htmlFor="size" className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Size/Ukuran
                      </Label>
                      <Input
                        id="size"
                        value={newProduct.size}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, size: e.target.value }))}
                        placeholder="S, M, L, XL, atau kosongkan jika tidak ada size"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Opsional - untuk produk yang memiliki variasi ukuran dengan HPP berbeda
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="hpp">HPP (Harga Pokok Penjualan) *</Label>
                      <Input
                        id="hpp"
                        type="number"
                        value={newProduct.hpp}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, hpp: e.target.value }))}
                        placeholder="45000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="kategori">Kategori</Label>
                      <Input
                        id="kategori"
                        value={newProduct.kategori}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, kategori: e.target.value }))}
                        placeholder="Hijab, Gamis, Aksesoris"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deskripsi">Deskripsi</Label>
                      <Textarea
                        id="deskripsi"
                        value={newProduct.deskripsi}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, deskripsi: e.target.value }))}
                        placeholder="Deskripsi produk..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={editingProduct ? handleEditProduct : handleAddProduct} className="flex-1">
                        {editingProduct ? 'Update' : 'Tambah'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowAddDialog(false);
                          setEditingProduct(null);
                          setNewProduct({ nama_produk: '', size: '', hpp: '', kategori: '', deskripsi: '' });
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Import Excel */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </Button>

              {/* Download Template */}
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Template
              </Button>

              {/* Export */}
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
                disabled={products.length === 0}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daftar Produk ({filteredProducts.length})</span>
            {products.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (confirm('Hapus semua data produk?')) {
                    try {
                      await clearDatabase();
                    } catch (error) {
                      console.error('Error clearing database:', error);
                    }
                  }
                }}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? 'Tidak ada produk yang cocok' : 'Belum ada data produk'}</p>
              <p className="text-sm">
                {searchQuery ? 'Coba kata kunci lain' : 'Tambah produk atau import dari Excel'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{product.nama_produk}</h4>
                          {product.size && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Ruler className="h-3 w-3" />
                              {product.size}
                            </Badge>
                          )}
                          {product.kategori && (
                            <Badge variant="secondary" className="text-xs">
                              {product.kategori}
                            </Badge>
                          )}
                        </div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
                          HPP: {formatCurrency(product.hpp)}
                        </div>
                        {product.deskripsi && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.deskripsi}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Dibuat: {product.created_at.toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {onProductSelect && (
                          <Button
                            size="sm"
                            onClick={() => onProductSelect(product)}
                            className="text-xs"
                          >
                            Pilih
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            const sizeText = product.size ? ` (${product.size})` : '';
                            if (confirm(`Hapus produk "${product.nama_produk}${sizeText}"?`)) {
                              try {
                                await deleteProduct(product.id);
                              } catch (error) {
                                console.error('Error deleting product:', error);
                              }
                            }
                          }}
                          className="h-8 w-8 p-0"
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TikTokProductHPPManager;