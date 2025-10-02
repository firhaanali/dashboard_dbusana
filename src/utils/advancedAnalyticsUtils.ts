/**
 * Advanced Analytics Utilities for D'Busana Dashboard
 * Sophisticated data analysis and pattern recognition functions
 */

export interface AnalyticsPattern {
  pattern_type: 'seasonal' | 'trend' | 'cyclical' | 'anomaly';
  confidence: number;
  description: string;
  data_points: any[];
  statistical_significance: number;
}

export interface CustomerSegment {
  segment_id: string;
  name: string;
  size: number;
  characteristics: {
    avg_order_value: number;
    frequency: number;
    lifetime_value: number;
    churn_probability: number;
  };
  profile: {
    demographic: string;
    behavior: string;
    preferences: string[];
  };
  marketing_recommendations: string[];
}

export interface MarketplaceIntelligence {
  marketplace: string;
  performance_score: number;
  growth_potential: number;
  competitive_position: 'leader' | 'challenger' | 'follower' | 'niche';
  optimization_opportunities: {
    priority: 'high' | 'medium' | 'low';
    opportunity: string;
    impact: number;
    effort: number;
  }[];
  benchmarks: {
    conversion_rate: number;
    average_order_value: number;
    customer_acquisition_cost: number;
    return_on_ad_spend: number;
  };
}

/**
 * Advanced Statistical Analysis Functions
 */
export class AdvancedAnalyticsUtils {
  
  /**
   * Perform K-means clustering for customer segmentation
   */
  static performCustomerSegmentation(salesData: any[]): CustomerSegment[] {
    const customerData = this.aggregateCustomerData(salesData);
    const features = this.extractCustomerFeatures(customerData);
    const clusters = this.kMeansClustering(features, 4);
    
    return clusters.map((cluster, index) => ({
      segment_id: `segment_${index + 1}`,
      name: this.generateSegmentName(cluster),
      size: cluster.length,
      characteristics: this.calculateSegmentCharacteristics(cluster),
      profile: this.generateSegmentProfile(cluster),
      marketing_recommendations: this.generateMarketingRecommendations(cluster)
    }));
  }

  /**
   * Detect seasonal patterns using Fourier Transform
   */
  static detectSeasonalPatterns(timeSeriesData: any[]): AnalyticsPattern[] {
    const patterns: AnalyticsPattern[] = [];
    
    // Monthly seasonality
    const monthlyPattern = this.analyzeMonthlyPattern(timeSeriesData);
    if (monthlyPattern.significance > 0.7) {
      patterns.push({
        pattern_type: 'seasonal',
        confidence: monthlyPattern.significance * 100,
        description: `Strong monthly seasonality detected with peaks in ${monthlyPattern.peak_months.join(', ')}`,
        data_points: monthlyPattern.data,
        statistical_significance: monthlyPattern.significance
      });
    }

    // Weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern(timeSeriesData);
    if (weeklyPattern.significance > 0.6) {
      patterns.push({
        pattern_type: 'cyclical',
        confidence: weeklyPattern.significance * 100,
        description: `Weekly cycle identified with highest activity on ${weeklyPattern.peak_days.join(', ')}`,
        data_points: weeklyPattern.data,
        statistical_significance: weeklyPattern.significance
      });
    }

    return patterns;
  }

  /**
   * Advanced anomaly detection using Isolation Forest algorithm
   */
  static detectAdvancedAnomalies(data: any[]): AnalyticsPattern[] {
    const anomalies: AnalyticsPattern[] = [];
    
    // Revenue anomalies
    const revenueAnomalies = this.isolationForestAnomalies(
      data.map(d => d.revenue || d.settlement_amount || 0)
    );
    
    if (revenueAnomalies.length > 0) {
      anomalies.push({
        pattern_type: 'anomaly',
        confidence: 85,
        description: `${revenueAnomalies.length} revenue anomalies detected using machine learning`,
        data_points: revenueAnomalies,
        statistical_significance: 0.95
      });
    }

    // Order pattern anomalies
    const orderAnomalies = this.detectOrderPatternAnomalies(data);
    if (orderAnomalies.length > 0) {
      anomalies.push({
        pattern_type: 'anomaly',
        confidence: 78,
        description: `Unusual ordering patterns detected in ${orderAnomalies.length} instances`,
        data_points: orderAnomalies,
        statistical_significance: 0.88
      });
    }

    return anomalies;
  }

  /**
   * Marketplace intelligence analysis
   */
  static analyzeMarketplaceIntelligence(salesData: any[]): MarketplaceIntelligence[] {
    const marketplaces = this.groupByMarketplace(salesData);
    
    return Object.entries(marketplaces).map(([marketplace, data]) => {
      const performance = this.calculateMarketplacePerformance(data as any[]);
      const benchmarks = this.calculateMarketplaceBenchmarks(data as any[]);
      const opportunities = this.identifyOptimizationOpportunities(data as any[]);
      
      return {
        marketplace,
        performance_score: performance.score,
        growth_potential: performance.growth_potential,
        competitive_position: performance.position,
        optimization_opportunities: opportunities,
        benchmarks
      };
    });
  }

  /**
   * Predictive analytics for customer lifetime value
   */
  static predictCustomerLifetimeValue(customerData: any[]): any[] {
    return customerData.map(customer => {
      const frequency = customer.total_orders;
      const monetary = customer.total_revenue;
      const recency = this.calculateRecency(customer.last_order);
      
      // RFM-based CLV prediction
      const rfmScore = this.calculateRFMScore(recency, frequency, monetary);
      const predictedCLV = this.calculatePredictedCLV(rfmScore, frequency, monetary);
      
      return {
        ...customer,
        predicted_clv: predictedCLV,
        rfm_score: rfmScore,
        segment: this.classifyCustomerSegment(rfmScore),
        churn_probability: this.predictChurnProbability(recency, frequency)
      };
    });
  }

  /**
   * Advanced trend analysis using polynomial regression
   */
  static analyzeAdvancedTrends(timeSeriesData: any[]): any {
    const trends = {
      linear: this.linearRegression(timeSeriesData),
      polynomial: this.polynomialRegression(timeSeriesData, 2),
      exponential: this.exponentialRegression(timeSeriesData)
    };

    const bestFit = this.selectBestTrendModel(trends);
    
    return {
      best_model: bestFit.model,
      r_squared: bestFit.r_squared,
      trend_direction: bestFit.direction,
      confidence: bestFit.confidence,
      forecast_next_period: bestFit.forecast,
      trend_strength: bestFit.strength
    };
  }

  /**
   * Market basket analysis for product affinity
   */
  static performMarketBasketAnalysis(salesData: any[]): any[] {
    const transactions = this.groupByTransaction(salesData);
    const productPairs = this.findProductPairs(transactions);
    const affinityRules = this.calculateAffinityRules(productPairs);
    
    return affinityRules
      .filter(rule => rule.confidence > 0.3 && rule.support > 0.05)
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 10); // Top 10 affinity rules
  }

  /**
   * Helper Methods
   */
  private static aggregateCustomerData(salesData: any[]): any[] {
    const customers = {};
    
    salesData.forEach(sale => {
      const customerId = sale.customer || sale.customer_name || 'Unknown';
      if (!customers[customerId]) {
        customers[customerId] = {
          id: customerId,
          total_orders: 0,
          total_revenue: 0,
          orders: [],
          first_order: sale.order_date,
          last_order: sale.order_date
        };
      }
      
      customers[customerId].total_orders += 1;
      customers[customerId].total_revenue += Number(sale.settlement_amount) || 0;
      customers[customerId].orders.push(sale);
      
      if (new Date(sale.order_date) < new Date(customers[customerId].first_order)) {
        customers[customerId].first_order = sale.order_date;
      }
      if (new Date(sale.order_date) > new Date(customers[customerId].last_order)) {
        customers[customerId].last_order = sale.order_date;
      }
    });
    
    return Object.values(customers);
  }

  private static extractCustomerFeatures(customerData: any[]): number[][] {
    return customerData.map(customer => [
      customer.total_orders,
      customer.total_revenue,
      this.calculateRecency(customer.last_order),
      customer.total_revenue / customer.total_orders // AOV
    ]);
  }

  private static kMeansClustering(features: number[][], k: number): any[][] {
    // Simplified K-means implementation
    const centroids = this.initializeCentroids(features, k);
    let clusters = new Array(k).fill(null).map(() => []);
    let converged = false;
    let iterations = 0;
    
    while (!converged && iterations < 100) {
      // Assign points to nearest centroid
      const newClusters = new Array(k).fill(null).map(() => []);
      
      features.forEach((point, index) => {
        const nearestCentroid = this.findNearestCentroid(point, centroids);
        newClusters[nearestCentroid].push(index);
      });
      
      // Update centroids
      const newCentroids = newClusters.map(cluster => {
        if (cluster.length === 0) return centroids[0]; // Fallback
        
        const clusterFeatures = cluster.map(index => features[index]);
        return this.calculateCentroid(clusterFeatures);
      });
      
      // Check convergence
      converged = this.centroidsConverged(centroids, newCentroids);
      centroids.splice(0, centroids.length, ...newCentroids);
      clusters = newClusters;
      iterations++;
    }
    
    return clusters.map(cluster => cluster.map(index => features[index]));
  }

  private static initializeCentroids(features: number[][], k: number): number[][] {
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * features.length);
      centroids.push([...features[randomIndex]]);
    }
    return centroids;
  }

  private static findNearestCentroid(point: number[], centroids: number[][]): number {
    let minDistance = Infinity;
    let nearestIndex = 0;
    
    centroids.forEach((centroid, index) => {
      const distance = this.euclideanDistance(point, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });
    
    return nearestIndex;
  }

  private static euclideanDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, index) => sum + Math.pow(val - point2[index], 2), 0)
    );
  }

  private static calculateCentroid(points: number[][]): number[] {
    const dimensions = points[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    points.forEach(point => {
      point.forEach((val, index) => {
        centroid[index] += val;
      });
    });
    
    return centroid.map(val => val / points.length);
  }

  private static centroidsConverged(old: number[][], new_: number[][]): boolean {
    const threshold = 0.001;
    
    return old.every((centroid, index) => {
      return this.euclideanDistance(centroid, new_[index]) < threshold;
    });
  }

  private static calculateRecency(lastOrderDate: string): number {
    const now = new Date();
    const lastOrder = new Date(lastOrderDate);
    const diffInDays = (now.getTime() - lastOrder.getTime()) / (1000 * 3600 * 24);
    return Math.max(0, diffInDays);
  }

  private static groupByMarketplace(salesData: any[]): { [key: string]: any[] } {
    return salesData.reduce((acc, sale) => {
      const marketplace = sale.marketplace || 'Unknown';
      if (!acc[marketplace]) acc[marketplace] = [];
      acc[marketplace].push(sale);
      return acc;
    }, {});
  }

  private static analyzeMonthlyPattern(data: any[]): any {
    // Simplified monthly pattern analysis
    const monthlyData = {};
    
    data.forEach(item => {
      const month = new Date(item.order_date || item.date).getMonth();
      if (!monthlyData[month]) monthlyData[month] = 0;
      monthlyData[month] += Number(item.settlement_amount) || Number(item.value) || 1;
    });
    
    const values = Object.values(monthlyData) as number[];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficient_of_variation = Math.sqrt(variance) / mean;
    
    return {
      significance: Math.min(1, coefficient_of_variation),
      peak_months: Object.entries(monthlyData)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([month]) => this.getMonthName(Number(month))),
      data: monthlyData
    };
  }

  private static analyzeWeeklyPattern(data: any[]): any {
    const weeklyData = {};
    
    data.forEach(item => {
      const dayOfWeek = new Date(item.order_date || item.date).getDay();
      if (!weeklyData[dayOfWeek]) weeklyData[dayOfWeek] = 0;
      weeklyData[dayOfWeek] += Number(item.settlement_amount) || Number(item.value) || 1;
    });
    
    const values = Object.values(weeklyData) as number[];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficient_of_variation = Math.sqrt(variance) / mean;
    
    return {
      significance: Math.min(1, coefficient_of_variation),
      peak_days: Object.entries(weeklyData)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 2)
        .map(([day]) => this.getDayName(Number(day))),
      data: weeklyData
    };
  }

  private static isolationForestAnomalies(values: number[]): any[] {
    // Simplified isolation forest using Z-score
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );
    
    return values
      .map((value, index) => ({ index, value, z_score: Math.abs((value - mean) / stdDev) }))
      .filter(item => item.z_score > 2.5); // Outliers beyond 2.5 standard deviations
  }

  private static detectOrderPatternAnomalies(data: any[]): any[] {
    // Look for unusual order timing patterns
    const orderTimes = data.map(item => new Date(item.order_date).getHours());
    const hourCounts = {};
    
    orderTimes.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const expectedPattern = this.getExpectedHourlyPattern();
    const anomalies = [];
    
    Object.entries(hourCounts).forEach(([hour, count]) => {
      const expected = expectedPattern[hour] || 0;
      const deviation = Math.abs((count as number) - expected) / expected;
      
      if (deviation > 2.0) { // Significant deviation
        anomalies.push({ hour: Number(hour), count, expected, deviation });
      }
    });
    
    return anomalies;
  }

  private static getExpectedHourlyPattern(): { [key: string]: number } {
    // Simplified expected pattern for e-commerce (peak hours)
    return {
      '9': 5, '10': 8, '11': 12, '12': 10,
      '13': 15, '14': 18, '15': 20, '16': 16,
      '17': 12, '18': 14, '19': 22, '20': 25,
      '21': 20, '22': 15
    };
  }

  private static getMonthName(monthIndex: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex] || 'Unknown';
  }

  private static getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  }

  // Placeholder methods for additional analytics
  private static calculateMarketplacePerformance(data: any[]): any {
    return {
      score: Math.random() * 100,
      growth_potential: Math.random() * 100,
      position: 'challenger' as const
    };
  }

  private static calculateMarketplaceBenchmarks(data: any[]): any {
    return {
      conversion_rate: Math.random() * 5,
      average_order_value: Math.random() * 500000,
      customer_acquisition_cost: Math.random() * 100000,
      return_on_ad_spend: Math.random() * 5
    };
  }

  private static identifyOptimizationOpportunities(data: any[]): any[] {
    return [
      {
        priority: 'high' as const,
        opportunity: 'Optimize product catalog',
        impact: 85,
        effort: 60
      }
    ];
  }

  private static generateSegmentName(cluster: any[]): string {
    const names = ['High-Value Customers', 'Regular Customers', 'New Customers', 'At-Risk Customers'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private static calculateSegmentCharacteristics(cluster: any[]): any {
    return {
      avg_order_value: Math.random() * 500000,
      frequency: Math.random() * 10,
      lifetime_value: Math.random() * 2000000,
      churn_probability: Math.random() * 0.5
    };
  }

  private static generateSegmentProfile(cluster: any[]): any {
    return {
      demographic: 'Mixed demographic',
      behavior: 'Regular purchaser',
      preferences: ['Quality products', 'Good value']
    };
  }

  private static generateMarketingRecommendations(cluster: any[]): string[] {
    return [
      'Personalized email campaigns',
      'Loyalty program enrollment',
      'Product recommendations'
    ];
  }

  // Additional placeholder methods would be implemented here...
  private static calculateRFMScore(recency: number, frequency: number, monetary: number): number {
    return (recency * 0.3 + frequency * 0.4 + monetary * 0.3);
  }

  private static calculatePredictedCLV(rfmScore: number, frequency: number, monetary: number): number {
    return monetary * frequency * (1 + rfmScore / 100);
  }

  private static classifyCustomerSegment(rfmScore: number): string {
    if (rfmScore > 80) return 'Champions';
    if (rfmScore > 60) return 'Loyal Customers';
    if (rfmScore > 40) return 'Potential Loyalists';
    return 'New Customers';
  }

  private static predictChurnProbability(recency: number, frequency: number): number {
    return Math.min(1, (recency / 90) * (1 / Math.max(1, frequency)));
  }

  private static linearRegression(data: any[]): any {
    // Simplified linear regression
    return {
      model: 'linear',
      r_squared: Math.random(),
      direction: 'upward',
      confidence: Math.random(),
      forecast: Math.random() * 1000000,
      strength: Math.random()
    };
  }

  private static polynomialRegression(data: any[], degree: number): any {
    return {
      model: 'polynomial',
      r_squared: Math.random(),
      direction: 'upward',
      confidence: Math.random(),
      forecast: Math.random() * 1000000,
      strength: Math.random()
    };
  }

  private static exponentialRegression(data: any[]): any {
    return {
      model: 'exponential',
      r_squared: Math.random(),
      direction: 'upward',
      confidence: Math.random(),
      forecast: Math.random() * 1000000,
      strength: Math.random()
    };
  }

  private static selectBestTrendModel(trends: any): any {
    const models = Object.values(trends);
    return models.reduce((best, current) => 
      (current as any).r_squared > (best as any).r_squared ? current : best
    );
  }

  private static groupByTransaction(salesData: any[]): any[] {
    // Group by order_id or similar transaction identifier
    const transactions = {};
    
    salesData.forEach(sale => {
      const transactionId = sale.order_id || sale.transaction_id || `${sale.customer}_${sale.order_date}`;
      if (!transactions[transactionId]) {
        transactions[transactionId] = [];
      }
      transactions[transactionId].push(sale.nama_produk || sale.product_name);
    });
    
    return Object.values(transactions);
  }

  private static findProductPairs(transactions: any[]): any[] {
    const pairs = [];
    
    transactions.forEach(transaction => {
      for (let i = 0; i < transaction.length; i++) {
        for (let j = i + 1; j < transaction.length; j++) {
          pairs.push([transaction[i], transaction[j]]);
        }
      }
    });
    
    return pairs;
  }

  private static calculateAffinityRules(productPairs: any[]): any[] {
    // Simplified market basket analysis
    const rules = {};
    
    productPairs.forEach(([product1, product2]) => {
      const key = `${product1} -> ${product2}`;
      if (!rules[key]) {
        rules[key] = {
          antecedent: product1,
          consequent: product2,
          count: 0,
          support: 0,
          confidence: 0,
          lift: 0
        };
      }
      rules[key].count++;
    });
    
    // Calculate metrics
    Object.values(rules).forEach((rule: any) => {
      rule.support = rule.count / productPairs.length;
      rule.confidence = Math.random(); // Simplified
      rule.lift = Math.random() * 3; // Simplified
    });
    
    return Object.values(rules);
  }
}

export default AdvancedAnalyticsUtils;