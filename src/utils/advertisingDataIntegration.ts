// Advertising Data Integration Utilities
// Ensures real database integration without mock data

import { makeApiRequest, withRetry } from './apiUtils';

export interface AdvertisingDataResponse {
  id: string;
  campaign_name: string;
  ad_creative_type?: string;
  ad_creative?: string;
  account_name?: string;
  cost: number;
  conversions: number;
  cpa?: number;
  revenue: number;
  roi?: number;
  impressions: number;
  clicks: number;
  ctr?: number;
  conversion_rate?: number;
  date_start: string;
  date_end: string;
  marketplace?: string;
  created_at: string;
  updated_at: string;
}

export interface AdvertisingAnalyticsResponse {
  overview: {
    totalCampaigns: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalCost: number;
    totalRevenue: number;
    netProfit: number;
    overallCTR: number;
    overallConversionRate: number;
    overallROI: number;
    profitMargin: number;
    averageCPA: number;
  };
  campaignPerformance: Array<{
    campaign_name: string;
    account_name?: string;
    _sum: {
      impressions: number;
      clicks: number;
      conversions: number;
      cost: number;
      revenue: number;
    };
    _avg: {
      ctr: number;
      conversion_rate: number;
      roi: number;
    };
  }>;
  accountPerformance: Array<{
    account_name: string;
    _sum: {
      impressions: number;
      clicks: number;
      conversions: number;
      cost: number;
      revenue: number;
    };
    _avg: {
      ctr: number;
      conversion_rate: number;
      roi: number;
    };
  }>;
}

export interface AdvertisingTimeSeriesResponse {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
  roi: number;
  profit: number;
  campaigns: number;
}

// Fetch real advertising data from PostgreSQL database
export const fetchAdvertisingData = async (params: URLSearchParams): Promise<{
  data: AdvertisingDataResponse[];
  analytics: AdvertisingAnalyticsResponse;
  timeSeries: AdvertisingTimeSeriesResponse[];
}> => {
  console.log('📊 Fetching real advertising data from PostgreSQL database...');
  
  try {
    // Parallel requests for better performance
    const [dataResult, analyticsResult, timeSeriesResult] = await Promise.all([
      withRetry(() => makeApiRequest<AdvertisingDataResponse[]>(`/advertising?${params}`)),
      withRetry(() => makeApiRequest<AdvertisingAnalyticsResponse>(`/advertising/analytics?${params}`)),
      withRetry(() => makeApiRequest<AdvertisingTimeSeriesResponse[]>(`/advertising/timeseries?${params}&groupBy=day`))
    ]);

    // Validate responses
    if (!dataResult.success || !analyticsResult.success || !timeSeriesResult.success) {
      throw new Error(
        dataResult.error || analyticsResult.error || timeSeriesResult.error || 
        'Failed to fetch advertising data from database'
      );
    }

    if (!dataResult.data || !analyticsResult.data || !timeSeriesResult.data) {
      throw new Error('Invalid response format from advertising API');
    }

    console.log('✅ Real advertising data loaded from database:', {
      totalRecords: dataResult.data.length,
      totalCampaigns: analyticsResult.data.overview?.totalCampaigns || 0,
      timeSeriesPoints: timeSeriesResult.data.length
    });

    return {
      data: dataResult.data,
      analytics: analyticsResult.data,
      timeSeries: timeSeriesResult.data
    };

  } catch (error) {
    console.error('❌ Error fetching real advertising data:', error);
    throw error;
  }
};

// Validate that data is from database and not mock
export const validateRealData = (data: AdvertisingDataResponse[]): boolean => {
  if (!data || data.length === 0) {
    console.log('📊 No advertising data found in database');
    return true; // Empty database is valid
  }

  // Check if data has database characteristics
  const hasRealIds = data.every(item => item.id && item.id.length > 10);
  const hasTimestamps = data.every(item => item.created_at && item.updated_at);
  const hasVariedData = data.some(item => item.cost > 0 && item.revenue > 0);

  const isRealData = hasRealIds && hasTimestamps && hasVariedData;
  
  console.log('🔍 Data validation:', {
    hasRealIds,
    hasTimestamps,
    hasVariedData,
    isRealData,
    sampleRecord: data[0]
  });

  return isRealData;
};

// Build query parameters for filtering
export const buildAdvertisingParams = (filters: {
  marketplace?: string;
  account?: string;
  dateRange?: { from: Date | null; to: Date | null };
}): URLSearchParams => {
  const params = new URLSearchParams();
  
  if (filters.marketplace && filters.marketplace !== 'all') {
    params.append('marketplace', filters.marketplace);
  }
  
  if (filters.account && filters.account !== 'all') {
    params.append('account_name', filters.account);
  }
  
  if (filters.dateRange?.from) {
    params.append('date_start', filters.dateRange.from.toISOString());
  }
  
  if (filters.dateRange?.to) {
    params.append('date_end', filters.dateRange.to.toISOString());
  }

  console.log('🔧 Built advertising query params:', params.toString());
  return params;
};

// Format advertising metrics for display
export const formatAdvertisingMetrics = (analytics: AdvertisingAnalyticsResponse) => {
  const { overview } = analytics;
  
  return {
    totalCampaigns: overview.totalCampaigns || 0,
    totalImpressions: overview.totalImpressions || 0,
    totalClicks: overview.totalClicks || 0,
    totalConversions: overview.totalConversions || 0,
    totalCost: overview.totalCost || 0,
    totalRevenue: overview.totalRevenue || 0,
    netProfit: overview.netProfit || 0,
    overallCTR: overview.overallCTR || 0,
    overallConversionRate: overview.overallConversionRate || 0,
    overallROI: overview.overallROI || 0,
    profitMargin: overview.profitMargin || 0,
    averageCPA: overview.averageCPA || 0
  };
};

// Check if advertising data is available
export const checkAdvertisingDataAvailability = async (): Promise<{
  available: boolean;
  recordCount: number;
  message: string;
}> => {
  try {
    const result = await makeApiRequest<AdvertisingDataResponse[]>('/advertising?limit=1');
    
    if (result.success && result.data) {
      return {
        available: true,
        recordCount: result.data.length,
        message: 'Advertising data is available in database'
      };
    } else {
      return {
        available: false,
        recordCount: 0,
        message: result.error || 'No advertising data found in database'
      };
    }
  } catch (error) {
    return {
      available: false,
      recordCount: 0,
      message: `Database connection error: ${error}`
    };
  }
};

export default {
  fetchAdvertisingData,
  validateRealData,
  buildAdvertisingParams,
  formatAdvertisingMetrics,
  checkAdvertisingDataAvailability
};