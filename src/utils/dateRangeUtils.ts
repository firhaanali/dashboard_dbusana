export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DateRangeData {
  currentPeriod: DateRange;
  previousPeriod: DateRange;
  label: string;
}

/**
 * Filter data by date range similar to KPI dashboard implementation
 * @param data Array of data items
 * @param dateRange Date range to filter by
 * @param dateField Field name that contains the date
 * @returns Filtered data array
 */
export function filterDataByDateRange<T extends Record<string, any>>(
  data: T[], 
  dateRange: DateRange, 
  dateField: string = 'delivered_time'
): T[] {
  // If "All Data" is selected (both from and to are undefined)
  if (!dateRange.from && !dateRange.to) {
    return data;
  }

  // If no date range is specified, return all data
  if (!dateRange.from || !dateRange.to) {
    return data;
  }

  const startDate = new Date(dateRange.from);
  const endDate = new Date(dateRange.to);
  
  // Set time to start of day for startDate and end of day for endDate
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return data.filter((item) => {
    const itemDateStr = item[dateField] || item.created_time;
    if (!itemDateStr) return false;

    const itemDate = new Date(itemDateStr);
    if (isNaN(itemDate.getTime())) return false;

    return itemDate >= startDate && itemDate <= endDate;
  });
}

/**
 * Format date range for display (from DateRange object)
 * @param dateRange Date range object
 * @returns Formatted string
 */
export function formatDateRangeObject(dateRange: DateRange): string {
  if (!dateRange.from && !dateRange.to) {
    return "All Data";
  }
  
  if (!dateRange.from) {
    return "Pilih rentang tanggal";
  }
  
  if (!dateRange.to) {
    return dateRange.from.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }
  
  return `${dateRange.from.toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })} - ${dateRange.to.toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })}`;
}

/**
 * Get latest date from data array
 * @param data Array of data items
 * @param dateField Field name that contains the date
 * @returns Latest date or current date if no data
 */
export function getLatestDateFromData<T extends Record<string, any>>(
  data: T[], 
  dateField: string = 'delivered_time'
): Date {
  if (!data.length) return new Date();
  
  const dates = data
    .map(item => new Date(item[dateField] || item.created_time))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());
  
  return dates.length > 0 ? dates[0] : new Date();
}

/**
 * Calculate trend percentage between two values
 * @param current Current value
 * @param previous Previous value
 * @returns Percentage change
 */
export function calculateTrendPercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get trend information with color and direction
 * @param percentage Trend percentage
 * @returns Object with trend info
 */
export function getTrendInfo(percentage: number): {
  isPositive: boolean;
  color: string;
  direction: string;
  icon: string;
} {
  const isPositive = percentage >= 0;
  return {
    isPositive,
    color: isPositive ? 'text-green-600' : 'text-red-600',
    direction: isPositive ? 'up' : 'down',
    icon: isPositive ? '↗' : '↘'
  };
}

/**
 * Create chart data from date range and data array
 * @param dateRange Date range object
 * @param data Array of data items
 * @param dateField Field name that contains the date
 * @param valueField Field name that contains the value
 * @returns Processed data array for charts
 */
export function createChartDataFromRange<T extends Record<string, any>>(
  dateRange: DateRange,
  data: T[],
  dateField: string = 'delivered_time',
  valueField: string = 'total_revenue'
): Array<{ date: string; value: number; count: number }> {
  // Filter data by date range first
  const filteredData = filterDataByDateRange(data, dateRange, dateField);
  
  if (!filteredData.length) return [];

  // Group data by date
  const dailyData = new Map<string, { value: number; count: number }>();
  
  filteredData.forEach(item => {
    const itemDateStr = item[dateField] || item.created_time;
    if (!itemDateStr) return;

    const itemDate = new Date(itemDateStr);
    if (isNaN(itemDate.getTime())) return;

    const dateKey = itemDate.toISOString().split('T')[0];
    const value = Number(item[valueField]) || 0;
    
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, { value: 0, count: 0 });
    }
    
    const dayData = dailyData.get(dateKey)!;
    dayData.value += value;
    dayData.count += 1;
  });

  // Convert to array and sort by date
  return Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date,
      value: data.value,
      count: data.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Format date for display in Indonesian locale
 * @param date Date object or string
 * @param format Format type
 * @returns Formatted date string
 */
export function formatDateDisplay(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const options: Intl.DateTimeFormatOptions = format === 'short' 
    ? { day: '2-digit', month: 'short' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
    
  return dateObj.toLocaleDateString('id-ID', options);
}

/**
 * Get date range label for display
 * @param dateRange Date range object
 * @returns Human-readable label
 */
export function getDateRangeLabel(dateRange: DateRange): string {
  if (!dateRange.from && !dateRange.to) {
    return "All Data";
  }
  
  if (!dateRange.from || !dateRange.to) {
    return "Custom Range";
  }
  
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Check for common ranges
  if (dateRange.from.toDateString() === today.toDateString() && 
      dateRange.to.toDateString() === today.toDateString()) {
    return "Today";
  }
  
  if (dateRange.from.toDateString() === yesterday.toDateString() && 
      dateRange.to.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  if (Math.abs(dateRange.from.getTime() - weekAgo.getTime()) < 24 * 60 * 60 * 1000 &&
      dateRange.to.toDateString() === today.toDateString()) {
    return "Last 7 Days";
  }
  
  if (Math.abs(dateRange.from.getTime() - monthAgo.getTime()) < 24 * 60 * 60 * 1000 &&
      dateRange.to.toDateString() === today.toDateString()) {
    return "Last 30 Days";
  }
  
  // Default to formatted range
  return formatDateRange(dateRange);
}

/**
 * Get last 30 days date range from data
 * @param data Array of data items
 * @param dateField Field name that contains the date
 * @returns DateRange for last 30 days
 */
export function getLast30DaysFromData<T extends Record<string, any>>(
  data: T[],
  dateField: string = 'delivered_time'
): DateRange {
  const latestDate = getLatestDateFromData(data, dateField);
  const thirtyDaysAgo = new Date(latestDate.getTime() - 29 * 24 * 60 * 60 * 1000);
  
  return {
    from: thirtyDaysAgo,
    to: latestDate
  };
}

/**
 * Format date range for display (simple version)
 * @param from Start date
 * @param to End date
 * @returns Formatted string
 */
export function formatDateRange(from: Date, to: Date): string {
  const fromStr = from.toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  const toStr = to.toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  
  return `${fromStr} - ${toStr}`;
}

/**
 * Create date range data with previous period for comparison (MainDashboard function)
 * @param dateRange Current date range
 * @returns DateRangeData with current and previous periods
 */
export function createDateRangeData(dateRange: DateRange): DateRangeData | null {
  if (!dateRange.from || !dateRange.to) {
    return null;
  }
  
  const rangeDuration = dateRange.to.getTime() - dateRange.from.getTime();
  
  // Calculate previous period
  const previousPeriod: DateRange = {
    from: new Date(dateRange.from.getTime() - rangeDuration),
    to: new Date(dateRange.from.getTime() - 1) // End just before current period
  };
  
  // Generate label
  const today = new Date();
  const isToday = dateRange.to.toDateString() === today.toDateString();
  const daysDiff = Math.ceil(rangeDuration / (1000 * 60 * 60 * 24)) + 1;
  
  let label: string;
  
  if (daysDiff === 1) {
    if (isToday) {
      label = 'Hari Ini vs Kemarin';
    } else {
      label = `${dateRange.from.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} vs Hari Sebelumnya`;
    }
  } else if (daysDiff === 7) {
    label = isToday ? '7 Hari Terakhir vs 7 Hari Sebelumnya' : `${daysDiff} Hari vs Periode Sebelumnya`;
  } else if (daysDiff === 30) {
    label = isToday ? '30 Hari Terakhir vs 30 Hari Sebelumnya' : `${daysDiff} Hari vs Periode Sebelumnya`;
  } else {
    label = `${daysDiff} Hari vs Periode Sebelumnya`;
  }
  
  return {
    currentPeriod: dateRange,
    previousPeriod,
    label
  };
}