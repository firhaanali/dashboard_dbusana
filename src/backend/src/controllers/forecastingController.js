const { PrismaClient } = require('@prisma/client');

// Simple global Prisma instance with error handling
let prismaClient = null;

// Initialize Prisma function with better error handling
const getPrismaClient = async () => {
  if (!prismaClient) {
    try {
      prismaClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        errorFormat: 'minimal'
      });
      
      // Test connection
      await prismaClient.$connect();
      console.log('✅ Prisma client connected for forecasting controller');
      return prismaClient;
    } catch (error) {
      console.error('❌ Failed to initialize Prisma client:', error);
      prismaClient = null;
      throw error;
    }
  }
  return prismaClient;
};

// Utility functions for forecasting calculations
const calculateMovingAverage = (data, windowSize) => {
  if (data.length < windowSize) return data[data.length - 1] || 0;
  const recentData = data.slice(-windowSize);
  return recentData.reduce((sum, val) => sum + val, 0) / windowSize;
};

const calculateExponentialSmoothing = (data, alpha = 0.3) => {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0];
  
  let smoothed = data[0];
  for (let i = 1; i < data.length; i++) {
    smoothed = alpha * data[i] + (1 - alpha) * smoothed;
  }
  return smoothed;
};

const calculateLinearRegression = (data) => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.y || 0, r2: 0 };
  
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);
  const sumYY = data.reduce((sum, point) => sum + point.y * point.y, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, point) => sum + Math.pow(point.y - yMean, 2), 0);
  const ssResidual = data.reduce((sum, point) => sum + Math.pow(point.y - (slope * point.x + intercept), 2), 0);
  const r2 = 1 - (ssResidual / ssTotal);
  
  return { slope, intercept, r2: isNaN(r2) ? 0 : r2 };
};

const calculateMAPE = (actual, predicted) => {
  if (actual.length !== predicted.length || actual.length === 0) return 100;
  
  const mape = actual.reduce((sum, actualVal, index) => {
    if (actualVal === 0) return sum;
    return sum + Math.abs((actualVal - predicted[index]) / actualVal);
  }, 0) / actual.length;
  
  return mape * 100;
};

const calculateRMSE = (actual, predicted) => {
  if (actual.length !== predicted.length || actual.length === 0) return 0;
  
  const mse = actual.reduce((sum, actualVal, index) => {
    return sum + Math.pow(actualVal - predicted[index], 2);
  }, 0) / actual.length;
  
  return Math.sqrt(mse);
};

// Controllers

// Get forecasting data with various models
const getForecastData = async (req, res) => {
  try {
    const { 
      forecast_horizon = '90d',
      forecast_metric = 'revenue',
      granularity = 'daily',
      historical_period = '365d',
      confidence_level = 95
    } = req.query;

    console.log('📈 Generating forecast with parameters:', {
      forecast_horizon,
      forecast_metric,
      granularity,
      historical_period,
      confidence_level
    });

    // Calculate forecast horizon only - historical data will use ALL available data
    const forecastDays = forecast_horizon === '30d' ? 30 : 
                        forecast_horizon === '90d' ? 90 : 
                        forecast_horizon === '180d' ? 180 : 365;

    // Use ALL available historical data instead of limiting by period
    // This ensures maximum data utilization for better forecasting accuracy
    let startDate = null; // null = no date filter = get all data

    // Get Prisma client
    let currentPrisma;
    try {
      currentPrisma = await getPrismaClient();
    } catch (initError) {
      console.error('❌ Prisma client initialization failed:', initError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Unable to connect to database'
      });
    }

    // Fetch ALL available historical sales data for maximum forecasting accuracy
    let salesData;
    try {
      console.log('📊 Querying ALL available sales data from database (no date limit)...');
      salesData = await currentPrisma.salesData.findMany({
        // No where clause = get ALL data available
        orderBy: {
          created_time: 'asc'
        },
        select: {
          id: true,
          created_time: true,
          total_revenue: true,
          quantity: true,
          product_name: true,
          marketplace: true
        }
      });

      console.log(`📊 Found ${salesData.length} sales records for forecasting (ALL available data)`);
    } catch (queryError) {
      console.error('❌ Database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    if (salesData.length < 7) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data for forecasting. Need at least 7 data points.'
      });
    }

    // Group data by granularity
    const groupedData = groupDataByGranularity(salesData, granularity);
    
    // Generate forecasts using multiple models
    const forecastResults = generateForecasts(
      groupedData,
      forecast_metric,
      forecastDays,
      confidence_level,
      granularity
    );

    // Calculate model accuracy
    const accuracy = calculateModelAccuracy(groupedData, forecast_metric);

    res.json({
      success: true,
      data: {
        historical_data: groupedData,
        forecast_data: forecastResults.forecasts,
        model_accuracy: accuracy,
        models: forecastResults.models,
        parameters: {
          forecast_horizon,
          forecast_metric,
          granularity,
          historical_period,
          confidence_level: parseFloat(confidence_level)
        },
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating forecast:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Cannot reach database server'
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Database constraint error',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast',
      details: error.message
    });
  }
};

// Get product-specific forecasting
const getProductForecasts = async (req, res) => {
  try {
    const { top_products = 10, forecast_days = 30 } = req.query;

    console.log('🎯 Generating product-specific forecasts');

    // Get Prisma client
    let currentPrisma;
    try {
      currentPrisma = await getPrismaClient();
    } catch (initError) {
      console.error('❌ Prisma client initialization failed for products:', initError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Unable to connect to database'
      });
    }

    // Get sales data for product analysis with error handling
    let salesData;
    try {
      console.log('📦 Querying ALL product sales data from database (no date limit)...');
      salesData = await currentPrisma.salesData.findMany({
        // No where clause to get ALL available data for better product analysis
        orderBy: {
          created_time: 'asc'
        },
        select: {
          id: true,
          created_time: true,
          product_name: true,
          total_revenue: true,
          quantity: true
        }
      });
      console.log(`📦 Found ${salesData.length} sales records for product forecasting (ALL available data)`);
    } catch (queryError) {
      console.error('❌ Product forecast database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    // Group by product
    const productGroups = salesData.reduce((acc, sale) => {
      const productName = sale.product_name || 'Unknown Product';
      if (!acc[productName]) {
        acc[productName] = [];
      }
      acc[productName].push(sale);
      return acc;
    }, {});

    // Generate forecasts for each product
    const productForecasts = Object.entries(productGroups)
      .map(([productName, sales]) => {
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0);
        const totalQuantity = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
        
        const dailyAvgs = calculateDailyAverages(sales);
        const trend = calculateTrend(dailyAvgs);
        
        return {
          product_name: productName,
          total_revenue: totalRevenue,
          total_quantity: totalQuantity,
          sales_count: sales.length,
          daily_avg_revenue: dailyAvgs.revenue,
          daily_avg_quantity: dailyAvgs.quantity,
          trend: trend.direction,
          trend_strength: trend.strength,
          forecast_30d: dailyAvgs.revenue * forecast_days,
          forecast_90d: dailyAvgs.revenue * 90,
          confidence_score: Math.min(95, Math.max(50, sales.length * 2)),
          recommended_action: getRecommendedAction(trend, dailyAvgs.revenue),
          risk_level: getRiskLevel(trend, sales.length)
        };
      })
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, parseInt(top_products));

    res.json({
      success: true,
      data: productForecasts,
      parameters: {
        top_products: parseInt(top_products),
        forecast_days: parseInt(forecast_days)
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating product forecasts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate product forecasts',
      details: error.message
    });
  }
};

// Get market insights and trends
const getMarketInsights = async (req, res) => {
  try {
    // Get Prisma client
    let currentPrisma;
    try {
      currentPrisma = await getPrismaClient();
    } catch (initError) {
      console.error('❌ Prisma client initialization failed for insights:', initError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Unable to connect to database'
      });
    }

    console.log('💡 Generating market insights using ALL available sales data...');

    const salesData = await currentPrisma.salesData.findMany({
      // No date filter to get ALL available data for comprehensive insights
      orderBy: {
        created_time: 'asc'
      }
    });

    if (salesData.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No recent sales data available for insights'
      });
    }

    const insights = [];

    // Calculate growth trends
    const recentSales = salesData.filter(s => 
      new Date(s.created_time) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const previousSales = salesData.filter(s => {
      const date = new Date(s.created_time);
      return date >= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) && 
             date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    });

    const recentRevenue = recentSales.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
    const previousRevenue = previousSales.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
    
    if (previousRevenue > 0) {
      const growthRate = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
      
      if (Math.abs(growthRate) > 15) {
        insights.push({
          type: growthRate > 0 ? 'opportunity' : 'risk',
          title: growthRate > 0 ? 'Strong Growth Detected' : 'Revenue Decline Alert',
          description: `Revenue has ${growthRate > 0 ? 'increased' : 'decreased'} by ${Math.abs(growthRate).toFixed(1)}% in the last 30 days`,
          impact: 'high',
          confidence: 85,
          recommendation: growthRate > 0 ? 
            'Consider scaling up operations and marketing efforts' :
            'Review pricing strategy and customer satisfaction',
          timeframe: 'Next 30-60 days',
          data: {
            growth_rate: growthRate,
            recent_revenue: recentRevenue,
            previous_revenue: previousRevenue
          }
        });
      }
    }

    // Seasonal patterns
    const seasonalInsights = analyzeSeasonalPatterns(salesData);
    insights.push(...seasonalInsights);

    // Top performing products insights
    const productInsights = analyzeTopProducts(salesData);
    insights.push(...productInsights);

    res.json({
      success: true,
      data: insights,
      analysis_period: {
        start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString(),
        data_points: salesData.length
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating market insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate market insights',
      details: error.message
    });
  }
};

// Helper functions

function groupDataByGranularity(salesData, granularity) {
  const grouped = new Map();

  salesData.forEach(sale => {
    const saleDate = new Date(sale.created_time);
    let dateKey = '';

    switch (granularity) {
      case 'daily':
        dateKey = saleDate.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(saleDate);
        weekStart.setDate(saleDate.getDate() - saleDate.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        dateKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        date: dateKey,
        revenue: 0,
        orders: 0,
        quantity: 0
      });
    }

    const existing = grouped.get(dateKey);
    existing.revenue += sale.total_revenue || 0;
    existing.orders += 1;
    existing.quantity += sale.quantity || 1;
  });

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function generateForecasts(historicalData, metric, forecastDays, confidenceLevel, granularity) {
  const values = historicalData.map(d => d[metric] || 0);
  const forecasts = [];
  
  // Linear regression
  const regression = calculateLinearRegression(
    historicalData.map((d, i) => ({ x: i, y: d[metric] || 0 }))
  );

  // Generate forecast points
  for (let i = 0; i < forecastDays; i++) {
    const futureIndex = historicalData.length + i;
    const futureDate = new Date();
    
    switch (granularity) {
      case 'daily':
        futureDate.setDate(futureDate.getDate() + i + 1);
        break;
      case 'weekly':
        futureDate.setDate(futureDate.getDate() + (i + 1) * 7);
        break;
      case 'monthly':
        futureDate.setMonth(futureDate.getMonth() + i + 1);
        break;
    }

    // Multiple model predictions
    const linearPrediction = regression.slope * futureIndex + regression.intercept;
    const maPrediction = calculateMovingAverage(values, Math.min(7, values.length));
    const esPrediction = calculateExponentialSmoothing(values);
    
    // Ensemble prediction
    const prediction = (linearPrediction * 0.4 + maPrediction * 0.3 + esPrediction * 0.3);
    
    // Confidence bounds
    const variance = values.length > 1 ? 
      values.reduce((sum, val) => sum + Math.pow(val - (values.reduce((s, v) => s + v, 0) / values.length), 2), 0) / values.length : 0;
    const stdDev = Math.sqrt(variance);
    const confidenceMultiplier = confidenceLevel === 95 ? 1.96 : confidenceLevel === 90 ? 1.65 : 2.58;
    const marginOfError = stdDev * confidenceMultiplier * Math.sqrt(1 + i * 0.1);

    forecasts.push({
      date: futureDate.toISOString().split('T')[0],
      predicted: Math.max(0, prediction),
      lower_bound: Math.max(0, prediction - marginOfError),
      upper_bound: prediction + marginOfError,
      confidence: Math.max(50, confidenceLevel - i * 0.5),
      model: 'ensemble'
    });
  }

  return {
    forecasts,
    models: [
      {
        name: 'Ensemble',
        accuracy: regression.r2 * 100,
        description: 'Combined linear regression, moving average, and exponential smoothing'
      }
    ]
  };
}

function calculateModelAccuracy(historicalData, metric) {
  if (historicalData.length < 14) return null;

  const testSize = Math.floor(historicalData.length * 0.3);
  const trainData = historicalData.slice(0, -testSize);
  const testData = historicalData.slice(-testSize);

  const actualValues = testData.map(d => d[metric] || 0);
  const trainValues = trainData.map(d => d[metric] || 0);

  // Simple prediction using exponential smoothing
  const predictions = testData.map((_, index) => {
    return calculateExponentialSmoothing([...trainValues, ...actualValues.slice(0, index)]);
  });

  const mape = calculateMAPE(actualValues, predictions);
  const rmse = calculateRMSE(actualValues, predictions);
  const accuracy = Math.max(0, 100 - mape);

  return { mape, rmse, accuracy };
}

function calculateDailyAverages(sales) {
  const dayCount = Math.max(1, new Set(sales.map(s => 
    new Date(s.created_time).toISOString().split('T')[0]
  )).size);
  
  return {
    revenue: sales.reduce((sum, s) => sum + (s.total_revenue || 0), 0) / dayCount,
    quantity: sales.reduce((sum, s) => sum + (s.quantity || 0), 0) / dayCount
  };
}

function calculateTrend(dailyAvgs) {
  // Simplified trend calculation
  const recentAvg = dailyAvgs.revenue;
  const overallAvg = recentAvg; // Could be improved with more historical comparison
  
  if (recentAvg > overallAvg * 1.1) {
    return { direction: 'increasing', strength: 'strong' };
  } else if (recentAvg < overallAvg * 0.9) {
    return { direction: 'decreasing', strength: 'strong' };
  } else {
    return { direction: 'stable', strength: 'moderate' };
  }
}

function getRecommendedAction(trend, dailyRevenue) {
  if (trend.direction === 'increasing' && dailyRevenue > 100000) {
    return 'increase_stock';
  } else if (trend.direction === 'decreasing' && dailyRevenue < 50000) {
    return 'reduce_stock';
  } else {
    return 'maintain';
  }
}

function getRiskLevel(trend, salesCount) {
  if (salesCount > 30 && trend.direction === 'increasing') return 'low';
  if (salesCount < 10 || trend.direction === 'decreasing') return 'high';
  return 'medium';
}

function analyzeSeasonalPatterns(salesData) {
  // Simplified seasonal analysis
  const insights = [];
  
  const dayOfWeekSales = salesData.reduce((acc, sale) => {
    const dayOfWeek = new Date(sale.created_time).getDay();
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + (sale.total_revenue || 0);
    return acc;
  }, {});

  const bestDay = Object.entries(dayOfWeekSales)
    .sort(([,a], [,b]) => b - a)[0];
    
  if (bestDay) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    insights.push({
      type: 'trend',
      title: 'Weekly Pattern Detected',
      description: `${dayNames[bestDay[0]]} shows highest sales performance`,
      impact: 'medium',
      confidence: 70,
      recommendation: `Focus marketing efforts and inventory preparation for ${dayNames[bestDay[0]]}`,
      timeframe: 'Weekly recurring',
      data: { best_day: dayNames[bestDay[0]], revenue: bestDay[1] }
    });
  }

  return insights;
}

function analyzeTopProducts(salesData) {
  const insights = [];
  
  const productSales = salesData.reduce((acc, sale) => {
    const product = sale.product_name || 'Unknown';
    acc[product] = (acc[product] || 0) + (sale.total_revenue || 0);
    return acc;
  }, {});

  const topProduct = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)[0];
    
  if (topProduct && Object.keys(productSales).length > 1) {
    const totalRevenue = Object.values(productSales).reduce((sum, rev) => sum + rev, 0);
    const percentage = (topProduct[1] / totalRevenue) * 100;
    
    if (percentage > 30) {
      insights.push({
        type: percentage > 50 ? 'risk' : 'trend',
        title: percentage > 50 ? 'High Product Concentration Risk' : 'Top Product Dominance',
        description: `${topProduct[0]} accounts for ${percentage.toFixed(1)}% of total revenue`,
        impact: percentage > 50 ? 'high' : 'medium',
        confidence: 80,
        recommendation: percentage > 50 ? 
          'Consider diversifying product portfolio to reduce dependency' :
          'Leverage success of top product for expansion opportunities',
        timeframe: 'Strategic planning',
        data: { 
          product: topProduct[0], 
          revenue: topProduct[1], 
          percentage: percentage 
        }
      });
    }
  }

  return insights;
}

module.exports = {
  getForecastData,
  getProductForecasts,
  getMarketInsights,
  getPrismaClient
};