import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Card, CardContent } from './ui/card';
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from './ui/utils';

interface MonthYearOnlyPickerProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  className?: string;
  disabled?: boolean;
}

export function MonthYearOnlyPicker({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  className,
  disabled = false
}: MonthYearOnlyPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);

  // Sync temp values with props when they change
  useEffect(() => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
  }, [selectedMonth, selectedYear]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 3; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  };

  const handleApply = () => {
    onMonthChange(tempMonth);
    onYearChange(tempYear);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setIsOpen(false);
  };

  const formatSelectedPeriod = () => {
    if (selectedMonth === 0 && selectedYear === 0) {
      return 'All Data';
    }
    return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
  };

  const handleMonthSelect = (monthIndex: number) => {
    setTempMonth(monthIndex + 1); // monthIndex is 0-based, we need 1-based
    // If selecting a month from All Data mode, automatically set current year
    if (tempYear === 0) {
      setTempYear(new Date().getFullYear());
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-w-[180px]",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatSelectedPeriod()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Card>
          <CardContent className="p-3">
            <div className="space-y-4">
              {/* All Data Option */}
              <div className="pb-2 border-b border-border">
                <Button
                  variant={tempMonth === 0 && tempYear === 0 ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start text-xs h-8 px-2"
                  onClick={() => {
                    setTempMonth(0);
                    setTempYear(0);
                  }}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  All Data
                </Button>
              </div>

              {/* Year Selector - always show */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newYear = Math.max((tempYear || new Date().getFullYear()) - 1, new Date().getFullYear() - 3);
                    setTempYear(newYear);
                    // If user is changing year from All Data mode, set to current month
                    if (tempMonth === 0) {
                      setTempMonth(new Date().getMonth() + 1);
                    }
                  }}
                  disabled={(tempYear || new Date().getFullYear()) <= new Date().getFullYear() - 3}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-medium text-lg">{tempYear || new Date().getFullYear()}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newYear = Math.min((tempYear || new Date().getFullYear()) + 1, new Date().getFullYear());
                    setTempYear(newYear);
                    // If user is changing year from All Data mode, set to current month
                    if (tempMonth === 0) {
                      setTempMonth(new Date().getMonth() + 1);
                    }
                  }}
                  disabled={(tempYear || new Date().getFullYear()) >= new Date().getFullYear()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Month Grid - always show */}
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const displayYear = tempYear || new Date().getFullYear();
                  const isCurrentMonth = displayYear === new Date().getFullYear() && i === new Date().getMonth();
                  const isSelectedMonth = tempMonth === i + 1;
                  
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
                      {monthNames[i]}
                    </Button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {tempMonth === 0 && tempYear === 0 
                    ? 'All Data dipilih' 
                    : `${monthNames[(tempMonth || new Date().getMonth() + 1) - 1]} ${tempYear || new Date().getFullYear()} dipilih`
                  }
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
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}