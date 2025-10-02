import { useState, useEffect } from 'react';
import { simpleApiProductHPP } from '../utils/simpleApiUtils';

export interface ProductHPP {
  id: string;
  nama_produk: string;
  size?: string;
  hpp: number;
  kategori?: string;
  deskripsi?: string;
  created_at: Date;
  updated_at: Date;
}

interface ImportedProduct {
  nama_produk: string;
  size?: string;
  hpp: number;
  kategori?: string;
  deskripsi?: string;
}

interface ProductStatistics {
  totalProducts: number;
  averageHPP: number;
  maxHPP: number;
  minHPP: number;
  categories: string[];
}

const STORAGE_KEY = 'tiktok_product_hpp_database';

export const useProductHPP = () => {
  const [products, setProducts] = useState<ProductHPP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load products from API or localStorage as fallback
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 useProductHPP: Loading products from API...');
      const response = await simpleApiProductHPP.getAll();
      
      if (response.success && response.data) {
        const productsWithDates = response.data.map((item: any) => ({
          ...item,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at)
        }));
        setProducts(productsWithDates);
        
        // Save to localStorage as cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productsWithDates));
        console.log('✅ useProductHPP: Products loaded from API successfully:', productsWithDates.length);
      } else {
        throw new Error(response.error || 'Failed to load products from API');
      }
    } catch (err) {
      console.warn('⚠️ useProductHPP: Failed to load from API, using localStorage fallback:', err);
      
      // Fallback to localStorage
      try {
        const savedProducts = localStorage.getItem(STORAGE_KEY);
        if (savedProducts) {
          const parsed = JSON.parse(savedProducts);
          const productsWithDates = parsed.map((item: any) => ({
            ...item,
            created_at: new Date(item.created_at),
            updated_at: new Date(item.updated_at)
          }));
          setProducts(productsWithDates);
          console.log('📋 useProductHPP: Loaded from localStorage fallback:', productsWithDates.length);
        } else {
          console.log('📋 useProductHPP: No localStorage data available, starting with empty array');
          setProducts([]);
        }
      } catch (localErr) {
        console.warn('❌ useProductHPP: Failed to load from localStorage:', localErr);
        setError('Gagal memuat data produk');
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const addProduct = async (productData: Omit<ProductHPP, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 useProductHPP: Adding product to API:', productData);
      const response = await simpleApiProductHPP.create(productData);
      
      if (response.success && response.data) {
        const newProduct = {
          ...response.data,
          created_at: new Date(response.data.created_at),
          updated_at: new Date(response.data.updated_at)
        };
        
        setProducts(prev => [newProduct, ...prev]);
        
        // Update localStorage cache
        const updatedProducts = [newProduct, ...products];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
        
        console.log('✅ useProductHPP: Product added successfully:', newProduct.id);
        return newProduct.id;
      } else {
        throw new Error(response.error || response.message || 'Failed to add product');
      }
    } catch (err: any) {
      console.error('❌ useProductHPP: Error adding product to API:', err);
      setError(err.message || 'Gagal menambahkan produk');
      
      // Fallback to localStorage only
      const newProduct: ProductHPP = {
        ...productData,
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setProducts(prev => [newProduct, ...prev]);
      
      // Update localStorage cache
      const updatedProducts = [newProduct, ...products];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      
      console.log('📋 useProductHPP: Product added to localStorage fallback:', newProduct.id);
      return newProduct.id;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Omit<ProductHPP, 'id' | 'created_at'>>) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 useProductHPP: Updating product in API:', { id, updates });
      const response = await simpleApiProductHPP.update(id, updates);
      
      if (response.success && response.data) {
        const updatedProduct = {
          ...response.data,
          created_at: new Date(response.data.created_at),
          updated_at: new Date(response.data.updated_at)
        };
        
        setProducts(prev => prev.map(item => 
          item.id === id ? updatedProduct : item
        ));
        
        // Update localStorage cache
        const updatedProducts = products.map(item => 
          item.id === id ? updatedProduct : item
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
        
        console.log('✅ useProductHPP: Product updated successfully:', id);
      } else {
        throw new Error(response.error || response.message || 'Failed to update product');
      }
    } catch (err: any) {
      console.error('❌ useProductHPP: Error updating product in API:', err);
      setError(err.message || 'Gagal memperbarui produk');
      
      // Fallback to localStorage only
      setProducts(prev => prev.map(item => 
        item.id === id 
          ? { ...item, ...updates, updated_at: new Date() }
          : item
      ));
      
      // Update localStorage cache
      const updatedProducts = products.map(item => 
        item.id === id 
          ? { ...item, ...updates, updated_at: new Date() }
          : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      
      console.log('📋 useProductHPP: Product updated in localStorage fallback:', id);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 useProductHPP: Deleting product from API:', id);
      const response = await simpleApiProductHPP.delete(id);
      
      if (response.success) {
        setProducts(prev => prev.filter(item => item.id !== id));
        
        // Update localStorage cache
        const updatedProducts = products.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
        
        console.log('✅ useProductHPP: Product deleted successfully:', id);
      } else {
        throw new Error(response.error || response.message || 'Failed to delete product');
      }
    } catch (err: any) {
      console.error('❌ useProductHPP: Error deleting product from API:', err);
      setError(err.message || 'Gagal menghapus produk');
      
      // Fallback to localStorage only
      setProducts(prev => prev.filter(item => item.id !== id));
      
      // Update localStorage cache
      const updatedProducts = products.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      
      console.log('📋 useProductHPP: Product deleted from localStorage fallback:', id);
    } finally {
      setLoading(false);
    }
  };

  const findProductByName = (name: string, size?: string): ProductHPP | undefined => {
    return products.find(product => {
      const nameMatch = product.nama_produk.toLowerCase().trim() === name.toLowerCase().trim();
      if (!size && !product.size) return nameMatch;
      if (!size || !product.size) return false;
      return nameMatch && product.size.toLowerCase().trim() === size.toLowerCase().trim();
    });
  };

  const findProductByNameAndSize = (name: string, size?: string): ProductHPP | undefined => {
    return findProductByName(name, size);
  };

  const searchProducts = (query: string): ProductHPP[] => {
    if (!query.trim()) return products;
    
    const searchTerm = query.toLowerCase();
    return products.filter(product =>
      product.nama_produk.toLowerCase().includes(searchTerm) ||
      (product.kategori && product.kategori.toLowerCase().includes(searchTerm)) ||
      (product.deskripsi && product.deskripsi.toLowerCase().includes(searchTerm))
    );
  };

  const importFromExcel = async (excelData: ImportedProduct[]): Promise<{success: number, updated: number, errors: string[]}> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 useProductHPP: Importing Excel data to API:', { count: excelData.length });
      const response = await simpleApiProductHPP.bulkImport({
        products: excelData
      });
      
      if (response.success && response.data) {
        // Reload products after successful import
        await loadProducts();
        
        console.log('✅ useProductHPP: Excel import successful:', response.data);
        return {
          success: response.data.success || 0,
          updated: response.data.updated || 0,
          errors: response.data.errors || []
        };
      } else {
        throw new Error(response.error || response.message || 'Failed to import products');
      }
    } catch (err: any) {
      console.error('❌ useProductHPP: Error importing to API:', err);
      setError('Gagal mengimpor data dari Excel');
      
      // Fallback to localStorage only processing
      const errors: string[] = [];
      let successCount = 0;
      let updatedCount = 0;

      try {
        console.log('📋 useProductHPP: Processing Excel import with localStorage fallback');
        for (let i = 0; i < excelData.length; i++) {
          const row = excelData[i];
          const rowNumber = i + 2; // Excel row number (accounting for header)

          // Validation
          if (!row.nama_produk || !row.nama_produk.trim()) {
            errors.push(`Baris ${rowNumber}: Nama produk tidak boleh kosong`);
            continue;
          }

          if (!row.hpp || row.hpp <= 0) {
            errors.push(`Baris ${rowNumber}: HPP harus lebih dari 0`);
            continue;
          }

          // Check for duplicates including size
          const existingProduct = findProductByName(row.nama_produk, row.size);
          if (existingProduct) {
            // Update existing product
            await updateProduct(existingProduct.id, {
              hpp: row.hpp,
              kategori: row.kategori?.trim() || existingProduct.kategori,
              deskripsi: row.deskripsi?.trim() || existingProduct.deskripsi
            });
            updatedCount++;
          } else {
            // Add new product
            await addProduct({
              nama_produk: row.nama_produk.trim(),
              size: row.size?.trim(),
              hpp: row.hpp,
              kategori: row.kategori?.trim(),
              deskripsi: row.deskripsi?.trim()
            });
            successCount++;
          }
        }

        console.log('✅ useProductHPP: Excel import fallback completed:', { successCount, updatedCount, errors: errors.length });
        return { success: successCount, updated: updatedCount, errors };
      } catch (fallbackErr) {
        console.error('❌ useProductHPP: Fallback import also failed:', fallbackErr);
        return { 
          success: 0, 
          updated: 0, 
          errors: ['Gagal mengimpor data: ' + (fallbackErr as Error).message] 
        };
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = (): string => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      products: products
    };
    return JSON.stringify(exportData, null, 2);
  };

  const clearDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 useProductHPP: Clearing database via API...');
      const response = await simpleApiProductHPP.deleteAll();
      
      if (response.success) {
        setProducts([]);
        localStorage.removeItem(STORAGE_KEY);
        console.log('✅ useProductHPP: Database cleared successfully');
      } else {
        throw new Error(response.error || response.message || 'Failed to clear database');
      }
    } catch (err: any) {
      console.error('❌ useProductHPP: Error clearing database via API:', err);
      setError(err.message || 'Gagal menghapus semua data');
      
      // Fallback to localStorage only
      setProducts([]);
      localStorage.removeItem(STORAGE_KEY);
      console.log('📋 useProductHPP: Database cleared via localStorage fallback');
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = (): ProductStatistics => {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        averageHPP: 0,
        maxHPP: 0,
        minHPP: 0,
        categories: []
      };
    }

    const hppValues = products.map(p => p.hpp);
    const categories = [...new Set(products.map(p => p.kategori).filter(Boolean))];

    return {
      totalProducts: products.length,
      averageHPP: hppValues.reduce((sum, hpp) => sum + hpp, 0) / hppValues.length,
      maxHPP: Math.max(...hppValues),
      minHPP: Math.min(...hppValues),
      categories: categories as string[]
    };
  };

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    findProductByName,
    findProductByNameAndSize,
    searchProducts,
    importFromExcel,
    exportToJSON,
    clearDatabase,
    getStatistics,
    loadProducts // Export for manual refresh
  };
};