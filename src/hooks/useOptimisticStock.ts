import { useState, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  stock_quantity: number;
  [key: string]: any;
}

interface OptimisticState {
  [productId: string]: {
    isUpdating: boolean;
    oldValue?: number;
    newValue?: number;
    error?: string;
  };
}

interface UseOptimisticStockProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  updateProductStock: (productId: string, newStock: number) => void;
  calculateStats?: (products: Product[]) => any;
  setStockStats?: React.Dispatch<React.SetStateAction<any>>;
}

export function useOptimisticStock({
  products,
  setProducts,
  updateProductStock,
  calculateStats,
  setStockStats
}: UseOptimisticStockProps) {
  const [optimisticState, setOptimisticState] = useState<OptimisticState>({});

  // Helper to update optimistic state
  const updateOptimisticState = useCallback((productId: string, updates: Partial<OptimisticState[string]>) => {
    setOptimisticState(prev => ({
      ...prev,
      [productId]: { ...prev[productId], ...updates }
    }));
  }, []);

  // Clear optimistic state for a product
  const clearOptimisticState = useCallback((productId: string) => {
    setOptimisticState(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  }, []);

  // Optimistic update function
  const performOptimisticUpdate = useCallback(async (
    productId: string,
    newStock: number,
    syncFunction: () => Promise<boolean>,
    options: {
      actionDescription?: string;
      showToast?: boolean;
      createMovement?: () => void;
    } = {}
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Produk tidak ditemukan');
      return false;
    }

    const oldStock = product.stock_quantity;
    const { actionDescription = `Stock update: ${oldStock} → ${newStock}`, showToast = true } = options;

    // Start optimistic update
    updateOptimisticState(productId, {
      isUpdating: true,
      oldValue: oldStock,
      newValue: newStock
    });

    // Update UI immediately
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, stock_quantity: newStock, updated_at: new Date().toISOString() }
        : p
    ));

    // Update context immediately
    updateProductStock(productId, newStock);

    // Update stats if provided
    if (calculateStats && setStockStats) {
      const updatedProducts = products.map(p => 
        p.id === productId 
          ? { ...p, stock_quantity: newStock }
          : p
      );
      const updatedStats = calculateStats(updatedProducts);
      setStockStats(updatedStats);
    }

    // Show optimistic success feedback
    if (showToast) {
      toast.success('Stock berhasil diupdate!', {
        description: `${product.product_name}: ${oldStock} → ${newStock}`,
        duration: 2000
      });
    }

    try {
      // Attempt to sync with backend
      const success = await syncFunction();

      if (success) {
        // Success - show synced indicator briefly
        updateOptimisticState(productId, {
          isUpdating: false,
          error: undefined
        });

        // Create movement if provided
        if (options.createMovement) {
          options.createMovement();
        }

        // Clear state after brief success indication
        setTimeout(() => {
          clearOptimisticState(productId);
        }, 1000);

        console.log('✅ Optimistic update synced successfully');
        return true;
      } else {
        throw new Error('Sync function returned false');
      }
    } catch (error) {
      console.error('❌ Backend sync failed:', error);
      
      // Revert optimistic update
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, stock_quantity: oldStock }
          : p
      ));
      updateProductStock(productId, oldStock);

      // Revert stats if provided
      if (calculateStats && setStockStats) {
        const revertedProducts = products.map(p => 
          p.id === productId 
            ? { ...p, stock_quantity: oldStock }
            : p
        );
        const revertedStats = calculateStats(revertedProducts);
        setStockStats(revertedStats);
      }

      // Update state to show error
      updateOptimisticState(productId, {
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      });

      // Show error toast
      toast.error('Gagal menyinkronkan ke database', {
        description: 'Perubahan telah dibatalkan. Coba lagi.',
        duration: 3000
      });

      // Clear error state after delay
      setTimeout(() => {
        clearOptimisticState(productId);
      }, 3000);

      return false;
    }
  }, [products, setProducts, updateProductStock, calculateStats, setStockStats, updateOptimisticState, clearOptimisticState]);

  // Quick adjustment helper
  const performQuickAdjustment = useCallback(async (
    productId: string,
    adjustment: number,
    type: 'add' | 'subtract',
    syncFunction: (newStock: number) => Promise<boolean>
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    const currentStock = product.stock_quantity;
    const newStock = type === 'add' ? currentStock + adjustment : currentStock - adjustment;

    // Validate adjustment
    if (newStock < 0) {
      toast.error('Stock tidak boleh negatif');
      return false;
    }

    const actionText = type === 'add' ? `Ditambah ${adjustment}` : `Dikurangi ${adjustment}`;

    return await performOptimisticUpdate(
      productId,
      newStock,
      () => syncFunction(newStock),
      {
        actionDescription: `Quick adjustment: ${actionText}`,
        showToast: true
      }
    );
  }, [products, performOptimisticUpdate]);

  // Bulk edit helper
  const performBulkEdit = useCallback(async (
    productId: string,
    newStock: number,
    syncFunction: () => Promise<boolean>,
    onEditComplete?: () => void
  ) => {
    const success = await performOptimisticUpdate(
      productId,
      newStock,
      syncFunction,
      {
        actionDescription: `Bulk edit to ${newStock}`,
        showToast: true
      }
    );

    if (success && onEditComplete) {
      onEditComplete();
    }

    return success;
  }, [performOptimisticUpdate]);

  return {
    optimisticState,
    performOptimisticUpdate,
    performQuickAdjustment,
    performBulkEdit,
    clearOptimisticState,
    isUpdating: (productId: string) => optimisticState[productId]?.isUpdating || false,
    hasError: (productId: string) => !!optimisticState[productId]?.error,
    getError: (productId: string) => optimisticState[productId]?.error
  };
}