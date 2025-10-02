import { toast } from 'sonner@2.0.3';

export const createImportSuccessHandler = (setDashboardKey: (fn: (prev: number) => number) => void) => {
  return () => {
    // Force dashboard refresh by changing key
    setDashboardKey(prev => prev + 1);
    
    // Show success notification
    toast.success('Dashboard berhasil diperbarui dengan data sales terbaru!', {
      description: 'Data penjualan telah tersimpan di database PostgreSQL',
      duration: 4000,
    });
  };
};