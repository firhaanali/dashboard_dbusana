/**
 * Realistic Forecasting Monitor & Performance Tracker
 * Monitoring dan analisis performa algoritma forecasting yang realistis
 */

export class RealisticForecastingMonitor {
  
  /**
   * Log performa forecasting dengan natural fluctuation metrics
   */
  static logForecastingPerformance(
    modelName: string,
    historicalData: any[],
    forecasts: any[],
    metrics: any,
    analysis?: any
  ) {
    console.group(`🎯 ${modelName} Performance Analysis`);
    
    // Basic performance metrics
    console.log(`📊 Data Quality Assessment:`);
    console.log(`   • Historical Points: ${historicalData.length}`);
    console.log(`   • Forecast Points: ${forecasts.length}`);
    console.log(`   • Confidence: ${metrics.confidence.toFixed(1)}%`);
    console.log(`   • Quality Score: ${metrics.quality_score.toFixed(1)}%`);
    
    if (analysis) {
      console.log(`📈 Market Analysis:`);
      console.log(`   • Base Volatility: ${(analysis.baseVolatility * 100).toFixed(1)}%`);
      console.log(`   • Trend Strength: ${analysis.trendStrength.toFixed(3)}`);
      console.log(`   • Market Regime: ${analysis.regime}`);
      console.log(`   • Natural Fluctuation: ${(analysis.naturalFluctuation * 100).toFixed(1)}%`);
      
      if (analysis.microStructure) {
        console.log(`🔬 Microstructure:`);
        console.log(`   • Persistence: ${analysis.microStructure.persistence.toFixed(3)}`);
        console.log(`   • Mean Reversion: ${analysis.microStructure.meanReversion.toFixed(3)}`);
        console.log(`   • Jump Frequency: ${(analysis.microStructure.jumpFrequency * 100).toFixed(1)}%`);
        console.log(`   • Clustering Effect: ${analysis.microStructure.clusteringEffect.toFixed(3)}`);
      }
    }
    
    // Forecast characteristics
    if (forecasts.length > 0) {
      const avgDaily = this.calculateAverageDailyChange(forecasts);
      const maxChange = this.calculateMaxDailyChange(forecasts);
      const volatility = this.calculateForecastVolatility(forecasts);
      
      console.log(`🌊 Forecast Characteristics:`);
      console.log(`   • Avg Daily Change: ${(avgDaily * 100).toFixed(2)}%`);
      console.log(`   • Max Daily Change: ${(maxChange * 100).toFixed(2)}%`);
      console.log(`   • Forecast Volatility: ${(volatility * 100).toFixed(1)}%`);
      console.log(`   • Natural Score: ${metrics.natural_score || 'N/A'}`);
      console.log(`   • Volatility Score: ${metrics.volatility_score || 'N/A'}`);
    }
    
    console.groupEnd();
  }
  
  /**
   * Validate business logic dari prediksi
   */
  static validateBusinessLogic(historicalData: any[], forecasts: any[]) {
    console.group(`✅ Business Logic Validation`);
    
    if (historicalData.length === 0 || forecasts.length === 0) {
      console.warn('❌ Insufficient data for validation');
      console.groupEnd();
      return;
    }
    
    const lastHistoricalValue = historicalData[historicalData.length - 1].value;
    const firstForecastValue = forecasts[0].predicted;
    
    // Check untuk continuity
    const discontinuity = Math.abs(firstForecastValue - lastHistoricalValue) / lastHistoricalValue;
    if (discontinuity > 0.3) {
      console.warn(`⚠️ Large discontinuity detected: ${(discontinuity * 100).toFixed(1)}%`);
    } else {
      console.log(`✅ Good continuity: ${(discontinuity * 100).toFixed(1)}% gap`);
    }
    
    // Check untuk realistic ranges
    const historicalVolatility = this.calculateHistoricalVolatility(historicalData);
    const forecastVolatility = this.calculateForecastVolatility(forecasts);
    
    if (forecastVolatility < historicalVolatility * 0.3) {
      console.warn(`⚠️ Forecast too smooth (${(forecastVolatility * 100).toFixed(1)}% vs ${(historicalVolatility * 100).toFixed(1)}% historical)`);
    } else if (forecastVolatility > historicalVolatility * 3) {
      console.warn(`⚠️ Forecast too volatile (${(forecastVolatility * 100).toFixed(1)}% vs ${(historicalVolatility * 100).toFixed(1)}% historical)`);
    } else {
      console.log(`✅ Realistic volatility ratio: ${(forecastVolatility / historicalVolatility).toFixed(2)}x`);
    }
    
    // Check confidence intervals
    const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;
    const confidenceDecay = this.calculateConfidenceDecay(forecasts);
    
    console.log(`📊 Confidence Analysis:`);
    console.log(`   • Average Confidence: ${avgConfidence.toFixed(1)}%`);
    console.log(`   • Confidence Decay: ${(confidenceDecay * 100).toFixed(2)}% per day`);
    
    if (avgConfidence < 30) {
      console.warn(`⚠️ Low average confidence`);
    } else if (avgConfidence > 90) {
      console.warn(`⚠️ Unrealistically high confidence`);
    } else {
      console.log(`✅ Realistic confidence levels`);
    }
    
    console.groupEnd();
  }
  
  /**
   * Compare algorithms performance
   */
  static logAlgorithmComparison(modelComparisons: any[]) {
    console.group(`🔬 Algorithm Performance Comparison`);
    
    if (!modelComparisons || modelComparisons.length === 0) {
      console.log('No model comparisons available');
      console.groupEnd();
      return;
    }
    
    // Sort by score
    const sortedModels = [...modelComparisons].sort((a, b) => b.score - a.score);
    
    console.log(`📊 Model Rankings:`);
    sortedModels.forEach((model, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📈';
      const status = model.error ? '❌' : '✅';
      
      console.log(`${emoji} ${index + 1}. ${model.name} ${status}`);
      console.log(`   Score: ${model.score.toFixed(3)}`);
      
      if (model.metrics) {
        console.log(`   MAPE: ${model.metrics.mape?.toFixed(1) || 'N/A'}%`);
        console.log(`   R²: ${model.metrics.r_squared?.toFixed(3) || 'N/A'}`);
        console.log(`   Confidence: ${model.metrics.confidence?.toFixed(1) || 'N/A'}%`);
      }
      
      if (model.error) {
        console.log(`   Error: ${model.error}`);
      }
      console.log('');
    });
    
    console.groupEnd();
  }
  
  /**
   * Monitor forecasting trends over time
   */
  static trackForecastingTrends(forecasts: any[], timeHorizon: string) {
    console.group(`📈 Forecasting Trends Analysis (${timeHorizon})`);
    
    if (forecasts.length === 0) {
      console.log('No forecasts to analyze');
      console.groupEnd();
      return;
    }
    
    // Trend analysis
    const startValue = forecasts[0].predicted;
    const endValue = forecasts[forecasts.length - 1].predicted;
    const totalChange = (endValue - startValue) / startValue;
    const annualizedGrowth = Math.pow(1 + totalChange, 365 / forecasts.length) - 1;
    
    console.log(`🎯 Trend Analysis:`);
    console.log(`   • Total Change: ${(totalChange * 100).toFixed(1)}%`);
    console.log(`   • Annualized Growth: ${(annualizedGrowth * 100).toFixed(1)}%`);
    
    // Volatility periods
    const highVolPeriods = this.identifyHighVolatilityPeriods(forecasts);
    const lowVolPeriods = this.identifyLowVolatilityPeriods(forecasts);
    
    console.log(`🌊 Volatility Periods:`);
    console.log(`   • High Volatility Days: ${highVolPeriods.length}`);
    console.log(`   • Low Volatility Days: ${lowVolPeriods.length}`);
    
    // Confidence evolution
    const confidenceEvolution = this.analyzeConfidenceEvolution(forecasts);
    console.log(`📊 Confidence Evolution:`);
    console.log(`   • Start: ${confidenceEvolution.start.toFixed(1)}%`);
    console.log(`   • End: ${confidenceEvolution.end.toFixed(1)}%`);
    console.log(`   • Average Decay: ${confidenceEvolution.averageDecay.toFixed(2)}% per day`);
    
    console.groupEnd();
  }
  
  // Helper methods
  private static calculateAverageDailyChange(forecasts: any[]): number {
    if (forecasts.length < 2) return 0;
    
    let totalChange = 0;
    for (let i = 1; i < forecasts.length; i++) {
      const change = (forecasts[i].predicted - forecasts[i-1].predicted) / forecasts[i-1].predicted;
      totalChange += Math.abs(change);
    }
    
    return totalChange / (forecasts.length - 1);
  }
  
  private static calculateMaxDailyChange(forecasts: any[]): number {
    if (forecasts.length < 2) return 0;
    
    let maxChange = 0;
    for (let i = 1; i < forecasts.length; i++) {
      const change = Math.abs((forecasts[i].predicted - forecasts[i-1].predicted) / forecasts[i-1].predicted);
      maxChange = Math.max(maxChange, change);
    }
    
    return maxChange;
  }
  
  private static calculateForecastVolatility(forecasts: any[]): number {
    if (forecasts.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < forecasts.length; i++) {
      const ret = (forecasts[i].predicted - forecasts[i-1].predicted) / forecasts[i-1].predicted;
      returns.push(ret);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }
  
  private static calculateHistoricalVolatility(data: any[]): number {
    if (data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const ret = (data[i].value - data[i-1].value) / data[i-1].value;
      returns.push(ret);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }
  
  private static calculateConfidenceDecay(forecasts: any[]): number {
    if (forecasts.length < 2) return 0;
    
    const firstConfidence = forecasts[0].confidence;
    const lastConfidence = forecasts[forecasts.length - 1].confidence;
    
    return (firstConfidence - lastConfidence) / forecasts.length;
  }
  
  private static identifyHighVolatilityPeriods(forecasts: any[]): any[] {
    const avgVolatility = this.calculateForecastVolatility(forecasts);
    const threshold = avgVolatility * 1.5;
    
    const highVolPeriods = [];
    for (let i = 1; i < forecasts.length; i++) {
      const dailyChange = Math.abs((forecasts[i].predicted - forecasts[i-1].predicted) / forecasts[i-1].predicted);
      if (dailyChange > threshold) {
        highVolPeriods.push(forecasts[i]);
      }
    }
    
    return highVolPeriods;
  }
  
  private static identifyLowVolatilityPeriods(forecasts: any[]): any[] {
    const avgVolatility = this.calculateForecastVolatility(forecasts);
    const threshold = avgVolatility * 0.5;
    
    const lowVolPeriods = [];
    for (let i = 1; i < forecasts.length; i++) {
      const dailyChange = Math.abs((forecasts[i].predicted - forecasts[i-1].predicted) / forecasts[i-1].predicted);
      if (dailyChange < threshold) {
        lowVolPeriods.push(forecasts[i]);
      }
    }
    
    return lowVolPeriods;
  }
  
  private static analyzeConfidenceEvolution(forecasts: any[]): {
    start: number;
    end: number;
    averageDecay: number;
  } {
    if (forecasts.length === 0) {
      return { start: 0, end: 0, averageDecay: 0 };
    }
    
    const start = forecasts[0].confidence;
    const end = forecasts[forecasts.length - 1].confidence;
    const averageDecay = (start - end) / forecasts.length;
    
    return { start, end, averageDecay };
  }
}

// Export monitoring functions
export const logRealisticForecastingPerformance = RealisticForecastingMonitor.logForecastingPerformance;
export const validateRealisticBusinessLogic = RealisticForecastingMonitor.validateBusinessLogic;
export const logRealisticAlgorithmComparison = RealisticForecastingMonitor.logAlgorithmComparison;
export const trackRealisticForecastingTrends = RealisticForecastingMonitor.trackForecastingTrends;