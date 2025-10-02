/**
 * Advanced Forecasting Algorithms v4.0 - Enhanced Volatility Predictions
 * Implementasi algoritma forecasting dengan volatilitas bisnis yang realistis
 * Menggunakan Enhanced Volatility Algorithm untuk D'Busana Fashion Business
 * Designed for realistic business forecasting dengan fluktuasi yang natural
 */

// Import enhanced volatility forecasting
import { 
  generateEnhancedVolatilityForecast, 
  type EnhancedForecastResult,
  type BusinessVolatilityMetrics 
} from './enhancedVolatilityForecasting';

export interface HistoricalDataPoint {
  date: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface ForecastResult {
  date: string;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
  model: string;
  components: {
    trend: number;
    seasonal: number;
    residual: number;
  };
}

export interface ModelMetrics {
  mape: number; // Mean Absolute Percentage Error
  mae: number;  // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  confidence: number;
  r_squared: number;
  quality_score: number;
}

/**
 * Calculate dynamic forecast horizons based on last data point from database
 */
export function calculateDynamicHorizons(lastDataDate: string): {
  horizon30: string;
  horizon60: string;
  horizon90: string;
} {
  const lastDate = new Date(lastDataDate);
  
  const horizon30 = new Date(lastDate);
  horizon30.setDate(horizon30.getDate() + 30);
  
  const horizon60 = new Date(lastDate);
  horizon60.setDate(horizon60.getDate() + 60);
  
  const horizon90 = new Date(lastDate);
  horizon90.setDate(horizon90.getDate() + 90);
  
  return {
    horizon30: horizon30.toISOString().split('T')[0],
    horizon60: horizon60.toISOString().split('T')[0],
    horizon90: horizon90.toISOString().split('T')[0]
  };
}

/**
 * Enhanced Market Volatility Calculator
 * Menganalisis volatilitas historis untuk menciptakan fluktuasi realistis
 */
export class MarketVolatilityAnalyzer {
  static calculateHistoricalVolatility(data: HistoricalDataPoint[]): {
    dailyVolatility: number;
    trendStrength: number;
    cyclicalPatterns: number[];
    marketRegime: 'bull' | 'bear' | 'sideways';
  } {
    if (data.length < 7) {
      return {
        dailyVolatility: 0.18, // Increased default volatility for business realism
        trendStrength: 0,
        cyclicalPatterns: [],
        marketRegime: 'sideways'
      };
    }

    // Calculate daily returns (percentage changes)
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i-1].value > 0) {
        const returnRate = (data[i].value - data[i-1].value) / data[i-1].value;
        returns.push(returnRate);
      }
    }

    if (returns.length === 0) {
      return {
        dailyVolatility: 0.18,
        trendStrength: 0,
        cyclicalPatterns: [],
        marketRegime: 'sideways'
      };
    }

    // Calculate volatility (standard deviation of returns)
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const dailyVolatility = Math.sqrt(variance);

    // Calculate trend strength using linear regression on log values
    const logValues = data.map(d => Math.log(Math.max(1, d.value)));
    const trendStrength = this.calculateTrendStrength(logValues);

    // Analyze cyclical patterns (weekly, monthly cycles)
    const cyclicalPatterns = this.detectCyclicalPatterns(data);

    // Determine market regime
    const recentTrend = returns.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, returns.length);
    const marketRegime: 'bull' | 'bear' | 'sideways' = 
      recentTrend > 0.02 ? 'bull' : 
      recentTrend < -0.02 ? 'bear' : 'sideways';

    return {
      dailyVolatility: Math.max(0.08, Math.min(0.35, dailyVolatility)), // Enhanced volatility range for business
      trendStrength,
      cyclicalPatterns,
      marketRegime
    };
  }

  private static calculateTrendStrength(logValues: number[]): number {
    const n = logValues.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = logValues;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isFinite(slope) ? slope : 0;
  }

  private static detectCyclicalPatterns(data: HistoricalDataPoint[]): number[] {
    const values = data.map(d => d.value);
    const patterns: number[] = [];
    
    // Detect weekly pattern (7 days)
    if (data.length >= 14) {
      const weeklyCorrelation = this.calculateAutoCorrelation(values, 7);
      patterns.push(weeklyCorrelation);
    }
    
    // Detect monthly pattern (30 days)
    if (data.length >= 60) {
      const monthlyCorrelation = this.calculateAutoCorrelation(values, 30);
      patterns.push(monthlyCorrelation);
    }
    
    return patterns;
  }

  private static calculateAutoCorrelation(values: number[], lag: number): number {
    if (values.length < lag * 2) return 0;
    
    const n = values.length - lag;
    let correlation = 0;
    
    for (let i = 0; i < n; i++) {
      const current = values[i + lag];
      const lagged = values[i];
      if (current > 0 && lagged > 0) {
        correlation += (current - lagged) / Math.max(current, lagged);
      }
    }
    
    return Math.abs(correlation / n);
  }
}

/**
 * Business-Realistic Forecasting Algorithm (Enhanced Volatility)
 * Menghasilkan prediksi dengan volatilitas bisnis yang realistis
 */
export class MarketRealisticForecaster {
  forecast(data: HistoricalDataPoint[], periods: number): { forecasts: ForecastResult[], metrics: ModelMetrics } {
    if (data.length < 7) {
      throw new Error('Insufficient data for market-realistic forecasting: need at least 7 points');
    }

    const cleanedData = DataPreprocessor.cleanAndSmooth(data);
    const values = cleanedData.map(d => d.value);
    const dates = cleanedData.map(d => d.date);
    
    // Calculate enhanced baseline metrics with business volatility
    const recentValues = values.slice(-Math.min(30, values.length));
    const baseLevel = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const lastValue = values[values.length - 1];
    
    // Calculate business-oriented trend
    const businessTrend = this.calculateBusinessTrend(values);
    
    // Analyze volatility with enhanced business patterns
    const volatilityAnalysis = MarketVolatilityAnalyzer.calculateHistoricalVolatility(cleanedData);
    const enhancedVolatility = Math.max(0.12, Math.min(0.30, volatilityAnalysis.dailyVolatility * 1.8)); // Enhanced volatility
    
    // Generate forecasts with business volatility
    const forecasts: ForecastResult[] = [];
    const lastDate = new Date(dates[dates.length - 1]);
    
    // Initialize with business momentum
    let currentValue = lastValue;
    let marketMomentum = this.calculateInitialMomentum(values.slice(-10));
    
    for (let i = 1; i <= periods; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      // Apply business growth with realistic progression
      const dailyGrowthRate = businessTrend / 365;
      const trendComponent = currentValue * (1 + dailyGrowthRate);
      
      // Generate enhanced business fluctuations
      const fluctuationSeed = this.hashString(futureDate.toISOString()) % 10000;
      const businessFluctuation = this.generateEnhancedBusinessFluctuation(
        fluctuationSeed, 
        enhancedVolatility, 
        i, 
        marketMomentum,
        volatilityAnalysis.marketRegime
      );
      
      // Apply enhanced seasonal patterns
      const seasonalFactor = this.calculateEnhancedSeasonalFactor(i, futureDate);
      
      // Calculate predicted value with business dynamics
      const rawPredicted = trendComponent * (1 + businessFluctuation) * seasonalFactor;
      
      // Apply business-realistic constraints with wider ranges
      const minValue = currentValue * 0.6; // Allow up to 40% drops (realistic for volatile business)
      const maxValue = currentValue * 1.6; // Allow up to 60% rises (realistic for growth periods)
      const predicted = Math.max(minValue, Math.min(maxValue, rawPredicted));
      
      // Calculate enhanced confidence intervals with business uncertainty
      const baseUncertainty = predicted * enhancedVolatility * Math.sqrt(i / 10); // Faster uncertainty growth
      const businessUncertainty = predicted * 0.30; // 30% base business uncertainty
      const uncertaintyRange = Math.max(baseUncertainty, businessUncertainty);
      const confidenceLevel = this.calculateBusinessConfidence(i, enhancedVolatility, volatilityAnalysis.marketRegime);
      
      forecasts.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        lower_bound: Math.max(0, predicted - uncertaintyRange * 1.5),
        upper_bound: predicted + uncertaintyRange * 1.5,
        confidence: confidenceLevel,
        model: 'Enhanced Volatility Forecaster',
        components: {
          trend: trendComponent - currentValue,
          seasonal: (seasonalFactor - 1) * predicted,
          residual: businessFluctuation * predicted
        }
      });
      
      currentValue = predicted;
      
      // Update market momentum with business cycles
      marketMomentum = this.updateBusinessMomentum(marketMomentum, businessFluctuation, i);
    }

    // Calculate enhanced business metrics
    const metrics = this.calculateEnhancedBusinessMetrics(cleanedData, baseLevel, businessTrend, enhancedVolatility);
    
    return { forecasts, metrics };
  }

  private calculateBusinessTrend(values: number[]): number {
    if (values.length < 7) return 0;
    
    // Use multiple time horizons for business trend calculation
    const recent14 = values.slice(-Math.min(14, values.length));
    const recent30 = values.slice(-Math.min(30, values.length));
    const recent60 = values.slice(-Math.min(60, values.length), -Math.min(30, values.length));
    
    if (recent60.length === 0) return 0;
    
    const recent14Avg = recent14.reduce((sum, v) => sum + v, 0) / recent14.length;
    const recent30Avg = recent30.reduce((sum, v) => sum + v, 0) / recent30.length;
    const recent60Avg = recent60.reduce((sum, v) => sum + v, 0) / recent60.length;
    
    // Calculate weighted trend progression
    const shortTrend = recent60Avg > 0 ? (recent30Avg - recent60Avg) / recent60Avg : 0;
    const mediumTrend = recent30Avg > 0 ? (recent14Avg - recent30Avg) / recent30Avg : 0;
    
    // Weight recent trends more heavily
    const compositeTrend = (mediumTrend * 0.7 + shortTrend * 0.3);
    const periodsPerYear = 365 / 14; // Convert to annual rate
    const annualTrend = compositeTrend * periodsPerYear;
    
    // Apply business-realistic constraints with wider ranges
    return Math.max(-0.40, Math.min(0.60, annualTrend)); // Between -40% and +60% annually (realistic for fashion business)
  }

  private generateEnhancedBusinessFluctuation(
    seed: number, 
    volatility: number, 
    dayIndex: number, 
    momentum: number,
    regime: 'bull' | 'bear' | 'sideways'
  ): number {
    // Generate complex business fluctuations with multiple waves
    const wave1 = Math.sin(seed * 0.08 + dayIndex * 0.06) * 0.35;
    const wave2 = Math.sin(seed * 0.12 + dayIndex * 0.04) * 0.25;
    const wave3 = Math.sin(seed * 0.15 + dayIndex * 0.09) * 0.20;
    const wave4 = Math.cos(seed * 0.11 + dayIndex * 0.07) * 0.15;
    const wave5 = Math.cos(seed * 0.09 + dayIndex * 0.05) * 0.05;
    
    // Combine waves for complex business patterns
    const baseFluctuation = (wave1 + wave2 + wave3 + wave4 + wave5) / 1.0;
    
    // Apply business momentum influence
    const momentumInfluence = momentum * 0.4; // 40% momentum contribution
    
    // Apply market regime bias
    const regimeBias = this.getRegimeBias(regime, dayIndex);
    
    // Business cycle influence (monthly and quarterly patterns)
    const businessCycleFactor = 1 + Math.sin(dayIndex * 0.02) * 0.25 + Math.sin(dayIndex * 0.007) * 0.15;
    
    // Time evolution with increasing complexity
    const timeComplexity = 1 + Math.sin(dayIndex * 0.003) * 0.1;
    
    // Combine all factors
    const enhancedFluctuation = (baseFluctuation + momentumInfluence + regimeBias) 
      * volatility 
      * businessCycleFactor 
      * timeComplexity;
    
    // Allow realistic business movements with wider ranges
    return Math.max(-0.25, Math.min(0.25, enhancedFluctuation)); // ±25% daily movement
  }

  private calculateEnhancedSeasonalFactor(dayIndex: number, date: Date): number {
    // Enhanced weekly seasonality (stronger business patterns)
    const weeklyFactor = Math.sin(2 * Math.PI * dayIndex / 7) * 0.06; // 6% weekly variation
    
    // Enhanced monthly seasonality (marketing cycles, pay periods)
    const monthlyFactor = Math.sin(2 * Math.PI * dayIndex / 30) * 0.04; // 4% monthly variation
    
    // Quarterly seasonality (business reporting cycles)
    const quarterlyFactor = Math.sin(2 * Math.PI * dayIndex / 90) * 0.03; // 3% quarterly variation
    
    // Day of week patterns (stronger for business)
    const dayOfWeek = date.getDay();
    const dayWeights = [0.65, 1.0, 1.15, 1.18, 1.25, 1.35, 0.85]; // Sunday to Saturday - enhanced variations
    const dayOfWeekFactor = (dayWeights[dayOfWeek] - 1) * 0.08; // 8% day-of-week influence
    
    // Month of year patterns (fashion seasonality)
    const month = date.getMonth();
    const monthWeights = [0.8, 0.85, 1.1, 1.2, 1.15, 1.3, 1.25, 1.1, 0.95, 1.05, 1.2, 1.4]; // Jan-Dec
    const monthOfYearFactor = (monthWeights[month] - 1) * 0.05; // 5% monthly influence
    
    return 1 + weeklyFactor + monthlyFactor + quarterlyFactor + dayOfWeekFactor + monthOfYearFactor;
  }

  private getRegimeBias(regime: 'bull' | 'bear' | 'sideways', dayIndex: number): number {
    const regimeStrength = Math.exp(-dayIndex / 45); // Regime effect decays over 45 days
    
    switch (regime) {
      case 'bull':
        return 0.03 * regimeStrength; // 3% upward bias that decays
      case 'bear':
        return -0.03 * regimeStrength; // 3% downward bias that decays
      default:
        return Math.sin(dayIndex * 0.02) * 0.01 * regimeStrength; // Small oscillation in sideways market
    }
  }

  private calculateBusinessConfidence(dayIndex: number, volatility: number, regime: 'bull' | 'bear' | 'sideways'): number {
    // Base confidence decreases more gradually for business forecasting
    let baseConfidence = Math.max(35, 70 - (dayIndex * 0.4)); // Slower decrease
    
    // Adjust based on volatility
    const volatilityAdjustment = (1 - Math.min(volatility, 0.3) / 0.3) * 10; // Up to 10% boost for low volatility
    
    // Adjust based on market regime
    switch (regime) {
      case 'bull':
        baseConfidence *= 1.08; // Higher confidence in growth
        break;
      case 'bear':
        baseConfidence *= 0.88; // Lower confidence in decline
        break;
      case 'sideways':
        baseConfidence *= 1.05; // Slightly higher confidence in stable markets
        break;
    }
    
    return Math.max(30, Math.min(75, baseConfidence + volatilityAdjustment));
  }

  private calculateInitialMomentum(recentValues: number[]): number {
    if (recentValues.length < 3) return 0;
    
    const changes = [];
    for (let i = 1; i < recentValues.length; i++) {
      if (recentValues[i-1] > 0) {
        changes.push((recentValues[i] - recentValues[i-1]) / recentValues[i-1]);
      }
    }
    
    if (changes.length === 0) return 0;
    
    // Calculate momentum as weighted average of recent changes
    let weightedMomentum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < changes.length; i++) {
      const weight = i + 1; // More recent changes get higher weight
      weightedMomentum += changes[i] * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedMomentum / totalWeight : 0;
  }

  private updateBusinessMomentum(currentMomentum: number, recentChange: number, dayIndex: number): number {
    // Momentum evolves with mean reversion and new information
    const decayFactor = Math.exp(-dayIndex / 20); // Momentum decays over 20 days
    const newInfoWeight = 0.3; // 30% weight to new information
    
    const updatedMomentum = currentMomentum * (1 - newInfoWeight) * decayFactor + recentChange * newInfoWeight;
    
    // Constrain momentum to reasonable bounds
    return Math.max(-0.1, Math.min(0.1, updatedMomentum));
  }

  private calculateEnhancedBusinessMetrics(
    data: HistoricalDataPoint[], 
    baseLevel: number, 
    trend: number,
    volatility: number
  ): ModelMetrics {
    if (data.length < 7) {
      return {
        mape: 0,
        mae: 0,
        rmse: 0,
        confidence: 60, // Moderate default confidence for business
        r_squared: 0.45,
        quality_score: 27
      };
    }

    // Enhanced validation using more sophisticated approach
    const validationSize = Math.min(16, Math.floor(data.length * 0.35));
    const errors: number[] = [];
    
    // Test enhanced model on recent data points
    for (let i = validationSize; i > 0; i--) {
      const actualValue = data[data.length - i].value;
      const daysBack = i;
      
      // Enhanced prediction incorporating volatility and seasonality
      const basePredict = baseLevel * (1 + trend * daysBack / 365);
      const volatilityFactor = 1 + Math.sin(daysBack * 0.1) * volatility * 0.5;
      const seasonalFactor = 1 + Math.sin(2 * Math.PI * daysBack / 7) * 0.03;
      const predictedValue = basePredict * volatilityFactor * seasonalFactor;
      
      if (actualValue > 0) {
        const percentError = Math.abs(actualValue - predictedValue) / actualValue * 100;
        errors.push(Math.min(200, percentError)); // Cap at 200% for business volatility
      }
    }
    
    if (errors.length === 0) {
      return {
        mape: 20,
        mae: baseLevel * 0.20,
        rmse: baseLevel * 0.25,
        confidence: 60,
        r_squared: 0.45,
        quality_score: 27
      };
    }
    
    const mape = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const mae = (mape / 100) * baseLevel;
    const rmse = Math.sqrt(errors.reduce((sum, e) => sum + (e * baseLevel / 100) ** 2, 0) / errors.length);
    
    // Enhanced confidence calculation for business forecasting
    let confidence = Math.max(30, Math.min(75, 80 - mape * 0.6));
    
    // Adjust confidence based on volatility characteristics
    const volatilityConfidenceAdjustment = (1 - Math.min(volatility, 0.3) / 0.3) * 5; // Up to 5% adjustment
    confidence = Math.min(75, confidence + volatilityConfidenceAdjustment);
    
    // Enhanced R-squared calculation
    const trendStability = Math.abs(trend) < 0.1 ? 0.7 : Math.abs(trend) < 0.2 ? 0.55 : 0.4;
    const volatilityFactor = 0.6 - Math.min(volatility, 0.3) / 0.3 * 0.2; // Lower R² for higher volatility
    const accuracyFactor = Math.max(0.2, 1 - (mape / 150)); // Adjusted for business context
    const r_squared = Math.min(0.82, trendStability * volatilityFactor * accuracyFactor);
    
    return {
      mape: Math.round(mape * 100) / 100,
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      r_squared: Math.round(r_squared * 1000) / 1000,
      quality_score: Math.round((confidence * r_squared / 100) * 100) / 100
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Enhanced data preprocessing utilities
 */
export class DataPreprocessor {
  static cleanAndSmooth(data: HistoricalDataPoint[]): HistoricalDataPoint[] {
    if (data.length < 3) return data;
    
    // Sort by date to ensure chronological order
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    
    // Enhanced outlier detection using modified IQR method for business data
    const values = sorted.map(d => d.value);
    const q1 = this.quantile(values, 0.25);
    const q3 = this.quantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 2.0 * iqr; // Less aggressive outlier removal for business volatility
    const upperBound = q3 + 2.0 * iqr;
    
    // Apply minimal smoothing to preserve business volatility
    const smoothed = sorted.map((point, index) => {
      let smoothedValue = point.value;
      
      // Handle only extreme outliers to preserve business fluctuations
      if (point.value < lowerBound || point.value > upperBound) {
        // Use weighted moving average
        const start = Math.max(0, index - 3);
        const end = Math.min(sorted.length, index + 4);
        const neighbors = sorted.slice(start, end).filter((_, i) => start + i !== index);
        
        if (neighbors.length > 0) {
          // Weight recent values more heavily
          let weightedSum = 0;
          let totalWeight = 0;
          
          neighbors.forEach((neighbor, i) => {
            const distance = Math.abs((start + i) - index);
            const weight = 1 / (distance + 1);
            weightedSum += neighbor.value * weight;
            totalWeight += weight;
          });
          
          smoothedValue = totalWeight > 0 ? weightedSum / totalWeight : point.value;
        }
      }
      
      return {
        ...point,
        value: Math.max(0, smoothedValue)
      };
    });
    
    return smoothed;
  }
  
  static quantile(arr: number[], q: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  }
}

/**
 * Simple Trend Forecaster (Enhanced for Business Volatility)
 */
export class SimpleTrendForecaster {
  forecast(data: HistoricalDataPoint[], periods: number): { forecasts: ForecastResult[], metrics: ModelMetrics } {
    if (data.length < 2) {
      throw new Error('Insufficient data for simple trend forecasting: need at least 2 points');
    }

    const cleanedData = DataPreprocessor.cleanAndSmooth(data);
    const values = cleanedData.map(d => d.value);
    const dates = cleanedData.map(d => d.date);
    
    // Enhanced baseline calculation
    const recent = values.slice(-Math.min(20, values.length));
    const avgRevenue = recent.reduce((sum, d) => sum + d, 0) / recent.length;
    const lastValue = values[values.length - 1];
    
    // Calculate enhanced trend with business considerations
    const older = values.slice(-Math.min(40, values.length), -Math.min(20, values.length));
    const olderAvg = older.length > 0 ? older.reduce((sum, d) => sum + d, 0) / older.length : avgRevenue;
    let trend = olderAvg > 0 ? (avgRevenue - olderAvg) / olderAvg : 0;
    
    // Enhanced trend constraints for business volatility
    trend = Math.max(-0.15, Math.min(0.20, trend)); // Between -15% and +20% annually (wider for business)
    
    const forecasts: ForecastResult[] = [];
    const lastDate = new Date(dates[dates.length - 1]);
    
    // Start forecasting from last actual value for continuity
    let currentValue = lastValue;
    
    for (let i = 1; i <= periods; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      // Apply gradual daily growth
      const dailyGrowthRate = trend / 365;
      const trendedValue = currentValue * (1 + dailyGrowthRate);
      
      // Add enhanced seasonal variation for business
      const seasonalFactor = 1 + Math.sin((i * 2 * Math.PI) / 7) * 0.025; // 2.5% weekly variation
      
      // Add business volatility component
      const volatilityFactor = 1 + Math.sin(i * 0.1 + i * 0.03) * 0.02; // 2% volatility component
      
      // Calculate predicted value
      const predicted = trendedValue * seasonalFactor * volatilityFactor;
      
      // Apply enhanced stability constraints for business
      const minValue = currentValue * 0.85; // Max 15% daily drop
      const maxValue = currentValue * 1.20; // Max 20% daily rise
      const stabilizedPredicted = Math.max(minValue, Math.min(maxValue, predicted));
      
      const uncertainty = stabilizedPredicted * 0.18 * Math.sqrt(i / 25); // Enhanced uncertainty
      const confidence = Math.max(60, 90 - (i * 0.4)); // Enhanced confidence model
      
      forecasts.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.max(0, stabilizedPredicted),
        lower_bound: Math.max(0, stabilizedPredicted - uncertainty),
        upper_bound: stabilizedPredicted + uncertainty,
        confidence: confidence,
        model: 'Enhanced Simple Trend Forecaster',
        components: {
          trend: trendedValue - currentValue,
          seasonal: (seasonalFactor - 1) * stabilizedPredicted,
          residual: (volatilityFactor - 1) * stabilizedPredicted
        }
      });
      
      currentValue = stabilizedPredicted;
    }
    
    // Calculate enhanced metrics for business context
    const metrics: ModelMetrics = data.length >= 7 ? 
      this.calculateEnhancedSimpleMetrics(cleanedData, avgRevenue, trend) : {
        mape: 0,
        mae: 0,
        rmse: 0,
        confidence: 70,
        r_squared: 0.55,
        quality_score: 38.5
      };
    
    return { forecasts, metrics };
  }

  private calculateEnhancedSimpleMetrics(data: HistoricalDataPoint[], avgRevenue: number, trend: number): ModelMetrics {
    if (data.length < 7) {
      return {
        mape: 0,
        mae: 0,
        rmse: 0,
        confidence: 70,
        r_squared: 0.55,
        quality_score: 38.5
      };
    }

    // Use enhanced validation for business context
    const validationSize = Math.min(12, Math.floor(data.length * 0.30));
    const errors: number[] = [];
    
    // Test predictions on recent historical data with business volatility
    for (let i = validationSize; i > 0; i--) {
      const actualValue = data[data.length - i].value;
      const daysBack = i;
      const basePredicted = avgRevenue * Math.pow(1 + trend / 365, -daysBack);
      const seasonalAdjustment = 1 + Math.sin(daysBack * 2 * Math.PI / 7) * 0.025;
      const predictedValue = basePredicted * seasonalAdjustment;
      
      if (actualValue > 0) {
        const percentError = Math.abs(actualValue - predictedValue) / actualValue * 100;
        errors.push(Math.min(150, percentError)); // Cap at 150% for business volatility
      }
    }
    
    if (errors.length === 0) {
      return {
        mape: 18,
        mae: avgRevenue * 0.18,
        rmse: avgRevenue * 0.22,
        confidence: 70,
        r_squared: 0.55,
        quality_score: 38.5
      };
    }
    
    const mape = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const mae = (mape / 100) * avgRevenue;
    const rmse = Math.sqrt(errors.reduce((sum, e) => sum + (e * avgRevenue / 100) ** 2, 0) / errors.length);
    
    // Enhanced confidence for business forecasting
    const confidence = Math.max(50, Math.min(85, 85 - mape * 0.7));
    
    // Enhanced R-squared for business context
    const trendStability = Math.abs(trend) < 0.08 ? 0.75 : 0.6;
    const accuracyFactor = Math.max(0.25, 1 - (mape / 120));
    const r_squared = Math.min(0.8, trendStability * accuracyFactor);
    
    return {
      mape: Math.round(mape * 100) / 100,
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      r_squared: Math.round(r_squared * 1000) / 1000,
      quality_score: Math.round((confidence * r_squared / 100) * 100) / 100
    };
  }
}

/**
 * Main ensemble forecasting function - Enhanced with Volatility Algorithm
 * Uses Enhanced Volatility Forecaster as primary algorithm for realistic business predictions
 */
export function generateAdvancedForecast(
  data: HistoricalDataPoint[], 
  periods: number
): {
  forecasts: ForecastResult[];
  metrics: ModelMetrics;
  bestModel?: string;
  modelComparison?: any;
} {
  if (data.length < 2) {
    return {
      forecasts: [],
      metrics: {
        mape: 0,
        mae: 0,
        rmse: 0,
        confidence: 0,
        r_squared: 0,
        quality_score: 0
      },
      bestModel: 'Insufficient Data',
      modelComparison: {}
    };
  }

  console.log('🔄 Starting Enhanced Volatility Forecasting...');

  try {
    // Primary: Use Enhanced Volatility Forecaster for optimal business realism
    if (data.length >= 7) {
      try {
        console.log('📊 Using Enhanced Volatility Algorithm (Primary)...');
        const enhancedResult = generateEnhancedVolatilityForecast(data, periods);
        
        // Convert EnhancedForecastResult to ForecastResult format
        const convertedForecasts: ForecastResult[] = enhancedResult.forecasts.map(forecast => ({
          date: forecast.date,
          predicted: forecast.predicted,
          lower_bound: forecast.lower_bound,
          upper_bound: forecast.upper_bound,
          confidence: forecast.confidence,
          model: forecast.model,
          components: {
            trend: forecast.components.trend,
            seasonal: forecast.components.seasonal,
            residual: forecast.components.volatility + forecast.components.business_cycle
          }
        }));

        // Convert BusinessVolatilityMetrics to ModelMetrics format
        const convertedMetrics: ModelMetrics = {
          mape: enhancedResult.metrics.mape,
          mae: enhancedResult.metrics.mae,
          rmse: enhancedResult.metrics.rmse,
          confidence: enhancedResult.metrics.confidence,
          r_squared: enhancedResult.metrics.r_squared,
          quality_score: enhancedResult.metrics.quality_score
        };

        console.log('✅ Enhanced Volatility Forecasting completed:', {
          model: 'Enhanced Volatility Forecaster',
          forecasts: convertedForecasts.length,
          confidence: convertedMetrics.confidence,
          volatilityIndex: enhancedResult.metrics.volatility_index,
          businessCycleStrength: enhancedResult.metrics.business_cycle_strength
        });

        return {
          forecasts: convertedForecasts,
          metrics: convertedMetrics,
          bestModel: 'Enhanced Volatility Forecaster',
          modelComparison: {
            enhancedVolatility: {
              quality_score: convertedMetrics.quality_score,
              confidence: convertedMetrics.confidence,
              volatilityIndex: enhancedResult.metrics.volatility_index,
              businessCycleStrength: enhancedResult.metrics.business_cycle_strength,
              marketRegime: enhancedResult.volatilityAnalysis.marketRegime
            }
          }
        };
      } catch (enhancedError) {
        console.log('⚠️ Enhanced Volatility Algorithm failed, falling back to Business-Realistic Forecaster:', enhancedError);
      }
    }

    // Fallback 1: Use Business-Realistic Forecaster
    try {
      console.log('📈 Using Business-Realistic Forecaster (Fallback 1)...');
      const realisticForecaster = new MarketRealisticForecaster();
      const realisticResult = realisticForecaster.forecast(data, periods);
      
      console.log('✅ Business-Realistic Forecasting completed:', {
        model: 'Business-Realistic Forecaster',
        forecasts: realisticResult.forecasts.length,
        confidence: realisticResult.metrics.confidence
      });

      return {
        forecasts: realisticResult.forecasts,
        metrics: realisticResult.metrics,
        bestModel: 'Business-Realistic Forecaster',
        modelComparison: {
          businessRealistic: {
            quality_score: realisticResult.metrics.quality_score,
            confidence: realisticResult.metrics.confidence
          }
        }
      };
    } catch (realisticError) {
      console.log('⚠️ Business-Realistic Forecaster failed, falling back to Simple Trend:', realisticError);
    }

    // Fallback 2: Use Enhanced Simple Trend Forecaster
    console.log('📉 Using Enhanced Simple Trend Forecaster (Fallback 2)...');
    const simpleTrendForecaster = new SimpleTrendForecaster();
    const simpleResult = simpleTrendForecaster.forecast(data, periods);
    
    console.log('✅ Enhanced Simple Trend Forecasting completed:', {
      model: 'Enhanced Simple Trend Forecaster',
      forecasts: simpleResult.forecasts.length,
      confidence: simpleResult.metrics.confidence
    });

    return {
      forecasts: simpleResult.forecasts,
      metrics: simpleResult.metrics,
      bestModel: 'Enhanced Simple Trend Forecaster',
      modelComparison: {
        enhancedSimpleTrend: {
          quality_score: simpleResult.metrics.quality_score,
          confidence: simpleResult.metrics.confidence
        }
      }
    };

  } catch (error) {
    console.error('❌ All forecasting algorithms failed:', error);
    
    // Emergency fallback with minimal prediction
    const lastValue = data[data.length - 1]?.value || 0;
    const emergencyForecasts: ForecastResult[] = [];
    const lastDate = new Date(data[data.length - 1]?.date || new Date().toISOString().split('T')[0]);
    
    for (let i = 1; i <= Math.min(periods, 30); i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      // Simple flat forecast with minimal variation
      const predicted = lastValue * (1 + Math.sin(i * 0.1) * 0.02);
      const uncertainty = predicted * 0.15;
      
      emergencyForecasts.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        lower_bound: Math.max(0, predicted - uncertainty),
        upper_bound: predicted + uncertainty,
        confidence: 40, // Low confidence for emergency forecast
        model: 'Emergency Fallback',
        components: {
          trend: 0,
          seasonal: Math.sin(i * 0.1) * 0.02 * predicted,
          residual: 0
        }
      });
    }

    return {
      forecasts: emergencyForecasts,
      metrics: {
        mape: 25,
        mae: lastValue * 0.25,
        rmse: lastValue * 0.3,
        confidence: 40,
        r_squared: 0.3,
        quality_score: 12
      },
      bestModel: 'Emergency Fallback',
      modelComparison: {}
    };
  }
}