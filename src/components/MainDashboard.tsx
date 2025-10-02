import React, { useState, useEffect } from 'react';
import { KPICards } from './KPICards';
import { MarketplaceKPICards } from './MarketplaceKPICards';
import { QuickActions } from './QuickActions';
import { RecentActivities } from './RecentActivities';
import { PerformanceMetrics } from './PerformanceMetrics';
import { ROIAnalysis } from './ROIAnalysis';
import { NetProfitSummaryCard } from './NetProfitSummaryCard';
import { MarketplaceBreakdown } from './MarketplaceBreakdown';
import { getLast30DaysFromData, DateRange, DateRangeData, formatDateRange, createDateRangeData } from '../utils/dateRangeUtils';
export function MainDashboard() {
  const [dashboardKey, setDashboardKey] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [dateRangeData, setDateRangeData] = useState<DateRangeData | null>(null);

  // Initialize with "All Data" as default
  useEffect(() => {
    // For All Data, we don't need specific date ranges
    console.log('🔄 MainDashboard initialized with All Data as default');
  }, []);

  const handleDateRangeChange = (newRange: DateRange) => {
    console.log('🔄 MainDashboard - Date range changed:', {
      from: newRange.from?.toLocaleDateString('id-ID'),
      to: newRange.to?.toLocaleDateString('id-ID'),
      isAllData: !newRange.from && !newRange.to
    });
    
    setDateRange(newRange);
    
    // Check if this is "All Data" selection (both from and to are undefined)
    if (!newRange.from && !newRange.to) {
      // Clear dateRangeData for "All Data" selection
      setDateRangeData(null);
      console.log('📊 MainDashboard - All Data selected, cleared dateRangeData');
    } else {
      // Create new dateRangeData with previous period for trend calculation
      const newDateRangeData = createDateRangeData(newRange);
      if (newDateRangeData) {
        setDateRangeData(newDateRangeData);
        console.log('📊 MainDashboard - New dateRangeData created:', {
          currentLabel: newDateRangeData.label,
          currentPeriod: {
            from: newDateRangeData.currentPeriod.from?.toLocaleDateString('id-ID'),
            to: newDateRangeData.currentPeriod.to?.toLocaleDateString('id-ID')
          },
          previousPeriod: {
            from: newDateRangeData.previousPeriod.from?.toLocaleDateString('id-ID'),
            to: newDateRangeData.previousPeriod.to?.toLocaleDateString('id-ID')
          }
        });
      } else {
        // If createDateRangeData fails, clear dateRangeData
        setDateRangeData(null);
        console.log('📊 MainDashboard - Failed to create dateRangeData, cleared it');
      }
    }
    
    setDashboardKey(prev => prev + 1); // Trigger data refresh
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2">D'Busana Dashboard 👋</h2>
            <p className="text-blue-100 dark:text-blue-200">
              {dateRangeData?.label ? 
                `Periode Data: ${dateRangeData.label}` :
                dateRange.from && dateRange.to ? 
                  `Menampilkan data ${formatDateRange(dateRange.from, dateRange.to)}` :
                  'Menampilkan seluruh data - Monitor semua aspek bisnis fashion Anda'
              }
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Multi Marketplace</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Real Data Period</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div>
              {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
            </div>
            <div className="text-blue-100 dark:text-blue-200">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Primary KPI Row */}
        <KPICards 
          key={`kpi-${dashboardKey}`} 
          dateRange={dateRange}
          dateRangeData={dateRangeData}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Marketplace Analytics Row */}
        <MarketplaceKPICards key={`marketplace-${dashboardKey}`} />

        {/* Net Profit Analysis */}
        <NetProfitSummaryCard 
          key={`profit-${dashboardKey}`}
        />

        {/* Business Analytics Section */}
        <div className="space-y-6">
          
          {/* Performance Metrics - Full Width */}
          <PerformanceMetrics key={`performance-${dashboardKey}`} />
          
          {/* ROI Analysis - Full Width */}
          <ROIAnalysis key={`roi-${dashboardKey}`} />

          {/* Marketplace Breakdown - Full Width */}
          <MarketplaceBreakdown key={`breakdown-${dashboardKey}`} />
        </div>

        {/* Stock Management & Inventory Section */}
        <div className="space-y-4">
          <h2 className="text-gray-900 dark:text-gray-100">Stock Management & Inventory Tracking</h2>
          
          {/* Quick Actions & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
            <div className="h-full">
              <QuickActions />
            </div>
            <div className="h-full">
              <RecentActivities key={`activities-${dashboardKey}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}