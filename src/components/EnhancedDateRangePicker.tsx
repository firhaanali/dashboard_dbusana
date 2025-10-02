import React, { useState, useMemo } from 'react';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Card, CardContent } from './ui/card';
import { CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import { DateRange } from '../utils/dateRangeUtils';

// Using native Date formatting instead of date-fns to avoid additional dependencies
const format = (date: Date, formatStr: string) => {
  if (formatStr === 'dd MMM yyyy') {
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }
  if (formatStr === 'dd-MM-yyyy') {
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).replace(/\//g, '-');
  }
  return date.toLocaleDateString('id-ID');
};

interface EnhancedDateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
  latestDataDate?: Date;
}

type ViewMode = 'day' | 'week' | 'month' | 'custom';

export function EnhancedDateRangePicker({ 
  dateRange, 
  onDateRangeChange, 
  className,
  disabled = false,
  latestDataDate
}: EnhancedDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(dateRange);
  const [viewMode, setViewMode] = useState<ViewMode>('custom');
  const [currentMonthYear, setCurrentMonthYear] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  // Get latest available date from the system (defaulting to today if none available)
  const getLatestDataDate = () => {
    return latestDataDate || new Date();
  };

  const handleApply = () => {
    onDateRangeChange(tempRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange(dateRange);
    setIsOpen(false);
  };

  const handleClear = () => {
    const clearedRange = { from: undefined, to: undefined };
    setTempRange(clearedRange);
    onDateRangeChange(clearedRange);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    // Check if this is "All Data" selection - when both from and to are undefined
    if (!dateRange.from && !dateRange.to) {
      return "All Data";
    }
    if (!dateRange.from) {
      return "Pilih rentang tanggal";
    }
    if (!dateRange.to) {
      return format(dateRange.from, "dd MMM yyyy");
    }
    return `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`;
  };

  // Handle view mode changes
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const latestDate = getLatestDataDate();
    let newRange: DateRange = { from: undefined, to: undefined };

    switch (mode) {
      case 'day':
        // Today
        newRange = {
          from: latestDate,
          to: latestDate
        };
        break;
      case 'week':
        // Last 7 days
        newRange = {
          from: new Date(latestDate.getTime() - 6 * 24 * 60 * 60 * 1000),
          to: latestDate
        };
        break;
      case 'month':
        // Current month
        newRange = {
          from: new Date(latestDate.getFullYear(), latestDate.getMonth(), 1),
          to: latestDate
        };
        break;
      case 'custom':
        // Keep current selection or clear
        break;
    }

    if (mode !== 'custom') {
      setTempRange(newRange);
    }
  };

  // Month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonthYear(prev => {
      const newMonth = direction === 'next' ? prev.month + 1 : prev.month - 1;
      const newYear = newMonth > 11 ? prev.year + 1 : newMonth < 0 ? prev.year - 1 : prev.year;
      const adjustedMonth = newMonth > 11 ? 0 : newMonth < 0 ? 11 : newMonth;
      
      return { month: adjustedMonth, year: newYear };
    });
  };

  // Get current month display
  const getCurrentMonthDisplay = () => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${currentMonthYear.year}-${String(currentMonthYear.month + 1).padStart(2, '0')}`;
  };

  // Get next month display
  const getNextMonthDisplay = () => {
    const nextMonth = currentMonthYear.month === 11 ? 0 : currentMonthYear.month + 1;
    const nextYear = currentMonthYear.month === 11 ? currentMonthYear.year + 1 : currentMonthYear.year;
    return `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`;
  };

  // Predefined ranges for quick selection
  const predefinedRanges = [
    {
      label: "All Data",
      value: { from: undefined, to: undefined }
    },
    {
      label: "Hari Ini",
      value: {
        from: getLatestDataDate(),
        to: getLatestDataDate()
      }
    },
    {
      label: "7 Hari Terakhir", 
      value: {
        from: new Date(getLatestDataDate().getTime() - 6 * 24 * 60 * 60 * 1000),
        to: getLatestDataDate()
      }
    },
    {
      label: "30 Hari Terakhir",
      value: {
        from: new Date(getLatestDataDate().getTime() - 29 * 24 * 60 * 60 * 1000),
        to: getLatestDataDate()
      }
    },
    {
      label: "Bulan Ini",
      value: {
        from: new Date(getLatestDataDate().getFullYear(), getLatestDataDate().getMonth(), 1),
        to: getLatestDataDate()
      }
    },
    {
      label: "Bulan Lalu",
      value: (() => {
        const latestDate = getLatestDataDate();
        const firstDayLastMonth = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
        return {
          from: firstDayLastMonth,
          to: lastDayLastMonth
        };
      })()
    }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-w-[280px]",
            (!dateRange.from && dateRange.from !== undefined) && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Card>
          <CardContent className="p-0">
            <div className="flex">
              {/* Predefined Ranges Sidebar */}
              <div className="w-52 border-r border-border p-3 space-y-1">
                <div className="text-sm font-medium text-gray-900 mb-2">Pilihan Cepat</div>
                {predefinedRanges.map((range, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8 px-2"
                    onClick={() => setTempRange(range.value)}
                  >
                    {range.label}
                  </Button>
                ))}
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setTempRange({ from: undefined, to: undefined })}
                  >
                    <X className="mr-2 h-3 w-3" />
                    Reset to All Data
                  </Button>
                </div>
              </div>

              {/* Main Calendar Section */}
              <div className="p-3">
                {/* View Mode Tabs */}
                <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg">
                  {[
                    { key: 'day', label: 'Day' },
                    { key: 'week', label: 'Minggu' }, 
                    { key: 'month', label: 'Bulan' },
                    { key: 'custom', label: 'Kustom' }
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={viewMode === key ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "flex-1 text-xs h-7",
                        viewMode === key 
                          ? "bg-white shadow-sm" 
                          : "bg-transparent text-gray-600 hover:bg-white/50"
                      )}
                      onClick={() => handleViewModeChange(key as ViewMode)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm" 
                    onClick={() => navigateMonth('prev')}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex gap-8">
                    <div className="text-sm font-medium text-center min-w-[80px]">
                      {getCurrentMonthDisplay()}
                    </div>
                    <div className="text-sm font-medium text-center min-w-[80px]">
                      {getNextMonthDisplay()}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Dual Month Calendar */}
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={new Date(currentMonthYear.year, currentMonthYear.month)}
                  selected={tempRange}
                  onSelect={(range) => {
                    setTempRange(range || { from: undefined, to: undefined });
                    if (viewMode !== 'custom') {
                      setViewMode('custom');
                    }
                  }}
                  numberOfMonths={2}
                  disabled={(date) => date > getLatestDataDate()}
                  showOutsideDays={false}
                />
                
                {/* Selection Info and Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                  <div className="text-sm text-gray-600">
                    {tempRange?.from && tempRange?.to ? (
                      <>
                        {Math.ceil((tempRange.to.getTime() - tempRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} hari dipilih
                      </>
                    ) : !tempRange?.from && !tempRange?.to ? (
                      <span className="text-blue-600 font-medium">All Data dipilih</span>
                    ) : tempRange?.from ? (
                      <span className="text-orange-600 font-medium">Pilih tanggal akhir</span>
                    ) : null}
                    
                    {viewMode !== 'custom' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {viewMode === 'day' ? 'Hari' : viewMode === 'week' ? 'Minggu' : 'Bulan'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApply}
                    >
                      Terapkan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}