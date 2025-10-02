/**
 * Robust Fallback System for D'Busana Dashboard
 * Provides comprehensive fallback data when backend APIs are unavailable
 */

export interface FallbackSalesData {
  id: string;
  order_id: string;
  customer: string;
  product_name: string;
  quantity: number;
  order_amount: number;
  total_revenue: number;
  settlement_amount: number;
  hpp: number;
  marketplace: string;
  delivered_time: string;
  created_time: string;
}

export interface FallbackProductData {
  id: string;
  product_name: string;
  category: string;
  brand: string;
  stock_quantity: number;
  min_stock: number;
  price: number;
  cost: number;
}

export interface FallbackAdvertisingData {
  id: string;
  platform: string;
  cost: number;
  revenue: number;
  date_range_start: string;
  date_range_end: string;
  date_start: string;
  campaign_name: string;
  account_name: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

class RobustFallbackSystem {
  private static instance: RobustFallbackSystem | null = null;
  private salesData: FallbackSalesData[] = [];
  private productsData: FallbackProductData[] = [];
  private advertisingData: FallbackAdvertisingData[] = [];
  private isInitialized = false;

  static getInstance(): RobustFallbackSystem {
    if (!this.instance) {
      this.instance = new RobustFallbackSystem();
    }
    return this.instance;
  }

  private constructor() {
    this.initializeFallbackData();
  }

  private initializeFallbackData(): void {
    if (this.isInitialized) return;

    console.log('🔄 Initializing robust fallback data system...');

    // Generate realistic sales data
    this.salesData = this.generateRealisticSalesData();
    this.productsData = this.generateRealisticProductsData();
    this.advertisingData = this.generateRealisticAdvertisingData();

    this.isInitialized = true;
    console.log('✅ Fallback data system initialized with:', {
      sales: this.salesData.length,
      products: this.productsData.length,
      advertising: this.advertisingData.length
    });
  }

  private generateRealisticSalesData(): FallbackSalesData[] {
    const data: FallbackSalesData[] = [];
    const baseDate = new Date();
    const fashionProducts = [
      'Batik Modern Premium', 'Kemeja Formal Executive', 'Dress Elegant Casual',
      'Blazer Professional', 'Rok Midi Trendy', 'Blouse Silk Touch',
      'Cardigan Wool Blend', 'Jumpsuit Contemporary', 'Pants Formal Slim',
      'Sweater Knit Cozy', 'Tunic Bohemian Style', 'Jacket Denim Classic'
    ];
    const marketplaces = ['shopee', 'tokopedia', 'lazada', 'bukalapak', 'tiktok_shop'];

    // Generate 180 days of sales data
    for (let i = 0; i < 180; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() - i);

      // Generate 3-8 orders per day with realistic patterns
      const ordersToday = Math.floor(Math.random() * 6) + 3;
      
      for (let j = 0; j < ordersToday; j++) {
        const product = fashionProducts[Math.floor(Math.random() * fashionProducts.length)];
        const marketplace = marketplaces[Math.floor(Math.random() * marketplaces.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        // Price variations by product type and marketplace
        const basePrice = this.getBasePrice(product);
        const marketplaceMultiplier = this.getMarketplaceMultiplier(marketplace);
        const seasonalMultiplier = this.getSeasonalMultiplier(date);
        
        const unitPrice = Math.round(basePrice * marketplaceMultiplier * seasonalMultiplier);
        const orderAmount = unitPrice * quantity;
        
        // Settlement amount (after marketplace fees)
        const marketplaceFeeRate = this.getMarketplaceFeeRate(marketplace);
        const settlementAmount = Math.round(orderAmount * (1 - marketplaceFeeRate));
        
        // HPP (Cost of Goods Sold)
        const hpp = Math.round(settlementAmount * (0.45 + Math.random() * 0.15)); // 45-60% COGS
        
        // Add some time variation within the day
        const orderTime = new Date(date);
        orderTime.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60));

        data.push({
          id: `fallback_sale_${i}_${j}`,
          order_id: `ORD-${String(i * 10 + j).padStart(6, '0')}`,
          customer: `Customer-${Math.floor(Math.random() * 500) + 1}`,
          product_name: product,
          quantity,
          order_amount: orderAmount,
          total_revenue: orderAmount,
          settlement_amount: settlementAmount,
          hpp,
          marketplace,
          delivered_time: orderTime.toISOString(),
          created_time: orderTime.toISOString()
        });
      }
    }

    return data.sort((a, b) => new Date(b.delivered_time).getTime() - new Date(a.delivered_time).getTime());
  }

  private generateRealisticProductsData(): FallbackProductData[] {
    const categories = ['Atasan', 'Bawahan', 'Outerwear', 'Dress', 'Accessories'];
    const brands = ['D\'Busana Premium', 'D\'Busana Casual', 'D\'Busana Executive', 'D\'Busana Trendy'];
    
    const products: FallbackProductData[] = [];
    let productId = 1;

    categories.forEach(category => {
      brands.forEach(brand => {
        // Generate 3-5 products per category-brand combination
        const productCount = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < productCount; i++) {
          const productName = `${category} ${brand.split(' ')[1]} ${String.fromCharCode(65 + i)}${productId}`;
          const basePrice = this.getCategoryBasePrice(category);
          const variance = 0.8 + Math.random() * 0.4; // ±20% variance
          const price = Math.round(basePrice * variance);
          const cost = Math.round(price * (0.4 + Math.random() * 0.2)); // 40-60% cost ratio
          
          // Stock levels with realistic distribution
          const stockLevel = this.generateRealisticStock();
          const minStock = Math.max(5, Math.floor(stockLevel * 0.2));

          products.push({
            id: `fallback_product_${productId}`,
            product_name: productName,
            category,
            brand: brand,
            stock_quantity: stockLevel,
            min_stock: minStock,
            price,
            cost
          });

          productId++;
        }
      });
    });

    return products;
  }

  private generateRealisticAdvertisingData(): FallbackAdvertisingData[] {
    // Return empty array - no mock advertising data
    return [];
  }

  // Helper methods for realistic data generation
  private getBasePrice(product: string): number {
    const priceMap: Record<string, number> = {
      'Batik': 250000,
      'Kemeja': 180000,
      'Dress': 320000,
      'Blazer': 450000,
      'Rok': 200000,
      'Blouse': 160000,
      'Cardigan': 280000,
      'Jumpsuit': 350000,
      'Pants': 220000,
      'Sweater': 240000,
      'Tunic': 190000,
      'Jacket': 380000
    };

    for (const [key, price] of Object.entries(priceMap)) {
      if (product.includes(key)) return price;
    }
    return 200000; // Default price
  }

  private getMarketplaceMultiplier(marketplace: string): number {
    const multipliers: Record<string, number> = {
      'shopee': 0.95,
      'tokopedia': 1.0,
      'lazada': 1.05,
      'bukalapak': 0.92,
      'tiktok_shop': 0.88
    };
    return multipliers[marketplace] || 1.0;
  }

  private getSeasonalMultiplier(date: Date): number {
    const month = date.getMonth();
    // Higher demand in months 3-5 (Q2) and 10-11 (holiday season)
    const seasonalFactors = [0.9, 0.9, 1.0, 1.1, 1.2, 1.1, 1.0, 0.95, 0.9, 1.0, 1.3, 1.2];
    return seasonalFactors[month];
  }

  private getMarketplaceFeeRate(marketplace: string): number {
    const feeRates: Record<string, number> = {
      'shopee': 0.065,      // 6.5%
      'tokopedia': 0.055,   // 5.5%
      'lazada': 0.070,      // 7.0%
      'bukalapak': 0.050,   // 5.0%
      'tiktok_shop': 0.025  // 2.5%
    };
    return feeRates[marketplace] || 0.06;
  }

  private getCategoryBasePrice(category: string): number {
    const prices: Record<string, number> = {
      'Atasan': 200000,
      'Bawahan': 250000,
      'Outerwear': 400000,
      'Dress': 350000,
      'Accessories': 150000
    };
    return prices[category] || 200000;
  }

  private generateRealisticStock(): number {
    // 60% chance of good stock (20-100), 30% medium (5-20), 10% low (0-5)
    const rand = Math.random();
    if (rand < 0.6) {
      return Math.floor(Math.random() * 80) + 20; // 20-100
    } else if (rand < 0.9) {
      return Math.floor(Math.random() * 15) + 5; // 5-20
    } else {
      return Math.floor(Math.random() * 6); // 0-5
    }
  }

  private getPlatformDailyBudget(platform: string): number {
    const budgets: Record<string, number> = {
      'facebook_ads': 150000,
      'google_ads': 200000,
      'instagram_ads': 120000,
      'tiktok_ads': 180000,
      'shopee_ads': 100000
    };
    return budgets[platform] || 150000;
  }

  // Public methods to get fallback data
  public getSalesData(): FallbackSalesData[] {
    this.initializeFallbackData();
    return [...this.salesData];
  }

  public getProductsData(): FallbackProductData[] {
    this.initializeFallbackData();
    return [...this.productsData];
  }

  public getAdvertisingData(): FallbackAdvertisingData[] {
    this.initializeFallbackData();
    return [...this.advertisingData];
  }

  public getFilteredSalesData(dateRange?: { from?: Date; to?: Date }): FallbackSalesData[] {
    let data = this.getSalesData();
    
    if (dateRange?.from || dateRange?.to) {
      data = data.filter(item => {
        const itemDate = new Date(item.delivered_time);
        const afterStart = !dateRange.from || itemDate >= dateRange.from;
        const beforeEnd = !dateRange.to || itemDate <= dateRange.to;
        return afterStart && beforeEnd;
      });
    }

    return data;
  }

  // Statistics methods
  public getDashboardMetrics(): any {
    const sales = this.getSalesData();
    const products = this.getProductsData();
    
    const totalRevenue = sales.reduce((sum, item) => sum + item.settlement_amount, 0);
    const totalOrders = sales.length;
    const totalProfit = sales.reduce((sum, item) => sum + (item.settlement_amount - item.hpp), 0);
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock).length;
    const outOfStockProducts = products.filter(p => p.stock_quantity === 0).length;

    return {
      distinctOrders: totalOrders,
      totalQuantitySold: sales.reduce((sum, item) => sum + item.quantity, 0),
      totalGMV: sales.reduce((sum, item) => sum + item.order_amount, 0),
      totalRevenue,
      totalSettlementAmount: totalRevenue,
      totalProfit,
      totalHPP: sales.reduce((sum, item) => sum + item.hpp, 0),
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      totalStockQuantity: 0,
      totalStockValue: 0,
      totalStockCost: 0,
      averageStockPerProduct: 0,
      totalAdvertisingSettlement: 0,
      totalAffiliateEndorseFee: 0,
      totalAffiliateActualSales: 0,
      totalAffiliateCommission: 0,
      netProfit: totalProfit
    };
  }
}

// Export singleton instance
export const robustFallbackSystem = RobustFallbackSystem.getInstance();

// Export utilities for components
export const useFallbackData = () => {
  const fallbackSystem = RobustFallbackSystem.getInstance();
  
  return {
    getSalesData: (dateRange?: { from?: Date; to?: Date }) => 
      fallbackSystem.getFilteredSalesData(dateRange),
    getProductsData: () => fallbackSystem.getProductsData(),
    getAdvertisingData: () => fallbackSystem.getAdvertisingData(),
    getDashboardMetrics: () => fallbackSystem.getDashboardMetrics()
  };
};

export default robustFallbackSystem;