/**
 * 📊 COMPREHENSIVE FALLBACK DATA GENERATOR
 * 
 * Provides realistic fallback data for all dashboard components
 * when backend is unavailable, maintaining UI functionality.
 */

interface FallbackDataOptions {
  useCachedData?: boolean;
  includeTimestamps?: boolean;
  dataVariation?: 'minimal' | 'moderate' | 'rich';
}

class ComprehensiveFallbackData {
  private cacheKey = 'd_busana_fallback_cache';
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Dashboard Metrics - Main KPI data
   */
  getDashboardMetrics(options: FallbackDataOptions = {}) {
    return {
      totalRevenue: 847329000,
      totalOrders: 2847,
      averageOrderValue: 297500,
      totalProfit: 254198700,
      profitMargin: 30.0,
      conversionRate: 3.2,
      returnCustomers: 1124,
      newCustomers: 1723,
      topSellingProduct: "Hijab Syari Premium",
      monthlyGrowth: 12.5,
      weeklyOrders: 187,
      dailyRevenue: 28244300,
      inventoryValue: 425000000,
      lowStockItems: 23,
      outOfStockItems: 7,
      totalCustomers: 5847,
      activeProducts: 342,
      cancelledOrders: 89,
      pendingOrders: 156,
      completedOrders: 2602,
      refundAmount: 15420000,
      shippingCost: 45320000,
      advertisingSpend: 67890000,
      advertisingROI: 3.8,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Sales Data - Transaction records
   */
  getSalesData(options: FallbackDataOptions = {}) {
    const salesData = [];
    const products = [
      'Hijab Syari Premium', 'Gamis Dewasa Modern', 'Khimar Instan', 
      'Jilbab Paris Premium', 'Dress Muslim Elegant', 'Tunik Casual',
      'Rok Plisket Panjang', 'Cardigan Rajut', 'Blouse Atasan'
    ];
    const marketplaces = ['Tiktok Shop', 'Shopee', 'Tokopedia', 'Lazada'];
    const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'];

    for (let i = 0; i < 50; i++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
      
      salesData.push({
        id: `ORD-${String(i + 1).padStart(4, '0')}`,
        order_id: `TK${Date.now() + i}`,
        tanggal: orderDate.toISOString().split('T')[0],
        nama_produk: products[Math.floor(Math.random() * products.length)],
        harga: Math.floor(Math.random() * 300000) + 100000,
        jumlah: Math.floor(Math.random() * 3) + 1,
        total: 0, // Will be calculated
        marketplace: marketplaces[Math.floor(Math.random() * marketplaces.length)],
        customer: `Customer ${i + 1}`,
        kota: cities[Math.floor(Math.random() * cities.length)],
        status: Math.random() > 0.1 ? 'completed' : 'pending',
        created_at: orderDate.toISOString(),
        updated_at: orderDate.toISOString()
      });
    }

    // Calculate totals
    salesData.forEach(item => {
      item.total = item.harga * item.jumlah;
    });

    return salesData;
  }

  /**
   * Products Data - Inventory and product info
   */
  getProductsData(options: FallbackDataOptions = {}) {
    const categories = ['Hijab', 'Gamis', 'Tunik', 'Dress', 'Aksesoris'];
    const brands = ['D\'Busana Premium', 'D\'Busana Classic', 'D\'Busana Modern'];
    
    const products = [];
    for (let i = 0; i < 30; i++) {
      products.push({
        id: i + 1,
        nama_produk: `Produk Fashion ${i + 1}`,
        kategori: categories[Math.floor(Math.random() * categories.length)],
        brand: brands[Math.floor(Math.random() * brands.length)],
        harga: Math.floor(Math.random() * 400000) + 50000,
        hpp: Math.floor(Math.random() * 200000) + 30000,
        stok: Math.floor(Math.random() * 100) + 10,
        minimum_stok: 5,
        sku: `DBF-${String(i + 1).padStart(4, '0')}`,
        deskripsi: `Produk fashion berkualitas tinggi dari D'Busana`,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return products;
  }

  /**
   * Marketplace Analytics - Platform performance
   */
  getMarketplaceAnalytics(options: FallbackDataOptions = {}) {
    return {
      'Tiktok Shop': {
        revenue: 387450000,
        orders: 1234,
        averageOrderValue: 314000,
        conversionRate: 4.2,
        growth: 18.5,
        commission: 31000000
      },
      'Shopee': {
        revenue: 245670000,
        orders: 892,
        averageOrderValue: 275000,
        conversionRate: 3.8,
        growth: 8.3,
        commission: 19600000
      },
      'Tokopedia': {
        revenue: 156780000,
        orders: 567,
        averageOrderValue: 277000,
        conversionRate: 3.1,
        growth: 5.7,
        commission: 12540000
      },
      'Lazada': {
        revenue: 98420000,
        orders: 234,
        averageOrderValue: 421000,
        conversionRate: 2.9,
        growth: 12.1,
        commission: 7870000
      }
    };
  }

  /**
   * Advertising Data - Campaign performance
   */
  getAdvertisingData(options: FallbackDataOptions = {}) {
    const campaigns = [];
    const campaignTypes = ['Brand Awareness', 'Traffic', 'Conversions', 'Catalog Sales'];
    
    for (let i = 0; i < 20; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60));
      
      const spend = Math.floor(Math.random() * 5000000) + 500000;
      const impressions = Math.floor(Math.random() * 100000) + 10000;
      const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
      const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02));
      
      campaigns.push({
        id: i + 1,
        campaign_name: `Campaign ${i + 1} - ${campaignTypes[Math.floor(Math.random() * campaignTypes.length)]}`,
        campaign_type: campaignTypes[Math.floor(Math.random() * campaignTypes.length)],
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        spend: spend,
        impressions: impressions,
        clicks: clicks,
        conversions: conversions,
        ctr: ((clicks / impressions) * 100).toFixed(2),
        cpc: Math.floor(spend / clicks),
        roas: ((conversions * 300000) / spend).toFixed(2), // Assuming 300k average order
        status: Math.random() > 0.2 ? 'active' : 'paused',
        marketplace: 'Tiktok Shop',
        created_at: startDate.toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return campaigns;
  }

  /**
   * Advertising Stats - Summary metrics
   */
  getAdvertisingStats(options: FallbackDataOptions = {}) {
    return {
      totalSpend: 67890000,
      totalImpressions: 2450000,
      totalClicks: 98200,
      totalConversions: 2847,
      averageCTR: 4.01,
      averageCPC: 691,
      averageROAS: 3.8,
      activeCampaigns: 12,
      pausedCampaigns: 8,
      totalCampaigns: 20,
      monthlySpend: 25670000,
      monthlyROAS: 4.2,
      topPerformingCampaign: 'Campaign 5 - Conversions',
      conversionRate: 2.9,
      costPerConversion: 23850,
      revenueFromAds: 847329000
    };
  }

  /**
   * Monthly Trends - Historical performance
   */
  getMonthlyTrends(options: FallbackDataOptions = {}) {
    const trends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    let baseRevenue = 500000000;
    for (let i = 0; i < months.length; i++) {
      const revenue = baseRevenue + (Math.random() * 200000000 - 100000000);
      const orders = Math.floor(revenue / 300000); // Average order value 300k
      
      trends.push({
        month: months[i],
        revenue: Math.floor(revenue),
        orders: orders,
        profit: Math.floor(revenue * 0.3),
        growth: ((revenue - baseRevenue) / baseRevenue * 100).toFixed(1),
        averageOrderValue: Math.floor(revenue / orders),
        customers: Math.floor(orders * 0.8), // Some repeat customers
        conversionRate: (Math.random() * 2 + 2).toFixed(1) // 2-4%
      });
      
      baseRevenue = revenue; // Use current as base for next month growth
    }

    return trends;
  }

  /**
   * Activity Logs - Recent activities
   */
  getActivityLogs(options: FallbackDataOptions = {}) {
    const activities = [];
    const activityTypes = [
      'Import Data Sales', 'Update Product', 'Create Campaign', 
      'Process Order', 'Update Inventory', 'Generate Report'
    ];
    
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - (i * 15));
      
      activities.push({
        id: i + 1,
        type: 'system',
        title: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        description: `Aktivitas sistem telah berhasil dijalankan`,
        status: Math.random() > 0.1 ? 'success' : 'warning',
        user_id: 'admin',
        created_at: timestamp.toISOString(),
        metadata: {
          module: 'dashboard',
          action: 'automated',
          result: 'completed'
        }
      });
    }

    return activities;
  }

  /**
   * Cash Flow Entries - Financial data
   */
  getCashFlowEntries(options: FallbackDataOptions = {}) {
    const entries = [];
    const categories = [
      'Operational Cost', 'Marketing Expense', 'Inventory Purchase',
      'Sales Revenue', 'Advertising Cost', 'Shipping Cost'
    ];
    
    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const isExpense = Math.random() > 0.4;
      const amount = Math.floor(Math.random() * 10000000) + 1000000;
      
      entries.push({
        id: i + 1,
        entry_type: isExpense ? 'expense' : 'income',
        category: categories[Math.floor(Math.random() * categories.length)],
        amount: amount,
        description: `${isExpense ? 'Pengeluaran' : 'Pemasukan'} untuk operasional bisnis`,
        date: date.toISOString().split('T')[0],
        reference: `REF-${String(i + 1).padStart(4, '0')}`,
        status: 'confirmed',
        created_at: date.toISOString(),
        updated_at: date.toISOString()
      });
    }

    return entries;
  }

  /**
   * Cache management
   */
  getCachedData(key: string) {
    try {
      const cached = localStorage.getItem(`${this.cacheKey}_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheTimeout) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Error reading cached data:', error);
    }
    return null;
  }

  setCachedData(key: string, data: any) {
    try {
      localStorage.setItem(`${this.cacheKey}_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Error caching data:', error);
    }
  }

  /**
   * Get fallback data for specific endpoint
   */
  getFallbackForEndpoint(endpoint: string, options: FallbackDataOptions = {}) {
    // Check cache first if enabled
    if (options.useCachedData) {
      const cached = this.getCachedData(endpoint);
      if (cached) {
        console.log(`📋 Using cached fallback data for ${endpoint}`);
        return cached;
      }
    }

    let data;

    // Route to appropriate fallback data
    switch (endpoint) {
      case '/dashboard/metrics':
        data = this.getDashboardMetrics(options);
        break;
      case '/sales':
        data = this.getSalesData(options);
        break;
      case '/products':
        data = this.getProductsData(options);
        break;
      case '/analytics/marketplace':
      case '/dashboard/marketplace-analytics':
        data = this.getMarketplaceAnalytics(options);
        break;
      case '/advertising':
        data = this.getAdvertisingData(options);
        break;
      case '/advertising/stats':
        data = this.getAdvertisingStats(options);
        break;
      case '/monthly-trends':
        data = this.getMonthlyTrends(options);
        break;
      case '/activity-logs':
        data = this.getActivityLogs(options);
        break;
      case '/cash-flow/entries':
        data = this.getCashFlowEntries(options);
        break;
      case '/sales/marketplace-stats':
        data = {
          totalRevenue: 847329000,
          totalOrders: 2847,
          marketplaces: this.getMarketplaceAnalytics(options)
        };
        break;
      default:
        console.warn(`No fallback data available for endpoint: ${endpoint}`);
        return null;
    }

    // Cache the data if enabled
    if (options.useCachedData && data) {
      this.setCachedData(endpoint, data);
    }

    return data;
  }

  /**
   * Clear all cached fallback data
   */
  clearCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cacheKey)) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ Fallback data cache cleared');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  /**
   * Get cache info
   */
  getCacheInfo() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.cacheKey));
    return {
      totalCachedEndpoints: keys.length,
      cacheKeys: keys.map(key => key.replace(`${this.cacheKey}_`, '')),
      cacheTimeout: this.cacheTimeout
    };
  }
}

// Create singleton instance
export const fallbackDataGenerator = new ComprehensiveFallbackData();

export default fallbackDataGenerator;