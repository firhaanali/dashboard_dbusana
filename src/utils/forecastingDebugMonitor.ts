/**
 * Forecasting Debug Monitor - Enhanced Stability Tracking
 * ======================================================= 
 * Monitoring system untuk memastikan forecasting algorithm berjalan dengan stabil
 * dan memberikan hasil yang realistis untuk business planning
 */

export interface ForecastingDebugData {
  algorithmUsed: string;
  dataPoints: number;
  historicalRange: string;
  trendAnalysis: {
    recentAverage: number;
    olderAverage: number;
    calculatedTrend: number;
    constrainedTrend: number;
  };
  stabilityMetrics: {
    maxDailyChange: number;
    averageChange: number;
    volatilityLevel: string;
  };
  forecastQuality: {
    confidence: number;
    continuity: string;
    businessViability: string;
  };
}

/**
 * Enhanced Forecasting Debug Logger
 */
export class ForecastingDebugMonitor {
  
  /**
   * Log forecasting algorithm performance and stability
   */
  static logForecastingPerformance(
    algorithmName: string,
    historicalData: any[],
    forecastResults: any[],
    metrics: any
  ): ForecastingDebugData {
    
    const debugData: ForecastingDebugData = {
      algorithmUsed: algorithmName,
      dataPoints: historicalData.length,
      historicalRange: this.calculateDateRange(historicalData),
      trendAnalysis: this.analyzeTrendStability(historicalData),
      stabilityMetrics: this.calculateStabilityMetrics(forecastResults),
      forecastQuality: this.assessForecastQuality(historicalData, forecastResults, metrics)
    };

    // Enhanced console logging for development
    console.log('🔮 Forecasting Algorithm Debug Report:', {
      algorithm: algorithmName,
      status: this.getOverallStatus(debugData),
      dataQuality: this.assessDataQuality(historicalData),
      forecastContinuity: debugData.forecastQuality.continuity,
      businessViability: debugData.forecastQuality.businessViability,
      details: debugData
    });

    return debugData;
  }

  /**
   * Calculate historical data date range
   */
  private static calculateDateRange(data: any[]): string {
    if (data.length === 0) return 'No data';
    
    const dates = data.map(d => d.date).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    return `${startDate} to ${endDate} (${data.length} days)`;
  }

  /**
   * Analyze trend stability and calculation process
   */
  private static analyzeTrendStability(data: any[]): any {
    if (data.length < 30) {
      return {
        recentAverage: 0,
        olderAverage: 0,
        calculatedTrend: 0,
        constrainedTrend: 0
      };
    }

    const values = data.map(d => d.value || 0);
    const recent30 = values.slice(-Math.min(30, values.length));
    const recent60 = values.slice(-Math.min(60, values.length), -Math.min(30, values.length));
    
    const recentAvg = recent30.reduce((sum, v) => sum + v, 0) / recent30.length;
    const olderAvg = recent60.length > 0 ? recent60.reduce((sum, v) => sum + v, 0) / recent60.length : recentAvg;
    
    const periodChange = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
    const annualTrend = periodChange * (365 / Math.max(recent30.length, 30));
    const constrainedTrend = Math.max(-0.1, Math.min(0.15, annualTrend));

    return {
      recentAverage: Math.round(recentAvg),
      olderAverage: Math.round(olderAvg),
      calculatedTrend: Math.round(annualTrend * 1000) / 10, // In percentage
      constrainedTrend: Math.round(constrainedTrend * 1000) / 10 // In percentage
    };
  }

  /**
   * Calculate forecast stability metrics
   */
  private static calculateStabilityMetrics(forecasts: any[]): any {
    if (forecasts.length < 2) {
      return {
        maxDailyChange: 0,
        averageChange: 0,
        volatilityLevel: 'low'
      };
    }

    const changes: number[] = [];
    
    for (let i = 1; i < forecasts.length; i++) {
      const prevValue = forecasts[i - 1].predicted || 0;
      const currValue = forecasts[i].predicted || 0;
      
      if (prevValue > 0) {
        const changePercent = Math.abs((currValue - prevValue) / prevValue) * 100;
        changes.push(changePercent);
      }
    }

    const maxChange = changes.length > 0 ? Math.max(...changes) : 0;
    const avgChange = changes.length > 0 ? changes.reduce((sum, c) => sum + c, 0) / changes.length : 0;
    
    const volatilityLevel = 
      avgChange < 2 ? 'low' :
      avgChange < 5 ? 'moderate' :
      avgChange < 10 ? 'high' : 'extreme';

    return {
      maxDailyChange: Math.round(maxChange * 10) / 10,
      averageChange: Math.round(avgChange * 10) / 10,
      volatilityLevel
    };
  }

  /**
   * Assess overall forecast quality
   */
  private static assessForecastQuality(historical: any[], forecasts: any[], metrics: any): any {
    const lastHistoricalValue = historical[historical.length - 1]?.value || 0;
    const firstForecastValue = forecasts[0]?.predicted || 0;
    
    // Check continuity (should be smooth transition)
    const continuityGap = lastHistoricalValue > 0 ? 
      Math.abs((firstForecastValue - lastHistoricalValue) / lastHistoricalValue) * 100 : 0;
    
    const continuity = 
      continuityGap < 5 ? 'excellent' :
      continuityGap < 15 ? 'good' :
      continuityGap < 30 ? 'acceptable' : 'poor';

    // Assess business viability
    const avgForecast = forecasts.reduce((sum, f) => sum + (f.predicted || 0), 0) / forecasts.length;
    const businessViability = 
      avgForecast > lastHistoricalValue * 0.5 && avgForecast < lastHistoricalValue * 2 ? 'realistic' :
      avgForecast < lastHistoricalValue * 0.3 ? 'too-pessimistic' :
      avgForecast > lastHistoricalValue * 3 ? 'too-optimistic' : 'questionable';

    return {
      confidence: Math.round((metrics?.confidence || 0) * 10) / 10,
      continuity,
      businessViability
    };
  }

  /**
   * Get overall algorithm status
   */
  private static getOverallStatus(debugData: ForecastingDebugData): string {
    const hasGoodContinuity = ['excellent', 'good'].includes(debugData.forecastQuality.continuity);
    const hasRealisticViability = debugData.forecastQuality.businessViability === 'realistic';
    const hasLowVolatility = ['low', 'moderate'].includes(debugData.stabilityMetrics.volatilityLevel);
    
    if (hasGoodContinuity && hasRealisticViability && hasLowVolatility) {
      return '✅ EXCELLENT';
    } else if (hasGoodContinuity && hasRealisticViability) {
      return '✅ GOOD';
    } else if (hasGoodContinuity || hasRealisticViability) {
      return '⚠️ ACCEPTABLE';
    } else {
      return '❌ NEEDS_IMPROVEMENT';
    }
  }

  /**
   * Assess historical data quality
   */
  private static assessDataQuality(data: any[]): string {
    if (data.length < 7) return 'insufficient';
    if (data.length < 30) return 'limited';
    if (data.length < 90) return 'good';
    return 'excellent';
  }

  /**
   * Log forecast comparison between algorithms
   */
  static logAlgorithmComparison(models: any): void {
    // Ensure models is an array
    if (!models || !Array.isArray(models)) {
      console.log('🏆 Forecasting Algorithm Comparison:', {
        totalModels: 0,
        rankings: [],
        note: 'No valid model comparison data available'
      });
      return;
    }

    console.log('🏆 Forecasting Algorithm Comparison:', {
      totalModels: models.length,
      rankings: models
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((model, index) => ({
          rank: index + 1,
          algorithm: model.name || 'Unknown',
          score: Math.round((model.score || 0) * 100) / 100,
          confidence: Math.round((model.metrics?.confidence || 0) * 10) / 10,
          status: model.error ? '❌ FAILED' : '✅ SUCCESS'
        }))
    });
  }

  /**
   * Validate forecast results for business logic
   */
  static validateBusinessLogic(
    historical: any[], 
    forecasts: any[]
  ): { isValid: boolean; warnings: string[]; recommendations: string[] } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    if (forecasts.length === 0) {
      warnings.push('No forecast data generated');
      return { isValid: false, warnings, recommendations };
    }

    const lastHistorical = historical[historical.length - 1]?.value || 0;
    const firstForecast = forecasts[0]?.predicted || 0;
    const avgForecast = forecasts.reduce((sum, f) => sum + (f.predicted || 0), 0) / forecasts.length;

    // Check for dramatic changes
    if (lastHistorical > 0 && firstForecast < lastHistorical * 0.5) {
      warnings.push('Forecast drops dramatically from historical data');
      recommendations.push('Review trend calculation algorithm');
    }

    if (lastHistorical > 0 && firstForecast > lastHistorical * 2) {
      warnings.push('Forecast jumps dramatically from historical data');
      recommendations.push('Apply stability constraints');
    }

    // Check for negative trends in all forecasts
    const allNegative = forecasts.every(f => (f.predicted || 0) < lastHistorical * 0.9);
    if (allNegative) {
      warnings.push('All forecasts show declining trend');
      recommendations.push('Verify business environment assumptions');
    }

    // Check for unrealistic growth
    const lastForecast = forecasts[forecasts.length - 1]?.predicted || 0;
    if (lastForecast > lastHistorical * 5) {
      warnings.push('Long-term forecast shows unrealistic growth');
      recommendations.push('Apply growth rate constraints');
    }

    const isValid = warnings.length === 0;
    
    console.log('🔍 Business Logic Validation:', {
      isValid,
      warningCount: warnings.length,
      recommendationCount: recommendations.length,
      lastHistorical: Math.round(lastHistorical),
      firstForecast: Math.round(firstForecast),
      avgForecast: Math.round(avgForecast),
      details: { warnings, recommendations }
    });

    return { isValid, warnings, recommendations };
  }
}

export default ForecastingDebugMonitor;