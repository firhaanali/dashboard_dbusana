import React, { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Card, CardContent } from './ui/card';
import { CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './ui/utils';

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

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface SalesAnalyticsDateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
  latestDataDate?: Date;
}

// Simple Calendar Component styled exactly like the image
interface SimpleCalendarProps {
  selected?: DateRange;
  onSelect: (range: DateRange) => void;
  disabled?: (date: Date) => boolean;
  numberOfMonths?: number;
}

function SimpleCalendar({ selected, onSelect, disabled, numberOfMonths = 2 }: SimpleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selected?.from) return selected.from;
    return new Date();
  });

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleDateClick = (date: Date) => {
    if (disabled && disabled(date)) return;

    if (!selected?.from || (selected.from && selected.to)) {
      // Start new range
      onSelect({ from: date, to: undefined });
    } else if (selected.from && !selected.to) {
      // Complete range
      if (date >= selected.from) {
        onSelect({ from: selected.from, to: date });
      } else {
        onSelect({ from: date, to: selected.from });
      }
    }
  };

  const isDateSelected = (date: Date) => {
    if (selected?.from && selected?.to) {
      return date >= selected.from && date <= selected.to;
    } else if (selected?.from) {
      return date.toDateString() === selected.from.toDateString();
    }
    return false;
  };

  const isRangeStart = (date: Date) => {
    return selected?.from && date.toDateString() === selected.from.toDateString();
  };

  const isRangeEnd = (date: Date) => {
    return selected?.to && date.toDateString() === selected.to.toDateString();
  };

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderMonth = (monthOffset: number = 0) => {
    const displayMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
    const days = getDaysInMonth(displayMonth);

    return (
      <div className="flex flex-col gap-4 min-w-[280px]">
        {/* Month Header */}
        <div className="flex justify-center pt-1 relative items-center">
          {monthOffset === 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-1 size-7 p-0 hover:bg-accent"
                onClick={previousMonth}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-[295px] size-7 p-0 hover:bg-accent"
                onClick={nextMonth}
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
          <div className="text-sm font-medium text-foreground">
            {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
          </div>
        </div>

        {/* Days Grid */}
        <div className="w-full">
          {/* Header Row */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div
                key={day}
                className="text-muted-foreground text-xs font-medium flex items-center justify-center h-8"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, dayIndex) => (
              <div
                key={dayIndex}
                className="relative flex items-center justify-center h-8"
              >
                {date && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "size-8 p-0 text-sm font-normal hover:bg-accent",
                      isDateSelected(date) && "bg-primary text-primary-foreground hover:bg-primary",
                      date.toDateString() === new Date().toDateString() && !isDateSelected(date) && "bg-accent",
                      disabled && disabled(date) && "text-muted-foreground opacity-50 pointer-events-none"
                    )}
                    onClick={() => handleDateClick(date)}
                    disabled={disabled && disabled(date)}
                  >
                    {date.getDate()}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex gap-8">
        {Array.from({ length: numberOfMonths }, (_, i) => (
          <div key={i}>
            {renderMonth(i)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SalesAnalyticsDateRangePicker({ 
  dateRange, 
  onDateRangeChange, 
  className,
  disabled = false,
  latestDataDate
}: SalesAnalyticsDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(dateRange);
  const [viewMode, setViewMode] = useState<'calendar' | 'month'>('calendar');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleApply = () => {
    onDateRangeChange(tempRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange(dateRange);
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

  // Get latest available date from the system (defaulting to today if none available)
  const getLatestDataDate = () => {
    return latestDataDate || new Date();
  };

  const getMonthName = (monthIndex: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthIndex];
  };

  const handleMonthSelect = (monthIndex: number) => {
    const firstDay = new Date(selectedYear, monthIndex, 1);
    const lastDay = new Date(selectedYear, monthIndex + 1, 0);
    setTempRange({
      from: firstDay,
      to: lastDay
    });
  };

  // Predefined ranges based on available data - exact same as in the image
  const getPredefinedRanges = () => {
    const latestDate = getLatestDataDate();
    return [
      {
        label: "All Data",
        value: {
          from: undefined,
          to: undefined
        }
      },
      {
        label: "7 Hari Terakhir",
        value: {
          from: new Date(latestDate.getTime() - 6 * 24 * 60 * 60 * 1000),
          to: latestDate
        }
      },
      {
        label: "30 Hari Terakhir",
        value: {
          from: new Date(latestDate.getTime() - 29 * 24 * 60 * 60 * 1000),
          to: latestDate
        }
      },
      {
        label: "90 Hari Terakhir", 
        value: {
          from: new Date(latestDate.getTime() - 89 * 24 * 60 * 60 * 1000),
          to: latestDate
        }
      },
      {
        label: "Bulan Ini",
        value: {
          from: new Date(latestDate.getFullYear(), latestDate.getMonth(), 1),
          to: latestDate
        }
      },
      {
        label: "Bulan Lalu",
        value: (() => {
          const firstDayLastMonth = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
          return {
            from: firstDayLastMonth,
            to: lastDayLastMonth
          };
        })()
      },
      {
        label: "3 Bulan Terakhir",
        value: {
          from: new Date(latestDate.getFullYear(), latestDate.getMonth() - 2, 1),
          to: latestDate
        }
      }
    ];
  };

  const predefinedRanges = getPredefinedRanges();

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
        <Card className="border shadow-lg">
          <CardContent className="p-0">
            <div className="flex bg-background">
              {/* Predefined Ranges Sidebar - Dark background as in image */}
              <div className="w-48 bg-muted/30 border-r border-border p-3 space-y-1">
                <div className="text-sm font-medium text-foreground mb-3">Pilihan Cepat</div>
                {predefinedRanges.map((range, index) => {
                  const isSelected = (!tempRange?.from && !tempRange?.to && range.label === "All Data") ||
                    (tempRange?.from && tempRange?.to && range.value.from && range.value.to &&
                     tempRange.from.toDateString() === range.value.from.toDateString() &&
                     tempRange.to.toDateString() === range.value.to.toDateString());
                  
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-xs h-8 px-3 rounded-sm",
                        isSelected && "bg-primary/10 text-primary font-medium"
                      )}
                      onClick={() => setTempRange(range.value)}
                    >
                      {range.label}
                    </Button>
                  );
                })}
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20 rounded-sm"
                    onClick={() => setTempRange({ from: undefined, to: undefined })}
                  >
                    <X className="mr-2 h-3 w-3" />
                    Reset to All Data
                  </Button>
                </div>
              </div>

              {/* Calendar/Month Picker */}
              <div className="bg-background">
                {/* View Mode Toggle - styled like in the image */}
                <div className="flex items-center justify-center p-4 pb-2 border-b border-border">
                  <div className="flex gap-0 bg-muted rounded-md p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('calendar')}
                      className={cn(
                        "text-xs h-7 px-4 rounded-sm transition-all",
                        viewMode === 'calendar' 
                          ? "bg-background text-foreground shadow-sm font-medium" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Kalender
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('month')}
                      className={cn(
                        "text-xs h-7 px-4 rounded-sm transition-all",
                        viewMode === 'month' 
                          ? "bg-background text-foreground shadow-sm font-medium" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Bulan
                    </Button>
                  </div>
                </div>

                {/* Calendar View */}
                {viewMode === 'calendar' && (
                  <SimpleCalendar
                    selected={tempRange}
                    onSelect={(range) => setTempRange(range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                    disabled={(date) => date > getLatestDataDate()}
                  />
                )}

                {/* Month View */}
                {viewMode === 'month' && (
                  <div className="p-4 space-y-4">
                    {/* Year Selector */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedYear(prev => prev - 1)}
                        disabled={selectedYear <= new Date().getFullYear() - 3}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="font-medium text-lg">{selectedYear}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedYear(prev => prev + 1)}
                        disabled={selectedYear >= new Date().getFullYear()}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 gap-2 min-w-[400px]">
                      {Array.from({ length: 12 }, (_, i) => {
                        const isCurrentMonth = selectedYear === new Date().getFullYear() && i === new Date().getMonth();
                        const isSelectedMonth = tempRange?.from && 
                          tempRange.from.getFullYear() === selectedYear && 
                          tempRange.from.getMonth() === i &&
                          tempRange?.to &&
                          tempRange.to.getFullYear() === selectedYear && 
                          tempRange.to.getMonth() === i;
                        
                        return (
                          <Button
                            key={i}
                            variant={isSelectedMonth ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                              "h-10 text-xs font-medium",
                              isCurrentMonth && !isSelectedMonth && "ring-2 ring-blue-500 ring-offset-2"
                            )}
                            onClick={() => handleMonthSelect(i)}
                          >
                            {getMonthName(i)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between p-4 pt-2 border-t border-border">
                  <div className="text-sm">
                    {tempRange?.from && tempRange?.to ? (
                      <span className="text-muted-foreground">
                        {Math.ceil((tempRange.to.getTime() - tempRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} hari dipilih
                      </span>
                    ) : !tempRange?.from && !tempRange?.to ? (
                      <span className="text-blue-600 font-medium">All Data dipilih</span>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="px-4"
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApply}
                      className="px-4"
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