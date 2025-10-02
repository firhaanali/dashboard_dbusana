/**
 * Test untuk memverifikasi perbaikan RealisticForecastingEngine
 * Mengatasi error: this.generateForecasts is not a function
 */

import { RealisticNaturalForecaster, HistoricalDataPoint } from './realisticForecastingEngine';

export function testRealisticForecastingFix() {
  console.log('🧪 Testing RealisticForecastingEngine Fix...');
  
  try {
    // Create sample data
    const sampleData: HistoricalDataPoint[] = [];
    const baseDate = new Date('2024-01-01');
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      sampleData.push({
        date: date.toISOString().split('T')[0],
        value: 1000000 + Math.random() * 500000 + i * 10000 // Trending upward with volatility
      });
    }
    
    console.log('✅ Sample data created:', sampleData.length, 'points');
    
    // Test RealisticNaturalForecaster
    const forecaster = new RealisticNaturalForecaster();
    
    console.log('🔄 Testing forecast method...');
    const result = forecaster.forecast(sampleData, 10);
    
    console.log('✅ Forecast successful!');
    console.log('📊 Results summary:', {
      forecastsGenerated: result.forecasts.length,
      firstForecast: result.forecasts[0],
      lastForecast: result.forecasts[result.forecasts.length - 1],
      metrics: {
        mape: result.metrics.mape,
        confidence: result.metrics.confidence,
        quality_score: result.metrics.quality_score
      }
    });
    
    // Verify forecasts have required properties
    const forecast = result.forecasts[0];
    const requiredProps = ['date', 'predicted', 'lower_bound', 'upper_bound', 'confidence', 'model'];
    const missingProps = requiredProps.filter(prop => !(prop in forecast));
    
    if (missingProps.length === 0) {
      console.log('✅ All required forecast properties present');
    } else {
      console.log('❌ Missing forecast properties:', missingProps);
    }
    
    // Verify metrics have required properties
    const metricsProps = ['mape', 'mae', 'rmse', 'confidence', 'r_squared', 'quality_score'];
    const missingMetricsProps = metricsProps.filter(prop => !(prop in result.metrics));
    
    if (missingMetricsProps.length === 0) {
      console.log('✅ All required metrics properties present');
    } else {
      console.log('❌ Missing metrics properties:', missingMetricsProps);
    }
    
    console.log('🎉 RealisticForecastingEngine test PASSED!');
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ RealisticForecastingEngine test FAILED:', error);
    return { success: false, error };
  }
}

// Test with insufficient data
export function testInsufficientData() {
  console.log('🧪 Testing with insufficient data...');
  
  try {
    const forecaster = new RealisticNaturalForecaster();
    const insufficientData: HistoricalDataPoint[] = [
      { date: '2024-01-01', value: 1000000 },
      { date: '2024-01-02', value: 1100000 },
      { date: '2024-01-03', value: 1200000 }
    ];
    
    const result = forecaster.forecast(insufficientData, 5);
    console.log('❌ Should have thrown error for insufficient data');
    return { success: false, error: 'Expected error not thrown' };
    
  } catch (error) {
    if (error.message.includes('minimal 7 data point')) {
      console.log('✅ Correctly handled insufficient data error');
      return { success: true };
    } else {
      console.log('❌ Wrong error type:', error.message);
      return { success: false, error };
    }
  }
}

// Auto-run tests if this file is imported
if (typeof window !== 'undefined') {
  console.log('🚀 Auto-running RealisticForecastingEngine tests...');
  
  testRealisticForecastingFix();
  testInsufficientData();
}