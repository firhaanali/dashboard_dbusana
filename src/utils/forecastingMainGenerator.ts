/**
 * Main Advanced Forecast Generator - Enhanced Ensemble Method with Realistic Predictions
 * Fixed version untuk mengatasi error models.sort is not a function
 * Now includes Realistic Natural Forecaster for natural fluctuations
 */

import { MarketRealisticForecaster, SimpleTrendForecaster, type HistoricalDataPoint, type ForecastResult, type ModelMetrics } from './advancedForecastingAlgorithms';
import { generateRealisticForecast, type RealisticForecastResult, type RealisticMetrics } from './realisticForecastingEngine';

// Interface untuk forecaster configuration
interface ForecasterConfig {
  name: string;
  instance: any;
  minDataRequired: number;
  isRealistic: boolean;
}

/**
 * Main Advanced Forecast Generator
 * Menggunakan multiple algorithms untuk generate forecast yang stabil dan realistis
 * Prioritas pada Realistic Natural Forecaster untuk fluktuasi natural
 */
export function generateAdvancedForecast(
  data: HistoricalDataPoint[], 
  periods: number
): {
  forecasts: ForecastResult[];
  metrics: ModelMetrics | null;
  bestModel: string;
  modelComparison?: any[];
  chartData: any[];
} {
  if (data.length < 2) {
    console.warn('⚠️ Insufficient data for forecasting');
    return {
      forecasts: [],
      metrics: null,
      bestModel: 'None',
      modelComparison: [],
      chartData: []
    };
  }

  try {
    // Initialize forecasters dengan Realistic Natural Forecaster sebagai prioritas
    const forecasters = [
      { 
        name: 'Realistic Natural Forecaster', 
        instance: null, // Will use generateRealisticForecast function
        minDataRequired: 7,
        isRealistic: true
      },
      { 
        name: 'Enhanced Volatility Forecaster', 
        instance: new MarketRealisticForecaster(),
        minDataRequired: 7,
        isRealistic: false
      },
      { 
        name: 'Enhanced Simple Trend Forecaster', 
        instance: new SimpleTrendForecaster(),
        minDataRequired: 2,
        isRealistic: false
      }
    ];

    let bestResult = null;
    let bestScore = -1;
    let bestModel = 'Simple Trend';
    const modelResults: any[] = [];

    // Try each forecasting algorithm
    for (const forecaster of forecasters) {
      if (data.length >= forecaster.minDataRequired) {
        try {
          let result;
          
          if (forecaster.isRealistic) {
            // Use realistic forecasting engine
            const realisticResult = generateRealisticForecast(data, periods);
            
            // Convert realistic format to standard format
            result = {
              forecasts: realisticResult.forecasts.map(f => ({
                date: f.date,
                predicted: f.predicted,
                lower_bound: f.lower_bound,
                upper_bound: f.upper_bound,
                confidence: f.confidence,
                model: f.model,
                components: {
                  trend: f.components.trend,
                  seasonal: f.components.seasonal,
                  residual: f.components.volatility + f.components.noise
                }
              })),
              metrics: {
                mape: realisticResult.metrics.mape,
                mae: realisticResult.metrics.mae,
                rmse: realisticResult.metrics.rmse,
                confidence: realisticResult.metrics.confidence,
                r_squared: realisticResult.metrics.r_squared,
                quality_score: realisticResult.metrics.quality_score
              }
            };
          } else {
            // Use traditional forecasting algorithms
            result = forecaster.instance!.forecast(data, periods);
          }
          
          // Calculate model score dengan enhanced scoring untuk realistic forecaster
          const baseScore = result.metrics ? (
            (result.metrics.confidence / 100) * 0.4 +
            (result.metrics.r_squared) * 0.3 +
            ((100 - Math.min(result.metrics.mape, 100)) / 100) * 0.3
          ) : 0.5;
          
          // Debug R2 Score calculation
          if (result.metrics && forecaster.isRealistic) {
            console.log(`📊 ${forecaster.name} R² Score Calculation:`, {
              r_squared: result.metrics.r_squared,
              confidence: result.metrics.confidence,
              mape: result.metrics.mape,
              mae: result.metrics.mae,
              rmse: result.metrics.rmse,
              quality_score: result.metrics.quality_score,
              baseScore: baseScore.toFixed(3),
              isValid: !isNaN(result.metrics.r_squared) && result.metrics.r_squared !== null && result.metrics.r_squared !== undefined
            });
          }

          // Bonus untuk realistic forecaster karena natural fluctuations
          const score = forecaster.isRealistic ? baseScore * 1.15 : baseScore;

          modelResults.push({
            name: forecaster.name,
            score: score,
            metrics: result.metrics,
            error: null
          });

          if (score > bestScore) {
            bestScore = score;
            bestResult = result;
            bestModel = forecaster.name;
          }
          
        } catch (error) {
          console.warn(`⚠️ ${forecaster.name} failed:`, error);
          modelResults.push({
            name: forecaster.name,
            score: 0,
            metrics: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Fallback to simple forecaster if no advanced models work
    if (!bestResult && data.length >= 2) {
      try {
        const simpleForecast = new SimpleTrendForecaster().forecast(data, periods);
        bestResult = simpleForecast;
        bestModel = 'Enhanced Simple Trend Forecaster';
        
        modelResults.push({
          name: 'Enhanced Simple Trend Forecaster (Fallback)',
          score: 0.5,
          metrics: simpleForecast.metrics,
          error: null
        });
      } catch (error) {
        console.error('❌ All forecasting methods failed:', error);
        return {
          forecasts: [],
          metrics: null,
          bestModel: 'None',
          modelComparison: [],
          chartData: []
        };
      }
    }

    if (!bestResult) {
      return {
        forecasts: [],
        metrics: null,
        bestModel: 'None', 
        modelComparison: [],
        chartData: []
      };
    }

    console.log(`✅ Best forecasting model: ${bestModel} (score: ${bestScore.toFixed(3)})`);

    return {
      forecasts: bestResult.forecasts,
      metrics: bestResult.metrics,
      bestModel: bestModel,
      modelComparison: modelResults, // Ini sudah array yang valid
      chartData: []
    };

  } catch (error) {
    console.error('❌ Advanced forecasting failed:', error);
    return {
      forecasts: [],
      metrics: null,
      bestModel: 'Error',
      modelComparison: [],
      chartData: []
    };
  }
}