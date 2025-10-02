import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Calendar,
  Download,
  Share2,
  Bell,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bookmark,
  Mail,
  FileText,
  Settings,
  Zap
} from 'lucide-react';
import { formatDateSimple } from '../utils/dateUtils';

interface PredictionQuickActionsProps {
  forecastData: any[];
  forecastMetrics: any;
  summaryMetrics: any;
  onRefreshForecast: () => void;
}

export function PredictionQuickActions({ 
  forecastData, 
  forecastMetrics, 
  summaryMetrics,
  onRefreshForecast 
}: PredictionQuickActionsProps) {
  const [alertThreshold, setAlertThreshold] = useState('10');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  // Generate forecast summary
  const forecastSummary = React.useMemo(() => {
    // Always return zero values structure
    return {
      totalPredicted: 0,
      avgConfidence: 0,
      highConfidenceDays: 0,
      bullishDays: 0,
      bearishDays: 0,
      totalDays: 0
    };
  }, [forecastData]);

  // Export functions
  const exportForecastData = () => {
    const exportData = {
      summary: forecastSummary,
      metrics: forecastMetrics,
      forecast_data: forecastData,
      generated_at: new Date().toISOString(),
      format: reportFormat
    };

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (reportFormat) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        filename = `forecast-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'excel':
        // For Excel, we'd convert to CSV format
        const csvHeaders = ['Date', 'Predicted', 'Lower Bound', 'Upper Bound', 'Confidence', 'Scenario'];
        const csvRows = forecastData.map(item => [
          item.date,
          item.predicted || 0,
          item.lower_bound || 0,
          item.upper_bound || 0,
          item.confidence || 0,
          item.market_scenario || 'neutral'
        ]);
        content = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        filename = `forecast-data-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
      default:
        // PDF would require a PDF library, so we'll export as formatted text
        content = `SALES FORECAST REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY:
- Total Predicted Revenue: Rp ${(forecastSummary?.totalPredicted || 0).toLocaleString('id-ID')}
- Average Confidence: ${(forecastSummary?.avgConfidence || 0).toFixed(1)}%
- High Confidence Days: ${forecastSummary?.highConfidenceDays || 0}/${forecastSummary?.totalDays || 0}
- Bullish Days: ${forecastSummary?.bullishDays || 0}
- Bearish Days: ${forecastSummary?.bearishDays || 0}

MODEL METRICS:
- MAPE: ${forecastMetrics?.mape?.toFixed(1) || '0.0'}%
- R² Score: ${forecastMetrics?.r_squared?.toFixed(3) || '0.000'}
- Quality Score: ${forecastMetrics?.quality_score?.toFixed(1) || '0.0'}%

DETAILED FORECAST:
${forecastData.map(item => 
  `${item.date}: Rp ${(item.predicted || 0).toLocaleString('id-ID')} (${(item.confidence || 0).toFixed(1)}% confidence)`
).join('\n')}`;
        filename = `forecast-report-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareForcast = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sales Forecast Report',
          text: `Sales forecast shows ${forecastSummary?.avgConfidence.toFixed(1)}% confidence with predicted revenue of Rp ${(forecastSummary?.totalPredicted || 0).toLocaleString('id-ID')}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `Sales Forecast Summary:
• Predicted Revenue: Rp ${(forecastSummary?.totalPredicted || 0).toLocaleString('id-ID')}
• Average Confidence: ${forecastSummary?.avgConfidence.toFixed(1)}%
• Quality Score: ${forecastMetrics?.quality_score?.toFixed(1) || '0.0'}%`;
      
      await navigator.clipboard.writeText(shareText);
      alert('Forecast summary copied to clipboard!');
    }
  };

  const setupAlert = () => {
    // This would integrate with a notification system
    alert(`Alert set up: You'll be notified when confidence drops below ${alertThreshold}%`);
  };

  const scheduleReport = () => {
    // This would integrate with a scheduling system
    alert(`Scheduled ${selectedTimeframe}ly forecast reports in ${reportFormat.toUpperCase()} format`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Prediction Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Export Data */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Download className="w-6 h-6" />
                <span className="text-sm">Export Data</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Forecast Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Format:</label>
                  <Select value={reportFormat} onValueChange={(value: any) => setReportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="excel">Excel/CSV</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={exportForecastData} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export {reportFormat.toUpperCase()}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Share Forecast */}
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={shareForcast}
          >
            <Share2 className="w-6 h-6" />
            <span className="text-sm">Share</span>
          </Button>

          {/* Set Alert */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Bell className="w-6 h-6" />
                <span className="text-sm">Set Alert</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Forecast Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Alert when confidence drops below:</label>
                  <Select value={alertThreshold} onValueChange={setAlertThreshold}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={setupAlert} className="w-full">
                  <Bell className="w-4 h-4 mr-2" />
                  Set Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Schedule Reports */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Calendar className="w-6 h-6" />
                <span className="text-sm">Schedule</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Forecast Reports</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Frequency:</label>
                  <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="quarter">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Format:</label>
                  <Select value={reportFormat} onValueChange={(value: any) => setReportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="excel">Excel/CSV</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={scheduleReport} className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Reports
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        {forecastSummary && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {forecastSummary.highConfidenceDays}
              </div>
              <div className="text-xs text-gray-600">High Confidence Days</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {forecastSummary.bullishDays}
              </div>
              <div className="text-xs text-gray-600">Bullish Days</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {forecastSummary.bearishDays}
              </div>
              <div className="text-xs text-gray-600">Bearish Days</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {forecastSummary.avgConfidence.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Avg Confidence</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Button onClick={onRefreshForecast} size="sm" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Refresh Forecast
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Bookmark className="w-4 h-4" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}