import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Calendar,
  Zap,
  Eye,
  RefreshCcw,
  DollarSign
} from 'lucide-react';
import { formatDateSimple } from '../utils/dateUtils';

interface BusinessIntelligenceSummaryProps {
  forecastType: 'sales' | 'stock';
  forecastHorizon: '30d' | '90d' | '180d';
  forecastMetrics?: {
    mape: number;
    confidence: number;
    quality_score: number;
    r_squared: number;
  };
  bestModel?: string;
  lastUpdated?: Date;
  totalRevenue?: number;
  selectedProduct?: string;
}

export function BusinessIntelligenceSummary({
  forecastType,
  forecastHorizon,
  forecastMetrics,
  bestModel,
  lastUpdated,
  totalRevenue,
  selectedProduct
}: BusinessIntelligenceSummaryProps) {
  const horizonDays = forecastHorizon === '30d' ? 30 : forecastHorizon === '90d' ? 90 : 180;
  
  // Calculate insights based on metrics - show 0 values when no backend data
  const getAccuracyLevel = (mape: number) => {
    if (mape === 0) return { level: 'No Data', color: 'text-gray-500', bg: 'bg-gray-50' };
    if (mape <= 10) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (mape <= 20) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (mape <= 30) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
  };
  
  const getDataQualityLevel = (score: number) => {
    if (score === 0) return { level: 'No Data', color: 'text-gray-500' };
    if (score >= 95) return { level: 'Excellent', color: 'text-green-600' };
    if (score >= 85) return { level: 'Good', color: 'text-blue-600' };
    if (score >= 70) return { level: 'Fair', color: 'text-yellow-600' };
    return { level: 'Poor', color: 'text-red-600' };
  };

  // Use real metrics or fallback to 0 values (no mock data)
  const safeMetrics = forecastMetrics ? {
    mape: forecastMetrics.mape || 0,
    confidence: forecastMetrics.confidence || 0,
    quality_score: forecastMetrics.quality_score || 0,
    r_squared: forecastMetrics.r_squared || 0
  } : {
    mape: 0,
    confidence: 0,
    quality_score: 0,
    r_squared: 0
  };

  const accuracy = getAccuracyLevel(safeMetrics.mape);
  const dataQuality = getDataQualityLevel(safeMetrics.quality_score);

  // Generate recommendations based on metrics and forecast type
  const getRecommendations = () => {
    const recommendations = [];

    if (forecastType === 'sales') {
      if (safeMetrics.mape === 0) {
        recommendations.push({
          icon: RefreshCcw,
          text: 'Connect to backend database to enable AI model training and forecasting',
          priority: 'high'
        });
      } else if (safeMetrics.mape > 20) {
        recommendations.push({
          icon: RefreshCcw,
          text: 'Model retraining recommended - accuracy below optimal threshold',
          priority: 'high'
        });
      } else {
        recommendations.push({
          icon: RefreshCcw,
          text: 'Model retraining recommended every 2-3 weeks for optimal performance',
          priority: 'medium'
        });
      }

      if (safeMetrics.confidence > 0) {
        recommendations.push({
          icon: Eye,
          text: 'Monitor actual vs predicted results for model drift detection',
          priority: 'medium'
        });

        recommendations.push({
          icon: DollarSign,
          text: 'Consider external factors (marketing campaigns, seasonal trends, competition)',
          priority: 'low'
        });

        if (safeMetrics.confidence < 75) {
          recommendations.push({
            icon: AlertTriangle,
            text: 'Low confidence detected - review input data quality and historical patterns',
            priority: 'high'
          });
        }
      } else {
        recommendations.push({
          icon: Eye,
          text: 'Import historical sales data to train AI forecasting models',
          priority: 'medium'
        });
      }
    } else {
      recommendations.push({
        icon: Target,
        text: 'Review safety stock levels based on demand forecasts',
        priority: 'medium'
      });

      recommendations.push({
        icon: BarChart3,
        text: 'Monitor inventory turnover rates and adjust reorder points accordingly',
        priority: 'medium'
      });

      if (selectedProduct && selectedProduct !== 'all') {
        recommendations.push({
          icon: Eye,
          text: `Track ${selectedProduct} sales velocity for improved forecasting accuracy`,
          priority: 'low'
        });
      } else {
        recommendations.push({
          icon: Zap,
          text: 'Analyze individual product performance for better inventory optimization',
          priority: 'low'
        });
      }
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case 'medium': return <Target className="w-3 h-3 text-yellow-500" />;
      default: return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          💼 Business Intelligence Summary
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
            AI-Powered Insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Insights Section */}
        <div>
          <h4 className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            📈 Key Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span>• Forecast horizon: <strong>{horizonDays} days</strong></span>
            </div>
            
            {/* Always show metrics with real data or 0 values */}
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-gray-500" />
              <span>• Expected accuracy: <strong className={accuracy?.color}>±{safeMetrics.mape.toFixed(1)}% MAPE</strong></span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-gray-500" />
              <span>• Data quality: <strong className={dataQuality?.color}>{safeMetrics.quality_score.toFixed(1)}% {dataQuality?.level}</strong></span>
            </div>
            
            <div className="flex items-center gap-2">
              <Brain className="w-3 h-3 text-gray-500" />
              <span>• Model confidence: <strong className={safeMetrics.confidence > 0 ? "text-blue-600" : "text-gray-500"}>{safeMetrics.confidence.toFixed(0)}%</strong></span>
            </div>
            
            {bestModel && (
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-gray-500" />
                <span>• Ensemble approach: <strong className="text-purple-600">Multiple model combination</strong></span>
              </div>
            )}
            
            {forecastType === 'stock' && selectedProduct && selectedProduct !== 'all' && (
              <div className="flex items-center gap-2">
                <Target className="w-3 h-3 text-gray-500" />
                <span>• Selected product: <strong className="text-green-600">{selectedProduct}</strong></span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span>• Generated: <strong>{formatDateSimple(lastUpdated || new Date())}</strong></span>
            </div>
          </div>
        </div>

        {/* Model Performance Indicators - Always show with real or 0 values */}
        <div className="p-3 rounded-lg border bg-white/60">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${accuracy?.bg} ${accuracy?.color}`}>
                <CheckCircle className="w-3 h-3" />
                {accuracy?.level}
              </div>
              <p className="text-xs text-gray-600 mt-1">Accuracy</p>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${safeMetrics.confidence > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                <Target className="w-3 h-3" />
                {safeMetrics.confidence.toFixed(0)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">Confidence</p>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${safeMetrics.r_squared > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                <Brain className="w-3 h-3" />
                {safeMetrics.r_squared.toFixed(3)}
              </div>
              <p className="text-xs text-gray-600 mt-1">R² Score</p>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${dataQuality?.color} bg-gray-50`}>
                <CheckCircle className="w-3 h-3" />
                {dataQuality?.level}
              </div>
              <p className="text-xs text-gray-600 mt-1">Data Quality</p>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div>
          <h4 className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-purple-600" />
            💡 Recommendations
          </h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-white/60 border border-gray-100">
                <div className="flex items-center gap-2 mt-0.5">
                  {getPriorityIcon(rec.priority)}
                  <rec.icon className="w-3 h-3 text-gray-500" />
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">• {rec.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="pt-3 border-t border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Brain className="w-3 h-3" />
              <span>Next model update recommended: <strong>{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong></span>
            </div>
            
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
              {forecastType === 'sales' ? 'Sales Intelligence' : 'Inventory Intelligence'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}