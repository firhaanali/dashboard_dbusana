import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Calendar, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DateRange, formatDateRange } from '../utils/dateRangeUtils';

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
}

export function DateRangeSelector({ 
  dateRange, 
  onDateRangeChange, 
  className = '',
  disabled = false 
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get latest available date (should come from API in real implementation)
  const getLatestDataDate = () => {
    return new Date(); // Fallback to current date
  };

  // Predefined ranges based on available data
  const predefinedRanges = [
    {
      label: "Last 7 days",
      getValue: () => {
        const latestDate = getLatestDataDate();
        return {
          from: new Date(latestDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: latestDate
        };
      }
    },
    {
      label: "Last 30 days",
      getValue: () => {
        const latestDate = getLatestDataDate();
        return {
          from: new Date(latestDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          to: latestDate
        };
      }
    },
    {
      label: "Last 90 days",
      getValue: () => {
        const latestDate = getLatestDataDate();
        return {
          from: new Date(latestDate.getTime() - 90 * 24 * 60 * 60 * 1000),
          to: latestDate
        };
      }
    },
    {
      label: "This month",
      getValue: () => {
        const latestDate = getLatestDataDate();
        const firstDayMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
        return {
          from: firstDayMonth,
          to: latestDate
        };
      }
    },
    {
      label: "Previous month",
      getValue: () => {
        const latestDate = getLatestDataDate();
        const firstDayLastMonth = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
        return {
          from: firstDayLastMonth,
          to: lastDayLastMonth
        };
      }
    }
  ];

  const handleRangeSelect = (range: DateRange) => {
    onDateRangeChange(range);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between text-left font-normal min-w-[300px] ${className}`}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDateRange(dateRange.from, dateRange.to)}</span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900 mb-3">Pilih Rentang Tanggal</h4>
              {predefinedRanges.map((range, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm h-8"
                  onClick={() => handleRangeSelect(range.getValue())}
                >
                  {range.label}
                </Button>
              ))}
              <div className="pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRangeSelect({ from: undefined, to: undefined })}
                >
                  Reset ke Default
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}