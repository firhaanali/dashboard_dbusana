import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  BarChart3, 
  Database, 
  Eye,
  EyeOff,
  Settings,
  Sparkles,
  Grid,
  List,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { BusinessAnalyticsComprehensive } from './BusinessAnalyticsComprehensive';
import { PerformanceMetrics } from './PerformanceMetrics';
import { ROIAnalysis } from './ROIAnalysis';
import { MarketplaceBreakdown } from './MarketplaceBreakdown';

interface AnalyticsViewToggleProps {
  dashboardKey: number;
}

export function AnalyticsViewToggle({ dashboardKey }: AnalyticsViewToggleProps) {
  const [viewMode, setViewMode] = useState<'comprehensive' | 'traditional'>('comprehensive');
  const [showAllSections, setShowAllSections] = useState(true);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'comprehensive' ? 'traditional' : 'comprehensive');
  };

  const toggleAllSections = () => {
    setShowAllSections(prev => !prev);
  };

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <Card className="border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Business Analytics</h3>
              </div>
              
              <Badge variant="secondary" className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                All Data Mode
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <Button
                  variant={viewMode === 'comprehensive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleViewMode}
                  className="flex items-center gap-2"
                >
                  {viewMode === 'comprehensive' ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Comprehensive
                    </>
                  ) : (
                    <>
                      <Grid className="w-4 h-4" />
                      Traditional
                    </>
                  )}
                </Button>
              </div>

              {/* Section Visibility Toggle */}
              {viewMode === 'traditional' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllSections}
                    className="flex items-center gap-2"
                  >
                    {showAllSections ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide Some
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show All
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            {viewMode === 'comprehensive' ? (
              <p className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Comprehensive analytics dengan detailed insights, geographic analysis, customer segmentation, dan product performance
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-blue-600" />
                Traditional analytics view dengan performance metrics, ROI analysis, dan marketplace breakdown
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Content Based on View Mode */}
      {viewMode === 'comprehensive' ? (
        <BusinessAnalyticsComprehensive key={`comprehensive-${dashboardKey}`} showAllData={true} />
      ) : (
        <div className="space-y-6">
          {/* Performance Metrics - Always Show */}
          <PerformanceMetrics key={`performance-${dashboardKey}`} />
          
          {/* ROI Analysis - Conditional */}
          {showAllSections && (
            <ROIAnalysis key={`roi-${dashboardKey}`} />
          )}

          {/* Marketplace Breakdown - Conditional */}
          {showAllSections && (
            <MarketplaceBreakdown key={`breakdown-${dashboardKey}`} />
          )}

          {/* Info Card for Traditional Mode */}
          {!showAllSections && (
            <Card className="border-dashed border-blue-300 bg-blue-50">
              <CardContent className="p-4 text-center">
                <Settings className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-blue-700 mb-2">
                  Some analytics sections are hidden. Click "Show All" to view complete analysis.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleAllSections}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Eye className="w-4 h-4" />
                  Show All Sections
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Analytics Mode Info */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">
                Analytics Mode: {viewMode === 'comprehensive' ? 'All Data Comprehensive Analysis' : 'Traditional Dashboard View'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-500">
              <span>Switch anytime</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleViewMode}
                className="h-6 w-6 p-0"
              >
                {viewMode === 'comprehensive' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}