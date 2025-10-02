import { simpleApiActivityLogs } from './simpleApiUtils';

// Activity types yang didukung
export type ActivityType = 
  | 'sale' 
  | 'product' 
  | 'customer' 
  | 'payment' 
  | 'import' 
  | 'stock' 
  | 'advertising'
  | 'affiliate'
  | 'system'
  | 'alert'
  | 'achievement';

// Activity status types
export type ActivityStatus = 'success' | 'warning' | 'error' | 'info';

// Activity log interface
export interface ActivityLog {
  type: ActivityType;
  title: string;
  description: string;
  status?: ActivityStatus;
  metadata?: Record<string, any>;
  user_id?: string;
  related_id?: string;
  related_type?: string;
}

// Anti-duplication tracking
const recentActivityHashes = new Set<string>();
const ACTIVITY_DEDUPE_TIMEOUT = 2000; // 2 seconds

/**
 * Generate hash for activity deduplication
 */
const generateActivityHash = (activity: ActivityLog): string => {
  const key = `${activity.type}:${activity.title}:${activity.description}`;
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};

/**
 * Check if activity is duplicate within timeout window
 */
const isDuplicateActivity = (activity: ActivityLog): boolean => {
  const hash = generateActivityHash(activity);
  
  if (recentActivityHashes.has(hash)) {
    console.log('🔄 Duplicate activity detected, skipping:', activity.title);
    return true;
  }
  
  // Add to tracking set and remove after timeout
  recentActivityHashes.add(hash);
  setTimeout(() => {
    recentActivityHashes.delete(hash);
  }, ACTIVITY_DEDUPE_TIMEOUT);
  
  return false;
};

/**
 * Logs an activity to the database with real-time timestamp and anti-duplication
 * @param activity - Activity log data
 */
export async function logActivity(activity: ActivityLog): Promise<boolean> {
  try {
    // Check for duplicate activity
    if (isDuplicateActivity(activity)) {
      return true; // Return success for duplicates to avoid error propagation
    }

    console.log('📝 Logging activity:', {
      type: activity.type,
      title: activity.title,
      timestamp: new Date().toISOString()
    });

    const response = await simpleApiActivityLogs.create({
      ...activity,
      status: activity.status || 'info'
    });

    if (response.success) {
      console.log('✅ Activity logged successfully');
      return true;
    } else {
      console.error('❌ Failed to log activity:', response.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    return false;
  }
}

/**
 * Convenience functions for specific activity types
 */

// Sales activities
export const logSaleActivity = (productName: string, marketplace: string, amount: number) => {
  return logActivity({
    type: 'sale',
    title: 'Transaksi Penjualan',
    description: `Penjualan ${productName} di ${marketplace}`,
    status: 'success',
    metadata: {
      product_name: productName,
      marketplace: marketplace,
      amount: amount
    }
  });
};

// Cash Flow activities (enhanced)
export const logCashFlowActivity = (entryType: 'income' | 'expense', description: string, amount: number, source: string) => {
  return logActivity({
    type: 'payment',
    title: `Cash Flow ${entryType === 'income' ? 'Pemasukan' : 'Pengeluaran'}`,
    description: `${description} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}`,
    status: 'success',
    metadata: {
      entry_type: entryType,
      description: description,
      amount: amount,
      source: source
    }
  });
};

// Supplier activities (enhanced)
export const logSupplierActivity = (supplierName: string, action: string, supplierType?: string) => {
  return logActivity({
    type: 'system',
    title: 'Manajemen Supplier',
    description: `${action} supplier "${supplierName}"${supplierType ? ` (${supplierType})` : ''}`,
    status: 'success',
    metadata: {
      supplier_name: supplierName,
      action: action,
      supplier_type: supplierType
    }
  });
};

// Tailor Production activities (enhanced)
export const logTailorProductionActivity = (tailorName: string, productName: string, quantity: number, action: string) => {
  return logActivity({
    type: 'system',
    title: 'Produksi Penjahit',
    description: `${action} produksi ${quantity} pcs ${productName} dari ${tailorName}`,
    status: 'success',
    metadata: {
      tailor_name: tailorName,
      product_name: productName,
      quantity: quantity,
      action: action
    }
  });
};

// Import activities
export const logImportActivity = (
  importType: string, 
  recordCount: number, 
  status: 'success' | 'error' = 'success',
  reason?: string
) => {
  let description = `Import ${importType} ${status === 'success' ? 'berhasil' : 'gagal'} - ${recordCount} record${recordCount > 1 ? 's' : ''}`;
  
  if (reason && status === 'error') {
    description += ` (${reason})`;
  }
  
  return logActivity({
    type: 'import',
    title: 'Import Data',
    description: description,
    status: status,
    metadata: {
      import_type: importType,
      record_count: recordCount,
      failure_reason: reason || null
    }
  });
};

// Stock activities
export const logStockActivity = (productName: string, action: 'increase' | 'decrease', quantity: number) => {
  return logActivity({
    type: 'stock',
    title: 'Perubahan Stok',
    description: `Stok ${productName} ${action === 'increase' ? 'bertambah' : 'berkurang'} ${quantity} unit`,
    status: 'info',
    metadata: {
      product_name: productName,
      action: action,
      quantity: quantity
    }
  });
};

// Advertising activities
export const logAdvertisingActivity = (campaignName: string, action: string, amount?: number) => {
  return logActivity({
    type: 'advertising',
    title: 'Aktivitas Iklan',
    description: `${action} campaign ${campaignName}${amount ? ` dengan budget ${amount}` : ''}`,
    status: 'info',
    metadata: {
      campaign_name: campaignName,
      action: action,
      amount: amount
    }
  });
};

// Affiliate activities
export const logAffiliateActivity = (endorserName: string, action: string, fee?: number) => {
  return logActivity({
    type: 'affiliate',
    title: 'Aktivitas Affiliate',
    description: `${action} affiliate endorse dengan ${endorserName}${fee ? ` (fee: ${fee})` : ''}`,
    status: 'info',
    metadata: {
      endorser_name: endorserName,
      action: action,
      fee: fee
    }
  });
};

// Product activities
export const logProductActivity = (productName: string, action: string) => {
  return logActivity({
    type: 'product',
    title: 'Aktivitas Produk',
    description: `${action} produk ${productName}`,
    status: 'info',
    metadata: {
      product_name: productName,
      action: action
    }
  });
};

// System activities
export const logSystemActivity = (action: string, description: string, status: ActivityStatus = 'info') => {
  return logActivity({
    type: 'system',
    title: 'Aktivitas Sistem',
    description: description,
    status: status,
    metadata: {
      action: action
    }
  });
};

/**
 * Fetches recent activities from database - NO FALLBACK
 * @param limit - Number of activities to fetch (default: 10)
 */
export async function getRecentActivities(limit: number = 10) {
  try {
    console.log('🔄 Fetching recent activities directly from database API...');
    const response = await simpleApiActivityLogs.getRecent(limit);
    
    if (response.success) {
      console.log('✅ Activities fetched successfully from database:', Array.isArray(response.data) ? response.data.length : 0);
      return {
        success: true,
        data: response.data || []
      };
    } else {
      console.warn('⚠️ Activity logs API returned error (empty table?):', response.error);
      return {
        success: false,
        error: response.error,
        data: []
      };
    }
  } catch (error) {
    console.error('❌ Error fetching activities from database:', error);
    return {
      success: false,
      error: 'Database connection error',
      data: []
    };
  }
}

/**
 * Auto-refresh activities hook for components
 */
export function useActivityRefresh(onRefresh: () => void, intervalMs: number = 30000) {
  // This would need React import in the component file, not here
  // Components should implement their own useEffect for auto-refresh
}

// Export convenience functions as default methods
export default {
  log: logActivity,
  sale: logSaleActivity,
  import: logImportActivity,
  stock: logStockActivity,
  advertising: logAdvertisingActivity,
  affiliate: logAffiliateActivity,
  product: logProductActivity,
  system: logSystemActivity,
  getRecent: getRecentActivities
};